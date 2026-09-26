/**
 * Submissions Controller
 * Draft saving, editing, and deadline enforcement.
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { logAudit } = require('../audit/logger');

// POST /projects/new — Submit or update a project
router.post('/projects/new', (req, res) => {
    // Must be a participant
    if (!req.user || req.user.role !== 'participant') {
        return res.status(403).json({ error: 'Forbidden: Requires participant role' });
    }

    // Check deadline: get the event and verify submissions_close
    try {
        const event = db.prepare(`SELECT * FROM events LIMIT 1`).get();
        if (!event) {
            return res.status(400).json({ error: 'No active event found' });
        }

        const now = new Date().toISOString();
        const deadline = event.submissions_close;

        if (now > deadline) {
            return res.status(400).json({
                error: 'Submissions are closed',
                deadline: deadline,
                server_time: now
            });
        }

        // Deadline has not passed — process submission
        const { title, summary, repo_url, demo_url, track_id } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Find the participant's team
        const membership = db.prepare(`
            SELECT tm.team_id FROM team_members tm
            WHERE tm.user_id = ?
        `).get(req.user.id);

        if (!membership) {
            return res.status(400).json({ error: 'You are not a member of any team' });
        }

        const targetStatus = req.body.status === 'draft' ? 'draft' : 'submitted';

        // Check for existing project (update draft)
        const existing = db.prepare(`
            SELECT id FROM projects WHERE team_id = ? AND event_id = ?
        `).get(membership.team_id, event.id);

        if (existing) {
            // Update existing draft
            db.prepare(`
                UPDATE projects SET title = ?, summary = ?, repo_url = ?, demo_url = ?,
                    track_id = COALESCE(?, track_id), status = ?,
                    submitted_at = COALESCE(submitted_at, ?), updated_at = ?
                WHERE id = ?
            `).run(title, summary || '', repo_url || '', demo_url || '', track_id, targetStatus, now, now, existing.id);

            logAudit(db, {
                actorId: req.user.id,
                action: 'PROJECT_UPDATE',
                entityType: 'projects',
                entityId: existing.id,
                ipAddress: req.ip
            });

            return res.json({ message: 'Project updated', projectId: existing.id });
        }

        // Create new submission
        const crypto = require('crypto');
        const projectId = `prj_${crypto.randomBytes(4).toString('hex')}`;

        db.prepare(`
            INSERT INTO projects (id, event_id, team_id, track_id, title, summary, repo_url, demo_url, status, submitted_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(projectId, event.id, membership.team_id, track_id || 'trk_01', title, summary || '', repo_url || '', demo_url || '', targetStatus, now, now);

        logAudit(db, {
            actorId: req.user.id,
            action: 'PROJECT_CREATE',
            entityType: 'projects',
            entityId: projectId,
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'Project submitted', projectId });
    } catch (err) {
        console.error('[submissions] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /projects/my-submission — Fetch user's team, project draft, and event deadline
router.get('/projects/my-submission', (req, res) => {
    if (!req.user || req.user.role !== 'participant') {
        return res.status(403).json({ error: 'Forbidden: Requires participant role' });
    }

    try {
        const event = db.prepare(`SELECT * FROM events LIMIT 1`).get();
        if (!event) return res.status(400).json({ error: 'No active event found' });

        const now = new Date().toISOString();
        const isClosed = now > event.submissions_close;

        // Get team and membership
        const teamInfo = db.prepare(`
            SELECT t.id, t.name, t.invite_code 
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = ?
        `).get(req.user.id);

        if (!teamInfo) {
            return res.json({ event, isClosed, hasTeam: false });
        }

        // Get existing project
        const project = db.prepare(`
            SELECT * FROM projects WHERE team_id = ? AND event_id = ?
        `).get(teamInfo.id, event.id);

        // Get tracks
        const tracks = db.prepare(`SELECT id, name FROM tracks ORDER BY name`).all();

        res.json({
            event,
            isClosed,
            hasTeam: true,
            team: teamInfo,
            project: project || null,
            tracks: tracks
        });

    } catch (err) {
        console.error('[submissions get] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
