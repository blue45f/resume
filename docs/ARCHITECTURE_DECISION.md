# Architecture Decision — Resume Platform

**Date:** 2026-04-17  **Status:** Accepted  **Scope:** src/, server/

## Current State
- `src/`: 47 pages, 97 flat components, co-located `hooks/lib/stores/types/`, partial FSD (`shared/ui` + 4 features; empty `app/entities/`).
- `server/`: 22 NestJS modules — already feature-modular.
- No boundary enforcement yet.

## Scoring (1-10, higher=better)

| Approach | Maint | Onboard | Refactor | Test | Eco-fit | Migration | Total |
|---|---|---|---|---|---|---|---|
| FSD (7 layers) | 9 | 6 | 9 | 8 | 7 | 4 | 43 |
| **FSD-Lite (Toss)** | **8** | **9** | **8** | **8** | **9** | **9** | **51** |
| DDD contexts | 9 | 5 | 9 | 9 | 6 | 3 | 41 |
| Hexagonal | 9 | 4 | 10 | 10 | 4 | 2 | 39 |
| Atomic+Container | 6 | 8 | 5 | 6 | 8 | 7 | 40 |
| Modular Monolith | 9 | 8 | 8 | 9 | 10 | 10 | 54 |
| Flat co-location | 3 | 7 | 3 | 5 | 6 | 10 | 34 |

**Winner:** FSD-Lite for `src/`, Modular Monolith for `server/` (already there).

## Decision — Hybrid

### `src/` (FSD-Lite, 4 layers)
```
src/
  app/        providers, router, global error boundary
  pages/      47 route pages (flat, composition-only)
  features/   user scenarios: {ui, model, api, lib, index.ts}
  entities/   domain objects (Resume, User, Job) reused by 2+ features
  shared/     ui/ lib/ api/ config/ i18n/ — no domain knowledge
```
Deprecate over time: `components/`, `hooks/`, `stores/`, `lib/`, `types/`.

### `server/` — keep as-is
Add barrel `index.ts` per module. `common/` becomes kernel. No restructure.

### Import rules
`app → pages → features → entities → shared`. Same-layer cross-import forbidden except via public `index.ts`. `shared` imports nothing above.

### Tooling
1. `eslint-plugin-boundaries` — layer rules + barrel-only imports
2. `dependency-cruiser` — CI gate on cycles
3. Per-layer aliases: `@shared/*`, `@features/*`, `@entities/*`

## Migration — 3 phases

**Phase 1 (1wk, low risk):** Lift primitives. Move generic UI (`Dialog`, `Tooltip`, `Select`, `Toast`, `Skeleton`, `EmptyState`, `Breadcrumb`, `Footer`, `Header`) → `shared/ui`. Move `lib/{time,cache,cn,useDebounce}` → `shared/lib`. Install eslint-plugin-boundaries at warn.

**Phase 2 (2-3wk):** Extract features. Per scenario (auth, notifications, community, interview-prep, resumes-editor, jobs, cover-letters, payments) consolidate components + hooks + API into `features/<name>/{ui,model,api}` with barrel. Update page imports. Raise eslint to error-level. Add dependency-cruiser CI.

**Phase 3 (ongoing):** Promote entities. When type+UI used by 2+ features (ResumeCard, UserAvatar, JobCard) → `entities/`. Dissolve residual `components/`. Retire `hooks/stores/types/`.

### DO NOT move
- `pages/` — stays flat (composition root).
- `server/` — add barrels only.
- `prisma/`, `public/`, `test/`, `scripts/` — untouched.
- Files with >10 inbound imports until Phase 2 batch cleanup.

## Rationale
FSD-Lite wins migration (9): 4 layers already partially exist. Full FSD's `widgets`/`processes` add no payoff at 47-page scale. DDD/Hexagonal demand rewrites incompatible with 944 passing tests. NestJS already enforces Modular-Monolith natively — only barrels and linting needed. Hybrid preserves investment and unlocks layering where it matters.
