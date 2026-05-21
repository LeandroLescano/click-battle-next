# Implementation Plan: Reaction Battle Web Mode

**Branch**: `001-reaction-battle-web-mode` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reaction-battle-web-mode/spec.md`

## Summary

Add Reaction Battle as the first alternate playable room mode while preserving the existing classic-speed flow. The implementation will update the web app to consume the shared core game mode contract, persist `gameMode` and `modeSettings` on room creation, label room modes in entry and game surfaces, route `/game/[gameID]` rendering by normalized `gameMode`, and add a minimal Firebase-backed Reaction Battle session with scheduled shared signals, local reaction measurement, false-start handling, and deterministic result comparison.

## Technical Context

**Language/Version**: TypeScript 5.9, React 18.2, Next.js 14.2 App Router

**Primary Dependencies**: `@leandrolescano/click-battle-core` latest published `1.3.0`, Firebase v9 Realtime Database/Auth/Analytics, React i18next, Tailwind/Sass, Font Awesome

**Storage**: Firebase Realtime Database `games/{gameId}` for live rooms and player results; Firestore room stats remain for existing stats capture

**Testing**: Playwright E2E (`npm run test`), TypeScript (`npm run check:tsc`), Next lint (`npm run lint`), translation validation (`npm run check:i18n`)

**Target Platform**: Desktop and mobile web browsers served by the existing Next.js app

**Project Type**: Single Next.js web application with Firebase-backed realtime gameplay

**Performance Goals**: Room lists and game screens should remain responsive at current production scale; reaction signals should be scheduled with enough future buffer for joined clients to receive them before display; reaction clicks should update visible result state within normal Firebase realtime latency; UI must avoid layout overflow on mobile widths

**Constraints**: Preserve legacy rooms without `gameMode`; keep classic gameplay compatible; keep new user-facing copy in i18n files; avoid broad schema migration; use the shared core for room creation and normalized room interpretation

**Scale/Scope**: One complete vertical slice for two supported web modes, `classic-speed` and `reaction`, touching room creation, room list labels, game routing, minimal reaction play, and verification coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Production Gameplay Stability**: PASS. Plan preserves classic-speed as default and explicitly requires legacy rooms without `gameMode` to route to classic-speed.
- **Next.js App Router With Existing Patterns**: PASS. Plan targets current `app/`, `components-new/`, `hooks/`, `lib/game/`, `interfaces/`, and tests without framework migration.
- **Firebase-Backed Contract Discipline**: PASS. Plan documents only additive room fields and mode-specific session state; no secrets or large migration required.
- **Verification Before Promotion**: PASS. Plan includes TypeScript, lint, i18n, and Playwright coverage for room creation, mode routing, false starts, valid reactions, and legacy fallback.
- **Branched Delivery And Incremental Safety**: PASS. Work is already on feature branch `001-reaction-battle-web-mode` and scoped to a single feature slice.

## Project Structure

### Documentation (this feature)

```text
specs/001-reaction-battle-web-mode/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- reaction-battle-mode-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- page.tsx                         # room list join flow and room mode labels
`-- game/[gameID]/page.tsx           # route game rendering by normalized mode

components-new/
|-- CreateSection/index.tsx          # room creation mode selector and normalized room persistence
|-- CardGame/index.tsx               # room mode label in room cards
|-- LocalSection/index.tsx           # existing classic-speed local panel remains
|-- OpponentSection/index.tsx        # existing classic-speed opponent panel remains
|-- ResultSection/index.tsx          # existing classic-speed result panel remains
`-- ReactionBattle/                  # new minimal reaction mode UI

contexts/
`-- GameContext.tsx                  # normalized room state continues to expose current game

hooks/
|-- useRoomGame.ts                   # snapshot normalization and join behavior
`-- gameTimer.ts                     # classic-speed timer remains unchanged

interfaces/
|-- Game.ts                          # shared core type surface
|-- Room.ts                          # room creation draft gains mode inputs
`-- RoomStats.ts                     # optional mode annotation for room stats if needed

lib/game/
|-- processSnapshot.ts               # shared core parse/normalize is the source of truth
|-- applyState.ts                    # room stats and mode-aware state application
|-- reactionBattle.ts                # deterministic reaction result helpers if useful
`-- serverTimeOffset.ts              # Firebase server time offset helper if useful

i18n/locales/
|-- en/translation.json
|-- es/translation.json
`-- pr/translation.json              # new mode labels and reaction UI copy

tests/e2e/
|-- fixtures.ts                      # helper can create classic or reaction rooms
`-- game.spec.ts                     # coverage for classic, reaction, and legacy fallback
```

**Structure Decision**: Extend the existing single Next.js app. Keep classic-speed components in place and add a dedicated `components-new/ReactionBattle/` UI selected by normalized `currentGame.gameMode`. Use `lib/game/` only for reusable pure helpers that keep reaction state comparisons deterministic and testable.

## Complexity Tracking

No constitution violations or additional complexity exceptions are required.

## Phase 0: Research

Research outcomes are recorded in [research.md](./research.md). The key decisions are:

- Update `@leandrolescano/click-battle-core` to `1.3.0` during implementation because installed `1.2.2` lacks `gameMode`, `modeSettings`, `NormalizedGame`, and mode normalization helpers.
- Use core normalization as the only room creation and snapshot interpretation source of truth.
- Store Reaction Battle live session data under the game room as additive mode-specific state.
- Use a host-created scheduled signal timestamp to coordinate the round, then measure each player's reaction locally from when that client displayed the signal and persist `reactionMs` for deterministic comparison.

## Phase 1: Design And Contracts

Design artifacts are recorded in:

- [data-model.md](./data-model.md)
- [contracts/reaction-battle-mode-contract.md](./contracts/reaction-battle-mode-contract.md)
- [quickstart.md](./quickstart.md)

### Post-Design Constitution Check

- **Production Gameplay Stability**: PASS. The design isolates Reaction Battle rendering and leaves classic-speed components/timer behavior intact.
- **Next.js App Router With Existing Patterns**: PASS. The design reuses existing pages, components, hooks, Firebase services, and i18n files.
- **Firebase-Backed Contract Discipline**: PASS. The design uses additive fields and core-normalized fallback for legacy data.
- **Verification Before Promotion**: PASS. Quickstart and future tasks must include targeted checks plus Playwright acceptance coverage.
- **Branched Delivery And Incremental Safety**: PASS. No broad migration, rewrite, or unrelated cleanup is required.
