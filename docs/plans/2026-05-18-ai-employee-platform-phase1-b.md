# AI Employee Platform — Phase 1 Plan B (Tasks 10–18)

**Spec:** docs/specs/40_AI_EMPLOYEE_PLATFORM/
**Goal:** Complete Phase 1 by implementing the approval flow, tool invocation service, dry-run, cancellation lifecycle, outbox, sweeper workers, and the frontend marketplace skeleton.
**Depends on:** Plan A complete (service scaffolded, models + repos + core services implemented)
**Architecture:** Continues in `ai-employee-service`. Frontend in `apps/portal`.

---

## Task 10: ApprovalService + Approval API

**Files:**
- Create: `services/ai-employee-service/app/services/approval_service.py`
- Create: `services/ai-employee-service/app/api/v1/approvals.py`
- Create: `services/ai-employee-service/tests/unit/services/test_approval_service.py`
- Create: `services/ai-employee-service/tests/integration/test_approval_flow.py`
- Create: `services/ai-employee-service/tests/integration/test_expired_approval_fail_closed.py`
- Create: `services/ai-employee-service/tests/integration/test_publish_public_approval_lockin.py`

**Business rules (from AC-7, AC-7a, AC-8, AC-10):**
1. `create_approval_request()`: writes `ai_employee_approval_requests` row, emits `ai.employee.approval.requested` (atomic with DB write)
2. `approve(id, decided_by)`: idempotent on `idempotency_key`; if already approved → return existing; if expired → raise `APPROVAL_EXPIRED` (410); if rejected → raise `APPROVAL_ALREADY_DECIDED` (409)
3. `reject(id, decided_by, reason)`: same idempotency; if approved → raise `APPROVAL_ALREADY_DECIDED`
4. After approve: trigger the originally-proposed tool invocation (call ToolInvocationService), write `resulting_invocation_id`
5. Expiry: `expires_at` set by caller (default 72h, configurable per-tool). On expiry → status `expired`, notify owner, NEVER auto-execute (fail-closed)
6. `publish_public` lock-in (AC-7a): always require approval if `rental.dry_run_until > now()` OR `now() - rental.created_at < 30 days`. Non-overridable.
7. Cancellation grace override: if `rental.status == 'cancelling'`, approvals remain valid until `min(expires_at, cancellation_grace_ends_at)` — not extended beyond grace window

- [ ] **Step 1: Write failing tests**

```python
async def test_approve_executes_proposed_action(db_session, seed_approval_pending, mock_tool_service):
    svc = ApprovalService(db_session, tool_service=mock_tool_service)
    result = await svc.approve(workspace_id=WS, approval_id=seed_approval_pending.id, decided_by=USER)
    assert result.status == "approved"
    assert mock_tool_service.invoke_called_with == seed_approval_pending.proposed_action

async def test_approve_expired_approval_raises_error(db_session, seed_approval_expired):
    svc = ApprovalService(db_session, tool_service=MockToolService())
    with pytest.raises(AppError) as exc:
        await svc.approve(workspace_id=WS, approval_id=seed_approval_expired.id, decided_by=USER)
    assert exc.value.code == "APPROVAL_EXPIRED"

async def test_expired_approval_never_auto_executes(db_session, seed_approval_just_expired):
    svc = ApprovalService(db_session, tool_service=MockToolService())
    await svc.process_expired_approvals()
    approval = await db_session.get(AIEmployeeApprovalRequest, seed_approval_just_expired.id)
    assert approval.status == "expired"
    assert not MockToolService.invoke_called  # fail-closed

async def test_publish_public_always_requires_approval_during_dry_run(db_session, seed_rental_in_dry_run, seed_tool_publish_public):
    svc = ApprovalService(db_session, tool_service=MockToolService())
    requires = svc.requires_approval(
        rental=seed_rental_in_dry_run,
        tool=seed_tool_publish_public,
        estimated_cost_usd=Decimal("0.01")
    )
    assert requires is True
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `ApprovalService` + router**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): ApprovalService with fail-closed expiry + publish_public lock-in`

---

## Task 11: ToolInvocationService + disclosure rendering

**Files:**
- Create: `services/ai-employee-service/app/services/tool_invocation_service.py`
- Create: `services/ai-employee-service/app/clients/integration_client.py`
- Create: `services/ai-employee-service/app/api/v1/internal_tools.py` (service-to-service)
- Create: `services/ai-employee-service/tests/unit/services/test_tool_service.py`
- Create: `services/ai-employee-service/tests/security/test_oauth_scope_strip.py`
- Create: `services/ai-employee-service/tests/integration/test_disclosure_rendering.py`

**Business rules (from AC-18, AC-14b, AC-14c):**
1. Pre-invoke: check `rental.status == 'active'` → `RENTAL_NOT_ACTIVE` (409)
2. Pre-invoke: check required OAuth scopes connected → `OAUTH_SCOPE_MISSING` (412)
3. For `publish_public` tools: render disclosure via `WorkspaceSettingsService.render_disclosure()`, append to request payload footer
4. Call `integration_client.invoke(tool.executor, payload)` — never directly call OAuth providers
5. Write `ai_employee_tool_invocations` row (append-only, outcome = success/failure/simulated/skipped_cap)
6. Increment `cost_usd` against spend cap
7. Spend cap check: if invocation would exceed daily/monthly cap → outcome = `skipped_cap`, emit `spend_cap_hit`, pause rental
8. Internal endpoint `POST /v1/internal/tools/invoke` for ai-service LangGraph node calls (OIDC auth)

- [ ] **Step 1: Write failing tests**

```python
async def test_invoke_publish_public_appends_disclosure(db_session, seed_rental, seed_publish_public_tool, mock_integration, mock_settings):
    svc = ToolInvocationService(db_session, integration_client=mock_integration, settings_svc=mock_settings)
    mock_settings.render_disclosure.return_value = "[Posted by AI on behalf of Acme]"
    await svc.invoke(workspace_id=WS, run_id=RUN_ID, tool=seed_publish_public_tool, payload={"content": "Hello"})
    assert "[Posted by AI on behalf of Acme]" in mock_integration.last_payload["content"]

async def test_invoke_missing_oauth_scope_raises_error(db_session, seed_rental, seed_tool_requires_scope, mock_integration_no_scope):
    svc = ToolInvocationService(db_session, integration_client=mock_integration_no_scope)
    with pytest.raises(AppError) as exc:
        await svc.invoke(workspace_id=WS, run_id=RUN_ID, tool=seed_tool_requires_scope, payload={})
    assert exc.value.code == "OAUTH_SCOPE_MISSING"

async def test_invoke_writes_tool_invocation_row(db_session, seed_rental, seed_tool, mock_integration):
    svc = ToolInvocationService(db_session, integration_client=mock_integration)
    await svc.invoke(workspace_id=WS, run_id=RUN_ID, tool=seed_tool, payload={})
    result = await db_session.execute(select(AIEmployeeToolInvocation).where(AIEmployeeToolInvocation.run_id == RUN_ID))
    inv = result.scalar_one()
    assert inv.outcome == "success"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `ToolInvocationService` + clients + internal endpoint**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): ToolInvocationService with disclosure rendering + OAuth scope check`

---

## Task 12: Dry-run mode (simulation)

**Files:**
- Modify: `services/ai-employee-service/app/services/tool_invocation_service.py` (wire dry-run check)
- Create: `services/ai-employee-service/tests/integration/test_dry_run_mode.py`

**Business rules (from AC-12):**
1. `rental.dry_run_until` set at creation (`now() + dry_run_days`, default 7)
2. While `now() < rental.dry_run_until`: `is_dry_run=True` on run; tool invocations get `outcome='simulated'`, no external HTTP call to integration-service
3. Simulated invocations produce a structured "what would have happened" report in `response_payload`
4. Credits are still reserved and settled (actual LLM cost is real; only integration side-effects are skipped)

- [ ] **Step 1: Write failing tests**

```python
async def test_dry_run_does_not_call_integration_service(db_session, seed_rental_in_dry_run, seed_tool, mock_integration):
    svc = ToolInvocationService(db_session, integration_client=mock_integration)
    svc.is_dry_run = True
    await svc.invoke(workspace_id=WS, run_id=RUN_ID, tool=seed_tool, payload={})
    assert mock_integration.invoke_called == False

async def test_dry_run_sets_outcome_simulated(db_session, seed_rental_in_dry_run, seed_tool, mock_integration):
    svc = ToolInvocationService(db_session, integration_client=mock_integration)
    await svc.invoke(workspace_id=WS, run_id=RUN_ID, tool=seed_tool, payload={}, is_dry_run=True)
    inv = await db_session.execute(select(AIEmployeeToolInvocation).where(...))
    assert inv.scalar_one().outcome == "simulated"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Wire dry-run logic into `ToolInvocationService.invoke()`**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): dry-run simulation mode (no integration side effects)`

---

## Task 13: Cancellation lifecycle

**Files:**
- Modify: `services/ai-employee-service/app/services/rental_service.py` (add `cancel()`)
- Modify: `services/ai-employee-service/app/api/v1/rentals.py` (add `POST /{id}/cancel`)
- Modify: `services/ai-employee-service/app/services/tool_invocation_service.py` (pre-check cancelled)
- Create: `services/ai-employee-service/tests/integration/test_cancellation_lifecycle.py`
- Create: `services/ai-employee-service/tests/security/test_cancellation_grace_bypass.py`

**Business rules (from AC-3):**
1. `cancel()`: status → `cancelling`; set `cancelling_at=now()`; `cancellation_grace_ends_at = min(rental.paddle_period_end_at, now()+7d)` (use `now()+7d` if `paddle_period_end_at IS NULL`)
2. Paddle: call `billing_client.set_cancel_at_period_end(paddle_line_item_id)`
3. All queued/pending runs → pause immediately (status `cancelled`)
4. In-flight runs: allow current graph step to finish; tool runner pre-checks `rental.status != 'cancelling'` before starting NEW tool invocations
5. Pending approvals: remain valid until `min(expires_at, cancellation_grace_ends_at)`
6. Cannot double-cancel: if status already `cancelling`/`cancelled` → 409

- [ ] **Step 1: Write failing tests**

```python
async def test_cancel_sets_cancelling_status(db_session, seed_active_rental, mock_billing):
    svc = RentalService(db_session, billing_client=mock_billing)
    updated = await svc.cancel(workspace_id=WS, rental_id=seed_active_rental.id)
    assert updated.status == "cancelling"
    assert updated.cancellation_grace_ends_at is not None

async def test_cancel_pauses_queued_runs(db_session, seed_rental_with_queued_runs, mock_billing):
    svc = RentalService(db_session, billing_client=mock_billing)
    await svc.cancel(workspace_id=WS, rental_id=seed_rental_with_queued_runs.id)
    runs = await db_session.execute(select(AIEmployeeRun).where(AIEmployeeRun.rental_id == seed_rental_with_queued_runs.id))
    for run in runs.scalars():
        if run.status in ("pending",):
            assert run.status == "cancelled"

async def test_tool_invocation_blocked_for_cancelling_rental(db_session, seed_cancelling_rental, seed_tool, mock_integration):
    svc = ToolInvocationService(db_session, integration_client=mock_integration)
    with pytest.raises(AppError) as exc:
        await svc.invoke(workspace_id=WS, run_id=RUN_ID, tool=seed_tool, payload={}, rental=seed_cancelling_rental, start_new_node=True)
    assert exc.value.code == "RENTAL_NOT_ACTIVE"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement cancellation logic**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): cancellation lifecycle with 7-day grace window`

---

## Task 14: Outbox event emission (all 7 event types)

**Files:**
- Create: `services/ai-employee-service/app/services/outbox.py`
- Modify: all service files to use outbox (they should already be calling it per tasks above)
- Create: `services/ai-employee-service/tests/integration/test_outbox_emission.py`

**7 event types:**
1. `ai.employee.rented`
2. `ai.employee.model_changed`
3. `ai.employee.run.completed`
4. `ai.employee.approval.requested`
5. `ai.employee.approval.approved`
6. `ai.employee.spend_cap_hit`
7. `ai.employee.auto_paused`

**Pattern** (from workspace-service):
```python
class OutboxService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def emit(self, workspace_id: uuid.UUID, event_type: str, payload: dict) -> None:
        self._db.add(AIEmployeeOutboxEvent(
            workspace_id=workspace_id,
            event_type=event_type,
            payload=payload,
        ))
        # Caller commits atomically
```

- [ ] **Step 1: Write test verifying each of the 7 events is emitted atomically**

```python
@pytest.mark.parametrize("event_type", [
    "ai.employee.rented",
    "ai.employee.model_changed",
    "ai.employee.run.completed",
    "ai.employee.approval.requested",
    "ai.employee.approval.approved",
    "ai.employee.spend_cap_hit",
    "ai.employee.auto_paused",
])
async def test_outbox_event_emitted(db_session, event_type, seed_workspace):
    outbox = OutboxService(db_session)
    await outbox.emit(workspace_id=seed_workspace.id, event_type=event_type, payload={"test": True})
    await db_session.commit()
    result = await db_session.execute(
        select(AIEmployeeOutboxEvent).where(AIEmployeeOutboxEvent.event_type == event_type)
    )
    assert result.scalar_one() is not None
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement `OutboxService` + ensure all services use it**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): OutboxService for all 7 event types`

---

## Task 15: Runaway-loop sweeper (Cloud Run Job)

**Files:**
- Create: `services/ai-employee-service/app/workers/runaway_loop_sweeper.py`
- Create: `services/ai-employee-service/tests/integration/test_runaway_loop_sweeper.py`

**Business rules (from AC-13):**
- Hourly job: finds rentals with ≥50 runs in rolling 60 min OR ≥3 consecutive failures
- For each offending rental: set `status='auto_paused'`, `pause_reason='runaway_loop'`
- Emit `ai.employee.auto_paused` to outbox
- Idempotent (already-paused rentals are skipped)

- [ ] **Step 1: Write failing test**

```python
async def test_sweeper_pauses_runaway_rental(db_session, seed_rental_with_50_runs_in_1_hour):
    sweeper = RunawayLoopSweeper(db_session)
    paused_count = await sweeper.run()
    assert paused_count >= 1
    rental = await db_session.get(AIEmployeeRental, seed_rental_with_50_runs_in_1_hour.id)
    assert rental.status == "auto_paused"
    assert rental.pause_reason == "runaway_loop"

async def test_sweeper_pauses_rental_with_3_consecutive_failures(db_session, seed_rental_with_3_consecutive_failures):
    sweeper = RunawayLoopSweeper(db_session)
    await sweeper.run()
    rental = await db_session.get(AIEmployeeRental, seed_rental_with_3_consecutive_failures.id)
    assert rental.status == "auto_paused"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement sweeper**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): RunawayLoopSweeper — hourly guard against infinite runs`

---

## Task 16: Expired-approval sweeper + cancellation finaliser

**Files:**
- Create: `services/ai-employee-service/app/workers/expired_approval_sweeper.py`
- Create: `services/ai-employee-service/app/workers/cancellation_finaliser.py`
- Create: `services/ai-employee-service/tests/integration/test_expired_sweeper.py`
- Create: `services/ai-employee-service/tests/integration/test_cancellation_finaliser.py`

**Business rules:**
- **Expired-approval sweeper** (daily): finds `status='pending' AND expires_at < now()` → flip to `expired`, notify owner via outbox `ai.employee.approval.requested` with `status_update=expired` (notification-service handles Novu)
- **Cancellation finaliser** (hourly): finds `status='cancelling' AND now() >= cancellation_grace_ends_at` → flip to `cancelled`; auto-reject all remaining `pending` approvals with `reason='rental_cancelled'`; emit `ai.employee.cancelled` with `auto_rejected_approvals_count`

- [ ] **Step 1: Write failing tests**

```python
async def test_cancellation_finaliser_flips_to_cancelled_after_grace(db_session, seed_cancelling_rental_grace_expired):
    finaliser = CancellationFinaliser(db_session)
    await finaliser.run()
    rental = await db_session.get(AIEmployeeRental, seed_cancelling_rental_grace_expired.id)
    assert rental.status == "cancelled"

async def test_cancellation_finaliser_rejects_pending_approvals(db_session, seed_cancelling_rental_with_pending_approvals):
    finaliser = CancellationFinaliser(db_session)
    await finaliser.run()
    approvals = await db_session.execute(
        select(AIEmployeeApprovalRequest).where(AIEmployeeApprovalRequest.rental_id == seed_cancelling_rental_with_pending_approvals.id)
    )
    for approval in approvals.scalars():
        assert approval.status == "rejected"
```

- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement both sweepers**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(ai-employee): approval expiry sweeper + cancellation finaliser`

---

## Task 17: Frontend — marketplace skeleton + rental settings + approval inbox

**Files:**
- Create: `apps/portal/app/(dashboard)/employees/page.tsx` (marketplace — empty coming-soon state)
- Create: `apps/portal/app/(dashboard)/employees/[rentalId]/page.tsx` (rental settings)
- Create: `apps/portal/app/(dashboard)/employees/[rentalId]/runs/page.tsx` (run timeline)
- Create: `apps/portal/components/employees/MarketplaceEmpty.tsx`
- Create: `apps/portal/components/employees/RentalSettings.tsx` (caps + model selector + disclosure)
- Create: `apps/portal/components/employees/RunTimeline.tsx`
- Create: `apps/portal/components/employees/ApprovalInboxItem.tsx` (embedded in Spec 31 drawer)
- Create: `apps/portal/lib/api/employees.ts` (typed API client)
- Create: `apps/portal/e2e/employees/marketplace.spec.ts`
- Create: `apps/portal/e2e/employees/rent-flow-dev-agent.spec.ts`
- Create: `apps/portal/e2e/employees/model-switch.spec.ts`
- Create: `apps/portal/e2e/employees/cancellation.spec.ts`
- Create: `apps/portal/e2e/employees/disclosure-template.spec.ts`
- Create: `apps/portal/e2e/employees/approval-inbox.spec.ts`

**Marketplace empty state (v1 — catalog is empty):**
```tsx
// MarketplaceEmpty.tsx
export function MarketplaceEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-2xl font-semibold mb-2">AI Employees coming soon</h2>
      <p className="text-muted-foreground max-w-md">
        The first AI specialist (Ads Intelligence) is being validated before launch.
        We'll notify you when it's ready to rent.
      </p>
    </div>
  )
}
```

**API client (`lib/api/employees.ts`):**
```typescript
export const employeesApi = {
  getCatalog: () => apiClient.get<CatalogResponse>('/employees/catalog'),
  getRentals: () => apiClient.get<RentalListResponse>('/employees/rentals'),
  getRental: (id: string) => apiClient.get<RentalResponse>(`/employees/rentals/${id}`),
  rent: (body: RentRequest) => apiClient.post<RentalResponse>('/employees/rent', body),
  cancelRental: (id: string) => apiClient.post(`/employees/rentals/${id}/cancel`),
  swapModel: (id: string, modelId: string) => apiClient.patch(`/employees/rentals/${id}/model`, { model_id: modelId }),
  getApprovals: (status?: string) => apiClient.get<ApprovalListResponse>(`/employees/approvals${status ? `?status=${status}` : ''}`),
  approveRequest: (id: string) => apiClient.post(`/employees/approvals/${id}/approve`),
  rejectRequest: (id: string, reason?: string) => apiClient.post(`/employees/approvals/${id}/reject`, { reason }),
  getRuns: (rentalId: string, cursor?: string) => apiClient.get<RunListResponse>(`/employees/rentals/${rentalId}/runs${cursor ? `?cursor=${cursor}` : ''}`),
  getWorkspaceSettings: () => apiClient.get<WorkspaceSettingsResponse>('/employees/workspace-settings'),
  putWorkspaceSettings: (template: string) => apiClient.put('/employees/workspace-settings', { ai_disclosure_template: template }),
}
```

- [ ] **Step 1: Write E2E test stubs** (empty state renders, navigation works)
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement all frontend files**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Commit** `feat(portal): AI Employees marketplace skeleton + rental settings UI`

---

## Task 18: Cross-tenant lockdown + security tests + ai_models rate-snapshot test

**Files:**
- Create: `services/ai-employee-service/tests/security/test_cross_tenant_lockdown.py`
- Create: `services/ai-employee-service/tests/security/test_model_rate_snapshot.py`
- Create: `apps/portal/e2e/employees/cross-tenant.spec.ts`

**Tests:**
```python
# test_cross_tenant_lockdown.py
async def test_cannot_access_rental_from_other_workspace(client, seed_rental_ws_a, auth_headers_ws_b):
    response = await client.get(f"/v1/employees/rentals/{seed_rental_ws_a.id}", headers=auth_headers_ws_b)
    assert response.status_code in (404, 403)

async def test_cannot_approve_approval_from_other_workspace(client, seed_approval_ws_a, auth_headers_ws_b):
    response = await client.post(f"/v1/employees/approvals/{seed_approval_ws_a.id}/approve", headers=auth_headers_ws_b)
    assert response.status_code in (404, 403)

async def test_cannot_post_sop_to_other_workspace_rental(client, seed_rental_ws_a, auth_headers_ws_b):
    response = await client.post(f"/v1/employees/rentals/{seed_rental_ws_a.id}/sops",
                                  headers=auth_headers_ws_b, json={"title": "T", "body_markdown": "B"})
    assert response.status_code in (404, 403)

# test_model_rate_snapshot.py
async def test_rate_snapshot_stored_in_reservation(db_session, seed_rental, seed_model, mock_billing):
    """Model rate must be snapshotted at reservation time so settlement uses same rate even if ai_models mutates."""
    svc = RunService(db_session, billing_client=mock_billing, ai_client=MockAIClient())
    await svc.dispatch(workspace_id=WS, rental_id=seed_rental.id, inputs={})
    reservation = mock_billing.last_reservation
    assert reservation["input_rate_per_1k_usd"] == seed_model.input_rate_per_1k_usd
    assert reservation["output_rate_per_1k_usd"] == seed_model.output_rate_per_1k_usd
    # Mutate the model — settlement should NOT use the new rate
    seed_model.input_rate_per_1k_usd = Decimal("999.999999")
    await svc.settle(run_id=reservation["run_id"], actual_input_tokens=1000, actual_output_tokens=500, tool_cost_usd=Decimal("0"))
    assert mock_billing.last_settlement["credits_charged"] != mock_billing.last_settlement_at_new_rate
```

- [ ] **Step 1: Write all security tests**
- [ ] **Step 2: Verify RED** (some will fail — that exposes missing workspace_id enforcement)
- [ ] **Step 3: Fix any gaps in workspace_id enforcement found by the tests**
- [ ] **Step 4: Verify GREEN**
- [ ] **Step 5: Run verification-loop checklist**
- [ ] **Step 6: Commit** `test(ai-employee): cross-tenant lockdown + model rate snapshot tests`

---

## Verification (end of Plan B — Phase 1 complete)

```bash
# Backend
cd services/ai-employee-service
pytest -v --cov=app --cov-report=term-missing

# Type check
mypy app/

# Frontend
cd apps/portal
npx playwright test e2e/employees/ --project=chromium
```

Phase 1 Definition of Done checklist (from TASKS.md):
- [ ] All 18 tasks merged behind `ai_employee_platform_enabled` flag (off in prod)
- [ ] All tests green; coverage gates met
- [ ] Migration round-trip green
- [ ] `ai_models` seeded with 4 active models
- [ ] Spec 37 + Spec 32 amendments merged (P0 tasks)
- [ ] security-auditor agent review pass
- [ ] qa-engineer Playwright E2E green
- [ ] Internal dev-only agent (`ai_employee_dev_agent`) used end-to-end
- [ ] `docs/specs/40_AI_EMPLOYEE_PLATFORM/RESULT.md` filled in
