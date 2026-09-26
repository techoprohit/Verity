/**
 * Role Isolation Tests
 * Integration tests verifying backend-enforced access control.
 * Tests: peer score isolation, participant blocking, organizer access, visitor restrictions.
 *
 * Requires: server running on localhost:8080 with seeded fixture data.
 * Run with: node tests/isolation.test.js
 */
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
let passed = 0;
let failed = 0;

function request(method, path, cookie) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {}
        };

        if (cookie) {
            options.headers['Cookie'] = `session=${cookie}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
        });

        req.on('error', reject);
        req.end();
    });
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
    }
}

async function runTests() {
    console.log('\n=== Role Isolation Tests ===\n');

    // --- T1: Gallery is public ---
    await test('T1: GET /projects without auth returns 200', async () => {
        const res = await request('GET', '/projects');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('T1: Gallery contains fixture project titles', async () => {
        const res = await request('GET', '/projects');
        if (!res.body.includes('Dry Harbour')) {
            throw new Error('Expected gallery to contain "Dry Harbour" from fixtures');
        }
    });

    // --- T1: Closed event refuses submissions ---
    await test('T1: POST /projects/new as participant returns 4xx (event closed)', async () => {
        const res = await request('POST', '/projects/new', 'prt_2e88');
        if (res.status < 400 || res.status >= 500) {
            throw new Error(`Expected 4xx, got ${res.status}`);
        }
    });

    // --- T2: Judge sees own scores ---
    await test('T2: GET /api/judge/scores as judge_a returns 200', async () => {
        const res = await request('GET', '/api/judge/scores', 'jdg_a_91bc');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // --- T2: Judge cannot see peer scores ---
    await test('T2: GET /api/judge/scores?judge=judge_a as judge_b returns 403', async () => {
        const res = await request('GET', '/api/judge/scores?judge=judge_a', 'jdg_b_44de');
        if (res.status !== 403 && res.status !== 401) {
            throw new Error(`Expected 401 or 403, got ${res.status}`);
        }
    });

    // --- T2: Participant blocked from judge routes ---
    await test('T2: GET /api/judge/scores as participant returns 403', async () => {
        const res = await request('GET', '/api/judge/scores', 'prt_2e88');
        if (res.status !== 403 && res.status !== 401) {
            throw new Error(`Expected 401 or 403, got ${res.status}`);
        }
    });

    // --- T2: Visitor blocked from judge routes ---
    await test('T2: GET /api/judge/scores without auth returns 403', async () => {
        const res = await request('GET', '/api/judge/scores');
        if (res.status !== 403 && res.status !== 401) {
            throw new Error(`Expected 401 or 403, got ${res.status}`);
        }
    });

    // --- T2: CSV export requires organizer ---
    await test('T2: GET /api/export.csv as organizer returns 200', async () => {
        const res = await request('GET', '/api/export.csv', 'org_7f2a');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test('T2: GET /api/export.csv has CSV header with commas', async () => {
        const res = await request('GET', '/api/export.csv', 'org_7f2a');
        if (!res.body.includes(',')) {
            throw new Error('Expected CSV body to contain commas');
        }
        if (!res.body.includes('project_id')) {
            throw new Error('Expected CSV header to contain "project_id"');
        }
    });

    await test('T2: GET /api/export.csv as participant returns 403', async () => {
        const res = await request('GET', '/api/export.csv', 'prt_2e88');
        if (res.status !== 403 && res.status !== 401) {
            throw new Error(`Expected 401 or 403, got ${res.status}`);
        }
    });

    await test('T2: GET /api/export.csv without auth returns 403', async () => {
        const res = await request('GET', '/api/export.csv');
        if (res.status !== 403 && res.status !== 401) {
            throw new Error(`Expected 401 or 403, got ${res.status}`);
        }
    });

    // --- Health check ---
    await test('Health: GET /health returns 200', async () => {
        const res = await request('GET', '/health');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // --- Summary ---
    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Test runner failed:', err.message);
    process.exit(1);
});
