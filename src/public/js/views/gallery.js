/**
 * Phase 2: Public Gallery View
 * High-performance project discovery, track filtering, and detail modal.
 */

export async function renderGallery() {
    return `
        <div class="df-header-block">
            <div>
                <h2>Public Gallery</h2>
                <p class="text-muted">Browse verified project submissions across all hackathon tracks.</p>
            </div>
            <div>
                <span class="df-tag" id="gallery-count">[ 0 ENTRIES ]</span>
            </div>
        </div>
        
        <div class="df-filter-bar">
            <div class="df-filter-top">
                <div class="df-search-wrap">
                    <input type="text" id="gallery-search" class="df-input" placeholder="Search by title, team, or keywords..." autocomplete="off" />
                </div>
                <div class="text-small text-muted" id="filter-status-tag">
                    <span class="df-tag">FILTER: ALL TRACKS</span>
                </div>
            </div>
            <div class="df-track-strip">
                <div class="df-track-pills" id="track-filters">
                    <button class="df-pill active" data-track="all">ALL TRACKS</button>
                    <!-- Track pills injected dynamically -->
                </div>
            </div>
        </div>

        <div id="gallery-grid" class="df-grid">
            <div class="df-tag">[ LOADING PROJECTS... ]</div>
        </div>

        <!-- Project Detail Modal Container -->
        <div id="project-modal-container" style="display: none;"></div>
    `;
}

export async function initGallery() {
    const grid = document.getElementById('gallery-grid');
    const trackFilters = document.getElementById('track-filters');
    const searchInput = document.getElementById('gallery-search');
    const countTag = document.getElementById('gallery-count');
    const statusTag = document.getElementById('filter-status-tag');
    const modalContainer = document.getElementById('project-modal-container');
    
    let allProjects = [];
    let currentTrack = 'all';

    try {
        const res = await fetch('/projects?limit=100', {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) throw new Error('Failed to load gallery');
        
        const data = await res.json();
        allProjects = data.projects || [];
        
        // Render Track Pills cleanly
        let pillsHtml = '<button class="df-pill active" data-track="all">ALL TRACKS</button>';
        (data.tracks || []).forEach(track => {
            pillsHtml += `<button class="df-pill" data-track="${track.id}">${track.name.toUpperCase()}</button>`;
        });
        trackFilters.innerHTML = pillsHtml;

        // Add pill click listeners
        trackFilters.querySelectorAll('.df-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                trackFilters.querySelectorAll('.df-pill').forEach(p => p.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                currentTrack = target.dataset.track;
                const trackName = target.textContent.trim();
                statusTag.innerHTML = `<span class="df-tag">FILTER: ${trackName}</span>`;
                filterAndRender();
            });
        });

        // Add search listener
        searchInput.addEventListener('input', filterAndRender);

        // Initial render of projects
        filterAndRender();

    } catch (err) {
        grid.innerHTML = `<div class="df-card"><div class="df-card__body"><span class="df-tag" style="color: var(--color-error)">[ ERROR: ${err.message} ]</span></div></div>`;
    }

    function filterAndRender() {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = allProjects.filter(p => {
            const matchesTrack = currentTrack === 'all' || p.track_id === currentTrack;
            const matchesSearch = !query || 
                (p.title && p.title.toLowerCase().includes(query)) || 
                (p.team_name && p.team_name.toLowerCase().includes(query)) ||
                (p.summary && p.summary.toLowerCase().includes(query));
            return matchesTrack && matchesSearch;
        });

        countTag.textContent = `[ ${filtered.length} ENTRIES ]`;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="df-card" style="grid-column: 1 / -1; padding: var(--sp-8); text-align: center;">
                    <p class="text-muted">No projects matched your criteria.</p>
                    <span class="df-tag">[ ZERO RESULTS ]</span>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(p => `
            <div class="df-card interactive" data-id="${p.id}">
                <div class="df-card__header">
                    <span class="df-tag">[ TRACK / ${(p.track_name || 'GENERAL').toUpperCase()} ]</span>
                    <span class="df-tag" style="color: var(--color-success)">VERIFIED</span>
                </div>
                <div class="df-card__body">
                    <h3>${escapeHtml(p.title)}</h3>
                    <p>${escapeHtml(p.summary || 'No summary provided.')}</p>
                </div>
                <div class="df-card__footer">
                    <span class="text-muted">Team: ${escapeHtml(p.team_name || 'Independent')}</span>
                    ${p.repo_url ? `<a href="${escapeHtml(p.repo_url)}" target="_blank" rel="noopener" class="df-link" onclick="event.stopPropagation()">[ REPO ↗ ]</a>` : '<span class="text-dim">[ REPO - ]</span>'}
                </div>
            </div>
        `).join('');

        // Attach modal trigger on card click
        grid.querySelectorAll('.df-card.interactive').forEach(card => {
            card.addEventListener('click', () => {
                const projId = card.dataset.id;
                const proj = allProjects.find(p => p.id === projId);
                if (proj) openProjectModal(proj);
            });
        });
    }

    function openProjectModal(p) {
        modalContainer.style.display = 'block';
        modalContainer.innerHTML = `
            <div class="df-modal-backdrop" id="modal-backdrop">
                <div class="df-modal">
                    <div class="df-modal__header">
                        <div>
                            <span class="df-tag" style="color: var(--brand-cyan)">[ PROJECT DOSSIER // ${p.id} ]</span>
                            <h3 style="margin-top: var(--sp-2);">${escapeHtml(p.title)}</h3>
                        </div>
                        <button class="btn-secondary" id="modal-close-btn" style="height: 30px; padding: 0 10px;">[ X ]</button>
                    </div>
                    <div class="df-modal__body">
                        <div>
                            <span class="df-tag">TRACK</span>
                            <p style="margin-top: 4px; color: var(--text-primary); font-weight: 600;">${escapeHtml(p.track_name)}</p>
                        </div>
                        <div>
                            <span class="df-tag">SUBMISSION TEAM</span>
                            <p style="margin-top: 4px; color: var(--text-primary);">${escapeHtml(p.team_name)}</p>
                        </div>
                        <div>
                            <span class="df-tag">EXECUTIVE SUMMARY</span>
                            <p style="margin-top: 4px; color: var(--text-secondary); line-height: 1.6;">${escapeHtml(p.summary || 'No summary provided.')}</p>
                        </div>
                        <div style="display: flex; gap: var(--sp-6); flex-wrap: wrap;">
                            <div>
                                <span class="df-tag">REPOSITORY</span>
                                <p style="margin-top: 4px;">
                                    ${p.repo_url ? `<a href="${escapeHtml(p.repo_url)}" target="_blank" rel="noopener" class="df-link">${escapeHtml(p.repo_url)} ↗</a>` : '<span class="text-dim">Not provided</span>'}
                                </p>
                            </div>
                            <div>
                                <span class="df-tag">DEMO URL</span>
                                <p style="margin-top: 4px;">
                                    ${p.demo_url ? `<a href="${escapeHtml(p.demo_url)}" target="_blank" rel="noopener" class="df-link">${escapeHtml(p.demo_url)} ↗</a>` : '<span class="text-dim">Not provided</span>'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <span class="df-tag">SUBMITTED TIMESTAMP</span>
                            <p style="margin-top: 4px; font-size: 11px;" class="text-muted">${p.submitted_at ? new Date(p.submitted_at).toUTCString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div class="df-modal__footer">
                        <button class="btn-secondary" id="modal-close-action">CLOSE DOSSIER</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => {
            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';
        };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('modal-close-action').addEventListener('click', closeModal);
        document.getElementById('modal-backdrop').addEventListener('click', (e) => {
            if (e.target.id === 'modal-backdrop') closeModal();
        });
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
