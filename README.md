# Verity

> **"Build the platform that will judge you."** — DOGFOOD 2026 Hackathon

Verity is an open-source, self-hostable hackathon submission and judging platform engineered for transparent weighted scoring, defensible cross-judge normalization, and backend-enforced judging integrity.

---

## 1. Project Name
**Verity** (Repository: [`techoprohit/Verity`](https://github.com/techoprohit/Verity))

---

## 2. One-Sentence Pitch
An open-source, self-hostable hackathon platform delivering weighted rubric scoring, mathematical cross-judge normalization, and strict backend-enforced role isolation in a single offline command.

---

## 3. What the Project Does
Verity manages the complete lifecycle of a hackathon:
- **Event Lifecycle Management**: Organizers configure event timelines, thematic tracks, and custom prizes.
- **Participant Experience**: Hackers form teams via invite links, assemble project submissions, and edit drafts up until the hard deadline.
- **Strict Deadline Enforcement**: Submissions past the cutoff timestamp are strictly rejected by the backend.
- **Public Showcase Gallery**: Searchable, filterable directory of submitted projects accessible to public visitors without requiring authentication.
- **Structured Rubric Judging**: Organizers define multi-criteria weighted rubrics; judges evaluate assigned projects within their domain.
- **Judging Integrity & Peer Isolation**: Complete isolation between judges—peer scores cannot be inspected via API or UI.
- **Score Normalization**: Automated statistical adjustment to correct for lenient and harsh judges across unbalanced review sets.
- **Organizer Oversight & Export**: Real-time progress dashboard and standard CSV data export for ceremony deliberations.

---

## 4. Why We Built It
Most existing hackathon platforms converged on the same superficial features years ago and stalled:
- **No Weighted Criteria**: Major platforms force flat scoring, ignoring that technical complexity, polish, and relevance carry different weights.
- **Undocumented or Absent Normalization**: Platforms claim score normalization, but none publish their algorithms or handle sparse, uneven judging queues.
- **Frontend-Only Role "Security"**: Many platforms merely hide peer scores in UI templates while exposing raw competitor scores over unsecured backend API endpoints.
- **Brittle Deadline Handling**: Client-side timers frequently fail, allowing late submissions or locking out honest participants across time zones.
- **Hosted Vendor Lock-In**: Platforms mandate proprietary cloud accounts, external databases, and third-party auth services.

Verity is built for the **DOGFOOD 2026** challenge to prove that a hackathon platform can be fully self-hostable, zero-cloud-dependent, mathematically sound, and rigorously secure.

---

## 5. Feature Overview by Tier

The DOGFOOD 2026 tier ladder defines the platform capability levels:

### T1: Core (Target Floor)
| Feature | Description | Status |
| :--- | :--- | :--- |
| **Authentication & Sessions** | Session management across 5 explicit roles: visitor, participant, judge, organizer, admin | *Planned* |
| **Event Configuration** | Configurable dates, time zones, tracks, and prize descriptions | *Planned* |
| **Team Formation** | Team creation and membership management via shareable invite links | *Planned* |
| **Project Submission** | Draft saving and iterative editing up to the submission cutoff | *Planned* |
| **Deadline Enforcement** | Server-side rejection of submissions after `submissions_close` | *Planned* |
| **Public Gallery** | Unauthenticated project discovery with search and track filtering | *Planned* |

### T2: Judging (Target Core)
| Feature | Description | Status |
| :--- | :--- | :--- |
| **Judge Invitation & Assignment** | Track-based and batch judge queue assignments | *Planned* |
| **Weighted Rubric Scoring** | Organizer-configurable criteria with individual weighting multipliers | *Planned* |
| **Backend Role Isolation** | Judges strictly blocked from accessing peer judge scorecards (HTTP 401/403) | *Planned* |
| **Organizer Progress Dashboard** | Live tracking of review completion rates across judges and projects | *Planned* |
| **Cross-Judge Normalization** | Defensible statistical algorithm adjusting for reviewer scoring variance | *Planned* |
| **CSV Export** | Downloadable CSV export of all submissions, track allocations, and final scores | *Planned* |

### T3: Public (Stretch)
| Feature | Description | Status |
| :--- | :--- | :--- |
| **Community Voting** | Authenticated or email-gated voting for public choice awards | *Planned* |
| **Project Comments** | Community feedback and discussion threads on project pages | *Planned* |
| **Hidden Results Window** | Scoreboard and vote tallies concealed until the organizer publishes results | *Planned* |
| **Randomized Ballot Ordering** | Position-bias mitigation through per-voter randomized project ordering | *Planned* |
| **Anti-Abuse Safeguards** | Rate limiting, duplicate submission detection, and audit logging | *Planned* |

### T4: Stretch Capabilities
| Feature | Description | Status |
| :--- | :--- | :--- |
| **REST API & Webhooks** | Programmatic event administration and outbound webhook triggers | *Planned* |
| **Certificate Generation** | Automated participation and award PDF/image certificates | *Planned* |
| **Verifiable Judge Records** | Cryptographically signed proof of judging participation | *Planned* |
| **Embeddable Gallery Widget** | Standalone JavaScript/iframe snippet for embedding on external sites | *Planned* |
| **Bulk Import / Export** | Complete JSON/CSV dump and ingestion pipeline for multi-event migration | *Planned* |

---

## 6. Current Tier Claim

> **Current Claimed Tier:** **None / Unclaimed (T0 - Architecture & Inception Phase)**

In strict adherence to DOGFOOD rule #5 (*"Honest tier claims, declared in .dogfood.toml. Overclaiming is penalised"*):
- The repository currently contains the event specification ([`SPEC.md`](file:///d:/Code/DogFood/Verity/SPEC.md)) and foundational documentation.
- No backend endpoints, UI components, database schemas, or Docker container services have been deployed to the workspace yet.
- Neither T1 nor T2 is claimed until the application code is present and verified by the acceptance checker.

---

## 7. Architecture Overview

Verity is designed around the **One Command Rule**: zero external dependencies, no SaaS authentication, and complete offline operability on localhost.

```
                           +--------------------------------+
                           |         Public Visitor         |
                           +--------------------------------+
                                           |
                                           v
+------------------+         +----------------------------+         +------------------+
|   Participant    | ------> |    Reverse Proxy / HTTP    | <------ |      Judge       |
+------------------+         |    Port 8080 (Localhost)   |         +------------------+
                             +----------------------------+
                                           |
                                           v
                             +----------------------------+
                             |   Role Isolation & Auth    |
                             |   Middleware (Session/Token|
                             +----------------------------+
                                           |
                 +-------------------------+-------------------------+
                 |                         |                         |
                 v                         v                         v
     +-----------------------+ +-----------------------+ +-----------------------+
     |  Gallery & Submission | |    Judging Engine     | |   Organizer Dashboard |
     |      Subsystem        | | & Normalization Math  | |     & CSV Exporter    |
     +-----------------------+ +-----------------------+ +-----------------------+
                 |                         |                         |
                 +-------------------------+-------------------------+
                                           |
                                           v
                             +----------------------------+
                             |   Relational Persistence   |
                             |  (SQLite / PostgreSQL DB)  |
                             +----------------------------+
```

### Key Architectural Tenets:
1. **Offline Isolation**: All assets, fonts, styles, scripts, and runtime dependencies are bundled locally.
2. **Backend Security Layer**: Access control is executed in HTTP middleware before reaching route handlers. A direct `curl` request lacking proper credentials receives a 401 or 403.
3. **Deterministic Seeding**: Database seeding executes on container boot, populating the environment with the exact `fixtures.json` dataset.
4. **Stateless Testability**: Predefined session cookies/headers map directly to seeded personas, enabling instant automated verification without browser automation or login UI friction.

---

## 8. Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24.0 or newer)
- [Docker Compose](https://docs.docker.com/compose/) (v2.0 or newer)
- [Python 3.10+](https://www.python.org/) *(only required if executing the acceptance test script on the host)*

### Running with Docker Compose
Once the application stack is assembled, launch the entire platform with one command:

```bash
docker compose up --build
```

### Localhost Access
Once booted, open your browser or API client to:
```
http://localhost:8080
```

### Seeded Accounts & Roles
For development, manual verification, and the acceptance checker, the portal provides pre-authenticated sessions:

| Role | Target Identity / Fixture | Auth Header (Cookie / Token) | Capabilities |
| :--- | :--- | :--- | :--- |
| **Organizer** | Lead Administrator | `Cookie: session=org_7f2a` | Configure rubric, track progress, export CSV |
| **Judge A** | Ada Okonkwo (`jdg_01`) | `Cookie: session=jdg_a_91bc` | Review assigned track projects, submit own scores |
| **Judge B** | Peer Judge (`jdg_02`) | `Cookie: session=jdg_b_44de` | Review assigned projects, isolated from Judge A |
| **Participant**| Team Lead (`tm_01`) | `Cookie: session=prt_2e88` | Edit project draft, view submission status |
| **Public Visitor** | Anonymous Guest | *None* | Browse gallery, view projects, search tracks |

---

## 9. How to Run the Acceptance Checker

The acceptance checker (`run.py`, defined in Appendix A of [`SPEC.md`](file:///d:/Code/DogFood/Verity/SPEC.md)) runs on standard Python 3 with zero third-party dependencies.

### Step 1: Ensure the portal is running
Verify `http://localhost:8080` responds with 200 OK.

### Step 2: Run the script
From the root of the repository, execute:

```bash
python3 run.py .dogfood.toml > acceptance-report.txt
```

*(If `fixtures.json` is stored in a subfolder, pass `--fixtures path/to/fixtures.json`)*.

### What the Acceptance Checker Tests
The script issues seven deterministic HTTP probes:
1. `T1` **gallery is public**: `GET /projects` without auth headers must return `200`.
2. `T1` **project from fixtures shown**: `GET /projects` response body must contain titles present in `fixtures.json`.
3. `T1` **closed event refuses submissions**: `POST /projects/new` as a participant must return `4xx` because the fixture event closed in the past (`2026-03-01T18:00:00Z`).
4. `T2` **judge sees own scores**: `GET /api/judge/scores` with `judge_a` auth header must return `200`.
5. `T2` **judge cannot see peer scores**: `GET /api/judge/scores?judge=judge_a` with `judge_b` auth header must return `401` or `403`.
6. `T2` **participant blocked**: `GET /api/judge/scores` with `participant` auth header must return `401` or `403`.
7. `T2` **csv export works**: `GET /api/export.csv` with `organizer` auth header must return `200` and a body beginning with a CSV header line containing commas.

The output will be saved into `acceptance-report.txt` and committed to the repository.

---

## 10. How the Seeded Fixture Data Works

DOGFOOD provides a shared `fixtures.json` file representing a standardized hackathon state:
- **Event**: `Sample Hack 2026` (`evt_01`), with `submissions_close` set to `2026-03-01T18:00:00Z` (deliberately in the past).
- **Tracks**: ~8 tracks (e.g. Developer Tools, AI, Open Source).
- **Participants & Teams**: ~40 projects mapped to corresponding teams and member emails.
- **Judges & Assignments**: ~30 judges mapped to specific tracks.
- **Scores**: Existing scores submitted across various rubric criteria.

### Intentional Fixture Edge Cases
The platform ingestion engine is explicitly designed to handle awkward fixture scenarios without crashing:
1. **Closed Deadline Probe**: The fixture event cutoff is in the past; any subsequent submission attempts must fail validation.
2. **Review Asymmetry**: Some projects have received five evaluations while adjacent projects only have two. The calculation engine must not crash or penalize unreviewed criteria.
3. **Pathological Reviewer**: A fixture judge gave identical scores to every project; the normalization model must handle zero standard deviation without division-by-zero errors.
4. **Duplicate Submissions**: Redundant team project records must resolve cleanly.
5. **Empty Comments**: Scores where the review comment is empty or omitted must be accepted without null pointer errors.

---

## 11. Main User Workflows

### Organizer
1. **Setup**: Define event name, track taxonomy, and submission deadlines.
2. **Rubric Definition**: Establish criteria (e.g., *Functionality*, *Technical Depth*, *Design*) and assign relative weights.
3. **Queue Distribution**: Assign judges to specific tracks or review batches.
4. **Monitoring**: Track submission volume, judge review progress, and flagged anomalies on the live dashboard.
5. **Deliberation & Export**: Apply cross-judge normalization and export the final scorecard as CSV.

### Participant
1. **Team Assembly**: Create a team profile and share the invite URL with collaborators.
2. **Drafting**: Initialize project submission (title, tagline, repository URL, video demo, track selection).
3. **Editing**: Refine submission contents continuously prior to the countdown cutoff.
4. **Lockout**: Upon reaching `submissions_close`, the submission view converts to a read-only receipt.

### Judge
1. **Authentication**: Enter the judging console using an assigned session.
2. **Queue Evaluation**: Browse the assigned queue of projects within qualified tracks.
3. **Scorecard Entry**: Submit numerical ratings per rubric criterion alongside qualitative feedback.
4. **Isolation**: Only personal scorecards remain visible. Attempts to query competitor scores return HTTP 403 Forbidden.

### Public Visitor
1. **Exploration**: Access `/projects` with no credentials.
2. **Filtering**: Search by project title or filter by specific innovation track.
3. **Showcase View**: Inspect project descriptions, repo links, and embedded demo media.

---

## 12. Security & Role Isolation

A fundamental requirement of the DOGFOOD specification is **backend-enforced access control**:
- **Zero Frontend-Only Security**: Hiding elements or masking API responses in client-side templates is considered an immediate failure. A raw `curl` request to any protected route must fail with HTTP `401 Unauthorized` or `403 Forbidden`.
- **Peer Judge Scorecard Isolation**:
  ```http
  GET /api/judge/scores?judge=judge_a
  Cookie: session=jdg_b_44de
  ```
  The backend checks whether the authenticated user ID matches the target judge ID or possesses the `organizer` role. If a peer judge attempts access, the controller returns `403 Forbidden`.
- **Role Hierarchy**:
  - `admin` / `organizer`: Full read/write access to settings, assignments, all scorecards, and exports.
  - `judge`: Access restricted strictly to assigned projects and own submitted scores.
  - `participant`: Access restricted to team drafting and public data; completely blocked from judge routes.
  - `visitor`: Unauthenticated read access strictly to public gallery endpoints.

---

## 13. Judging & Normalization Summary

### Weighted Scoring
Each rubric criterion $c_i$ is assigned an organizer weight $w_i$. For a given judge review with raw criterion scores $s_i \in [1, 5]$, the composite score $S_{raw}$ is computed as:

$$S_{raw} = \frac{\sum (w_i \cdot s_i)}{\sum w_i}$$

### Cross-Judge Normalization
Judges naturally differ: "harsh" judges may award an average score of 2.8 with low spread, while "lenient" judges award averages of 4.5. If projects are evaluated by different subsets of judges, raw averages unfairly penalize projects assigned to tough judges.

Verity implements **Z-Score Standardization**:
1. For each judge $j$, compute their sample mean $\mu_j$ and sample standard deviation $\sigma_j$ across all reviews they submitted.
2. If $\sigma_j = 0$ (a judge gave uniform scores), set their normalized z-score to $0$ to prevent division by zero.
3. For project $p$ scored by judge $j$ with raw score $S_{p, j}$:

$$z_{p, j} = \frac{S_{p, j} - \mu_j}{\sigma_j}$$

4. Convert each $z_{p, j}$ to a standardized 0–100 scale using the global hackathon mean $\mu_{global}$ and standard deviation $\sigma_{global}$:

$$S_{norm}(p, j) = \mu_{global} + (z_{p, j} \cdot \sigma_{global})$$

5. The project's final score is the mean of all normalized reviews $S_{norm}(p, j)$.

---

## 14. Data Import / Export

### Ingestion (Import)
- Initial database population is executed via a deterministic seed pipeline reading `fixtures.json`.
- Implements idempotent entity creation across events, tracks, teams, projects, users, and scores.

### Data Export
- Endpoint: `GET /api/export.csv`
- Authorization: Restricted strictly to `organizer` sessions.
- Format: Standard RFC 4180 CSV output containing:
  ```csv
  project_id,title,team_name,track,review_count,raw_average,normalized_score,status
  prj_01,"Quiet Hours","Nightshift","Developer tools",3,3.67,78.4,completed
  ```

---

## 15. Testing

The project incorporates multiple testing tiers:
1. **DOGFOOD Acceptance Suite**:
   Executed via standard Python:
   ```bash
   python3 run.py .dogfood.toml
   ```
2. **Backend Unit & Integration Tests**:
   - Unit validation for the weighted rubric calculator and normalization edge cases (zero deviation, single-review projects).
   - Integration tests verifying that all unauthorized or cross-judge queries return HTTP 401/403.
   - Deadline enforcement tests validating that late POST requests are rejected.

---

## 16. Known Limitations & Unfinished Features

In the spirit of honest gap reporting:
1. **Source Code Implementation Pending**: The repository is currently at the specification and architecture phase. Application source code, database migrations, and frontend templates have not yet been implemented.
2. **Acceptance Checker Not Yet Runnable**: Because the application server is not yet deployed, running `run.py` against `http://localhost:8080` will currently fail connection probes.
3. **No Active Docker Compose Services**: `docker-compose.yml` has not yet been authored.
4. **Community Voting (T3) Unimplemented**: Public ballot allocation and anti-Sybil rate limiting are designed but not built.
5. **Stretch Features (T4) Deferred**: Webhook dispatchers, cryptographic certificates, and embeddable widgets remain in the planned backlog.

---

## 17. Project Structure

The planned repository layout following the DOGFOOD specification:

```
Verity/
├── .dogfood.toml           # Acceptance checker configuration & tier claims
├── docker-compose.yml      # One-command orchestration for offline portal
├── fixtures.json           # Standardized DOGFOOD hackathon dataset
├── run.py                  # Acceptance test runner
├── acceptance-report.txt   # Verified output generated by run.py
├── README.md               # Project documentation & status
├── SPEC.md                 # Official DOGFOOD 2026 specification
├── ARCHITECTURE.md         # Detailed architectural decisions & trade-offs
├── DATA-MODEL.md           # Database schemas, relationships, and seed pipelines
├── JUDGING.md              # Mathematical proof and defense of normalization
├── LICENSE                 # Open source license (MIT)
├── src/                    # Application source code
└── tests/                  # Integration & unit test suites
```

---

## 18. License
Verity is open-source software licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## 19. DOGFOOD-Specific Notes

- **Offline Mandate**: Verity requires zero internet access after Docker image build. No external CDNs, Google Fonts, or cloud authentication endpoints are called.
- **Port Mapping**: The service exposes port `8080` on localhost as defined in `.dogfood.toml`.
- **Peer Score Probe**: The acceptance check routes `peer_scores` to `/api/judge/scores?judge=judge_a` and accesses it as `judge_b`. Verity's backend explicitly rejects this query.
- **Clock Integrity**: Deadline verification compares `submissions_close` directly against UTC system time. In accordance with fixture data where `submissions_close = "2026-03-01T18:00:00Z"`, all submission probes sent against the seed event are rejected immediately.

---

## 20. Honest Status

| Category / Capability | Dogfood Tier | Specification Status | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Authentication & Role System** | T1 | Defined (5 roles) | ❌ Not Implemented |
| **Event & Track Configuration** | T1 | Defined | ❌ Not Implemented |
| **Team Invite Link Formation** | T1 | Defined | ❌ Not Implemented |
| **Draft Submission & Editing** | T1 | Defined | ❌ Not Implemented |
| **Strict Deadline Rejection** | T1 | Defined | ❌ Not Implemented |
| **Public Project Gallery** | T1 | Defined | ❌ Not Implemented |
| **Judge Allocation & Queues** | T2 | Defined | ❌ Not Implemented |
| **Weighted Rubric Scoring** | T2 | Mathematically Defined | ❌ Not Implemented |
| **Backend Peer Score Isolation** | T2 | Defined (HTTP 401/403) | ❌ Not Implemented |
| **Organizer Progress Dashboard** | T2 | Defined | ❌ Not Implemented |
| **Z-Score Normalization Engine** | T2 | Mathematically Defined | ❌ Not Implemented |
| **CSV Scorecard Export** | T2 | Schema Defined | ❌ Not Implemented |
| **Community Voting & Comments** | T3 | Designed | ❌ Not Implemented |
| **Anti-Abuse Rate Limiting** | T3 | Designed | ❌ Not Implemented |
| **Public REST API & Webhooks** | T4 | Designed | ❌ Not Implemented |
| **Verifiable Judge Credentials** | T4 | Designed | ❌ Not Implemented |

**Summary**: Currently **0 of 4 tiers** are verified in code. The repository is in active development. All architecture, mathematical models, and role isolation boundaries are fully specified.
