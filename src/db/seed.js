/**
 * Fixture Seeder
 * Parses fixtures.json and populates the database on startup.
 * Idempotent: uses INSERT OR IGNORE to prevent duplicate key violations on restarts.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function generateId(prefix) {
    return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

function seedDatabase(db) {
    const fixturesPath = process.env.FIXTURES_PATH || path.join(__dirname, '../../fixtures.json');

    if (!fs.existsSync(fixturesPath)) {
        console.warn(`[seed] fixtures.json not found at ${fixturesPath}. Booting with empty schema.`);
        return;
    }

    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
    console.log('[seed] Loading fixtures.json...');

    // Use a transaction for atomicity
    const seedTx = db.transaction(() => {
        // 1. Event
        const evt = fixtures.event;
        db.prepare(`
            INSERT OR IGNORE INTO events (id, name, submissions_close, status)
            VALUES (?, ?, ?, 'closed')
        `).run(evt.id, evt.name, evt.submissions_close);
        console.log(`[seed] Event: ${evt.name} (${evt.id})`);

        // 2. Tracks
        for (const track of fixtures.tracks) {
            db.prepare(`
                INSERT OR IGNORE INTO tracks (id, event_id, name)
                VALUES (?, ?, ?)
            `).run(track.id, evt.id, track.name);
        }
        console.log(`[seed] Tracks: ${fixtures.tracks.length}`);

        // 3. Rubric Criteria (derive from score structure)
        // fixtures.json scores have criteria like {functionality, quality, innovation}
        // We create rubric entries with equal default weights (organizer can adjust later)
        const criteriaKeys = new Set();
        for (const score of fixtures.scores) {
            for (const key of Object.keys(score.criteria)) {
                criteriaKeys.add(key);
            }
        }
        const criteriaArray = [...criteriaKeys];
        const equalWeight = +(1.0 / criteriaArray.length).toFixed(4);
        for (const key of criteriaArray) {
            const id = `crt_${key}`;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            db.prepare(`
                INSERT OR IGNORE INTO rubric_criteria (id, event_id, key, label, weight)
                VALUES (?, ?, ?, ?, ?)
            `).run(id, evt.id, key, label, equalWeight);
        }
        console.log(`[seed] Rubric Criteria: ${criteriaArray.length} (${criteriaArray.join(', ')})`);

        // 4. Judges → users + sessions
        for (const judge of fixtures.judges) {
            db.prepare(`
                INSERT OR IGNORE INTO users (id, email, name, role)
                VALUES (?, ?, ?, 'judge')
            `).run(judge.id, judge.email, judge.name);

            // Create judge assignments per track
            for (const trackId of judge.tracks) {
                const assignId = `ja_${judge.id}_${trackId}`;
                db.prepare(`
                    INSERT OR IGNORE INTO judge_assignments (id, judge_id, event_id, track_id)
                    VALUES (?, ?, ?, ?)
                `).run(assignId, judge.id, evt.id, trackId);
            }
        }
        console.log(`[seed] Judges: ${fixtures.judges.length}`);

        // 5. Teams → users (members) + team_members
        for (const team of fixtures.teams) {
            const inviteCode = crypto.randomBytes(6).toString('hex');
            db.prepare(`
                INSERT OR IGNORE INTO teams (id, event_id, name, invite_code)
                VALUES (?, ?, ?, ?)
            `).run(team.id, evt.id, team.name, inviteCode);

            // Create users for team members and link them
            for (let i = 0; i < team.members.length; i++) {
                const email = team.members[i];
                const desiredUserId = `usr_${team.id}_${i}`;
                const memberName = email.split('@')[0].replace(/[._]/g, ' ');

                // Check if user already exists (email is UNIQUE)
                const existingUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
                let userId;

                if (existingUser) {
                    userId = existingUser.id;
                } else {
                    db.prepare(`
                        INSERT INTO users (id, email, name, role)
                        VALUES (?, ?, ?, 'participant')
                    `).run(desiredUserId, email, memberName);
                    userId = desiredUserId;
                }

                db.prepare(`
                    INSERT OR IGNORE INTO team_members (team_id, user_id, is_lead)
                    VALUES (?, ?, ?)
                `).run(team.id, userId, i === 0 ? 1 : 0);
            }
        }
        console.log(`[seed] Teams: ${fixtures.teams.length}`);

        // 6. Projects
        for (const proj of fixtures.projects) {
            db.prepare(`
                INSERT OR IGNORE INTO projects (id, event_id, team_id, track_id, title, summary, repo_url, status, submitted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
            `).run(proj.id, evt.id, proj.team, proj.track, proj.title, proj.summary || '', proj.repo_url || '', proj.submitted_at || null);
        }
        console.log(`[seed] Projects: ${fixtures.projects.length}`);

        // 7. Scores + Score Criteria
        let scoreCount = 0;
        for (const score of fixtures.scores) {
            const scoreId = `sc_${score.judge}_${score.project}`;
            db.prepare(`
                INSERT OR IGNORE INTO scores (id, judge_id, project_id, comment)
                VALUES (?, ?, ?, ?)
            `).run(scoreId, score.judge, score.project, score.comment || '');

            for (const [key, value] of Object.entries(score.criteria)) {
                const criterionId = `crt_${key}`;
                db.prepare(`
                    INSERT OR IGNORE INTO score_criteria (score_id, criterion_id, score_value)
                    VALUES (?, ?, ?)
                `).run(scoreId, criterionId, value);
            }
            scoreCount++;
        }
        console.log(`[seed] Scores: ${scoreCount}`);

        // 8. Seed deterministic sessions for acceptance checker
        // Create an organizer user
        db.prepare(`
            INSERT OR IGNORE INTO users (id, email, name, role)
            VALUES ('org_01', 'organizer@verity.local', 'Verity Organizer', 'organizer')
        `).run();

        // Map session tokens from .dogfood.toml
        const sessionMap = [
            { token: 'org_7f2a', userId: 'org_01' },
            { token: 'jdg_a_91bc', userId: 'jdg_01' },
            { token: 'jdg_b_44de', userId: 'jdg_02' },
            { token: 'prt_2e88', userId: `usr_tm_01_0` },
        ];
        for (const sess of sessionMap) {
            db.prepare(`
                INSERT OR IGNORE INTO sessions (token, user_id)
                VALUES (?, ?)
            `).run(sess.token, sess.userId);
        }
        console.log('[seed] Sessions: 4 (organizer, judge_a, judge_b, participant)');
    });

    seedTx();
    console.log('[seed] Database seeded successfully.');
}

module.exports = seedDatabase;
