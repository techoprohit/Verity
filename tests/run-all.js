#!/usr/bin/env node
/**
 * Unified Test Runner
 * Executes all tier test suites sequentially and reports aggregate results.
 *
 * Usage:
 *   node tests/run-all.js           # Run all tiers
 *   node tests/run-all.js T1 T3     # Run only specific tiers
 *
 * Exit code: 0 if all suites pass, 1 if any suite fails.
 */
const { execSync } = require('child_process');
const path = require('path');

const SUITES = {
    T1: { file: 't1_core.test.js',     label: 'T1 Core' },
    T2: { file: 't2_judging.test.js',   label: 'T2 Judging' },
    T3: { file: 't3_public.test.js',    label: 'T3 Public' },
    T4: { file: 't4_stretch.test.js',   label: 'T4 Stretch' },
    NORM: { file: 'normalization.test.js', label: 'Normalization (Unit)' },
    ISO: { file: 'isolation.test.js',    label: 'Isolation (Legacy)' },
};

// Parse args: if tiers specified, run only those; otherwise run all
const args = process.argv.slice(2).map(a => a.toUpperCase());
const selectedKeys = args.length > 0
    ? args.filter(a => SUITES[a])
    : Object.keys(SUITES);

if (selectedKeys.length === 0) {
    console.error('No valid test suites specified.');
    console.error(`Available: ${Object.keys(SUITES).join(', ')}`);
    process.exit(1);
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║    VERITY ACCEPTANCE & INTEGRATION TESTS     ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`\nRunning ${selectedKeys.length} suite(s): ${selectedKeys.join(', ')}\n`);

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const key of selectedKeys) {
    const suite = SUITES[key];
    const filePath = path.join(__dirname, suite.file);
    console.log(`─── ${suite.label} ──────────────────────────────`);

    try {
        const output = execSync(`node "${filePath}"`, {
            encoding: 'utf-8',
            timeout: 60000,
            stdio: 'pipe',
        });

        // Print suite output
        process.stdout.write(output);

        // Parse pass/fail from output
        const match = output.match(/(\d+) passed, (\d+) failed/);
        if (match) {
            const p = parseInt(match[1]);
            const f = parseInt(match[2]);
            totalPassed += p;
            totalFailed += f;
            results.push({ key, label: suite.label, passed: p, failed: f, status: f === 0 ? 'PASS' : 'FAIL' });
        } else {
            results.push({ key, label: suite.label, passed: '?', failed: '?', status: 'PASS' });
        }
    } catch (err) {
        // Suite exited with non-zero
        const output = (err.stdout || '') + (err.stderr || '');
        process.stdout.write(output);

        const match = output.match(/(\d+) passed, (\d+) failed/);
        if (match) {
            const p = parseInt(match[1]);
            const f = parseInt(match[2]);
            totalPassed += p;
            totalFailed += f;
            results.push({ key, label: suite.label, passed: p, failed: f, status: 'FAIL' });
        } else {
            totalFailed += 1;
            results.push({ key, label: suite.label, passed: 0, failed: 1, status: 'CRASH' });
        }
    }
}

// -----------------------------------------------------------------------
// Aggregate Report
// -----------------------------------------------------------------------
console.log('\n╔══════════════════════════════════════════════╗');
console.log('║              AGGREGATE REPORT                ║');
console.log('╠══════════════════════════════════════════════╣');
for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    const pad = ' '.repeat(Math.max(0, 28 - r.label.length));
    console.log(`║  ${icon} ${r.label}${pad}${r.passed}p / ${r.failed}f  ${r.status.padEnd(5)} ║`);
}
console.log('╠══════════════════════════════════════════════╣');
console.log(`║  TOTAL: ${totalPassed} passed, ${totalFailed} failed${' '.repeat(Math.max(0, 20 - String(totalPassed).length - String(totalFailed).length))}║`);
console.log('╚══════════════════════════════════════════════╝');

process.exit(totalFailed > 0 ? 1 : 0);
