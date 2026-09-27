/**
 * T4 Stretch Tests
 * Integration tests for the DOGFOOD 2026 Tier 4 (Stretch) capabilities.
 *
 * Covers:
 *   1. Certificate generation (GET /api/certificates/:userId)
 *   2. Certificate verification (POST /api/certificates/verify)
 *   3. Tamper detection (signature mismatch)
 *   4. Bulk backup export (GET /api/backup/export)
 *   5. Embeddable gallery widget (GET /embed/gallery)
 *
 * Requires: server running on localhost:8080 with seeded fixture data.
 * Run with: node tests/t4_stretch.test.js
 */
const {
    TOKENS, request, createRunner,
    assertEqual, assertIncludes, assertTrue,
} = require('./helpers');

const runner = createRunner('T4 Stretch Tests');
const { test } = runner;

async function run() {
    runner.printHeader();

    // -----------------------------------------------------------------------
    // 1. Certificate Generation
    // -----------------------------------------------------------------------

    await test('Cert: GET /api/certificates/jdg_01 returns valid certificate', async () => {
        const res = await request('GET', '/api/certificates/jdg_01');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const cert = JSON.parse(res.body);
        assertTrue(cert.id !== undefined, 'Expected certificate ID');
        assertTrue(cert.userId === 'jdg_01', 'Expected userId=jdg_01');
        assertTrue(cert.signature !== undefined, 'Expected cryptographic signature');
        assertTrue(cert.recipientName !== undefined, 'Expected recipientName');
        assertTrue(cert.role === 'judge', `Expected role=judge, got ${cert.role}`);
        assertTrue(cert.eventId !== undefined, 'Expected eventId');
        assertTrue(cert.issuedAt !== undefined, 'Expected issuedAt timestamp');
    });

    await test('Cert: judge certificate includes evaluation details', async () => {
        const res = await request('GET', '/api/certificates/jdg_01');
        const cert = JSON.parse(res.body);
        assertTrue(cert.details !== undefined, 'Expected details object');
        assertTrue(cert.details.evaluationsCompleted !== undefined, 'Expected evaluationsCompleted count');
    });

    await test('Cert: participant certificate includes project info', async () => {
        // Find a participant user ID from the seeded data
        const meRes = await request('GET', '/api/auth/me', { cookie: TOKENS.participant });
        const me = JSON.parse(meRes.body);
        if (me.user) {
            const res = await request('GET', `/api/certificates/${me.user.id}`);
            assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
            const cert = JSON.parse(res.body);
            assertTrue(cert.details !== undefined, 'Expected details object');
        }
    });

    await test('Cert: nonexistent user returns 404', async () => {
        const res = await request('GET', '/api/certificates/usr_NONEXISTENT_99');
        assertEqual(res.status, 404, `Expected 404, got ${res.status}`);
    });

    await test('Cert: response includes verificationUrl', async () => {
        const res = await request('GET', '/api/certificates/jdg_01');
        const cert = JSON.parse(res.body);
        assertTrue(cert.verificationUrl !== undefined, 'Expected verificationUrl');
        assertIncludes(cert.verificationUrl, '/api/certificates/verify', 'URL should point to verify endpoint');
    });

    // -----------------------------------------------------------------------
    // 2. Certificate Verification
    // -----------------------------------------------------------------------

    await test('Verify: valid certificate signature passes', async () => {
        // Generate a certificate first
        const genRes = await request('GET', '/api/certificates/jdg_01');
        const cert = JSON.parse(genRes.body);

        // Verify it
        const verifyRes = await request('POST', '/api/certificates/verify', {
            body: {
                id: cert.id,
                userId: cert.userId,
                role: cert.role,
                eventId: cert.eventId,
                issuedAt: cert.issuedAt,
                signature: cert.signature,
            },
        });
        assertEqual(verifyRes.status, 200, `Expected 200, got ${verifyRes.status}`);
        const result = JSON.parse(verifyRes.body);
        assertTrue(result.valid === true, 'Expected valid=true for authentic certificate');
    });

    await test('Verify: tampered signature fails', async () => {
        const genRes = await request('GET', '/api/certificates/jdg_01');
        const cert = JSON.parse(genRes.body);

        // Tamper with the signature
        const verifyRes = await request('POST', '/api/certificates/verify', {
            body: {
                id: cert.id,
                userId: cert.userId,
                role: cert.role,
                eventId: cert.eventId,
                issuedAt: cert.issuedAt,
                signature: 'deadbeef0000000000000000000000000000000000000000000000000000abcd',
            },
        });
        const result = JSON.parse(verifyRes.body);
        assertTrue(result.valid === false, 'Expected valid=false for tampered signature');
    });

    await test('Verify: tampered payload (role changed) fails', async () => {
        const genRes = await request('GET', '/api/certificates/jdg_01');
        const cert = JSON.parse(genRes.body);

        // Use real signature but change the role
        const verifyRes = await request('POST', '/api/certificates/verify', {
            body: {
                id: cert.id,
                userId: cert.userId,
                role: 'admin',  // Tampered!
                eventId: cert.eventId,
                issuedAt: cert.issuedAt,
                signature: cert.signature,
            },
        });
        const result = JSON.parse(verifyRes.body);
        assertTrue(result.valid === false, 'Expected valid=false when payload is tampered');
    });

    await test('Verify: missing fields returns 400', async () => {
        const verifyRes = await request('POST', '/api/certificates/verify', {
            body: { id: 'crt_abc' },
        });
        assertEqual(verifyRes.status, 400, `Expected 400, got ${verifyRes.status}`);
    });

    await test('Verify: unknown userId returns valid=false', async () => {
        const verifyRes = await request('POST', '/api/certificates/verify', {
            body: {
                id: 'crt_fake',
                userId: 'usr_DOES_NOT_EXIST',
                role: 'judge',
                eventId: 'evt_01',
                issuedAt: new Date().toISOString(),
                signature: 'fakesig',
            },
        });
        const result = JSON.parse(verifyRes.body);
        assertTrue(result.valid === false, 'Expected valid=false for unknown user');
    });

    // -----------------------------------------------------------------------
    // 3. Bulk Backup Export
    // -----------------------------------------------------------------------

    await test('Backup: GET /api/backup/export returns 200', async () => {
        const res = await request('GET', '/api/backup/export');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Backup: response is valid JSON with metadata and data sections', async () => {
        const res = await request('GET', '/api/backup/export');
        const archive = JSON.parse(res.body);
        assertTrue(archive.metadata !== undefined, 'Expected metadata section');
        assertTrue(archive.data !== undefined, 'Expected data section');
        assertTrue(archive.metadata.engine !== undefined, 'Expected engine field');
        assertTrue(archive.metadata.exportedAt !== undefined, 'Expected exportedAt timestamp');
    });

    await test('Backup: data section contains all entity types', async () => {
        const res = await request('GET', '/api/backup/export');
        const archive = JSON.parse(res.body);
        assertTrue(Array.isArray(archive.data.tracks), 'Expected tracks array');
        assertTrue(Array.isArray(archive.data.projects), 'Expected projects array');
        assertTrue(Array.isArray(archive.data.scores), 'Expected scores array');
        assertTrue(Array.isArray(archive.data.judges), 'Expected judges array');
        assertTrue(Array.isArray(archive.data.rubric), 'Expected rubric array');
    });

    await test('Backup: projects count matches fixture expectation (~40)', async () => {
        const res = await request('GET', '/api/backup/export');
        const archive = JSON.parse(res.body);
        assertTrue(
            archive.data.projects.length >= 30,
            `Expected ≥30 projects, got ${archive.data.projects.length}`
        );
    });

    await test('Backup: Content-Disposition header suggests download', async () => {
        const res = await request('GET', '/api/backup/export');
        assertTrue(
            res.headers['content-disposition'] !== undefined,
            'Expected Content-Disposition header for download'
        );
    });

    // -----------------------------------------------------------------------
    // 4. Embeddable Gallery Widget
    // -----------------------------------------------------------------------

    await test('Widget: GET /embed/gallery returns 200', async () => {
        const res = await request('GET', '/embed/gallery');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Widget: response is standalone HTML document', async () => {
        const res = await request('GET', '/embed/gallery');
        assertIncludes(res.body, '<!DOCTYPE html', 'Expected HTML doctype');
        assertIncludes(res.body, 'Verity', 'Expected Verity branding');
    });

    await test('Widget: contains project cards', async () => {
        const res = await request('GET', '/embed/gallery');
        assertIncludes(res.body, 'class="card"', 'Expected card elements');
    });

    await test('Widget: supports track filter parameter', async () => {
        const res = await request('GET', '/embed/gallery?track=trk_01');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Widget: supports limit parameter', async () => {
        const res = await request('GET', '/embed/gallery?limit=2');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Widget: is fully self-contained (inline CSS, no external links)', async () => {
        const res = await request('GET', '/embed/gallery');
        assertIncludes(res.body, '<style>', 'Expected inline styles for iframe isolation');
    });

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------

    runner.printSummary();
    process.exit(runner.exitCode());
}

run().catch(err => {
    console.error('T4 test runner crashed:', err.message);
    process.exit(1);
});
