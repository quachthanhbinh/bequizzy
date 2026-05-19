# RevLooper Global Code Conventions

**Status: Enforced. Non-negotiable.**
These rules apply to every line of code merged into `main`. They exist to protect product quality, team velocity, and long-term maintainability. If a rule needs changing, open a discussion — do not silently deviate.

Applies to: all backend (BE) and frontend (FE) code across RevLooper.
Design system (CSS tokens and components): see `design-system/globals.css` and `design-system/components.css`.

---

## 0. Enforcement

| Rule area | Automated | Code review |
|---|---|---|
| TypeScript strict mode, no `any` | ESLint + `tsc --strict` | Fail CI if not passing |
| Formatting (indent, quotes, trailing comma) | Prettier | CI check |
| Import order and barrel imports | ESLint import plugin | CI check |
| No console.log in merged code | ESLint `no-console` | CI check |
| Naming conventions | ESLint naming-convention rule | Code review |
| Test coverage | Vitest / Jest coverage threshold | CI gate |
| PR references spec/ticket | PR template required field | Code review |
| Security rules | Automated SAST scan | Code review |

A PR that fails any CI check must not be merged. No exceptions.

---

## 1. Language and Naming

### 1.1 General
- All identifiers, comments, and documentation are written in **English**.
- Names must be descriptive. Abbreviations are allowed only if universally understood (`id`, `url`, `dto`, `ctx`).
- No single-letter variables outside loop counters (`i`, `j`) or math expressions.
- No Hungarian notation. No type suffixes in variable names (`userList` not `userArray`, `isActive` not `isActiveBool`).
- Boolean names must start with `is`, `has`, `can`, `should`, or `did` — never just `active`, `valid`, `found`.

### 1.2 Casing by context

| Context | Convention | Example |
|---|---|---|
| BE — database columns | `snake_case` | `lead_source`, `created_at` |
| BE — domain models / service classes | `PascalCase` | `LeadService`, `CampaignForm` |
| BE — methods, functions, variables | `camelCase` | `findLeadById`, `normalizePayload` |
| BE — constants / enums | `SCREAMING_SNAKE_CASE` | `LEAD_STATUS_NEW`, `MAX_RETRY` |
| BE — file names | `kebab-case` | `lead-service.ts`, `campaign-form.entity.ts` |
| FE — components | `PascalCase` | `LeadSourceCard`, `CampaignFormBuilder` |
| FE — hooks | `camelCase` prefixed `use` | `useLeadList`, `useCampaignForm` |
| FE — view-model fields | `camelCase` | `leadSource`, `createdAt`, `campaignId` |
| FE — constants / enums | `SCREAMING_SNAKE_CASE` | `LEAD_STATUS.NEW` |
| FE — file names | `kebab-case` | `lead-source-card.tsx`, `use-lead-list.ts` |
| CSS classes | `kebab-case` | `.btn-primary`, `.card-header` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |

---

## 1a. TypeScript Rules

These rules apply to **every TypeScript file** in the project — BE and FE.

### 1a.1 Strict mode — always on
The project `tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```
Never relax these flags, even temporarily.

### 1a.2 Forbidden patterns

| Forbidden | Use instead |
|---|---|
| `any` | `unknown` + type guard, or a named type |
| Type assertion `as Foo` on untrusted data | Zod/class-validator parse + typed output |
| Non-null assertion `foo!` | Explicit null check before use |
| `// @ts-ignore` | Fix the type error — if it's a library issue, use `// @ts-expect-error` with a comment explaining why |
| `Object`, `Function`, `{}` as a type | Precise named types or `Record<string, unknown>` |
| `enum` keyword | `const` object + `typeof` union (tree-shakeable, no runtime overhead) |
| `namespace` | ES modules only |
| Implicit return type on exported functions | Always declare return type explicitly |

### 1a.3 Type definitions
- Prefer `interface` for object shapes that may be extended; use `type` for unions, intersections, and aliases.
- Every exported function and method must have an explicit return type.
- Generic type parameters must be named descriptively: `TEntity`, `TDto`, `TInput` — not single letters like `T`, `K`, `V` (exception: standard library idioms like `Array<T>`).

### 1a.4 Imports and exports
- Use ES module `import` / `export` everywhere. No `require()`.
- No default exports from utility modules, hooks, or services — named exports only. Default exports are allowed only for top-level page/route components (framework requirement).
- Never use barrel re-export chains deeper than 2 levels (causes circular dependency risk).
- Import order enforced by ESLint import plugin:
  1. Node built-ins
  2. External packages
  3. Internal absolute aliases (`@/`)
  4. Relative imports
  5. Type-only imports (`import type …`)
- Separate each group with a blank line.

### 1a.5 Null and undefined
- `undefined`: field was never set / does not exist.
- `null`: field was intentionally cleared or is explicitly absent.
- Never use them interchangeably. In API contracts: use `null`, not `undefined`, for absent values.
- Avoid optional chaining (`?.`) as a silencer for missing data — only use it when absence is the expected happy path.

---

## 2. File and Folder Structure

### 2.1 Backend
- One primary export per file.
- Group by domain feature, not by technical type:
  ```
  app/
    models/
      lead.py        # SQLAlchemy ORM model
    schemas/
      lead.py        # Pydantic request/response schemas
    services/
      lead_service.py  # Business logic
    api/
      v1/
        leads.py     # FastAPI router (endpoints only — no business logic)
  ```
- Service files are named with domain: `lead_service.py`, `campaign_service.py`.

### 2.2 Frontend
- Co-locate component, styles, and tests in one folder when the component is non-trivial:
  ```
  components/
    LeadSourceCard/
      index.tsx
      LeadSourceCard.tsx
      LeadSourceCard.test.tsx
  ```
- Shared primitives live in `components/ui/`.
- Hooks live in `hooks/`.
- API client adapters live in `lib/api/` or `services/`.

---

## 3. BE — Backend Conventions

### 3.1 Layer responsibilities
| Layer | Responsibility | Must NOT |
|---|---|---|
| Controller | Parse HTTP input, call service, return HTTP output | Contain business logic |
| Service | Business logic, orchestration | Know about HTTP or DB syntax |
| Repository / DAO | Data access only | Contain business rules |
| Mapper / Assembler | Convert between domain ↔ DTO ↔ provider | Contain logic beyond mapping |

### 3.2 Domain model rules
- Domain models are plain objects or classes with no framework decorators.
- Never return domain models directly from controllers — always go through a mapper to a DTO.

### 3.3 DTOs
- DTOs are the contract between service and transport layer.
- All input DTOs must be validated at the transport boundary before entering service code.
- Use strict typing — no `any` in DTOs.

### 3.4 Error handling
- Return structured error shapes from all endpoints:
  ```json
  {
    "code": "LEAD_NOT_FOUND",
    "message": "Lead with id 123 does not exist.",
    "details": {},
    "traceId": "abc-123"
  }
  ```
- Never expose stack traces or internal error messages to API consumers.
- Use typed error classes, not generic `Error` throws, inside service layers.
- Every `catch` block must either handle the error and recover, or re-throw it as a typed domain error. Empty `catch` blocks are forbidden.
- Unhandled promise rejections must crash the process (never silently swallow with `.catch(() => {})`).

### 3.5 Logging
- Use a structured JSON logger (`structlog` or `logging` with JSON formatter via `python-json-logger`) — never `print()` or bare `logging.debug()` without structured fields.
- Log levels: `error` for broken state, `warn` for recoverable anomalies, `info` for significant business events, `debug` for developer traces (disabled in production).
- Every log entry must include: `traceId`, `service`, `timestamp`.
- Never log: passwords, tokens, PII (email, phone, name), raw financial data, full request bodies containing sensitive fields.
- Log the `traceId` from the incoming request on every log line within that request's lifecycle.

### 3.6 Database
- Column names: `snake_case`.
- Timestamps: always store in UTC. Column names: `created_at`, `updated_at`, `deleted_at`.
- Soft-delete with `deleted_at` — never hard-delete records that are referenced by other entities.
- Indexes: add for every foreign key and every field used in a `WHERE` filter by default.
- Monetary values: store in minor units (integer). Never store as `float`.
- Migrations are additive-only in production — never drop a column or rename a column in a single migration. Use expand-contract pattern.
- All schema changes require a migration file — never mutate the schema manually.

### 3.7 API design
- REST: noun-based resource paths, HTTP verbs for actions.
  - `GET /leads` — list
  - `POST /leads` — create
  - `GET /leads/:id` — get one
  - `PATCH /leads/:id` — partial update
  - `DELETE /leads/:id` — delete
- API versioning: prefix with `/api/v1/`, `/api/v2/` for breaking changes.
- Pagination: use `page` + `pageSize` query params. Always return `total`, `page`, `pageSize` in list responses.
- All list endpoints must support pagination — no unbounded queries returning all records.
- HTTP status codes: `200` success, `201` created, `204` no content, `400` bad input, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `422` validation error, `500` server error. Never return `200` for an error.

---

## 4. FE — Frontend Conventions

### 4.1 Component rules
- Components are pure rendering units. No direct API calls inside components.
- Data fetching belongs in hooks or server components, not inside JSX.
- Props must be explicitly typed — no `any`, no implicit `object`.
- Destructure props at the function signature:
  ```tsx
  // good
  function LeadCard({ lead, onSelect }: LeadCardProps) {}

  // bad
  function LeadCard(props: any) {}
  ```

### 4.2 State management
- Local UI state: `useState` / `useReducer`.
- Server/async state: data-fetching library (React Query or SWR) — do not duplicate server state in global stores.
- Global app state: only for cross-cutting concerns (auth, theme, global notifications).
- No prop drilling beyond 2 levels — lift state or use context.
- Never store derived data in state — compute it during render or memoize it.
- Never mutate state directly — always produce a new value.

### 4.3 Styling
- Use Tailwind utility classes from the approved token set.
- Component-level custom styles go in `design-system/components.css` as named classes.
- No inline `style={{}}` for color, spacing, or typography unless the value is computed at runtime.
- No CSS Modules or styled-components — Tailwind utilities only.

### 4.4 Accessibility
- Every interactive element must be keyboard-reachable and have a visible focus ring.
- Images need `alt` text. Decorative images use `alt=""`.
- Form fields must have associated `<label>` elements (not just placeholder text).
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`) before adding ARIA attributes.

### 4.5 Performance
- Lazy-load routes and heavy components with dynamic import / `React.lazy`.
- Avoid inline function creation inside JSX for event handlers on list items.
- Memoize with `useMemo` / `useCallback` only when profiling shows a real problem.
- Never `useEffect` to sync state that can be derived from other state.
- Key prop in lists must be a stable, unique business ID — never use array index as key.

### 4.6 Logging (FE)
- No `console.log`, `console.warn`, or `console.error` in committed code.
- Use an observability SDK (e.g. Sentry) for client-side error capture.
- Never log PII (user name, email, phone) to the browser console or to Sentry in plaintext.

---

## 5. BE ↔ FE Data Conversion

### 5.1 Naming at boundaries
- BE emits `snake_case` fields in API responses.
- FE converts to `camelCase` at the API client layer — **not** inside components.
- Components receive only FE-native view models.

Examples:
| BE field | FE view-model field |
|---|---|
| `lead_source` | `leadSource` |
| `created_at` | `createdAt` |
| `campaign_id` | `campaignId` |
| `amount_minor` | `amountMinor` |

### 5.2 Where conversion lives

**Backend:**
- `domain → DTO`: in mapper, called from controller before returning response.
- `DTO → domain`: in mapper, called from controller after validating input.
- `provider payload → normalized`: in provider-specific adapters before entering service.

**Frontend:**
- `API response → view model`: in API client layer (`lib/api/` or `services/`).
- Components never touch raw HTTP responses.

### 5.3 Type rules

| Type | Rule |
|---|---|
| Dates / timestamps | BE emits ISO-8601 UTC strings. FE keeps as string in transport; converts to `Date` only when displaying or computing. |
| Money | Store and transport as integer minor units. FE uses locale-aware formatter for display only. |
| Booleans | Always `true` / `false`. Never string `"true"` or numeric `1`. |
| Nullable fields | Emit explicit `null` when a value is absent and null is meaningful. Do not omit the key. |

### 5.4 Enums
- One canonical enum definition per business concept.
- BE value: `snake_case` string — `"lead_status": "new"`.
- FE constant: `SCREAMING_SNAKE_CASE` — `LEAD_STATUS.NEW`.
- Unknown values received from BE or provider must map to `UNKNOWN` and be logged — never silently coerced.

### 5.5 Error model
BE response shape:
```json
{ "code": "…", "message": "…", "details": {}, "traceId": "…" }
```

FE safe model (shown to user):
```ts
{ userMessage: string; debugCode: string; traceId: string }
```

Rules:
- Never render `message` from BE directly to the user without sanitization.
- Always preserve `traceId` for support and debugging workflows.

### 5.6 Provider payload normalization
All inbound provider payloads (Facebook, Google, Zalo, TikTok, form embeds) must pass through a source-specific adapter before entering domain logic.

Minimum normalized shape:
```ts
{
  sourceType    : string;  // "facebook_lead_ad" | "google_form" | …
  sourceChannel : string;  // "paid" | "organic" | "embed"
  externalId    : string;
  campaignId    : string | null;
  capturedAt    : string;  // ISO-8601 UTC
  contact: {
    name  : string | null;
    email : string | null;
    phone : string | null;
  };
  rawPayload    : unknown; // retained for audit and replay
}
```

---

## 6. Testing

### 6.1 Coverage expectations
| Area | Minimum |
|---|---|
| BE service layer | Unit tests for all business rules |
| BE mappers | Unit tests: happy path, missing optional fields, unknown enum, null normalization |
| BE controllers | Integration tests for success + common error paths |
| FE hooks | Unit tests for data transformation and error states |
| FE components | Render tests for each variant and interactive state |
| FE API adapters | Unit tests: field mapping, date parsing, enum normalization |

### 6.2 Rules
- Tests live next to the file they test (`lead.service.spec.ts` beside `lead.service.ts`).
- No `any` in test files.
- Do not test implementation details — test behavior and output.
- Every mapper/converter must cover: happy path, missing optional fields, unknown enum value, null/undefined normalization.
- Test data must be deterministic — no `Math.random()`, no `new Date()` without a fixed value.
- Mocks must be typed. Never mock a method with `jest.fn()` without specifying the return type.
- No test may depend on the execution order of other tests.
- CI must enforce a minimum coverage threshold. Reducing the threshold requires explicit team sign-off.

### 6.3 What NOT to test
- Framework behavior (React's re-render mechanics, ORM query internals).
- Third-party library correctness.
- Implementation details that change without changing behavior.

---

## 7. Security

- Validate and sanitize all input at the transport boundary before use.
- Never log passwords, tokens, PII, or raw financial data.
- Use parameterized queries — no string interpolation in SQL.
- All authenticated endpoints must verify the session/token before processing.
- Secrets belong in environment variables, never in source code or committed config files.
- Never commit `.env` files. Use `.env.example` with placeholder values only.
- Rate-limit all public-facing endpoints.
- All file uploads must be validated for type and size before processing.
- Never use `dangerouslySetInnerHTML` without explicit sanitization (e.g. DOMPurify).
- CORS must be configured to an explicit allowlist — never use `origin: *` in production.
- Dependencies must be kept up to date. Run `npm audit` in CI and fail on high/critical severity.
- Any third-party provider credentials (Facebook, Google, Zalo, TikTok) must be scoped to minimum required permissions and rotated on a schedule.

---

## 8. Dependencies

- Do not add a new dependency for functionality that can be implemented in under 20 lines without it.
- Every new production dependency requires a brief justification in the PR description: what it does, why an existing dependency can't cover it, and its maintenance status (last commit, open issues, stars).
- No two packages that solve the same problem — one canonical choice per concern (one HTTP client, one date lib, one validator).
- Lock files (`package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`) are committed and must not be manually edited.
- Pin major versions of critical dependencies (DB drivers, auth libraries, framework).

---

## 9. Git and PR Rules

- Branch names: `type/short-description` — e.g. `feat/lead-import`, `fix/form-sync-webhook`.
- Commit messages: `type(scope): short description` — e.g. `feat(leads): add bulk import endpoint`.
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
- PRs must reference a spec, ticket, or issue.
- Every PR that touches a mapper or converter must include updated tests.
- No `console.log` / `print` debug statements in merged code.
- Every PR must be reviewed by at least one other engineer before merge.
- `main` is protected — no direct pushes. All changes go through PRs.
- Squash-merge is the default merge strategy. Commits on `main` must be clean and atomic.
- Do not resolve review comments yourself — the reviewer resolves them.
- Draft PRs are encouraged for work-in-progress; mark as "Ready for review" only when CI passes.

---

## 10. Quick DO / DON'T Reference

A fast checklist for the most common violations caught in code review.

### TypeScript
| DO | DON'T |
|---|---|
| `unknown` + type guard | `any` |
| `if (value == null)` | `value!` non-null assertion on untrusted input |
| Named return types on exports | Implicit `any` return |
| `const STATUS = { NEW: 'new' } as const` | `enum Status { NEW = 'new' }` |
| `import type { Foo }` for type-only imports | Mixing value and type imports without `import type` |

### Backend
| DO | DON'T |
|---|---|
| Validate input in controller before service | Validate inside service or repository |
| Throw typed domain errors | `throw new Error('something broke')` |
| Store money as integer minor units | Store money as `float` or `string` |
| Log with `traceId` on every line | Log PII or secrets |
| Soft-delete with `deleted_at` | `DELETE FROM` on referenced records |

### Frontend
| DO | DON'T |
|---|---|
| Fetch data in a hook | Fetch data inside a component's render function |
| Use Tailwind classes from the token set | Inline `style={{ color: '#something' }}` |
| `key={lead.id}` in lists | `key={index}` in lists |
| `isLoading`, `hasError`, `canSubmit` | `loading`, `error` (as boolean name), `submit` |
| Derive computed values during render | `useEffect` to sync derived state |

### Data conversion
| DO | DON'T |
|---|---|
| Convert `snake_case` → `camelCase` in API client layer | Convert inside a React component |
| Map unknown enum value to `UNKNOWN` + log it | Silently ignore / coerce unknown enum values |
| Keep `traceId` through the error chain | Drop `traceId` when catching and re-throwing |
| Emit explicit `null` for absent fields in API | Omit the field or use `undefined` in API response |
