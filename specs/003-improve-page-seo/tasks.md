# Tasks: Mejorar SEO de la página

**Input**: Design documents from `specs/003-improve-page-seo/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Automated tests were not explicitly requested. This task list includes required static/build checks and manual SEO validation tasks from the quickstart and validation contract.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently. Legacy routes are intentionally out of scope because they are planned for removal.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the current SEO surface before changing code.

- [X] T001 Confirm feature context and implementation constraints in specs/003-improve-page-seo/plan.md
- [X] T002 [P] Inspect existing root metadata, manual `<head>` tags, and AdSense script placement in app/layout.tsx
- [X] T003 [P] Inspect current crawler and ad authorization files in public/robots.txt and public/ads.txt

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared SEO infrastructure required before user story work.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Create shared production SEO constants for site name, production origin, default descriptions, and share image in lib/seo/config.ts
- [X] T005 Create active route inventory and indexing decisions excluding legacy routes in lib/seo/routes.ts
- [X] T006 Create reusable Metadata helpers for title templates, canonical URLs, Open Graph, Twitter cards, and robots directives in lib/seo/metadata.ts
- [X] T007 Update root layout metadata defaults while preserving AdSense loading and non-SEO scripts in app/layout.tsx

**Checkpoint**: Shared SEO constants, route inventory, and metadata helpers are ready.

---

## Phase 3: User Story 1 - Indexar correctamente las páginas públicas (Priority: P1) MVP

**Goal**: Google can discover intended public pages and avoid private, transient, duplicate, or legacy surfaces.

**Independent Test**: Load `/sitemap.xml`, `/robots.txt`, `/admin`, and a representative `/game/[gameID]`; verify sitemap includes only indexable production URLs, robots references the sitemap, admin is excluded, game rooms are not listed, and legacy receives no SEO-specific work.

### Implementation for User Story 1

- [X] T008 [US1] Implement canonical production sitemap entries for `/`, `/how-to-play`, `/ranking`, `/about/privacy-policy`, and `/about/terms-of-service` in app/sitemap.ts
- [X] T009 [US1] Implement crawler rules with sitemap reference and route-level admin exclusion in app/robots.ts
- [X] T010 [US1] Remove or neutralize obsolete static crawler rules after app/robots.ts is active in public/robots.txt
- [X] T011 [P] [US1] Add route-level noindex behavior for the admin surface in app/admin/page.tsx
- [X] T012 [P] [US1] Add route-level noindex or canonical-to-home behavior for transient game rooms in app/game/[gameID]/page.tsx
- [X] T013 [US1] Verify the active SEO route inventory omits legacy routes and only lists in-scope routes in lib/seo/routes.ts

**Checkpoint**: User Story 1 is independently functional and testable through crawler files plus route metadata.

---

## Phase 4: User Story 2 - Mejorar cómo se presenta Click Battle en resultados y compartidos (Priority: P2)

**Goal**: Public indexable pages have clear search/social snippets and crawlable explanatory content.

**Independent Test**: Load `/`, `/ranking`, privacy policy, and terms; inspect rendered HTML/head for unique title, description, canonical URL, Open Graph, Twitter card, and visible/crawlable page copy.

### Implementation for User Story 2

- [X] T014 [US2] Move the current client-only home implementation from app/page.tsx to app/page-client.tsx
- [X] T015 [US2] Rebuild app/page.tsx as a server route that exports home metadata and renders app/page-client.tsx
- [X] T016 [P] [US2] Add ranking-specific metadata and canonical behavior in app/ranking/page.tsx
- [X] T017 [P] [US2] Add privacy-policy-specific metadata and canonical behavior in app/about/privacy-policy/page.tsx
- [X] T018 [P] [US2] Add terms-of-service-specific metadata and canonical behavior in app/about/terms-of-service/page.tsx
- [X] T019 [P] [US2] Add English SEO copy keys for home and ranking explanatory content in i18n/locales/en/translation.json
- [X] T020 [P] [US2] Add Spanish SEO copy keys for home and ranking explanatory content in i18n/locales/es/translation.json
- [X] T021 [P] [US2] Add Portuguese SEO copy keys for home and ranking explanatory content in i18n/locales/pr/translation.json
- [X] T022 [US2] Render crawlable home explanatory content without breaking the existing room UI in components-new/WelcomeMessage/index.tsx
- [X] T023 [US2] Render crawlable ranking explanatory content without changing ranking calculations in components-new/Ranking/index.tsx

**Checkpoint**: User Story 2 is independently functional and testable by inspecting public page snippets and copy.

---

## Phase 5: User Story 3 - Validar crecimiento SEO sin romper AdSense ni experiencia de juego (Priority: P3)

**Goal**: The owner can validate Search Console improvements and confirm AdSense/gameplay were not regressed.

**Independent Test**: Complete the validation report using local/preview evidence, then later fill production Search Console and AdSense results after deployment.

### Implementation for User Story 3

- [X] T024 [P] [US3] Create the SEO validation report template in specs/003-improve-page-seo/validation-report.md
- [X] T025 [US3] Record the Search Console baseline values from the provided screenshot in specs/003-improve-page-seo/validation-report.md
- [X] T026 [US3] Add preview and develop-environment validation checklist items in specs/003-improve-page-seo/validation-report.md
- [X] T027 [US3] Add production Search Console sitemap, URL Inspection, indexing, and 30-day monitoring checklist items in specs/003-improve-page-seo/validation-report.md
- [X] T028 [US3] Add AdSense validation evidence for `/ads.txt`, ad visibility, and legal page access in specs/003-improve-page-seo/validation-report.md and public/ads.txt

**Checkpoint**: User Story 3 is independently functional as a validation workflow ready for preview, develop, and production follow-up.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across all stories.

- [X] T029 Run TypeScript validation with `npm run check:tsc` using package.json
- [X] T030 Run lint validation with `npm run lint` using package.json
- [X] T031 Run localization validation with `npm run check:i18n` using package.json
- [X] T032 Run production build validation with `npm run build` using package.json
- [X] T033 Inspect `/`, `/how-to-play`, `/ranking`, `/about/privacy-policy`, `/about/terms-of-service`, `/robots.txt`, `/sitemap.xml`, and `/ads.txt` per specs/003-improve-page-seo/quickstart.md
- [X] T034 Update local verification outcomes and remaining deployment follow-ups in specs/003-improve-page-seo/validation-report.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; recommended MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational; can run after or in parallel with US1 if file conflicts are coordinated.
- **User Story 3 (Phase 5)**: Depends on Foundational; can begin once the validation report structure is useful, but final evidence depends on US1/US2 implementation.
- **Polish (Phase 6)**: Depends on all implemented user stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3; delivers the MVP indexing/discovery layer.
- **US2 (P2)**: Uses shared metadata helpers from Phase 2; independent of US3.
- **US3 (P3)**: Validation can be prepared independently, but final report completion depends on US1 and US2 outputs.

### Within Each User Story

- US1: `app/sitemap.ts` and `app/robots.ts` should be created before route exclusions are manually verified.
- US2: T014 must happen before T015 because `app/page.tsx` is currently client-only.
- US2: Translation-key tasks T019-T021 can run in parallel, then T022-T023 can consume those keys.
- US3: T024 must happen before T025-T028 because the report file must exist first.

---

## Parallel Opportunities

- T002 and T003 can run in parallel during setup.
- After Phase 2, T011 and T012 can run in parallel for US1 because they touch different routes.
- T016, T017, and T018 can run in parallel for US2 because they touch different pages.
- T019, T020, and T021 can run in parallel for US2 because they touch different locale files.
- T024 can run in parallel with code implementation if the validation report template does not depend on completed code.

## Parallel Example: User Story 1

```text
Task: "Add route-level noindex behavior for the admin surface in app/admin/page.tsx"
Task: "Add route-level noindex or canonical-to-home behavior for transient game rooms in app/game/[gameID]/page.tsx"
```

## Parallel Example: User Story 2

```text
Task: "Add ranking-specific metadata and canonical behavior in app/ranking/page.tsx"
Task: "Add privacy-policy-specific metadata and canonical behavior in app/about/privacy-policy/page.tsx"
Task: "Add terms-of-service-specific metadata and canonical behavior in app/about/terms-of-service/page.tsx"
```

```text
Task: "Add English SEO copy keys for home and ranking explanatory content in i18n/locales/en/translation.json"
Task: "Add Spanish SEO copy keys for home and ranking explanatory content in i18n/locales/es/translation.json"
Task: "Add Portuguese SEO copy keys for home and ranking explanatory content in i18n/locales/pr/translation.json"
```

## Parallel Example: User Story 3

```text
Task: "Create the SEO validation report template in specs/003-improve-page-seo/validation-report.md"
Task: "Continue code implementation for US1 or US2 after Phase 2 is complete"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational SEO helpers.
3. Complete Phase 3: User Story 1.
4. Stop and validate `/sitemap.xml`, `/robots.txt`, `/admin`, and `/game/[gameID]`.
5. Continue only after crawler/indexing behavior matches the route contract.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Add US1 indexing/discovery and validate independently.
3. Add US2 snippets/crawlable content and validate independently.
4. Add US3 validation reporting and follow-up workflow.
5. Run Phase 6 checks before preview/develop validation.

### Notes

- Do not create SEO tasks for `app/legacy/*`; legacy routes are planned for removal.
- Keep `public/ads.txt` reachable and preserve the existing Google publisher entry.
- Avoid Firebase writes while validating previews/dev unless explicitly approved.
- Commit after logical groups only if the optional Spec Kit git hook is intentionally executed.
