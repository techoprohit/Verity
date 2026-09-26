/**
 * Phase 5: Organizer Console & Live Deliberation Dashboard
 * Real-time judge progress tracking, Z-score normalized standings,
 * RFC 4180 CSV export, and security audit log streams.
 */

export async function renderConsole() {
    return `
        <div class="df-header-block">
            <div>
                <h2>Organizer Console</h2>
                <p class="text-muted">Live event telemetry, cross-judge normalization rankings, and governance controls.</p>
            </div>
            <div>
                <span class="df-tag" id="org-role-badge">[ AUTH: VERIFYING... ]</span>
            </div>
        </div>
        <div id="console-content">
            <div class="df-tag">[ INITIALIZING DASHBOARD TELEMETRY... ]</div>
        </div>
    `;
}

export async function initConsole() {
    const container = document.getElementById('console-content');
    const roleBadge = document.getElementById('org-role-badge');

    try {
        const dashRes = await fetch('/api/dashboard', {
            headers: { 'Accept': 'application/json' }
        });

        if (dashRes.status === 403) {
            roleBadge.textContent = '[ AUTH: FORBIDDEN ]';
            container.innerHTML = `
                <div class="df-card" style="border-color: var(--color-error)">
                    <div class="df-card__body">
                        <h3 style="color: var(--color-error)">[ HTTP 403: ORGANIZER RESTRICTED AREA ]</h3>
                        <p>Only users with the <strong style="color: var(--brand-cyan)">ORGANIZER</strong> or <strong style="color: var(--brand-cyan)">ADMIN</strong> role can access the event telemetry dashboard or export scoring data.</p>
                        <p class="text-muted" style="margin-top: var(--sp-4);">To protect judging integrity and prevent unauthorized ballot inspection, public guests, participants, and judges are blocked by backend policy.</p>
                        <div style="margin-top: var(--sp-6);">
                            <button class="btn-primary" id="switch-to-organizer-btn">[ ACT AS: ORGANIZER (org_7f2a) ]</button>
                        </div>
                    </div>
                </div>
            `;
            const switchBtn = document.getElementById('switch-to-organizer-btn');
            if (switchBtn) {
                switchBtn.addEventListener('click', () => {
                    document.cookie = 'session=org_7f2a; path=/';
                    const b = document.getElementById('current-role-badge');
                    if (b) b.textContent = 'ROLE: ORGANIZER';
                    initConsole();
                });
            }
            return;
        }

        if (!dashRes.ok) throw new Error('Failed to load organizer dashboard');

        roleBadge.textContent = '[ AUTH: ORGANIZER ]';
        roleBadge.style.color = 'var(--color-success)';

        const dashboardData = await dashRes.json();

        // Fetch normalized rankings
        let rankings = [];
        try {
            const rankRes = await fetch('/api/organizer/rankings', { headers: { 'Accept': 'application/json' } });
            if (rankRes.ok) {
                const rankData = await rankRes.json();
                rankings = rankData.rankings || [];
            }
        } catch (e) {
            console.error('Rankings load error:', e);
        }

        // Fetch audit logs
        let auditLogs = [];
        try {
            const logsRes = await fetch('/api/organizer/audit-logs', { headers: { 'Accept': 'application/json' } });
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                auditLogs = logsData.logs || [];
            }
        } catch (e) {
            console.error('Audit logs load error:', e);
        }

        container.innerHTML = `
            <!-- Operational Action Strip -->
            <div class="df-dev-banner" style="margin-bottom: var(--sp-8);">
                <div style="display: flex; align-items: center; gap: var(--sp-3);">
                    <span class="df-status-dot"></span>
                    <span class="df-tag" style="color: var(--brand-cyan)">LIVE EVENT CONTROLS</span>
                </div>
                <div style="display: flex; gap: var(--sp-3); flex-wrap: wrap;">
                    <button class="btn-secondary" id="console-toggle-deadline-btn" style="height: 34px; font-size: 11px;">
                        [ ⏳ TOGGLE SUBMISSIONS DEADLINE ]
                    </button>
                    <a href="/api/export.csv" class="btn-primary" style="height: 34px; text-decoration: none; display: inline-flex; align-items: center;" download="verity-export.csv">
                        [ 📥 EXPORT CSV (RFC 4180) ]
                    </a>
                </div>
            </div>
            <div id="deadline-toast" style="display: none; margin-bottom: var(--sp-6);"></div>

            <!-- Metric Overview Cards -->
            <div class="df-metrics-grid">
                <div class="df-metric-card">
                    <span class="df-tag">TOTAL PROJECTS</span>
                    <div class="value">${dashboardData.totalProjects}</div>
                    <span class="text-small text-muted">Submitted Entries</span>
                </div>
                <div class="df-metric-card">
                    <span class="df-tag">VERIFIED JUDGES</span>
                    <div class="value">${dashboardData.totalJudges}</div>
                    <span class="text-small text-muted">Active Evaluators</span>
                </div>
                <div class="df-metric-card">
                    <span class="df-tag">SCORECARDS FILED</span>
                    <div class="value">${dashboardData.totalScores}</div>
                    <span class="text-small text-muted">Multi-Criteria Reviews</span>
                </div>
                <div class="df-metric-card">
                    <span class="df-tag">AVG REVIEWS / ENTRY</span>
                    <div class="value">${dashboardData.completionRate}</div>
                    <span class="text-small text-muted">Evaluation Density</span>
                </div>
            </div>

            <!-- Normalized Standings Table -->
            <div style="margin-bottom: var(--sp-12);">
                <div class="df-header-block">
                    <div>
                        <h3>Cross-Judge Normalized Standings</h3>
                        <p class="text-muted">Calibrated Z-score algorithm removes judge bias and scoring variance (T2 Certified).</p>
                    </div>
                    <div>
                        <span class="df-tag">[ ${rankings.length} RANKED PROJECTS ]</span>
                    </div>
                </div>

                <div class="df-table-container">
                    <table class="df-table">
                        <thead>
                            <tr>
                                <th style="width: 60px;">Rank</th>
                                <th>Project Title</th>
                                <th>Team</th>
                                <th>Track</th>
                                <th>Reviews (M_p)</th>
                                <th>Raw Avg</th>
                                <th>Normalized Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rankings.length === 0 ? `
                                <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: var(--sp-6);">No score data available for normalization yet.</td></tr>
                            ` : rankings.map((r, i) => `
                                <tr>
                                    <td>
                                        <span class="df-tag" style="${i < 3 ? 'color: var(--brand-cyan); font-weight: 800;' : ''}">
                                            #${i + 1}
                                        </span>
                                    </td>
                                    <td style="font-weight: 700; color: var(--text-primary);">${escapeHtml(r.title)}</td>
                                    <td>${escapeHtml(r.teamName)}</td>
                                    <td><span class="df-tag">${escapeHtml(r.trackName.toUpperCase())}</span></td>
                                    <td><span class="df-tag">${r.reviewCount}</span></td>
                                    <td>${r.rawAverage.toFixed(2)}</td>
                                    <td>
                                        <strong style="color: var(--brand-cyan);">${r.normalizedScore.toFixed(2)}</strong>
                                    </td>
                                    <td>
                                        <span class="df-tag" style="color: var(--color-success)">VERIFIED</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Judge Progress Tracking Matrix -->
            <div style="margin-bottom: var(--sp-12);">
                <div class="df-header-block">
                    <div>
                        <h3>Judge Progress Matrix</h3>
                        <p class="text-muted">Real-time status of assigned project evaluation queues per judge.</p>
                    </div>
                    <div>
                        <span class="df-tag">[ ${dashboardData.judgeProgress.length} EVALUATORS ]</span>
                    </div>
                </div>

                <div class="df-table-container">
                    <table class="df-table">
                        <thead>
                            <tr>
                                <th>Judge Name</th>
                                <th>Completed</th>
                                <th>Assigned Tracks</th>
                                <th>Queue Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dashboardData.judgeProgress.map(j => {
                                const pct = j.assigned > 0 ? Math.min(100, Math.round((j.completed / j.assigned) * 100)) : 0;
                                return `
                                    <tr>
                                        <td style="font-weight: 700; color: var(--text-primary);">${escapeHtml(j.name)}</td>
                                        <td><span class="df-tag">${j.completed} scorecards</span></td>
                                        <td><span class="df-tag">${j.assigned} entries</span></td>
                                        <td style="width: 250px;">
                                            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                                                <span>${pct}%</span>
                                                <span class="text-muted">${j.completed}/${j.assigned}</span>
                                            </div>
                                            <div class="df-progress-bar">
                                                <div class="df-progress-fill" style="width: ${pct}%;"></div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Security Audit Ledger Stream -->
            <div>
                <div class="df-header-block">
                    <div>
                        <h3>Security Audit Ledger</h3>
                        <p class="text-muted">Immutable append-only ledger recording all privileged actions and security probes.</p>
                    </div>
                    <div>
                        <span class="df-tag">[ ${auditLogs.length} LOGGED EVENTS ]</span>
                    </div>
                </div>

                <div class="df-table-container">
                    <table class="df-table">
                        <thead>
                            <tr>
                                <th>Timestamp (UTC)</th>
                                <th>Action Code</th>
                                <th>Actor</th>
                                <th>Target Entity</th>
                                <th>Client IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${auditLogs.length === 0 ? `
                                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: var(--sp-6);">No audit records generated yet.</td></tr>
                            ` : auditLogs.map(l => `
                                <tr>
                                    <td class="text-muted" style="font-size: 11px;">${new Date(l.created_at).toISOString().replace('T', ' ').slice(0, 19)}</td>
                                    <td>
                                        <span class="df-tag" style="${l.action.includes('UNAUTHORIZED') ? 'color: var(--color-error);' : 'color: var(--brand-cyan);'}">
                                            ${escapeHtml(l.action)}
                                        </span>
                                    </td>
                                    <td>${escapeHtml(l.actor_name || l.actor_id || 'System / Anonymous')}</td>
                                    <td>${escapeHtml(l.entity_type || '-')}${l.entity_id ? `:${l.entity_id}` : ''}</td>
                                    <td class="text-muted">${escapeHtml(l.ip_address || '127.0.0.1')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Toggle Deadline Button Listener
        const toggleBtn = document.getElementById('console-toggle-deadline-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async () => {
                toggleBtn.disabled = true;
                toggleBtn.textContent = '[ UPDATING DEADLINE... ]';
                try {
                    const res = await fetch('/api/organizer/toggle-deadline', { method: 'POST' });
                    const resData = await res.json();
                    const toast = document.getElementById('deadline-toast');
                    toast.style.display = 'block';
                    toast.innerHTML = `
                        <div style="padding: var(--sp-3) var(--sp-4); background-color: rgba(0, 229, 163, 0.1); border: 1px solid var(--color-success); border-radius: var(--radius-sm); color: var(--color-success);">
                            [ DEADLINE UPDATED: ${resData.message} — Cutoff: ${resData.submissions_close} ]
                        </div>
                    `;
                    setTimeout(() => {
                        initConsole();
                    }, 1500);
                } catch (e) {
                    alert('Error: ' + e.message);
                    toggleBtn.disabled = false;
                }
            });
        }

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
