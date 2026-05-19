# 41 — File Storage with Cloudflare R2 — TASKS

**Status:** 📝 Draft
**Last updated:** 2026-05-18

## TDD Task Breakdown

This implementation follows strict RED → GREEN → REFACTOR discipline. Every task begins with writing a failing test (RED), then implementing the minimum code to pass (GREEN), then refactoring for clarity.

**CRITICAL:** Each test must be verified to fail for the right reason before implementation begins (Verify-RED step).

---

## Task 1: Scaffold storage-service with Alembic

**Goal:** Create service structure, add Alembic migration for `storage_files` table

**Test (RED):**
```python
# tests/integration/test_migrations.py
def test_migration_creates_storage_files_table():
    """Alembic upgrade should create storage_files table with correct schema."""
    # Run: alembic upgrade head
    # Query: SELECT * FROM storage_files LIMIT 0
    # Assert: table exists with columns: id, workspace_id, filename, content_type, etc.
```

**Implementation (GREEN):**
- Create `services/storage-service/` directory structure
- Add `alembic/versions/001_create_storage_tables.py` migration
- Define `StorageFile` SQLAlchemy model in `app/models/storage.py`
- Add `workspace_credits` columns: `storage_used_bytes`, `storage_reserved_bytes`, `storage_file_count`

**Refactor:**
- Verify migration up/down roundtrip works
- Add indexes: `idx_storage_files_workspace_purpose`, `idx_storage_files_pending_cleanup`

**Done when:**
- Migration creates table with all columns and indexes
- Migration downgrade drops table cleanly
- Test passes

---

## Task 2: R2 client configuration and presigned POST generation

**Goal:** Configure boto3 S3-compatible client for R2, generate presigned POST URLs

**Test (RED):**
```python
# tests/unit/test_r2_service.py
def test_generate_presigned_post():
    """Should generate presigned POST URL with correct fields and expiry."""
    result = r2_service.generate_presigned_post(
        workspace_id=UUID("a1b2..."),
        file_id=UUID("f9e8..."),
        filename="test.pdf",
        content_type="application/pdf",
        file_size=1024,
    )
    
    assert result["url"].startswith("https://")
    assert "key" in result["fields"]
    assert "policy" in result["fields"]
    assert result["fields"]["key"].startswith("a1b2.../2026/05/18/f9e8.../test.pdf")
```

**Implementation (GREEN):**
- Create `app/services/r2_service.py`
- Load R2 credentials from GCP Secret Manager in `app/config.py`
- Initialize boto3 client with R2 endpoint
- Implement `generate_presigned_post()` with 15-minute expiry

**Refactor:**
- Extract R2 key building logic to helper function
- Add type hints and docstrings

**Done when:**
- Test passes
- Presigned POST URL includes all required fields (key, policy, signature)
- R2 key follows format: `{workspace_id}/{yyyy}/{mm}/{dd}/{file_id}/{filename}`

---

## Task 3: Filename sanitization

**Goal:** Sanitize filenames to prevent path traversal and injection attacks

**Test (RED):**
```python
# tests/unit/test_validation_service.py
def test_sanitize_filename_path_traversal():
    """Should strip path traversal sequences."""
    assert sanitize_filename("../../etc/passwd") == "etc_passwd"
    assert sanitize_filename("..\\..\\windows\\system32") == "windows_system32"

def test_sanitize_filename_null_bytes():
    """Should remove null bytes."""
    assert sanitize_filename("file\x00.pdf") == "file.pdf"

def test_sanitize_filename_long_name():
    """Should truncate to 255 chars while preserving extension."""
    long_name = "a" * 300 + ".pdf"
    result = sanitize_filename(long_name)
    assert len(result) <= 255
    assert result.endswith(".pdf")
```

**Implementation (GREEN):**
- Create `app/services/validation_service.py`
- Implement `sanitize_filename()` with path separator removal, null byte stripping, length limiting

**Refactor:**
- Add edge case handling (empty string → "unnamed_file")

**Done when:**
- All sanitization tests pass
- Path traversal attempts neutralized

---

## Task 4: MIME type validation (whitelist)

**Goal:** Validate content_type against purpose-specific whitelist

**Test (RED):**
```python
# tests/unit/test_validation_service.py
def test_validate_mime_type_allowed():
    """Should allow whitelisted MIME types for purpose."""
    assert validate_mime_type("application/pdf", "ai_brain_doc") is True
    assert validate_mime_type("image/png", "content_asset") is True

def test_validate_mime_type_rejected():
    """Should reject non-whitelisted MIME types."""
    assert validate_mime_type("application/x-msdownload", "ai_brain_doc") is False
    assert validate_mime_type("video/mp4", "content_asset") is False
```

**Implementation (GREEN):**
- Define `ALLOWED_MIME_TYPES` dict in `validation_service.py`
- Implement `validate_mime_type(content_type, purpose)`

**Done when:**
- Whitelist validation tests pass
- All four purposes have correct MIME type lists

---

## Task 5: Quota reservation (race-condition-safe)

**Goal:** Atomically reserve storage quota to prevent concurrent upload bypass

**Test (RED):**
```python
# tests/unit/test_quota_service.py
@pytest.mark.asyncio
async def test_reserve_quota_success():
    """Should atomically increment reserved_bytes."""
    workspace_id = UUID("a1b2...")
    
    result = await quota_service.reserve_quota(
        workspace_id=workspace_id,
        file_size=5000,
        db=db,
    )
    
    assert result is True
    credits = await db.get_workspace_credits(workspace_id)
    assert credits.storage_reserved_bytes == 5000

@pytest.mark.asyncio
async def test_reserve_quota_exceeded():
    """Should reject when quota exceeded."""
    # Setup: workspace with 1GB limit, 950MB used, 60MB reserved
    result = await quota_service.reserve_quota(
        workspace_id=workspace_id,
        file_size=100 * 1024 * 1024,  # 100MB
        db=db,
    )
    
    assert result is False
```

**Implementation (GREEN):**
- Create `app/services/quota_service.py`
- Implement `reserve_quota()` with `FOR UPDATE` row lock
- Check `used_bytes + reserved_bytes + file_size <= plan_storage_limit`

**Refactor:**
- Extract quota calculation to helper function

**Done when:**
- Quota reservation tests pass
- Race condition prevented by row lock

---

## Task 6: Upload initiation endpoint

**Goal:** POST /v1/storage/upload/initiate generates presigned POST URL

**Test (RED):**
```python
# tests/integration/test_upload_flow.py
@pytest.mark.asyncio
async def test_upload_initiate_success(test_client):
    """Should generate presigned POST URL and create pending metadata row."""
    response = await test_client.post(
        "/v1/storage/upload/initiate",
        json={
            "filename": "test.pdf",
            "content_type": "application/pdf",
            "file_size": 1024,
            "purpose": "ai_brain_doc",
        },
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "file_id" in data
    assert "upload_url" in data
    assert "upload_fields" in data
```

**Implementation (GREEN):**
- Create `app/api/v1/upload.py`
- Implement `POST /upload/initiate` route
- Create `app/services/upload_service.py` with `initiate_upload()`
- Validate MIME type, reserve quota, generate presigned POST, insert metadata row

**Refactor:**
- Extract Pydantic schemas to `app/schemas/upload.py`

**Done when:**
- Upload initiation test passes
- Metadata row created with status='pending'
- Reserved bytes incremented

---

## Task 7: Magic byte validation

**Goal:** Verify file magic bytes match declared MIME type

**Test (RED):**
```python
# tests/unit/test_validation_service.py
def test_validate_magic_bytes_pdf():
    """Should validate PDF magic bytes."""
    pdf_header = b"%PDF-1.4\n..."
    assert validate_magic_bytes("application/pdf", pdf_header) is True

def test_validate_magic_bytes_mismatch():
    """Should reject mismatched magic bytes."""
    png_header = b"\x89PNG\r\n\x1a\n..."
    assert validate_magic_bytes("application/pdf", png_header) is False
```

**Implementation (GREEN):**
- Add `MAGIC_BYTE_SIGNATURES` dict to `validation_service.py`
- Implement `validate_magic_bytes(content_type, file_bytes)`

**Done when:**
- Magic byte validation tests pass
- PDF, PNG, JPEG signatures verified

---

## Task 8: Upload completion endpoint

**Goal:** POST /v1/storage/upload/complete verifies file in R2, validates magic bytes, updates status

**Test (RED):**
```python
# tests/integration/test_upload_flow.py
@pytest.mark.asyncio
async def test_upload_complete_success(test_client, r2_client):
    """Should verify file in R2, validate magic bytes, update status to ready."""
    file_id = await setup_pending_upload()
    await upload_file_to_r2(file_id, content=b"%PDF-1.4\nTest")
    
    response = await test_client.post(
        "/v1/storage/upload/complete",
        json={"file_id": str(file_id)},
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
```

**Implementation (GREEN):**
- Implement `POST /upload/complete` route
- Implement `upload_service.complete_upload()`
- HEAD request to R2 to verify file exists
- Download first 512 bytes, validate magic bytes
- Update status to 'ready', move bytes from reserved to used

**Refactor:**
- Extract R2 verification to `r2_service.verify_file_exists()`

**Done when:**
- Upload completion test passes
- Magic byte mismatch marks file as 'failed'
- Reserved bytes released, used bytes incremented

---

## Task 9: Download URL generation endpoint

**Goal:** GET /v1/storage/files/{id}/download generates presigned GET URL

**Test (RED):**
```python
# tests/integration/test_download_flow.py
@pytest.mark.asyncio
async def test_generate_download_url_success(test_client):
    """Should generate presigned GET URL with 30-minute expiry."""
    file_id = await setup_ready_file()
    
    response = await test_client.get(
        f"/v1/storage/files/{file_id}/download",
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert "X-Amz-Signature" in data["download_url"]
```

**Implementation (GREEN):**
- Create `app/api/v1/download.py`
- Implement `GET /files/{id}/download` route
- Create `app/services/download_service.py` with `generate_download_url()`
- Verify file exists and belongs to workspace
- Generate presigned GET URL with 30-minute expiry

**Done when:**
- Download URL generation test passes
- Cross-tenant access blocked (404 for different workspace)

---

## Task 10: File listing endpoint

**Goal:** GET /v1/storage/files returns paginated file list

**Test (RED):**
```python
# tests/integration/test_file_management.py
@pytest.mark.asyncio
async def test_list_files_paginated(test_client):
    """Should return paginated file list filtered by workspace."""
    await create_test_files(count=75, workspace_id=workspace_id)
    
    response = await test_client.get(
        "/v1/storage/files?page=1&limit=50",
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["files"]) == 50
    assert data["pagination"]["total"] == 75
```

**Implementation (GREEN):**
- Create `app/api/v1/files.py`
- Implement `GET /files` route with pagination
- Create `app/services/file_service.py` with `list_files()`
- Filter by workspace_id, purpose, status
- Return paginated results

**Done when:**
- File listing test passes
- Pagination works correctly
- Filters work (purpose, status)

---

## Task 11: File soft-delete endpoint

**Goal:** DELETE /v1/storage/files/{id} soft-deletes file

**Test (RED):**
```python
# tests/integration/test_file_management.py
@pytest.mark.asyncio
async def test_delete_file_soft_delete(test_client):
    """Should soft-delete file (set deleted_at, hide from listings)."""
    file_id = await setup_ready_file()
    
    response = await test_client.delete(
        f"/v1/storage/files/{file_id}",
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    
    assert response.status_code == 204
    
    # Verify hidden from listings
    list_response = await test_client.get("/v1/storage/files", ...)
    assert file_id not in [f["file_id"] for f in list_response.json()["files"]]
```

**Implementation (GREEN):**
- Implement `DELETE /files/{id}` route
- Implement `file_service.delete_file()` (soft-delete)
- Set `deleted_at = NOW()`, keep status as 'ready'
- Update list query to filter `WHERE deleted_at IS NULL`

**Done when:**
- Soft-delete test passes
- Deleted files hidden from listings
- Download returns 410 Gone for deleted files

---

## Task 12: Orphaned file cleanup job

**Goal:** Daily job marks pending files >24h old as failed

**Test (RED):**
```python
# tests/integration/test_cleanup_jobs.py
@pytest.mark.asyncio
async def test_cleanup_orphaned_files():
    """Should mark pending files >24h old as failed and release reserved bytes."""
    file_id = await create_pending_file(created_at=datetime.utcnow() - timedelta(hours=25))
    
    await cleanup_service.cleanup_orphaned_files()
    
    file = await db.get_file(file_id)
    assert file.status == "failed"
    
    credits = await db.get_workspace_credits(file.workspace_id)
    assert credits.storage_reserved_bytes == 0
```

**Implementation (GREEN):**
- Create `app/jobs/cleanup_orphaned.py`
- Implement `cleanup_orphaned_files()` job
- Query pending files with `created_at < NOW() - INTERVAL '24 hours'`
- Update status to 'failed', release reserved bytes

**Done when:**
- Cleanup job test passes
- Reserved bytes released correctly

---

## Task 13: Soft-deleted file purge job

**Goal:** Daily job permanently deletes soft-deleted files >7 days old

**Test (RED):**
```python
# tests/integration/test_cleanup_jobs.py
@pytest.mark.asyncio
async def test_purge_soft_deleted_files():
    """Should permanently delete soft-deleted files >7 days old from DB and R2."""
    file_id = await create_deleted_file(deleted_at=datetime.utcnow() - timedelta(days=8))
    r2_key = await db.get_file_r2_key(file_id)
    
    await cleanup_service.purge_soft_deleted_files()
    
    # Verify deleted from DB
    file = await db.get_file(file_id)
    assert file is None
    
    # Verify deleted from R2
    with pytest.raises(r2_client.exceptions.NoSuchKey):
        r2_client.head_object(Bucket=BUCKET_NAME, Key=r2_key)
```

**Implementation (GREEN):**
- Create `app/jobs/purge_deleted.py`
- Implement `purge_soft_deleted_files()` job
- Query deleted files with `deleted_at < NOW() - INTERVAL '7 days'`
- Delete from R2, delete from DB, decrement used bytes

**Done when:**
- Purge job test passes
- Files deleted from both R2 and PostgreSQL

---

## Task 14: E2E upload flow test

**Goal:** End-to-end test: initiate → upload to R2 → complete → download

**Test (RED):**
```python
# e2e/tests/file-upload.spec.ts
test('should upload and download file end-to-end', async ({ page }) => {
  await page.goto('/brain');
  await page.click('[data-testid="upload-doc-button"]');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('fixtures/test.pdf');
  
  await page.click('[data-testid="upload-submit"]');
  await page.waitForSelector('[data-testid="upload-success"]');
  
  // Download file
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="file-download-button"]');
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toBe('test.pdf');
});
```

**Implementation (GREEN):**
- Create `useFileUpload` hook in portal
- Update `UploadDocModal.tsx` to use presigned POST
- Add file list component with download buttons

**Done when:**
- E2E test passes
- Upload and download work in browser

---

## Task 15: Cross-tenant isolation test

**Goal:** Verify workspace A cannot access workspace B's files

**Test (RED):**
```python
# tests/integration/test_security.py
@pytest.mark.asyncio
async def test_cross_tenant_isolation(test_client):
    """Should block cross-tenant file access."""
    workspace_a = UUID("workspace-a")
    workspace_b = UUID("workspace-b")
    
    file_id = await upload_test_file(test_client, workspace_a)
    
    # Workspace B attempts to download
    response = await test_client.get(
        f"/v1/storage/files/{file_id}/download",
        headers={"X-Workspace-ID": str(workspace_b)},
    )
    
    assert response.status_code == 404
```

**Implementation (GREEN):**
- Already implemented in Task 9 (workspace_id check in download service)
- Add explicit security test

**Done when:**
- Cross-tenant isolation test passes
- All file operations enforce workspace_id check

---

## Definition of Done (All Tasks)

- [ ] All 15 tasks completed with RED → GREEN → REFACTOR
- [ ] Unit test coverage ≥95% for core services
- [ ] Integration tests pass (upload, download, quota, cleanup)
- [ ] E2E tests pass (browser upload/download)
- [ ] Security tests pass (cross-tenant, MIME validation, path traversal)
- [ ] Performance tests meet targets (<200ms upload initiation)
- [ ] All tests verified to fail before implementation (Verify-RED)
- [ ] Code reviewed and approved
- [ ] Deployed to staging and smoke tested
- [ ] Ready for production deployment
