# Generate Alembic Migration

Generate a new Alembic database migration for a microservice.

## Usage

```
/generate-migration service=<service-name> description=<what-changes>
```

## Instructions

1. Identify the target service: `services/$ARGUMENTS.service/`
2. Read the current SQLAlchemy models in `services/$ARGUMENTS.service/app/models/`
3. Read `docs/DATABASE_SCHEMA.md` to understand the target state
4. Run the following command from the service directory:

```bash
cd services/$ARGUMENTS.service
alembic revision --autogenerate -m "$ARGUMENTS.description"
```

5. Open the generated migration file in `alembic/versions/`
6. Review for correctness:
   - Verify no unexpected table/column drops
   - Confirm TEXT is used (not ENUM) for status fields
   - Confirm `workspace_id` is NOT NULL on new tables
   - Confirm `created_at` and `updated_at` defaults are present
   - Confirm cross-service references use plain UUID (no FK constraint)
   - Confirm the `downgrade()` function reverses the upgrade correctly

7. If autogenerate missed anything, add the missing statements manually
8. Update `docs/DATABASE_SCHEMA.md` with the schema change
9. Output the migration file path and a summary of what changed
