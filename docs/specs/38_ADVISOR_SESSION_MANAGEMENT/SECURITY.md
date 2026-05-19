# Spec 38 — AI Advisor Session Management — SECURITY

**Status:** 📝 In Review
**Security flag:** 🟡 MEDIUM
**Confidence:** 8/10

---

## Threat Model

### Assets
- **AI Advisor session content** — strategic sales conversations; may contain sensitive business information (lead strategies, pricing, competitor analysis)
- **Session metadata** — titles and timestamps reveal business intent patterns
- **`ai_advisor_sessions` JSONB** — contains personal data (lead names, email discussions) subject to SEA privacy regulations (Vietnam PDPD, Thailand PDPA, Singapore PDPA)

### Actors
| Actor | Trust Level | Risk |
|---|---|---|
| Authenticated workspace member | Trusted | May attempt to access other users' sessions within same workspace |
| Authenticated user from different workspace | Low trust | Must be completely isolated from other workspaces' data |
| Unauthenticated caller | None | Blocked by api-gateway JWT validation before reaching ai-service |
| Internal service | High trust | N/A — ai-service is the sole owner of this table |

### Attack Surface
- Session CRUD endpoints (`GET/POST/PATCH/DELETE /v1/advisor/sessions`)
- `GET /v1/advisor/sessions/{id}` — IDOR vulnerability if `session_id` is enumerable
- `PATCH /v1/advisor/sessions/{id}` — unauthorized rename/archive
- Title generation LLM call — prompt injection from first user message
- JSONB append in `finalize_node` — malicious content stored in session history
- **Part B:** `GET /v1/brain/documents/{id}` — workspace isolation for sensitive knowledge content
- **Part B:** `PATCH /v1/brain/documents/{id}` — unauthorized content modification
- **Part B:** document content upload / re-upload — size and content type validation
- **Part B:** `WizardModal` pre-fill from `GET /v1/onboarding/wizard` — wizard answers are sensitive business data

---

## OWASP Top 10 Walkthrough

### A01 — Broken Access Control
**Risk: HIGH for this spec**

| Scenario | Mitigation |
|---|---|
| User A calls `GET /v1/advisor/sessions/{session_id}` where `session_id` belongs to User B in the same workspace | `WHERE user_id = $requesting_user_id` on every query; return `403` (not `404`) to prevent enumeration |
| Workspace A user constructs a `session_id` UUID from Workspace B | `WHERE workspace_id = $X-Workspace-ID` enforced at query level AND RLS policy |
| IDOR via predictable session IDs | Session IDs are `gen_random_uuid()` — 128-bit random, not enumerable |
| `DELETE /v1/advisor/sessions/{id}` deletes someone else's session | Ownership check: `SELECT ... WHERE id=$id AND workspace_id=$ws AND user_id=$uid`; 403 if not found |
| **Part B:** `GET /v1/brain/documents/{id}` returns another workspace's doc | `WHERE workspace_id = $ws` on every doc query; 403 not 404 |
| **Part B:** `PATCH /v1/brain/documents/{id}` modifies another workspace's doc | Same workspace_id check; 403 |
| **Part B:** `GET /v1/onboarding/wizard` (workspace-service) cross-tenant | Already enforced by workspace-service `workspace_id` check; no change needed |

**Verification gate:** Every session and document endpoint must have a test case that passes an ID belonging to a different workspace/user and asserts `403`.

### A02 — Cryptographic Failures
- Session content is stored in plaintext JSONB in PostgreSQL. Supabase encrypts data at rest (AES-256) and in transit (TLS 1.3). Application-level encryption of session content is out of scope at MVP.
- No session tokens are issued by this spec (uses existing JWT from Supabase Auth).

### A03 — Injection
**SQL injection:** All queries use SQLAlchemy parameterized queries or `sqlalchemy.text()` with named bind params. Never string-interpolate user input into queries.

**Prompt injection in title generation:** The user's first message is passed to LiteLLM as a user-turn content field, not as system prompt. The system prompt instructs the model to produce a 6-word title only. Injection risk is low (model output is a short title, not executed anywhere). Mitigations:
- Cap title output to 100 characters server-side; truncate silently
- Validate title is printable text (no HTML, no script tags) before writing to DB

**JSONB injection:** The `messages` JSONB field stores user-controlled text. Content is written as a structured Python dict serialized to JSON — not raw string interpolation. No risk of JSONB structure corruption.

**Part B — Document content injection:** `workspace_knowledge_docs.content` is a plain TEXT field used as RAG input. It is not rendered as HTML. No XSS risk. Content is stored as-is and fed to the embedding model as text. No prompt injection risk from stored content into advisor queries (existing RAG retrieval behaviour, unchanged).

### A04 — Insecure Design
- **Session limit enforcement at service layer** (not just display): prevents unbounded storage growth
- **Soft-delete only**: message history has audit value; hard delete is disallowed at application layer
- **Credits deducted BEFORE LLM call** for title generation and wizard re-synthesis: prevents free AI usage
- **Part B — 100KB content size limit**: enforced server-side on both PATCH and POST upload; prevents storage abuse and embedding cost explosions
- **Part B — No hard-delete of knowledge docs**: document records marked `is_active = False` when replaced; chunks deleted on re-embed but document row retained for audit trail

### A05 — Security Misconfiguration
- `LANGGRAPH_CHECKPOINTER_ENABLED` flag removed: eliminates the risk of accidentally shipping with checkpointer disabled in production (which breaks persistence)
- LangGraph checkpoint tables (`checkpoints`, `checkpoint_writes`, `checkpoint_blobs`) must be accessed only by ai-service via its own DB credentials; these tables are not exposed via any API

### A06 — Vulnerable and Outdated Components
- `AsyncPostgresSaver` from `langgraph-checkpoint-postgres`: no known CVEs at time of spec. Pin version in `requirements.txt`.
- LiteLLM used for title generation: same version already used for chat turns; no additional risk.

### A07 — Identification and Authentication Failures
- All session endpoints require valid Supabase JWT (enforced by api-gateway before forwarding)
- `user_id` extracted from JWT claims via `get_current_user()` dependency — not from user-supplied request body
- `workspace_id` extracted from `X-Workspace-ID` header set by api-gateway (not user-controllable)

### A08 — Software and Data Integrity Failures
- `finalize_node` JSONB write failure: handled gracefully (log warning, request still succeeds). Session history is still available from LangGraph checkpoint for the current session.
- Title generation failure: silently falls back to `"Chat on {date}"`. No crash path.

### A09 — Security Logging and Monitoring Failures
Structured log events to emit:

| Event | Fields | Severity |
|---|---|---|
| `advisor_session_created` | workspace_id, user_id, session_id | INFO |
| `advisor_session_archived` | workspace_id, user_id, session_id, reason | INFO |
| `advisor_session_access_denied` | workspace_id, requesting_user_id, target_session_id | WARN |
| `advisor_session_write_failed` | workspace_id, session_id, error | ERROR |
| `advisor_title_generation_skipped` | workspace_id, session_id, reason (no_credits/error) | WARN |
| `advisor_session_limit_archived` | workspace_id, user_id, archived_session_id | WARN |

### A10 — Server-Side Request Forgery
- Title generation calls LiteLLM (internal routing) — not a user-controlled URL
- No webhook or user-supplied URL processing in this spec
- **Part B:** File re-upload is entirely client-side (FileReader API). The file content is sent to the server as a text string — no server-side file streaming or URL fetching. Zero SSRF/path traversal risk.
- SSRF risk: none

---

## RevLooper-Specific Non-Negotiables

### Workspace Isolation
- Every query on `ai_advisor_sessions` includes `workspace_id = $X-Workspace-ID`
- RLS policy enforces both `workspace_id` AND `user_id` at database level (defence in depth)
- Thread ID for LangGraph checkpointer remains `"{workspace_id}/{session_id}"` — workspace prefix prevents cross-tenant checkpoint collisions

### Credits Before AI
- `billing_service.deduct_credits()` called BEFORE LiteLLM for title generation
- `AppError(code="INSUFFICIENT_CREDITS", status_code=402)` on deduction failure → title generation skipped (non-blocking for the user since it's fire-and-forget)

### SEA Data Privacy
- Session message content constitutes personal data processing if it references leads by name
- Existing `consent_log` table covers this: consent was obtained at lead creation time (Spec 03)
- No new consent records needed for AI Advisor usage (covered by "data_processing" consent type)
- Data retention: session data follows workspace retention policy (Spec 20). No new retention rules needed here.

### No Cross-Service Table Reads
- ai-service owns `ai_advisor_sessions` exclusively
- No direct DB reads from campaign-service, lead-service, etc. within session CRUD endpoints
- Tool calls in the LangGraph graph go via `billing-service` HTTP, not direct DB reads (existing, unchanged)

---

## Penetration Test Checklist (pre-ship)

### Part A — Advisor Sessions
- [ ] IDOR: `GET /sessions/{other_user_session_id}` returns 403
- [ ] IDOR: `GET /sessions/{other_workspace_session_id}` returns 403
- [ ] Unauthorised PATCH: `PATCH /sessions/{other_user_id}` returns 403
- [ ] Unauthorised DELETE: `DELETE /sessions/{other_user_id}` returns 403
- [ ] Session enumeration: sequential UUIDs not accepted (all IDs are random UUID v4)
- [ ] Prompt injection in title: first message containing `\n\nIgnore previous instructions` produces a safe short title
- [ ] JSONB overflow: message with 100KB text is accepted (Postgres TEXT is unbounded); confirm no stack overflow
- [ ] Rate limiting: rapid `POST /v1/advisor/sessions` (> 10/min) is rate-limited by api-gateway sliding window

### Part B — AI Brain Content Management
- [ ] IDOR: `GET /brain/documents/{other_workspace_doc_id}` returns 403
- [ ] IDOR: `PATCH /brain/documents/{other_workspace_doc_id}` returns 403
- [ ] IDOR: `POST /brain/documents/{other_workspace_doc_id}/reindex` returns 403
- [ ] Content size: `PATCH` with content > 100KB returns 400 with `CONTENT_TOO_LARGE` error
- [ ] Content size: `POST /brain/documents` with content > 100KB returns 400 (pre-existing gap now fixed)
- [ ] File re-upload: `.exe`, `.pdf`, binary content — client-side FileReader reads it as garbled text; server stores it as text (no execution risk)
- [ ] Wizard cross-tenant: `GET /v1/onboarding/wizard` with spoofed `X-Workspace-ID` is blocked by api-gateway (header only settable by api-gateway, not the caller)
