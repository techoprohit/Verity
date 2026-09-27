/**
 * Verity SPA Router & Session Manager
 * Orchestrates client-side routing, role switching, and view lifecycles.
 */

import { renderGallery, initGallery } from './views/gallery.js';
import { renderSubmit, initSubmit } from './views/submit.js';
import { renderJudge, initJudge } from './views/judge.js';
import { renderConsole, initConsole } from './views/console.js';
import { renderTools, initTools } from './views/tools.js';
import { renderLogin, initLogin } from './views/login.js';
import { renderBallot, initBallot } from './views/ballot.js';

// Route Definitions
const views = {
    '/': {
        render: renderGallery,
        init: initGallery,
        title: 'VERITY // GALLERY'
    },
    '/ballot': {
        render: renderBallot,
        init: initBallot,
        title: 'VERITY // BALLOT'
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
    },
    '/tools': {
        render: renderTools,
        init: initTools,
        title: 'VERITY // DEVELOPER TOOLS & CERTIFICATES'
    },
    '/login': {
        render: renderLogin,
        init: initLogin,
        title: 'VERITY // AUTHENTICATION'
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

    // Client-side Route Guard
    const user = await fetchSession();

    const roleRequirements = {
        '/submit': ['participant'],
        '/judge': ['judge', 'organizer', 'admin'],
        '/console': ['organizer', 'admin'],
        '/tools': ['organizer', 'admin']
    };

    if (roleRequirements[path]) {
        if (!user || !roleRequirements[path].includes(user.role)) {
            // Unauthorized - redirect to gallery
            if (path !== '/') {
                history.pushState(null, null, '/');
                return router();
            }
        }
    }

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
        init: async () => { },
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
export async function fetchSession() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        window.VeritySession = data.user || null;
        return data.user;
    } catch (err) {
        console.error('Failed to fetch session', err);
        window.VeritySession = null;
        return null;
    }
}

export async function updateNavbar(user) {
    const badge = document.getElementById('current-role-badge');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Nav Links
    const navGallery = document.getElementById('nav-gallery');
    const navSubmit = document.getElementById('nav-submit');
    const navJudge = document.getElementById('nav-judge');
    const navConsole = document.getElementById('nav-console');
    const navTools = document.getElementById('nav-tools');

    // Reset defaults (only Gallery is visible everywhere)
    if (navGallery) navGallery.style.display = 'inline-block';
    if (navSubmit) navSubmit.style.display = 'none';
    if (navJudge) navJudge.style.display = 'none';
    if (navConsole) navConsole.style.display = 'none';
    if (navTools) navTools.style.display = 'none';

    if (user) {
        badge.textContent = `ROLE: ${user.role.toUpperCase()} (${user.name})`;
        badge.style.color = 'var(--brand-accent)';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';

        if (user.role === 'participant') {
            if (navSubmit) navSubmit.style.display = 'inline-block';
        } else if (user.role === 'judge') {
            if (navJudge) navJudge.style.display = 'inline-block';
        } else if (user.role === 'organizer' || user.role === 'admin') {
            if (navJudge) navJudge.style.display = 'inline-block';
            if (navConsole) navConsole.style.display = 'inline-block';
            if (navTools) navTools.style.display = 'inline-block';
        }
    } else {
        badge.textContent = 'VISITOR';
        badge.style.color = 'var(--text-muted)';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

// Initialize Application
async function initApp() {
    // Handle global click interception for routing
    document.body.addEventListener('click', e => {
        const link = e.target.closest('[data-link]');
        if (link && link.href) {
            e.preventDefault();
            navigateTo(link.href);
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', router);

    // Logout handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/'; // Reload completely to clear state
        });
    }

    // Check actual session state
    const user = await fetchSession();
    updateNavbar(user);

    // Initial render
    router();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
