# 41 — File Storage with Cloudflare R2 — DESIGN

**Status:** 📝 Draft
**Last updated:** 2026-05-18

## CPO ↔ CTO Debate

### Round 1 — Opening Positions

**CPO (confidence: 8/10):**
File storage is a foundational capability that unblocks three high-priority features: AI Brain document upload (Spec 02), lead CSV import (Spec 03), and Content Studio assets (Spec 34). The direct-upload flow (client → R2 via presigned POST) is critical for SEA market performance — proxying uploads through our backend would add 200-500ms latency from Vietnam/Thailand.

The 30-minute read URL expiry strikes the right balance: long enough for users to download files without frustration, short enough to limit exposure if a URL leaks. The date-based path structure is elegant — it enables lifecycle policies (auto-delete old files) and prevents hot-spotting in R2's object store.

One concern: we need file type validation beyond just checking the extension. Users could upload malware disguised as PDFs. We should validate magic bytes, not just MIME types.

**CTO (confidence: 7/10):**
The architecture is sound, but I have three concerns:

**Concern 1 — Metadata storage location.** Should file metadata live in PostgreSQL or R2 object metadata? PostgreSQL enables workspace-scoped queries and joins, but adds a consistency problem: what if the R2 upload succeeds but the DB write fails?

**Resolution:** Metadata in PostgreSQL is the right call. R2 object metadata is not queryable via SQL, which breaks workspace isolation enforcement. The consistency problem is solved by the two-phase flow: write metadata row with status=`pending`, then update to `ready` after upload completes. If the upload fails, the pending row is cleaned up by a daily job.

**Concern 2 — Presigned URL enumeration.** If an attacker knows the path structure `{workspace_id}/{yyyy}/{mm}/{dd}/{file_id}/{filename}`, they could enumerate file_ids (UUIDs) and try to generate presigned URLs. While UUIDs have 122-bit entropy (not brute-forceable), we should monitor for suspicious access patterns.

**Resolution:** Agreed. Add CloudWatch alarm for 403/404 rate on R2 bucket. If a workspace generates >100 failed presigned URL requests in 5 minutes, alert security team.

**Concern 3 — Storage quota enforcement timing.** The PRD says quota is checked on upload initiation, but what if a user initiates 10 uploads simultaneously, each under quota individually, but collectively exceeding quota?

**Resolution:** Add a `reserved_bytes` column to `workspace_credits` table. On upload initiation, atomically increment `reserved_bytes` by file size. On upload completion, decrement `reserved_bytes` and increment `used_bytes`. On upload failure/timeout, decrement `reserved_bytes`. This prevents race conditions.

**CTO confidence: 9 (all concerns resolved)**

**Gap: CPO 8 / CTO 9 = gap 1, both ≥ 7. → CONVERGED.**

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  File upload component → useFileUpload hook                  │
│  File gallery → file card grid → download button            │
└───────────────────┬──────────────────────────────┬──────────┘
                    │ REST                          │
                    ▼                               │
┌─────────────────────────┐                        │
│     api-gateway          │                        │
│  X-Workspace-ID header   │                        │
└──────────┬──────────────┘                        │
           │                                        │
           ▼                                        │
┌─────────────────────────────────────────────────┐│
│         storage-service (NEW)                    ││
│  • Presigned URL generation (POST/GET)           ││
│  • File metadata CRUD                            ││
│  • Quota enforcement (with reserved_bytes)       ││
│  • boto3 S3-compatible R2 client                 ││
│  • Magic byte validation                         ││
│  Cloud Run, min-instances=1                      ││
└──────────┬───────────────────────────────────────┘│
           │                                         │
           ▼                                         │
┌─────────────────────┐    ┌─────────────────────┐ │
│   Cloudflare R2      │    │   PostgreSQL         │ │
│  Private bucket      │    │   storage_files      │ │
│  /{workspace_id}/    │    │   (metadata)         │ │
│  {yyyy}/{mm}/{dd}/   │    └─────────────────────┘ │
│  {file_id}/{name}    │                            │
└─────────────────────┘                             │
           ▲                                         │
           │ Direct upload (presigned POST)         │
           └─────────────────────────────────────────┘
```

## Data Model

```sql
-- Owned by: storage-service
CREATE TABLE storage_files (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID    NOT NULL,
  filename          TEXT    NOT NULL,               -- original filename with extension
  content_type      TEXT    NOT NULL,               -- MIME type (validated)
  file_size         BIGINT  NOT NULL,               -- bytes
  purpose           TEXT    NOT NULL,               -- ai_brain_doc | lead_import | content_asset | avatar
  status            TEXT    NOT NULL DEFAULT 'pending', -- pending | ready | deleted | failed
  r2_key            TEXT    NOT NULL UNIQUE,        -- full R2 object key: {workspace_id}/{yyyy}/{mm}/{dd}/{file_id}/{filename}
  upload_expires_at TIMESTAMPTZ,                    -- when presigned POST URL expires (15 min from initiation)
  created_by        UUID    NOT NULL,               -- user ID (soft FK to auth users)
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,                    -- soft delete timestamp
  
  -- Metadata for audit/debugging
  metadata          JSONB   DEFAULT '{}',           -- { "magic_bytes": "25504446", "user_agent": "...", "ip": "..." }
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'ready', deleted', 'failed')),
  CONSTRAINT valid_purpose CHECK (purpose IN ('ai_brain_doc', 'lead_import', 'content_asset', 'avatar'))
);

-- Indexes for common queries
CREATE INDEX idx_storage_files_workspace_purpose
  ON storage_files (workspace_id, purpose, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_storage_files_pending_cleanup
  ON storage_files (created_at)
  WHERE status = 'pending' AND deleted_at IS NULL;

CREATE INDEX idx_storage_files_soft_deleted
  ON storage_files (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Workspace storage quota tracking
-- (extends existing workspace_credits table in billing-service)
ALTER TABLE workspace_credits ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;
ALTER TABLE workspace_credits ADD COLUMN IF NOT EXISTS storage_reserved_bytes BIGINT DEFAULT 0;
ALTER TABLE workspace_credits ADD COLUMN IF NOT EXISTS storage_file_count INT DEFAULT 0;
```

## API Endpoints

### Upload Initiation
```
POST /v1/storage/upload/initiate
Headers:
  Authorization: Bearer {jwt}
  X-Workspace-ID: {workspace_id}
Body:
  {
    "filename": "company-profile.pdf",
    "content_type": "application/pdf",
    "file_size": 5242880,  // bytes
    "purpose": "ai_brain_doc"
  }
Response 200:
  {
    "file_id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "upload_url": "https://revlooper-files.r2.cloudflarestorage.com",
    "upload_fields": {
      "key": "a1b2c3d4.../2026/05/18/f9e8d7c6.../company-profile.pdf",
      "policy": "eyJleHBpcmF0aW9uIjoi...",
      "x-amz-algorithm": "AWS4-HMAC-SHA256",
      "x-amz-credential": "...",
      "x-amz-date": "20260518T145030Z",
      "x-amz-signature": "..."
    },
    "expires_at": "2026-05-18T15:05:30Z"  // 15 minutes from now
  }
Response 400:
  { "error": "file_too_large", "message": "File size exceeds 100MB limit" }
Response 403:
  { "error": "quota_exceeded", "message": "Storage quota exceeded (1.2GB / 1GB used)" }
Response 422:
  { "error": "invalid_content_type", "message": "Content type 'application/x-msdownload' not allowed for purpose 'ai_brain_doc'" }
```

### Upload Completion
```
POST /v1/storage/upload/complete
Headers:
  Authorization: Bearer {jwt}
  X-Workspace-ID: {workspace_id}
Body:
  {
    "file_id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210"
  }
Response 200:
  {
    "file_id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "status": "ready",
    "filename": "company-profile.pdf",
    "file_size": 5242880,
    "created_at": "2026-05-18T14:50:30Z"
  }
Response 404:
  { "error": "file_not_found", "message": "File not found or does not belong to workspace" }
Response 409:
  { "error": "upload_not_completed", "message": "File not found in R2 bucket" }
```

### Download URL Generation
```
GET /v1/storage/files/{file_id}/download
Headers:
  Authorization: Bearer {jwt}
  X-Workspace-ID: {workspace_id}
Response 200:
  {
    "download_url": "https://revlooper-files.r2.cloudflarestorage.com/a1b2c3d4.../company-profile.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Signature=...",
    "expires_at": "2026-05-18T15:20:30Z",  // 30 minutes from now
    "filename": "company-profile.pdf",
    "content_type": "application/pdf",
    "file_size": 5242880
  }
Response 404:
  { "error": "file_not_found", "message": "File not found or does not belong to workspace" }
Response 410:
  { "error": "file_deleted", "message": "File has been deleted" }
```

### List Files
```
GET /v1/storage/files?purpose=ai_brain_doc&status=ready&page=1&limit=50
Headers:
  Authorization: Bearer {jwt}
  X-Workspace-ID: {workspace_id}
Response 200:
  {
    "files": [
      {
        "file_id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
        "filename": "company-profile.pdf",
        "content_type": "application/pdf",
        "file_size": 5242880,
        "purpose": "ai_brain_doc",
        "status": "ready",
        "created_at": "2026-05-18T14:50:30Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 127,
      "total_pages": 3
    }
  }
```

### Get File Metadata
```
GET /v1/storage/files/{file_id}
Headers:
  Authorization: Bearer {jwt}
  X-Workspace-ID: {workspace_id}
Response 200:
  {
    "file_id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "filename": "company-profile.pdf",
    "content_type": "application/pdf",
    "file_size": 5242880,
    "purpose": "ai_brain_doc",
    "status": "ready",
    "created_by": "user-uuid",
    "created_at": "2026-05-18T14:50:30Z",
    "updated_at": "2026-05-18T14:52:15Z"
  }
```

### Delete File
```
DELETE /v1/storage/files/{file_id}
Headers:
  Authorization: Bearer {jwt}
  X-Workspace-ID: {workspace_id}
Response 204: (no content)
Response 404:
  { "error": "file_not_found", "message": "File not found or does not belong to workspace" }
```

## Core Flows

### Flow 1: Upload Flow (Happy Path)

```
Client                  storage-service              R2                PostgreSQL
  │                            │                      │                     │
  │ POST /upload/initiate      │                      │                     │
  ├───────────────────────────>│                      │                     │
  │                            │ Check quota          │                     │
  │                            ├─────────────────────────────────────────>│
  │                            │                      │                     │
  │                            │ Reserve bytes        │                     │
  │                            │ (atomic increment)   │                     │
  │                            ├─────────────────────────────────────────>│
  │                            │                      │                     │
  │                            │ Generate UUID        │                     │
  │                            │ Build R2 key         │                     │
  │                            │ Generate presigned   │                     │
  │                            │ POST URL             │                     │
  │                            │                      │                     │
  │                            │ INSERT storage_files │                     │
  │                            │ (status=pending)     │                     │
  │                            ├─────────────────────────────────────────>│
  │                            │                      │                     │
  │<───────────────────────────┤                      │                     │
  │ { upload_url, fields }     │                      │                     │
  │                            │                      │                     │
  │ POST (multipart/form-data) │                      │                     │
  ├────────────────────────────────────────────────>│                     │
  │                            │                      │                     │
  │<────────────────────────────────────────────────┤                     │
  │ 204 No Content             │                      │                     │
  │                            │                      │                     │
  │ POST /upload/complete      │                      │                     │
  ├───────────────────────────>│                      │                     │
  │                            │ HEAD object (verify) │                     │
  │                            ├─────────────────────>│                     │
  │                            │<─────────────────────┤                     │
  │                            │                      │                     │
  │                            │ UPDATE storage_files │                     │
  │                            │ (status=ready)       │                     │
  │                            │ Decrement reserved   │                     │
  │                            │ Increment used       │                     │
  │                            ├─────────────────────────────────────────>│
  │                            │                      │                     │
  │<───────────────────────────┤                      │                     │
  │ { status: "ready" }        │                      │                     │
```

### Flow 2: Download Flow

```
Client                  storage-service              R2                PostgreSQL
  │                            │                      │                     │
  │ GET /files/{id}/download   │                      │                     │
  ├───────────────────────────>│                      │                     │
  │                            │ SELECT storage_files │                     │
  │                            │ WHERE id=? AND       │                     │
  │                            │ workspace_id=?       │                     │
  │                            ├─────────────────────────────────────────>│
  │                            │<─────────────────────────────────────────┤
  │                            │                      │                     │
  │                            │ Generate presigned   │                     │
  │                            │ GET URL (30 min)     │                     │
  │                            │                      │                     │
  │<───────────────────────────┤                      │                     │
  │ { download_url }           │                      │                     │
  │                            │                      │                     │
  │ GET (presigned URL)        │                      │                     │
  ├────────────────────────────────────────────────>│                     │
  │<────────────────────────────────────────────────┤                     │
  │ File bytes                 │                      │                     │
```

### Flow 3: Quota Enforcement (Race Condition Prevention)

```sql
-- On upload initiation (atomic transaction)
BEGIN;
  -- Check current quota
  SELECT storage_used_bytes + storage_reserved_bytes AS total_used,
         plan_storage_limit
  FROM workspace_credits
  WHERE workspace_id = ?
  FOR UPDATE;  -- row lock prevents race condition
  
  -- If total_used + new_file_size > plan_storage_limit, ROLLBACK
  
  -- Reserve bytes
  UPDATE workspace_credits
  SET storage_reserved_bytes = storage_reserved_bytes + ?
  WHERE workspace_id = ?;
  
  -- Insert metadata row
  INSERT INTO storage_files (...) VALUES (...);
COMMIT;

-- On upload completion (atomic transaction)
BEGIN;
  UPDATE workspace_credits
  SET storage_reserved_bytes = storage_reserved_bytes - ?,
      storage_used_bytes = storage_used_bytes + ?,
      storage_file_count = storage_file_count + 1
  WHERE workspace_id = ?;
  
  UPDATE storage_files
  SET status = 'ready'
  WHERE id = ?;
COMMIT;

-- On upload failure/timeout (atomic transaction)
BEGIN;
  UPDATE workspace_credits
  SET storage_reserved_bytes = storage_reserved_bytes - ?
  WHERE workspace_id = ?;
  
  UPDATE storage_files
  SET status = 'failed'
  WHERE id = ?;
COMMIT;
```

## File Type Validation

### Magic Byte Verification

```python
import magic

MAGIC_BYTE_SIGNATURES = {
    "application/pdf": b"%PDF",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/jpeg": b"\xff\xd8\xff",
    "application/zip": b"PK\x03\x04",
    "text/plain": None,  # No magic bytes for plain text
}

def validate_file_type(content_type: str, file_bytes: bytes) -> bool:
    """Validate file type by checking magic bytes."""
    expected_signature = MAGIC_BYTE_SIGNATURES.get(content_type)
    
    if expected_signature is None:
        # No magic bytes to check (e.g., text/plain)
        return True
    
    return file_bytes.startswith(expected_signature)
```

**Note:** Magic byte validation happens on upload completion (after R2 upload), not on initiation. Storage-service downloads the first 512 bytes from R2 to verify magic bytes before marking status=`ready`.

## Cleanup Jobs

### Job 1: Orphaned File Cleanup (Daily)

```python
# Runs daily at 02:00 UTC via Cloud Scheduler
async def cleanup_orphaned_files():
    """Mark pending files >24h old as failed."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    
    orphaned_files = await db.execute(
        """
        UPDATE storage_files
        SET status = 'failed'
        WHERE status = 'pending'
          AND created_at < :cutoff
          AND deleted_at IS NULL
        RETURNING id, workspace_id, file_size
        """
    )
    
    # Release reserved bytes
    for file in orphaned_files:
        await db.execute(
            """
            UPDATE workspace_credits
            SET storage_reserved_bytes = storage_reserved_bytes - :file_size
            WHERE workspace_id = :workspace_id
            """,
            file_size=file.file_size,
            workspace_id=file.workspace_id
        )
```

### Job 2: Soft-Deleted File Purge (Daily)

```python
# Runs daily at 03:00 UTC via Cloud Scheduler
async def purge_soft_deleted_files():
    """Permanently delete files soft-deleted >7 days ago."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    
    files_to_purge = await db.execute(
        """
        SELECT id, r2_key, workspace_id, file_size
        FROM storage_files
        WHERE deleted_at < :cutoff
          AND status = 'deleted'
        """
    )
    
    for file in files_to_purge:
        # Delete from R2
        await r2_client.delete_object(Bucket=BUCKET_NAME, Key=file.r2_key)
        
        # Delete metadata row
        await db.execute("DELETE FROM storage_files WHERE id = :id", id=file.id)
        
        # Decrement used bytes
        await db.execute(
            """
            UPDATE workspace_credits
            SET storage_used_bytes = storage_used_bytes - :file_size,
                storage_file_count = storage_file_count - 1
            WHERE workspace_id = :workspace_id
            """,
            file_size=file.file_size,
            workspace_id=file.workspace_id
        )
```

## R2 Configuration

### Bucket Setup (Terraform)

```hcl
resource "cloudflare_r2_bucket" "revlooper_files" {
  account_id = var.cloudflare_account_id
  name       = "revlooper-files-${var.environment}"
  location   = "APAC"  # Asia-Pacific region for SEA latency
}

# Lifecycle policy: auto-delete files >365 days old
resource "cloudflare_r2_bucket_lifecycle" "revlooper_files_lifecycle" {
  bucket_id = cloudflare_r2_bucket.revlooper_files.id
  
  rule {
    id      = "delete-old-files"
    enabled = true
    
    expiration {
      days = 365
    }
  }
}

# CORS policy for direct uploads
resource "cloudflare_r2_bucket_cors" "revlooper_files_cors" {
  bucket_id = cloudflare_r2_bucket.revlooper_files.id
  
  cors_rule {
    allowed_origins = ["https://app.revlooper.com", "https://app-staging.revlooper.com"]
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}
```

### boto3 Client Configuration

```python
import boto3
from botocore.config import Config

# R2 is S3-compatible
r2_client = boto3.client(
    "s3",
    endpoint_url=f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(
        signature_version="s3v4",
        region_name="auto",  # R2 uses "auto" region
    )
)
```

## Architecture Decision Records

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Dedicated `storage-service` | Single responsibility; other services call via REST; easier to scale independently | Embed storage logic in each service (rejected: duplicates code, harder to enforce quotas) |
| Metadata in PostgreSQL | Enables workspace-scoped queries, joins, audit trail | R2 object metadata (rejected: not queryable via SQL, breaks workspace isolation) |
| Presigned URLs over proxy | Reduces backend load, leverages R2 edge network | Proxy uploads through backend (rejected: adds latency, increases egress costs) |
| Date-based path structure | Enables lifecycle policies, prevents hot-spotting | Flat structure (rejected: no lifecycle policy support, hot-spotting risk) |
| Random UUID in path | 122-bit entropy prevents enumeration | Sequential IDs (rejected: enumerable), timestamp-based (rejected: predictable) |
| 30-minute read expiry | Balance between UX and security | 1 hour (rejected: too long exposure), 15 min (rejected: too short for large files) |
| Magic byte validation | Prevents MIME type spoofing | Extension-only validation (rejected: trivially bypassed) |
| Two-phase upload (pending → ready) | Handles upload failures gracefully | Single-phase (rejected: orphaned metadata if upload fails) |
| Reserved bytes for quota | Prevents race conditions on concurrent uploads | Check-then-increment (rejected: race condition), pessimistic locking (rejected: deadlock risk) |

## Non-Goals (Deferred to Phase 2)

- Virus/malware scanning (ClamAV integration via Cloud Functions)
- Image resizing/optimization (handled by `image-gen-service`)
- CDN caching for public assets (all files private in Phase 1)
- File versioning (single version per file)
- Resumable uploads (use presigned POST, not multipart)
- File sharing between workspaces
- Public file URLs (all files require presigned URLs)
