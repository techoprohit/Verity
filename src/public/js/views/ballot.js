/**
 * Community Voting Ballot View
 */

export const renderBallot = async () => `
    <div class="df-card">
        <div class="df-card__header">
            <h2>Community Voting</h2>
            <div class="df-status-dot" style="background-color: var(--color-success)"></div>
        </div>
        <div class="df-card__body">
            <p style="margin-bottom: var(--sp-4);">
                Vote for your favorite project. Projects are presented in a randomized order to ensure fairness.
                You can only vote once per event.
            </p>
            <div id="ballot-email-container" style="margin-bottom: var(--sp-6);">
                <label class="df-form-label">Verify Email to Vote</label>
                <div style="display: flex; gap: var(--sp-2);">
                    <input type="email" id="voter-email" class="df-input" placeholder="you@example.com" style="max-width: 300px;">
                </div>
            </div>
            
            <div id="ballot-projects" class="gallery">
                <div style="padding: var(--sp-8); text-align: center; color: var(--text-muted);">
                    Loading ballot...
                </div>
            </div>
        </div>
    </div>
`;

export const initBallot = async () => {
    const container = document.getElementById('ballot-projects');
    const emailInput = document.getElementById('voter-email');

    // Auto-fill email if logged in
    const user = window.VeritySession;
    if (user && user.email) {
        emailInput.value = user.email;
        emailInput.disabled = true;
    }

    try {
        const res = await fetch('/api/ballot');
        if (!res.ok) throw new Error('Failed to load ballot');
        const projects = await res.json();
        
        if (projects.length === 0) {
            container.innerHTML = '<p class="text-muted">No submitted projects available for voting.</p>';
            return;
        }

        container.innerHTML = projects.map(p => `
            <div class="project-card df-card" style="margin-bottom: var(--sp-4);">
                <div class="df-card__header">
                    <h3>${escapeHtml(p.title)}</h3>
                    <span class="df-tag">${escapeHtml(p.track_name)}</span>
                </div>
                <div class="df-card__body">
                    <p>${escapeHtml(p.summary || 'No summary provided.')}</p>
                    <p class="text-muted" style="font-size: 11px; margin-top: var(--sp-2);">By Team: ${escapeHtml(p.team_name)}</p>
                </div>
                <div class="df-card__footer">
                    <button class="btn-primary vote-btn" data-id="${p.id}" style="width: 100%;">CAST VOTE</button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const projectId = e.target.dataset.id;
                const email = emailInput.value.trim();
                
                if (!email) {
                    alert('Please enter your email to vote.');
                    emailInput.focus();
                    return;
                }

                e.target.disabled = true;
                e.target.textContent = 'VOTING...';

                try {
                    const voteRes = await fetch('/api/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ project_id: projectId, voter_email: email })
                    });
                    
                    const data = await voteRes.json();
                    if (!voteRes.ok) throw new Error(data.error || 'Failed to vote');
                    
                    alert('Vote cast successfully!');
                    
                    // Disable all vote buttons after a successful vote
                    document.querySelectorAll('.vote-btn').forEach(b => {
                        b.disabled = true;
                        b.textContent = b.dataset.id === projectId ? 'VOTED' : 'CLOSED';
                    });
                } catch (err) {
                    alert(err.message);
                    e.target.disabled = false;
                    e.target.textContent = 'CAST VOTE';
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="text-error">${err.message}</p>`;
    }
};

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
