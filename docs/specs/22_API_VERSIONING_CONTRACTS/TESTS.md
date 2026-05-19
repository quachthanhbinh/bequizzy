# Spec 22 — API Versioning & Contracts: TESTS

## Tests

### U22-01: All Routes Have v1 Prefix
```python
def test_all_routes_have_v1_prefix(app):
    for route in app.routes:
        if hasattr(route, "path") and "/healthz" not in route.path:
            assert route.path.startswith("/v1/"), route.path
```

### U22-02: Deprecated Endpoint Returns Sunset Header
```python
async def test_deprecated_endpoint_sunset_header(client):
    resp = await client.get("/v1/deprecated-endpoint")
    assert "Sunset" in resp.headers
```
