# Internal OS Starter

A production-minded foundation for organization-owned internal tools. It combines a protected backoffice, typed APIs, PostgreSQL persistence, shared UI primitives, and a standalone worker without prescribing a product domain.

## Included

- Next.js App Router web application and authenticated dashboard shell
- Better Auth email/password sessions and organizations
- Organization-aware tRPC procedures
- Drizzle ORM, PostgreSQL schema, and committed migrations
- PostgreSQL-backed durable jobs with `LISTEN`/`NOTIFY`, scheduled execution, and retry policy
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
cp apps/web/.env.example apps/web/.env
pnpm run dev:stack
```

Open [http://localhost:3001](http://localhost:3001), create an account and organization, then use **Encolar prueba** from the dashboard. The worker logs the payload and marks the job as completed.

For separate terminals, run `pnpm run db:start`, `pnpm run db:migrate`, and `pnpm run dev`. `pnpm run db:stop` preserves the database volume; `pnpm run db:down` removes only the Compose services and network unless explicitly given `--volumes`.

## Adapt the starter

1. Replace the `Internal OS` product name and `@internal-os/*` package scope if desired.
2. Add domain tables under `packages/db/src/schema` and generate a migration with `pnpm run db:generate`.
3. Put application procedures in `packages/api`; use `organizationProcedure` for organization-owned data.
4. Build product screens under `apps/web/src/app/dashboard` from primitives in `packages/ui`.
5. Add durable effect types and handlers to the database job producer and `apps/worker`.

Keep long-running, delayed, or retryable effects in the job system rather than in web-process timers. A claimed job is not currently reclaimed automatically if a worker exits while processing it; add a lease/recovery policy before using handlers whose process interruption must recover without operational intervention.

## Verification

```bash
pnpm exec biome check .
pnpm run check-types
pnpm run build
```

Repository-specific contribution guidance lives in [AGENTS.md](./AGENTS.md).
