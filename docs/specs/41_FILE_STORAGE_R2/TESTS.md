# 41 — File Storage with Cloudflare R2 — TESTS

**Status:** 📝 Draft
**Last updated:** 2026-05-18

## Test Strategy

This spec follows RevLooper's TDD workflow with strict RED → GREEN → REFACTOR discipline. All tests must be written and verified to fail (RED) before implementation code is written.

## Unit Tests

### Storage Service — Upload Initiation

**File:** `services/storage-service/tests/unit/test_upload_service.py`

```python
@pytest.mark.asyncio
async def test_initiate_upload_success():
    """Should generate presigned POST URL and create pending metadata row."""
    # RED: No upload_service.initiate_upload() exists yet
    result = await upload_service.initiate_upload(
        workspace_id=UUID("a1b2c3d4-..."),
        filename="test.pdf",
        content_type="application/pdf",
        file_size=1024,
        purpose="ai_brain_doc",
        user_id=UUID("user-..."),
    )
    
    assert result["file_id"] is not None
    assert result["upload_url"].startswith("https://")
    assert "upload_fields" in result
    assert result["expires_at"] > datetime.utcnow()

@pytest.mark.asyncio
async def test_initiate_upload_invalid_mime_type():
    """Should reject file with MIME type not in whitelist."""
    with pytest.raises(AppError) as exc:
        await upload_service.initiate_upload(
            workspace_id=UUID("a1b2c3d4-..."),
            filename="malware.exe",
            content_type="application/x-msdownload",
            file_size=1024,
            purpose="ai_brain_doc",
            user_id=UUID("user-..."),
        )
    
    assert exc.value.code == "invalid_content_type"

@pytest.mark.asyncio
async def test_initiate_upload_quota_exceeded():
    """Should reject upload when storage quota exceeded."""
    # Setup: workspace with 1GB limit, 950MB used, 60MB reserved
    # Attempt: upload 100MB file
    # Expected: quota_exceeded error
    with pytest.raises(AppError) as exc:
        await upload_service.initiate_upload(
            workspace_id=UUID("a1b2c3d4-..."),
            filename="large.pdf",
            content_type="application/pdf",
            file_size=100 * 1024 * 1024,  # 100MB
            purpose="ai_brain_doc",
            user_id=UUID("user-..."),
        )
    
    assert exc.value.code == "quota_exceeded"

@pytest.mark.asyncio
async def test_initiate_upload_reserves_bytes():
    """Should atomically increment reserved_bytes on initiation."""
    workspace_id = UUID("a1b2c3d4-...")
    
    # Get initial reserved_bytes
    initial = await db.get_workspace_credits(workspace_id)
    
    await upload_service.initiate_upload(
        workspace_id=workspace_id,
        filename="test.pdf",
        content_type="application/pdf",
        file_size=5000,
        purpose="ai_brain_doc",
        user_id=UUID("user-..."),
    )
    
    # Check reserved_bytes incremented
    after = await db.get_workspace_credits(workspace_id)
    assert after.storage_reserved_bytes == initial.storage_reserved_bytes + 5000
```

### Storage Service — Upload Completion

```python
@pytest.mark.asyncio
async def test_complete_upload_success():
    """Should verify file in R2, update status to ready, move bytes from reserved to used."""
    file_id = await setup_pending_upload()
    
    result = await upload_service.complete_upload(
        file_id=file_id,
        workspace_id=UUID("a1b2c3d4-..."),
    )
    
    assert result["status"] == "ready"
    
    # Check metadata updated
    file = await db.get_file(file_id)
    assert file.status == "ready"
    
    # Check bytes moved from reserved to used
    credits = await db.get_workspace_credits(file.workspace_id)
    assert credits.storage_reserved_bytes == 0  # Released
    assert credits.storage_used_bytes == file.file_size  # Incremented

@pytest.mark.asyncio
async def test_complete_upload_file_not_in_r2():
    """Should fail if file not found in R2 bucket."""
    file_id = await setup_pending_upload()
    # Don't actually upload to R2
    
    with pytest.raises(AppError) as exc:
        await upload_service.complete_upload(
            file_id=file_id,
            workspace_id=UUID("a1b2c3d4-..."),
        )
    
    assert exc.value.code == "upload_not_completed"

@pytest.mark.asyncio
async def test_complete_upload_magic_byte_mismatch():
    """Should mark file as failed if magic bytes don't match declared MIME type."""
    file_id = await setup_pending_upload(content_type="application/pdf")
    # Upload file with wrong magic bytes (e.g., PNG header)
    await upload_fake_file_to_r2(file_id, magic_bytes=b"\x89PNG")
    
    result = await upload_service.complete_upload(
        file_id=file_id,
        workspace_id=UUID("a1b2c3d4-..."),
    )
    
    assert result["status"] == "failed"
    
    file = await db.get_file(file_id)
    assert file.status == "failed"

@pytest.mark.asyncio
async def test_complete_upload_idempotent():
    """Should be idempotent — duplicate complete calls no-op."""
    file_id = await setup_pending_upload()
    await upload_file_to_r2(file_id)
    
    # First completion
    result1 = await upload_service.complete_upload(file_id, workspace_id)
    assert result1["status"] == "ready"
    
    # Second completion (duplicate)
    result2 = await upload_service.complete_upload(file_id, workspace_id)
    assert result2["status"] == "ready"
    
    # Check bytes not double-counted
    credits = await db.get_workspace_credits(workspace_id)
    assert credits.storage_used_bytes == file_size  # Not 2x
```

### Storage Service — Download URL Generation

```python
@pytest.mark.asyncio
async def test_generate_download_url_success():
    """Should generate presigned GET URL with 30-minute expiry."""
    file_id = await setup_ready_file()
    
    result = await download_service.generate_download_url(
        file_id=file_id,
        workspace_id=UUID("a1b2c3d4-..."),
    )
    
    assert result["download_url"].startswith("https://")
    assert "X-Amz-Signature" in result["download_url"]
    assert result["expires_at"] > datetime.utcnow()
    assert (result["expires_at"] - datetime.utcnow()).seconds <= 1800  # 30 min

@pytest.mark.asyncio
async def test_generate_download_url_cross_tenant_blocked():
    """Should block download if file belongs to different workspace."""
    file_id = await setup_ready_file(workspace_id=UUID("workspace-A"))
    
    with pytest.raises(AppError) as exc:
        await download_service.generate_download_url(
            file_id=file_id,
            workspace_id=UUID("workspace-B"),  # Different workspace
        )
    
    assert exc.value.code == "file_not_found"

@pytest.mark.asyncio
async def test_generate_download_url_deleted_file():
    """Should return 410 Gone for soft-deleted files."""
    file_id = await setup_deleted_file()
    
    with pytest.raises(AppError) as exc:
        await download_service.generate_download_url(
            file_id=file_id,
            workspace_id=UUID("a1b2c3d4-..."),
        )
    
    assert exc.value.code == "file_deleted"
    assert exc.value.status_code == 410
```

### Filename Sanitization

```python
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

def test_sanitize_filename_empty_result():
    """Should return fallback for empty result."""
    assert sanitize_filename("...") == "unnamed_file"
    assert sanitize_filename("") == "unnamed_file"
```

### Magic Byte Validation

```python
def test_validate_magic_bytes_pdf():
    """Should validate PDF magic bytes."""
    pdf_header = b"%PDF-1.4\n..."
    assert validate_magic_bytes("application/pdf", pdf_header) is True

def test_validate_magic_bytes_png():
    """Should validate PNG magic bytes."""
    png_header = b"\x89PNG\r\n\x1a\n..."
    assert validate_magic_bytes("image/png", png_header) is True

def test_validate_magic_bytes_mismatch():
    """Should reject mismatched magic bytes."""
    png_header = b"\x89PNG\r\n\x1a\n..."
    assert validate_magic_bytes("application/pdf", png_header) is False

def test_validate_magic_bytes_text_files():
    """Should skip validation for text files (no magic bytes)."""
    text_content = b"Hello world"
    assert validate_magic_bytes("text/plain", text_content) is True
    assert validate_magic_bytes("text/csv", text_content) is True
```

## Integration Tests

### End-to-End Upload Flow

**File:** `services/storage-service/tests/integration/test_upload_flow.py`

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_upload_flow_end_to_end(test_client, r2_client):
    """Test complete upload flow: initiate → upload to R2 → complete."""
    workspace_id = UUID("test-workspace")
    
    # Step 1: Initiate upload
    response = await test_client.post(
        "/v1/storage/upload/initiate",
        json={
            "filename": "test-document.pdf",
            "content_type": "application/pdf",
            "file_size": 1024,
            "purpose": "ai_brain_doc",
        },
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    assert response.status_code == 200
    data = response.json()
    file_id = data["file_id"]
    upload_url = data["upload_url"]
    upload_fields = data["upload_fields"]
    
    # Step 2: Upload file to R2 using presigned POST
    test_file_content = b"%PDF-1.4\nTest PDF content"
    files = {"file": ("test-document.pdf", test_file_content, "application/pdf")}
    r2_response = requests.post(upload_url, data=upload_fields, files=files)
    assert r2_response.status_code == 204
    
    # Step 3: Complete upload
    response = await test_client.post(
        "/v1/storage/upload/complete",
        json={"file_id": file_id},
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    
    # Step 4: Verify file is downloadable
    response = await test_client.get(
        f"/v1/storage/files/{file_id}/download",
        headers={"X-Workspace-ID": str(workspace_id)},
    )
    assert response.status_code == 200
    download_url = response.json()["download_url"]
    
    # Step 5: Download file from R2
    download_response = requests.get(download_url)
    assert download_response.status_code == 200
    assert download_response.content == test_file_content

@pytest.mark.integration
@pytest.mark.asyncio
async def test_quota_enforcement_race_condition(test_client):
    """Test that concurrent uploads don't bypass quota."""
    workspace_id = UUID("test-workspace")
    # Setup: workspace with 1GB limit, 900MB used
    
    # Attempt 5 concurrent uploads of 50MB each (total 250MB, exceeds 100MB remaining)
    tasks = []
    for i in range(5):
        task = test_client.post(
            "/v1/storage/upload/initiate",
            json={
                "filename": f"file-{i}.pdf",
                "content_type": "application/pdf",
                "file_size": 50 * 1024 * 1024,  # 50MB
                "purpose": "ai_brain_doc",
            },
            headers={"X-Workspace-ID": str(workspace_id)},
        )
        tasks.append(task)
    
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    # At most 2 should succeed (100MB / 50MB = 2)
    success_count = sum(1 for r in responses if not isinstance(r, Exception) and r.status_code == 200)
    assert success_count <= 2
    
    # Others should fail with quota_exceeded
    error_count = sum(1 for r in responses if isinstance(r, Exception) or r.status_code == 403)
    assert error_count >= 3
```

### Cross-Tenant Isolation

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_cross_tenant_isolation(test_client):
    """Test that workspace A cannot access workspace B's files."""
    workspace_a = UUID("workspace-a")
    workspace_b = UUID("workspace-b")
    
    # Workspace A uploads file
    file_id = await upload_test_file(test_client, workspace_a)
    
    # Workspace B attempts to download
    response = await test_client.get(
        f"/v1/storage/files/{file_id}/download",
        headers={"X-Workspace-ID": str(workspace_b)},
    )
    assert response.status_code == 404
    assert response.json()["error"] == "file_not_found"
    
    # Workspace B attempts to delete
    response = await test_client.delete(
        f"/v1/storage/files/{file_id}",
        headers={"X-Workspace-ID": str(workspace_b)},
    )
    assert response.status_code == 404
```

### Cleanup Jobs

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_orphaned_file_cleanup():
    """Test that pending files >24h old are marked as failed."""
    # Create pending file with created_at = 25 hours ago
    file_id = await create_pending_file(created_at=datetime.utcnow() - timedelta(hours=25))
    
    # Run cleanup job
    await cleanup_service.cleanup_orphaned_files()
    
    # Verify file marked as failed
    file = await db.get_file(file_id)
    assert file.status == "failed"
    
    # Verify reserved_bytes released
    credits = await db.get_workspace_credits(file.workspace_id)
    assert credits.storage_reserved_bytes == 0

@pytest.mark.integration
@pytest.mark.asyncio
async def test_soft_deleted_file_purge():
    """Test that soft-deleted files >7 days old are purged."""
    # Create deleted file with deleted_at = 8 days ago
    file_id = await create_deleted_file(deleted_at=datetime.utcnow() - timedelta(days=8))
    r2_key = await db.get_file_r2_key(file_id)
    
    # Run purge job
    await cleanup_service.purge_soft_deleted_files()
    
    # Verify file deleted from DB
    file = await db.get_file(file_id)
    assert file is None
    
    # Verify file deleted from R2
    with pytest.raises(r2_client.exceptions.NoSuchKey):
        r2_client.head_object(Bucket=BUCKET_NAME, Key=r2_key)
```

## E2E Tests (Playwright)

**File:** `e2e/tests/file-upload.spec.ts`

```typescript
test.describe('File Upload', () => {
  test('should upload document to AI Brain', async ({ page }) => {
    await page.goto('/brain');
    
    // Click upload button
    await page.click('[data-testid="upload-doc-button"]');
    
    // Fill form
    await page.fill('[data-testid="doc-title"]', 'Company Profile');
    await page.selectOption('[data-testid="doc-type"]', 'business_profile');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/company-profile.pdf');
    
    // Submit
    await page.click('[data-testid="upload-submit"]');
    
    // Wait for upload to complete
    await page.waitForSelector('[data-testid="upload-success"]');
    
    // Verify file appears in list
    await expect(page.locator('text=Company Profile')).toBeVisible();
  });
  
  test('should reject file exceeding size limit', async ({ page }) => {
    await page.goto('/brain');
    await page.click('[data-testid="upload-doc-button"]');
    
    // Attempt to upload 60MB file (exceeds 50MB limit for ai_brain_doc)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('fixtures/large-file-60mb.pdf');
    
    // Expect error message
    await expect(page.locator('text=File size exceeds 50MB limit')).toBeVisible();
  });
  
  test('should download uploaded file', async ({ page }) => {
    await page.goto('/brain');
    
    // Click download button on existing file
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="file-download-button"]');
    const download = await downloadPromise;
    
    // Verify filename
    expect(download.suggestedFilename()).toBe('company-profile.pdf');
  });
});
```

## Test Coverage Targets

| Component | Target | Rationale |
|---|---|---|
| Upload service | 95% | Core business logic, quota enforcement critical |
| Download service | 90% | Simpler logic, presigned URL generation |
| Cleanup jobs | 90% | Edge cases (orphaned files, soft-delete) |
| API routes | 85% | Integration tests cover most paths |
| Utilities (sanitize, validate) | 100% | Security-critical, pure functions |

## Test Data Fixtures

**File:** `services/storage-service/tests/fixtures/files.py`

```python
@pytest.fixture
def sample_pdf_bytes():
    """Valid PDF file bytes with correct magic bytes."""
    return b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n..."

@pytest.fixture
def sample_png_bytes():
    """Valid PNG file bytes with correct magic bytes."""
    return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01..."

@pytest.fixture
def sample_csv_bytes():
    """Valid CSV file bytes."""
    return b"name,email,company\nJohn Doe,john@example.com,Acme Inc\n"

@pytest.fixture
async def test_workspace(db):
    """Create test workspace with default quota."""
    workspace_id = UUID("test-workspace-id")
    await db.execute(
        """
        INSERT INTO workspace_credits (workspace_id, plan, storage_used_bytes, storage_reserved_bytes, plan_storage_limit)
        VALUES (:workspace_id, 'pro', 0, 0, 10737418240)  -- 10GB
        """,
        workspace_id=workspace_id,
    )
    return workspace_id
```

## Adversarial Test Cases

### Security-Focused Tests

```python
@pytest.mark.security
async def test_path_traversal_attack():
    """Attempt path traversal via filename."""
    result = await upload_service.initiate_upload(
        workspace_id=UUID("a1b2c3d4-..."),
        filename="../../etc/passwd",
        content_type="text/plain",
        file_size=100,
        purpose="ai_brain_doc",
        user_id=UUID("user-..."),
    )
    
    # Verify R2 key does not contain ../
    file = await db.get_file(result["file_id"])
    assert "../" not in file.r2_key
    assert file.r2_key.startswith(str(workspace_id))

@pytest.mark.security
async def test_mime_type_spoofing():
    """Upload .exe file with PDF MIME type."""
    file_id = await setup_pending_upload(content_type="application/pdf")
    # Upload file with .exe magic bytes (MZ header)
    await upload_fake_file_to_r2(file_id, magic_bytes=b"MZ\x90\x00")
    
    result = await upload_service.complete_upload(file_id, workspace_id)
    
    # Should be marked as failed due to magic byte mismatch
    assert result["status"] == "failed"

@pytest.mark.security
async def test_presigned_url_enumeration():
    """Attempt to enumerate file_ids and generate presigned URLs."""
    # Generate 1000 random UUIDs
    for _ in range(1000):
        fake_file_id = uuid4()
        
        with pytest.raises(AppError) as exc:
            await download_service.generate_download_url(
                file_id=fake_file_id,
                workspace_id=UUID("attacker-workspace"),
            )
        
        assert exc.value.code == "file_not_found"
    
    # Verify no successful URL generation (all 404)
```

## Performance Tests

```python
@pytest.mark.performance
async def test_upload_initiation_latency():
    """Verify upload initiation completes in <200ms."""
    start = time.time()
    
    await upload_service.initiate_upload(
        workspace_id=UUID("a1b2c3d4-..."),
        filename="test.pdf",
        content_type="application/pdf",
        file_size=1024,
        purpose="ai_brain_doc",
        user_id=UUID("user-..."),
    )
    
    elapsed = (time.time() - start) * 1000  # ms
    assert elapsed < 200, f"Upload initiation took {elapsed}ms (target: <200ms)"

@pytest.mark.performance
async def test_concurrent_uploads():
    """Verify service handles 10 concurrent uploads per workspace."""
    tasks = [
        upload_service.initiate_upload(
            workspace_id=UUID("a1b2c3d4-..."),
            filename=f"file-{i}.pdf",
            content_type="application/pdf",
            file_size=1024,
            purpose="ai_brain_doc",
            user_id=UUID("user-..."),
        )
        for i in range(10)
    ]
    
    results = await asyncio.gather(*tasks)
    assert len(results) == 10
    assert all(r["file_id"] is not None for r in results)
```

## Test Execution

```bash
# Run all tests
pytest services/storage-service/tests/

# Run unit tests only
pytest services/storage-service/tests/unit/

# Run integration tests (requires R2 credentials)
pytest services/storage-service/tests/integration/ --r2

# Run security tests
pytest services/storage-service/tests/ -m security

# Run with coverage
pytest services/storage-service/tests/ --cov=app --cov-report=html

# Run E2E tests
cd e2e && npm run test:e2e -- file-upload.spec.ts
```

## Definition of Done (Testing)

- [ ] All unit tests pass (95%+ coverage for core services)
- [ ] All integration tests pass (including R2 interaction)
- [ ] All E2E tests pass (upload, download, quota enforcement)
- [ ] All security tests pass (cross-tenant, MIME validation, path traversal)
- [ ] Performance tests meet targets (<200ms upload initiation)
- [ ] Cleanup jobs tested (orphaned files, soft-delete purge)
- [ ] Test fixtures documented and reusable
- [ ] CI pipeline runs all tests on every commit
