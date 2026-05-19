# RevLooper — Implementation Audit
> Last updated: May 18, 2026  
> Status: **COMPLETE** — all 5 groups audited  
> Purpose: Track % implementation per module group so a dedicated session can drive each to 100%.

---

## Master Summary

| Group | Module | Backend % | Frontend % |
|---|---|---|---|
| **1 — Core Platform** | Auth & Workspace | 72% | 45% |
| | Billing & Credits | 42% | 40% |
| **2 — Outreach & Sales** | Lead Management | 75% | 65% |
| | Campaign Builder | 70% | 45% |
| | Sequence Execution | 35% | N/A |
| | Email Outreach | 70% | 55% |
| | Multichannel | 30% | 10% |
| | Inbound Forms | 20% | 5% |
| | Meeting Booking | 75% | 40% |
| **3 — Intelligence** | AI Brain & RAG | 70% | 60% |
| | AI Harvester | 75% | 65% |
| | AI Campaign Builder | 75% | 70% |
| | AI Advisor | 70% | 30% |
| | AI Employee | 80% | 40% |
| | Lead Scoring | 65% | 0% |
| | Analytics & A/B | 60% | 5% |
| | Revenue Signals | 50% | 5% |
| **4 — Inbox & CRM** | Unified Inbox | 75% | 70% |
| | CRM Pipeline | 80% | 65% |
| | Customers & Post-sale | 85% | 0% |
| **5 — Platform** | API Gateway | 85% | 100% |
| | Integration Service | 75% | 85% |
| | Notification Service | 30% | 0% |
| | Comment Processor | 85% | 0% |
| | Webhook Handler | 70% | 0% |
| | Frontend Infrastructure | N/A | 85% |

### Top 10 Production Blockers (Across All Groups)

| # | Blocker | Service | Impact |
|---|---|---|---|
| 1 | `_dispatch()` is fully mocked — **nothing is ever notified** | notification-service | All notification-dependent flows broken |
| 2 | Sequence-worker dispatches (email, LinkedIn, SMS) are **all mocks** | sequence-worker | Product's core loop never executes |
| 3 | Email delivery (`send_email()`) queues a DB record but **never calls an ESP** | outreach-service | Outbound emails never sent |
| 4 | `mock_embed()` returns **zero vector** — semantic search always fails | ai-service / rag-processor | AI Brain is non-functional |
| 5 | OAuth token exchange **commented out** — integrations never connect | integration-service | All 20+ integrations broken |
| 6 | Billing has **zero Alembic migrations** | billing-service | Requires manual SQL in production |
| 7 | **No Paddle webhook handler** — plan upgrades never applied | billing-service | Billing upgrades silently lost |
| 8 | Webhook handler has **no HMAC validation** (Twilio + Resend) | webhook-handler | Security — event injection possible |
| 9 | Middleware trusts `rl-auth=1` cookie with **no JWT validation** | portal middleware | Auth trivially bypassable |
| 10 | Inbound Forms have **no backend at all** and no webhook security | webhook-handler / forms | Feature doesn't exist + security gap |

---

## How to read this

- **%** = rough estimate of real implemented logic vs. what the spec/PRD requires
- 🔴 = blocker (prevents the feature from working at all in production)
- 🟠 = major gap (feature is partially working but incomplete)
- 🟡 = minor gap (nice-to-have or edge case missing)

---

## Group 1 — Core Platform

### 1a. Auth & Workspace

#### Backend (`services/workspace-service/`) — **72%**

| Status | Item |
|---|---|
| ✅ | Workspace CRUD (create, get, update) |
| ✅ | Transactional outbox (`outbox_events` written atomically) |
| ✅ | Member management (add, list, update role, remove) |
| ✅ | Invitation flow (create, accept, 7-day expiry) |
| ✅ | Onboarding wizard endpoint |
| ✅ | Agency management (create, list managed workspaces) |
| ✅ | RBAC `require_role` dependency |
| ✅ | Alembic migrations (3 versions) |
| ✅ | Unit + integration tests, Sentry + OTel |
| 🔴 | Outbox publisher never dispatched — invite emails never sent |
| 🔴 | No `GET /workspaces` (list all workspaces for a user) |
| 🔴 | No list-pending-invitations endpoint |
| 🟠 | No transfer-ownership endpoint |
| 🟠 | No update-agency endpoint |
| 🟡 | No direct-add-member (bypass invitation) |
| 🟡 | No remove-managed-workspace |
| 🟡 | No SAML SSO config endpoint |

#### Frontend (`apps/portal/app/(auth)/`, `settings/`, `workspace/`) — **45%**

| Status | Item |
|---|---|
| ✅ | Full Supabase email + Google + Facebook OAuth flows |
| ✅ | Forgot / verify / update-password flows |
| ✅ | `AuthContext` with `onAuthStateChange` |
| ✅ | Middleware route protection |
| ✅ | Settings: profile, workspace name, security tabs |
| ✅ | Workspace API client + hooks |
| 🔴 | `workspace/page.tsx` is a 28-line stub — no member/team UI |
| 🔴 | 2FA uses hardcoded `code === "123456"` — not real Supabase MFA |
| 🔴 | Devices tab uses `MOCK_DEVICES` array — no real API |
| 🔴 | Middleware trusts `rl-auth=1` cookie with no JWT validation |
| 🟠 | "Change email" button has no handler |
| 🟠 | Avatar upload missing |
| 🟠 | Workspace list pulled from auth metadata, not from API |
| 🟡 | SAML SSO UI absent |

---

### 1b. Billing & Credits

#### Backend (`services/billing-service/`) — **42%**

| Status | Item |
|---|---|
| ✅ | Credit deduction (idempotent, `SELECT FOR UPDATE`) |
| ✅ | `InsufficientCreditsError` → 402 |
| ✅ | Credit refund with deduplication |
| ✅ | Monthly allocation reset (function exists) |
| ✅ | Paginated credit history |
| ✅ | Plan info + feature gate check |
| ✅ | `PLAN_ALLOCATIONS` constants (`starter`/`pro`/`agency`) |
| ✅ | Unit + integration tests |
| 🔴 | **Zero Alembic migrations** — schema must be created manually in prod |
| 🔴 | No Paddle webhook handler — plan upgrades never written to DB |
| 🔴 | No Paddle checkout/session endpoint |
| 🔴 | Monthly reset scheduler: function exists, nothing calls it |
| 🔴 | `seed_gates()` never called — `feature_gates` table empty in prod |
| 🟠 | No topup / add-credits endpoint |
| 🟠 | No subscription management (cancel, pause, upgrade, downgrade) |
| 🟡 | payOS / MoMo / VNPay = zero implementation |

#### Frontend (`apps/portal/app/(dashboard)/billing/`, `plans/`) — **40%**

| Status | Item |
|---|---|
| ✅ | Read-only billing overview (plan info, credit meter) |
| ✅ | Plans tab (4 pricing cards) |
| ✅ | Credits tab (cost table, topup grid) |
| ✅ | Invoices tab (credit history) |
| ✅ | `useBillingPlan` + `useCreditHistory` hooks |
| 🔴 | Upgrade/downgrade buttons are dead (no handler) |
| 🔴 | "Buy extra credits" buttons have no onClick |
| 🔴 | Payment method section is hardcoded mock ("Visa ending in 4242") |
| 🟠 | No cancel subscription UI |
| 🟠 | Invoices tab shows credit transactions, not real Paddle invoices |
| 🟡 | Plan name inconsistency: UI uses `growth`/`scale`, backend uses `starter`/`pro`/`agency` |
| 🟡 | Vietnam payment methods (payOS, MoMo, VNPay) absent from UI |

---

### Group 1 — Action Items for Implementation Session

**Priority order:**
1. 🔴 Add Alembic migration for `billing-service` (tables: `credit_ledger`, `feature_gates`, `billing_subscriptions`)
2. 🔴 Implement Paddle webhook handler (`checkout.session.completed`, `subscription.updated`, `subscription.cancelled`)
3. 🔴 Wire outbox publisher in `workspace-service` (Pub/Sub dispatch for invitation emails)
4. 🔴 Fix `middleware.ts` JWT validation (replace cookie check with real Supabase session verification)
5. 🔴 Build Workspace Members page (`workspace/page.tsx`) — invite, list, change role, remove
6. 🟠 Implement 2FA with Supabase MFA APIs (replace mock timer)
7. 🟠 Add missing workspace endpoints (list-workspaces, list-invitations, transfer-owner)
8. 🟠 Wire billing UI buttons (Paddle Checkout.js integration for upgrade/topup)
9. 🟡 Add Vietnam payment options (payOS / MoMo as secondary billing flow)

---

## Group 2 — Outreach & Sales Automation

> **Status: COMPLETE**

### Summary Table

| Module | Backend % | Frontend % | Biggest Blocker |
|---|---|---|---|
| 2a. Lead Management | **75%** | **65%** | CSV import pipeline absent end-to-end |
| 2b. Campaign Builder | **70%** | **45%** | No visual sequence builder or enrollment UI |
| 2c. Sequence Execution | **35%** | N/A | All step dispatchers are mocks; suppression never checked |
| 2d. Email Outreach | **70%** | **55%** | No actual ESP delivery; OAuth initiation is fake |
| 2e. Multichannel | **30%** | **10%** | LinkedIn and SMS dispatch entirely absent |
| 2f. Inbound Forms | **20%** | **5%** | No forms backend; no webhook HMAC verification (🔴 security) |
| 2g. Meeting Booking | **75%** | **40%** | Public booking page never persists; availability is hardcoded |

---

### 2a. Lead Management

#### Backend (`services/lead-service/`) — **75%**

| Status | Item |
|---|---|
| ✅ | `GET /v1/leads` — paginated list, FTS search, status filter |
| ✅ | `POST /v1/leads` — create with free-plan 1,000-lead cap, outbox event |
| ✅ | `GET /v1/leads/{id}` — fetch single with tags |
| ✅ | `PATCH /v1/leads/{id}` — update fields + custom fields merge |
| ✅ | `PATCH /v1/leads/{id}/custom-fields` — custom field merge endpoint |
| ✅ | `DELETE /v1/leads/{id}` — soft-delete with outbox event |
| ✅ | `POST /v1/leads/bulk` — tag/untag/delete with `confirm_delete` guard |
| ✅ | `GET /v1/leads/{id}/score` + `POST /v1/leads/{id}/score/signal` |
| ✅ | `GET /v1/leads/{id}/activities` — activity timeline |
| ✅ | Full unit test suite (5 test files) |
| 🔴 | No `POST /v1/leads/import` — CSV upload pipeline entirely absent (`HunterClient` exists but is never called from a route) |
| 🔴 | `_bulk_export` has explicit `# TODO: generate CSV, upload to R2, return signed URL` — returns a message only |
| 🟠 | No `POST /v1/leads/{id}/enrich` endpoint — `HunterClient` exists but no route calls it |

#### Frontend (`apps/portal/app/(dashboard)/leads/`) — **65%**

| Status | Item |
|---|---|
| ✅ | Lead list page: search, status filter, score filter, bulk selection, pagination |
| ✅ | Lead detail page: hero card, overview + activity tabs, tag input |
| ✅ | `LeadDetailSheet` with custom fields support |
| ✅ | Full TanStack Query hook set: `useLeads`, `useLead`, `useCreateLead`, `useUpdateLead`, `useDeleteLead`, `useUpdateLeadCustomFields` |
| 🔴 | "Import CSV" button has no `onClick` handler; `useImportLeads` hook absent |
| 🟠 | "Enrich" button has no `onClick` handler; `useEnrichLead` hook absent |
| 🟠 | No `useBulkExport` hook; no download-link for bulk export result |
| 🟡 | Suppression status badge not surfaced in list or detail view (skipped in E2E with explicit `test.skip`) |

#### Action Items
1. Implement `POST /v1/leads/import` (parse CSV → dedup → bulk insert) + `useImportLeads` mutation + file-upload modal in the UI
2. Implement `POST /v1/leads/{id}/enrich` (call `HunterClient.verify_email()`, update `enrichment_status`, outbox event) + `useEnrichLead` mutation + wire "Enrich" button
3. Implement `_bulk_export` (build CSV → upload to R2 → return signed URL) + `useBulkExport` hook + download link in bulk action bar

---

### 2b. Campaign Builder

#### Backend (`services/campaign-service/`) — **70%**

| Status | Item |
|---|---|
| ✅ | Full campaign CRUD + archive (soft-delete) with outbox events |
| ✅ | `GET/POST /v1/sequences` — list + create per-campaign |
| ✅ | `GET/POST /v1/sequences/{id}/steps` — add/list steps; 7 step types validated |
| ✅ | `POST /v1/sequences/{id}/enrollments` — enroll single lead |
| ✅ | `POST /v1/ai-draft` — full credit reserve → AI call → consume/release, idempotent |
| ✅ | `GET/POST /v1/automation/rules` — rule CRUD + condition evaluator |
| ✅ | `GET/POST /v1/content` — email content templates |
| ✅ | `approval_service`: enqueue, approve, reject, list_pending — all implemented |
| ✅ | 6 unit + 1 integration test files |
| 🔴 | No `PATCH /v1/sequences/{id}` or `DELETE /v1/sequences/{id}` — sequences are immutable after creation |
| 🔴 | No `PATCH/DELETE /v1/sequences/{id}/steps/{step_id}` — steps cannot be edited/reordered |
| 🟠 | `approval_service` router never mounted in `app/main.py` — approval queue is unreachable |
| 🟡 | No `GET /v1/campaigns/{id}/stats` — open/click/bounce rates hardcoded to `"—"` in UI |

#### Frontend (`apps/portal/app/(dashboard)/campaigns/`) — **45%**

| Status | Item |
|---|---|
| ✅ | Campaign list with status/search filters, AI badge |
| ✅ | New campaign wizard: AI prompt mode + manual mode |
| ✅ | Campaign detail: overview tab, custom-fields tab, settings/archive tab |
| ✅ | `useDraftCampaign`, `useCreateCampaign`, `useDeleteCampaign`, `useSequences`, `useSequenceSteps` hooks |
| 🔴 | **Sequences tab is a static placeholder** — "No sequences attached", `+ Attach sequence` has no handler; no drag-and-drop step builder |
| 🔴 | **Leads tab shows** `"Lead enrollment coming soon"` — "Add Leads" button is unhandled |
| 🟡 | No Automation Rules UI (router exists, no page/component/hooks) |

#### Action Items
1. Build visual Sequence Builder UI: step timeline list + "Add Step" modal (step type selector + config form per type); wire `useAddStep`/`useSequenceSteps` to the "Sequences" tab
2. Implement `PATCH/DELETE /v1/sequences/{id}/steps/{step_id}` + mount `approval_service` router in `campaign-service/app/main.py`
3. Add lead enrollment flow: "Add Leads" → lead picker modal → `POST /v1/sequences/{id}/enrollments`; implement `useEnrollLead` mutation

---

### 2c. Sequence Execution

#### Backend (`services/sequence-worker/`) — **35%**

| Status | Item |
|---|---|
| ✅ | Poll loop: select `pending` executions with `scheduled_at <= now`, process up to 100/batch |
| ✅ | Daily send-cap check, reschedule to next midnight on cap hit |
| ✅ | Step dispatcher routing to type-specific handlers |
| ✅ | `handle_wait`: returns `next_delay_seconds` from config |
| ✅ | Enrollment advancement: increments `current_step_position`, creates next `WorkerExecution` |
| 🔴 | `is_suppressed()` hardcodes `return False` — no HTTP call to outreach-service |
| 🔴 | `handle_email` returns `StepResult(success=True)` without calling `outreach-service POST /v1/sends` |
| 🔴 | `handle_condition` always evaluates `condition_met = True`; branch jump logic not implemented |
| 🟠 | Daily send-cap counter is `_daily_counters: dict` (in-memory, resets on pod restart) — comment says "real: Redis INCR" |
| 🟠 | `handle_linkedin_connect/message` mocked — no HTTP call to integration-service |
| 🟠 | `handle_sms` mocked — no call to notification-service |
| 🟠 | `ab_split` step type registered in `VALID_STEP_TYPES` but has no `_HANDLERS` entry — calling it raises an unhandled error |

#### Action Items
1. Replace `is_suppressed()` mock with async HTTP call to `outreach-service GET /v1/suppression/check?email=…&workspace_id=…`
2. Replace `handle_email` mock with real `httpx.AsyncClient` call to `outreach-service POST /v1/sends`; replace in-memory daily cap with Redis `INCR/EXPIRE`
3. Implement `handle_condition` branch resolution: after evaluation, look up `config["true_step_id"]` / `config["false_step_id"]` and set `enrollment.current_step_position` accordingly

---

### 2d. Email Outreach & Deliverability

#### Backend (`services/outreach-service/`) — **70%**

| Status | Item |
|---|---|
| ✅ | `POST/GET /v1/mailboxes` — CRUD, active-only filter |
| ✅ | `POST /v1/sends` — suppression-first gate → ownership check → daily cap → queue record |
| ✅ | `POST/GET/DELETE /v1/suppression` — add/list/remove, idempotent add |
| ✅ | Gmail + Outlook OAuth 2.0: HMAC-signed state, token exchange, Fernet encryption at rest |
| ✅ | `POST /v1/webhooks/{provider}` — SendGrid + Postmark parsers, idempotent via `esp_event_id`, auto-suppresses on bounce/complaint |
| 🔴 | `email_service.send_email()` creates a `status="queued"` DB record but **never calls an ESP** — email is never sent |
| 🔴 | `ConnectModal.handleConnect()` is `setTimeout(() => onClose(), 1000)` — never calls `POST /v1/mailboxes/connect/gmail` |
| 🟠 | No `GET /v1/suppression/check?email=…` endpoint (sequence-worker references this exact URL in a comment) |
| 🟠 | No `DELETE /v1/mailboxes/{id}` endpoint |
| 🟠 | Warmup scheduling mentioned in UI but no backend warmup service |

#### Frontend (`apps/portal/app/(dashboard)/outreach/`) — **55%**

| Status | Item |
|---|---|
| ✅ | Mailbox list, suppression list with per-entry remove, DNS/DKIM/DMARC checklist |
| ✅ | All four suppression API functions in `lib/api/outreach.ts` wired to working endpoints |
| 🔴 | `ConnectModal.handleConnect()` is a fake stub — OAuth flow never initiated |
| 🟠 | No `useInitiateOAuth` hook |
| 🟠 | No warmup config UI |

#### Action Items
1. Implement ESP dispatch layer: `ESPAdapter` calling SendGrid/Postmark when `EmailSend.status == "queued"` (or a Cloud Task drain); trigger from `send_email()`
2. Wire `ConnectModal.handleConnect()` to call `POST /v1/mailboxes/connect/{provider}`, receive `authorization_url`, redirect browser; add `useInitiateOAuth` hook
3. Add `GET /v1/suppression/check?email=…&workspace_id=…` endpoint

---

### 2e. Multichannel Outreach

#### Backend (`services/outreach-service/app/api/v1/channels.py`) — **30%**

| Status | Item |
|---|---|
| ✅ | `POST /v1/channels/sends` — enqueue with suppression check |
| ✅ | `GET /v1/channels/sends` — list by lead |
| ✅ | `PATCH /v1/channels/sends/{id}/sent` and `/skipped` |
| 🔴 | No LinkedIn OAuth/session integration in `integration-service` — `handle_linkedin_connect/message` in sequence-worker is mocked with nothing to call |
| 🔴 | No SMS provider connection — Twilio/ESMS credentials unconfigurable, no `notification-service` link |

#### Frontend (`apps/portal/app/(dashboard)/channels/`) — **10%**

| Status | Item |
|---|---|
| ✅ | Page UI structure: LinkedIn quota bars, SMS account cards, consent stats table |
| 🔴 | `MOCK_LINKEDIN: LinkedInAccount[] = []` and `MOCK_SMS: SmsAccount[] = []` — explicit comment: "No backend for LinkedIn/SMS yet" |
| 🔴 | No `useChannelSends` / `useConnectLinkedIn` / `useConnectSMS` hooks |
| 🟠 | Consent stats show hardcoded `CONSENT_STATS` — no `consent_log` table writes in any flow |

#### Action Items
1. Build LinkedIn integration in `integration-service` (OAuth handshake, store cookies/token); expose `GET /v1/integrations/linkedin` status; wire to channel send dispatch
2. Connect SMS channel to `notification-service` → Twilio (global) / ESMS.vn (VN); resolve provider from workspace settings
3. Build `useChannelSends`/`useConnectLinkedIn`/`useConnectSMS` hooks; replace mock arrays with live API data

---

### 2f. Inbound Forms / Anchors

#### Backend (`services/webhook-handler/`) — **20%**

| Status | Item |
|---|---|
| ✅ | `POST /webhook/{provider}` routing to Resend, Twilio, Calendly handlers |
| ✅ | Resend: maps 6 event types; Twilio: maps 7 SMS statuses; Calendly: maps booking/cancel |
| ✅ | Unit tests for all three handlers |
| 🔴 🔒 | **No HMAC/signature verification** — unauthenticated callers can inject arbitrary events (Resend `Svix-Signature`, Twilio `X-Twilio-Signature`) |
| 🔴 | All handlers return a plain dict — **no DB writes, no downstream service calls** |
| 🔴 | No forms backend at all — no `form-service`, no DB tables, no submission storage |
| 🟠 | Calendly `invitee.created` never creates a lead or calls booking-service |

#### Frontend (`apps/portal/app/(dashboard)/forms/`) — **5%**

| Status | Item |
|---|---|
| ✅ | UI shell with form list layout |
| 🔴 | `MOCK_FORMS: InboundForm[] = []` — explicit comment: "No forms API service yet" |
| 🟠 | No form builder, embed code generator, or conversion analytics |

#### Action Items
1. **Immediately** add HMAC verification: Resend `Svix-Signature`, Twilio `X-Twilio-Signature`. Reject events that fail.
2. Implement downstream persistence: Resend bounce/complaint → `outreach-service POST /v1/suppression`; Calendly booking → `booking-service POST /v1/bookings`
3. Design and implement forms backend: `inbound_forms` + `form_submissions` tables, CRUD endpoints, public `POST /v1/forms/{id}/submit` endpoint; wire forms page

---

### 2g. Meeting Booking

#### Backend (`services/booking-service/`) — **75%**

| Status | Item |
|---|---|
| ✅ | `POST/GET /v1/meeting-types` — create + list |
| ✅ | `POST/GET /v1/bookings` — create (idempotent on `cal_booking_id`), list, outbox event |
| ✅ | `cancel_booking` — soft-cancel + GCal event cancellation |
| ✅ | Full `google_calendar_service`: create/cancel events, free/busy, Fernet token storage with auto-refresh |
| ✅ | GCal OAuth: connect + callback endpoints |
| ✅ | Unit tests for booking + GCal service |
| 🔴 | No `GET /v1/meeting-types/{slug}` — public booking page needs slug-based lookup (only `id`-based exists) |
| 🟠 | No slot-availability endpoint — `get_free_busy()` exists but is never called in the booking API flow |

#### Frontend (`apps/portal/app/(dashboard)/meetings/`, `apps/portal/app/book/`) — **40%**

| Status | Item |
|---|---|
| ✅ | Meetings page: stats cards, overview/types/bookings tabs, `useMeetingTypes` + `useBookings` hooks wired to live API |
| ✅ | Public booking page: calendar component, time slot grid, attendee form, confirmation screen |
| 🔴 | Public booking "Confirm Booking" button sets local state `"confirmed"` but **never calls `POST /v1/bookings`** — no booking is persisted |
| 🔴 | `generateSlots()` hardcodes `unavailableHours = [10, 11, 14]` — GCal free/busy never consulted |
| 🟠 | "+ New Meeting Type" button has no click handler — `useCreateMeetingType` mutation absent |
| 🟠 | `Booking` interface missing `scheduledAt` — completion rate stat always shows `"—"` |
| 🟡 | No meeting detail page, no cancel/reschedule UI in portal |
| 🟡 | No Google Calendar connect button in meetings page (OAuth endpoints exist) |

#### Action Items
1. Wire public booking "Confirm" to `POST /v1/bookings` — pass `cal_booking_id`, `attendee_email`, `attendee_name`, `meeting_type_id`, `scheduled_at`; show real confirmation on 201
2. Replace `generateSlots()` with `GET /v1/bookings/availability?workspace_id=…&meeting_type_id=…&date=…` which calls `google_calendar_service.get_free_busy()` internally
3. Add `GET /v1/meeting-types/{slug}` endpoint; add `useCreateMeetingType` mutation + "New Meeting Type" modal

---

### Group 2 — Action Items for Implementation Session (Priority Order)

1. 🔴🔒 **Add HMAC verification to webhook-handler** (Resend + Twilio) — security blocker, no user impact but attackers can inject events
2. 🔴 **Replace all mocked sequence-worker dispatchers** with real HTTP calls (email → outreach-service, LinkedIn → integration-service, SMS → notification-service); replace in-memory cap with Redis
3. 🔴 **Implement ESP dispatch** in outreach-service: drain the `"queued"` email queue via an `ESPAdapter` calling SendGrid/Postmark
4. 🔴 **Wire public booking page** submit to `POST /v1/bookings` + slot availability to `get_free_busy()`
5. 🔴 **Build Sequence Builder UI** (drag-and-drop step editor + step config forms)
6. 🔴 **Add lead enrollment flow** in campaign detail (lead picker → `POST /v1/sequences/{id}/enrollments`)
7. 🔴 **Wire OAuth connect modal** in outreach page to real `POST /v1/mailboxes/connect/{provider}`
8. 🟠 **Implement CSV import pipeline** (backend + `useImportLeads` mutation + file-upload modal)
9. 🟠 **Build forms backend** (DB tables, CRUD, public submit endpoint) + wire forms page
10. 🟠 **Build LinkedIn + SMS integration** in integration-service / notification-service

---

## Group 3 — Intelligence

> **Status: COMPLETE**

### Summary Table

| Module | Backend % | Frontend % | Biggest Blocker |
|---|---|---|---|
| 3a. AI Brain & RAG | **70%** | **60%** | Real embeddings are mocked (zero vector) |
| 3b. AI Harvester | **75%** | **65%** | Feature gate is OFF in production; templates not seeded |
| 3c. AI Campaign Builder | **75%** | **70%** | `POST /campaigns/draft` endpoint missing; billing client not injected |
| 3d. AI Advisor / Co-pilot | **70%** | **30%** | No chat interface UI page at all |
| 3e. AI Employee | **80%** | **40%** | Agent catalog is empty; ai-service dispatch stubbed |
| 3f. Lead Scoring | **65%** | **0%** | No score UI anywhere; event-driven trigger missing |
| 3g. Analytics & A/B Testing | **60%** | **5%** | Analytics dashboard is a placeholder page |
| 3h. Revenue Signals | **50%** | **5%** | No CRM event subscription; no pipeline drop trigger |

---

### 3a. AI Brain & RAG

#### Backend (`services/ai-service/`, `services/rag-processor/`) — **70%**

| Status | Item |
|---|---|
| ✅ | Document CRUD: `POST/GET/PATCH/DELETE /v1/brain/documents` |
| ✅ | Ingestion pipeline: chunk text → store in `ai_brain_chunks` table |
| ✅ | `POST /v1/brain/search` — semantic search over chunks |
| ✅ | Wizard synthesis: reads knowledge docs, synthesizes responses |
| ✅ | `embedding_status` tracking on `workspace_knowledge_docs` |
| ✅ | Schema: `workspace_knowledge_docs`, `ai_brain_chunks` with pgvector columns |
| ✅ | Workspace isolation enforced |
| 🔴 | **`mock_embed()` returns zero vector** — real OpenAI `text-embedding-3-small` never called |
| 🟠 | `embedding_status` not actively managed — always shows "ready" even before chunks are written |
| 🟠 | No document versioning — edits require delete + re-upload |
| 🟡 | No BM25/keyword fallback when vector search returns low scores |

#### Frontend (`apps/portal/app/(dashboard)/ai-brain/`) — **60%**

| Status | Item |
|---|---|
| ✅ | Document list, upload modal, document detail drawer, delete with confirmation |
| ✅ | 9 document type labels rendered |
| ✅ | Integration with Harvester sessions (Drafts tab) |
| 🟠 | No document edit modal — only delete + re-upload |
| 🟡 | No search panel to test `POST /v1/brain/search` |
| 🟡 | No embedding status indicator while chunks are being generated |

#### Action Items
1. Replace `mock_embed()` with real OpenAI `text-embedding-3-small` (1536 dims) call in `rag-processor/engine.py`
2. Implement async embedding job to update `embedding_status` in real time
3. Add document edit modal (in-place content modification without re-upload)

---

### 3b. AI Harvester

#### Backend (`services/ai-service/`) — **75%**

| Status | Item |
|---|---|
| ✅ | Session CRUD: `POST/GET/PATCH/DELETE /v1/brain/harvester/sessions` |
| ✅ | State machine: `active → draft → committed → deleted` |
| ✅ | `POST /v1/brain/harvester/sessions/{id}/probe` — SSE Socratic turn streaming |
| ✅ | `GET /v1/brain/harvester/templates` — topic-specific guide list |
| ✅ | `POST /v1/brain/harvester/sessions/{id}/dump` — quick bulk-paste mode |
| ✅ | `POST /v1/brain/harvester/sessions/{id}/synthesize` — Markdown synthesis |
| ✅ | `POST /v1/brain/harvester/sessions/{id}/commit` — saves synthesized doc to AI Brain |
| ✅ | Consent tracking in `consent_log` before synthesis (SEA compliance) |
| ✅ | LangGraph graph integration with checkpointer pattern |
| 🔴 | **Feature gate `AI_BRAIN_HARVESTER_ENABLED = False`** — disabled in production |
| 🟠 | Template seeding script exists but not in Alembic migrations — `GET /templates` returns empty list |
| 🟠 | Reflection loop (`harvester_reflection_service.py`) not triggered after commit |
| 🟡 | No session rollback if synthesis fails midway |

#### Frontend (`apps/portal/app/(dashboard)/ai-brain/harvester/`) — **65%**

| Status | Item |
|---|---|
| ✅ | Session chat page with status badge, SSE streaming probe turn |
| ✅ | Synthesize + Commit + Resume + Delete buttons wired |
| ✅ | Template picker modal on new session |
| 🟠 | Full template browsing/details not implemented |
| 🟠 | No quick-dump modal UI for bulk-paste mode |
| 🟡 | No session sidebar switcher |
| 🟡 | Reflection proposals not displayed |

#### Action Items
1. Enable feature gate (set `AI_BRAIN_HARVESTER_ENABLED = True`) after adding security + E2E tests
2. Add harvester templates to an Alembic data migration so the list is populated on first deploy
3. Trigger reflection loop after commit and display gap-suggestions in AI Brain UI

---

### 3c. AI Campaign Builder

#### Backend (`services/campaign-service/`) — **75%**

| Status | Item |
|---|---|
| ✅ | `AIDraftService.generate_draft()` — credit reserve → LLM call → consume/release pattern |
| ✅ | Idempotency key support (cached draft on duplicate call) |
| ✅ | Outbox event `campaign.ai_draft_completed` written atomically |
| ✅ | `POST /campaigns` accepts `ai_generated=true` flag |
| ✅ | Full test coverage: billing order, idempotency, failure/release paths |
| 🟠 | No `POST /v1/campaigns/draft` HTTP endpoint — service exists, not mounted in router |
| 🟠 | `billing_client` injected as mock in tests only — not wired in production router |
| 🟡 | No draft history per campaign |

#### Frontend (`apps/portal/app/(dashboard)/campaigns/new/`) — **70%**

| Status | Item |
|---|---|
| ✅ | Two-mode new campaign page: "AI Generate" tab + "Manual Create" tab |
| ✅ | Prompt input → `useDraftCampaign()` → preview step with name/description |
| ✅ | "Apply Draft" creates campaign and redirects to campaign editor |
| ✅ | Error handling for generation failures |
| 🟠 | Full draft preview missing — shows name/description only, not sequence outline or target audience |
| 🟡 | No "Regenerate" button for same prompt |
| 🟡 | No visual loading state on generate button |

#### Action Items
1. Add `POST /v1/campaigns/draft` HTTP endpoint in campaign-service router
2. Inject real `billing_client` (HTTP call to billing-service) in production
3. Expand draft preview to show full LLM response (sequence steps, target audience, goals)

---

### 3d. AI Advisor / Co-pilot

#### Backend (`services/ai-service/`) — **70%**

| Status | Item |
|---|---|
| ✅ | `POST /v1/advisor/chat` with LangGraph orchestration |
| ✅ | Session CRUD: `POST/GET/PATCH/DELETE /v1/advisor/sessions` |
| ✅ | Message history stored in `ai_advisor_sessions.messages` JSONB |
| ✅ | Auto-title generation after first turn |
| ✅ | Max 5 active sessions per user enforced |
| ✅ | EDD eval tests for response quality |
| 🟠 | Tool implementations call mock/dummy data — not connected to real lead/campaign services |
| 🟡 | No SSE streaming — returns full response at once |
| 🟡 | Spec 31 advisor notifications (pipeline drop alerts) not wired to notification-service |

#### Frontend — **30%**

| Status | Item |
|---|---|
| ✅ | `AdvisorSessionSidebar` component (session list, new chat, delete/archive) |
| ✅ | `useAdvisorChat()` + session hooks |
| 🔴 | **No chat interface page** — `app/(dashboard)/advisor/[sessionId]/page.tsx` does not exist |
| 🟠 | `AdvisorSessionSidebar` is not integrated into dashboard layout |
| 🟡 | No streaming display for SSE responses |

#### Action Items
1. Create `apps/portal/app/(dashboard)/advisor/page.tsx` (session list) and `.../advisor/[sessionId]/page.tsx` (chat interface with message display + input)
2. Integrate `AdvisorSessionSidebar` into main dashboard layout
3. Complete tool implementations in LangGraph graph: connect `retrieve` node to real lead-service / campaign-service HTTP calls

---

### 3e. AI Employee

#### Backend (`services/ai-employee-service/`) — **80%**

| Status | Item |
|---|---|
| ✅ | `GET /v1/employees/catalog` — lists agents (`coming_soon` flag) |
| ✅ | Rental flow: `POST/GET/PATCH /v1/employees/rentals` + cancel grace period |
| ✅ | Run dispatch: `POST/GET /v1/employees/runs` + completion webhook + feedback |
| ✅ | Approval queue: list, approve, reject (high-spend runs) |
| ✅ | SOPs: `POST/GET/PATCH /v1/employees/sops` |
| ✅ | Workspace settings endpoint |
| ✅ | Credit reserve/release before run execution |
| ✅ | Spend caps (daily + monthly) enforced before dispatch |
| ✅ | Background workers: runaway-loop sweeper, expired-approval sweeper, cancellation finalizer |
| ✅ | Full unit test suite |
| 🟠 | Agent catalog table is empty — no agents seeded in Alembic |
| 🟠 | AI-service dispatch integration incomplete — `ai_service_client.py` exists but graph dispatch not fully wired |
| 🟠 | Paddle subscription webhooks for rental lifecycle stubbed |

#### Frontend (`apps/portal/app/(dashboard)/employees/`) — **40%**

| Status | Item |
|---|---|
| ✅ | Landing page with "Coming soon" state |
| ✅ | Rentals list page with status badge, spend caps, dry-run indicator |
| ✅ | Page scaffolding for catalog detail, approvals |
| 🟠 | No catalog browsing UI (deferred until Spec 41) |
| 🟠 | Rental detail page is incomplete — no content, no edit UI |
| 🟠 | Run history and feedback UI missing |
| 🟡 | Approvals detail view missing (list shows, no approve/reject UX) |

#### Action Items
1. Seed at least one demo agent in `ai_employee_catalog` table via Alembic data migration
2. Complete AI-service integration: implement graph dispatch → receive completion webhook → update run status → settle credits
3. Build rental detail page: rental info, active runs, spend burn, SOP editor, pause/resume/cancel, model switch

---

### 3f. Lead Scoring

#### Backend — **65%**

| Status | Item |
|---|---|
| ✅ | `LeadScoringService.apply_signal()` — atomic signal + score update |
| ✅ | Score clamped [0, 100]; label computed (Hot ≥75, Warm 40–74, Cold <40) |
| ✅ | 13 positive + negative signal weights defined |
| ✅ | `lead_score_signals` audit log |
| ✅ | Scoring worker (GKE CronJob) with daily batch + decay logic |
| 🟠 | No automatic event consumer — outreach events (email_opened, replied) never trigger `apply_signal()` |
| 🟠 | Scoring worker runs daily batch only; not event-driven |
| 🟡 | Decay function exists in `weights.py` but not called from `apply_signal()` |
| 🟡 | No per-workspace weight customisation |

#### Frontend — **0%**

| Status | Item |
|---|---|
| 🔴 | No score column or score badge in lead list |
| 🔴 | No score/signal history on lead detail card |
| 🟠 | No score filter in lead search (Hot/Warm/Cold or range) |
| 🟠 | No hot-lead indicator in inbox or anywhere |

#### Action Items
1. Wire outreach-service Pub/Sub consumer in lead-service to call `apply_signal()` on `email_opened`, `replied`, `bounced`, `unsubscribed` events
2. Add `score` + `score_label` column to lead list with colour-coded Hot/Warm/Cold badge
3. Add score filter to lead list page (Hot/Warm/Cold toggle or range slider)

---

### 3g. Analytics & A/B Testing

#### Backend (`services/analytics-service/`, `services/analytics-aggregator/`) — **60%**

| Status | Item |
|---|---|
| ✅ | `POST /analytics/campaigns/snapshot` — upsert daily metrics (sent, opened, replied, bounced); calculates rates |
| ✅ | `GET /analytics/campaigns/{id}/snapshots` — historical snapshots for date range |
| ✅ | `POST/GET /analytics/revenue` — pipeline snapshot upsert + history |
| ✅ | `GET /analytics/revenue/campaigns` — revenue by campaign |
| ✅ | Pipeline drop detection: `detect_pipeline_drop()` (>20% WoW) |
| ✅ | Analytics aggregator batch job: raw OutreachEvent → daily `CampaignMetricsSnapshot` |
| 🟠 | No daily job trigger — aggregator exists but no Cloud Scheduler / Cloud Run Job configured |
| 🟠 | A/B testing: `AbTestCreate` schema exists, no service layer or persistence |
| 🟡 | No attribution model (cohort analysis, which campaign sourced which lead) |
| 🟡 | No statistical forecast model for `projected_revenue_low/high` |

#### Frontend (`apps/portal/app/(dashboard)/analytics/`) — **5%**

| Status | Item |
|---|---|
| 🔴 | Analytics page is a **"coming soon" placeholder** — no charts |
| 🔴 | No open/reply/bounce rate line charts |
| 🔴 | No revenue forecast chart |
| 🟠 | No A/B test UI |
| 🟠 | No campaign attribution drill-down |

#### Action Items
1. Build analytics dashboard: open/reply/bounce rate line charts for selected campaign + date range (Recharts or Chart.js)
2. Build revenue dashboard: pipeline value trend + win rate + projected revenue forecast
3. Configure daily Cloud Scheduler → aggregator Cloud Run Job to convert OutreachEvents → snapshots

---

### 3h. Revenue Signals

#### Backend (`services/analytics-service/`) — **50%**

| Status | Item |
|---|---|
| ✅ | `pipeline_snapshots` + `campaign_revenue_snapshots` tables + upsert |
| ✅ | `GET /analytics/revenue` — current pipeline, win_rate, projections, history, by_campaign |
| ✅ | Workspace isolation |
| 🟠 | No CRM event subscription — nothing populates pipeline snapshots automatically |
| 🟠 | `detect_pipeline_drop()` exists but is never called; no notification trigger |
| 🟡 | No forecast model for `projected_revenue_low/high` (accepted in upsert but computed externally) |

#### Frontend — **5%** (same placeholder as analytics section)

#### Action Items
1. Subscribe analytics-service to CRM events (`deal_won`, `deal_lost`, `deal_updated`) → call `upsert_pipeline_snapshot()` daily
2. Wire `detect_pipeline_drop()` → publish Pub/Sub message → notification-service → AI Advisor alert
3. Build revenue forecast dashboard (pipeline trend + win rate + projection chart)

---

### Group 3 — Action Items for Implementation Session (Priority Order)

1. 🔴 **Replace `mock_embed()` with real OpenAI `text-embedding-3-small`** — entire RAG system returns zero results without this
2. 🔴 **Build Advisor chat interface** (`/advisor/[sessionId]/page.tsx`) + integrate sidebar into layout
3. 🔴 **Add score column + Hot/Warm/Cold badge to lead list** — users have no visibility into lead quality
4. 🔴 **Build analytics dashboard** with open/reply/bounce rate charts and revenue forecast
5. 🟠 **Enable AI Harvester feature gate** after security + E2E tests pass
6. 🟠 **Seed harvester templates** via Alembic data migration
7. 🟠 **Wire outreach events → `LeadScoringService.apply_signal()`** (Pub/Sub consumer in lead-service)
8. 🟠 **Add `POST /v1/campaigns/draft` HTTP endpoint** + inject real billing client
9. 🟠 **Set up daily aggregation job** (Cloud Scheduler → analytics-aggregator)
10. 🟠 **Subscribe analytics-service to CRM events** for pipeline snapshot population

---

## Group 4 — Inbox & CRM

> **Status: COMPLETE**

### Summary Table

| Module | Backend % | Frontend % | Biggest Blocker |
|---|---|---|---|
| 4a. Unified Inbox | **75%** | **70%** | AI intent + draft generation are mocked; `from_email`/`sent_at` missing from schema; email inbound not wired |
| 4b. CRM — Deals Pipeline | **80%** | **65%** | Deal creation form absent; customer endpoints misplaced in wrong service; deal edit UI missing |
| 4c. Customers & Post-sale | **85%** | **0%** | **Entire frontend missing** — no page, no hooks, no API client |

---

### 4a. Unified Inbox

#### Backend (`services/inbox-service/`) — **75%**

| Status | Item |
|---|---|
| ✅ | Thread CRUD: `POST/GET /v1/inbox/threads`, `GET /v1/inbox/threads/{id}`, `PATCH /v1/inbox/threads/{id}` |
| ✅ | Messages: `POST/GET /v1/inbox/threads/{id}/messages` |
| ✅ | AI Drafts: `POST /v1/inbox/threads/{id}/draft`, `POST /v1/inbox/drafts/{id}/send` |
| ✅ | Keyword-based `classify_intent()` — detects 5 intent classes |
| ✅ | Models: `InboxThread`, `InboxMessage`, `AiReplyDraft` with indexes |
| ✅ | Workspace isolation |
| ✅ | Tests: intent classification + CRUD |
| 🔴 | `classify_intent()` is keyword-based mock — comment says "real: POST ai-service"; no LLM call, no credit deduction |
| 🔴 | `POST /v1/inbox/threads/{id}/draft` returns a hardcoded `"Hi there, thank you for your message..."` template — no ai-service call, no credit deduction (violates arch rule: Credits before AI) |
| 🔴 | Email inbound processor not wired — no webhook-handler/email-inbound integration; inbox will be empty unless threads are manually created via API |
| 🟠 | `from_email` missing from `ThreadOut` schema — frontend renders null sender names |
| 🟠 | `sent_at` missing from `MessageOut` schema — frontend shows "Invalid Date" on messages |
| 🟡 | "Archive" status supported in model but no dedicated archive endpoint |
| 🟡 | No snooze UI or time-picker |
| 🟡 | No full-text search endpoint |

#### Frontend (`apps/portal/app/(dashboard)/inbox/`) — **70%**

| Status | Item |
|---|---|
| ✅ | Thread list with unread dot, from_email, subject, intent badge |
| ✅ | 6-button intent filter bar (All, Interested, Question, Meeting Request, Out of Office, Not Interested) |
| ✅ | Thread detail: subject, sender, intent badge, message history |
| ✅ | Message composer textarea + send button |
| ✅ | "Generate AI Draft" → draft preview callout → "Use draft" / "Dismiss" |
| ✅ | Auto-marks thread read on selection |
| ✅ | Full hook set: `useThreads`, `useMessages`, `useSendMessage`, `useGenerateDraft`, `useSendDraft`, `useMarkRead`, `useUpdateThreadStatus` |
| 🔴 | Thread sender names show null because `from_email` is absent from API response |
| 🔴 | Message timestamps show "Invalid Date" because `sent_at` is absent from API response |
| 🟡 | "Archive" button in thread detail drawer has no click handler |
| 🟡 | No bulk multi-select, bulk archive, or bulk mark-read |

#### Action Items
1. Replace mock `classify_intent()` + mock draft generation with real `ai-service` HTTP calls; add credit deduction via `billing-service` **before** each LLM call
2. Add `from_email` to `InboxThread` model + `ThreadOut` schema; add `sent_at` to `InboxMessage` + `MessageOut` schema; update `lib/api/inbox.ts` TypeScript interfaces
3. Implement email inbound processor: accept Resend/Postmark webhooks → auto-create `InboxThread` + `InboxMessage`; link thread to lead by matching email

---

### 4b. CRM — Deals Pipeline

#### Backend (`services/crm-service/`) — **80%**

| Status | Item |
|---|---|
| ✅ | Deal Stages CRUD: `POST/GET /v1/deal-stages` |
| ✅ | Deals: `POST/GET /v1/deals`, `PATCH /v1/deals/{id}/move` |
| ✅ | Activities: `POST/GET /v1/deals/{id}/activities` (append-only log) |
| ✅ | Auto-creates `Customer` record + publishes `deal.won` event when deal moves to won stage |
| ✅ | Transactional outbox: `DealOutboxEvent` for `deal.won`, `deal.lost`, `deal.stage_changed` |
| ✅ | Full test coverage |
| 🟠 | No `GET /v1/deals/{id}` endpoint — deal detail cannot be pre-fetched by ID |
| 🟠 | No `PATCH /v1/deals/{id}` endpoint — title and amount cannot be updated after creation |
| 🟠 | `GET /v1/customers` + `PATCH /v1/customers/{id}/lifecycle` are mounted in crm-service — **violates bounded context** (Customer model lives in customer-service) |
| 🟡 | No deal soft-delete; closed deals accumulate forever |
| 🟡 | No custom fields on deals |

#### Frontend (`apps/portal/app/(dashboard)/crm/`) — **65%**

| Status | Item |
|---|---|
| ✅ | Multi-column Kanban board with drag-and-drop |
| ✅ | Stage headers with deal count + total pipeline value |
| ✅ | Draggable deal cards with title, status badge, amount |
| ✅ | Deal detail drawer with stage selector buttons |
| ✅ | Header stats: "X open deals · $Y pipeline" |
| ✅ | Hooks: `useDealStages`, `useDeals`, `useCreateDeal`, `useMoveDeal`, `useAddActivity` |
| 🔴 | "Add Deal" button exists but has **no click handler** — deal creation form absent |
| 🟠 | Deal detail drawer shows title/status/amount but all fields are read-only — no edit form |
| 🟠 | No activity history or "Add Activity" UI in deal drawer |
| 🟡 | No stage management UI (create, rename, reorder, delete stages) |
| 🟡 | No deal search or filter by title, amount, date |

#### Action Items
1. Move `GET /v1/customers` + `PATCH /v1/customers/{id}/lifecycle` out of crm-service into customer-service (bounded context violation); remove `Customer` model from crm-service
2. Add deal creation modal (title, amount, stage, lead_id inputs) + wire "Add Deal" button; add `PATCH /v1/deals/{id}` backend endpoint + edit mode in drawer
3. Add activity timeline in deal detail drawer: fetch `GET /v1/deals/{id}/activities`, render chronological log, add "Add Activity" button → modal (type + note + occurred_at)

---

### 4c. Customers & Post-sale

#### Backend (`services/customer-service/`) — **85%**

| Status | Item |
|---|---|
| ✅ | Customer CRUD: `POST/GET/GET/{id}/PATCH/DELETE /v1/customers` |
| ✅ | `PATCH /v1/customers/{id}/health` — updates health score + auto-labels (Healthy ≥70, At Risk 40–69, Churned <40) |
| ✅ | Activities: `POST/GET /v1/customers/{id}/activities` |
| ✅ | Models: `Customer` (company, contact_name, contact_email, status, health_score, contract_value, renewal_date), `CustomerActivity` |
| ✅ | Full test coverage |
| 🟡 | No bulk customer import |
| 🟡 | No renewal reminder / upcoming-renewals query |
| 🟡 | NPS fields in schema but no survey send/tracking implementation |

#### Frontend — **0%**

| Status | Item |
|---|---|
| 🔴 | `apps/portal/app/(dashboard)/customers/` — **directory does not exist** |
| 🔴 | `apps/portal/hooks/useCustomers.ts` — **does not exist** |
| 🔴 | `apps/portal/lib/api/customers.ts` — **does not exist** |
| 🔴 | No list view: company / contact / status / health score / renewal date table |
| 🔴 | No detail drawer / edit form |
| 🟠 | No health score visualization (Healthy/At Risk/Churned colour coding) |
| 🟠 | No activity timeline per customer |
| 🟡 | No link from customer to inbox threads or campaigns |

#### Action Items
1. Create `apps/portal/lib/api/customers.ts` with typed functions: `fetchCustomers`, `fetchCustomer`, `createCustomer`, `updateCustomer`, `deleteCustomer`, `addActivity`, `listActivities`, `updateHealthScore`
2. Create `apps/portal/hooks/useCustomers.ts` with TanStack Query hooks matching the API client above
3. Build `apps/portal/app/(dashboard)/customers/page.tsx`: sortable data table (company | contact | status | health score badge | renewal date), "New Customer" modal, row click → side drawer with detail + activity timeline + edit form

---

### Group 4 — Action Items for Implementation Session (Priority Order)

1. 🔴 **Build customers frontend** (page + hooks + API client) — entire module is backend-only right now
2. 🔴 **Fix `from_email` + `sent_at`** missing from inbox API responses — causes null/invalid-date display in live inbox
3. 🔴 **Wire email inbound processor** → auto-create `InboxThread` on inbound emails (inbox is empty without this)
4. 🔴 **Build deal creation form** + wire "Add Deal" button — CRM Kanban is unusable without this
5. 🟠 **Replace mock intent classification + draft generation** with real ai-service calls + credit deduction
6. 🟠 **Move customer endpoints** from crm-service to customer-service (bounded context fix)
7. 🟠 **Add `PATCH /v1/deals/{id}`** + edit mode in deal drawer
8. 🟠 **Add activity UI** to both deal drawer and customer drawer

---

## Group 5 — Platform

> **Status: COMPLETE**

### Summary Table

| Module | Backend % | Frontend % | Biggest Blocker |
|---|---|---|---|
| 5a. API Gateway | **85%** | **100%** | Rate limiting configured but never instantiated |
| 5b. Integration Service | **75%** | **85%** | OAuth token exchange is commented out — integrations never actually connect |
| 5c. Notification Service | **30%** | **0%** | `_dispatch()` returns fake IDs — **no real email/SMS/in-app ever sent** |
| 5d. Comment Processor | **85%** | **0%** | Facebook DMs sent but leads never persisted; no frontend quota/rule UI |
| 5e. Webhook Handler | **70%** | **0%** | Event normalization done; events never forwarded to any downstream service |
| 5f. Frontend Infrastructure | N/A | **85%** | All API clients + hooks exist; notification UI entirely absent |

---

### 5a. API Gateway

#### Backend (`services/api-gateway/`) — **85%**

| Status | Item |
|---|---|
| ✅ | Full Supabase ES256 JWT validation with ±60s clock drift tolerance |
| ✅ | JWKS caching: 15-min TTL + stale-fallback (5-min grace) on fetch failure |
| ✅ | 21 upstream service routes (`/v1/leads` → lead-service, etc.) |
| ✅ | `X-Workspace-ID` / `X-User-ID` / `X-User-Role` injection from app_metadata |
| ✅ | Middleware stack: JWT → CORS → GZip (1000-byte minimum) |
| ✅ | 503/504/502 error mapping for upstream failures |
| ✅ | E2E test bypass with deterministic workspace ID |
| 🟠 | Rate limiting: `RateLimitConfig` settings exist but `RateLimitMiddleware` is **never instantiated** in `main.py` |
| 🟠 | `X-Request-ID` not generated or propagated — no trace correlation across services |
| 🟡 | Hardcoded routing table — no circuit breaker, no dynamic service discovery |

#### Frontend (`apps/api-proxy/`) — **100%**
Cloudflare Worker correctly rewrites Host header for Cloud Run. Fully functional.

#### Action Items
1. Instantiate `RateLimitMiddleware` in `main.py` with Memorystore Redis backend; add per-workspace sliding-window throttling
2. Generate `X-Request-ID` UUID per request and inject into all upstream requests; log on error responses
3. Add circuit-breaker / health-check fallback for hardcoded routes (low priority)

---

### 5b. Integration Service & Connected Apps

#### Backend (`services/integration-service/`) — **75%**

| Status | Item |
|---|---|
| ✅ | `GET /integrations/oauth/{provider}/authorize` — returns OAuth URL |
| ✅ | `POST/GET/GET/{id}/PATCH/DELETE /integrations` — full CRUD |
| ✅ | `POST/GET/DELETE /webhooks` — outgoing webhook subscription CRUD |
| ✅ | 20+ provider configs (Google, Microsoft, HubSpot, Slack, Zalo, Apollo, etc.) |
| ✅ | `IntegrationConnection` + `WebhookSubscription` models; uniqueness constraint per (workspace, provider) |
| ✅ | 6 service-layer unit tests |
| 🔴 | `oauth_callback` token exchange **commented out** — `httpx_client.post(meta["token_url"], ...)` is in a comment; tokens are never stored |
| 🔴 | OAuth credentials stored as **plain JSON** in JSONB — no encryption |
| 🟠 | No token refresh worker — Google/Microsoft tokens expire in 1 hour |
| 🟠 | `WebhookSubscription` exists but no worker dispatches events to registered URLs |
| 🟡 | OAuth failures return generic 400; no retry mechanism |

#### Frontend (`apps/portal/app/(dashboard)/integrations/`) — **85%**

| Status | Item |
|---|---|
| ✅ | Catalog with 20+ provider logos, OAuth click flow, credential-based connect |
| ✅ | OAuth callback page + redirect handling |
| ✅ | Disconnect button (calls DELETE endpoint) |
| ✅ | `useIntegrations` / `useConnectIntegration` / `useDisconnectIntegration` hooks |
| 🟠 | OAuth callback page is a stub — receives `code`/`state` but never calls `POST /integrations/oauth/{provider}/callback` |
| 🟡 | No integration settings page (token expiry, last sync, manual refresh, revoke) |
| 🟡 | No webhook management page (create custom webhooks, test delivery, view logs) |

#### Action Items
1. Uncomment and complete OAuth token exchange in `oauth_callback`; store `access_token` + `refresh_token` encrypted in credentials JSONB
2. Add KMS encryption layer (GCP Secret Manager or column-level AES) for all credentials stored in `IntegrationConnection.credentials`
3. Add Cloud Tasks hourly token-refresh job; wire OAuth callback page to call `POST /integrations/oauth/{provider}/callback`

---

### 5c. Notification Service

#### Backend (`services/notification-service/`) — **30%**

| Status | Item |
|---|---|
| ✅ | `POST /v1/notify` — accepts channel (email/sms/in_app/push), event_type, recipient, template_id, payload |
| ✅ | Routing table: email→Resend, sms→Twilio, in_app→Novu, push→Novu |
| ✅ | `NotificationLog` table — logs every notification with status/provider/message_id |
| ✅ | Workspace isolation |
| ✅ | 4 provider tests (all against mock) |
| 🔴 | **`_dispatch()` returns `f"mock-{provider}-{uuid.uuid4()}"` and never calls any SDK** — no real email, SMS, or in-app notification is ever sent |
| 🔴 | No Novu SDK integration — no `novu_client.trigger()` call |
| 🔴 | No Resend integration — no from/subject/HTML body, no SDK call |
| 🔴 | No Twilio integration — no SMS body, no phone validation, no ESMS.vn failover |
| 🟠 | `retry_count` column exists but never incremented; failed notifications not retried |
| 🟠 | `template_id` accepted but completely ignored — no template rendering |
| 🟠 | No in-app delivery path (no Supabase Realtime channel write) |
| 🟡 | No suppression-list check before sending |
| 🟡 | No delivery-receipt webhook handler for provider bounce/open/click callbacks |

#### Frontend — **0%**
No notification bell, toast system, notification center, or preferences page exists anywhere in the portal.

#### Action Items
1. Replace `_dispatch()` mock with real SDK calls: `resend.send()` for email, `twilio_client.messages.create()` for SMS, `novu_client.trigger()` for in-app/push
2. Implement template rendering: resolve `template_id` from DB/config; render Handlebars or Jinja2 with `payload` substitution before dispatch
3. Implement retry: increment `retry_count` on failure; publish Cloud Pub/Sub retry message; cap at 3 attempts with exponential backoff

---

### 5d. Comment Processor

#### Backend (`services/comment-processor/`) — **85%**

| Status | Item |
|---|---|
| ✅ | Facebook webhook verification (GET hub.challenge handshake) |
| ✅ | HMAC-SHA256 validation of `X-Hub-Signature-256` header |
| ✅ | Comment event parsing: commenter_id, comment_text, post_id, page_id, timestamp |
| ✅ | Keyword matching with unidecode normalization + substring/any/all modes |
| ✅ | Redis-backed daily quota (500 DMs/day, TTL to next UTC midnight) |
| ✅ | Per-commenter cooldown (24h Redis TTL, prevents duplicate DMs) |
| ✅ | Jinja2 SandboxedEnvironment template rendering |
| ✅ | Facebook Graph API DM dispatch |
| ✅ | Page context cache in Redis with manual invalidation |
| ✅ | 15+ tests with fakeredis + httpx mock |
| 🟠 | `dm_sent` outbox event written but **no lead record created** — lead-service endpoint referenced in comment, never called |
| 🟠 | Failed DMs not retried — if Graph API fails, the message is silently dropped |
| 🟠 | Facebook/Instagram only — no WhatsApp, no Twilio SMS fallback |

#### Frontend — **0%**
No quota dashboard, keyword rule management, or page-connection UI. Would logically live under integrations settings.

#### Action Items
1. On `dm_sent` success, POST to `lead-service /v1/leads` with commenter name/email, `source=facebook_comment`, campaign link
2. Catch Graph API errors → publish Pub/Sub retry with exponential backoff (3 attempts)
3. Build keyword-rule management UI in integrations settings: add/remove keywords per page, preview matched templates, view quota remaining

---

### 5e. Webhook Handler (Platform Security & Extensibility)

#### Backend (`services/webhook-handler/`) — **70%**

| Status | Item |
|---|---|
| ✅ | `POST /webhook/{provider}` routing to Resend, Twilio, Calendly handlers |
| ✅ | All 3 providers normalize to canonical event dict |
| ✅ | Resend: 6 event types mapped; Twilio: 7 SMS statuses mapped; Calendly: booking/cancel mapped |
| ✅ | 12 handler unit tests |
| 🔴 | **Normalized events never forwarded** — handlers return a dict; nothing calls outreach-service, booking-service, or any downstream |
| 🔴 | **No Twilio `X-Twilio-Signature` HMAC validation** — unauthenticated requests accepted (security blocker, previously flagged in Group 2) |
| 🟠 | No outbox table — if downstream service is down, event is permanently lost |
| 🟠 | No additional providers (Stripe, GitHub, Discord, custom) |
| 🟡 | No retry on dispatch failure |
| 🟡 | No rate limiting for high-volume providers |

#### Action Items
1. Add Twilio `X-Twilio-Signature` HMAC validation (pair with Resend `Svix-Signature` fix from Group 2)
2. Implement event dispatch: Resend bounce/complaint → `outreach-service POST /v1/suppression`; Calendly booking → `booking-service POST /v1/bookings`
3. Add `webhook_events` outbox table for at-least-once delivery; retry dispatch on failure

---

### 5f. Frontend Infrastructure

#### API Clients (`apps/portal/lib/api/`) — **95%**
16 typed API modules covering all major services. All use `apiFetch()` abstraction. Minor gap: no webhook management API client.

#### TanStack Query Hooks (`apps/portal/hooks/`) — **90%**
16 hook modules. All mutations invalidate related queries. Missing: notification subscription via Supabase Realtime.

#### Middleware & Auth (`apps/portal/middleware.ts`) — **100%**
Maintenance mode, auth protection, 20+ protected routes, unauthenticated redirect — all working.

#### Pages & Design System — **80%**

| Status | Item |
|---|---|
| ✅ | Integrations catalog page (20+ providers, OAuth flow, disconnect) |
| ✅ | Settings: profile, workspace, security, devices, email tabs |
| ✅ | Tailwind + shadcn/ui used throughout; OKLCH design tokens in `globals.css` |
| ✅ | Mobile-first responsive, 44×44px touch targets |
| 🟠 | No notification bell, toast system, or notification center |
| 🟠 | No `useNotifications` hook or Supabase Realtime subscription |
| 🟡 | No integration settings page (token expiry, revoke, manual refresh) |
| 🟡 | No webhook management page |
| 🟡 | No dark mode |
| 🟡 | Skeleton loaders exist in `loading.tsx` but many data tables don't show them |

#### Action Items
1. Add Novu notification bell component + Realtime subscription; build notification center modal (mark-read, delete)
2. Build integration settings page: connected integrations table with status, last-sync, token expiry, revoke button, manual refresh
3. Build webhook management page: create custom webhook form, test-delivery button, delivery log table

---

### Group 5 — Action Items for Implementation Session (Priority Order)

1. 🔴 **Replace notification `_dispatch()` mock** with real Novu/Resend/Twilio SDK calls + template rendering — every notification in the product is silently dropped today
2. 🔴 **Complete OAuth token exchange** in integration-service `oauth_callback`; add credential encryption
3. 🔴 **Add Twilio `X-Twilio-Signature` HMAC validation** in webhook-handler (security blocker)
4. 🔴 **Forward webhook events** to downstream services (Resend bounce → suppression, Calendly → booking)
5. 🟠 **Enable API Gateway rate limiting** (instantiate `RateLimitMiddleware` with Redis)
6. 🟠 **Build notification UI** — bell icon + notification center + `useNotifications` hook
7. 🟠 **Add token refresh worker** (hourly Cloud Tasks job for Google/Microsoft integrations)
8. 🟠 **Add lead creation** from Facebook comment DMs (`dm_sender` → lead-service POST)
9. 🟡 **Build integration settings page** (revoke, token expiry, manual refresh)
10. 🟡 **Build webhook management page** (create, test, delivery logs)
