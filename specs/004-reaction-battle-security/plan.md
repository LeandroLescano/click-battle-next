# Implementation Plan: Reaction Battle Security and Reliability

**Branch**: `004-reaction-battle-security` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-reaction-battle-security/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Harden Reaction Battle without changing its player-facing game-mode contract. Replace broad authenticated database writes with granular ownership and immutable-result rules; represent each new round as a distinct, host-created round so players can write exactly one result to their own path. Confirm host transitions remotely before completing them locally, make server-time readiness explicit, and move ranking/statistic persistence behind a trusted application path. Preserve classic-speed for newly created rooms; deployment deletes existing live rooms instead of supporting a data migration.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3; Next.js 15.5.18; React 18.2.0

**Primary Dependencies**: Firebase Auth, Realtime Database, Firestore, Firebase Admin SDK for trusted persistence, i18next, Playwright; add Firebase Emulator rules-unit testing support if it is not already installed.

**Storage**: Firebase Realtime Database for live rooms and immutable reaction-round results; Firestore for persisted room statistics and public ranking inputs.

**Testing**: `npm run check:tsc`, `npm run lint`, `npm run check:i18n`, focused unit tests, Firebase Emulator authorization tests for Realtime Database and Firestore, and Playwright reaction/classic regression coverage.

**Target Platform**: Vercel-compatible Next.js web application with Firebase Emulator Suite locally; preview then `develop` validation before production promotion.

**Project Type**: Multiplayer web application.

**Performance Goals**: Preserve existing reaction input responsiveness; one accepted result per player per round; no extra player-visible round delay beyond the existing scheduling buffer; successful transition retry without a page reload.

**Constraints**: No unrestricted authenticated write at existing-room roots; no client-owned ranked statistic persistence; server-time offset zero is not readiness; retain classic-speed for rooms created after deployment; deployment deletes pre-existing rooms; no authoritative anti-cheat claim for browser-measured reaction time.

**Scale/Scope**: Existing room and ranking surfaces only: live room paths, host leases/presence/cleanup signals, Reaction Battle UI/helpers, room-stat persistence, public ranking, Firebase configuration/rules, and their targeted tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Production Gameplay Stability**: PASS. The plan retains post-deployment classic flows, adds explicit compatibility tests, and limits new behavior to Reaction Battle authorization/reliability.
- **II. Next.js App Router With Respect For Existing Patterns**: PASS. It modifies the existing room hooks, Reaction Battle component, helpers, services, and ranking route rather than introducing a parallel game surface.
- **III. Firebase-Backed Contract Discipline**: PASS. RTDB/Firestore schemas, rules, emulator configuration, ownership compatibility, trusted persistence, and deployment verification are documented. No secrets are added.
- **IV. Verification Before Promotion**: PASS. The plan requires deterministic emulator, unit, and Playwright coverage plus preview/dev validation.
- **V. Branched Delivery And Incremental Safety**: PASS. Work is isolated on `004-reaction-battle-security` and follows preview → `develop` → dev-domain → production PR delivery.

## Project Structure

### Documentation (this feature)

```text
specs/004-reaction-battle-security/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── ranking/page.tsx
└── api/                              # trusted, authenticated statistics persistence route
components-new/
├── ReactionBattle/index.tsx
├── CreateSection/
├── LocalSection/
├── OpponentSection/
└── SettingsSidebar/
hooks/
└── useRoomGame.ts
interfaces/
└── ReactionBattle.ts
lib/game/
├── hostLease.ts
├── hostPresence.ts
├── reactionBattle.ts
├── roomCleanup.ts
└── serverTimeOffset.ts
services/
└── rooms.ts
database.rules.json
firestore.rules
firebase.json
tests/
├── e2e/game.spec.ts
├── e2e/fixtures.ts
├── rules/                             # RTDB and Firestore emulator authorization tests
└── unit/                              # reaction validation, transitions, time readiness
```

**Structure Decision**: Retain the current Next.js application and Firebase surfaces. Add only a narrowly-scoped trusted application route for deriving and persisting completed-room statistics, because declarative cross-store rules cannot prove that a client-supplied Firestore ranking entry corresponds to immutable RTDB results. Keep reaction validation and transition helpers close to `lib/game/`; keep user-facing retry/synchronization behavior in the existing Reaction Battle UI.

## Phase 0: Research

Research is captured in [research.md](./research.md). It resolves the key design decisions:

- Existing room roots must never grant a broad write because child restrictions cannot override a permitted parent.
- `ownerUser.key` is the stable host UID; UI `isHost` and username are not security authorities. Rooms without a reliable owner are removed at deployment rather than granted a compatibility path.
- Fresh immutable rounds must be represented by a round identity rather than resetting or overwriting a shared result map.
- Firebase rules can validate shape, identity, state, and plausibility but cannot authenticate client reaction measurement or dynamically recompute an arbitrary winner map; derived ranking/statistics therefore require a trusted writer.
- Existing ghost cleanup that lets arbitrary viewers delete rooms conflicts with least privilege and must move to a constrained owner/trusted cleanup path.
- Server-time readiness needs a separate boolean because a numeric offset of `0` can be valid.

## Phase 1: Design & Contracts

Design artifacts:

- [data-model.md](./data-model.md): ownership, immutable round schema, validation profile, lifecycle states, and compatibility policy.
- [contracts/realtime-room-authorization.md](./contracts/realtime-room-authorization.md): RTDB write ownership and transition contract.
- [contracts/statistics-ranking-integrity.md](./contracts/statistics-ranking-integrity.md): trusted statistics/ranking persistence and public eligibility contract.
- [contracts/reaction-ui-reliability.md](./contracts/reaction-ui-reliability.md): readiness, retry, idempotency, and player-visible error contract.
- [quickstart.md](./quickstart.md): local emulator, test, preview, and promotion verification steps.

## Post-Design Constitution Check

- **I. Production Gameplay Stability**: PASS. The data contract isolates Reaction Battle while contract tests cover join/leave/kick/host lease/cleanup and newly created classic journeys.
- **II. Next.js App Router With Respect For Existing Patterns**: PASS. The trusted route is a minimal App Router extension; live gameplay remains in its established components and hooks.
- **III. Firebase-Backed Contract Discipline**: PASS. Rules are repository-versioned and wired through `firebase.json`; emulator fixtures seed privileged test state separately from denial tests; cross-store derived data is written only through a trusted identity.
- **IV. Verification Before Promotion**: PASS. The quickstart has local rules/unit/E2E checks and preview/dev production-safe checks.
- **V. Branched Delivery And Incremental Safety**: PASS. Existing rooms are explicitly removed during rollout rather than migrated; rollout is branch-scoped and no direct master delivery occurs.

## Complexity Tracking

No constitution violations require justification.
