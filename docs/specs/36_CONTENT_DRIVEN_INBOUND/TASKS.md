# Spec 36 — Content-Driven Inbound Engine — Tasks

**Status:** 📝 Draft
**Last updated:** 2026-05-08
**TDD Mandate:** Every task follows RED → GREEN → REFACTOR. Verify-RED BEFORE writing implementation.

---

## Task List

| # | Task | Service | Files | Est |
|---|---|---|---|---|
| T-01 | Alembic migration: social_posts, comment_keyword_rules, comment_captures | campaign-service | `alembic/versions/2026_05_08_037_*.py` | S |
| T-02 | Keyword matching algorithm (normalize_text + unidecode) | comment-processor | `app/services/keyword_matcher.py` | S |
| T-03 | webhook-handler: HMAC verification + comment verb filter | webhook-handler | `app/handlers/facebook.py` | S |
| T-04 | webhook-handler: Pub/Sub publish to facebook.comment.received | webhook-handler | `app/handlers/facebook.py`, `app/pubsub.py` | S |
| T-05 | integration-service: GET /internal/integrations/resolve + Redis cache | integration-service | `app/routes/internal.py`, `app/services/page_resolver.py` | M |
| T-06 | campaign-service: social_posts CRUD (POST, GET, PATCH status) | campaign-service | `app/routes/social_posts.py`, `app/services/social_post_service.py` | M |
| T-07 | campaign-service: comment_keyword_rules CRUD + post.config.updated outbox | campaign-service | `app/routes/keyword_rules.py`, `app/services/keyword_rule_service.py` | M |
| T-08 | campaign-service: POST /internal/comment-captures + comment.captured outbox | campaign-service | `app/routes/internal.py`, `app/services/capture_service.py` | M |
| T-09 | campaign-service: GET /internal/social-posts/{post_id}/config (cache-backed) | campaign-service | `app/routes/internal.py`, `app/services/post_config_cache.py` | S |
| T-10 | comment-processor: full pipeline (page resolver → match → suppress → credits → DM → capture) | comment-processor | `app/processor.py`, `app/services/` | L |
| T-11 | lead-service: comment.captured subscriber → lead create/merge + consent_log | lead-service | `app/subscribers/comment_captured.py`, `app/services/social_lead_service.py` | M |
| T-12 | lead-service: GET /internal/leads/find-by-social-id (suppression lookup) | lead-service | `app/routes/internal.py` | S |
| T-13 | campaign-service: lead.created subscriber → backfill comment_capture.lead_id + sequence enroll | campaign-service | `app/subscribers/lead_created.py` | M |
| T-14 | Frontend: Social Inbound page (post registration, keyword rules, DM template, captures table) | apps/portal | `app/(dashboard)/campaigns/[id]/social-inbound/` | L |
| T-15 | Frontend: Settings → Integrations → Social Channels (Facebook Page OAuth connect) | apps/portal | `app/(dashboard)/settings/integrations/social/` | M |

---

## Task Details

### T-01 — Alembic Migration
```python
# alembic/versions/2026_05_08_037_create_social_posts_keyword_rules_captures.py

def upgrade():
    op.create_table('social_posts',
        sa.Column('id', postgresql.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(), nullable=True),
        sa.Column('platform', sa.Text(), server_default='facebook', nullable=False),
        sa.Column('external_post_id', sa.Text(), nullable=False),
        sa.Column('post_url', sa.Text(), nullable=False),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('dm_template', sa.Text(), nullable=False),
        sa.Column('status', sa.Text(), server_default='active', nullable=False),
        sa.Column('sequence_id', postgresql.UUID(), nullable=True),
        sa.Column('created_by', postgresql.UUID(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMPTZ(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMPTZ(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('workspace_id', 'platform', 'external_post_id')
    )
    # comment_keyword_rules and comment_captures similarly...

def downgrade():
    op.drop_table('comment_captures')
    op.drop_table('comment_keyword_rules')
    op.drop_table('social_posts')
```

**Tests (Verify-RED first):**
- `tests/test_migrations.py::test_alembic_upgrade_downgrade_roundtrip`
- Verify schema reflects expected columns (post_id, comment_id, etc.)

---

### T-02 — Keyword Matcher
**File:** `services/comment-processor/app/services/keyword_matcher.py`

```python
# Stub — implement after tests fail
import unicodedata
from unidecode import unidecode

def normalize_text(text: str) -> str: ...
def normalize_ascii(text: str) -> str: ...
def matches_keywords(comment_text: str, keywords: list[str], match_mode: str = 'any') -> tuple[bool, str | None]: ...
```

**Tests (all from TESTS.md T3):** Write T3 tests first, verify RED, then implement.

---

### T-03 + T-04 — webhook-handler HMAC + Pub/Sub
**Files:**
- `services/webhook-handler/app/handlers/facebook.py`
- `services/webhook-handler/app/main.py`

```python
# Stub
async def handle_facebook_webhook(request: Request) -> Response:
    # Verify HMAC-SHA256
    # Filter non-comment events
    # Filter edit/remove verbs
    # Publish to Pub/Sub
    ...
```

**Tests (T1 + T5):** Write HMAC tests first, verify RED, then implement.

---

### T-05 — integration-service internal resolver
**File:** `services/integration-service/app/routes/internal.py`

```python
@router.get("/internal/integrations/resolve")
async def resolve_integration(
    channel: str = Query(...),
    external_id: str = Query(...),
    _: None = Depends(verify_oidc_token),  # OIDC enforcement mandatory
    session: AsyncSession = Depends(get_session),
    redis: Redis = Depends(get_redis),
) -> ResolveResponse:
    ...
```

**Tests:** cache hit, cache miss, unknown page 404, OIDC missing → 403.

---

### T-06 → T-09 — campaign-service endpoints
**Files:** `services/campaign-service/app/routes/`, `app/services/`, `app/models/`

Each must include:
- workspace_id on every query (no exceptions)
- Outbox write in same transaction for mutations
- 409 response for UNIQUE constraint violations (idempotent)

---

### T-10 — comment-processor pipeline (largest task)
**File:** `services/comment-processor/app/processor.py`

**Verify-RED test order:**
1. Test page resolver called with page_id from event
2. Test post status `paused` → no-op return
3. Test edit verb filter → no-op return
4. Test Redis SETNX called before campaign-service
5. Test keyword matching called with correct args
6. Test suppression check called
7. Test credit deduction called before DM
8. Test SandboxedEnvironment used for template rendering
9. Test DM dispatch calls Private Replies API
10. Test campaign-service POST /internal/comment-captures called last

Each test must be RED before proceeding.

---

### T-11 — lead-service comment.captured subscriber

**Critical:** consent_log write must be in the same `async with session.begin()` block as the lead INSERT. Use T8 tests from TESTS.md as Verify-RED tests.

```python
# services/lead-service/app/subscribers/comment_captured.py

async def handle_comment_captured(event: CommentCapturedEvent, session: AsyncSession) -> None:
    # 1. Check if lead already exists by (workspace_id, external_id=commenter_id, platform=facebook)
    # 2. Create or merge lead
    # 3. Write consent_log if workspace country in ('VN', 'TH', 'SG') — SAME TRANSACTION
    # 4. Write outbox: lead.created with comment_capture_id from event
    ...
```

---

### T-12 — lead-service suppression lookup

```python
# GET /internal/leads/find-by-social-id
# Returns lead.status if found, 404 if not found
# workspace_id scoping mandatory
```

---

### T-13 — campaign-service lead.created subscriber

```python
# services/campaign-service/app/subscribers/lead_created.py

async def handle_lead_created(event: LeadCreatedEvent, session: AsyncSession) -> None:
    if event.source != 'social_comment' or not event.comment_capture_id:
        return  # not a social capture — skip
    
    # Backfill comment_capture.lead_id
    # Enroll in sequence if social_post.sequence_id is set
    ...
```

---

### T-14 — Frontend: Social Inbound page
**Files:**
- `apps/portal/app/(dashboard)/campaigns/[id]/social-inbound/page.tsx`
- `apps/portal/app/(dashboard)/campaigns/[id]/social-inbound/components/`
  - `SocialPostCard.tsx`
  - `KeywordRuleEditor.tsx`
  - `DmTemplateEditor.tsx`
  - `CommentCapturesTable.tsx`
- `apps/portal/lib/api/social-posts.ts`
- `apps/portal/hooks/use-social-posts.ts`
- `apps/portal/hooks/use-comment-captures.ts`

**Key requirements:**
- Plan gate: show upgrade prompt for Free workspaces
- Keyword presets: Travel / Insurance / Recruitment quick-add buttons
- DM template: live preview with sample variable substitution
- Comment captures table: TanStack Query with 30s poll (captures update in real-time)
- TypeScript strict: no `any`, explicit return types on all exported functions

---

### T-15 — Frontend: Social Channels integration settings
**Files:**
- `apps/portal/app/(dashboard)/settings/integrations/social/page.tsx`
- `apps/portal/app/(dashboard)/settings/integrations/social/FacebookPageConnect.tsx`

**Key requirements:**
- OAuth flow initiated via `window.location = '/api/auth/facebook/connect'`
- Page selector shown after OAuth completes (lists pages user is Admin of)
- Show error if `pages_messaging` scope was not granted
- Disconnect button with confirmation modal

---

## Definition of Done (per task)

- [ ] Tests written and verified RED before implementation
- [ ] Implementation makes all tests pass (GREEN)
- [ ] No linting errors (`mypy` for Python, `tsc --noEmit` for TypeScript)
- [ ] Coverage meets gate for affected service
- [ ] workspace_id scoping verified on all new DB queries
- [ ] All new outbox events have corresponding subscriber or are documented as pending

## Definition of Done (Spec 36 complete)

- [ ] All 15 tasks completed
- [ ] Alembic migration roundtrip test passes (upgrade + downgrade)
- [ ] E2E smoke test T11 passes on staging
- [ ] HMAC test T1 passes (including timing-safe comparison)
- [ ] SSTI test T2 passes
- [ ] Consent log test T8 passes for VN/TH/SG
- [ ] Security checklist in SECURITY.md fully checked
- [ ] Feature flag `spec36_social_inbound_enabled` OFF in production until Meta App Review approved
- [ ] RESULT.md filled in with actual vs. expected metrics
