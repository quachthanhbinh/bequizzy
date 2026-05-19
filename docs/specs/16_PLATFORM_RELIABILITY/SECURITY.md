# Spec 16 — Platform Reliability: SECURITY

**Overall Risk: 🔴 HIGH** (Reliability issues = availability attacks)

## Threat Model

### T16-01: Health Endpoint Information Disclosure
- **Threat:** `/readyz` returns stack traces or internal topology on failure
- **Controls:** Error details sanitized; only `{"status": "degraded"}` returned; internal details logged but not exposed
- **Residual Risk:** Low

### T16-02: Circuit Breaker State Poisoning
- **Threat:** Attacker floods service with errors to open circuit breakers and cause DoS
- **Controls:** Circuit breaker threshold not exposed to users; Redis state keys are service-internal; Cloudflare rate limiting at edge
- **Residual Risk:** Low

### T16-03: Retry Storm (DDoS Amplification)
- **Threat:** Retry logic amplifies load on already-failing downstream service
- **Controls:** Max 3 retries; exponential backoff max 30s; circuit breaker opens before retry storm can escalate
- **Residual Risk:** Low

### T16-04: /healthz Used for Port Scanning
- **Threat:** External attacker enumerates internal services via health endpoints
- **Controls:** Health endpoints on internal-only Cloud Run services (`--ingress=internal`); only api-gateway is public
- **Residual Risk:** Low
