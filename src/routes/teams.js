/**
 * Teams Controller
 * Team creation and joining via invite link.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { logAudit } = require('../audit/logger');

// POST /api/teams - Create a new team
router.post('/api/teams', (req, res) => {
    if (!req.user || req.user.role === 'visitor') {
        return res.status(401).json({ error: 'Unauthorized: Must be a logged-in user' });
    }

    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Team name is required' });
    }

    try {
        const event = db.prepare(`SELECT * FROM events LIMIT 1`).get();
        if (!event) {
            return res.status(400).json({ error: 'No active event found' });
        }

        // Check if user is already in a team
        const existingMembership = db.prepare(`SELECT team_id FROM team_members WHERE user_id = ?`).get(req.user.id);
        if (existingMembership) {
            return res.status(400).json({ error: 'You are already in a team' });
        }

        const teamId = `tm_${crypto.randomBytes(4).toString('hex')}`;
        const inviteCode = crypto.randomBytes(8).toString('hex');
        const now = new Date().toISOString();

        db.transaction(() => {
            // Create team
            db.prepare(`
                INSERT INTO teams (id, event_id, name, invite_code, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).run(teamId, event.id, name, inviteCode, now);

            // Add user as lead
            db.prepare(`
                INSERT INTO team_members (team_id, user_id, is_lead, joined_at)
                VALUES (?, ?, 1, ?)
            `).run(teamId, req.user.id, now);
            
            // Promote user to participant if they were just a visitor/registered
            if (req.user.role !== 'participant') {
                db.prepare(`UPDATE users SET role = 'participant' WHERE id = ?`).run(req.user.id);
            }
        })();

        logAudit(db, {
            actorId: req.user.id,
            action: 'TEAM_CREATE',
            entityType: 'teams',
            entityId: teamId,
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'Team created', teamId, inviteCode });
    } catch (err) {
        console.error('[teams] Error creating team:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/teams/join - Join a team via invite code
router.post('/api/teams/join', (req, res) => {
    if (!req.user || req.user.role === 'visitor') {
        return res.status(401).json({ error: 'Unauthorized: Must be a logged-in user' });
    }

    const { inviteCode } = req.body;
    if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required' });
    }

    try {
        const team = db.prepare(`SELECT * FROM teams WHERE invite_code = ?`).get(inviteCode);
        if (!team) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        // Check if already in this team
        const existingMembership = db.prepare(`SELECT team_id FROM team_members WHERE user_id = ?`).get(req.user.id);
        if (existingMembership) {
            if (existingMembership.team_id === team.id) {
                return res.json({ message: 'Already a member of this team', teamId: team.id });
            } else {
                return res.status(400).json({ error: 'You are already in a different team' });
            }
        }

        const now = new Date().toISOString();

        db.transaction(() => {
            db.prepare(`
                INSERT INTO team_members (team_id, user_id, is_lead, joined_at)
                VALUES (?, ?, 0, ?)
            `).run(team.id, req.user.id, now);

            // Promote to participant
            if (req.user.role !== 'participant') {
                db.prepare(`UPDATE users SET role = 'participant' WHERE id = ?`).run(req.user.id);
            }
        })();

        logAudit(db, {
            actorId: req.user.id,
            action: 'TEAM_JOIN',
            entityType: 'teams',
            entityId: team.id,
            ipAddress: req.ip
        });

        res.json({ message: 'Joined team successfully', teamId: team.id });
    } catch (err) {
        console.error('[teams] Error joining team:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
