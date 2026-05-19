# Database Migrations

BeQuizzy uses [golang-migrate](https://github.com/golang-migrate/migrate) for database migrations.

## Installation

```bash
# macOS
brew install golang-migrate

# Windows
scoop install migrate

# Linux
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
```

## Usage

```bash
# Create a new migration
migrate create -ext sql -dir migrations -seq create_workspaces_table

# Run migrations
migrate -path migrations -database "postgresql://user:pass@localhost:5432/bequizzy?sslmode=disable" up

# Rollback last migration
migrate -path migrations -database "postgresql://user:pass@localhost:5432/bequizzy?sslmode=disable" down 1

# Check migration version
migrate -path migrations -database "postgresql://user:pass@localhost:5432/bequizzy?sslmode=disable" version
```

## Migration Files

Migrations are stored in this directory with the naming convention:
- `{version}_{description}.up.sql` - forward migration
- `{version}_{description}.down.sql` - rollback migration

Example:
- `000001_create_workspaces_table.up.sql`
- `000001_create_workspaces_table.down.sql`
