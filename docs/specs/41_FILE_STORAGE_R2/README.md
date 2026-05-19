# 41 — File Storage with Cloudflare R2

**Status:** 📝 Draft
**Confidence:** 9/10
**Security flag:** 🟡 MEDIUM (presigned URL enumeration, cross-tenant access, file type validation)
**Priority:** P1
**Phase:** Phase 1 (Foundation)
**Parallel Track:** A (Core Infrastructure)
**Depends on:** 01 (Auth & Workspace — workspace_id scoping)
**Blocks:** 02 (AI Brain — document upload), 03 (Lead Management — CSV import), 34 (Content Studio — image assets)
**Owning service:** `storage-service` (new)

## One-line summary
Secure file upload and retrieval system using Cloudflare R2 with presigned URLs, date-based path organization, workspace isolation, and 30-minute read token expiry.

## Why it matters
- **Zero-egress costs** — Cloudflare R2 has no egress fees vs S3's $0.09/GB, critical for user-uploaded content and AI-generated assets
- **Foundation for multiple features** — AI Brain document upload, lead CSV import, campaign content assets, email attachments all need file storage
- **Security-first design** — private bucket with presigned URLs prevents unauthorized access and cross-tenant data leaks
- **SEA latency optimization** — Cloudflare's global network provides <50ms upload latency from Vietnam/Thailand/Singapore

## Files

| File | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, upload/download flows, file type support, acceptance criteria |
| [DESIGN.md](DESIGN.md) | Architecture, data model, API endpoints, presigned URL generation, CPO↔CTO debate |
| [SECURITY.md](SECURITY.md) | Threat model — presigned URL enumeration, file type validation, malware, cross-tenant access |
| [TESTS.md](TESTS.md) | Unit / integration / E2E test strategy |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Service scaffold, rollout phases, file map |
| [TASKS.md](TASKS.md) | TDD task list (RED-first, ≤15 tasks) |
| [RESULT.md](RESULT.md) | (Empty until shipped) |

## Debate Summary
Two-round CPO↔CTO debate converged at **9/10 confidence**.

**Round 1 — Key decisions:**
- Path structure: `{workspace_id}/{yyyy}/{mm}/{dd}/{random_id}/{filename}` for organization and anti-enumeration
- Presigned URL expiry: 30 minutes for reads, 15 minutes for uploads
- File metadata stored in PostgreSQL, not R2 object metadata (queryable, workspace-scoped)
- boto3 S3-compatible client (R2 is S3 API compatible)

**Round 2 — Resolutions:**
- File type validation: whitelist-based MIME type checking + magic byte verification (not just extension)
- Max file size: 100MB per file (prevents abuse, sufficient for documents/images)
- Virus scanning: deferred to Phase 2 (ClamAV integration via Cloud Functions)
- Direct upload flow: client → presigned POST URL → R2 (no proxy through backend)

## Architecture Decision Record
| Decision | Rationale |
|---|---|
| Dedicated `storage-service` | Single responsibility for file operations; other services call via REST |
| Date-based path structure | Enables lifecycle policies (auto-delete old files), prevents hot-spotting |
| Random UUID in path | 122-bit entropy prevents enumeration attacks |
| Metadata in PostgreSQL | Enables workspace-scoped queries, file search, audit trail |
| Presigned URLs over proxy upload | Reduces backend load, leverages R2's edge network for upload speed |
| 30-minute read expiry | Balance between UX (enough time to view/download) and security (limited exposure window) |

## Non-goals (Phase 1)
- Virus/malware scanning (Phase 2 — ClamAV integration)
- Image resizing/optimization (Phase 2 — handled by `image-gen-service`)
- CDN caching for public assets (all files are private in Phase 1)
- File versioning (single version per file)
- Resumable uploads (use presigned POST, not multipart)

## Pointers
- Related specs: 02 (AI Brain), 03 (Lead Management), 34 (Content Studio)
- Skills used: `spec-driven-development`, `tdd-workflow`, `systematic-debugging`
- Runbook (post-ship): `docs/runbooks/storage-service.md`
