# Pre-Tool-Call Hook

Before executing any file write (Write, Edit tools), run these checks automatically.

## Checks

### 1. Hardcoded secrets detection
If the content being written contains any of these patterns, STOP and alert the user:

```
- API keys: /[a-zA-Z0-9_]{20,}/ adjacent to words like "key", "secret", "token", "password"
- GCP service account JSON: /"private_key"/
- OpenAI keys: /sk-[a-zA-Z0-9]{48}/
- Anthropic keys: /sk-ant-[a-zA-Z0-9-]{95}/
- Supabase service role keys: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/
```

Alert format:
```
⚠️  SECURITY ALERT: Potential hardcoded secret detected in {file}.
Pattern matched: {pattern}
Action: Replace with environment variable reference or GCP Secret Manager lookup.
```

### 2. Cross-service ORM import detection
If writing a Python file in `services/` and the content contains:
```python
from services.{other_service}.
```
STOP and alert:
```
⚠️  ARCHITECTURE VIOLATION: Cross-service ORM import detected.
Services must not import each other's models directly.
Use REST calls to {other_service}'s internal URL instead.
```

### 3. Direct LLM SDK import detection
If writing a Python file and the content contains `import openai`, `import anthropic`, or `from google.generativeai`:
```
⚠️  ARCHITECTURE VIOLATION: Direct LLM SDK import detected.
All AI calls must go through ai-service internal REST endpoint, not SDK directly.
```

### 4. Missing workspace_id in new route handlers
If writing a new FastAPI router endpoint (`@router.get`, `@router.post`, etc.) without `get_workspace_id` in the dependencies:
```
⚠️  SECURITY WARNING: New route endpoint may be missing workspace_id scope.
Add: workspace_id: str = Depends(get_workspace_id)
```
