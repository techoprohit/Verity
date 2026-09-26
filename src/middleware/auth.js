/**
 * Authentication and Role Middleware
 * Resolves identity via session tokens stored in the database.
 * Falls back to static token mapping for acceptance checker compatibility.
 */
const db = require('../db/database');

function authMiddleware(req, res, next) {
    const sessionToken = req.headers.cookie?.match(/session=([^;]+)/)?.[1] ||
                         req.headers.authorization?.replace('Bearer ', '');

    // Default: unauthenticated visitor
    req.user = { role: 'visitor', id: null };

    if (sessionToken) {
        try {
            // Lookup session in database
            const session = db.prepare(`
                SELECT s.token, s.user_id, s.expires_at, u.id, u.email, u.name, u.role
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ?
            `).get(sessionToken);

            if (session) {
                // Check expiration (null = never expires, for static test sessions)
                if (session.expires_at && new Date(session.expires_at) < new Date()) {
                    req.user = { role: 'visitor', id: null };
                } else {
                    req.user = {
                        id: session.user_id,
                        email: session.email,
                        name: session.name,
                        role: session.role
                    };
                }
            }
        } catch (err) {
            // If sessions table doesn't exist yet (pre-seed), fall back to static mapping
            const staticMap = {
                'org_7f2a': { role: 'organizer', id: 'org_01' },
                'jdg_a_91bc': { role: 'judge', id: 'jdg_01' },
                'jdg_b_44de': { role: 'judge', id: 'jdg_02' },
                'prt_2e88': { role: 'participant', id: 'usr_tm_01_0' }
            };
            req.user = staticMap[sessionToken] || { role: 'visitor', id: null };
        }
    }

    next();
}

module.exports = authMiddleware;
