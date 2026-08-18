# Tasks: Reaction Battle Security and Reliability

**Input**: Design documents from `specs/004-reaction-battle-security/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), and [contracts/](./contracts/)

**Tests**: Required by the specification. Create targeted unit and Firebase Emulator authorization tests before the relevant implementation, then extend deterministic Playwright coverage.

**Organization**: Tasks are grouped by user story so each increment can be built and verified independently after the shared security foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks once its prerequisite phase is complete.
- **[Story]**: User story this task delivers. Setup, foundation, and polish tasks intentionally have no story label.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make production rule deployment and isolated emulator testing reproducible.

- [X] T001 Wire `database.rules.json` and `firestore.rules` into the deployable emulator configuration in `firebase.json`.
- [X] T002 [P] Add the Firebase Emulator rules-test dependency and focused test commands in `package.json` and the lockfile.
- [X] T003 [P] Create privileged room-seeding and independently authenticated client helpers in `tests/rules/fixtures.ts`.
- [ ] T004 [P] Review and update the obsolete broad-access expectation in `scripts/verify-room-cleanup-rules.mjs` to match the new ownership contract.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared ownership, immutable-round, validation, and test foundations before changing any player-visible flow.

**⚠️ CRITICAL**: No user-story implementation starts until this phase is complete.

- [X] T005 Define the secure round, result, ownership, eligibility, and deterministic tie-break types in `interfaces/ReactionBattle.ts`.
- [ ] T006 [P] Add pure result-shape, plausibility (`100 ms` through round window), false-start terminality, and winner-order helpers with unit tests in `lib/game/reactionBattle.ts` and `tests/unit/reactionBattle.test.ts`.
- [ ] T007 [P] Change the server-time hook to expose `{ offsetMs, isReady }`, including listener-loss behavior, with unit tests in `lib/game/serverTimeOffset.ts` and `tests/unit/serverTimeOffset.test.ts`.
- [X] T008 Define the secure round-ID/current-round schema in `hooks/useRoomGame.ts` and `lib/game/reactionBattle.ts`, with no pre-deployment room migration or fallback.
- [ ] T009 Implement shared conditional transaction/retry primitives for host transitions, including pending, idempotent target-state, confirmation, and error reset behavior, in `lib/game/reactionBattle.ts` with unit tests in `tests/unit/reactionBattleTransitions.test.ts`.
- [X] T010 Add a baseline emulator authorization suite covering immutable owner identity, existing participant self actions, host lease/presence, kick, disconnect signal, and safe cleanup paths in `tests/rules/room-authorization.rules.test.ts`.

**Checkpoint**: Shared types, validation, readiness, transition semantics, and emulator fixture boundaries are ready; story work can proceed safely.

---

## Phase 3: User Story 1 - Play a protected reaction round (Priority: P1) 🎯 MVP

**Goal**: A participant can create exactly one valid personal result while cross-user writes, changes, deletes, and malformed values are rejected.

**Independent Test**: Two authenticated emulator clients can concurrently create their own valid result. Every cross-user, repeat, delete, malformed, invalid status/input/identity, and out-of-range reaction attempt is denied.

### Tests for User Story 1

- [X] T011 [P] [US1] Add RTDB Emulator allow/deny tests for own first result, cross-user paths, overwrite/delete, player-key/name mismatch, invalid status/input, malformed false starts, and reaction-time bounds in `tests/rules/reaction-results.rules.test.ts`.
- [X] T012 [P] [US1] Add a deterministic concurrent-two-player result-preservation test in `tests/rules/reaction-results.rules.test.ts`.
- [ ] T013 [P] [US1] Add focused Playwright scenarios for normal two-player outcomes, terminal false starts, and simultaneous submitted results in `tests/e2e/game.spec.ts`.

### Implementation for User Story 1

- [X] T014 [US1] Implement granular immutable participant result rules and payload validation for the secure current-round/result paths in `database.rules.json`.
- [X] T015 [US1] Replace root-level Reaction Battle result updates with a write-once participant result transaction using the shared validator in `components-new/ReactionBattle/index.tsx`.
- [X] T016 [US1] Update room synchronization and round reads for the new immutable current-round result shape in `hooks/useRoomGame.ts`.
- [ ] T017 [US1] Run the US1 unit, RTDB emulator, and targeted Playwright suites and fix only failures in `tests/unit/`, `tests/rules/`, and `tests/e2e/game.spec.ts`.

**Checkpoint**: A protected, immutable player-result round works independently without cross-user result tampering.

---

## Phase 4: User Story 2 - Run a host-controlled, reliable round (Priority: P1)

**Goal**: Only the verified host controls shared state, and failed start/promote/finalize/reset/lobby actions can recover without reload.

**Independent Test**: Emulator guests are denied every host transition; a host completes each legal transition once, and a simulated failed transition retries successfully with host/guest state convergence.

### Tests for User Story 2

- [X] T018 [P] [US2] Add RTDB Emulator tests for host-only create/reset/status/winner/lifecycle transitions and legal expected-state transitions in `tests/rules/reaction-transitions.rules.test.ts`.
- [ ] T019 [P] [US2] Add unit tests for transaction preconditions, duplicate activation, remote confirmation, failure guard reset, and deterministic finalization from current persisted results in `tests/unit/reactionBattleTransitions.test.ts`.
- [ ] T020 [P] [US2] Add Playwright failure/retry coverage for start, promote, finalize, reset, and return-to-lobby plus rapid double activation in `tests/e2e/game.spec.ts`.

### Implementation for User Story 2

- [X] T021 [US2] Restrict existing-room root writes; enforce immutable `ownerUser.key`, owner/lease continuity, granular host lifecycle writes, kick ownership, and safe disconnect/cleanup authorization in `database.rules.json`.
- [X] T022 [US2] Refactor host start, promotion, finalization, reset, and lobby actions to use the shared confirmed conditional transition primitives in `components-new/ReactionBattle/index.tsx`.
- [ ] T023 [US2] Update owner/host-lease and room lifecycle writers to use granular allowed paths and preserve join, leave, kick, password, host-presence, and ghost-room flows in `hooks/useRoomGame.ts`, `lib/game/hostLease.ts`, `lib/game/hostPresence.ts`, and `lib/game/roomCleanup.ts`.
- [X] T024 [US2] Add localized recoverable transition error/retry feedback in `components-new/ReactionBattle/index.tsx` and the affected resources under `i18n/`.
- [ ] T025 [US2] Re-run all room authorization and Reaction Battle transition suites, including guest/host reconnection consistency, in `tests/rules/` and `tests/e2e/game.spec.ts`.

**Checkpoint**: Guests cannot alter shared Reaction state; hosts can safely retry every shared transition and connected views converge.

---

## Phase 5: User Story 3 - Start only with a synchronized clock (Priority: P1)

**Goal**: A host cannot schedule an unsynchronized signal and receives clear localized waiting/recovery feedback.

**Independent Test**: Before a valid server-time offset arrives, host start is disabled with visible feedback; it enables after readiness and becomes unavailable predictably if the listener is lost.

### Tests for User Story 3

- [ ] T026 [P] [US3] Extend server-time readiness unit coverage for initial zero, valid zero, invalid snapshots, listener loss, and restoration in `tests/unit/serverTimeOffset.test.ts`.
- [ ] T027 [P] [US3] Add Playwright coverage for disabled-until-ready start, ready start scheduling, and readiness-loss feedback in `tests/e2e/game.spec.ts`.

### Implementation for User Story 3

- [X] T028 [US3] Consume explicit time readiness to disable Reaction start and prevent signal scheduling while unavailable in `components-new/ReactionBattle/index.tsx`.
- [X] T029 [US3] Add localized synchronizing and connection-recovery states without changing classic-speed controls in `components-new/ReactionBattle/index.tsx` and affected resources under `i18n/`.
- [ ] T030 [US3] Verify the server-time readiness and normal two-player round tests together in `tests/unit/serverTimeOffset.test.ts` and `tests/e2e/game.spec.ts`.

**Checkpoint**: Signal scheduling is synchronized or visibly blocked; classic controls remain unaffected.

---

## Phase 6: User Story 4 - Preserve valid outcomes and rankings (Priority: P2)

**Goal**: Invalid or suspicious client values cannot become winning statistics or public ranking data, while the client-measured limitation is represented accurately.

**Independent Test**: Direct client attempts to alter historical room statistics are denied; the trusted path accepts one eligible completed round and rejects malformed, uncompleted, mismatched, replayed, sub-100 ms, and out-of-window inputs.

### Tests for User Story 4

- [X] T031 [P] [US4] Add Firestore Emulator tests that deny direct client writes to room statistics and historical ranking data in `tests/rules/statistics-ranking.rules.test.ts`.
- [ ] T032 [P] [US4] Add trusted-persistence tests for host identity, completed round/round ID matching, idempotency, eligibility, and deterministic derived winner/statistics in `tests/unit/reactionStatistics.test.ts`.
- [ ] T033 [P] [US4] Add browser coverage that ranking excludes invalid/suspicious values and presents client-measured trust language in `tests/e2e/game.spec.ts` and `tests/e2e/ranking.spec.ts`.

### Implementation for User Story 4

- [X] T034 [US4] Replace broad authenticated Firestore writes with minimum read access and trusted-only statistics/ranking write policy in `firestore.rules`.
- [X] T035 [US4] Implement an authenticated, idempotent trusted completed-round statistics writer that reads immutable round data and derives eligible values in `app/api/rooms/[roomId]/reaction-statistics/route.ts`.
- [ ] T036 [US4] Replace browser-side arbitrary statistics persistence with the trusted completion request in `services/rooms.ts` and `hooks/useRoomGame.ts`.
- [X] T037 [US4] Filter public Reaction ranking to eligible derived values and show accurate client-measured trust copy in `app/ranking/page.tsx` and affected resources under `i18n/`.
- [ ] T038 [US4] Run Firestore rule, trusted-statistics, ranking browser, and existing room-stat regression suites in `tests/rules/`, `tests/unit/`, and `tests/e2e/`.

**Checkpoint**: Browser clients cannot poison historical statistics/ranking, and public results contain only eligible derived values.

---

## Phase 7: User Story 5 - Keep classic-speed playable (Priority: P2)

**Goal**: Newly created classic-speed rooms remain playable while shared room authorization is narrowed.

**Independent Test**: Create, join, play, kick, leave, and clean up a classic room created with the secure schema; it continues to use classic behavior under the new rules.

### Tests for User Story 5

- [X] T039 [P] [US5] Add RTDB Emulator authorization tests for secure classic participant clicks, join/leave, host kick, lease/presence, and disconnect signal in `tests/rules/classic-speed.rules.test.ts`.
- [ ] T040 [P] [US5] Extend Playwright newly created classic-speed room journeys in `tests/e2e/game.spec.ts`.

### Implementation for User Story 5

- [X] T041 [US5] Adjust secure classic-speed granular RTDB validations discovered by the authorization suite in `database.rules.json`.
- [ ] T042 [US5] Update affected authorized room writers without granting guest authority in `hooks/useRoomGame.ts`, `lib/game/roomCleanup.ts`, and the existing room components under `components-new/`.
- [ ] T043 [US5] Run the classic-speed emulator and Playwright suites against isolated emulator data in `tests/rules/classic-speed.rules.test.ts` and `tests/e2e/game.spec.ts`.

**Checkpoint**: The security rollout retains newly created classic-speed player journeys.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify the complete authorization contract, usability, and delivery safety.

- [ ] T044 [P] Reconcile implementation with `specs/004-reaction-battle-security/contracts/` and document any intentional client-measurement limitation in `specs/004-reaction-battle-security/quickstart.md`.
- [ ] T045 Run `npm run check:tsc`, `npm run lint`, and `npm run check:i18n`; correct only feature-related findings in the touched files.
- [ ] T046 Run the complete focused emulator, unit, and Playwright suite from `tests/rules/`, `tests/unit/`, and `tests/e2e/`, recording results in `specs/004-reaction-battle-security/quickstart.md`.
- [ ] T047 Validate the branch on its Vercel preview with production-data safeguards, then validate the integrated build at `https://dev.click-battle.com.ar/` before opening a `develop` → `master` promotion PR.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on T001–T004 and blocks all user stories.
- **US1 (Phase 3)**: Depends on Phase 2; delivers the protected-result MVP.
- **US2 (Phase 4)**: Depends on Phase 2 and uses the shared immutable-round/transition foundation; complete after or alongside US1 only when its schema work is coordinated.
- **US3 (Phase 5)**: Depends on T007 and can proceed in parallel with US1/US2 after Phase 2.
- **US4 (Phase 6)**: Depends on immutable results and deterministic finalization from US1/US2.
- **US5 (Phase 7)**: Depends on the rules changes from US1/US2 and must complete before rollout.
- **Polish (Phase 8)**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: Foundation only; recommended MVP.
- **US2 (P1)**: Foundation; coordinates with US1 over the secure round schema.
- **US3 (P1)**: Foundation/server-time hook only; parallel after T007.
- **US4 (P2)**: US1 + US2 because trusted statistics require finalized immutable results.
- **US5 (P2)**: US1 + US2 rules changes because it validates secure classic-speed behavior under narrowed permissions.

### Parallel Opportunities

- T002–T004 can begin alongside T001.
- T006, T007, and T010 can proceed in parallel after base types are agreed.
- In US1, T011–T013 can be authored in parallel; in US2, T018–T020 can be authored in parallel.
- US3 test/implementation work can run in parallel with US1/US2 after the foundational hook contract is stable.
- US4 tests T031–T033 and US5 tests T039–T040 can be prepared in parallel, then run after their dependencies land.

## Parallel Example: User Story 1

```text
Task: "T011 RTDB result authorization tests in tests/rules/reaction-results.rules.test.ts"
Task: "T012 concurrent result test in tests/rules/reaction-results.rules.test.ts"
Task: "T013 Reaction result Playwright tests in tests/e2e/game.spec.ts"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete setup and foundation, especially emulator fixtures, validation helpers, and immutable-round shape.
2. Complete US1 rules and write-once result flow.
3. Stop and validate the own-result/cross-user/overwrite/concurrency matrix before enabling host transition or ranking changes.

### Incremental Delivery

1. Add protected results (US1) and validate.
2. Add reliable host control (US2) and time readiness (US3), validating both normal and failure paths.
3. Lock down trusted statistics/ranking (US4).
4. Complete newly created classic-speed validation (US5).
5. Run the cross-cutting suite and deploy through preview then `develop` validation.

## Notes

- Every task follows the required checkbox, sequential ID, optional parallel marker, story label (where applicable), and exact-path format.
- Use Admin/privileged emulator setup only for fixtures; authorization assertions must use isolated authenticated clients.
- Do not run browser tests against production Firebase. Run player auth setup before any logged-in Playwright suite.
