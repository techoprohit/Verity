const express = require('express');
const path = require('path');
const db = require('./db/database');
const seedDatabase = require('./db/seed');
const authMiddleware = require('./middleware/auth');

// Route controllers
const galleryRoutes = require('./routes/gallery');
const submissionRoutes = require('./routes/submissions');
const judgingRoutes = require('./routes/judging');
const organizerRoutes = require('./routes/organizer');
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const teamsRoutes = require('./routes/teams');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Authentication & Role Middleware applied globally
app.use(authMiddleware);

// Mount route controllers
app.use('/', authRoutes);          // POST /api/auth/login, POST /api/auth/logout
app.use('/', eventsRoutes);        // POST /api/events, POST /api/tracks, POST /api/prizes
app.use('/', teamsRoutes);         // POST /api/teams, POST /api/teams/join
app.use('/', galleryRoutes);       // GET /projects, GET /projects/:id
app.use('/', judgingRoutes);       // GET/POST /api/judge/scores
app.use('/', organizerRoutes);     // GET /api/export.csv, GET /api/dashboard

// SPA catch-all: serve index.html for client-side routes only (not API or file requests)
app.get('*', (req, res) => {
    // Skip if it looks like an API call or a file request
    if (req.path.startsWith('/projects') || req.path.startsWith('/api') || req.path.includes('.')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed database with fixtures on startup
seedDatabase(db);

// Start server
app.listen(PORT, () => {
    console.log(`Verity portal listening on http://localhost:${PORT}`);
});
