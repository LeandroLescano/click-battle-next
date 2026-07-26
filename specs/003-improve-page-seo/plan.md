# Implementation Plan: Mejorar SEO de la página

**Branch**: `003-improve-page-seo` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-improve-page-seo/spec.md`

## Summary

Improve Click Battle's organic search foundation by converting the current global, mostly static SEO setup into an explicit App Router SEO system: route-level metadata, canonical URL decisions, crawler discovery files, richer crawlable page copy for public pages, and a Search Console validation workflow. The implementation will preserve existing Google Search Console and AdSense setup, keep production gameplay untouched, and focus on the production domain `https://www.click-battle.com.ar/`.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 18.2.0, Next.js 15.5.18

**Primary Dependencies**: Next.js App Router, Firebase client/admin SDKs, i18next/react-i18next, Tailwind/Sass, existing AdSense placement utilities

**Storage**: No new persistent storage. Existing Firebase data remains read-only for this feature except current ranking reads that already exist.

**Testing**: `npm run check:tsc`, `npm run lint`, `npm run check:i18n`, `npm run build`; targeted manual verification of generated `/robots.txt`, `/sitemap.xml`, `/ads.txt`, metadata, public page content, and Search Console submission after preview/production deployment.

**Target Platform**: Production web app deployed through Vercel-compatible Next.js hosting, validated first on branch preview and `https://dev.click-battle.com.ar/` before production promotion.

**Project Type**: Web application using the Next.js `app/` directory.

**Performance Goals**: SEO additions must not materially worsen initial page load, Core Web Vitals eligibility, or gameplay responsiveness; metadata and discovery routes should be static or cached whenever possible.

**Constraints**: Preserve game room creation/joining, auth prompts, ranking, localization, AdSense script/`ads.txt`, and legal pages. Do not index admin, preview/dev, private, or ephemeral room URLs as durable search landing pages.

**Scale/Scope**: Small public route set: `/`, `/how-to-play`, `/ranking`, `/about/privacy-policy`, `/about/terms-of-service`, `/admin`, and dynamic `/game/[gameID]`. Legacy routes are out of scope because they are planned for removal. No large dynamic sitemap required for v1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Production Gameplay Stability**: PASS. The plan targets metadata, discovery, crawlable explanatory content, and route-level SEO decisions; gameplay and room state contracts are explicitly out of scope.
- **II. Next.js App Router With Respect For Existing Patterns**: PASS. The plan uses the active `app/` surface and explicitly avoids SEO investment in legacy routes because they are planned for removal.
- **III. Firebase-Backed Contract Discipline**: PASS. No new Firebase writes, data shapes, permissions, secrets, or migrations are planned.
- **IV. Verification Before Promotion**: PASS. Static checks, build, i18n checks, manual route verification, and post-deployment Search Console validation are included.
- **V. Branched Delivery And Incremental Safety**: PASS. Work is on dedicated branch `003-improve-page-seo`; promotion remains preview → `develop` → dev domain → production PR.

## Project Structure

### Documentation (this feature)

```text
specs/003-improve-page-seo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── seo-route-contract.md
│   └── search-console-validation-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── layout.tsx
├── page.tsx
├── robots.ts
├── sitemap.ts
├── ranking/
│   └── page.tsx
├── about/
│   ├── privacy-policy/page.tsx
│   └── terms-of-service/page.tsx
├── admin/page.tsx
├── game/[gameID]/page.tsx
components-new/
├── WelcomeMessage/
├── Ranking/
└── Footer/

i18n/
├── i18n-context.tsx
└── locales/resources used by public copy

public/
├── ads.txt
├── favicon.ico
└── logo/
```

**Structure Decision**: Use the existing Next.js App Router project structure. Implement route-level SEO closest to each public route, centralize shared SEO constants/helpers only if doing so avoids duplicated metadata mistakes, keep `public/ads.txt` in place, and prefer App Router metadata files for `robots` and `sitemap`.

## Phase 0: Research

Research output is captured in [research.md](./research.md). All technical unknowns were resolved:

- Next.js metadata and file conventions for App Router SEO.
- Sitemap and canonical URL strategy for a small public route set.
- Robots and noindex decisions for admin, transient game rooms, and dev/preview hosts.
- Search Console and AdSense validation flow.
- Localization and crawlable content strategy.

## Phase 1: Design & Contracts

Design artifacts:

- [data-model.md](./data-model.md): SEO inventory, presentation profile, indexing decision, validation report, and AdSense surface.
- [contracts/seo-route-contract.md](./contracts/seo-route-contract.md): expected metadata/indexing behavior by route pattern.
- [contracts/search-console-validation-contract.md](./contracts/search-console-validation-contract.md): post-deployment validation workflow and acceptance evidence.
- [quickstart.md](./quickstart.md): implementation and validation steps.

## Post-Design Constitution Check

- **I. Production Gameplay Stability**: PASS. Contracts exclude gameplay behavior changes and require validation of create/join/ranking flows.
- **II. Next.js App Router With Respect For Existing Patterns**: PASS. App Router metadata conventions are used; legacy routes are excluded from SEO work because they are planned for removal.
- **III. Firebase-Backed Contract Discipline**: PASS. Ranking remains existing read behavior; no new Firebase writes or schema changes.
- **IV. Verification Before Promotion**: PASS. Quickstart defines local static/build checks plus preview/dev/production Search Console checks.
- **V. Branched Delivery And Incremental Safety**: PASS. Scope is incremental and branch-local.

## Complexity Tracking

No constitution violations require justification.
