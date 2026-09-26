/**
 * Audit Logger
 * Append-only ledger for security and administrative operations.
 * Records: score creation, score updates, unauthorized access attempts, status changes.
 */
const crypto = require('crypto');

/**
 * Log an auditable event to the audit_logs table.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {Object} entry
 * @param {string|null} entry.actorId - User performing the action
 * @param {string} entry.action - Operation code (SCORE_CREATE, SCORE_UPDATE, UNAUTHORIZED_PEER_PROBE, STATUS_CHANGE)
 * @param {string} entry.entityType - Target table name
 * @param {string|null} entry.entityId - Target primary key
 * @param {Object|null} entry.payloadDiff - Previous/new attribute diff
 * @param {string|null} entry.ipAddress - Client IP
 */
function logAudit(db, { actorId, action, entityType, entityId, payloadDiff, ipAddress }) {
    const id = `aud_${crypto.randomBytes(6).toString('hex')}`;
    const diffJson = payloadDiff ? JSON.stringify(payloadDiff) : null;

    db.prepare(`
        INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, payload_diff, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, actorId || null, action, entityType, entityId || null, diffJson, ipAddress || null);
}

module.exports = { logAudit };
