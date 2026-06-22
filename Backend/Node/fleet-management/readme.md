# Fleet management (DDD + CQRS)

Vehicle fleet parking management — Step 1 (in-memory BDD) + Step 2 (CLI + PostgreSQL).

## Requirements

- Node.js 18+
- PostgreSQL 16+ (Step 2 only)

## Install

```shell
npm install
cp .env.example .env
```

## Database (Step 2)

Start PostgreSQL:

```shell
docker compose up -d
npm run migrate
```

Set `DATABASE_URL` (same credentials as `docker-compose.yml`):

```shell
# PowerShell
$env:DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleet"

# bash
export DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleet"
```

Or copy `.env.example` to `.env` — it already contains this value.

## CLI

```shell
npm run fleet -- create <userId>
npm run fleet -- register-vehicle <fleetId> <vehiclePlateNumber>
npm run fleet -- localize-vehicle <fleetId> <vehiclePlateNumber> <lat> <lng>
```

Example (PowerShell):

```shell
$env:DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleet"
$fleetId = npm run fleet --silent -- create user-42
npm run fleet -- register-vehicle $fleetId ABC-123
npm run fleet -- localize-vehicle $fleetId ABC-123 48.8566 2.3522
```

Example (bash):

```shell
export DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleet"
fleetId=$(npm run fleet --silent -- create user-42)
npm run fleet -- register-vehicle "$fleetId" ABC-123
npm run fleet -- localize-vehicle "$fleetId" ABC-123 48.8566 2.3522
```

The `create` command prints the `fleetId` on stdout.

## Tests

```shell
npm test              # in-memory scenarios (excludes @persistence)
npm run test:critical # @critical in-memory only
npm run test:persistence  # @persistence with PostgreSQL
```

Persistence tests require PostgreSQL and:

```shell
$env:DATABASE_URL="postgres://fleet:fleet@localhost:5432/fleet"
$env:FLEET_REPOSITORY="postgres"
npm run test:persistence
```

## Code quality & CI (Step 3)

```shell
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm run format:check   # Prettier
npm run ci             # typecheck + lint + format + all in-memory tests
npm run ci:full        # ci + migrate + persistence tests (needs PostgreSQL)
```

GitHub Actions workflow: `.github/workflows/fleet-management-ci.yml` (repo root).

## Project layout

```shell
cli/           # fleet CLI entry point
migrations/    # SQL schema
src/
  App/         # Commands, queries, handlers
  Domain/      # Entities, value objects, ports
  Infra/       # In-memory + PostgreSQL repositories
features/      # Cucumber BDD scenarios
```
