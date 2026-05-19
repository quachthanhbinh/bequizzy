# Spec 19 — QA Test Strategy: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T19-01: Test Data Containing Real PII
- **Threat:** Test fixtures use real email addresses or phone numbers
- **Controls:** Test fixtures use `@example.com` and `+15550000000` format only; reviewed in PR
- **Residual Risk:** Low

### T19-02: E2E Tests Running Against Production
- **Threat:** E2E tests accidentally run against prod environment
- **Controls:** E2E base URL is always `staging.revlooper.com`; prod URL blocked in Playwright config
- **Residual Risk:** Low
