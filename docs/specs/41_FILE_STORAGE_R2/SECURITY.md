# 41 — File Storage with Cloudflare R2 — SECURITY

**Status:** 📝 Draft
**Risk rating:** 🟡 MEDIUM
**Last updated:** 2026-05-18

## Assets
- User-uploaded files (potential malware, CSAM, copyright-infringing content)
- Presigned URLs (time-limited access tokens)
- R2 bucket credentials (AWS-compatible access keys)
- File metadata in PostgreSQL (workspace_id, filenames, paths)
- Storage quota state (reserved_bytes, used_bytes)

## Threat Model

| OWASP | Threat | Severity | Exploit Scenario | Mitigation |
|---|---|---|---|---|
| A01 Broken Access Control | **Cross-tenant file access via path enumeration** | HIGH | Attacker guesses another workspace's file path `{workspace_id}/{yyyy}/{mm}/{dd}/{file_id}/{filename}` and generates presigned URL | `workspace_id` is random UUID (not sequential). `file_id` is random UUID (122-bit entropy). Date structure adds 3 more variables. Total search space: 2^122 × 2^122 × 365 × 12 × 31 = computationally infeasible. Presigned URL generation requires authenticated API call with workspace ownership check. |
| A01 Broken Access Control | **Cross-tenant file access via metadata query** | HIGH | Attacker calls `GET /v1/storage/files/{file_id}` with another workspace's file_id | All file metadata queries include `WHERE workspace_id = ?` clause. `workspace_id` extracted from JWT via `get_workspace_id()` dependency (set by api-gateway). PostgreSQL RLS policy enforces workspace isolation as defense-in-depth. |
| A01 Broken Access Control | **Presigned URL sharing/leaking** | MEDIUM | User shares presigned download URL externally; URL remains valid for 30 minutes | Accepted risk. 30-minute expiry limits exposure window. User is sharing their own content (not a security bug). Alternative: shorter expiry (rejected: breaks UX for large files). |
| A03 Injection | **MIME type spoofing (upload malware as PDF)** | HIGH | Attacker uploads `malware.exe` with `Content-Type: application/pdf` header, bypassing whitelist | Two-layer validation: (1) Check declared `content_type` against whitelist on upload initiation. (2) Download first 512 bytes from R2 after upload, verify magic bytes match declared type. Mismatch → mark file as `failed`, do not mark as `ready`. |
| A03 Injection | **Path traversal in filename** | MEDIUM | Attacker uploads file with filename `../../etc/passwd` hoping to overwrite system files | Filename is sanitized before building R2 key: strip `../`, `/`, `\`, null bytes. R2 key is always `{workspace_id}/{yyyy}/{mm}/{dd}/{file_id}/{sanitized_filename}`. Even if sanitization fails, R2 treats keys as opaque strings (no filesystem traversal). |
| A04 Insecure Design | **Storage quota bypass via race condition** | HIGH | Two concurrent upload initiations both pass quota check, collectively exceeding limit | Use `reserved_bytes` column with atomic increment: `UPDATE workspace_credits SET storage_reserved_bytes = storage_reserved_bytes + ? WHERE workspace_id = ? RETURNING storage_reserved_bytes`. Check returned value against quota. Use `FOR UPDATE` row lock in transaction to prevent race. |
| A04 Insecure Design | **Orphaned file accumulation (quota leak)** | MEDIUM | User initiates upload, never completes. `reserved_bytes` never released, quota permanently reduced | Daily cleanup job marks `pending` files >24h old as `failed` and releases `reserved_bytes`. Lifecycle policy deletes R2 objects for failed uploads after 30 days. |
| A05 Security Misconfiguration | **Public R2 bucket exposure** | CRITICAL | R2 bucket accidentally configured with public read access | Terraform enforces private bucket (no public access policy). All access via presigned URLs only. Automated test verifies bucket is not publicly accessible (attempt anonymous GET, expect 403). |
| A05 Security Misconfiguration | **R2 credentials leaked in logs/errors** | HIGH | R2 access key logged in error message or stack trace | R2 credentials stored in GCP Secret Manager, loaded at runtime. Never log credential values. Sentry/error tracking configured to redact `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` patterns. |
| A06 Vulnerable Components | **boto3 CVE** | MEDIUM | Known vulnerability in boto3 S3 client | Pin boto3 to specific version in `requirements.txt`. Weekly Dependabot checks. Security advisory monitoring for boto3/botocore. |
| A07 Identification and Authentication Failures | **Unauthenticated file upload** | HIGH | Attacker calls upload initiation endpoint without JWT | All storage-service endpoints require `Authorization: Bearer {jwt}` header. JWT validated by api-gateway before routing to storage-service. Storage-service extracts `workspace_id` from validated JWT claims. |
| A08 Software and Data Integrity Failures | **Malware upload (virus, ransomware)** | HIGH | User uploads infected file, later downloads and executes it | **Phase 1:** File type whitelist + magic byte validation reduces attack surface (no .exe, .dll, .sh allowed). **Phase 2 (deferred):** ClamAV integration via Cloud Functions scans all uploads before marking `ready`. Infected files marked as `quarantined`, user notified. |
| A08 Software and Data Integrity Failures | **CSAM or illegal content upload** | CRITICAL | User uploads child sexual abuse material or other illegal content | **Phase 1:** No automated detection (out of scope). Manual reporting mechanism via support. **Phase 2 (deferred):** PhotoDNA/CSAI hash matching for images. Automated takedown + law enforcement reporting. |
| A09 Security Logging and Monitoring Failures | **No audit trail for file access** | MEDIUM | Attacker accesses files, no record of who/when | All presigned URL generation logged to structured logs: `{ "event": "presigned_url_generated", "workspace_id", "file_id", "user_id", "action": "upload|download", "expires_at" }`. CloudWatch alarm for >100 failed presigned URL requests in 5 minutes (potential enumeration attack). |
| A10 Server-Side Request Forgery (SSRF) | **SSRF via R2 endpoint manipulation** | LOW | Attacker manipulates R2 endpoint URL to target internal GCP metadata service | R2 endpoint URL hardcoded in config: `https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`. Not user-controllable. boto3 client configured with fixed endpoint, no dynamic URL construction. |

## Security Controls Summary

### 1. Workspace Isolation (Defense-in-Depth)

```python
# Layer 1: API-level check (storage-service)
async def get_file_metadata(file_id: UUID, workspace_id: UUID, db: AsyncSession):
    result = await db.execute(
        select(StorageFile)
        .where(StorageFile.id == file_id)
        .where(StorageFile.workspace_id == workspace_id)  # Enforced in application
    )
    return result.scalar_one_or_none()

# Layer 2: PostgreSQL RLS policy (defense-in-depth)
CREATE POLICY storage_files_workspace_isolation ON storage_files
  USING (workspace_id = current_setting('app.workspace_id')::uuid);

ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;

# Layer 3: R2 path prefix (physical isolation)
# All files stored under /{workspace_id}/ prefix
# Even if SQL injection bypasses layers 1-2, attacker cannot access other workspace's R2 objects
```

### 2. MIME Type Validation (Two-Layer)

```python
import magic
from typing import Optional

# Whitelist by purpose
ALLOWED_MIME_TYPES = {
    "ai_brain_doc": {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
        "text/csv",
    },
    "lead_import": {
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    "content_asset": {
        "image/png",
        "image/jpeg",
        "image/webp",
        "application/pdf",
    },
    "avatar": {
        "image/png",
        "image/jpeg",
        "image/webp",
    },
}

MAGIC_BYTE_SIGNATURES = {
    "application/pdf": b"%PDF",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/jpeg": b"\xff\xd8\xff",
    "image/webp": b"RIFF",
    "application/zip": b"PK\x03\x04",  # DOCX, XLSX are ZIP-based
    "text/plain": None,  # No magic bytes
    "text/csv": None,
    "text/markdown": None,
}

async def validate_file_type(
    file_id: UUID,
    declared_content_type: str,
    purpose: str,
    r2_client,
) -> bool:
    """
    Two-layer validation:
    1. Check declared content_type against whitelist (on upload initiation)
    2. Verify magic bytes match declared type (on upload completion)
    """
    # Layer 1: Whitelist check (already done on initiation)
    if declared_content_type not in ALLOWED_MIME_TYPES[purpose]:
        return False
    
    # Layer 2: Magic byte verification (on completion)
    expected_signature = MAGIC_BYTE_SIGNATURES.get(declared_content_type)
    if expected_signature is None:
        # No magic bytes to check (text files)
        return True
    
    # Download first 512 bytes from R2
    response = r2_client.get_object(
        Bucket=BUCKET_NAME,
        Key=build_r2_key(file_id),
        Range="bytes=0-511"
    )
    file_header = response["Body"].read()
    
    # Verify magic bytes
    if not file_header.startswith(expected_signature):
        logger.warning(
            "Magic byte mismatch",
            extra={
                "file_id": str(file_id),
                "declared_type": declared_content_type,
                "expected_signature": expected_signature.hex(),
                "actual_header": file_header[:16].hex(),
            }
        )
        return False
    
    return True
```

### 3. Filename Sanitization

```python
import re
from pathlib import Path

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and injection attacks.
    """
    # Remove path separators
    filename = filename.replace("/", "_").replace("\\", "_")
    
    # Remove parent directory references
    filename = filename.replace("..", "_")
    
    # Remove null bytes
    filename = filename.replace("\x00", "")
    
    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")
    
    # Limit length (R2 key max length is 1024 bytes)
    if len(filename) > 255:
        # Preserve extension
        stem = Path(filename).stem[:240]
        suffix = Path(filename).suffix[:15]
        filename = f"{stem}{suffix}"
    
    # Fallback if sanitization results in empty string
    if not filename:
        filename = "unnamed_file"
    
    return filename
```

### 4. Quota Enforcement (Race-Condition-Safe)

```python
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

async def reserve_storage_quota(
    workspace_id: UUID,
    file_size: int,
    db: AsyncSession,
) -> bool:
    """
    Atomically reserve storage quota. Returns True if successful, False if quota exceeded.
    """
    async with db.begin():
        # Lock workspace_credits row to prevent race condition
        result = await db.execute(
            select(WorkspaceCredits)
            .where(WorkspaceCredits.workspace_id == workspace_id)
            .with_for_update()  # Pessimistic lock
        )
        credits = result.scalar_one()
        
        # Check quota
        total_used = credits.storage_used_bytes + credits.storage_reserved_bytes
        if total_used + file_size > credits.plan_storage_limit:
            return False
        
        # Reserve bytes
        await db.execute(
            update(WorkspaceCredits)
            .where(WorkspaceCredits.workspace_id == workspace_id)
            .values(storage_reserved_bytes=WorkspaceCredits.storage_reserved_bytes + file_size)
        )
        
        return True
```

### 5. Presigned URL Generation (Time-Limited)

```python
import boto3
from datetime import datetime, timedelta

def generate_presigned_post(
    workspace_id: UUID,
    file_id: UUID,
    filename: str,
    content_type: str,
    file_size: int,
) -> dict:
    """
    Generate presigned POST URL for direct upload to R2.
    """
    r2_key = f"{workspace_id}/{datetime.utcnow().strftime('%Y/%m/%d')}/{file_id}/{sanitize_filename(filename)}"
    
    # Presigned POST with conditions
    conditions = [
        {"bucket": BUCKET_NAME},
        {"key": r2_key},
        {"Content-Type": content_type},
        ["content-length-range", 1, file_size],  # Enforce exact size
    ]
    
    presigned_post = r2_client.generate_presigned_post(
        Bucket=BUCKET_NAME,
        Key=r2_key,
        Fields={"Content-Type": content_type},
        Conditions=conditions,
        ExpiresIn=900,  # 15 minutes
    )
    
    return presigned_post

def generate_presigned_get(
    workspace_id: UUID,
    file_id: UUID,
    filename: str,
) -> str:
    """
    Generate presigned GET URL for download from R2.
    """
    r2_key = get_r2_key_from_db(file_id)  # Fetch from storage_files.r2_key
    
    presigned_url = r2_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": r2_key,
            "ResponseContentDisposition": f'attachment; filename="{filename}"',
        },
        ExpiresIn=1800,  # 30 minutes
    )
    
    return presigned_url
```

### 6. Audit Logging

```python
import structlog

logger = structlog.get_logger()

async def log_presigned_url_generation(
    event_type: str,  # "upload_initiated" | "download_requested"
    workspace_id: UUID,
    file_id: UUID,
    user_id: UUID,
    expires_at: datetime,
):
    """
    Log all presigned URL generation for audit trail.
    """
    logger.info(
        "presigned_url_generated",
        event_type=event_type,
        workspace_id=str(workspace_id),
        file_id=str(file_id),
        user_id=str(user_id),
        expires_at=expires_at.isoformat(),
    )
```

### 7. R2 Bucket Configuration (Terraform)

```hcl
resource "cloudflare_r2_bucket" "revlooper_files" {
  account_id = var.cloudflare_account_id
  name       = "revlooper-files-${var.environment}"
  location   = "APAC"
  
  # CRITICAL: No public access
  # R2 buckets are private by default, but explicitly document this
}

# Verify bucket is not publicly accessible (automated test)
resource "null_resource" "verify_bucket_private" {
  provisioner "local-exec" {
    command = <<-EOT
      # Attempt anonymous GET, expect 403
      curl -f https://revlooper-files-${var.environment}.r2.cloudflarestorage.com/test.txt && exit 1 || exit 0
    EOT
  }
  
  depends_on = [cloudflare_r2_bucket.revlooper_files]
}
```

## Residual Risks

| Risk | Level | Accepted | Mitigation Plan |
|---|---|---|---|
| User uploads malware, later downloads and executes it | MEDIUM | Phase 1: Yes | Phase 2: ClamAV integration for virus scanning |
| User uploads CSAM or illegal content | HIGH | Phase 1: Yes (manual reporting only) | Phase 2: PhotoDNA hash matching, automated takedown |
| Presigned URL shared externally remains valid for 30 minutes | LOW | Yes | User is sharing their own content; 30-min expiry limits exposure |
| Storage quota exhaustion attack (upload many small files) | LOW | Yes | File count quota enforced (50-50,000 files per plan); rate limiting in api-gateway |
| R2 outage blocks all file operations | MEDIUM | Yes | No mitigation in Phase 1; Phase 2: fallback to GCS or S3 |

## Security Testing Checklist

### Automated Tests (Unit + Integration)
- [ ] Cross-tenant access blocked (workspace A cannot access workspace B's files)
- [ ] Invalid MIME types rejected on upload initiation
- [ ] Magic byte mismatch marks file as `failed`, not `ready`
- [ ] Path traversal in filename sanitized (e.g., `../../etc/passwd` → `etc_passwd`)
- [ ] Quota enforcement prevents concurrent uploads from exceeding limit
- [ ] Expired presigned URLs rejected by R2 (test with expired signature)
- [ ] Unauthenticated requests rejected (no JWT → 401)
- [ ] Soft-deleted files not accessible via download endpoint (410 Gone)

### Manual Security Review
- [ ] R2 bucket verified as private (no public access policy)
- [ ] R2 credentials not logged in error messages or stack traces
- [ ] Presigned URL generation logged for audit trail
- [ ] CloudWatch alarm configured for >100 failed presigned URL requests in 5 minutes
- [ ] PostgreSQL RLS policy enabled on `storage_files` table
- [ ] Sentry configured to redact `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` patterns

### Penetration Testing (Phase 2)
- [ ] Attempt to enumerate file_ids via brute force (expect: computationally infeasible)
- [ ] Attempt to upload malware disguised as PDF (expect: magic byte validation catches it)
- [ ] Attempt SQL injection in filename parameter (expect: parameterized queries prevent it)
- [ ] Attempt to bypass quota by initiating many concurrent uploads (expect: atomic reservation prevents it)
- [ ] Attempt to access another workspace's file via presigned URL (expect: 403 Forbidden)

## Compliance Considerations

### GDPR (EU)
- User-uploaded files may contain personal data
- Right to erasure: soft-delete + 7-day purge satisfies requirement
- Data portability: download endpoint provides user access to their files

### PDPA (Thailand, Singapore)
- Consent required before processing personal data
- File upload flow should include consent checkbox for `ai_brain_doc` purpose (AI processing)
- Consent logged in `consent_log` table (existing RevLooper pattern)

### Data Residency (Vietnam)
- Cloudflare R2 APAC region stores data in Asia-Pacific (not Vietnam-specific)
- For strict Vietnam data residency: Phase 2 option to use GCS asia-southeast1 (Singapore) or asia-southeast2 (Jakarta)

## Incident Response Plan

### Scenario 1: R2 Credentials Leaked
1. Immediately rotate R2 access keys in Cloudflare dashboard
2. Update GCP Secret Manager with new credentials
3. Restart storage-service to load new credentials
4. Audit CloudWatch logs for unauthorized access (filter by old credentials)
5. Notify security team and affected workspaces if data accessed

### Scenario 2: Malware Uploaded and Downloaded
1. Identify infected file via user report or automated scan (Phase 2)
2. Mark file as `quarantined` in database (new status)
3. Delete file from R2 bucket
4. Notify workspace admin via email
5. Audit logs to identify other potentially infected files from same user

### Scenario 3: Storage Quota Exhaustion Attack
1. Identify workspace with abnormal upload rate (>100 files/hour)
2. Temporarily block uploads for that workspace (feature flag)
3. Review uploaded files for abuse (spam, illegal content)
4. Contact workspace admin to investigate
5. Adjust rate limits in api-gateway if needed

## Security Review Sign-Off

- [ ] Security Auditor reviewed threat model (8/10+ confidence required)
- [ ] CTO approved residual risks (malware, CSAM deferred to Phase 2)
- [ ] DevOps verified R2 bucket is private (automated test passing)
- [ ] Backend Developer implemented all security controls (magic byte validation, quota enforcement, audit logging)
- [ ] QA Engineer verified security test coverage (cross-tenant access, MIME validation, quota bypass)
