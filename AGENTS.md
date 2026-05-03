# Repository Guidelines

## Project Structure & Module Organization
Trip Bite is a Next.js 15 App Router project using TypeScript, React 19, Tailwind CSS, Supabase, and `next-intl`.

- `src/app/` contains layouts, SEO files, and locale-aware routes under `src/app/[locale]/`.
- `src/components/` holds reusable UI by feature (`cards/`, `filters/`, `maps/`, `weather/`, `ui/`).
- `src/lib/` contains API clients, constants, Supabase utilities, and helpers; `src/types/` contains domain types.
- `messages/en.json` and `messages/ko.json` store translations.
- `public/` stores static assets; `src/app/fonts/` stores local fonts.
- `scripts/` contains data sync/seed scripts; `supabase/migrations/` tracks database schema changes.
- `docs/` contains product, technical, API, and QA references. No dedicated test directory exists yet.

## Build, Test, and Development Commands
Use pnpm because the repository includes `pnpm-lock.yaml`.

- `pnpm dev` — start the local Next.js development server at `http://localhost:3000`.
- `pnpm build` — create a production build and run framework type checks.
- `pnpm start` — serve the built app locally.
- `pnpm lint` — run ESLint with Next.js Core Web Vitals and TypeScript rules.

Run data scripts directly when needed, for example: `node scripts/sync-festivals.mjs`.

## Coding Style & Naming Conventions
Use TypeScript and functional React components. Prefer server components by default; add `"use client"` only for browser state, effects, or event handlers. Import with the `@/*` alias for `src/*` paths.

Prettier uses 2-space indentation, semicolons, double quotes, trailing commas, and 100-character lines. ESLint warns on unused variables and allows `any`. Name components in PascalCase, hooks as `useSomething`, route folders in lowercase/kebab-case, and utilities in camelCase.

## Testing Guidelines
There is no configured test runner. Before submitting changes, run `pnpm lint` and `pnpm build`, then manually verify affected routes in both locales when applicable. If adding tests, place them near the code or in `__tests__/`, name files `*.test.ts` or `*.test.tsx`, and document the command in `package.json`.

## Commit & Pull Request Guidelines
Git history uses Conventional Commit prefixes such as `feat:` and `fix:`; continue that style with concise summaries. Korean or English summaries are acceptable, but keep the prefix in English.

Pull requests should include a description, linked issue if available, screenshots for UI changes, migration/script notes for data changes, and confirmation that `pnpm lint` and `pnpm build` passed.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` for local secrets. Never commit `.env.local`, API keys, Supabase credentials, or generated build artifacts such as `.next/`.
