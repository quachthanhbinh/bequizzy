# Spec 05 — AI Campaign Builder: TASKS

## TDD Task List

> **Rule:** Every task starts with a failing test (RED). No implementation until the test fails for the right reason.

---

### Task 1 — Migration: `campaigns` + `campaign_ai_drafts`

**RED first:** Write a test that imports the models and asserts all columns exist — fails because tables don't exist.

**File:** `alembic/versions/0005_campaigns.py`

```python
def upgrade():
    op.create_table('campaigns',
        sa.Column('id', UUID(), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', UUID(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('status', sa.Text(), nullable=False, server_default='draft'),
        sa.Column('ai_generated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('target_audience', JSONB()),
        sa.Column('goals', JSONB()),
        sa.Column('sequence_outline', JSONB()),
        sa.Column('settings', JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_by', UUID(), nullable=False),
        sa.Column('created_at', TIMESTAMPTZ(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', TIMESTAMPTZ(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('archived_at', TIMESTAMPTZ()),
    )
    op.create_index('idx_campaigns_workspace', 'campaigns', ['workspace_id'])
    op.create_index('idx_campaigns_status', 'campaigns', ['workspace_id', 'status'])

    op.create_table('campaign_ai_drafts', ...)  # see DESIGN.md
```

**Done when:** `alembic upgrade head` succeeds; `alembic downgrade -1` succeeds.

---

### Task 2 — Campaign SQLAlchemy Models

**RED first:** Test that `Campaign(**data)` raises if `workspace_id` is missing.

**File:** `services/campaign-service/app/models/campaign.py`

```python
class Campaign(Base):
    __tablename__ = "campaigns"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    workspace_id: Mapped[UUID] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="draft")
    ai_generated: Mapped[bool] = mapped_column(default=False)
    target_audience: Mapped[dict | None] = mapped_column(JSONB)
    goals: Mapped[list | None] = mapped_column(JSONB)
    sequence_outline: Mapped[list | None] = mapped_column(JSONB)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by: Mapped[UUID] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    archived_at: Mapped[datetime | None] = mapped_column(nullable=True)
```

**Done when:** Model imports without error; unit test passes.

---

### Task 3 — Campaign CRUD Service

**RED first:** Test `create_campaign(db, workspace_id, data)` — fails because function doesn't exist.

**File:** `services/campaign-service/app/services/campaign_service.py`

```python
async def create_campaign(db: AsyncSession, workspace_id: UUID, data: CampaignCreate) -> Campaign:
    campaign = Campaign(workspace_id=workspace_id, **data.model_dump())
    db.add(campaign)
    await db.flush()
    await emit_outbox_event(db, "campaign.created", {...})
    await db.commit()
    return campaign

async def get_campaign(db: AsyncSession, workspace_id: UUID, campaign_id: UUID) -> Campaign:
    result = await db.execute(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.workspace_id == workspace_id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", 404)
    return campaign
```

**Done when:** CRUD tests pass; cross-workspace isolation test (T05-SEC-01) passes.

---

### Task 4 — Status Transition State Machine

**RED first:** Test that `archive → active` transition raises `AppError("INVALID_TRANSITION", ...)`.

**File:** `services/campaign-service/app/services/campaign_service.py`

```python
VALID_TRANSITIONS = {
    "draft": {"active", "archived"},
    "active": {"paused", "archived"},
    "paused": {"active", "archived"},
    "archived": set(),  # terminal
}

async def update_campaign_status(db, workspace_id, campaign_id, new_status):
    campaign = await get_campaign(db, workspace_id, campaign_id)
    if new_status not in VALID_TRANSITIONS[campaign.status]:
        raise AppError("INVALID_TRANSITION", f"Cannot transition from {campaign.status} to {new_status}", 422)
    old_status = campaign.status
    campaign.status = new_status
    await emit_outbox_event(db, "campaign.status_changed", {"old": old_status, "new": new_status, ...})
    await db.commit()
    return campaign
```

**Done when:** Parametrized transition tests (U05-04) all pass.

---

### Task 5 — Billing Client (reserve / consume / release)

**RED first:** Test that `BillingClient.reserve_credits(workspace_id, 5)` raises `InsufficientCreditsError` when mock returns 402.

**File:** `services/campaign-service/app/clients/billing_client.py`

```python
class BillingClient:
    async def reserve_credits(self, workspace_id: str, credits: int, reason: str) -> str:
        resp = await self._post("/billing/credits/reserve", {...})
        if resp.status_code == 402:
            raise InsufficientCreditsError()
        return resp.json()["reserve_id"]

    async def consume_credits(self, reserve_id: str) -> None: ...
    async def release_credits(self, reserve_id: str) -> None: ...
```

**Done when:** Unit tests U05-01 and U05-02 pass.

---

### Task 6 — AI Campaign Draft Service (credit reserve model)

**RED first:** Test that `generate_ai_campaign_draft(...)` calls `billing_client.release_credits` when AI service raises TimeoutError.

**File:** `services/campaign-service/app/services/ai_campaign.py`

> See DESIGN.md for full code stub.

**Done when:** Unit tests U05-01, U05-02, U05-03 pass.

---

### Task 7 — Campaign Endpoints (routers)

**RED first:** Test `POST /campaigns` with missing `name` returns 422.

**File:** `services/campaign-service/app/routers/campaigns.py`

```python
router = APIRouter(prefix="/campaigns", tags=["campaigns"])

@router.post("", response_model=CampaignResponse, status_code=201)
async def create_campaign_endpoint(
    data: CampaignCreate,
    workspace_id: UUID = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
): ...

@router.post("/ai-draft", response_model=AIDraftResponse)
async def ai_draft_endpoint(
    data: AIDraftRequest,
    workspace_id: UUID = Depends(get_workspace_id),
    db: AsyncSession = Depends(get_db),
): ...
```

**Done when:** All integration tests in I05-01 through I05-04 pass.

---

### Task 8 — Cross-Workspace Isolation Test

**RED first:** Write test I05-02 — confirm it FAILS initially (campaign_service returns 200 instead of 404 without workspace scoping).

**File:** `services/campaign-service/tests/integration/test_cross_workspace.py`

**Done when:** Test I05-02 passes — cross-workspace campaign returns 404.

---

### Task 9 — AI Draft Rate Limiting

**RED first:** Test that 11th AI draft request in 1 hour returns 429.

**File:** `services/campaign-service/tests/integration/test_rate_limit.py`

Implementation: Redis sliding window counter keyed by `ai_draft:{workspace_id}`, TTL 3600s, max 10.

**Done when:** Test I05-04 passes.

---

### Task 10 — Campaign Duplication

**RED first:** Test that duplicating an `active` campaign creates a `draft` copy with `ai_generated=false`.

**File:** `services/campaign-service/app/routers/campaigns.py` (new endpoint)
`services/campaign-service/app/services/campaign_service.py` (duplicate logic)

**Done when:** Test U05-05 passes.

---

### Task 11 — EDD Test Suite for ai-service

**RED first:** Run EDD-05-04 (adversarial prompt injection) — confirm it FAILS against a naive prompt template that doesn't use XML isolation.

**File:** `services/ai-service/tests/evals/test_campaign_draft_evals.py`

**Done when:** All 5 EDD cases pass; mean score ≥ 4.0/5.0; EDD-05-04 passes at 100%.

---

### Task 12 — Frontend Campaign List + Create Wizard

**RED first:** Write Vitest test for `CampaignCard` — fails because component doesn't exist.

**Files:**
- `frontend/app/(dashboard)/campaigns/page.tsx`
- `frontend/components/campaigns/CampaignCard.tsx`
- `frontend/components/campaigns/AIDraftWizard.tsx`

**Done when:** Component tests pass; E2E: user can create manual campaign and see it in list.

---

## Completion Checklist

- [ ] `alembic upgrade head` succeeds, `downgrade -1` succeeds
- [ ] All unit tests pass (≥85% coverage)
- [ ] All integration tests pass including cross-workspace isolation
- [ ] All 5 EDD eval cases pass (mean ≥4.0, adversarial 100%)
- [ ] Rate limiting verified (429 on 11th request)
- [ ] Credits consumed on success, released on failure (verified in tests)
- [ ] Idempotency verified (same key returns same draft)
- [ ] Frontend E2E: create campaign (manual + AI) flows work
- [ ] `npx tsc --noEmit` passes
- [ ] `mypy app/` passes for campaign-service
