# Verity: Security Architecture and Threat Defense Specification

> **Event Context**: DOGFOOD 2026 Hackathon  
> **Challenge**: "Build the platform that will judge you."  
> **Repository**: [`techoprohit/Verity`](https://github.com/techoprohit/Verity)  
> **Document Status**: Security Specification, Threat Model, and Implementation Audit

---

## Executive Security Summary

The DOGFOOD 2026 specification establishes strict security mandates for hackathon platforms:
1. **The Backend Rule**: Role isolation must be enforced in the backend or API, not just painted on the frontend. A raw `curl` test must fail for unauthorized access.
2. **Peer Isolation**: Judges must be strictly barred from viewing peer judge scorecards (HTTP 401/403).
3. **Deadline Rigidity**: The backend must enforce submission cutoffs based on the server UTC clock, rejecting late submissions regardless of client state.
4. **Offline Containment**: Zero external SaaS or authentication dependencies.

### Implementation Status Audit
In strict accordance with hackathon rules and honest gap reporting:
- **Current Repository State**: The repository is currently in the kickoff/architecture phase ([`SPEC.md`](file:///d:/Code/DogFood/Verity/SPEC.md), [`README.md`](file:///d:/Code/DogFood/Verity/README.md), [`ARCHITECTURE.md`](file:///d:/Code/DogFood/Verity/ARCHITECTURE.md), [`DATA-MODEL.md`](file:///d:/Code/DogFood/Verity/DATA-MODEL.md), [`JUDGING.md`](file:///d:/Code/DogFood/Verity/JUDGING.md)). Application source code has not yet been committed to `src/`.
- **Classification**: Because running code does not yet exist in the repository, all controls are currently classified by their actual codebase presence: **Not Implemented** in active code, but **Fully Specified** in system design. Frontend visual restrictions are explicitly **not** claimed as security controls.

| Security Control Area | DOGFOOD Requirement vs. Project Decision | Status | Target Enforcement Layer |
| :--- | :--- | :---: | :--- |
| **1. Authentication Model** | Project Design Decision / DOGFOOD .dogfood.toml | **Not Implemented** | HTTP Session Resolver |
| **2. Session / Token Handling** | Project Design Decision | **Not Implemented** | Pre-seeded / Cookie Middleware |
| **3. Role Model (5 Roles)** | DOGFOOD T1 Requirement | **Not Implemented** | Database Enum & Middleware |
| **4. Backend Authorization** | DOGFOOD Core Rule | **Not Implemented** | Route Controller Guards |
| **5. Judge Peer-Score Isolation** | DOGFOOD T2 Assertion (Checker Probe) | **Not Implemented** | Controller Identity Check |
| **6. Participant / Judge Isolation**| DOGFOOD T2 Assertion (Checker Probe) | **Not Implemented** | Middleware Role Gate |
| **7. Organizer / Admin Permissions**| DOGFOOD T2 Assertion (CSV Export) | **Not Implemented** | Role-Gated Admin Handlers |
| **8. Input Validation** | Project Design Decision | **Not Implemented** | JSON Schema / Model Parsers |
| **9. CSRF Protection** | Project Design Decision | **Not Implemented** | SameSite Cookies / Headers |
| **10. Rate Limiting** | DOGFOOD T3 Stretch | **Not Implemented** | Memory Token Bucket |
| **11. Audit Logging** | DOGFOOD T3 / Judging Integrity | **Not Implemented** | Append-Only Database Table |
| **12. Duplicate / Abuse Prevention**| DOGFOOD T3 Stretch | **Not Implemented** | Relational Unique Constraints |
| **13. Submission Deadline Enforce** | DOGFOOD T1 Assertion (Checker Probe) | **Not Implemented** | UTC Clock Controller Guard |
| **14. Secrets & Configuration** | DOGFOOD Offline Rule | **Not Implemented** | Local Environment / TOML |
| **15. Docker / Network Security** | DOGFOOD Offline Mandate | **Not Implemented** | Container Network Isolation |

---

## 1. Authentication Model

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - The authentication subsystem is designed to support both automated acceptance checking and interactive human browser sessions without relying on third-party cloud authentication providers (Auth0, Firebase, Supabase).
  - The platform resolves identity via standard HTTP request headers:
    1. `Cookie: session=<token>`
    2. `Authorization: Bearer <token>`
- **Threat Vector Addressed**: Credential stuffing, external service outages, and authentication provider tracking.
- **Backend Enforcement**:
  - If a request lacks credentials on a protected route, the middleware terminates the request immediately with `HTTP 401 Unauthorized`.
  - Unauthenticated requests to public routes (such as `/projects`) default to the `visitor` identity context.
- **Verification**:
  ```bash
  # Must succeed (Public Gallery)
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/projects
  # Expected: 200

  # Must fail (Protected Route without Auth)
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/judge/scores
  # Expected: 401
  ```

---

## 2. Session and Token Handling

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Implements deterministic session tokens mapped directly to seeded identities to support `.dogfood.toml`:
    - `org_7f2a` $\rightarrow$ Organizer Admin
    - `jdg_a_91bc` $\rightarrow$ Judge A (`jdg_01`)
    - `jdg_b_44de` $\rightarrow$ Judge B (`jdg_02`)
    - `prt_2e88` $\rightarrow$ Participant (`tm_01`)
- **Threat Vector Addressed**: Session hijacking, token forgery, session fixation.
- **Backend Enforcement**:
  - Sessions are looked up in memory or in the `sessions` table.
  - Active sessions set the `HttpOnly`, `SameSite=Lax`, and `Path=/` attributes to prevent client-side JavaScript theft via XSS.
- **Verification**:
  ```bash
  # Valid token resolves persona
  curl -H "Cookie: session=org_7f2a" http://localhost:8080/api/export.csv
  # Invalid/tampered token returns 401
  curl -H "Cookie: session=invalid_token_999" http://localhost:8080/api/export.csv
  ```

---

## 3. Role Model

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Implements exactly 5 explicit roles defined by DOGFOOD Section 3 (T1 Core):
    1. `visitor`: Anonymous public user. Read-only access to gallery.
    2. `participant`: Team hacker. Read-write access to own team's submission draft prior to deadline.
    3. `judge`: Reviewer. Read-write access strictly to own assigned project scorecards.
    4. `organizer`: Event director. Full management access across events, rubrics, scorecards, and exports.
    5. `admin`: System-level administrator. Full access across all events and database state.
- **Threat Vector Addressed**: Privilege escalation, unauthorized vertical access.
- **Backend Enforcement**:
  - The database schema enforces valid roles via `CHECK(role IN ('visitor', 'participant', 'judge', 'organizer', 'admin'))`.
  - Roles are attached to the request context by the authentication middleware and cannot be overridden by client query parameters or body payloads.

---

## 4. Backend Authorization

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Access control is strictly decoupled from the presentation layer.
  - Route handlers check the resolved request identity and role before querying or mutating data.
- **Threat Vector Addressed**: Broken Object Level Authorization (BOLA), direct URL tampering, API parameter spoofing.
- **Backend Enforcement**:
  - Route-level middleware intercepts calls before controller dispatch:
    - `RequireRole('organizer')`
    - `RequireRole('judge', 'organizer')`
    - `RequireRole('participant')`
  - Rejection occurs at the middleware layer, preventing unauthorized requests from consuming database resources.

---

## 5. Judge Peer-Score Isolation

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - **DOGFOOD Core Assertion**: Judges must never be permitted to inspect the evaluations or comments submitted by other judges.
  - Hiding another judge's score in the HTML or JSON response is explicitly prohibited. The backend must reject the request.
- **Threat Vector Addressed**: Reviewer anchoring bias, judge collusion, score tampering.
- **Backend Enforcement**:
  - When a judge accesses the score route:
    ```
    GET /api/judge/scores?judge=judge_a
    Cookie: session=jdg_b_44de
    ```
  - The controller compares `caller.id` (`jdg_02`) against the requested judge parameter (`judge_a`).
  - Because `caller.id != requested_judge` and `caller.role != 'organizer'`, the controller immediately returns `HTTP 403 Forbidden` (`{"error": "Peer scorecards are isolated"}`).
- **Verification**:
  ```bash
  # Judge B attempting to read Judge A's scores must return 401 or 403
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Cookie: session=jdg_b_44de" \
    "http://localhost:8080/api/judge/scores?judge=judge_a"
  # Expected: 403
  ```

---

## 6. Participant / Judge Isolation

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Participants must be strictly prevented from accessing judging endpoints, viewing raw rubric scores, or inspecting evaluator identities.
- **Threat Vector Addressed**: Participant score snooping, harassment of judges, retaliatory grading attacks.
- **Backend Enforcement**:
  - Endpoints under `/api/judge/*` enforce a role check: caller must have role `judge` or `organizer`.
  - When called with `Cookie: session=prt_2e88`, the middleware blocks the call and returns `HTTP 403 Forbidden`.
- **Verification**:
  ```bash
  # Participant attempting to query judge score endpoints
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Cookie: session=prt_2e88" \
    http://localhost:8080/api/judge/scores
  # Expected: 403
  ```

---

## 7. Organizer and Admin Permissions

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Only organizers and administrators may access administrative capabilities:
    1. Live progress dashboards and cross-judge score matrices.
    2. Normalization calculation engine triggers.
    3. CSV export (`GET /api/export.csv`).
    4. Manual rubric criteria adjustments and assignment rebalancing.
- **Threat Vector Addressed**: Unauthorized result leakage, unreleased winner exposure.
- **Backend Enforcement**:
  - Handlers for `/api/export.csv` and `/admin/*` enforce `RequireRole('organizer', 'admin')`.
  - Callers without organizer credentials receive `HTTP 403 Forbidden`.
- **Verification**:
  ```bash
  # Organizer can export CSV (200 OK)
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Cookie: session=org_7f2a" \
    http://localhost:8080/api/export.csv
  # Expected: 200

  # Participant cannot export CSV (403 Forbidden)
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Cookie: session=prt_2e88" \
    http://localhost:8080/api/export.csv
  # Expected: 403
  ```

---

## 8. Input Validation

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - All input data from HTTP bodies, path parameters, and query parameters must be validated against strict schemas before processing.
- **Threat Vector Addressed**: Stored Cross-Site Scripting (XSS), SQL Injection, division-by-zero crashes, out-of-bounds score corruption.
- **Backend Enforcement**:
  - **Score Bounds**: Database `CHECK(score_value >= 1.0 AND score_value <= 5.0)`.
  - **Rubric Weights**: Database `CHECK(weight > 0)`.
  - **String Sanitization**: HTML entity encoding on project titles, descriptions, summaries, and comments to prevent Stored XSS in public gallery views.
  - **Parameterized SQL**: All database operations use parameterized queries (`?`), preventing SQL injection.

---

## 9. CSRF Protection

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Protection against cross-site request forgery on browser-initiated state-changing requests (`POST`, `PUT`, `DELETE`).
- **Threat Vector Addressed**: Malicious websites tricking an authenticated organizer or judge into submitting unauthorized scores or modifying event settings.
- **Backend Enforcement**:
  - Cookies set `SameSite=Lax` or `SameSite=Strict`.
  - API mutating endpoints require standard custom headers (e.g., `X-Requested-With` or `Content-Type: application/json`) which standard cross-origin HTML `<form>` submissions cannot forge without preflight authorization.

---

## 10. Rate Limiting

- **Status**: **Not Implemented** (Design Specified - T3 Stretch)
- **Specification / Design Requirement**:
  - Protects submission endpoints and public voting routes against automated denial-of-service and brute-force flooding.
- **Threat Vector Addressed**: Automated ballot stuffing, server resource exhaustion.
- **Backend Enforcement**:
  - In-memory token bucket rate limiter:
    - `/projects/new`: Max 10 submissions/edits per minute per IP/session.
    - `/api/judge/scores`: Max 30 score submissions per minute per judge.

---

## 11. Audit Logging

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Maintain an append-only, tamper-evident audit record of security-critical actions in the `audit_logs` table.
- **Threat Vector Addressed**: Repudiation, insider score tampering, undetected privilege abuse.
- **Backend Enforcement**:
  - Records: `actor_id`, `action`, `entity_type`, `entity_id`, `payload_diff`, `ip_address`, `created_at`.
  - Audited events:
    - `SCORE_CREATE` / `SCORE_UPDATE`
    - `PEER_SCORE_PROBE` (Unauthorized access attempts)
    - `DEADLINE_LOCKOUT`
    - `CSV_EXPORT_DOWNLOADED`

---

## 12. Duplicate and Abuse Prevention

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Enforce structural constraints against ballot duplication, duplicate team entries, and multiple scores.
- **Threat Vector Addressed**: Ballot stuffing, double judging, orphan project duplicates.
- **Backend Enforcement**:
  - Database unique constraints:
    - `UNIQUE(event_id, team_id)` on `projects`: Ensures a team submits at most one project per event.
    - `UNIQUE(judge_id, project_id)` on `scores`: Ensures a judge submits exactly one scorecard per project.
    - `UNIQUE(event_id, voter_email)` on `community_votes`: Prevents duplicate public community votes.

---

## 13. Submission Deadline Enforcement

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - **DOGFOOD Core Assertion**: Submissions after `submissions_close` must be refused by the backend.
  - The fixture event cutoff (`2026-03-01T18:00:00Z`) is fixed in the past; an honestly seeded portal must refuse submissions out of the box.
- **Threat Vector Addressed**: Late project submissions, client-side clock tampering, unfair team extensions.
- **Backend Enforcement**:
  - Every `POST /projects/new` or update handler compares `event.submissions_close` against `CURRENT_TIMESTAMP` (UTC server time).
  - If `current_time >= submissions_close`, the backend terminates the request immediately and returns `HTTP 400 Bad Request` or `HTTP 403 Forbidden` (`{"error": "Submissions are closed"}`).
- **Verification**:
  ```bash
  # Participant submitting to a closed event must return 4xx
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:8080/projects/new \
    -H "Cookie: session=prt_2e88" \
    -H "Content-Type: application/json" \
    -d '{"title":"Late Submission Probe","summary":"Probe"}'
  # Expected: 400 or 403
  ```

---

## 14. Secrets and Configuration Management

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Configuration resides in `.dogfood.toml` and environment variables.
  - In compliance with the DOGFOOD One Command Rule, no secret keys or credentials are fetched from external KMS (Key Management Services) or cloud vaults.
- **Threat Vector Addressed**: Secret leakage to third-party networks, deployment failure during network-isolated startup.
- **Backend Enforcement**:
  - Pre-seeded test tokens (`org_7f2a`, etc.) are configured for local development and acceptance testing only.
  - Production deployments require overriding static session tokens with cryptographically generated random secrets.

---

## 15. Docker and Network Security

- **Status**: **Not Implemented** (Design Specified)
- **Specification / Design Requirement**:
  - Complete offline containment. The application container must run without outbound internet access.
- **Threat Vector Addressed**: Supply chain exfiltration, external telemetry leakage, runtime dependency tampering.
- **Backend Enforcement**:
  - Container runs with non-root user privileges where possible.
  - Zero outbound HTTP network calls during startup, seeding, or runtime execution.
  - Docker Compose binds only port `8080` to the host.

---

## 16. Known Security Limitations

1. **Active Implementation Pending**:
   - The primary security limitation is that the repository is in the architectural inception phase. Source code implementing these security controls has not yet been committed to `src/`.
2. **Static Pre-Seeded Sessions in Development**:
   - The acceptance checker (`run.py`) relies on deterministic session strings (`org_7f2a`, `jdg_a_91bc`, etc.) declared in `.dogfood.toml`. If deployed publicly without configuration overrides, anyone with knowledge of the DOGFOOD specification could impersonate the organizer.
3. **Single-Process In-Memory Rate Limiting**:
   - Rate limiting is tied to local process memory; restarting the container clears active rate-limit buckets.
4. **No Automated Collusion Detection**:
   - While peer scores are isolated to prevent live anchoring, post-event statistical analysis to detect colluding judges (e.g. mutual high-scoring pairs) is not currently implemented.

---

## 17. Manual Security Verification Checklist

Before submitting the repository and running the acceptance checker, execute the following manual `curl` verification suite against `http://localhost:8080`:

### Checklist Commands:

```bash
#!/bin/bash
BASE_URL="http://localhost:8080"

echo "=== DOGFOOD 2026 MANUAL SECURITY VERIFICATION ==="

# 1. Verify Public Gallery is accessible without credentials (Expected: 200)
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/projects")
echo "Check 1: Public Gallery Access -> HTTP $CODE (Expected: 200)"

# 2. Verify Closed Event refuses participant submission (Expected: 400 or 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/projects/new" \
  -H "Cookie: session=prt_2e88" \
  -H "Content-Type: application/json" \
  -d '{"title":"Late Probe","summary":"Probe"}')
echo "Check 2: Closed Event Submission Rejection -> HTTP $CODE (Expected: 4xx)"

# 3. Verify Judge A can read own scorecards (Expected: 200)
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: session=jdg_a_91bc" "$BASE_URL/api/judge/scores")
echo "Check 3: Judge A Own Scores -> HTTP $CODE (Expected: 200)"

# 4. CRITICAL: Verify Judge B cannot read Judge A's scores (Expected: 401 or 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: session=jdg_b_44de" "$BASE_URL/api/judge/scores?judge=judge_a")
echo "Check 4: Peer Score Isolation (Judge B probing Judge A) -> HTTP $CODE (Expected: 401/403)"

# 5. Verify Participant cannot access judging endpoints (Expected: 401 or 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: session=prt_2e88" "$BASE_URL/api/judge/scores")
echo "Check 5: Participant Blocked from Judge Endpoints -> HTTP $CODE (Expected: 401/403)"

# 6. Verify Anonymous user cannot access judging endpoints (Expected: 401 or 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/judge/scores")
echo "Check 6: Anonymous Blocked from Judge Endpoints -> HTTP $CODE (Expected: 401/403)"

# 7. Verify Organizer can export CSV (Expected: 200)
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: session=org_7f2a" "$BASE_URL/api/export.csv")
echo "Check 7: Organizer CSV Export -> HTTP $CODE (Expected: 200)"

# 8. Verify Non-Organizer cannot export CSV (Expected: 401 or 403)
CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: session=prt_2e88" "$BASE_URL/api/export.csv")
echo "Check 8: Participant Blocked from CSV Export -> HTTP $CODE (Expected: 401/403)"

echo "=== END OF VERIFICATION ==="
```

---

## 18. Conclusion & Defense

Verity's security architecture enforces the principle of **Defense in Depth**:
- No trust is placed in frontend templates.
- Access boundaries are validated at the HTTP middleware and controller layers.
- Integrity is reinforced at the persistence tier via strict relational schema constraints.
- Direct API calls via `curl` encounter identical authorization hurdles as standard web browser requests.
