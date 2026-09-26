/**
 * Normalization & Rubric Engine
 * Implements:
 *   1. Weighted rubric composite scoring
 *   2. Per-judge Z-score normalization
 *   3. Final project ranking
 *
 * Based on JUDGING.md mathematical specification.
 */

/**
 * Compute weighted composite score for a single scorecard.
 * S_raw = sum(w_i * s_i) / sum(w_i)
 *
 * @param {Object} criteriaScores - { criterionKey: scoreValue }
 * @param {Object} criteriaWeights - { criterionKey: weight }
 * @returns {number} Weighted composite score
 */
function computeWeightedScore(criteriaScores, criteriaWeights) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, value] of Object.entries(criteriaScores)) {
        const weight = criteriaWeights[key] || 1.0;
        weightedSum += weight * value;
        totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return weightedSum / totalWeight;
}

/**
 * Compute mean and standard deviation for an array of numbers.
 * @param {number[]} values
 * @returns {{ mean: number, stddev: number }}
 */
function computeStats(values) {
    if (values.length === 0) return { mean: 0, stddev: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    if (values.length === 1) return { mean, stddev: 0 };

    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
    const stddev = Math.sqrt(variance);

    return { mean, stddev };
}

/**
 * Z-score normalize a value given judge statistics.
 * z = (S - μ_j) / σ_j
 * If σ_j === 0 (uniform scorer), returns 0.
 *
 * @param {number} rawScore
 * @param {number} judgeMean
 * @param {number} judgeStddev
 * @returns {number} Z-score
 */
function zScoreNormalize(rawScore, judgeMean, judgeStddev) {
    if (judgeStddev === 0) return 0;
    return (rawScore - judgeMean) / judgeStddev;
}

/**
 * Convert Z-score to standardized scale using global stats.
 * S_norm = μ_global + (z * σ_global)
 *
 * @param {number} zScore
 * @param {number} globalMean
 * @param {number} globalStddev
 * @returns {number} Normalized score on global scale
 */
function zScoreToGlobalScale(zScore, globalMean, globalStddev) {
    return globalMean + (zScore * globalStddev);
}

/**
 * Run the complete normalization pipeline across all scores.
 *
 * Input: Array of { judgeId, projectId, rawComposite }
 * Output: Array of { projectId, normalizedScore, reviewCount }
 *
 * @param {{ judgeId: string, projectId: string, rawComposite: number }[]} allScores
 * @returns {{ projectId: string, normalizedScore: number, rawAverage: number, reviewCount: number }[]}
 */
function normalizeScores(allScores) {
    if (allScores.length === 0) return [];

    // Step 1: Group scores by judge
    const byJudge = {};
    for (const score of allScores) {
        if (!byJudge[score.judgeId]) byJudge[score.judgeId] = [];
        byJudge[score.judgeId].push(score);
    }

    // Step 2: Compute per-judge stats (mean, stddev)
    const judgeStats = {};
    for (const [judgeId, scores] of Object.entries(byJudge)) {
        const values = scores.map(s => s.rawComposite);
        judgeStats[judgeId] = computeStats(values);
    }

    // Step 3: Compute Z-scores for every score
    const zScores = allScores.map(score => {
        const stats = judgeStats[score.judgeId];
        return {
            ...score,
            zScore: zScoreNormalize(score.rawComposite, stats.mean, stats.stddev)
        };
    });

    // Step 4: Compute global stats across all raw composites
    const allRaw = allScores.map(s => s.rawComposite);
    const globalStats = computeStats(allRaw);

    // Step 5: Convert Z-scores to global scale
    const normalizedScores = zScores.map(s => ({
        ...s,
        normalizedScore: zScoreToGlobalScale(s.zScore, globalStats.mean, globalStats.stddev)
    }));

    // Step 6: Aggregate per project
    const byProject = {};
    for (const score of normalizedScores) {
        if (!byProject[score.projectId]) {
            byProject[score.projectId] = { rawScores: [], normalizedScores: [] };
        }
        byProject[score.projectId].rawScores.push(score.rawComposite);
        byProject[score.projectId].normalizedScores.push(score.normalizedScore);
    }

    const results = [];
    for (const [projectId, data] of Object.entries(byProject)) {
        const rawAvg = data.rawScores.reduce((a, b) => a + b, 0) / data.rawScores.length;
        const normAvg = data.normalizedScores.reduce((a, b) => a + b, 0) / data.normalizedScores.length;
        results.push({
            projectId,
            rawAverage: +rawAvg.toFixed(4),
            normalizedScore: +normAvg.toFixed(4),
            reviewCount: data.rawScores.length
        });
    }

    // Sort by normalized score descending
    results.sort((a, b) => b.normalizedScore - a.normalizedScore);
    return results;
}

module.exports = {
    computeWeightedScore,
    computeStats,
    zScoreNormalize,
    zScoreToGlobalScale,
    normalizeScores
};
