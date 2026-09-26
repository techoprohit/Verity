/**
 * Phase 3: Participant Submission Portal
 * Draft saving, editing, live deadline enforcement, and test mode toggle.
 */

export async function renderSubmit() {
    return `
        <div class="df-header-block">
            <div>
                <h2>Participant Portal</h2>
                <p class="text-muted">Draft and finalize your team's hackathon project entry.</p>
            </div>
            <div>
                <span class="df-tag" id="portal-role-tag">[ AUTH: PARTICIPANT ]</span>
            </div>
        </div>
        <div id="submit-content">
            <div class="df-tag">[ LOADING SESSION DATA... ]</div>
        </div>
    `;
}

export async function initSubmit() {
    const container = document.getElementById('submit-content');

    try {
        const res = await fetch('/projects/my-submission', {
            headers: { 'Accept': 'application/json' }
        });

        if (res.status === 403) {
            container.innerHTML = `
                <div class="df-card" style="border-color: var(--color-error)">
                    <div class="df-card__body">
                        <h3 style="color: var(--color-error)">[ HTTP 403: ACCESS DENIED ]</h3>
                        <p>Only authenticated users with the <strong style="color: var(--brand-cyan)">PARTICIPANT</strong> role can draft or edit submissions.</p>
                        <p class="text-muted" style="margin-top: var(--sp-4);">Visitor, Judge, and Organizer roles are isolated from participant draft buffers by backend policy.</p>
                        <div style="margin-top: var(--sp-6);">
                            <button class="btn-primary" id="switch-to-participant-btn">[ SWITCH TO PARTICIPANT ROLE ]</button>
                        </div>
                    </div>
                </div>
            `;
            const switchBtn = document.getElementById('switch-to-participant-btn');
            if (switchBtn) {
                switchBtn.addEventListener('click', () => {
                    document.cookie = 'session=prt_2e88; path=/';
                    const badge = document.getElementById('current-role-badge');
                    if (badge) badge.textContent = 'ROLE: PARTICIPANT';
                    initSubmit();
                });
            }
            return;
        }

        if (!res.ok) throw new Error('Failed to fetch session data.');

        const data = await res.json();
        
        if (!data.hasTeam) {
            container.innerHTML = `
                <div class="df-card" style="border-color: var(--color-warning);">
                    <div class="df-card__body">
                        <h3 style="color: var(--color-warning)">[ NO TEAM MEMBERSHIP FOUND ]</h3>
                        <p class="text-muted">You are not registered in any team. Every hackathon project must be linked to a verified team.</p>
                    </div>
                </div>
            `;
            return;
        }

        const proj = data.project || {};
        const isLocked = data.isClosed;
        
        // Track options
        const trackOptions = (data.tracks || []).map(t => 
            `<option value="${t.id}" ${proj.track_id === t.id ? 'selected' : ''}>${t.name}</option>`
        ).join('');

        const statusBanner = isLocked 
            ? `<div style="padding: var(--sp-4); background-color: rgba(255, 51, 75, 0.1); border: 1px solid var(--color-error); margin-bottom: var(--sp-6); border-radius: var(--radius-sm);">
                 <span class="df-tag" style="color: var(--color-error);">[ SUBMISSIONS CLOSED / ENTRY LOCKED ]</span>
                 <p class="text-small text-muted" style="margin-top: var(--sp-2);">Event Cutoff: <strong>${data.event.submissions_close}</strong> (Server Time Enforced)</p>
                 <p class="text-small" style="color: var(--color-error); margin-top: 4px;">Per DOGFOOD specification, past-deadline submissions are permanently rejected by the backend.</p>
               </div>`
            : `<div style="padding: var(--sp-4); background-color: rgba(0, 229, 163, 0.1); border: 1px solid var(--color-success); margin-bottom: var(--sp-6); border-radius: var(--radius-sm);">
                 <span class="df-tag" style="color: var(--color-success);">[ SUBMISSIONS OPEN / DRAFT EDITABLE ]</span>
                 <p class="text-small text-muted" style="margin-top: var(--sp-2);">Event Cutoff: <strong>${data.event.submissions_close}</strong></p>
               </div>`;

        container.innerHTML = `
            <!-- Testing Override Banner -->
            <div class="df-dev-banner">
                <div>
                    <span class="df-tag" style="color: var(--brand-cyan)">TEST HARNESS</span>
                    <span class="text-small" style="margin-left: 8px;">Current State: <strong>${isLocked ? 'LOCKED (March 2026 Spec Default)' : 'OPEN FOR EDITING'}</strong></span>
                </div>
                <button class="btn-secondary" id="toggle-deadline-btn" style="height: 32px; font-size: 11px;">
                    ${isLocked ? '[ 🔓 REOPEN SUBMISSIONS FOR TESTING ]' : '[ 🔒 RESTORE SPEC DEADLINE (LOCK) ]'}
                </button>
            </div>

            <!-- Team Info Card -->
            <div class="df-card" style="margin-bottom: var(--sp-6);">
                <div class="df-card__header">
                    <span class="df-tag">[ TEAM: ${escapeHtml(data.team.name).toUpperCase()} ]</span>
                    <span class="df-tag" style="color: var(--color-success);">ACTIVE PARTICIPANT</span>
                </div>
                <div class="df-card__body" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--sp-3);">
                    <div>
                        <span class="text-muted">Team Invite Code: </span>
                        <code style="background: var(--surface-raised); padding: 4px 8px; border: 1px solid var(--border-default); color: var(--brand-cyan);">${escapeHtml(data.team.invite_code)}</code>
                    </div>
                    <button class="btn-secondary" id="copy-invite-btn" style="height: 30px; font-size: 11px;">[ COPY INVITE CODE ]</button>
                </div>
            </div>

            ${statusBanner}

            <!-- Project Form -->
            <form id="submission-form" class="df-card" style="border-color: ${isLocked ? 'var(--border-default)' : 'var(--brand-cyan)'}">
                <div class="df-card__header">
                    <span class="df-tag">[ PROJECT SPECIFICATION ]</span>
                    <span class="df-tag">${isLocked ? 'READ-ONLY BUFFER' : 'DRAFT MODE'}</span>
                </div>
                <div class="df-card__body" style="display: flex; flex-direction: column; gap: var(--sp-4);">
                    <div>
                        <label class="df-tag" style="display: block; margin-bottom: 6px;">PROJECT TITLE *</label>
                        <input type="text" id="proj-title" class="df-input" value="${escapeHtml(proj.title || '')}" required ${isLocked ? 'disabled' : ''} placeholder="e.g. Verity Protocol" />
                    </div>
                    
                    <div>
                        <label class="df-tag" style="display: block; margin-bottom: 6px;">ASSIGNED HACKATHON TRACK *</label>
                        <select id="proj-track" class="df-input" ${isLocked ? 'disabled' : ''}>
                            ${trackOptions}
                        </select>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label class="df-tag">ONE-LINE SUMMARY (280 CHARACTERS MAX)</label>
                            <span class="text-small text-muted" id="summary-char-counter">0 / 280</span>
                        </div>
                        <input type="text" id="proj-summary" class="df-input" value="${escapeHtml(proj.summary || '')}" maxlength="280" ${isLocked ? 'disabled' : ''} placeholder="Concise statement of what your solution delivers..." />
                    </div>

                    <div>
                        <label class="df-tag" style="display: block; margin-bottom: 6px;">GITHUB REPOSITORY URL</label>
                        <input type="url" id="proj-repo" class="df-input" value="${escapeHtml(proj.repo_url || '')}" ${isLocked ? 'disabled' : ''} placeholder="https://github.com/..." />
                    </div>

                    <div>
                        <label class="df-tag" style="display: block; margin-bottom: 6px;">DEMO APPLICATION URL</label>
                        <input type="url" id="proj-demo" class="df-input" value="${escapeHtml(proj.demo_url || '')}" ${isLocked ? 'disabled' : ''} placeholder="https://demo.verity.app/..." />
                    </div>
                </div>
                <div class="df-card__footer">
                    ${isLocked 
                        ? `<span class="text-muted"><span class="df-status-dot offline"></span>Editing disabled by server deadline policy. Use test harness above to reopen.</span>`
                        : `<button type="submit" class="btn-primary" id="save-btn">[ SAVE PROJECT DRAFT ]</button>`
                    }
                </div>
                <div id="form-msg" style="padding: 0 var(--sp-4) var(--sp-4); font-size: 12px;"></div>
            </form>
        `;

        // Character counter
        const summaryInput = document.getElementById('proj-summary');
        const counter = document.getElementById('summary-char-counter');
        if (summaryInput && counter) {
            counter.textContent = `${summaryInput.value.length} / 280`;
            summaryInput.addEventListener('input', () => {
                counter.textContent = `${summaryInput.value.length} / 280`;
            });
        }

        // Copy invite code button
        const copyBtn = document.getElementById('copy-invite-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(data.team.invite_code);
                copyBtn.textContent = '[ COPIED! ]';
                setTimeout(() => copyBtn.textContent = '[ COPY INVITE CODE ]', 2000);
            });
        }

        // Toggle Deadline Button
        const toggleBtn = document.getElementById('toggle-deadline-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async () => {
                toggleBtn.disabled = true;
                toggleBtn.textContent = '[ UPDATING DEADLINE... ]';
                try {
                    const toggleRes = await fetch('/api/organizer/toggle-deadline', { method: 'POST' });
                    if (!toggleRes.ok) throw new Error('Failed to toggle deadline');
                    initSubmit();
                } catch (e) {
                    alert('Error: ' + e.message);
                    toggleBtn.disabled = false;
                }
            });
        }

        // Submit Form Handler
        if (!isLocked) {
            document.getElementById('submission-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('save-btn');
                const msg = document.getElementById('form-msg');
                btn.disabled = true;
                btn.textContent = '[ TRANSMITTING... ]';

                try {
                    const postRes = await fetch('/projects/new', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            title: document.getElementById('proj-title').value.trim(),
                            track_id: document.getElementById('proj-track').value,
                            summary: document.getElementById('proj-summary').value.trim(),
                            repo_url: document.getElementById('proj-repo').value.trim(),
                            demo_url: document.getElementById('proj-demo').value.trim()
                        })
                    });

                    const postData = await postRes.json();

                    if (!postRes.ok) {
                        throw new Error(postData.error || 'Validation failed');
                    }

                    msg.innerHTML = `
                        <div style="padding: var(--sp-2) var(--sp-3); background: rgba(0, 229, 163, 0.1); border: 1px solid var(--color-success); color: var(--color-success);">
                            [ SUCCESS: ${postData.message} (ID: ${postData.projectId}) ]
                        </div>
                    `;
                    setTimeout(() => msg.innerHTML = '', 4000);
                } catch (err) {
                    msg.innerHTML = `
                        <div style="padding: var(--sp-2) var(--sp-3); background: rgba(255, 51, 75, 0.1); border: 1px solid var(--color-error); color: var(--color-error);">
                            [ ERROR: ${err.message} ]
                        </div>
                    `;
                } finally {
                    btn.disabled = false;
                    btn.textContent = '[ SAVE PROJECT DRAFT ]';
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
