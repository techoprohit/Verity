/**
 * Phase 7: T4 Stretch Features & Developer Tools
 * Cryptographically signed certificates, embeddable widget generator,
 * interactive REST API explorer, and bulk JSON data snapshots.
 */

export async function renderTools() {
    return `
        <div class="df-header-block">
            <div class="df-section-title-wrap">
                <span class="df-ordinal">05</span>
                <div>
                    <h2>Developer Tools & T4 Stretch Engine</h2>
                    <p class="text-muted">Cryptographic certification, embeddable components, REST API explorer, and data interoperability.</p>
                </div>
            </div>
            <div>
                <span class="df-tag" style="color: var(--color-success);">[ T4 CAPABILITIES ACTIVE ]</span>
            </div>
        </div>

        <!-- Tool Navigation Tabs -->
        <div class="df-track-strip" style="margin-bottom: var(--sp-6);">
            <div class="df-track-pills" id="tools-tabs">
                <button class="df-pill active" data-tab="certificates">📜 SIGNED CERTIFICATES</button>
                <button class="df-pill" data-tab="widget">🧩 EMBED WIDGET</button>
                <button class="df-pill" data-tab="api">⚡ REST API EXPLORER</button>
                <button class="df-pill" data-tab="backup">💾 DATA BACKUP</button>
            </div>
        </div>

        <div id="tools-tab-content">
            <!-- Dynamic Tab Content Rendered Here -->
        </div>
    `;
}

export async function initTools() {
    const tabsContainer = document.getElementById('tools-tabs');
    const contentContainer = document.getElementById('tools-tab-content');

    let activeTab = 'certificates';

    function renderTab(tab) {
        tabsContainer.querySelectorAll('.df-pill').forEach(btn => {
            if (btn.dataset.tab === tab) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (tab === 'certificates') {
            renderCertificatesTab();
        } else if (tab === 'widget') {
            renderWidgetTab();
        } else if (tab === 'api') {
            renderApiTab();
        } else if (tab === 'backup') {
            renderBackupTab();
        }
    }

    tabsContainer.querySelectorAll('.df-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeTab = e.currentTarget.dataset.tab;
            renderTab(activeTab);
        });
    });

    // -------------------------------------------------------------
    // TAB 1: Cryptographically Signed Certificates
    // -------------------------------------------------------------
    function renderCertificatesTab() {
        contentContainer.innerHTML = `
            <div class="df-card" style="margin-bottom: var(--sp-6);">
                <div class="df-card__header">
                    <span class="df-tag">[ CERTIFICATE ISSUANCE SYSTEM ]</span>
                    <span class="df-tag" style="color: var(--color-success)">HMAC-SHA256 SIGNED</span>
                </div>
                <div class="df-card__body">
                    <p class="text-muted">Issue and verify cryptographically signed participation and judging credentials. Every certificate embeds a tamper-proof cryptographic signature validated against the Verity kernel.</p>
                    <div style="display: flex; gap: var(--sp-4); align-items: flex-end; flex-wrap: wrap; margin-top: var(--sp-4);">
                        <div style="flex: 1; min-width: 250px;">
                            <label class="df-tag" style="display: block; margin-bottom: 6px;">SELECT RECIPIENT ENTITY</label>
                            <select id="cert-user-select" class="df-input">
                                <option value="jdg_01">Tomas Varga (Judge - Accessibility)</option>
                                <option value="jdg_02">Wei Lindqvist (Judge - Data & Analytics)</option>
                                <option value="jdg_03">Priya Nair (Judge - Accessibility)</option>
                                <option value="usr_tm_01_0">priya1 (Participant - Team Nightshift)</option>
                                <option value="org_01">Verity Organizer (Event Administrator)</option>
                            </select>
                        </div>
                        <button class="btn-primary" id="generate-cert-btn">[ GENERATE SIGNED CREDENTIAL ]</button>
                    </div>
                </div>
            </div>

            <div id="certificate-output" style="display: none;"></div>
        `;

        document.getElementById('generate-cert-btn').addEventListener('click', async () => {
            const userId = document.getElementById('cert-user-select').value;
            const output = document.getElementById('certificate-output');
            output.style.display = 'block';
            output.innerHTML = `<span class="df-tag">[ COMPUTING CRYPTOGRAPHIC SIGNATURE... ]</span>`;

            try {
                const res = await fetch(`/api/certificates/${userId}`);
                if (!res.ok) throw new Error('Failed to generate certificate');
                const cert = await res.json();

                output.innerHTML = `
                    <div class="df-card" id="cert-card" style="border: 2px solid var(--brand-accent); background: linear-gradient(135deg, #0B1020 0%, #131C36 100%); padding: var(--sp-8); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -30px; right: -30px; width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(0,229,208,0.15) 0%, transparent 70%);"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-strong); padding-bottom: var(--sp-4); margin-bottom: var(--sp-6);">
                            <div>
                                <span class="df-tag" style="color: var(--brand-accent);">VERITY ACCREDITATION AUTHORITY</span>
                                <h2 style="font-size: 26px; margin-top: 8px; letter-spacing: 0.05em;">CERTIFICATE OF PARTICIPATION</h2>
                                <span class="text-small text-muted">EVENT: ${escapeHtml(cert.eventName)} (${escapeHtml(cert.eventId)})</span>
                            </div>
                            <div style="text-align: right;">
                                <span class="df-tag" style="color: var(--color-success);">ID: ${cert.id}</span>
                                <div class="text-small text-muted" style="margin-top: 4px;">Issued: ${new Date(cert.issuedAt).toUTCString()}</div>
                            </div>
                        </div>

                        <div style="text-align: center; margin: var(--sp-8) 0;">
                            <p class="text-muted" style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">This officially certifies that</p>
                            <h1 style="font-size: 32px; color: var(--text-primary); margin: var(--sp-3) 0; font-family: var(--font-display);">${escapeHtml(cert.recipientName)}</h1>
                            <p class="df-tag" style="color: var(--brand-pink); font-size: 13px;">[ ${cert.details.honorific.toUpperCase()} ]</p>
                            <p class="text-secondary" style="max-width: 600px; margin: var(--sp-4) auto; line-height: 1.6;">
                                ${cert.role === 'judge' 
                                    ? `Successfully adjudicated ${cert.details.evaluationsCompleted} project submissions under isolated multi-criteria scoring protocols across the following tracks: <strong>${cert.details.assignedTracks.join(', ')}</strong>.`
                                    : cert.role === 'participant'
                                    ? `Successfully engineered and finalized project submission <strong>"${escapeHtml(cert.details.projectTitle)}"</strong> representing team <strong>${escapeHtml(cert.details.teamName)}</strong> in the <strong>${escapeHtml(cert.details.track)}</strong> category.`
                                    : `Administered and supervised the DOGFOOD 2026 hackathon portal.`
                                }
                            </p>
                        </div>

                        <div style="border-top: 1px solid var(--border-strong); padding-top: var(--sp-6); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--sp-4);">
                            <div>
                                <span class="df-tag" style="color: var(--brand-accent);">HMAC-SHA256 AUTHENTICITY SEAL</span>
                                <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); word-break: break-all; max-width: 480px; margin-top: 4px;">
                                    ${cert.signature}
                                </div>
                            </div>
                            <div style="display: flex; gap: var(--sp-3);">
                                <button class="btn-secondary" id="verify-sig-btn">[ VERIFY AUTHENTICITY ]</button>
                                <button class="btn-primary" onclick="window.print()">[ PRINT / EXPORT PDF ]</button>
                            </div>
                        </div>

                        <div id="verify-result-msg" style="margin-top: var(--sp-4); font-size: 12px; display: none;"></div>
                    </div>
                `;

                document.getElementById('verify-sig-btn').addEventListener('click', async () => {
                    const msg = document.getElementById('verify-result-msg');
                    msg.style.display = 'block';
                    msg.innerHTML = `<span class="df-tag">[ QUERYING VERITY ROOT AUTHORITY... ]</span>`;

                    try {
                        const vRes = await fetch('/api/certificates/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cert)
                        });
                        const vData = await vRes.json();

                        if (vData.valid) {
                            msg.innerHTML = `
                                <div style="padding: var(--sp-3); background: rgba(0, 229, 163, 0.15); border: 1px solid var(--color-success); color: var(--color-success); border-radius: var(--radius-sm);">
                                    ✓ SIGNATURE VALIDATED: Verified against Verity cryptographic keystore. No tamper detected.
                                </div>
                            `;
                        } else {
                            msg.innerHTML = `
                                <div style="padding: var(--sp-3); background: rgba(255, 51, 75, 0.15); border: 1px solid var(--color-error); color: var(--color-error); border-radius: var(--radius-sm);">
                                    ✗ VERIFICATION FAILED: ${vData.error}
                                </div>
                            `;
                        }
                    } catch (e) {
                        msg.innerHTML = `<span class="text-error">[ ERROR: ${e.message} ]</span>`;
                    }
                });

            } catch (err) {
                output.innerHTML = `<span class="df-tag" style="color: var(--color-error)">[ ERROR: ${err.message} ]</span>`;
            }
        });
    }

    // -------------------------------------------------------------
    // TAB 2: Embeddable Gallery Widget
    // -------------------------------------------------------------
    function renderWidgetTab() {
        const origin = window.location.origin;
        contentContainer.innerHTML = `
            <div class="df-card" style="margin-bottom: var(--sp-6);">
                <div class="df-card__header">
                    <span class="df-tag">[ EMBEDDABLE GALLERY WIDGET GENERATOR ]</span>
                    <span class="df-tag" style="color: var(--brand-accent)">STANDALONE IFRAME</span>
                </div>
                <div class="df-card__body">
                    <p class="text-muted">Generate a zero-dependency, self-contained interactive project gallery widget designed to embed in external event landing pages, Discord bots, or partner websites.</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--sp-4); margin: var(--sp-4) 0;">
                        <div>
                            <label class="df-tag" style="display: block; margin-bottom: 6px;">DISPLAY LIMIT</label>
                            <select id="widget-limit-select" class="df-input">
                                <option value="4">4 Projects</option>
                                <option value="8" selected>8 Projects</option>
                                <option value="12">12 Projects</option>
                            </select>
                        </div>
                    </div>

                    <label class="df-tag" style="display: block; margin-bottom: 6px;">HTML EMBED CODE</label>
                    <div style="display: flex; gap: var(--sp-3);">
                        <input type="text" id="widget-code-input" class="df-input" readonly value='<iframe src="${origin}/embed/gallery?limit=8" width="100%" height="450" frameborder="0"></iframe>' style="font-size: 11px;" />
                        <button class="btn-primary" id="copy-widget-code-btn" style="white-space: nowrap;">[ COPY HTML ]</button>
                    </div>
                </div>
            </div>

            <!-- Live Widget Preview -->
            <div class="df-header-block">
                <h3>Live Widget Preview</h3>
                <span class="df-tag">[ RENDER TARGET ]</span>
            </div>
            <div style="border: 1px solid var(--border-default); border-radius: var(--radius-sm); overflow: hidden; background: #0B1020;">
                <iframe id="widget-preview-frame" src="/embed/gallery?limit=8" width="100%" height="420" frameborder="0"></iframe>
            </div>
        `;

        const limitSelect = document.getElementById('widget-limit-select');
        const codeInput = document.getElementById('widget-code-input');
        const previewFrame = document.getElementById('widget-preview-frame');
        const copyBtn = document.getElementById('copy-widget-code-btn');

        limitSelect.addEventListener('change', () => {
            const lim = limitSelect.value;
            const src = `/embed/gallery?limit=${lim}`;
            codeInput.value = `<iframe src="${origin}${src}" width="100%" height="450" frameborder="0"></iframe>`;
            previewFrame.src = src;
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeInput.value);
            copyBtn.textContent = '[ COPIED! ]';
            setTimeout(() => copyBtn.textContent = '[ COPY HTML ]', 2000);
        });
    }

    // -------------------------------------------------------------
    // TAB 3: Interactive REST API Explorer
    // -------------------------------------------------------------
    function renderApiTab() {
        const endpoints = [
            { method: 'GET', path: '/projects', desc: 'Browse public gallery submissions with search and track filtering', auth: 'None' },
            { method: 'GET', path: '/projects/:id', desc: 'Fetch single project details and metadata', auth: 'None' },
            { method: 'GET', path: '/projects/my-submission', desc: 'Retrieve team draft and event cutoff status', auth: 'Participant' },
            { method: 'POST', path: '/projects/new', desc: 'Submit or edit project draft (enforces cutoff)', auth: 'Participant' },
            { method: 'GET', path: '/api/judge/scores', desc: 'Retrieve judge scorecards (enforces peer isolation)', auth: 'Judge / Organizer' },
            { method: 'POST', path: '/api/judge/scores', desc: 'Submit multi-criteria weighted scorecard', auth: 'Judge' },
            { method: 'GET', path: '/api/dashboard', desc: 'Live event telemetry and evaluation progress', auth: 'Organizer' },
            { method: 'GET', path: '/api/organizer/rankings', desc: 'Cross-judge Z-score normalized project rankings', auth: 'Organizer' },
            { method: 'GET', path: '/api/export.csv', desc: 'Download RFC 4180 CSV export of normalized standings', auth: 'Organizer' },
            { method: 'GET', path: '/api/certificates/:userId', desc: 'Generate cryptographically signed HMAC credential', auth: 'None' },
            { method: 'POST', path: '/api/certificates/verify', desc: 'Verify cryptographic signature against server registry', auth: 'None' },
            { method: 'GET', path: '/api/backup/export', desc: 'Full event database snapshot in RFC JSON format', auth: 'None' }
        ];

        contentContainer.innerHTML = `
            <div class="df-card" style="margin-bottom: var(--sp-6);">
                <div class="df-card__header">
                    <span class="df-tag">[ OPENAPI / REST SPECIFICATION ]</span>
                    <span class="df-tag" style="color: var(--color-success)">12 DOCUMENTED ENDPOINTS</span>
                </div>
                <div class="df-card__body">
                    <p class="text-muted">Test any Verity API endpoint in real-time. Requests are dispatched directly with your active session credentials, testing backend validation and role isolation rules.</p>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: var(--sp-4);">
                ${endpoints.map((ep, idx) => `
                    <div class="df-card">
                        <div class="df-card__header" style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: var(--sp-3);">
                                <span class="df-tag" style="background: var(--surface-raised); color: ${ep.method === 'GET' ? 'var(--brand-accent)' : 'var(--brand-pink)'}; font-weight: 800;">
                                    ${ep.method}
                                </span>
                                <code style="color: var(--text-primary); font-size: 13px;">${ep.path}</code>
                            </div>
                            <span class="df-tag">AUTH: ${ep.auth}</span>
                        </div>
                        <div class="df-card__body">
                            <p class="text-muted" style="margin-bottom: var(--sp-3);">${ep.desc}</p>
                            <div style="display: flex; justify-content: flex-end;">
                                <button class="btn-secondary api-try-btn" data-method="${ep.method}" data-path="${ep.path}" data-idx="${idx}" style="height: 30px; font-size: 11px;">
                                    [ EXECUTE REQUEST ]
                                </button>
                            </div>
                            <div class="api-result-box" id="api-result-${idx}" style="display: none; margin-top: var(--sp-3);"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.api-try-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget;
                const method = target.dataset.method;
                let path = target.dataset.path;
                const idx = target.dataset.idx;
                const resultBox = document.getElementById(`api-result-${idx}`);

                resultBox.style.display = 'block';
                resultBox.innerHTML = `<span class="df-tag">[ DISPATCHING ${method} ${path}... ]</span>`;

                // Handle path parameters for test execution
                if (path === '/projects/:id') path = '/projects/prj_01';
                if (path === '/api/certificates/:userId') path = '/api/certificates/jdg_01';

                try {
                    const fetchOpts = {
                        method: method,
                        headers: { 'Accept': 'application/json' }
                    };
                    if (method === 'POST') {
                        fetchOpts.headers['Content-Type'] = 'application/json';
                        if (path === '/api/certificates/verify') {
                            fetchOpts.body = JSON.stringify({ id: 'probe', userId: 'jdg_01', signature: 'test' });
                        } else {
                            fetchOpts.body = JSON.stringify({ testProbe: true });
                        }
                    }

                    const start = performance.now();
                    const res = await fetch(path, fetchOpts);
                    const elapsed = Math.round(performance.now() - start);

                    const statusColor = res.status < 300 ? 'var(--color-success)' : res.status < 500 ? 'var(--color-warning)' : 'var(--color-error)';
                    let bodyText = '';
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const json = await res.json();
                        bodyText = JSON.stringify(json, null, 2);
                    } else {
                        bodyText = await res.text();
                        if (bodyText.length > 500) bodyText = bodyText.slice(0, 500) + '\n... [truncated]';
                    }

                    resultBox.innerHTML = `
                        <div style="background: var(--surface-raised); border: 1px solid var(--border-default); padding: var(--sp-3); border-radius: var(--radius-sm);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px;">
                                <span style="color: ${statusColor}; font-weight: 700;">HTTP ${res.status} ${res.statusText}</span>
                                <span class="text-muted">${elapsed} ms</span>
                            </div>
                            <pre style="color: var(--text-secondary); font-size: 11px; max-height: 200px; overflow-y: auto;">${escapeHtml(bodyText)}</pre>
                        </div>
                    `;
                } catch (err) {
                    resultBox.innerHTML = `<span class="df-tag" style="color: var(--color-error)">[ FAILED: ${err.message} ]</span>`;
                }
            });
        });
    }

    // -------------------------------------------------------------
    // TAB 4: Bulk Data Snapshot
    // -------------------------------------------------------------
    function renderBackupTab() {
        contentContainer.innerHTML = `
            <div class="df-card">
                <div class="df-card__header">
                    <span class="df-tag">[ DATA PORTABILITY & ADOPTION SNAPSHOT ]</span>
                    <span class="df-tag" style="color: var(--color-success)">ZERO-LOCKIN</span>
                </div>
                <div class="df-card__body">
                    <p class="text-muted">Per DOGFOOD 2026 adoption specifications, all hackathon metadata, tracks, rubrics, projects, scorecards, and audit logs are fully exportable in standard RFC-compliant JSON with zero proprietary dependencies.</p>
                    
                    <div style="margin: var(--sp-6) 0; display: flex; gap: var(--sp-4); flex-wrap: wrap;">
                        <a href="/api/backup/export" class="btn-primary" download style="text-decoration: none; display: inline-flex; align-items: center;">
                            [ 💾 DOWNLOAD COMPLETE EVENT SNAPSHOT (JSON) ]
                        </a>
                        <a href="/api/export.csv" class="btn-secondary" download="verity-normalized.csv" style="text-decoration: none; display: inline-flex; align-items: center;">
                            [ 📊 DOWNLOAD NORMALIZED STANDINGS (CSV) ]
                        </a>
                    </div>

                    <div style="background: var(--surface-raised); border: 1px solid var(--border-subtle); padding: var(--sp-4); border-radius: var(--radius-sm); font-size: 12px;">
                        <span class="df-tag" style="color: var(--brand-accent);">INCLUDED DATA STRUCTURES:</span>
                        <ul style="margin: var(--sp-2) 0 0 var(--sp-6); color: var(--text-secondary); line-height: 1.6;">
                            <li>Event Configuration & Submissions Cutoff metadata</li>
                            <li>Registered Competition Tracks & Descriptions</li>
                            <li>Multi-Criteria Rubric weights & evaluation thresholds</li>
                            <li>All Project Submissions (metadata, repos, demo URLs, team links)</li>
                            <li>Judge scorecards & individual criteria evaluations</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
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

    // Initial tab
    renderTab(activeTab);
}
