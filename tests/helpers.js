/**
 * Shared Test Harness
 * Common utilities for all tier test suites.
 * Zero dependencies — standard Node.js http module only.
 */
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// Pre-seeded session tokens from .dogfood.toml / seed.js
const TOKENS = {
    organizer:   'org_7f2a',
    judge_a:     'jdg_a_91bc',
    judge_b:     'jdg_b_44de',
    participant: 'prt_2e88',
};

/**
 * Issue an HTTP request and return { status, body, headers }.
 * Supports GET, POST, PUT, DELETE with optional JSON body and session cookie.
 */
function request(method, path, opts = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {},
        };

        if (opts.cookie) {
            options.headers['Cookie'] = `session=${opts.cookie}`;
        }

        let payload = null;
        if (opts.body !== undefined) {
            payload = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        if (opts.accept) {
            options.headers['Accept'] = opts.accept;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

/**
 * Lightweight test runner.
 * Returns { passed, failed } after running all tests.
 */
function createRunner(suiteName) {
    let passed = 0;
    let failed = 0;

    function printHeader() {
        console.log(`\n=== ${suiteName} ===\n`);
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

    function printSummary() {
        console.log(`\n${passed} passed, ${failed} failed\n`);
    }

    function exitCode() {
        return failed > 0 ? 1 : 0;
    }

    return { printHeader, test, printSummary, exitCode, get passed() { return passed; }, get failed() { return failed; } };
}

/**
 * Simple assertion helpers.
 */
function assertEqual(actual, expected, msg) {
    if (actual !== expected) throw new Error(msg || `Expected ${expected}, got ${actual}`);
}

function assertInRange(actual, lo, hi, msg) {
    if (actual < lo || actual > hi) throw new Error(msg || `Expected ${actual} in [${lo}, ${hi}]`);
}

function assertIncludes(haystack, needle, msg) {
    if (!haystack.includes(needle)) throw new Error(msg || `Expected body to include "${needle}"`);
}

function assertNotIncludes(haystack, needle, msg) {
    if (haystack.includes(needle)) throw new Error(msg || `Expected body NOT to include "${needle}"`);
}

function assertTrue(value, msg) {
    if (!value) throw new Error(msg || `Assertion failed: value is falsy`);
}

module.exports = {
    BASE_URL,
    TOKENS,
    request,
    createRunner,
    assertEqual,
    assertInRange,
    assertIncludes,
    assertNotIncludes,
    assertTrue,
};
