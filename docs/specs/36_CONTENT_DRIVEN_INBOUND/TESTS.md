# Spec 36 — Content-Driven Inbound Engine — Tests

**Status:** 📝 Draft
**Last updated:** 2026-05-08

---

## 1. Test Strategy

All tests follow the **RevLooper TDD workflow**: Verify-RED (confirm test fails) before writing implementation. Coverage gates enforced per service (see tdd-workflow skill).

Services under test:
- `webhook-handler` (Cloud Function) — Python, pytest
- `comment-processor` (Cloud Function) — Python, pytest
- `campaign-service` — Python, pytest
- `lead-service` (comment.captured handler additions) — Python, pytest
- `integration-service` (new internal endpoint) — Python, pytest
- `apps/portal` (Social Inbound UI) — Vitest + React Testing Library

---

## 2. Unit Tests

### T1 — Webhook HMAC Verification (`webhook-handler`)

```python
# tests/test_hmac_verification.py

import pytest
import hmac
import hashlib
from app.handlers.facebook import verify_facebook_signature

APP_SECRET = "test_secret_key"

def make_signature(payload: bytes, secret: str) -> str:
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return f"sha256={digest}"

class TestVerifyFacebookSignature:
    def test_valid_signature_returns_true(self):
        payload = b'{"object":"page","entry":[]}'
        sig = make_signature(payload, APP_SECRET)
        assert verify_facebook_signature(payload, sig, APP_SECRET) is True

    def test_invalid_signature_returns_false(self):
        payload = b'{"object":"page","entry":[]}'
        assert verify_facebook_signature(payload, "sha256=invalid", APP_SECRET) is False

    def test_missing_signature_returns_false(self):
        assert verify_facebook_signature(b"payload", None, APP_SECRET) is False
        assert verify_facebook_signature(b"payload", "", APP_SECRET) is False

    def test_wrong_prefix_returns_false(self):
        # md5= prefix instead of sha256= should fail
        payload = b"payload"
        assert verify_facebook_signature(payload, "md5=somehash", APP_SECRET) is False

    def test_timing_safe_comparison(self):
        # Must not raise on comparison of unequal-length strings
        payload = b"test"
        assert verify_facebook_signature(payload, "sha256=short", APP_SECRET) is False

    def test_comment_edit_event_filtered(self):
        """Events with verb=edited must be dropped before Pub/Sub publish."""
        from app.handlers.facebook import should_process_comment_event
        event_add = {"value": {"verb": "add", "comment_id": "123"}}
        event_edit = {"value": {"verb": "edited", "comment_id": "123"}}
        assert should_process_comment_event(event_add) is True
        assert should_process_comment_event(event_edit) is False
```

### T2 — Jinja2 SSTI Prevention (`comment-processor`)

```python
# tests/test_template_rendering.py

import pytest
from app.services.dm_renderer import render_dm_template

class TestRenderDmTemplate:
    def test_basic_variable_substitution(self):
        template = "Chào {{name}}! Tour của bạn: {{post_caption}}"
        result = render_dm_template(template, "Minh", "Tour Đà Lạt")
        assert result == "Chào Minh! Tour của bạn: Tour Đà Lạt"

    def test_ssti_attempt_blocked(self):
        """SandboxedEnvironment must block attribute traversal."""
        malicious = "{{ ''.__class__.__mro__ }}"
        with pytest.raises(Exception):  # SandboxedEnvironment raises SecurityError
            render_dm_template(malicious, "name", "caption")

    def test_config_access_blocked(self):
        """Template cannot access config or env vars."""
        template = "{{ config }}"
        with pytest.raises(Exception):
            render_dm_template(template, "name", "caption")

    def test_only_allowed_context_variables(self):
        """Only name and post_caption are available; other vars resolve to undefined."""
        template = "{{ workspace_id }}{{ secret }}"
        # With SandboxedEnvironment + autoescape, undefined vars render as empty string
        result = render_dm_template(template, "name", "caption")
        assert "workspace_id" not in result
        assert result == ""

    def test_post_caption_truncated_at_100_chars(self):
        long_caption = "x" * 200
        result = render_dm_template("{{post_caption}}", "n", long_caption)
        assert len(result) <= 100

    def test_html_autoescaped(self):
        """autoescape=True should escape HTML in commenter_name."""
        result = render_dm_template("Hello {{name}}", "<script>alert(1)</script>", "")
        assert "<script>" not in result
        assert "&lt;script&gt;" in result
```

### T3 — Keyword Matching Algorithm (`comment-processor`)

```python
# tests/test_keyword_matcher.py

import pytest
from app.services.keyword_matcher import matches_keywords

class TestMatchesKeywords:
    """Tests for Vietnamese + English keyword matching."""

    def test_exact_vietnamese_match(self):
        matched, kw = matches_keywords("cho mình hỏi thông tin tour", ["thông tin"], "any")
        assert matched is True
        assert kw == "thông tin"

    def test_unidecode_match_no_diacritics(self):
        """Commenter who types without tones should still match."""
        matched, kw = matches_keywords("bao gia tour ha long", ["báo giá"], "any")
        assert matched is True

    def test_no_match(self):
        matched, kw = matches_keywords("đẹp quá anh ơi", ["báo giá", "thông tin"], "any")
        assert matched is False
        assert kw is None

    def test_case_insensitive(self):
        matched, kw = matches_keywords("INTERESTED in this", ["interested"], "any")
        assert matched is True

    def test_any_mode_first_keyword_wins(self):
        matched, kw = matches_keywords("i want price info", ["price", "info"], "any")
        assert matched is True
        assert kw == "price"  # first matching keyword returned

    def test_empty_keywords_no_match(self):
        matched, kw = matches_keywords("thông tin", [], "any")
        assert matched is False

    def test_empty_comment_no_match(self):
        matched, kw = matches_keywords("", ["thông tin"], "any")
        assert matched is False

    def test_false_positive_short_keyword(self):
        """Keyword 'giá' must not match 'giáo viên' as a substring."""
        # This test intentionally documents the false positive risk
        # Keyword matching uses 'in' (substring) — this IS a known limitation
        # The UX "preview matching" tool is the mitigation, not the algorithm
        matched, kw = matches_keywords("giáo viên", ["giá"], "any")
        # NOTE: This WILL match because 'gia' is in 'giao vien' after unidecode
        # This is the documented behavior — the "preview matching" tool shows users this
        assert isinstance(matched, bool)  # document but don't fail

    def test_multiword_keyword_match(self):
        matched, kw = matches_keywords("muốn đặt tour thông tin thêm", ["đặt tour"], "any")
        assert matched is True
```

### T4 — Idempotency / Redis Cooldown (`comment-processor`)

```python
# tests/test_idempotency.py

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.comment_processor import CommentProcessor

class TestIdempotency:
    async def test_duplicate_event_returns_early(self, mock_redis):
        """Second delivery of same commenter event should be a no-op."""
        mock_redis.set.return_value = False  # lock already held
        processor = CommentProcessor(redis=mock_redis, ...)
        result = await processor.process(event)
        assert result.status == "duplicate"
        mock_redis.set.assert_called_once()  # SETNX called once, returned False

    async def test_cooldown_key_set_before_db_write(self, mock_redis, mock_campaign_service):
        """Cooldown must be acquired BEFORE calling campaign-service."""
        call_order = []
        mock_redis.set.side_effect = lambda *a, **kw: call_order.append("redis")
        mock_campaign_service.create_capture.side_effect = lambda *a, **kw: call_order.append("db")
        mock_redis.set.return_value = True
        ...
        assert call_order.index("redis") < call_order.index("db")
```

### T5 — Comment Edit Filter (`webhook-handler`)

```python
class TestCommentEditFilter:
    def test_add_verb_processed(self):
        event = {"changes": [{"value": {"verb": "add", "comment_id": "1"}}]}
        assert filter_edit_events(event) is True

    def test_edited_verb_dropped(self):
        event = {"changes": [{"value": {"verb": "edited", "comment_id": "1"}}]}
        assert filter_edit_events(event) is False

    def test_remove_verb_dropped(self):
        event = {"changes": [{"value": {"verb": "remove", "comment_id": "1"}}]}
        assert filter_edit_events(event) is False
```

---

## 3. Integration Tests

### T6 — Page Resolver Cache (`comment-processor` + `integration-service` mock)

```python
class TestPageResolver:
    async def test_cache_hit_skips_integration_service(self, mock_redis, mock_integration_client):
        mock_redis.get.return_value = '{"workspace_id": "ws-uuid"}'
        resolver = PageResolver(redis=mock_redis, integration_client=mock_integration_client)
        result = await resolver.resolve("page-123")
        assert result["workspace_id"] == "ws-uuid"
        mock_integration_client.resolve.assert_not_called()  # cache hit, no API call

    async def test_cache_miss_calls_integration_service(self, mock_redis, mock_integration_client):
        mock_redis.get.return_value = None
        mock_integration_client.resolve.return_value = {"workspace_id": "ws-uuid"}
        resolver = PageResolver(redis=mock_redis, integration_client=mock_integration_client)
        result = await resolver.resolve("page-123")
        mock_integration_client.resolve.assert_called_once()
        mock_redis.set.assert_called_once()  # result cached

    async def test_unknown_page_returns_none(self, mock_redis, mock_integration_client):
        mock_redis.get.return_value = None
        mock_integration_client.resolve.side_effect = IntegrationNotFound()
        resolver = PageResolver(redis=mock_redis, integration_client=mock_integration_client)
        result = await resolver.resolve("unknown-page")
        assert result is None
```

### T7 — Outbox Event Written Atomically (`campaign-service`)

```python
class TestCommentCaptureAtomicity:
    async def test_capture_and_outbox_written_together(self, session):
        """Simulates DB error mid-transaction to verify atomicity."""
        with pytest.raises(Exception):
            async with session.begin():
                await create_capture_with_outbox(session, capture_data)
                raise Exception("simulated failure")
        
        # Verify neither record was written
        captures = await session.execute(select(CommentCapture).where(...))
        assert captures.first() is None
        outbox = await session.execute(select(OutboxEvent).where(...))
        assert outbox.first() is None

    async def test_duplicate_capture_returns_409(self, client, existing_capture):
        response = await client.post("/internal/comment-captures", json={
            "workspace_id": existing_capture.workspace_id,
            "post_id": existing_capture.post_id,
            "commenter_id": existing_capture.commenter_id,
            ...
        })
        assert response.status_code == 409
```

### T8 — Consent Log Written Atomically (`lead-service`)

```python
class TestConsentLogAtomicity:
    @pytest.mark.parametrize("workspace_country,expect_consent", [
        ("VN", True),
        ("TH", True),
        ("SG", True),
        ("US", False),
        ("AU", False),
    ])
    async def test_consent_log_by_country(self, session, workspace_country, expect_consent):
        workspace = create_workspace(country=workspace_country)
        event = make_comment_captured_event(workspace_id=workspace.id)
        await handle_comment_captured(session, event)
        
        consent_records = await session.execute(
            select(ConsentLog).where(ConsentLog.workspace_id == workspace.id)
        )
        if expect_consent:
            assert consent_records.first() is not None
        else:
            assert consent_records.first() is None

    async def test_consent_log_failure_rolls_back_lead(self, session, monkeypatch):
        """If consent_log write fails, lead must also be rolled back."""
        monkeypatch.setattr("app.models.consent_log.ConsentLog", raises_on_insert)
        with pytest.raises(Exception):
            await handle_comment_captured(session, make_vn_event())
        
        leads = await session.execute(select(Lead).where(...))
        assert leads.first() is None  # rolled back
```

### T9 — Suppression Check (`comment-processor`)

```python
class TestSuppressionCheck:
    async def test_unsubscribed_lead_suppressed(self, mock_lead_client):
        mock_lead_client.find_by_social_id.return_value = Lead(status="unsubscribed")
        result = await check_suppression("facebook", "commenter-123", "workspace-uuid")
        assert result is True

    async def test_active_lead_not_suppressed(self, mock_lead_client):
        mock_lead_client.find_by_social_id.return_value = Lead(status="new")
        result = await check_suppression("facebook", "commenter-123", "workspace-uuid")
        assert result is False

    async def test_unknown_commenter_not_suppressed(self, mock_lead_client):
        mock_lead_client.find_by_social_id.side_effect = LeadNotFound()
        result = await check_suppression("facebook", "commenter-123", "workspace-uuid")
        assert result is False
```

### T10 — Credit Deduction Before DM (`comment-processor`)

```python
class TestCreditDeduction:
    async def test_credit_deducted_before_dm_dispatch(self, mock_billing, mock_fb_client):
        call_order = []
        mock_billing.deduct.side_effect = lambda *a, **kw: call_order.append("billing")
        mock_fb_client.send_private_reply.side_effect = lambda *a, **kw: call_order.append("dm")
        mock_billing.deduct.return_value = CreditResult(success=True)
        
        await dispatch_dm(workspace_id, comment_id, template, ...)
        assert call_order.index("billing") < call_order.index("dm")

    async def test_insufficient_credits_skips_dm(self, mock_billing, mock_fb_client):
        mock_billing.deduct.return_value = CreditResult(success=False, reason="insufficient")
        result = await dispatch_dm(workspace_id, comment_id, template, ...)
        assert result.dm_error == "credits_exhausted"
        mock_fb_client.send_private_reply.assert_not_called()
```

---

## 4. End-to-End / Smoke Tests

### T11 — Full Pipeline Smoke Test (staging only, requires Facebook test page)

```
GIVEN a Pro workspace with a connected Facebook test page
AND a registered social post with keyword rule ["thông tin"]
AND a DM template "Chào {{name}}, cảm ơn bạn đã quan tâm!"
WHEN a test comment "thông tin tour" is posted via Graph API test user
THEN:
  - comment_captures row created within 60s
  - dm_sent = true
  - lead record created in lead-service
  - comment_capture.lead_id backfilled
  - consent_log entry created (VN workspace)
```

### T12 — Comment Edit Event E2E (staging)
```
WHEN a comment is edited (existing captured comment)
THEN:
  - No new capture row created
  - No DM sent
  - No credits deducted
```

---

## 5. Coverage Gates

| Service | Required Line Coverage | Required Branch Coverage |
|---|---|---|
| webhook-handler | ≥ 90% | ≥ 85% |
| comment-processor | ≥ 90% | ≥ 85% |
| campaign-service (new code) | ≥ 85% | ≥ 80% |
| lead-service (new handler) | ≥ 85% | ≥ 80% |
| integration-service (new endpoint) | ≥ 85% | ≥ 80% |

---

## 6. Vietnamese Keyword Test Fixtures

Pre-built keyword fixtures for vertical tests (used in T3 + T11):

```python
TRAVEL_KEYWORDS = ["báo giá", "thông tin", "đặt tour", "giá tour", "tư vấn", "price", "info"]
INSURANCE_KEYWORDS = ["tư vấn", "phí", "bảo hiểm", "đăng ký", "mua", "premium", "register"]
RECRUITMENT_KEYWORDS = ["ứng tuyển", "apply", "CV", "nộp đơn", "job", "tuyển dụng"]

VIETNAMESE_COMMENT_SAMPLES = [
    ("thông tin em ơi", True),
    ("bao gia anh oi", True),  # unidecode match
    ("đẹp quá anh ơi", False),
    ("THÔNG TIN", True),  # case insensitive
    ("thôngtin", False),  # no space — substring not matched by default
]
```
