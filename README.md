# Internal OS Starter

A production-minded foundation for organization-owned internal tools. It combines a protected backoffice, typed APIs, PostgreSQL persistence, shared UI primitives, and a standalone worker without prescribing a product domain.

## Included

- Next.js App Router web application and authenticated dashboard shell
- Better Auth email/password sessions and organizations
- Organization-aware tRPC procedures
- Drizzle ORM, PostgreSQL schema, and committed migrations
- PostgreSQL-backed durable jobs with `LISTEN`/`NOTIFY`, scheduling, retries, heartbeats, and interrupted-job recovery
- Standalone Node.js worker
- Shared shadcn/ui and Tailwind package
- Turborepo, pnpm, TypeScript, Biome, Docker, and GitHub Actions

The `system.test` job is an intentionally harmless vertical slice. It demonstrates the complete path from an organization-authorized web request to a durable database row and worker execution.

## Requirements

- Node.js 24
- pnpm 11.20.0 (declared in `package.json`)
- Docker for the supplied local PostgreSQL service

## Start locally

```bash
pnpm install
pnpm run setup:local
pnpm run dev:stack
```

`setup:local` creates the web and worker environment files without overwriting existing files and generates a private authentication secret. For manual setup, copy the examples, generate a secret with `openssl rand -base64 32`, and replace the public placeholder in `apps/web/.env`. The placeholder is rejected at startup.

Open [http://localhost:3001](http://localhost:3001), create an account and organization, then use **Encolar prueba** and **Comprobar estado** from the dashboard. Success is **Completado**: the actual worker has consumed the persisted job. A queued ID alone does not prove the worker is running. Returning users can select an existing organization; **Configuración → Cambiar de organización** opens the same picker.

For separate terminals, run `pnpm run db:start`, `pnpm run db:migrate`, and `pnpm run dev`. `pnpm run db:stop` preserves the database volume; `pnpm run db:down` removes only the Compose services and network unless explicitly given `--volumes`. `dev:stack` waits for PostgreSQL, applies migrations, and runs web and worker together through Turbo.

After `pnpm run setup:local`, `pnpm run docker:up` builds and starts PostgreSQL, applies committed migrations through a one-shot service, then starts the web application and worker only after migration success. Existing volumes are preserved. Configure `POSTGRES_PASSWORD` and the corresponding local connection strings if you change the development database credentials. Compose's authentication URL is for local use; adapt it and inject a generated secret for deployment.

If Docker cannot be reached, start Docker before `db:start`. If port 5432 is already in use, stop the conflicting local database or change the Compose host port and local `DATABASE_URL` together. If a job stays **Pendiente**, check `pnpm run dev:worker` or `docker compose logs worker`. Failed jobs show their error; fix the cause before enqueueing another test.

## Adapt the starter

1. Set the product name and description in `apps/web/src/config/site.ts`; replace the `@internal-os/*` package scope if desired.
2. Add domain tables under `packages/db/src/schema` and generate a migration with `pnpm run db:generate`.
3. Put application procedures in `packages/api`; use `organizationProcedure` for organization-owned data.
4. Build product screens under `apps/web/src/app/dashboard` from primitives in `packages/ui`.
5. Add durable effect types and handlers to the database job producer and `apps/worker`.

Account registration and organization creation are open by default. Decide whether to disable public signup or restrict organization creation in Better Auth before exposing a private internal tool. Organization selection and read-only settings are included; invitation delivery and acceptance UI are not implemented. The unused global admin plugin is disabled; its reserved schema columns are retained to avoid a destructive migration.

Keep long-running, delayed, or retryable effects in the job system rather than in web-process timers. Every claimed job receives an ownership token and a renewable lease. If its worker stops, another worker can reclaim it after `JOB_LEASE_MS`; stale workers cannot complete or fail a newer attempt. Set the lease from the longest event-loop pause your handlers must tolerate and monitor repeated lease expiry as an operational failure.

## Environment

The web and worker processes have explicit, separate examples:

- `apps/web/.env` contains authentication and web database settings.
- `apps/worker/.env` contains the worker database connection, reconciliation interval, lease duration, and attempt limit.

Compose supplies container-safe defaults for local use. Production deployments should inject the same variables through their secret and configuration system.

## Verification

```bash
pnpm exec biome check .
pnpm test
pnpm run check-types
pnpm run test:integration
pnpm run build
```

Integration tests require `TEST_DATABASE_URL` pointing to a migrated, disposable PostgreSQL database whose name ends in `_test`. They never fall back to the application's `DATABASE_URL`. For example, create a dedicated `internal_os_test` database, migrate it with `DATABASE_URL="$TEST_DATABASE_URL" pnpm run db:migrate`, then run `pnpm run test:integration`. Do not point test credentials at shared data. Fixtures delete only their own rows, and Turbo serializes the database and API suites because they share queue claims. CI provisions the dedicated database automatically.

The integration suite covers concurrent claims, retries, lease recovery, returning-user sign-in and organization selection, rejected foreign/revoked memberships, organization-scoped job lookup, and completion by the actual one-shot worker. Unit tests cover authentication-secret validation.

Repository-specific contribution guidance lives in [AGENTS.md](./AGENTS.md).
