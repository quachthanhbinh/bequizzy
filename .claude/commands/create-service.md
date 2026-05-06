# Create New Microservice

Scaffold a new RevLooper microservice with the standard structure.

## Usage

```
/create-service name=<service-name> description=<what-it-does> tables=<comma-separated-tables> runtime=<cloud-run|gke|function>
```

## Instructions

Create the following structure at `services/$ARGUMENTS.name/`:

```
services/{name}/
  app/
    __init__.py
    main.py
    core/
      __init__.py
      config.py
      dependencies.py
      exceptions.py
    api/
      __init__.py
      v1/
        __init__.py
        router.py
    models/
      __init__.py
    schemas/
      __init__.py
    services/
      __init__.py
    events/
      __init__.py
      publishers.py
  tests/
    __init__.py
    conftest.py
  Dockerfile
  requirements.txt
  cloudbuild.yaml
  .env.example
```

### Template: `app/main.py`
```python
from fastapi import FastAPI
from app.api.v1.router import router
from app.core.exceptions import register_exception_handlers

app = FastAPI(title="$ARGUMENTS.name", version="1.0.0")
register_exception_handlers(app)
app.include_router(router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Template: `app/core/dependencies.py`
```python
from fastapi import Header, HTTPException

async def get_workspace_id(x_workspace_id: str = Header(...)) -> str:
    """Extract workspace_id set by api-gateway. Required on all routes."""
    if not x_workspace_id:
        raise HTTPException(status_code=400, detail="X-Workspace-ID header required")
    return x_workspace_id
```

### Template: `app/core/exceptions.py`
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"data": None, "error": {"code": exc.code, "message": exc.message}, "meta": {}}
        )
```

### Template: `app/events/publishers.py`
```python
from sqlalchemy.ext.asyncio import AsyncSession
import json, uuid
from datetime import datetime, timezone

async def publish_event(
    db: AsyncSession,
    workspace_id: str,
    event_type: str,
    payload: dict,
    aggregate_type: str,
    aggregate_id: str,
) -> None:
    """Write event to outbox_events table — published to Pub/Sub by outbox-publisher job."""
    await db.execute(
        text("""
            INSERT INTO outbox_events (id, workspace_id, event_type, aggregate_type, aggregate_id, payload, occurred_at)
            VALUES (:id, :workspace_id, :event_type, :aggregate_type, :aggregate_id, :payload, :occurred_at)
        """),
        {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "event_type": event_type,
            "aggregate_type": aggregate_type,
            "aggregate_id": aggregate_id,
            "payload": json.dumps(payload),
            "occurred_at": datetime.now(timezone.utc),
        }
    )
```

After generating the files:
1. Add the service to `docker-compose.yml` for local dev
2. Add a Cloud Run resource to `infra/cloud_run.tf`
3. Add the service account to `infra/iam.tf`
4. Register the route prefix in `services/api-gateway/app/core/config.py`
5. Add the service to `docs/ARCHITECTURE.md` Service Catalogue table
6. Document table ownership in `docs/DATABASE_SCHEMA.md` if `$ARGUMENTS.tables` is provided
