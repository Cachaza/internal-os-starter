# Repository instructions

## Working method

- Treat code and configuration as authoritative. Inspect the smallest relevant implementation surface before relying on prose.
- Explore wide enough to see material alternatives, then deliver the smallest coherent, verifiable change. Do not turn architectural possibilities into speculative abstractions or unrelated rewrites.
- Prefer the obvious complete solution. Generalize only for a real second use case or an existing boundary.
- Preserve the current separation between UI, application behavior, persistence, and external effects. Keep domain behavior out of React components.
- Before adding a dependency, verify that the current stack cannot adequately solve the requirement.

## Constraints and receipts

- Every numeric limit, retry count, polling interval, timeout, batch size, or threshold needs a recoverable reason: an external constraint, explicit requirement, existing behavior, or measurement. Keep that receipt near the value.
- Surface real limits explicitly. Errors should identify the constraint, requested value, allowed value, and corrective action when those facts exist.
- Prefer types, database constraints, lint rules, or focused tests when a known constraint or recurring defect can be caught statically.

## Architecture and scope

- Follow the existing monorepo architecture: Next.js and tRPC for the web boundary, Better Auth organizations for application ownership, Drizzle/PostgreSQL for persistence, shared UI primitives, and the standalone Node.js worker for durable background work.
- Organization membership is the business-data ownership boundary where applicable. Preserve it without adding speculative SaaS machinery.
- Long-running, delayed, or retryable effects belong in the PostgreSQL job system and worker. Web requests should persist the synchronous transition and required job; do not use in-process timers or add another queue without demonstrated need.
- Add domain models only when the product workflow provides evidence for them; keep the starter layer domain-neutral.

## Changes and verification

- Keep changes reviewable and preserve local conventions unless a concrete requirement justifies changing them.
- Run the relevant repository formatter/lint command, typecheck, focused tests, and broader build/tests when justified. Report anything not verified; do not start persistent servers when deterministic checks suffice.
- Keep this file compact. Put substantial future migration, workflow, integration, or deployment knowledge in a focused document only when that knowledge exists, then add a precise pointer here.

`apps/web/AGENTS.md` contains generated Next.js-version guidance and also applies to work under that directory.


## File boundaries

Keep files cohesive and easy to reason about in isolation.

When a file starts accumulating distinct responsibilities, split it along real
boundaries such as UI sections, domain logic, persistence, validation or external
effects. Prefer extracting meaningful units over splitting files merely to reduce
line count.

Optimize for maintainable context: a human or coding agent should be able to
modify one responsibility without loading unrelated implementation details.


## Product UI

Use shadcn/ui as the default source of UI primitives and interactive components.

Before implementing a new primitive, check whether shadcn/ui already provides the
required component or composition. Build custom components freely for
product-specific UI, but compose them from shadcn primitives where
practical.

When bypassing an available shadcn primitive, there should be a concrete reason
such as missing behavior, accessibility requirements or a product-specific
interaction.

Keep visual styling on semantic design-system tokens rather than scattering
one-off colors, radii and equivalent styling decisions through product
components.
