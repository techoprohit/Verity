-- Verity Schema: Canonical DDL
-- Based on DATA-MODEL.md specification
-- Compatible with SQLite (hackathon) and PostgreSQL (production migration)

-- 1. Events
CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    submissions_close TEXT NOT NULL,  -- ISO 8601 UTC
    status      TEXT NOT NULL DEFAULT 'open'
        CHECK(status IN ('draft','open','closed','judging','published','archived')),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 2. Tracks
CREATE TABLE IF NOT EXISTS tracks (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    UNIQUE(event_id, name)
);

-- 3. Prizes
CREATE TABLE IF NOT EXISTS prizes (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    track_id    TEXT REFERENCES tracks(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    amount      TEXT
);

-- 4. Users
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'participant'
        CHECK(role IN ('visitor','participant','judge','organizer','admin')),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 5. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    token       TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 6. Teams
CREATE TABLE IF NOT EXISTS teams (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 7. Team Members
CREATE TABLE IF NOT EXISTS team_members (
    team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_lead     INTEGER NOT NULL DEFAULT 0,
    joined_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    PRIMARY KEY (team_id, user_id)
);

-- 8. Team Invitations
CREATE TABLE IF NOT EXISTS team_invitations (
    id          TEXT PRIMARY KEY,
    team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invite_email TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','accepted','revoked')),
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 9. Projects
CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    track_id    TEXT NOT NULL REFERENCES tracks(id) ON DELETE RESTRICT,
    title       TEXT NOT NULL,
    summary     TEXT,
    repo_url    TEXT,
    demo_url    TEXT,
    status      TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft','submitted','locked')),
    submitted_at TEXT,
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 10. Rubric Criteria
CREATE TABLE IF NOT EXISTS rubric_criteria (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    key         TEXT NOT NULL,
    label       TEXT NOT NULL,
    weight      REAL NOT NULL CHECK(weight > 0),
    min_score   REAL NOT NULL DEFAULT 1.0,
    max_score   REAL NOT NULL DEFAULT 5.0,
    CHECK(min_score < max_score),
    UNIQUE(event_id, key)
);

-- 11. Judge Assignments
CREATE TABLE IF NOT EXISTS judge_assignments (
    id          TEXT PRIMARY KEY,
    judge_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    track_id    TEXT REFERENCES tracks(id) ON DELETE CASCADE,
    project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(judge_id, project_id)
);

-- 12. Scores (header)
CREATE TABLE IF NOT EXISTS scores (
    id          TEXT PRIMARY KEY,
    judge_id    TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    comment     TEXT DEFAULT '',
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(judge_id, project_id)
);

-- 13. Score Criteria (detail)
CREATE TABLE IF NOT EXISTS score_criteria (
    score_id      TEXT NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    criterion_id  TEXT NOT NULL REFERENCES rubric_criteria(id) ON DELETE RESTRICT,
    score_value   REAL NOT NULL CHECK(score_value >= 1.0 AND score_value <= 5.0),
    PRIMARY KEY (score_id, criterion_id)
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT,
    payload_diff TEXT,  -- JSON
    ip_address  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 15. Community Votes (T3 stretch)
CREATE TABLE IF NOT EXISTS community_votes (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    voter_email TEXT NOT NULL,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(event_id, voter_email)
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

INSERT OR IGNORE INTO schema_migrations (version) VALUES (1);
