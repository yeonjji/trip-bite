# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js on port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

No test framework is configured yet.

## Architecture

**Trip Bite** is a Korean tourism discovery platform built with Next.js 15 App Router, Supabase, and next-intl for i18n (ko/en).

### Stack

- **Next.js 15** (App Router, React 19, TypeScript 5.9)
- **Supabase** for database (PostgreSQL) and auth
- **next-intl** for i18n routing (`/ko/...`, `/en/...`)
- **Tailwind CSS v4** with shadcn/ui components (@base-ui/react)
- **External APIs**: TourAPI 4.0 (한국관광공사), 고캠핑, 식품의약품안전처 레시피, 기상청 단기예보

### Routing

All pages live under `src/app/[locale]/`. Key routes: `/travel`, `/restaurants`, `/camping`, `/specialties`, `/recipes`, `/search`, `/region`.

Sub-routes: `/travel/pet` (pet-friendly), `/travel/barrier-free` (accessible).

`/easy-travel` is a reserved nav category (NavDropdown with empty items) for future sub-menus.

### Data Flow

1. **Pages** are async server components that call data functions from `src/lib/data/*.ts`
2. **Data functions** query Supabase via `createClient()` from `src/lib/supabase/server.ts` (cookie-based)
3. **External API calls** go through `src/lib/api/tour-api.ts` with 1hr revalidation
4. **Client components** (`"use client"`) handle filters, pagination, and interactivity
5. Listing pages use `export const dynamic = "force-dynamic"` and `staleTimes.dynamic: 0` in next.config to avoid stale client router cache

### i18n Pattern

- Locales defined in `src/i18n/routing.ts`: `["ko", "en"]`, default `"ko"`
- Middleware (`src/middleware.ts`) handles locale detection + Supabase session refresh
- Every page/layout calls `setRequestLocale(locale)` and conditionally renders Korean/English
- Message files: `messages/ko.json`, `messages/en.json`

### Supabase

- **Server client**: `src/lib/supabase/server.ts` — use in server components and data functions
- **Browser client**: `src/lib/supabase/client.ts` — use in client components (e.g., SigunguFilter)
- Migrations in `supabase/migrations/` (018 files)
- Remote Supabase instance (not local docker)

### Area Code System

Two code systems exist and must not be confused:
- **법정동 codes** (used in DB and UI): `"11"` (서울), `"26"` (부산), `"41"` (경기), etc. Defined in `src/lib/constants/area-codes.ts`
- **TourAPI codes** (legacy, used by KoreaMapSvg internally): `"1"` (서울), `"6"` (부산), `"31"` (경기), etc.

The `destinations`, `pet_friendly_places`, and `barrier_free_places` tables use 법정동 codes for both `area_code` (시도) and `sigungu_code` (시군구, 5-digit 법정동).

### Card Components

Each content type has a dedicated card: `TravelCard`, `CampingCard`, `RestaurantCard`, `SpecialtyCard`, `RecipeCard`, `BarrierFreeCard`, `PetCard`. All live in `src/components/cards/`.

### Data Sync Scripts

`scripts/` contains Node.js ESM scripts for bulk-syncing external API data into Supabase (e.g. `sync-barrier-free.mjs`). Run directly with `node scripts/<name>.mjs`. These use `SUPABASE_SERVICE_ROLE_KEY` and the relevant API key.

### Key Patterns

- `cn()` utility from `src/lib/utils.ts` for Tailwind class merging (clsx + tailwind-merge)
- `Promise.allSettled` for parallel data fetching with graceful degradation
- `buildAlternates()` for SEO alternate language links
- Filter components (RegionFilter, SigunguFilter, ThemeFilter) use URL search params via `router.push`
- Korea map SVG data from `src/lib/constants/korea-map-data.js` (80KB geographic paths from svg-maps)
- TourAPI detail pages call multiple endpoints in parallel: `detailCommon`, `detailIntro`, and type-specific calls like `detailPetTour` for pet-friendly places

### Environment Variables

Required in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TOUR_API_KEY`, `CAMPING_API_KEY`, `RECIPE_API_KEY`, `WEATHER_API_KEY`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, `EV_CHARGER_API_KEY`
