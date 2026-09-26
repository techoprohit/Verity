/**
 * Organizer Controller
 * Dashboard progress, CSV export, and normalization results.
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { computeWeightedScore, normalizeScores } = require('../engine/normalize');

/**
 * Authorization guard: organizer or admin only.
 */
function requireOrganizer(req, res, next) {
    if (!req.user || (req.user.role !== 'organizer' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Forbidden: Requires organizer role' });
    }
    next();
}

// GET /api/export.csv — CSV export of project rankings
router.get('/api/export.csv', requireOrganizer, (req, res) => {
    try {
        // Fetch all scores with criteria
        const allScoreRows = db.prepare(`
            SELECT s.id AS score_id, s.judge_id, s.project_id,
                   sc.criterion_id, sc.score_value, rc.key, rc.weight
            FROM scores s
            JOIN score_criteria sc ON s.id = sc.score_id
            JOIN rubric_criteria rc ON sc.criterion_id = rc.id
        `).all();

        // Group by score_id to compute weighted composites
        const scoresByScorecardId = {};
        for (const row of allScoreRows) {
            if (!scoresByScorecardId[row.score_id]) {
                scoresByScorecardId[row.score_id] = {
                    judgeId: row.judge_id,
                    projectId: row.project_id,
                    criteria: {},
                    weights: {}
                };
            }
            scoresByScorecardId[row.score_id].criteria[row.key] = row.score_value;
            scoresByScorecardId[row.score_id].weights[row.key] = row.weight;
        }

        // Compute weighted composites for each scorecard
        const composites = Object.values(scoresByScorecardId).map(card => ({
            judgeId: card.judgeId,
            projectId: card.projectId,
            rawComposite: computeWeightedScore(card.criteria, card.weights)
        }));

        // Run normalization pipeline
        const results = normalizeScores(composites);

        // Enrich with project metadata
        const projects = db.prepare(`
            SELECT p.id, p.title, p.status, t.name AS track_name, tm.name AS team_name
            FROM projects p
            JOIN tracks t ON p.track_id = t.id
            JOIN teams tm ON p.team_id = tm.id
        `).all();

        const projectMap = {};
        for (const p of projects) {
            projectMap[p.id] = p;
        }

        // Build CSV
        const header = 'project_id,title,team_name,track,review_count,raw_average,normalized_score,status';
        const rows = results.map(r => {
            const p = projectMap[r.projectId] || {};
            const title = (p.title || '').replace(/"/g, '""');
            const team = (p.team_name || '').replace(/"/g, '""');
            const track = (p.track_name || '').replace(/"/g, '""');
            return `${r.projectId},"${title}","${team}","${track}",${r.reviewCount},${r.rawAverage},${r.normalizedScore},${p.status || 'unknown'}`;
        });

        const csv = [header, ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
        res.status(200).send(csv);
    } catch (err) {
        console.error('[organizer] CSV export error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard — Organizer progress dashboard data
router.get('/api/dashboard', requireOrganizer, (req, res) => {
    try {
        const totalProjects = db.prepare(`SELECT COUNT(*) as count FROM projects WHERE status = 'submitted'`).get().count;
        const totalJudges = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'judge'`).get().count;
        const totalScores = db.prepare(`SELECT COUNT(*) as count FROM scores`).get().count;

        // Per-judge progress
        const judgeProgress = db.prepare(`
            SELECT u.id, u.name,
                   (SELECT COUNT(*) FROM scores s WHERE s.judge_id = u.id) AS completed,
                   (SELECT COUNT(*) FROM judge_assignments ja
                    JOIN projects p ON p.track_id = ja.track_id
                    WHERE ja.judge_id = u.id AND p.status = 'submitted') AS assigned
            FROM users u
            WHERE u.role = 'judge'
            ORDER BY u.name
        `).all();

        res.json({
            totalProjects,
            totalJudges,
            totalScores,
            completionRate: totalProjects > 0 ? +(totalScores / totalProjects).toFixed(2) : 0,
            judgeProgress
        });
    } catch (err) {
        console.error('[organizer] Dashboard error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
