/**
 * Auth Controller
 * Interactive login/logout and session creation.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { logAudit } = require('../audit/logger');

// POST /api/auth/login - Create a session
router.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
        const now = new Date().toISOString();

        if (!user) {
            // Auto-register as visitor for testing purposes
            const userId = `usr_${crypto.randomBytes(4).toString('hex')}`;
            db.prepare(`
                INSERT INTO users (id, email, name, role, created_at)
                VALUES (?, ?, ?, 'visitor', ?)
            `).run(userId, email, email.split('@')[0], now);
            
            user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
        }

        const token = crypto.randomBytes(16).toString('hex');
        
        db.prepare(`
            INSERT INTO sessions (token, user_id, created_at)
            VALUES (?, ?, ?)
        `).run(token, user.id, now);

        res.cookie('session', token, { httpOnly: true });
        res.json({ message: 'Logged in', user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
        console.error('[auth] Error logging in:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout - Destroy session
router.post('/api/auth/logout', (req, res) => {
    const sessionToken = req.headers.cookie?.match(/session=([^;]+)/)?.[1] ||
                         req.headers.authorization?.replace('Bearer ', '');
                         
    if (sessionToken) {
        try {
            db.prepare(`DELETE FROM sessions WHERE token = ?`).run(sessionToken);
        } catch (err) {
            console.error('[auth] Error destroying session:', err.message);
        }
    }

    res.clearCookie('session');
    res.json({ message: 'Logged out' });
});

module.exports = router;
