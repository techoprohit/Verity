/**
 * Events Controller
 * Event creation and configuration (dates, tracks, prizes).
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { logAudit } = require('../audit/logger');

// Middleware to ensure user is organizer/admin
function requireOrganizer(req, res, next) {
    if (!req.user || (req.user.role !== 'organizer' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Forbidden: Requires organizer role' });
    }
    next();
}

// POST /api/events - Create a new event
router.post('/api/events', requireOrganizer, (req, res) => {
    const { name, submissions_close } = req.body;
    
    if (!name || !submissions_close) {
        return res.status(400).json({ error: 'Event name and submissions_close are required' });
    }

    try {
        // Prevent creating multiple events if one already exists
        const existingEvent = db.prepare(`SELECT id FROM events LIMIT 1`).get();
        if (existingEvent) {
            return res.status(400).json({ error: 'An event already exists on this instance' });
        }

        const eventId = `evt_${crypto.randomBytes(4).toString('hex')}`;
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO events (id, name, submissions_close, status, created_at)
            VALUES (?, ?, ?, 'open', ?)
        `).run(eventId, name, submissions_close, now);

        logAudit(db, {
            actorId: req.user.id,
            action: 'EVENT_CREATE',
            entityType: 'events',
            entityId: eventId,
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'Event created', eventId });
    } catch (err) {
        console.error('[events] Error creating event:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/tracks - Create a track
router.post('/api/tracks', requireOrganizer, (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Track name is required' });
    }

    try {
        const event = db.prepare(`SELECT id FROM events LIMIT 1`).get();
        if (!event) return res.status(400).json({ error: 'No active event found' });

        const trackId = `trk_${crypto.randomBytes(4).toString('hex')}`;
        
        db.prepare(`
            INSERT INTO tracks (id, event_id, name, description)
            VALUES (?, ?, ?, ?)
        `).run(trackId, event.id, name, description || null);

        logAudit(db, {
            actorId: req.user.id,
            action: 'TRACK_CREATE',
            entityType: 'tracks',
            entityId: trackId,
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'Track created', trackId });
    } catch (err) {
        console.error('[events] Error creating track:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/prizes - Create a prize
router.post('/api/prizes', requireOrganizer, (req, res) => {
    const { name, amount, track_id } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Prize name is required' });
    }

    try {
        const event = db.prepare(`SELECT id FROM events LIMIT 1`).get();
        if (!event) return res.status(400).json({ error: 'No active event found' });

        if (track_id) {
            const track = db.prepare(`SELECT id FROM tracks WHERE id = ?`).get(track_id);
            if (!track) return res.status(404).json({ error: 'Track not found' });
        }

        const prizeId = `prz_${crypto.randomBytes(4).toString('hex')}`;
        
        db.prepare(`
            INSERT INTO prizes (id, event_id, track_id, name, amount)
            VALUES (?, ?, ?, ?, ?)
        `).run(prizeId, event.id, track_id || null, name, amount || null);

        res.status(201).json({ message: 'Prize created', prizeId });
    } catch (err) {
        console.error('[events] Error creating prize:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
