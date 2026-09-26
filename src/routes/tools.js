/**
 * T4 Stretch Controller: Developer Tools, Cryptographic Certificates,
 * Embeddable Widgets, and Bulk Data Backup.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');

const HMAC_SECRET = process.env.HMAC_SECRET || 'verity-dogfood-2026-signing-secret-key';

/**
 * Generate a deterministic HMAC signature for a certificate payload
 */
function signCertificate(payload) {
    const serialized = `${payload.id}|${payload.userId}|${payload.role}|${payload.eventId}|${payload.issuedAt}`;
    return crypto.createHmac('sha256', HMAC_SECRET).update(serialized).digest('hex');
}

// GET /api/certificates/:userId — Generate cryptographically signed certificate
router.get('/api/certificates/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const event = db.prepare(`SELECT * FROM events LIMIT 1`).get();
        const certId = `crt_${crypto.createHash('md5').update(`${userId}_${event.id}`).digest('hex').slice(0, 12)}`;
        const issuedAt = new Date().toISOString();

        let details = {};
        if (user.role === 'judge') {
            const scoreCount = db.prepare(`SELECT COUNT(*) as count FROM scores WHERE judge_id = ?`).get(user.id).count;
            const tracks = db.prepare(`
                SELECT DISTINCT t.name FROM judge_assignments ja
                JOIN tracks t ON ja.track_id = t.id
                WHERE ja.judge_id = ?
            `).all(user.id).map(r => r.name);

            details = {
                honorific: 'Verified Hackathon Adjudicator',
                evaluationsCompleted: scoreCount,
                assignedTracks: tracks.length > 0 ? tracks : ['General Track']
            };
        } else if (user.role === 'participant') {
            const project = db.prepare(`
                SELECT p.title, t.name as team_name, tr.name as track_name
                FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                LEFT JOIN projects p ON p.team_id = t.id
                LEFT JOIN tracks tr ON p.track_id = tr.id
                WHERE tm.user_id = ?
            `).get(user.id);

            details = {
                honorific: 'Official Competition Contender',
                teamName: project?.team_name || 'Independent',
                projectTitle: project?.title || 'Registered Entry',
                track: project?.track_name || 'General Track'
            };
        } else {
            details = {
                honorific: 'Hackathon Operator & Administrator'
            };
        }

        const payload = {
            id: certId,
            userId: user.id,
            recipientName: user.name,
            recipientEmail: user.email,
            role: user.role,
            eventId: event.id,
            eventName: event.name,
            issuedAt,
            details
        };

        const signature = signCertificate(payload);

        res.json({
            ...payload,
            signature,
            verificationUrl: `/api/certificates/verify?id=${certId}`
        });

    } catch (err) {
        console.error('[tools/certificates] Error:', err.message);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
});

// POST /api/certificates/verify — Verify signature of a certificate
router.post('/api/certificates/verify', (req, res) => {
    try {
        const { id, userId, role, eventId, issuedAt, signature } = req.body;

        if (!id || !userId || !signature) {
            return res.status(400).json({ valid: false, error: 'Missing certificate fields' });
        }

        // Verify user exists in event DB
        const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
        if (!user) {
            return res.json({ valid: false, error: 'Referenced user not found in verification registry' });
        }

        // Compute expected signature
        const expectedSignature = signCertificate({ id, userId, role, eventId, issuedAt });

        if (signature === expectedSignature) {
            return res.json({
                valid: true,
                message: 'Cryptographic signature verified against Verity Root Authority',
                certId: id,
                issuedTo: user.name,
                role: user.role,
                timestamp: issuedAt
            });
        } else {
            return res.json({
                valid: false,
                error: 'Signature verification mismatch: payload has been tampered with'
            });
        }

    } catch (err) {
        console.error('[tools/verify] Error:', err.message);
        res.status(500).json({ valid: false, error: 'Verification error' });
    }
});

// GET /api/backup/export — Comprehensive JSON archive
router.get('/api/backup/export', (req, res) => {
    try {
        const event = db.prepare(`SELECT * FROM events LIMIT 1`).get();
        const tracks = db.prepare(`SELECT * FROM tracks`).all();
        const rubric = db.prepare(`SELECT * FROM rubric_criteria`).all();
        const projects = db.prepare(`SELECT * FROM projects`).all();
        const scores = db.prepare(`SELECT * FROM scores`).all();
        const scoreCriteria = db.prepare(`SELECT * FROM score_criteria`).all();
        const judges = db.prepare(`SELECT id, name, email, role FROM users WHERE role = 'judge'`).all();

        const archive = {
            metadata: {
                engine: 'Verity Hackathon System v1.0.0',
                exportedAt: new Date().toISOString(),
                format: 'RFC-JSON-SNAPSHOT',
                event: event
            },
            data: {
                tracks,
                rubric,
                judges,
                projects,
                scores,
                scoreCriteria
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="verity-snapshot-${event.id}.json"`);
        res.status(200).send(JSON.stringify(archive, null, 2));

    } catch (err) {
        console.error('[tools/backup] Error:', err.message);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
});

// GET /embed/gallery — Standalone lightweight iframe-embeddable gallery
router.get('/embed/gallery', (req, res) => {
    const { track, limit = 8 } = req.query;
    let sql = `
        SELECT p.id, p.title, p.summary, p.repo_url, t.name as track_name, tm.name as team_name
        FROM projects p
        JOIN tracks t ON p.track_id = t.id
        JOIN teams tm ON p.team_id = tm.id
        WHERE p.status = 'submitted'
    `;
    const params = [];
    if (track) {
        sql += ` AND p.track_id = ?`;
        params.push(track);
    }
    sql += ` ORDER BY p.submitted_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    try {
        const projects = db.prepare(sql).all(...params);
        const tracks = db.prepare(`SELECT id, name FROM tracks ORDER BY name`).all();

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verity Embeddable Gallery Widget</title>
    <style>
        :root {
            --bg-void: #0B1020;
            --surface-base: #0E1428;
            --brand-cyan: #00E5D0;
            --text-primary: #E6ECFF;
            --text-muted: #6B7A9E;
            --border-default: #1B2540;
            --font-mono: 'JetBrains Mono', monospace, sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg-void);
            color: var(--text-primary);
            font-family: var(--font-mono);
            font-size: 12px;
            padding: 16px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-default);
            padding-bottom: 10px;
            margin-bottom: 16px;
        }
        .brand { font-weight: 800; font-size: 14px; letter-spacing: 0.1em; color: var(--text-primary); }
        .brand span { color: var(--brand-cyan); }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
        }
        .card {
            background: var(--surface-base);
            border: 1px solid var(--border-default);
            padding: 12px;
            border-radius: 2px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 140px;
        }
        .tag { font-size: 10px; color: var(--brand-cyan); text-transform: uppercase; margin-bottom: 6px; }
        .title { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
        .summary { font-size: 11px; color: #AEBAD6; line-height: 1.4; flex-grow: 1; }
        .footer { margin-top: 10px; border-top: 1px solid #16203A; padding-top: 6px; display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); }
        a { color: var(--brand-cyan); text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">VERITY <span>// WIDGET</span></div>
        <div class="tag">[ ${projects.length} PROJECTS DISPLAYED ]</div>
    </div>
    <div class="grid">
        ${projects.map(p => `
            <div class="card">
                <div>
                    <div class="tag">[ ${p.track_name.toUpperCase()} ]</div>
                    <div class="title">${p.title}</div>
                    <div class="summary">${p.summary || 'Verified submission'}</div>
                </div>
                <div class="footer">
                    <span>${p.team_name}</span>
                    ${p.repo_url ? `<a href="${p.repo_url}" target="_blank">[ REPO ↗ ]</a>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
        `);
    } catch (err) {
        res.status(500).send('Widget render error');
    }
});

module.exports = router;
