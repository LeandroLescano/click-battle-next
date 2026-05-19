# Click Battle Web Constitution

## Core Principles

### I. Production Gameplay Stability
Changes must preserve live gameplay, room flow, auth flow, ranking flow, and localization behavior. Features that alter game rules, realtime room behavior, user identity, or persistence must define the expected player-visible behavior before implementation and must avoid silent regressions in legacy routes that still serve production traffic.

### II. Next.js App Router With Respect For Existing Patterns
New web work must fit the current Next.js and TypeScript application structure and should prefer the active `app/` surface while respecting still-live legacy code paths. Rewrites or framework migrations are not incidental work and require an explicit spec decision. Reuse existing shared components, hooks, contexts, services, i18n utilities, and design tokens before introducing parallel abstractions.

### III. Firebase-Backed Contract Discipline
Code that touches Firebase auth, Firestore, Realtime Database, server routes, or backup/emulator flows must preserve environment separation and existing data contracts. Secrets stay in environment configuration, never in source. Changes to data shape, permissions, or side effects must document compatibility, migration needs, and local emulator or environment assumptions.

### IV. Verification Before Promotion
Every feature change must define the minimum verification needed to prove it is safe. At a minimum, this includes targeted static checks for the touched area and manual or automated validation for user-facing behavior. Changes affecting gameplay, auth, rooms, ranking, payments, analytics, or production-only integrations should add or update Playwright coverage when the flow is testable.

### V. Branched Delivery And Incremental Safety
Web changes do not go directly to `master`. Work should land on a dedicated feature branch, be validated on the branch preview when available, merge into `develop`, then be validated on `https://dev.click-battle.com.ar/` before promotion to `master` by PR. Keep changes small enough to isolate risk, review clearly, and roll forward without broad refactors.

## Technical Guardrails

- Primary stack: Next.js, React, TypeScript, Firebase, i18next, Tailwind/CSS/Sass, Playwright.
- Prefer modifying existing modules over creating duplicate `*-new` versus legacy implementations unless the spec explicitly calls for migration work.
- Preserve localization quality. New user-facing copy must go through the existing i18n system and should not be hardcoded into components.
- Preserve observability already in place, including Sentry-related behavior, unless the change intentionally adjusts monitoring.
- Avoid destructive scripts or repository cleanup as part of feature work unless explicitly requested and reviewed.

## Workflow And Quality Gates

1. Use the Spec Kit flow for feature work: specify, plan, tasks, implement.
2. Record assumptions when a feature depends on branch previews, Firebase emulator data, external services, or environment variables.
3. Run the smallest meaningful validation set for the touched area, such as `npm run lint`, `npm run check:tsc`, `npm run check:i18n`, or targeted `npm run test`.
4. For UI changes, verify desktop and mobile behavior and confirm that affected translations, loading states, and error states still work.
5. For risky changes, document what was validated locally and what still requires preview or `develop` environment verification.

## Governance

This constitution governs Spec Kit artifacts in this repository and supersedes conflicting local feature habits. Specs, plans, and tasks must reference these rules when defining scope, risk, and validation. Amendments require updating this file in the same change that introduces the new rule, with the rationale reflected in the related spec or plan.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
