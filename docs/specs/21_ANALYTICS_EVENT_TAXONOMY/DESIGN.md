# Spec 21 — Analytics Event Taxonomy: DESIGN

## CPO ↔ CTO Debate

### Round 1

**CPO:** Tracking plan is a growth lever. We need funnel events (sign up → onboard → first campaign → first send) to find drop-off. Also need LTV/engagement signals per workspace. Confidence: 7.

**CTO:** Use structured event structs (Pydantic BaseModel). Fired via analytics-service REST endpoint. Store in Cloud Logging + BigQuery via log sink. `workspace_id` required field — non-optional. Versioning: `v1.` prefix on event_name. Confidence: 8.

**Gap: 1. Both ≥ 7. Converge.**

**Final Confidence: 8 / 10.**

---

## Event Registry (50+ Events)

### Auth
- `auth.workspace_created`, `auth.user_invited`, `auth.user_accepted`

### AI Brain
- `brain.document_uploaded`, `brain.chunk_indexed`, `brain.qa_pair_created`

### Leads
- `leads.created`, `leads.enriched`, `leads.imported`, `leads.tagged`, `leads.deleted`

### Campaigns
- `campaign.created`, `campaign.launched`, `campaign.paused`, `campaign.completed`

### Sequences
- `sequence.step_executed`, `sequence.step_skipped`, `sequence.lead_enrolled`, `sequence.lead_exited`

### Outreach
- `email.sent`, `email.delivered`, `email.bounced`, `email.opened`, `email.clicked`
- `sms.sent`, `sms.delivered`, `sms.failed`
- `linkedin.dm_sent`, `linkedin.connection_sent`

### Inbox
- `inbox.reply_received`, `inbox.intent_classified`, `inbox.ai_draft_generated`, `inbox.human_replied`

### Booking
- `booking.link_viewed`, `booking.time_selected`, `booking.confirmed`, `booking.cancelled`, `booking.rescheduled`

### CRM
- `deal.created`, `deal.stage_moved`, `deal.won`, `deal.lost`
- `customer.created`, `customer.health_updated`

### Billing
- `billing.credits_purchased`, `billing.credits_depleted`, `billing.plan_upgraded`

### Compliance
- `gdpr.erasure_requested`, `gdpr.erasure_completed`, `consent.granted`, `consent.revoked`

## Event Schema

```python
class AnalyticsEvent(BaseModel):
    workspace_id: UUID
    user_id: UUID | None
    event_name: str       # snake_case, "entity.verb"
    version: str = "v1"
    timestamp: datetime
    properties: dict[str, Any] = {}
```
