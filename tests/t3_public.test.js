/**
 * T3 Public Tests
 * Integration tests for the DOGFOOD 2026 Tier 3 (Public Stretch) requirements.
 *
 * Covers:
 *   1. Community Voting (email-gated, single vote per event)
 *   2. Project Comments (post and retrieve)
 *   3. Hidden Results Window (vote tallies not exposed publicly)
 *   4. Randomized Ballot Ordering (non-deterministic project order)
 *   5. Anti-Abuse: duplicate vote rejection, rate limiting, audit trail
 *
 * Requires: server running on localhost:8080 with seeded fixture data.
 * Run with: node tests/t3_public.test.js
 */
const {
    TOKENS, request, createRunner,
    assertEqual, assertInRange, assertIncludes, assertNotIncludes, assertTrue,
} = require('./helpers');

const runner = createRunner('T3 Public Tests');
const { test } = runner;

// Generate unique emails per test run to avoid cross-run state collisions
const RUN_ID = Date.now();

async function run() {
    runner.printHeader();

    // -----------------------------------------------------------------------
    // 1. Community Voting
    // -----------------------------------------------------------------------

    await test('Voting: POST /api/vote with valid payload returns success', async () => {
        const res = await request('POST', '/api/vote', {
            body: { project_id: 'prj_01', voter_email: `voter_ok_${RUN_ID}@test.com` },
        });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(data.success === true, 'Expected success: true');
    });

    await test('Voting: POST /api/vote missing project_id returns 400', async () => {
        const res = await request('POST', '/api/vote', {
            body: { voter_email: `voter_nopid_${RUN_ID}@test.com` },
        });
        assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
    });

    await test('Voting: POST /api/vote missing voter_email returns 400', async () => {
        const res = await request('POST', '/api/vote', {
            body: { project_id: 'prj_01' },
        });
        assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 2. Duplicate Vote Rejection (Anti-Abuse)
    // -----------------------------------------------------------------------

    await test('Duplicate: second vote from same email returns 400', async () => {
        const email = `voter_dup_${RUN_ID}@test.com`;
        // Cast first vote
        await request('POST', '/api/vote', {
            body: { project_id: 'prj_02', voter_email: email },
        });
        // Attempt duplicate vote (different project, same email+event)
        const res = await request('POST', '/api/vote', {
            body: { project_id: 'prj_03', voter_email: email },
        });
        assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertIncludes(data.error, 'already voted', 'Error should mention already voted');
    });

    // -----------------------------------------------------------------------
    // 3. Randomized Ballot Ordering
    // -----------------------------------------------------------------------

    await test('Ballot: GET /api/ballot returns 200 with project array', async () => {
        const res = await request('GET', '/api/ballot');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data), 'Expected array of projects');
        assertTrue(data.length > 0, 'Expected at least one project on ballot');
    });

    await test('Ballot: each project has required fields', async () => {
        const res = await request('GET', '/api/ballot');
        const data = JSON.parse(res.body);
        if (data.length > 0) {
            const p = data[0];
            assertTrue(p.id !== undefined, 'Expected project.id');
            assertTrue(p.title !== undefined, 'Expected project.title');
            assertTrue(p.track_name !== undefined, 'Expected project.track_name');
            assertTrue(p.team_name !== undefined, 'Expected project.team_name');
        }
    });

    await test('Ballot: ordering is randomized (non-deterministic)', async () => {
        // Query the ballot 5 times and check if order varies at least once
        const orders = [];
        for (let i = 0; i < 5; i++) {
            const res = await request('GET', '/api/ballot');
            const data = JSON.parse(res.body);
            orders.push(data.map(p => p.id).join(','));
        }
        const uniqueOrders = new Set(orders);
        assertTrue(
            uniqueOrders.size > 1,
            `Expected randomized ordering across 5 requests, but got ${uniqueOrders.size} unique orders`
        );
    });

    // -----------------------------------------------------------------------
    // 4. Hidden Results Window (vote tallies not exposed)
    // -----------------------------------------------------------------------

    await test('Hidden results: GET /api/ballot does NOT expose vote_count', async () => {
        const res = await request('GET', '/api/ballot');
        const body = res.body.toLowerCase();
        assertNotIncludes(body, 'vote_count', 'Ballot should not expose vote_count');
        assertNotIncludes(body, 'votecount', 'Ballot should not expose voteCount');
    });

    await test('Hidden results: GET /projects does NOT expose vote tallies', async () => {
        const res = await request('GET', '/projects', { accept: 'application/json' });
        const body = res.body.toLowerCase();
        assertNotIncludes(body, 'vote_count', 'Gallery should not expose vote_count');
    });

    await test('Hidden results: GET /projects/:id does NOT expose vote tallies', async () => {
        const res = await request('GET', '/projects/prj_01');
        const body = res.body.toLowerCase();
        assertNotIncludes(body, 'vote_count', 'Project detail should not expose vote_count');
    });

    // -----------------------------------------------------------------------
    // 5. Project Comments
    // -----------------------------------------------------------------------

    await test('Comments: POST as authenticated user succeeds without email', async () => {
        const res = await request('POST', '/api/projects/prj_03/comments', {
            cookie: TOKENS.participant,
            body: { content: `Authenticated comment ${RUN_ID}` },
        });
        assertEqual(res.status, 201, `Expected 201, got ${res.status}`);
    });

    await test('Comments: POST /api/projects/:id/comments creates a comment', async () => {
        const res = await request('POST', '/api/projects/prj_01/comments', {
            body: { content: `T3 test comment ${RUN_ID}`, voter_email: `commenter_${RUN_ID}@test.com` },
        });
        assertEqual(res.status, 201, `Expected 201, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(data.success === true, 'Expected success: true');
        assertTrue(data.id !== undefined, 'Expected comment ID in response');
    });

    await test('Comments: GET /api/projects/:id/comments retrieves comments', async () => {
        const res = await request('GET', '/api/projects/prj_01/comments');
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assertTrue(Array.isArray(data), 'Expected array of comments');
        assertTrue(data.length > 0, 'Expected at least one comment (we just posted one)');
    });

    await test('Comments: each comment has required fields', async () => {
        const res = await request('GET', '/api/projects/prj_01/comments');
        const data = JSON.parse(res.body);
        if (data.length > 0) {
            const c = data[0];
            assertTrue(c.id !== undefined, 'Expected comment.id');
            assertTrue(c.content !== undefined, 'Expected comment.content');
            assertTrue(c.created_at !== undefined, 'Expected comment.created_at');
        }
    });

    await test('Comments: POST missing content returns 400', async () => {
        const res = await request('POST', '/api/projects/prj_01/comments', {
            body: { voter_email: `empty_${RUN_ID}@test.com` },
        });
        // May get 400 (validation) or 429 (rate limited) — both are valid rejections
        assertTrue(res.status === 400 || res.status === 429, `Expected 400 or 429, got ${res.status}`);
    });

    await test('Comments: POST missing both email and auth returns 400', async () => {
        const res = await request('POST', '/api/projects/prj_01/comments', {
            body: { content: 'No identity comment' },
        });
        assertTrue(res.status === 400 || res.status === 429, `Expected 400 or 429, got ${res.status}`);
    });

    // -----------------------------------------------------------------------
    // 6. Rate Limiting (Anti-Abuse)
    // -----------------------------------------------------------------------

    await test('Rate limit: rapid comment posting triggers 429', async () => {
        // Comment rate limit is 3 per minute per IP on /api/projects/:id/comments
        // Previous POSTs in this suite may have already consumed some slots.
        // Send additional rapid requests to guarantee hitting the limit.
        let hitRateLimit = false;
        for (let i = 0; i < 8; i++) {
            const res = await request('POST', `/api/projects/prj_10/comments`, {
                body: { content: `Rate limit test ${i}`, voter_email: `ratelimit_${RUN_ID}_${i}@test.com` },
            });
            if (res.status === 429) {
                hitRateLimit = true;
                break;
            }
        }
        assertTrue(hitRateLimit, 'Expected 429 rate limit response after rapid comments');
    });

    // -----------------------------------------------------------------------
    // 7. Audit Trail Verification
    // -----------------------------------------------------------------------

    await test('Audit: voting actions appear in organizer audit log', async () => {
        const res = await request('GET', '/api/organizer/audit-logs', { cookie: TOKENS.organizer });
        assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        const voteActions = data.logs.filter(l => l.action === 'community_vote');
        assertTrue(voteActions.length > 0, 'Expected at least one community_vote audit entry');
    });

    await test('Audit: comment actions appear in organizer audit log', async () => {
        const res = await request('GET', '/api/organizer/audit-logs', { cookie: TOKENS.organizer });
        const data = JSON.parse(res.body);
        const commentActions = data.logs.filter(l => l.action === 'post_comment');
        assertTrue(commentActions.length > 0, 'Expected at least one post_comment audit entry');
    });

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------

    runner.printSummary();
    process.exit(runner.exitCode());
}

run().catch(err => {
    console.error('T3 test runner crashed:', err.message);
    process.exit(1);
});
