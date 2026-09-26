/**
 * Verity SPA Router & Session Manager
 * Orchestrates client-side routing, role switching, and view lifecycles.
 */

import { renderGallery, initGallery } from './views/gallery.js';
import { renderSubmit, initSubmit } from './views/submit.js';
import { renderJudge, initJudge } from './views/judge.js';
import { renderConsole, initConsole } from './views/console.js';

// Route Definitions
const views = {
    '/': {
        render: renderGallery,
        init: initGallery,
        title: 'VERITY // GALLERY'
    },
    '/submit': {
        render: renderSubmit,
        init: initSubmit,
        title: 'VERITY // PARTICIPANT PORTAL'
    },
    '/judge': {
        render: renderJudge,
        init: initJudge,
        title: 'VERITY // JUDGING CONSOLE'
    },
    '/console': {
        render: renderConsole,
        init: initConsole,
        title: 'VERITY // ORGANIZER CONSOLE'
    }
};

// Router Navigation
export function navigateTo(url) {
    const targetUrl = new URL(url, location.origin);
    if (location.pathname === targetUrl.pathname && location.search === targetUrl.search) {
        return; // Avoid unnecessary re-render if already on the route
    }
    history.pushState(null, null, targetUrl.pathname + targetUrl.search);
    router();
}

async function router() {
    const root = document.getElementById('app-root');
    const path = location.pathname;
    
    // Find view or default to 404
    const view = views[path] || { 
        render: async () => `
            <div class="df-card" style="border-color: var(--color-error); margin: var(--sp-12) auto; max-width: 600px;">
                <div class="df-card__body" style="text-align: center; padding: var(--sp-8);">
                    <h2 style="color: var(--color-error)">[ 404: ROUTE NOT FOUND ]</h2>
                    <p class="text-muted">The requested path does not map to any active Verity kernel service.</p>
                    <div style="margin-top: var(--sp-6);">
                        <a href="/" class="btn-primary" data-link>[ RETURN TO GALLERY ]</a>
                    </div>
                </div>
            </div>
        `, 
        init: async () => {},
        title: 'VERITY // 404'
    };

    document.title = view.title || 'VERITY // DOGFOOD 2026';
    
    try {
        root.innerHTML = await view.render();
        await view.init();
    } catch (err) {
        console.error('[router error]:', err);
        root.innerHTML = `
            <div class="df-card" style="border-color: var(--color-error); margin: var(--sp-8) auto; max-width: 600px;">
                <div class="df-card__body">
                    <h3 style="color: var(--color-error)">[ RUNTIME ERROR ]</h3>
                    <p class="text-error">${err.message}</p>
                    <pre style="color: var(--color-error); font-size: 11px; overflow-x: auto; background: var(--surface-raised); padding: 8px; border: 1px solid var(--border-default);">${err.stack}</pre>
                </div>
            </div>
        `;
    }

    // Update active nav links
    document.querySelectorAll('.df-nav__links a').forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Session Management (Cookie Override for Testing)
export function setRoleCookie(token) {
    if (token === 'visitor') {
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } else {
        document.cookie = `session=${token}; path=/`;
    }
    updateRoleBadge(token);
    // Reload active view with the new role credentials
    router();
}

function updateRoleBadge(token) {
    const badge = document.getElementById('current-role-badge');
    if (!badge) return;

    const map = {
        'org_7f2a': 'ORGANIZER',
        'jdg_a_91bc': 'JUDGE A',
        'jdg_b_44de': 'JUDGE B',
        'prt_2e88': 'PARTICIPANT'
    };

    const roleName = map[token] || 'VISITOR';
    badge.textContent = `ROLE: ${roleName}`;
    if (token && token !== 'visitor') {
        badge.style.color = 'var(--brand-cyan)';
    } else {
        badge.style.color = 'var(--text-muted)';
    }
}

// Initialize Application
function initApp() {
    // Intercept clicks on [data-link]
    document.body.addEventListener('click', e => {
        const link = e.target.closest('[data-link]');
        if (link && link.href) {
            e.preventDefault();
            navigateTo(link.href);
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', router);

    // Setup Persona Switcher Drawer
    const drawer = document.getElementById('persona-drawer');
    const trigger = document.getElementById('session-trigger');
    const closeBtn = document.getElementById('close-persona');

    if (trigger && drawer) {
        trigger.addEventListener('click', () => {
            drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => {
            drawer.style.display = 'none';
        });
    }

    document.querySelectorAll('.df-role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const role = e.currentTarget.dataset.role;
            setRoleCookie(role);
            if (drawer) drawer.style.display = 'none';
        });
    });

    // Detect existing cookie on load
    const match = document.cookie.match(/session=([^;]+)/);
    if (match) {
        updateRoleBadge(match[1]);
    } else {
        updateRoleBadge('visitor');
    }

    // Initial render
    router();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
