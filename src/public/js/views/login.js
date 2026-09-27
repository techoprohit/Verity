export async function renderLogin() {
    return `
        <div class="df-card" style="max-width: 400px; margin: var(--sp-12) auto;">
            <div class="df-card__header" style="display: flex; justify-content: space-between; border-bottom: none; padding-bottom: 0;">
                <button id="tab-login" class="btn-primary" style="flex: 1; border-radius: 4px 0 0 4px;">Login</button>
                <button id="tab-register" class="btn-secondary" style="flex: 1; border-radius: 0 4px 4px 0;">Register</button>
            </div>
            
            <div class="df-card__body">
                <!-- Login Form -->
                <form id="login-form">
                    <div class="df-form-group">
                        <label>Email Address</label>
                        <input type="email" id="login-email" class="df-input" placeholder="e.g. organizer@verity.local" required>
                    </div>
                    <div class="df-form-group" style="margin-top: var(--sp-4);">
                        <label>Password</label>
                        <input type="password" id="login-password" class="df-input" placeholder="Enter password" required>
                    </div>
                    <div class="df-form-group" style="margin-top: var(--sp-4);">
                        <button type="submit" class="btn-primary" style="width: 100%;">Authenticate</button>
                    </div>
                    <div id="login-error" class="text-error text-small" style="margin-top: var(--sp-2); display: none;"></div>
                </form>
                
                <!-- Register Form -->
                <form id="register-form" style="display: none;">
                    <div class="df-form-group">
                        <label>Full Name</label>
                        <input type="text" id="reg-name" class="df-input" placeholder="e.g. Ada Lovelace" required>
                    </div>
                    <div class="df-form-group" style="margin-top: var(--sp-4);">
                        <label>Email Address</label>
                        <input type="email" id="reg-email" class="df-input" placeholder="e.g. ada@example.com" required>
                    </div>
                    <div class="df-form-group" style="margin-top: var(--sp-4);">
                        <label>Password</label>
                        <input type="password" id="reg-password" class="df-input" placeholder="Create a password" required>
                    </div>
                    <div class="df-form-group" style="margin-top: var(--sp-4);">
                        <button type="submit" class="btn-primary" style="width: 100%;">Create Account</button>
                    </div>
                    <div id="reg-error" class="text-error text-small" style="margin-top: var(--sp-2); display: none;"></div>
                </form>
                
                <div style="margin-top: var(--sp-6); border-top: 1px solid var(--border-subtle); padding-top: var(--sp-4);">
                    <p class="text-small text-muted" style="margin-bottom: var(--sp-2);">Test Accounts (Password: <strong>dogfood2026</strong>):</p>
                    <ul class="text-small text-muted" style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 4px;">
                        <li><a href="#" class="df-mock-login" data-email="organizer@verity.local">Organizer</a></li>
                        <li><a href="#" class="df-mock-login" data-email="tomas.varga@example.org">Judge A (Ada)</a></li>
                        <li><a href="#" class="df-mock-login" data-email="wei.lindqvist@example.org">Judge B (Peer)</a></li>
                        <li><a href="#" class="df-mock-login" data-email="participant@verity.local">Participant</a></li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

export async function initLogin() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');

    // Tab Switching
    tabLogin.addEventListener('click', () => {
        tabLogin.className = 'btn-primary';
        tabRegister.className = 'btn-secondary';
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.className = 'btn-primary';
        tabLogin.className = 'btn-secondary';
        formRegister.style.display = 'block';
        formLogin.style.display = 'none';
    });

    // Mock accounts autofill
    document.querySelectorAll('.df-mock-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-email').value = e.target.dataset.email;
            document.getElementById('login-password').value = 'dogfood2026';
        });
    });

    // Login Submission
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errBox = document.getElementById('login-error');
        errBox.style.display = 'none';
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value 
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Authentication failed');
            
            const userRole = data.user.role;
            if (userRole === 'judge') window.location.href = '/judge';
            else if (userRole === 'organizer' || userRole === 'admin') window.location.href = '/console';
            else if (userRole === 'participant') window.location.href = '/submit';
            else window.location.href = '/';
        } catch (err) {
            errBox.textContent = err.message;
            errBox.style.display = 'block';
        }
    });

    // Register Submission
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errBox = document.getElementById('reg-error');
        errBox.style.display = 'none';
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: document.getElementById('reg-name').value,
                    email: document.getElementById('reg-email').value,
                    password: document.getElementById('reg-password').value 
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            
            const userRole = data.user.role;
            if (userRole === 'judge') window.location.href = '/judge';
            else if (userRole === 'organizer' || userRole === 'admin') window.location.href = '/console';
            else if (userRole === 'participant') window.location.href = '/submit';
            else window.location.href = '/';
        } catch (err) {
            errBox.textContent = err.message;
            errBox.style.display = 'block';
        }
    });
}
