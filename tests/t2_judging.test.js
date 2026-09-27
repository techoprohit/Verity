/**
 * T2 Judging Tests
 * Integration tests for the DOGFOOD 2026 Tier 2 (Judging Core) requirements.
 *
 * Covers:
 *   1. Judge sees own scores (GET /api/judge/scores as judge_a)
 *   2. Peer score isolation (judge_b cannot see judge_a's scorecard)
 *   3. Participant blocked from judge endpoints
 *   4. Visitor blocked from judge endpoints
 *   5. CSV export (organizer only, valid RFC 4180 format)
 *   6. Organizer dashboard
 *   7. Organizer rankings / normalization output
 *
 * Requires: server running on localhost:8080 with seeded fixture data.
 * Run with: node tests/t2_judging.test.js
 */
const {
    TOKENS, request, createRunner,
    assertEqual, assertInRange, assertIncludes, assertTrue,
} = require('./helpers');

const runner = createRunner('T2 Judging Tests');
const { test } = runner;

async function run() {
    runner.printHeader();

    // -----------------------------------------------------------------------
    // 1. Judge Sees Own Scores
    // -----------------------------------------------------------------------

    await test('Judge A: GET /api/judge/scores returns 200', async () => {
        const res = await request('GET', '/api/judge/scores', { cookie: TOKENS.judge_a });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Judge A: GET /api/judge/scores returns JSON array', async () => {
        const res = await request('GET', '/api/judge/scores', { cookie: TOKENS.judge_a });
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data), 'Expected JSON array of scores');
    });

    await test('Judge A: scores contain criteria breakdowns', async () => {
        const res = await request('GET', '/api/judge/scores', { cookie: TOKENS.judge_a });
        const data = JSON.parse(res.body);
        if (data.length > 0) {
            assertTrue(data[0].criteria !== undefined, 'Each score should include criteria array');
        }
    });

    await test('Judge B: GET /api/judge/scores returns 200', async () => {
        const res = await request('GET', '/api/judge/scores', { cookie: TOKENS.judge_b });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 2. Strict Peer Score Isolation (SPEC critical requirement)
    // -----------------------------------------------------------------------

    await test('Peer isolation: judge_b accessing judge_a scores returns 403', async () => {
        const res = await request('GET', '/api/judge/scores?judge=judge_a', { cookie: TOKENS.judge_b });
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    await test('Peer isolation: judge_a accessing judge_b scores returns 403', async () => {
        const res = await request('GET', '/api/judge/scores?judge=judge_b', { cookie: TOKENS.judge_a });
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    await test('Peer isolation: judge_a can access own scores by alias', async () => {
        const res = await request('GET', '/api/judge/scores?judge=judge_a', { cookie: TOKENS.judge_a });
        assertEqual(res.status, 200, `Expected 200 for own-score access, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 3. Participant Blocked
    // -----------------------------------------------------------------------

    await test('Participant blocked: GET /api/judge/scores returns 403', async () => {
        const res = await request('GET', '/api/judge/scores', { cookie: TOKENS.participant });
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    await test('Participant blocked: POST /api/judge/scores returns 403', async () => {
        const res = await request('POST', '/api/judge/scores', {
            cookie: TOKENS.participant,
            body: { projectId: 'prj_01', criteria: { functionality: 5 }, comment: 'probe' },
        });
        assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 4. Visitor (No Auth) Blocked
    // -----------------------------------------------------------------------

    await test('Visitor blocked: GET /api/judge/scores without auth returns 403', async () => {
        const res = await request('GET', '/api/judge/scores');
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    await test('Visitor blocked: POST /api/judge/scores without auth returns 403', async () => {
        const res = await request('POST', '/api/judge/scores', {
            body: { projectId: 'prj_01', criteria: { functionality: 5 } },
        });
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    // -----------------------------------------------------------------------
    // 5. CSV Export (Organizer Only)
    // -----------------------------------------------------------------------

    await test('CSV export: GET /api/export.csv as organizer returns 200', async () => {
        const res = await request('GET', '/api/export.csv', { cookie: TOKENS.organizer });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('CSV export: response is text/csv content type', async () => {
        const res = await request('GET', '/api/export.csv', { cookie: TOKENS.organizer });
        assertTrue(
            res.headers['content-type'].includes('text/csv'),
            `Expected text/csv, got ${res.headers['content-type']}`
        );
    });

    await test('CSV export: first line is valid CSV header with commas', async () => {
        const res = await request('GET', '/api/export.csv', { cookie: TOKENS.organizer });
        const firstLine = res.body.split('\n')[0];
        assertIncludes(firstLine, ',', 'CSV header must contain commas');
        assertIncludes(firstLine, 'project_id', 'CSV header must contain project_id');
        assertIncludes(firstLine, 'normalized_score', 'CSV header must contain normalized_score');
    });

    await test('CSV export: body has data rows beyond header', async () => {
        const res = await request('GET', '/api/export.csv', { cookie: TOKENS.organizer });
        const lines = res.body.trim().split('\n');
        assertTrue(lines.length > 1, `Expected header + data rows, got ${lines.length} lines`);
    });

    await test('CSV export: participant blocked', async () => {
        const res = await request('GET', '/api/export.csv', { cookie: TOKENS.participant });
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    await test('CSV export: judge blocked', async () => {
        const res = await request('GET', '/api/export.csv', { cookie: TOKENS.judge_a });
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    await test('CSV export: visitor (no auth) blocked', async () => {
        const res = await request('GET', '/api/export.csv');
        assertTrue(
            res.status === 401 || res.status === 403,
            `Expected 401 or 403, got ${res.status}`
        );
    });

    // -----------------------------------------------------------------------
    // 6. Organizer Dashboard
    // -----------------------------------------------------------------------

    await test('Dashboard: GET /api/dashboard as organizer returns 200', async () => {
        const res = await request('GET', '/api/dashboard', { cookie: TOKENS.organizer });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Dashboard: response contains progress metrics', async () => {
        const res = await request('GET', '/api/dashboard', { cookie: TOKENS.organizer });
        const data = JSON.parse(res.body);
        assertTrue(data.totalProjects !== undefined, 'Expected totalProjects field');
        assertTrue(data.totalJudges !== undefined, 'Expected totalJudges field');
        assertTrue(data.totalScores !== undefined, 'Expected totalScores field');
        assertTrue(Array.isArray(data.judgeProgress), 'Expected judgeProgress array');
    });

    await test('Dashboard: participant blocked', async () => {
        const res = await request('GET', '/api/dashboard', { cookie: TOKENS.participant });
        assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 7. Rankings / Normalization Output
    // -----------------------------------------------------------------------

    await test('Rankings: GET /api/organizer/rankings as organizer returns 200', async () => {
        const res = await request('GET', '/api/organizer/rankings', { cookie: TOKENS.organizer });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Rankings: response contains sorted project rankings', async () => {
        const res = await request('GET', '/api/organizer/rankings', { cookie: TOKENS.organizer });
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data.rankings), 'Expected rankings array');
        if (data.rankings.length >= 2) {
            assertTrue(
                data.rankings[0].normalizedScore >= data.rankings[1].normalizedScore,
                'Rankings should be sorted by normalizedScore descending'
            );
        }
    });

    await test('Rankings: each entry has normalizedScore and reviewCount', async () => {
        const res = await request('GET', '/api/organizer/rankings', { cookie: TOKENS.organizer });
        const data = JSON.parse(res.body);
        if (data.rankings.length > 0) {
            const entry = data.rankings[0];
            assertTrue(entry.normalizedScore !== undefined, 'Expected normalizedScore');
            assertTrue(entry.reviewCount !== undefined, 'Expected reviewCount');
            assertTrue(entry.projectId !== undefined, 'Expected projectId');
            assertTrue(isFinite(entry.normalizedScore), 'normalizedScore must be finite');
        }
    });

    // -----------------------------------------------------------------------
    // 8. Audit Log Access
    // -----------------------------------------------------------------------

    await test('Audit: GET /api/organizer/audit-logs as organizer returns 200', async () => {
        const res = await request('GET', '/api/organizer/audit-logs', { cookie: TOKENS.organizer });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data.logs), 'Expected logs array');
    });

    await test('Audit: participant blocked from audit logs', async () => {
        const res = await request('GET', '/api/organizer/audit-logs', { cookie: TOKENS.participant });
        assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------

    runner.printSummary();
    process.exit(runner.exitCode());
}

run().catch(err => {
    console.error('T2 test runner crashed:', err.message);
    process.exit(1);
});
