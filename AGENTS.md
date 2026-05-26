# Repository Guidelines

## Project Structure & Module Organization
This repository is a PNPM + Turbo monorepo.
- `apps/api`: NestJS backend (`src/modules/*` for feature modules, `src/main.ts` bootstrap).
- `apps/api/prisma`: Prisma schema, migrations, and seed script.
- `apps/api/test`: end-to-end tests.
- `apps/web`: Vue 3 + Vite frontend (`src/modules/*` for domain features, `src/views` for route views, `src/assets` for static assets).
- `packages/tsconfig`: shared TypeScript configs used across apps.

Prefer adding new backend features as Nest modules under `apps/api/src/modules/<feature>` and frontend features under `apps/web/src/modules/<feature>`.

## Build, Test, and Development Commands
Run from repository root unless noted.
- `pnpm dev`: start all apps in dev mode via Turbo.
- `pnpm build`: build all workspace packages/apps.
- `pnpm lint`: run lint tasks across workspaces.
- `pnpm --filter api dev`: run only backend with watch mode.
- `pnpm --filter web dev`: run only frontend (Vite dev server).
- `pnpm --filter api test`: run backend unit tests (`*.spec.ts`).
- `pnpm --filter api test:e2e`: run backend e2e tests.
- `pnpm --filter api prisma migrate dev`: create/apply local DB migrations.

## Coding Style & Naming Conventions
- Language: TypeScript across backend and frontend.
- Formatting: Prettier (`apps/api` includes `pnpm --filter api format`).
- Linting: ESLint (`pnpm lint`, `pnpm --filter api lint`).
- Indentation: follow existing formatter output (2 spaces in current codebase).
- Naming: use kebab-case for files/directories (`kas-account.service.ts`), PascalCase for Vue SFC component names, and Nest defaults for classes (`SomethingService`, `SomethingController`).

## Testing Guidelines
- Backend unit tests: colocated as `*.spec.ts` under `apps/api/src`.
- Backend e2e tests: `apps/api/test/*.e2e-spec.ts`.
- Keep tests deterministic; mock external dependencies where possible.
- Run coverage when changing core backend logic: `pnpm --filter api test:cov`.

## Commit & Pull Request Guidelines
`main` currently has no commit history, so no project-specific convention is established yet.
Until then, use Conventional Commits (e.g., `feat(api): add transaksi filter`, `fix(web): handle auth token expiry`).

For pull requests:
- Describe scope and affected apps (`api`, `web`, or both).
- Link related issues/tasks.
- Include API contract notes or screenshots for UI changes.
- Confirm lint/tests pass for touched areas before requesting review.

## Security & Configuration Tips
- Do not commit secrets; keep environment values in local `.env` files.
- Review Prisma migrations before merging.
- Validate auth/role guards in `apps/api/src/modules/auth` when changing protected endpoints.
