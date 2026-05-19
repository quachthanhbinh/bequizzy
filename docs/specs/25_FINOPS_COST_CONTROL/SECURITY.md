# Spec 25 — FinOps & Cost Control: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

### T25-01: Cost Cap Bypass
- **Threat:** Workspace bypasses daily cap by making direct LLM calls
- **Controls:** All AI operations route through ai-service only; direct LLM SDK calls forbidden
- **Residual Risk:** Low

### T25-02: Redis Counter Manipulation
- **Threat:** Race condition causes counter overshoot
- **Controls:** Redis INCRBYFLOAT is atomic; no race condition possible
- **Residual Risk:** Low
