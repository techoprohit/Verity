/**
 * Auth Controller
 * Interactive login/logout and session creation.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { logAudit } = require('../audit/logger');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash) return false;
    const [salt, key] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return key === hash;
}

// POST /api/auth/register
router.post('/api/auth/register', (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    try {
        const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email is already registered' });
        }

        const userId = `usr_${crypto.randomBytes(4).toString('hex')}`;
        const hashed = hashPassword(password);
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO users (id, email, name, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, 'participant', ?)
        `).run(userId, email, name, hashed, now);

        const token = crypto.randomBytes(16).toString('hex');
        db.prepare(`
            INSERT INTO sessions (token, user_id, created_at)
            VALUES (?, ?, ?)
        `).run(token, userId, now);

        res.cookie('session', token, { httpOnly: true });
        res.json({ message: 'Registered successfully', user: { id: userId, name, role: 'participant' } });
    } catch (err) {
        console.error('[auth] Error registering:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
        
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = crypto.randomBytes(16).toString('hex');
        const now = new Date().toISOString();
        
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

// GET /api/auth/me - Get current user session
router.get('/api/auth/me', (req, res) => {
    if (!req.user || req.user.role === 'visitor') {
        return res.json({ user: null });
    }
    res.json({ user: { id: req.user.id, name: req.user.name, role: req.user.role } });
});

module.exports = router;
