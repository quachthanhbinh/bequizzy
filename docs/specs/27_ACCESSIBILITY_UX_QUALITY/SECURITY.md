# Spec 27 — Accessibility & UX Quality: SECURITY

**Overall Risk: 🟢 LOW**

## Threat Model

No meaningful security risks in accessibility spec.

### T27-01: Focus Trap Bypass
- **Threat:** Modal focus trap exploitable to reach background content via screen reader
- **Controls:** shadcn/ui Dialog uses Radix UI which implements ARIA modal correctly; focus trap tested
- **Residual Risk:** Low
