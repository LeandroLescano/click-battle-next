---
phase: 003-improve-page-seo
reviewed: 2026-07-26T03:37:38Z
depth: standard
review_type: targeted_fix_review
diff_base: origin/develop
files_reviewed: 24
files_reviewed_list:
  - app/about/privacy-policy/page.tsx
  - app/about/terms-of-service/page.tsx
  - app/admin/page.tsx
  - app/game/[gameID]/page.tsx
  - app/how-to-play/page.tsx
  - app/layout.tsx
  - app/opengraph-image.tsx
  - app/page-client.tsx
  - app/page.tsx
  - app/ranking/page.tsx
  - app/robots.ts
  - components-new/Loading/index.tsx
  - components-new/WelcomeMessage/index.tsx
  - i18n/locales/en/translation.json
  - i18n/locales/es/translation.json
  - i18n/locales/pr/translation.json
  - lib/seo/config.ts
  - lib/seo/metadata.ts
  - lib/seo/routes.ts
  - specs/003-improve-page-seo/contracts/search-console-validation-contract.md
  - specs/003-improve-page-seo/contracts/seo-route-contract.md
  - specs/003-improve-page-seo/data-model.md
  - specs/003-improve-page-seo/tasks.md
  - specs/003-improve-page-seo/validation-report.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
resolved_findings:
  critical: 4
  warning: 3
  total: 7
status: clean
---

# Phase 003: Targeted Fix Review

**Reviewed:** 2026-07-26T03:37:38Z  
**Depth:** standard  
**Base:** `origin/develop`  
**Files Reviewed:** 24  
**Status:** clean

## Summary

All six findings from the original review are resolved in the current working
tree. The only warning introduced during the first correction pass is also
resolved: the home loading branch now uses a fragment, leaving `Loading` as the
single `<main>` landmark.

This pass was intentionally static and limited to the six corrections. Per the
review request, build, lint, typecheck, and tests were not run.

All reviewed corrections now meet the requested quality standard. No open
issues remain.

## Resolved Findings

### CR-01: Home explanatory copy missing from the server response — RESOLVED

**Evidence:** `app/page.tsx:14-35`, `app/page-client.tsx:321-332`

The server route now owns an inner `Suspense` boundary whose localized fallback
contains the explanatory heading and paragraph. Because it is the closest
boundary around `HomeClientPage`, the global layout boundary no longer replaces
this SEO fallback when the client tree suspends. If the client tree renders
without suspending but authentication is still loading, its direct loading
branch emits the same copy. Both initial-render paths therefore preserve the
copy in HTML, while the loaded layout renders one visible `WelcomeMessage`.
The reported local production HTML inspection confirms that content is present.

### CR-02: `/admin` robots rule prevented crawlers from reading `noindex` — RESOLVED

**Evidence:** `app/robots.ts:7-13`

The global crawler rule now allows `/`, no longer disallows `/admin`, and keeps
the production sitemap reference. `/admin` still receives route-level
`noindex, nofollow` metadata through `createRouteMetadata("admin")`.

### CR-03: Localized HTML emitted English metadata and `en_US` — RESOLVED

**Evidence:** `lib/seo/metadata.ts:19-35`, `lib/seo/metadata.ts:81-123`

Metadata helpers now resolve the request language through server i18n, translate
route titles and descriptions, and map supported languages to `en_US`, `es_AR`,
and `pt_BR`. All affected routes use async `generateMetadata`, and corresponding
English, Spanish, and Portuguese metadata strings are present.

### CR-04: Social card used an SVG with `summary_large_image` — RESOLVED

**Evidence:** `app/opengraph-image.tsx:1-74`, `lib/seo/config.ts:5-9`

The share image is now generated as `image/png` at 1200×630. Open Graph metadata
declares the raster MIME type and dimensions, and Twitter/X references the same
generated image endpoint.

### WR-01: Home rendered two copies of its primary heading — RESOLVED

**Evidence:** `app/page-client.tsx:339-345`

The responsive layout now contains one loaded-state `WelcomeMessage`; the
separate mobile and desktop copies were removed.

### WR-02: `/how-to-play` was outside the sitemap and validation contract — RESOLVED

**Evidence:** `specs/003-improve-page-seo/contracts/seo-route-contract.md:20`,
`specs/003-improve-page-seo/contracts/search-console-validation-contract.md:18-40`,
`specs/003-improve-page-seo/data-model.md:21`

The route is now explicitly included in the route contract, sitemap inventory,
Search Console inspection checklist, task scope, and validation report.

### WR-03: The corrected loading state nested `<main>` landmarks — RESOLVED

**Evidence:** `app/page-client.tsx:321-329`

The loading branch now uses a fragment around `<Loading />` and the crawlable
copy. Because `Loading` supplies the only `<main>` in this branch, the invalid
nested landmark is gone.

---

_Reviewed: 2026-07-26T03:37:38Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard targeted fix review_
