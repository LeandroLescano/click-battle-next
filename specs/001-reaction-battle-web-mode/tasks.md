# Tasks: Reaction Battle Web Mode

**Input**: Design documents from `/specs/001-reaction-battle-web-mode/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reaction-battle-mode-contract.md, quickstart.md

**Tests**: Required by FR-016 and the constitution for gameplay and room-flow changes. Playwright coverage is included before implementation tasks for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on an incomplete task.
- **[Story]**: Maps to the user story from spec.md.
- Every task includes an exact repository-relative file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the shared package contract and local type surface before feature work.

- [ ] T001 Update `@leandrolescano/click-battle-core` to `1.3.0` and refresh dependency metadata in `package.json` and `package-lock.json`
- [ ] T002 Verify the installed core package exposes `GameMode`, `GameModeSettings`, `NormalizedGame`, `normalizeRoomCreation`, and `parseGameSnapshot` via imports used in `interfaces/Game.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared mode/session types and helpers that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Extend room draft typing for `gameMode` and `modeSettings` in `interfaces/Room.ts`
- [ ] T004 Add local Reaction Battle session and result types in `interfaces/ReactionBattle.ts`
- [ ] T005 [P] Add mode label and normalization helper functions in `lib/game/gameModes.ts`
- [ ] T006 [P] Add deterministic reaction result helper functions in `lib/game/reactionBattle.ts`
- [ ] T007 [P] Add Firebase server time offset helper for scheduled signals in `lib/game/serverTimeOffset.ts`

**Checkpoint**: Foundation ready; user story implementation can now begin.

---

## Phase 3: User Story 1 - Create Rooms By Game Mode (Priority: P1) MVP

**Goal**: Players can create classic-speed or Reaction Battle rooms, and room surfaces show the selected mode.

**Independent Test**: Create one classic-speed room and one reaction room, then verify both display the selected mode and persist normalized mode metadata.

### Tests for User Story 1

- [ ] T008 [US1] Add Playwright coverage for classic-speed and reaction room creation plus visible mode labels in `tests/e2e/game.spec.ts`
- [ ] T009 [US1] Extend the Playwright room creation helper to accept a game mode option in `tests/e2e/fixtures.ts`

### Implementation for User Story 1

- [ ] T010 [US1] Add game mode state and selector controls to room creation in `components-new/CreateSection/index.tsx`
- [ ] T011 [US1] Pass selected `gameMode` and `modeSettings` through `normalizeRoomCreation` and persist normalized fields in `components-new/CreateSection/index.tsx`
- [ ] T012 [US1] Normalize room list snapshots enough to display legacy rooms as classic-speed in `app/page.tsx`
- [ ] T013 [US1] Render readable room mode labels in room cards in `components-new/CardGame/index.tsx`
- [ ] T014 [P] [US1] Add English game mode and room creation labels in `i18n/locales/en/translation.json`
- [ ] T015 [P] [US1] Add Spanish game mode and room creation labels in `i18n/locales/es/translation.json`
- [ ] T016 [P] [US1] Add Puerto Rico locale game mode and room creation labels in `i18n/locales/pr/translation.json`

**Checkpoint**: User Story 1 is functional when classic and reaction rooms can be created, listed, joined, and visually distinguished.

---

## Phase 4: User Story 2 - Play A Reaction Battle Room (Priority: P2)

**Goal**: Two players in a reaction room see Reaction Battle UI, wait for a scheduled signal, record false starts, record valid local `reactionMs`, and see deterministic results.

**Independent Test**: Have two players join a reaction room, start a session, click before the signal to confirm false start, then complete a valid post-signal result and verify winner display.

### Tests for User Story 2

- [ ] T017 [US2] Add Playwright coverage for two-player reaction room routing, false start handling, valid `reactionMs`, and winner display in `tests/e2e/game.spec.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Route `/game/[gameID]` rendering by normalized `currentGame.gameMode` in `app/game/[gameID]/page.tsx`
- [ ] T019 [US2] Create the Reaction Battle UI shell with waiting, scheduled, signal, false-start, valid-result, and ended states in `components-new/ReactionBattle/index.tsx`
- [ ] T020 [US2] Implement host start/reset behavior that writes future `signalAt`, `signalDelayMs`, and `syncBufferMs` in `components-new/ReactionBattle/index.tsx`
- [ ] T021 [US2] Use server-time-adjusted scheduling to display the signal locally in `components-new/ReactionBattle/index.tsx`
- [ ] T022 [US2] Persist false-start results for clicks before the local signal display in `components-new/ReactionBattle/index.tsx`
- [ ] T023 [US2] Persist valid results with `signalShownAt`, `clickedAt`, and `reactionMs` after local signal display in `components-new/ReactionBattle/index.tsx`
- [ ] T024 [US2] Calculate deterministic reaction winner from persisted `reactionMs` using helpers in `lib/game/reactionBattle.ts`
- [ ] T025 [US2] Render reaction player statuses, result list, and winner messaging in `components-new/ReactionBattle/index.tsx`
- [ ] T026 [P] [US2] Add English Reaction Battle gameplay copy in `i18n/locales/en/translation.json`
- [ ] T027 [P] [US2] Add Spanish Reaction Battle gameplay copy in `i18n/locales/es/translation.json`
- [ ] T028 [P] [US2] Add Puerto Rico locale Reaction Battle gameplay copy in `i18n/locales/pr/translation.json`

**Checkpoint**: User Story 2 is functional when both players see reaction-specific UI and a false start cannot beat a valid reaction.

---

## Phase 5: User Story 3 - Preserve Classic And Legacy Rooms (Priority: P3)

**Goal**: Existing rooms without mode metadata and newly created classic-speed rooms continue to use the current classic click-speed gameplay.

**Independent Test**: Open a legacy room without `gameMode` and a new classic-speed room, then verify both route to classic-speed and existing gameplay still passes.

### Tests for User Story 3

- [ ] T029 [US3] Add Playwright coverage for a legacy room without `gameMode` routing to classic-speed in `tests/e2e/game.spec.ts`
- [ ] T030 [US3] Add a Playwright helper for seeding or mutating a room without `gameMode` in `tests/e2e/fixtures.ts`

### Implementation for User Story 3

- [ ] T031 [US3] Preserve normalized legacy fallback behavior when processing room snapshots in `lib/game/processSnapshot.ts`
- [ ] T032 [US3] Ensure `useRoomGame` stores normalized `gameMode` and `modeSettings` without dropping existing classic fields in `hooks/useRoomGame.ts`
- [ ] T033 [US3] Keep classic-speed timer, click button, opponent list, and results wired to existing components in `app/game/[gameID]/page.tsx`
- [ ] T034 [US3] Include optional room mode annotation without breaking existing stats shape in `interfaces/RoomStats.ts`
- [ ] T035 [US3] Populate optional room mode stats only when available in `lib/game/applyState.ts`

**Checkpoint**: User Story 3 is functional when legacy and new classic rooms pass the current classic gameplay path.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility, responsiveness, and delivery readiness.

- [ ] T036 [P] Verify the mode selector fits mobile and desktop layouts in `components-new/CreateSection/index.tsx`
- [ ] T037 [P] Verify Reaction Battle touch targets and status text fit mobile and desktop layouts in `components-new/ReactionBattle/index.tsx`
- [ ] T038 Run TypeScript validation with `rtk npm run check:tsc` using `tsconfig.json`
- [ ] T039 Run lint validation with `rtk npm run lint` using `package.json`
- [ ] T040 Run translation validation with `rtk npm run check:i18n` using `check-translations.js`
- [ ] T041 Run targeted Playwright gameplay validation with `rtk npm run test -- tests/e2e/game.spec.ts` using `playwright.config.ts`
- [ ] T042 Record final manual verification notes from `specs/001-reaction-battle-web-mode/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and benefits from US1 for creating reaction rooms through the UI.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and should be validated after US1/US2 routing changes.
- **Polish (Phase 6)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **US1 Create Rooms By Game Mode**: Required MVP and enables normal UI creation of reaction rooms.
- **US2 Play A Reaction Battle Room**: Can be implemented after Foundational, but easiest after US1 because reaction rooms can then be created through the UI.
- **US3 Preserve Classic And Legacy Rooms**: Can be tested independently with seeded rooms, but should be completed before shipping because it protects production compatibility.

### Within Each User Story

- Write or update Playwright coverage before implementation tasks.
- Implement shared types/helpers before UI wiring.
- Persist data contract before rendering dependent UI.
- Complete each story checkpoint before moving to final polish.

## Parallel Opportunities

- T005, T006, and T007 can run in parallel after T003 and T004 are understood.
- T014, T015, and T016 can run in parallel once US1 copy keys are known.
- T026, T027, and T028 can run in parallel once US2 copy keys are known.
- T036 and T037 can run in parallel during polish because they touch different UI surfaces.

## Parallel Example: User Story 1

```text
Task: "Add English game mode and room creation labels in i18n/locales/en/translation.json"
Task: "Add Spanish game mode and room creation labels in i18n/locales/es/translation.json"
Task: "Add Puerto Rico locale game mode and room creation labels in i18n/locales/pr/translation.json"
```

## Parallel Example: User Story 2

```text
Task: "Add English Reaction Battle gameplay copy in i18n/locales/en/translation.json"
Task: "Add Spanish Reaction Battle gameplay copy in i18n/locales/es/translation.json"
Task: "Add Puerto Rico locale Reaction Battle gameplay copy in i18n/locales/pr/translation.json"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for US1.
3. Stop and validate that classic-speed and reaction rooms can be created and labeled.

### Incremental Delivery

1. Deliver US1 so room mode creation and labels exist.
2. Deliver US2 so Reaction Battle is playable.
3. Deliver US3 so legacy and classic compatibility is proven.
4. Complete polish and verification before preview validation.

### Validation Gate

Before considering the feature ready, run:

```powershell
rtk npm run check:tsc
rtk npm run lint
rtk npm run check:i18n
rtk npm run test -- tests/e2e/game.spec.ts
```

## Notes

- `[P]` tasks touch separate files and can be parallelized.
- `[US1]`, `[US2]`, and `[US3]` labels map directly to spec.md user stories.
- Reaction winner comparison must use persisted `reactionMs`, not raw cross-client timestamps.
- Classic-speed remains the fallback for missing `gameMode`.
- Avoid broad refactors outside the listed files unless implementation reveals a direct blocker.
