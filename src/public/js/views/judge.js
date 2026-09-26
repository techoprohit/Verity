/**
 * Phase 4: Judging Console View
 * Split-screen evaluation console, weighted rubric steppers,
 * isolated scorecards, and peer security verification.
 */

export async function renderJudge() {
    return `
        <div class="df-header-block">
            <div>
                <h2>Judging Console</h2>
                <p class="text-muted">Rigorous multi-criteria evaluation with mathematically enforced score isolation.</p>
            </div>
            <div>
                <span class="df-tag" id="judge-role-badge">[ AUTH: VERIFYING... ]</span>
            </div>
        </div>
        <div id="judge-content">
            <div class="df-tag">[ LOADING EVALUATION CONSOLE... ]</div>
        </div>
    `;
}

export async function initJudge() {
    const container = document.getElementById('judge-content');
    const roleBadge = document.getElementById('judge-role-badge');

    try {
        // Attempt to fetch judge scores
        const scoresRes = await fetch('/api/judge/scores', {
            headers: { 'Accept': 'application/json' }
        });

        if (scoresRes.status === 403) {
            roleBadge.textContent = '[ AUTH: FORBIDDEN ]';
            container.innerHTML = `
                <div class="df-card" style="border-color: var(--color-error)">
                    <div class="df-card__body">
                        <h3 style="color: var(--color-error)">[ HTTP 403: JUDGING ACCESS RESTRICTED ]</h3>
                        <p>Only verified users with the <strong style="color: var(--brand-cyan)">JUDGE</strong> or <strong style="color: var(--brand-cyan)">ORGANIZER</strong> role may enter the judging console.</p>
                        <p class="text-muted" style="margin-top: var(--sp-4);">To protect evaluation impartiality, participants and unauthenticated visitors cannot inspect rubrics or evaluate entries.</p>
                        <div style="margin-top: var(--sp-6); display: flex; gap: var(--sp-3); flex-wrap: wrap;">
                            <button class="btn-primary" id="switch-to-judge-a">[ ACT AS: JUDGE A (Ada Okonkwo) ]</button>
                            <button class="btn-secondary" id="switch-to-judge-b">[ ACT AS: JUDGE B (Peer Judge) ]</button>
                        </div>
                    </div>
                </div>
            `;
            const setupSwitch = (btnId, token, name) => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.addEventListener('click', () => {
                        document.cookie = `session=${token}; path=/`;
                        const b = document.getElementById('current-role-badge');
                        if (b) b.textContent = `ROLE: JUDGE`;
                        initJudge();
                    });
                }
            };
            setupSwitch('switch-to-judge-a', 'jdg_a_91bc', 'JUDGE A');
            setupSwitch('switch-to-judge-b', 'jdg_b_44de', 'JUDGE B');
            return;
        }

        if (!scoresRes.ok) throw new Error('Failed to connect to judging engine');

        roleBadge.textContent = '[ AUTH: JUDGE VERIFIED ]';
        roleBadge.style.color = 'var(--color-success)';

        const existingScores = await scoresRes.json();
        
        // Fetch all projects to build the evaluation queue
        const projRes = await fetch('/projects?limit=100', {
            headers: { 'Accept': 'application/json' }
        });
        const projData = await projRes.json();
        const allProjects = projData.projects || [];

        // Build a map of existing scores by project ID
        const scoreMap = {};
        existingScores.forEach(s => {
            scoreMap[s.project_id] = s;
        });

        let selectedProjectIndex = 0;
        let rubricScores = {
            functionality: 4,
            quality: 3,
            innovation: 4
        };
        const rubricWeights = {
            functionality: 0.40,
            quality: 0.30,
            innovation: 0.30
        };

        function renderConsole() {
            const currentProj = allProjects[selectedProjectIndex] || null;
            if (!currentProj) {
                container.innerHTML = `<p class="text-muted">No projects found in the event database.</p>`;
                return;
            }

            const existingScore = scoreMap[currentProj.id];
            if (existingScore && existingScore.criteria) {
                existingScore.criteria.forEach(c => {
                    if (c.key) rubricScores[c.key] = c.score_value;
                });
            }

            // Calculate live weighted score
            let weightedSum = 0;
            let totalWeight = 0;
            for (const [key, val] of Object.entries(rubricScores)) {
                const w = rubricWeights[key] || 1.0;
                weightedSum += w * val;
                totalWeight += w;
            }
            const liveComposite = (weightedSum / totalWeight).toFixed(2);

            container.innerHTML = `
                <!-- Peer Security Audit Probe Banner -->
                <div class="df-dev-banner" style="border-color: var(--brand-pink);">
                    <div>
                        <span class="df-tag" style="color: var(--brand-pink)">ROLE ISOLATION AUDIT</span>
                        <span class="text-small" style="margin-left: 8px;">Verify that judges cannot inspect peer scorecards:</span>
                    </div>
                    <button class="btn-danger" id="probe-peer-btn" style="height: 30px; font-size: 11px;">[ PROBE PEER SCORES (TEST 403) ]</button>
                </div>
                <div id="probe-result-box" style="display: none; margin-bottom: var(--sp-6);"></div>

                <!-- Split-Screen Judging Console -->
                <div class="df-split">
                    <!-- LEFT PANEL: PROJECT DOSSIER & QUEUE -->
                    <div class="df-card">
                        <div class="df-card__header">
                            <div>
                                <span class="df-tag">[ ENTRY ${selectedProjectIndex + 1} OF ${allProjects.length} ]</span>
                            </div>
                            <div>
                                ${existingScore 
                                    ? `<span class="df-tag" style="color: var(--color-success)">EVALUATED ●</span>` 
                                    : `<span class="df-tag" style="color: var(--color-warning)">PENDING REVIEW ○</span>`
                                }
                            </div>
                        </div>
                        <div class="df-card__body" style="display: flex; flex-direction: column; gap: var(--sp-4);">
                            <div>
                                <label class="df-tag">SELECT PROJECT QUEUE</label>
                                <select id="project-selector" class="df-input" style="margin-top: 6px;">
                                    ${allProjects.map((p, i) => `
                                        <option value="${i}" ${i === selectedProjectIndex ? 'selected' : ''}>
                                            ${scoreMap[p.id] ? '✓ ' : '○ '} ${p.title} (${p.team_name})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--sp-4);">
                                <span class="df-tag">[ TRACK / ${escapeHtml(currentProj.track_name || '').toUpperCase()} ]</span>
                                <h3 style="margin-top: var(--sp-2);">${escapeHtml(currentProj.title)}</h3>
                                <p class="text-muted" style="margin-top: 4px;">Team: <strong style="color: var(--text-primary);">${escapeHtml(currentProj.team_name)}</strong></p>
                            </div>

                            <div>
                                <span class="df-tag">ONE-LINE PITCH</span>
                                <p style="margin-top: 4px; color: var(--text-secondary);">${escapeHtml(currentProj.summary || 'No summary provided.')}</p>
                            </div>

                            <div>
                                <span class="df-tag">VERIFIED ARTIFACTS</span>
                                <div style="display: flex; gap: var(--sp-4); margin-top: 6px;">
                                    ${currentProj.repo_url ? `<a href="${escapeHtml(currentProj.repo_url)}" target="_blank" rel="noopener" class="df-link">[ REPO ↗ ]</a>` : '<span class="text-dim">[ REPO - ]</span>'}
                                    ${currentProj.demo_url ? `<a href="${escapeHtml(currentProj.demo_url)}" target="_blank" rel="noopener" class="df-link">[ LIVE DEMO ↗ ]</a>` : '<span class="text-dim">[ DEMO - ]</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="df-card__footer">
                            <button class="btn-secondary" id="prev-project-btn" ${selectedProjectIndex === 0 ? 'disabled' : ''}>[ &lt; PREVIOUS ]</button>
                            <button class="btn-secondary" id="next-project-btn" ${selectedProjectIndex === allProjects.length - 1 ? 'disabled' : ''}>[ NEXT &gt; ]</button>
                        </div>
                    </div>

                    <!-- RIGHT PANEL: WEIGHTED RUBRIC EVALUATION FORM -->
                    <form id="evaluation-form" class="df-card">
                        <div class="df-card__header">
                            <span class="df-tag">[ WEIGHTED RUBRIC SCORECARD ]</span>
                            <span class="df-tag" style="color: var(--brand-cyan);">T2 CERTIFIED</span>
                        </div>
                        <div class="df-card__body" style="display: flex; flex-direction: column; gap: var(--sp-4);">
                            <!-- Criterion 1: Functionality -->
                            <div>
                                <div style="display: flex; justify-content: space-between;">
                                    <label class="df-tag">1. FUNCTIONALITY</label>
                                    <span class="text-small text-muted">Weight: 40%</span>
                                </div>
                                <div class="df-stepper-row" data-criterion="functionality">
                                    ${[1, 2, 3, 4, 5].map(n => `
                                        <button type="button" class="df-stepper-btn ${rubricScores.functionality === n ? 'selected' : ''}" data-val="${n}">${n}</button>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Criterion 2: Code Quality -->
                            <div>
                                <div style="display: flex; justify-content: space-between;">
                                    <label class="df-tag">2. CODE QUALITY & ARCHITECTURE</label>
                                    <span class="text-small text-muted">Weight: 30%</span>
                                </div>
                                <div class="df-stepper-row" data-criterion="quality">
                                    ${[1, 2, 3, 4, 5].map(n => `
                                        <button type="button" class="df-stepper-btn ${rubricScores.quality === n ? 'selected' : ''}" data-val="${n}">${n}</button>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Criterion 3: Innovation -->
                            <div>
                                <div style="display: flex; justify-content: space-between;">
                                    <label class="df-tag">3. INNOVATION & NOVELTY</label>
                                    <span class="text-small text-muted">Weight: 30%</span>
                                </div>
                                <div class="df-stepper-row" data-criterion="innovation">
                                    ${[1, 2, 3, 4, 5].map(n => `
                                        <button type="button" class="df-stepper-btn ${rubricScores.innovation === n ? 'selected' : ''}" data-val="${n}">${n}</button>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Live Score Meter -->
                            <div class="df-score-meter">
                                <span class="df-tag">COMPOSITE RAW SCORE:</span>
                                <span style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--brand-cyan);" id="live-composite-score">
                                    ${liveComposite} <span style="font-size: 13px; color: var(--text-muted); font-family: var(--font-mono);">/ 5.00</span>
                                </span>
                            </div>

                            <!-- Qualitative Comments -->
                            <div>
                                <label class="df-tag" style="display: block; margin-bottom: 6px;">QUALITATIVE EVALUATOR CRITIQUE</label>
                                <textarea id="judge-comment" class="df-input" rows="3" placeholder="Defend your evaluation with technical observations...">${escapeHtml(existingScore?.comment || '')}</textarea>
                            </div>
                        </div>
                        <div class="df-card__footer">
                            <button type="submit" class="btn-primary" id="submit-score-btn" style="width: 100%;">
                                ${existingScore ? '[ UPDATE SCORECARD ]' : '[ TRANSMIT OFFICIAL SCORECARD ]'}
                            </button>
                        </div>
                        <div id="eval-msg" style="padding: 0 var(--sp-4) var(--sp-4); font-size: 12px;"></div>
                    </form>
                </div>

                <!-- My Evaluation History -->
                <div style="margin-top: var(--sp-12);">
                    <div class="df-header-block">
                        <h3>My Recorded Scorecards</h3>
                        <span class="df-tag">[ ${existingScores.length} COMPLETED ]</span>
                    </div>
                    <div class="df-table-container">
                        <table class="df-table">
                            <thead>
                                <tr>
                                    <th>Project Title</th>
                                    <th>Functionality</th>
                                    <th>Quality</th>
                                    <th>Innovation</th>
                                    <th>Comment</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${existingScores.length === 0 ? `
                                    <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No scorecards submitted yet for your active session.</td></tr>
                                ` : existingScores.map(s => {
                                    const cMap = {};
                                    (s.criteria || []).forEach(c => cMap[c.key] = c.score_value);
                                    return `
                                        <tr>
                                            <td style="font-weight: 700; color: var(--text-primary);">${escapeHtml(s.project_title || s.project_id)}</td>
                                            <td><span class="df-tag">${cMap['functionality'] || '-'} / 5</span></td>
                                            <td><span class="df-tag">${cMap['quality'] || '-'} / 5</span></td>
                                            <td><span class="df-tag">${cMap['innovation'] || '-'} / 5</span></td>
                                            <td class="text-muted" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(s.comment || 'None')}</td>
                                            <td><button class="btn-secondary load-score-btn" data-pid="${s.project_id}" style="height: 26px; padding: 0 8px; font-size: 10px;">[ LOAD ]</button></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Event Listeners:
            // Project select
            document.getElementById('project-selector').addEventListener('change', (e) => {
                selectedProjectIndex = parseInt(e.target.value);
                renderConsole();
            });

            // Prev / Next
            document.getElementById('prev-project-btn')?.addEventListener('click', () => {
                if (selectedProjectIndex > 0) {
                    selectedProjectIndex--;
                    renderConsole();
                }
            });
            document.getElementById('next-project-btn')?.addEventListener('click', () => {
                if (selectedProjectIndex < allProjects.length - 1) {
                    selectedProjectIndex++;
                    renderConsole();
                }
            });

            // Rubric Stepper Buttons
            document.querySelectorAll('.df-stepper-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const row = e.target.closest('.df-stepper-row');
                    const criterion = row.dataset.criterion;
                    const val = parseInt(e.target.dataset.val);
                    rubricScores[criterion] = val;

                    row.querySelectorAll('.df-stepper-btn').forEach(b => b.classList.remove('selected'));
                    e.target.classList.add('selected');

                    // Recalculate live composite
                    let sum = 0, tw = 0;
                    for (const [k, v] of Object.entries(rubricScores)) {
                        const w = rubricWeights[k] || 1.0;
                        sum += w * v;
                        tw += w;
                    }
                    const comp = (sum / tw).toFixed(2);
                    document.getElementById('live-composite-score').innerHTML = `${comp} <span style="font-size: 13px; color: var(--text-muted); font-family: var(--font-mono);">/ 5.00</span>`;
                });
            });

            // Evaluation Form Submission
            document.getElementById('evaluation-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('submit-score-btn');
                const msg = document.getElementById('eval-msg');
                btn.disabled = true;
                btn.textContent = '[ TRANSMITTING SCORECARD... ]';

                try {
                    const postRes = await fetch('/api/judge/scores', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            projectId: currentProj.id,
                            criteria: rubricScores,
                            comment: document.getElementById('judge-comment').value.trim()
                        })
                    });

                    const postData = await postRes.json();

                    if (!postRes.ok) {
                        throw new Error(postData.error || 'Submission failed');
                    }

                    msg.innerHTML = `<div style="padding: var(--sp-2) var(--sp-3); background: rgba(0, 229, 163, 0.1); border: 1px solid var(--color-success); color: var(--color-success);">[ SUCCESS: Scorecard recorded (${postData.scoreId}) ]</div>`;
                    setTimeout(() => {
                        initJudge();
                    }, 1200);
                } catch (err) {
                    msg.innerHTML = `<div style="padding: var(--sp-2) var(--sp-3); background: rgba(255, 51, 75, 0.1); border: 1px solid var(--color-error); color: var(--color-error);">[ ERROR: ${err.message} ]</div>`;
                    btn.disabled = false;
                    btn.textContent = '[ TRANSMIT OFFICIAL SCORECARD ]';
                }
            });

            // Load score button from history table
            document.querySelectorAll('.load-score-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pid = btn.dataset.pid;
                    const idx = allProjects.findIndex(p => p.id === pid);
                    if (idx !== -1) {
                        selectedProjectIndex = idx;
                        renderConsole();
                    }
                });
            });

            // Peer Isolation Security Probe Button
            document.getElementById('probe-peer-btn').addEventListener('click', async () => {
                const box = document.getElementById('probe-result-box');
                box.style.display = 'block';
                box.innerHTML = `<span class="df-tag">[ SENDING UNAUTHORIZED PEER QUERY: GET /api/judge/scores?judge=judge_a ]</span>`;

                try {
                    const probeRes = await fetch('/api/judge/scores?judge=judge_a', {
                        headers: { 'Accept': 'application/json' }
                    });
                    const probeData = await probeRes.json();

                    if (probeRes.status === 403) {
                        box.innerHTML = `
                            <div style="padding: var(--sp-4); background-color: rgba(0, 229, 163, 0.1); border: 1px solid var(--color-success); border-radius: var(--radius-sm);">
                                <span class="df-tag" style="color: var(--color-success)">✓ BACKEND ROLE ISOLATION VERIFIED (HTTP 403)</span>
                                <p class="text-small" style="margin-top: var(--sp-2);">Server Response: <code>${probeData.error}</code></p>
                                <p class="text-small text-muted" style="margin-top: 4px;">Security Audit Log: An UNAUTHORIZED_PEER_PROBE security event was written to the immutable audit ledger.</p>
                            </div>
                        `;
                    } else {
                        box.innerHTML = `
                            <div style="padding: var(--sp-4); background-color: rgba(255, 51, 75, 0.1); border: 1px solid var(--color-error); border-radius: var(--radius-sm);">
                                <span class="df-tag" style="color: var(--color-error)">⚠ PROBE RETURNED ${probeRes.status}</span>
                                <p class="text-small">Result: ${JSON.stringify(probeData)}</p>
                            </div>
                        `;
                    }
                } catch (e) {
                    box.innerHTML = `<span class="df-tag" style="color: var(--color-error)">[ PROBE FAILED: ${e.message} ]</span>`;
                }
            });
        }

        renderConsole();

    } catch (err) {
        container.innerHTML = `<div class="df-card"><div class="df-card__body"><span class="df-tag" style="color: var(--color-error)">[ ERROR: ${err.message} ]</span></div></div>`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
