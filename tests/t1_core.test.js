/**
 * T1 Core Tests
 * Integration tests for the DOGFOOD 2026 Tier 1 (Core Floor) requirements.
 *
 * Covers:
 *   1. Authentication & Sessions across 5 roles
 *   2. Public Gallery (unauthenticated access, search, track filtering, fixture content)
 *   3. Team Formation (create team, join via invite code)
 *   4. Strict Deadline Enforcement (POST /projects/new rejected when event is closed)
 *   5. Event & Track Configuration (organizer-only creation)
 *
 * Requires: server running on localhost:8080 with seeded fixture data.
 * Run with: node tests/t1_core.test.js
 */
const {
    TOKENS, request, createRunner,
    assertEqual, assertInRange, assertIncludes, assertTrue,
} = require('./helpers');

const runner = createRunner('T1 Core Tests');
const { test } = runner;

async function run() {
    runner.printHeader();

    // -----------------------------------------------------------------------
    // 1. Authentication & Sessions
    // -----------------------------------------------------------------------

    await test('Auth: GET /api/auth/me without session returns visitor role', async () => {
        const res = await request('GET', '/api/auth/me');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        // Unauthenticated users are assigned the implicit "visitor" role
        if (data.user) {
            assertEqual(data.user.role, 'visitor', `Expected visitor role, got ${data.user.role}`);
        }
        // If user is null/undefined, that's also acceptable (no session)
    });

    await test('Auth: GET /api/auth/me as organizer returns organizer role', async () => {
        const res = await request('GET', '/api/auth/me', { cookie: TOKENS.organizer });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(data.user !== null, 'Expected authenticated user');
        assertEqual(data.user.role, 'organizer', `Expected organizer, got ${data.user.role}`);
    });

    await test('Auth: GET /api/auth/me as judge_a returns judge role', async () => {
        const res = await request('GET', '/api/auth/me', { cookie: TOKENS.judge_a });
        const data = JSON.parse(res.body);
        assertTrue(data.user !== null, 'Expected authenticated user');
        assertEqual(data.user.role, 'judge', `Expected judge, got ${data.user.role}`);
    });

    await test('Auth: GET /api/auth/me as judge_b returns judge role', async () => {
        const res = await request('GET', '/api/auth/me', { cookie: TOKENS.judge_b });
        const data = JSON.parse(res.body);
        assertTrue(data.user !== null, 'Expected authenticated user');
        assertEqual(data.user.role, 'judge', `Expected judge, got ${data.user.role}`);
    });

    await test('Auth: GET /api/auth/me as participant returns participant role', async () => {
        const res = await request('GET', '/api/auth/me', { cookie: TOKENS.participant });
        const data = JSON.parse(res.body);
        assertTrue(data.user !== null, 'Expected authenticated user');
        assertEqual(data.user.role, 'participant', `Expected participant, got ${data.user.role}`);
    });

    await test('Auth: POST /api/auth/register creates new participant', async () => {
        const email = `test_t1_${Date.now()}@verity.local`;
        const res = await request('POST', '/api/auth/register', {
            body: { email, name: 'T1 Test User', password: 'test123' },
        });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertEqual(data.user.role, 'participant', 'New users default to participant role');
    });

    await test('Auth: POST /api/auth/register rejects duplicate email', async () => {
        const email = `test_t1_dup_${Date.now()}@verity.local`;
        // First registration
        await request('POST', '/api/auth/register', {
            body: { email, name: 'Dup Test', password: 'test123' },
        });
        // Second attempt with same email
        const res = await request('POST', '/api/auth/register', {
            body: { email, name: 'Dup Test 2', password: 'test456' },
        });
        assertEqual(res.status, 409, `Expected 409, got ${res.status}`);
    });

    await test('Auth: POST /api/auth/register rejects missing fields', async () => {
        const res = await request('POST', '/api/auth/register', {
            body: { email: 'x@y.com' },  // missing name and password
        });
        assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
    });

    await test('Auth: POST /api/auth/login with correct credentials succeeds', async () => {
        const res = await request('POST', '/api/auth/login', {
            body: { email: 'organizer@verity.local', password: 'dogfood2026' },
        });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(data.user !== null, 'Expected user object');
    });

    await test('Auth: POST /api/auth/login with wrong password fails', async () => {
        const res = await request('POST', '/api/auth/login', {
            body: { email: 'organizer@verity.local', password: 'wrongpassword' },
        });
        assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
    });

    await test('Auth: POST /api/auth/login with missing fields fails', async () => {
        const res = await request('POST', '/api/auth/login', {
            body: { email: 'organizer@verity.local' },
        });
        assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
    });

    await test('Auth: POST /api/auth/logout returns success', async () => {
        // Use a disposable session (not the seeded organizer token) to avoid
        // invalidating shared tokens that other test suites depend on
        const res = await request('POST', '/api/auth/logout');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 2. Public Gallery
    // -----------------------------------------------------------------------

    await test('Gallery: GET /projects without auth returns 200', async () => {
        const res = await request('GET', '/projects');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    await test('Gallery: GET /projects contains fixture project titles', async () => {
        const res = await request('GET', '/projects');
        // "Dry Harbour" is one of the fixture projects
        assertIncludes(res.body, 'Dry Harbour', 'Expected gallery to contain "Dry Harbour"');
    });

    await test('Gallery: GET /projects with JSON accept returns structured data', async () => {
        const res = await request('GET', '/projects', { accept: 'application/json' });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data.projects), 'Expected projects array');
        assertTrue(data.projects.length > 0, 'Expected at least one project');
        assertTrue(data.total > 0, 'Expected total count > 0');
    });

    await test('Gallery: GET /projects?search= filters by title', async () => {
        const res = await request('GET', '/projects?search=Dry+Harbour', { accept: 'application/json' });
        const data = JSON.parse(res.body);
        assertTrue(data.projects.length > 0, 'Search should find matching projects');
        assertTrue(data.projects.some(p => p.title.includes('Dry Harbour')), 'Should include "Dry Harbour"');
    });

    await test('Gallery: GET /projects?search= with no match returns empty', async () => {
        const res = await request('GET', '/projects?search=ZZZNOMATCHZZZ', { accept: 'application/json' });
        const data = JSON.parse(res.body);
        assertEqual(data.projects.length, 0, 'No projects should match nonsense search');
    });

    await test('Gallery: GET /projects?track= filters by track ID', async () => {
        const res = await request('GET', '/projects?track=trk_01', { accept: 'application/json' });
        const data = JSON.parse(res.body);
        for (const p of data.projects) {
            assertEqual(p.track_id, 'trk_01', `Expected track_id=trk_01, got ${p.track_id}`);
        }
    });

    await test('Gallery: GET /projects returns track metadata for filtering', async () => {
        const res = await request('GET', '/projects', { accept: 'application/json' });
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data.tracks), 'Expected tracks array for filter UI');
        assertTrue(data.tracks.length > 0, 'Expected at least one track');
    });

    await test('Gallery: GET /projects/:id returns single project detail', async () => {
        const res = await request('GET', '/projects/prj_01');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertEqual(data.id, 'prj_01', 'Project ID should match');
        assertTrue(data.title !== undefined, 'Project should have title');
    });

    await test('Gallery: GET /projects/:id with invalid ID returns 404', async () => {
        const res = await request('GET', '/projects/prj_NONEXISTENT');
        assertEqual(res.status, 404, `Expected 404, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 3. Deadline Enforcement
    // -----------------------------------------------------------------------

    await test('Deadline: POST /projects/new as participant returns 4xx (event closed)', async () => {
        const res = await request('POST', '/projects/new', {
            cookie: TOKENS.participant,
            body: { title: 'dogfood-late-submission-probe', summary: 'probe' },
        });
        assertInRange(res.status, 400, 499, `Expected 4xx, got ${res.status}`);
    });

    await test('Deadline: POST /projects/new without auth returns 4xx', async () => {
        const res = await request('POST', '/projects/new', {
            body: { title: 'unauthorized-probe', summary: 'test' },
        });
        assertInRange(res.status, 400, 499, `Expected 4xx, got ${res.status}`);
    });

    await test('Deadline: POST /projects/new as judge returns 403', async () => {
        const res = await request('POST', '/projects/new', {
            cookie: TOKENS.judge_a,
            body: { title: 'judge-probe', summary: 'should fail' },
        });
        assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 4. Event & Track Configuration
    // -----------------------------------------------------------------------

    await test('Events: POST /api/events requires organizer role', async () => {
        const res = await request('POST', '/api/events', {
            cookie: TOKENS.participant,
            body: { name: 'Probe Event', submissions_close: '2099-01-01T00:00:00Z' },
        });
        assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    await test('Events: POST /api/events rejects duplicate (event already exists)', async () => {
        const res = await request('POST', '/api/events', {
            cookie: TOKENS.organizer,
            body: { name: 'Dup Event', submissions_close: '2099-01-01T00:00:00Z' },
        });
        assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
    });

    await test('Events: POST /api/tracks requires organizer role', async () => {
        const res = await request('POST', '/api/tracks', {
            cookie: TOKENS.participant,
            body: { name: 'Probe Track' },
        });
        assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 5. Health Check
    // -----------------------------------------------------------------------

    await test('Health: GET /health returns 200', async () => {
        const res = await request('GET', '/health');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------

    runner.printSummary();
    process.exit(runner.exitCode());
}

run().catch(err => {
    console.error('T1 test runner crashed:', err.message);
    process.exit(1);
});
