# 41 — File Storage with Cloudflare R2 — IMPLEMENTATION

**Status:** 📝 Draft
**Last updated:** 2026-05-18

## Service Map

### New Service: `storage-service`

**Location:** `services/storage-service/`

**Responsibilities:**
- Generate presigned POST URLs for direct R2 uploads
- Generate presigned GET URLs for R2 downloads
- Manage file metadata in PostgreSQL
- Enforce storage quotas with race-condition-safe reservation
- Validate file types (MIME + magic bytes)
- Soft-delete and purge files

**Dependencies:**
- `billing-service` — quota limits by plan
- Cloudflare R2 — object storage
- PostgreSQL — file metadata
- GCP Secret Manager — R2 credentials

**Deployment:**
- Cloud Run (HTTP service)
- Region: `asia-southeast1` (Singapore)
- Min instances: 1 (always warm for low latency)
- Max instances: 10
- Memory: 512MB
- CPU: 1

### Service Structure

```
services/storage-service/
├── app/
│   ├── main.py                    # FastAPI app, startup/shutdown
│   ├── config.py                  # R2 credentials, bucket config
│   ├── dependencies.py            # get_workspace_id, get_db, get_r2_client
│   ├── api/
│   │   └── v1/
│   │       ├── upload.py          # POST /upload/initiate, /upload/complete
│   │       ├── download.py        # GET /files/{id}/download
│   │       └── files.py           # GET /files, GET /files/{id}, DELETE /files/{id}
│   ├── models/
│   │   └── storage.py             # SQLAlchemy models: StorageFile
│   ├── schemas/
│   │   ├── upload.py              # UploadInitiateRequest, UploadInitiateResponse
│   │   ├── download.py            # DownloadResponse
│   │   └── file.py                # FileMetadata, FileListResponse
│   ├── services/
│   │   ├── upload_service.py      # initiate_upload, complete_upload
│   │   ├── download_service.py    # generate_download_url
│   │   ├── file_service.py        # list_files, get_file, delete_file
│   │   ├── quota_service.py       # reserve_quota, release_quota, check_quota
│   │   ├── r2_service.py          # generate_presigned_post, generate_presigned_get, verify_file_exists
│   │   └── validation_service.py  # validate_mime_type, validate_magic_bytes, sanitize_filename
│   ├── jobs/
│   │   ├── cleanup_orphaned.py    # Mark pending >24h as failed
│   │   └── purge_deleted.py       # Delete soft-deleted >7 days
│   └── utils/
│       ├── errors.py              # AppError definitions
│       └── logging.py             # Structured logging setup
├── alembic/
│   ├── env.py
│   ├── versions/
│   │   └── 001_create_storage_tables.py
│   └── alembic.ini
├── tests/
│   ├── unit/
│   │   ├── test_upload_service.py
│   │   ├── test_download_service.py
│   │   ├── test_quota_service.py
│   │   ├── test_validation_service.py
│   │   └── test_r2_service.py
│   ├── integration/
│   │   ├── test_upload_flow.py
│   │   ├── test_download_flow.py
│   │   ├── test_quota_enforcement.py
│   │   └── test_cleanup_jobs.py
│   └── fixtures/
│       ├── files.py               # Sample file bytes (PDF, PNG, CSV)
│       └── workspaces.py          # Test workspace setup
├── Dockerfile
├── cloudbuild.yaml
├── requirements.txt
├── pytest.ini
└── README.md
```

## Rollout Plan

### Phase 1: Infrastructure Setup (Week 1)

**Goal:** Provision R2 bucket, set up storage-service scaffold

**Tasks:**
1. Create Cloudflare R2 bucket via Terraform
2. Generate R2 API credentials (access key + secret)
3. Store credentials in GCP Secret Manager
4. Scaffold storage-service (FastAPI app, Dockerfile, Cloud Run config)
5. Add Alembic migration for `storage_files` table
6. Deploy storage-service to staging (no routes yet)

**Verification:**
- R2 bucket exists and is private (no public access)
- storage-service deploys successfully to Cloud Run
- Alembic migration creates `storage_files` table

### Phase 2: Upload Flow (Week 2)

**Goal:** Implement presigned POST upload flow with quota enforcement

**Tasks:**
1. Implement `upload_service.initiate_upload()` with quota reservation
2. Implement `r2_service.generate_presigned_post()`
3. Implement `POST /v1/storage/upload/initiate` endpoint
4. Implement `upload_service.complete_upload()` with magic byte validation
5. Implement `POST /v1/storage/upload/complete` endpoint
6. Write unit tests for upload service (RED → GREEN → REFACTOR)
7. Write integration tests for upload flow

**Verification:**
- Unit tests pass (95%+ coverage)
- Integration test: initiate → upload to R2 → complete → file marked as ready
- Quota enforcement prevents concurrent uploads from exceeding limit

### Phase 3: Download Flow (Week 2)

**Goal:** Implement presigned GET download flow with workspace isolation

**Tasks:**
1. Implement `download_service.generate_download_url()`
2. Implement `r2_service.generate_presigned_get()`
3. Implement `GET /v1/storage/files/{id}/download` endpoint
4. Write unit tests for download service
5. Write integration tests for download flow

**Verification:**
- Unit tests pass
- Integration test: generate download URL → download from R2 → verify content
- Cross-tenant access blocked (workspace A cannot download workspace B's files)

### Phase 4: File Management (Week 3)

**Goal:** Implement file listing, metadata retrieval, soft-delete

**Tasks:**
1. Implement `file_service.list_files()` with pagination
2. Implement `file_service.get_file()`
3. Implement `file_service.delete_file()` (soft-delete)
4. Implement `GET /v1/storage/files` endpoint
5. Implement `GET /v1/storage/files/{id}` endpoint
6. Implement `DELETE /v1/storage/files/{id}` endpoint
7. Write unit + integration tests

**Verification:**
- List files returns paginated results filtered by workspace
- Soft-deleted files hidden from listings
- Soft-deleted files return 410 Gone on download

### Phase 5: Cleanup Jobs (Week 3)

**Goal:** Implement orphaned file cleanup and soft-delete purge

**Tasks:**
1. Implement `cleanup_orphaned.py` job (mark pending >24h as failed)
2. Implement `purge_deleted.py` job (delete soft-deleted >7 days)
3. Configure Cloud Scheduler to run jobs daily
4. Write integration tests for cleanup jobs

**Verification:**
- Orphaned files marked as failed after 24h
- Soft-deleted files purged after 7 days
- Reserved bytes released on cleanup

### Phase 6: Frontend Integration (Week 4)

**Goal:** Integrate storage-service into AI Brain document upload

**Tasks:**
1. Create `useFileUpload` hook in portal
2. Update `UploadDocModal.tsx` to use presigned POST upload
3. Add file upload progress indicator
4. Add file list component with download buttons
5. Write E2E tests for upload flow

**Verification:**
- E2E test: upload document → verify in AI Brain → download document
- Upload progress indicator shows during upload
- File list displays uploaded documents

### Phase 7: Production Deployment (Week 4)

**Goal:** Deploy to production with monitoring

**Tasks:**
1. Deploy storage-service to production
2. Configure CloudWatch alarms (failed uploads, quota exceeded, presigned URL errors)
3. Update api-gateway routing to include storage-service
4. Run smoke tests in production
5. Monitor for 48 hours

**Verification:**
- Production deployment successful
- CloudWatch alarms configured and firing correctly
- No errors in production logs
- Upload/download latency meets targets (<200ms initiation, <3s upload)

## Feature Flags

| Flag | Purpose | Default | Rollout |
|---|---|---|---|
| `storage_service_enabled` | Enable storage-service routes in api-gateway | `false` | Enable for internal workspaces first, then gradual rollout |
| `storage_magic_byte_validation` | Enable magic byte validation on upload completion | `true` | Always on (security-critical) |
| `storage_cleanup_jobs_enabled` | Enable orphaned file cleanup and purge jobs | `false` | Enable after Phase 5 testing |

## Monitoring & Alerts

### CloudWatch Metrics

| Metric | Threshold | Alert |
|---|---|---|
| `storage.upload.initiate.latency.p95` | >200ms | Warning |
| `storage.upload.initiate.errors` | >5% | Critical |
| `storage.upload.complete.errors` | >5% | Critical |
| `storage.download.generate_url.latency.p95` | >100ms | Warning |
| `storage.quota_exceeded.count` | >100/hour | Warning (potential abuse) |
| `storage.presigned_url.failed_requests` | >100/5min | Critical (potential enumeration attack) |
| `storage.magic_byte_mismatch.count` | >10/hour | Warning (potential malware uploads) |

### Structured Logs

All storage-service logs include:
- `workspace_id`
- `file_id`
- `user_id`
- `action` (upload_initiated, upload_completed, download_requested, file_deleted)
- `trace_id` (for request tracing)

### Dashboards

**Storage Service Dashboard** (Grafana):
- Upload success rate (target: >95%)
- Download success rate (target: >98%)
- Upload initiation latency (p50, p95, p99)
- Download URL generation latency (p50, p95, p99)
- Storage quota usage by workspace (top 10)
- File count by purpose (ai_brain_doc, lead_import, content_asset, avatar)
- Orphaned file count (pending >24h)
- Soft-deleted file count (awaiting purge)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| R2 outage blocks all uploads | HIGH | Implement retry logic with exponential backoff; show user-friendly error; monitor R2 status page |
| Presigned URL enumeration attack | MEDIUM | Use random UUIDs (122-bit entropy); CloudWatch alarm for >100 failed requests in 5 minutes |
| Storage quota abuse (upload many small files) | MEDIUM | File count quota enforced (50-50,000 per plan); rate limiting in api-gateway |
| Orphaned files accumulate (quota leak) | LOW | Daily cleanup job marks pending >24h as failed; lifecycle policy deletes after 30 days |
| Magic byte validation false positives | LOW | Whitelist text files (no magic bytes); log mismatches for review |
| R2 credentials leaked | HIGH | Store in GCP Secret Manager; rotate on leak; audit CloudWatch logs for unauthorized access |

## Deployment Configuration

### Terraform (R2 Bucket)

**File:** `infra/terraform/r2.tf`

```hcl
resource "cloudflare_r2_bucket" "revlooper_files" {
  account_id = var.cloudflare_account_id
  name       = "revlooper-files-${var.environment}"
  location   = "APAC"
}

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

resource "cloudflare_r2_bucket_cors" "revlooper_files_cors" {
  bucket_id = cloudflare_r2_bucket.revlooper_files.id
  
  cors_rule {
    allowed_origins = [
      "https://app.revlooper.com",
      "https://app-staging.revlooper.com",
      "http://localhost:3000"
    ]
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}
```

### Cloud Run (storage-service)

**File:** `services/storage-service/cloudbuild.yaml`

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/storage-service:$SHORT_SHA', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/storage-service:$SHORT_SHA']
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'storage-service'
      - '--image=gcr.io/$PROJECT_ID/storage-service:$SHORT_SHA'
      - '--region=asia-southeast1'
      - '--platform=managed'
      - '--ingress=internal'
      - '--min-instances=1'
      - '--max-instances=10'
      - '--memory=512Mi'
      - '--cpu=1'
      - '--set-env-vars=ENVIRONMENT=$_ENVIRONMENT'
      - '--set-secrets=R2_ACCESS_KEY_ID=r2-access-key-id:latest,R2_SECRET_ACCESS_KEY=r2-secret-access-key:latest'
```

### Cloud Scheduler (Cleanup Jobs)

**File:** `infra/terraform/scheduler.tf`

```hcl
resource "google_cloud_scheduler_job" "cleanup_orphaned_files" {
  name        = "storage-cleanup-orphaned-${var.environment}"
  description = "Mark pending files >24h old as failed"
  schedule    = "0 2 * * *"  # Daily at 02:00 UTC
  time_zone   = "UTC"
  
  http_target {
    uri         = "https://storage-service-${var.environment}.run.app/internal/jobs/cleanup-orphaned"
    http_method = "POST"
    
    oidc_token {
      service_account_email = google_service_account.scheduler.email
    }
  }
}

resource "google_cloud_scheduler_job" "purge_deleted_files" {
  name        = "storage-purge-deleted-${var.environment}"
  description = "Permanently delete soft-deleted files >7 days old"
  schedule    = "0 3 * * *"  # Daily at 03:00 UTC
  time_zone   = "UTC"
  
  http_target {
    uri         = "https://storage-service-${var.environment}.run.app/internal/jobs/purge-deleted"
    http_method = "POST"
    
    oidc_token {
      service_account_email = google_service_account.scheduler.email
    }
  }
}
```

## Dependencies

### Python Packages

**File:** `services/storage-service/requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
pydantic-settings==2.5.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.3
boto3==1.35.0          # S3-compatible client for R2
python-magic==0.4.27   # Magic byte validation
structlog==24.4.0
python-jose[cryptography]==3.3.0
httpx==0.27.2
pytest==8.3.0
pytest-asyncio==0.24.0
pytest-cov==5.0.0
```

## API Gateway Integration

**File:** `services/api-gateway/app/routes.py`

```python
# Add storage-service routes
STORAGE_SERVICE_URL = os.getenv("STORAGE_SERVICE_URL", "http://storage-service:8000")

@app.post("/v1/storage/upload/initiate")
async def proxy_upload_initiate(request: Request):
    return await proxy_to_service(request, f"{STORAGE_SERVICE_URL}/v1/storage/upload/initiate")

@app.post("/v1/storage/upload/complete")
async def proxy_upload_complete(request: Request):
    return await proxy_to_service(request, f"{STORAGE_SERVICE_URL}/v1/storage/upload/complete")

@app.get("/v1/storage/files/{file_id}/download")
async def proxy_download(request: Request, file_id: str):
    return await proxy_to_service(request, f"{STORAGE_SERVICE_URL}/v1/storage/files/{file_id}/download")

@app.get("/v1/storage/files")
async def proxy_list_files(request: Request):
    return await proxy_to_service(request, f"{STORAGE_SERVICE_URL}/v1/storage/files")

@app.get("/v1/storage/files/{file_id}")
async def proxy_get_file(request: Request, file_id: str):
    return await proxy_to_service(request, f"{STORAGE_SERVICE_URL}/v1/storage/files/{file_id}")

@app.delete("/v1/storage/files/{file_id}")
async def proxy_delete_file(request: Request, file_id: str):
    return await proxy_to_service(request, f"{STORAGE_SERVICE_URL}/v1/storage/files/{file_id}")
```

## Success Criteria

### Launch Criteria (Week 4)
- [ ] All unit tests pass (95%+ coverage)
- [ ] All integration tests pass
- [ ] E2E tests pass (upload, download, quota enforcement)
- [ ] Security tests pass (cross-tenant, MIME validation, path traversal)
- [ ] Performance tests meet targets (<200ms upload initiation, <3s upload)
- [ ] CloudWatch alarms configured and tested
- [ ] Production deployment successful
- [ ] Smoke tests pass in production

### Post-Launch Metrics (Week 5-8)
- [ ] Upload success rate >95%
- [ ] Download success rate >98%
- [ ] Upload initiation API p95 latency <200ms
- [ ] Zero cross-tenant access incidents
- [ ] 50% of workspaces upload at least 1 file
- [ ] <1% of uploads fail due to quota limits
- [ ] Storage cost <$0.01 per GB per month

## Runbook

**Location:** `docs/runbooks/storage-service.md`

### Common Issues

**Issue:** Upload initiation returns 403 Quota Exceeded
- **Cause:** Workspace has exceeded storage quota
- **Resolution:** Check workspace quota in billing-service; upgrade plan or delete old files

**Issue:** Upload completion returns 409 Upload Not Completed
- **Cause:** File not found in R2 bucket (upload failed or never happened)
- **Resolution:** Check R2 bucket for file; verify presigned POST URL was used correctly; check CORS policy

**Issue:** Download URL returns 404 File Not Found
- **Cause:** File belongs to different workspace or has been deleted
- **Resolution:** Verify workspace_id matches; check file status in database

**Issue:** Magic byte validation fails (file marked as failed)
- **Cause:** Declared MIME type doesn't match actual file content
- **Resolution:** Check file magic bytes; verify client is sending correct Content-Type header

### Incident Response

**Scenario:** R2 outage (all uploads failing)
1. Check Cloudflare R2 status page
2. Enable maintenance mode banner in portal ("File uploads temporarily unavailable")
3. Monitor R2 status for resolution
4. Re-enable uploads once R2 is healthy
5. Run orphaned file cleanup job to mark failed uploads

**Scenario:** Storage quota exhaustion attack
1. Identify workspace with abnormal upload rate (>100 files/hour)
2. Temporarily block uploads for that workspace (feature flag)
3. Review uploaded files for abuse
4. Contact workspace admin
5. Adjust rate limits in api-gateway if needed

**Scenario:** Presigned URL enumeration attack detected
1. CloudWatch alarm fires (>100 failed presigned URL requests in 5 minutes)
2. Identify source IP from CloudWatch logs
3. Block IP in Cloud Armor (WAF)
4. Review access logs for successful unauthorized access
5. Rotate R2 credentials if breach suspected
