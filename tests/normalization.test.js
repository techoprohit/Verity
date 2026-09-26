/**
 * Normalization Engine Tests
 * Unit tests for weighted rubric scoring and Z-score normalization.
 * Covers: standard cases, zero-stddev judge, single-review projects, empty input.
 */
const assert = require('assert');
const {
    computeWeightedScore,
    computeStats,
    zScoreNormalize,
    zScoreToGlobalScale,
    normalizeScores
} = require('../src/engine/normalize');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
    }
}

console.log('\n=== Normalization Engine Tests ===\n');

// --- computeWeightedScore ---

test('weighted score: equal weights', () => {
    const scores = { functionality: 4, quality: 3, innovation: 5 };
    const weights = { functionality: 1, quality: 1, innovation: 1 };
    const result = computeWeightedScore(scores, weights);
    assert.strictEqual(result, 4); // (4+3+5)/3 = 4
});

test('weighted score: unequal weights', () => {
    const scores = { functionality: 5, quality: 3, innovation: 2 };
    const weights = { functionality: 0.5, quality: 0.3, innovation: 0.2 };
    // (0.5*5 + 0.3*3 + 0.2*2) / (0.5+0.3+0.2) = (2.5+0.9+0.4)/1.0 = 3.8
    const result = computeWeightedScore(scores, weights);
    assert(Math.abs(result - 3.8) < 0.001, `Expected ~3.8, got ${result}`);
});

test('weighted score: single criterion', () => {
    const result = computeWeightedScore({ quality: 3 }, { quality: 1 });
    assert.strictEqual(result, 3);
});

test('weighted score: empty criteria returns 0', () => {
    const result = computeWeightedScore({}, {});
    assert.strictEqual(result, 0);
});

// --- computeStats ---

test('stats: normal distribution', () => {
    const { mean, stddev } = computeStats([2, 4, 4, 4, 5, 5, 7, 9]);
    assert(Math.abs(mean - 5) < 0.001, `Expected mean ~5, got ${mean}`);
    assert(stddev > 0, `Expected positive stddev, got ${stddev}`);
});

test('stats: single value has zero stddev', () => {
    const { mean, stddev } = computeStats([3.5]);
    assert.strictEqual(mean, 3.5);
    assert.strictEqual(stddev, 0);
});

test('stats: empty array returns zeros', () => {
    const { mean, stddev } = computeStats([]);
    assert.strictEqual(mean, 0);
    assert.strictEqual(stddev, 0);
});

test('stats: uniform values (zero variance judge)', () => {
    const { mean, stddev } = computeStats([3, 3, 3, 3, 3]);
    assert.strictEqual(mean, 3);
    assert.strictEqual(stddev, 0);
});

// --- zScoreNormalize ---

test('z-score: normal case', () => {
    // Value 5, mean 3, stddev 2 => z = 1.0
    const z = zScoreNormalize(5, 3, 2);
    assert.strictEqual(z, 1.0);
});

test('z-score: zero stddev returns 0 (pathological judge guard)', () => {
    const z = zScoreNormalize(3, 3, 0);
    assert.strictEqual(z, 0);
});

test('z-score: negative z-score', () => {
    // Value 1, mean 3, stddev 2 => z = -1.0
    const z = zScoreNormalize(1, 3, 2);
    assert.strictEqual(z, -1.0);
});

// --- zScoreToGlobalScale ---

test('global scale: z=0 maps to global mean', () => {
    const result = zScoreToGlobalScale(0, 3.5, 1.2);
    assert.strictEqual(result, 3.5);
});

test('global scale: z=1 maps to mean + stddev', () => {
    const result = zScoreToGlobalScale(1, 3.5, 1.2);
    assert(Math.abs(result - 4.7) < 0.001);
});

// --- normalizeScores (full pipeline) ---

test('full pipeline: two judges, two projects', () => {
    const scores = [
        { judgeId: 'j1', projectId: 'p1', rawComposite: 4.0 },
        { judgeId: 'j1', projectId: 'p2', rawComposite: 2.0 },
        { judgeId: 'j2', projectId: 'p1', rawComposite: 5.0 },
        { judgeId: 'j2', projectId: 'p2', rawComposite: 3.0 },
    ];

    const results = normalizeScores(scores);
    assert.strictEqual(results.length, 2);

    // p1 should rank higher than p2
    assert(results[0].projectId === 'p1', `Expected p1 first, got ${results[0].projectId}`);
    assert(results[0].normalizedScore > results[1].normalizedScore);
    assert.strictEqual(results[0].reviewCount, 2);
    assert.strictEqual(results[1].reviewCount, 2);
});

test('full pipeline: empty input returns empty', () => {
    const results = normalizeScores([]);
    assert.strictEqual(results.length, 0);
});

test('full pipeline: single review per project', () => {
    const scores = [
        { judgeId: 'j1', projectId: 'p1', rawComposite: 4.5 },
    ];
    const results = normalizeScores(scores);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].reviewCount, 1);
});

test('full pipeline: pathological judge (uniform scores)', () => {
    // jdg_uniform gives every project the same score
    const scores = [
        { judgeId: 'jdg_uniform', projectId: 'p1', rawComposite: 3.0 },
        { judgeId: 'jdg_uniform', projectId: 'p2', rawComposite: 3.0 },
        { judgeId: 'jdg_uniform', projectId: 'p3', rawComposite: 3.0 },
        { judgeId: 'jdg_normal', projectId: 'p1', rawComposite: 5.0 },
        { judgeId: 'jdg_normal', projectId: 'p2', rawComposite: 2.0 },
    ];

    // Should not throw division by zero
    const results = normalizeScores(scores);
    assert(results.length > 0, 'Should return results even with uniform scorer');

    // Verify no NaN or Infinity in results
    for (const r of results) {
        assert(isFinite(r.normalizedScore), `Score for ${r.projectId} is not finite: ${r.normalizedScore}`);
        assert(!isNaN(r.normalizedScore), `Score for ${r.projectId} is NaN`);
    }
});

test('full pipeline: harsh vs lenient judge normalization', () => {
    // Harsh judge (mean ~2.0) and lenient judge (mean ~4.5)
    // After normalization, the project that got 3.0 from harsh judge
    // should be boosted relative to the project that got 4.0 from lenient judge
    const scores = [
        { judgeId: 'harsh', projectId: 'p1', rawComposite: 3.0 },
        { judgeId: 'harsh', projectId: 'p2', rawComposite: 1.0 },
        { judgeId: 'lenient', projectId: 'p1', rawComposite: 4.5 },
        { judgeId: 'lenient', projectId: 'p3', rawComposite: 5.0 },
    ];

    const results = normalizeScores(scores);
    // p1 has reviews from both judges
    const p1 = results.find(r => r.projectId === 'p1');
    assert(p1, 'p1 should be in results');
    assert(p1.reviewCount === 2, 'p1 should have 2 reviews');
});

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
