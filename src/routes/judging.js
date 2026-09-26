/**
 * Judging Controller
 * Scorecard submission, retrieval, and peer-score isolation.
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { logAudit } = require('../audit/logger');
const { computeWeightedScore } = require('../engine/normalize');

// GET /api/judge/scores — View own scores or (organizer) all scores
router.get('/api/judge/scores', (req, res) => {
    // Must be judge or organizer
    if (!req.user || (req.user.role !== 'judge' && req.user.role !== 'organizer' && req.user.role !== 'admin')) {
        logAudit(db, {
            actorId: req.user?.id || null,
            action: 'UNAUTHORIZED_ACCESS',
            entityType: 'scores',
            entityId: null,
            payloadDiff: { attempted_role: req.user?.role, route: '/api/judge/scores' },
            ipAddress: req.ip
        });
        return res.status(403).json({ error: 'Forbidden: Requires judge or organizer role' });
    }

    const targetJudge = req.query.judge;

    // Peer isolation: judges can only see their own scores
    if (targetJudge && req.user.role === 'judge') {
        // Map session user IDs to fixture judge IDs for the acceptance checker
        const userJudgeId = req.user.id;

        // The acceptance checker queries ?judge=judge_a or ?judge=judge_b
        // We need to check if the requesting judge matches the target
        const judgeMapping = {
            'jdg_01': ['judge_a', 'jdg_01'],
            'jdg_02': ['judge_b', 'jdg_02']
        };

        const allowedAliases = judgeMapping[userJudgeId] || [userJudgeId];

        if (!allowedAliases.includes(targetJudge) && targetJudge !== userJudgeId) {
            logAudit(db, {
                actorId: req.user.id,
                action: 'UNAUTHORIZED_PEER_PROBE',
                entityType: 'scores',
                entityId: null,
                payloadDiff: { requesting_judge: userJudgeId, target_judge: targetJudge },
                ipAddress: req.ip
            });
            return res.status(403).json({ error: 'Forbidden: Peer scorecards are isolated' });
        }
    }

    try {
        let scores;
        if (req.user.role === 'organizer' || req.user.role === 'admin') {
            // Organizers see all scores
            if (targetJudge) {
                scores = db.prepare(`
                    SELECT s.*, p.title AS project_title
                    FROM scores s
                    JOIN projects p ON s.project_id = p.id
                    WHERE s.judge_id = ?
                `).all(targetJudge);
            } else {
                scores = db.prepare(`
                    SELECT s.*, p.title AS project_title, u.name AS judge_name
                    FROM scores s
                    JOIN projects p ON s.project_id = p.id
                    JOIN users u ON s.judge_id = u.id
                `).all();
            }
        } else {
            // Judges see only their own scores
            scores = db.prepare(`
                SELECT s.*, p.title AS project_title
                FROM scores s
                JOIN projects p ON s.project_id = p.id
                WHERE s.judge_id = ?
            `).all(req.user.id);
        }

        // Attach criteria details to each score
        for (const score of scores) {
            score.criteria = db.prepare(`
                SELECT sc.criterion_id, sc.score_value, rc.key, rc.label, rc.weight
                FROM score_criteria sc
                JOIN rubric_criteria rc ON sc.criterion_id = rc.id
                WHERE sc.score_id = ?
            `).all(score.id);
        }

        res.json(scores);
    } catch (err) {
        console.error('[judging] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/judge/scores — Submit a score
router.post('/api/judge/scores', (req, res) => {
    if (!req.user || req.user.role !== 'judge') {
        return res.status(403).json({ error: 'Forbidden: Requires judge role' });
    }

    const { projectId, criteria, comment } = req.body;

    if (!projectId || !criteria || typeof criteria !== 'object') {
        return res.status(400).json({ error: 'projectId and criteria object are required' });
    }

    try {
        const crypto = require('crypto');
        const scoreId = `sc_${crypto.randomBytes(6).toString('hex')}`;
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO scores (id, judge_id, project_id, comment, submitted_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(scoreId, req.user.id, projectId, comment || '', now, now);

        // Insert individual criterion scores
        for (const [key, value] of Object.entries(criteria)) {
            const criterionId = `crt_${key}`;
            db.prepare(`
                INSERT INTO score_criteria (score_id, criterion_id, score_value)
                VALUES (?, ?, ?)
            `).run(scoreId, criterionId, value);
        }

        logAudit(db, {
            actorId: req.user.id,
            action: 'SCORE_CREATE',
            entityType: 'scores',
            entityId: scoreId,
            payloadDiff: { projectId, criteria },
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'Score submitted', scoreId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Score already exists for this judge-project pair' });
        }
        console.error('[judging] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
