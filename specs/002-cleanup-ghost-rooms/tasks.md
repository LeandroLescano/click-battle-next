# Tasks: Automatic Ghost Room Cleanup

**Input**: Design documents from `/specs/002-cleanup-ghost-rooms/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [room-cleanup-contract.md](contracts/room-cleanup-contract.md), [quickstart.md](quickstart.md)

**Tests**: The specification requires authenticated Playwright coverage. Run `tests/e2e/auth.setup.ts` before logged-in room tests, and run destructive scenarios only against the Firebase emulators unless the environment is explicitly confirmed safe.

**Organization**: Tasks are grouped by user story. The existing first cleanup increment is treated as a baseline to extend, not as proof that the new lease requirements are complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on an incomplete task.
- **[Story]**: Maps implementation and validation to US1, US2, or US3.
- Every task includes the exact file path or paths it must inspect or modify.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Reconfirm the destructive-test boundary and prepare lease/session fixture controls.

- [x] T001 Verify emulator-only destructive testing, authenticated player setup, and the unconfigured Realtime Database rules boundary in `firebase.json`, `database.rules.json`, `tests/e2e/auth.setup.ts`, and `specs/002-cleanup-ghost-rooms/quickstart.md`
- [x] T002 [P] Extend `tests/e2e/fixtures.ts` with helpers to create, read, renew, expire, replace, and remove `hostLease` values plus session-scoped `roomHostDisconnects/{gameId}/{sessionId}` signals

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared lease model and race-safe primitives required by every user story.

**CRITICAL**: No user-story integration begins until this phase is complete.

- [x] T003 [P] Add `HostLease`, `HostDisconnectSignal`, and raw lifecycle snapshot typing to `interfaces/Game.ts`, retaining legacy fields only as compatibility inputs
- [x] T004 [P] Implement session ID creation, initial lease construction, 20-second heartbeat constants, 90-second expiry constants, and conditional lease-renewal transactions in `lib/game/hostLease.ts`
- [x] T005 [P] Extend pure lifecycle classification with current-session disconnect evidence, lease-active, lease-expired, and next-deadline outcomes in `lib/game/hostPresence.ts`
- [x] T006 Extend partitioning and guarded deletion to carry expected session/disconnect evidence, recheck current lease renewal at commit time, and best-effort remove sibling signals in `lib/game/roomCleanup.ts`

**Checkpoint**: A delayed or mismatched heartbeat cannot create/renew a missing lease, and stale classification is deterministic without touching UI code.

---

## Phase 3: User Story 1 - Close Abandoned Rooms Automatically (Priority: P1) MVP

**Goal**: New rooms publish an authoritative lease, hosts renew it every 20 seconds, reliable disconnects retain the 30-second path, and missing disconnect callbacks still close the room at 90 seconds without jobs.

**Independent Test**: Create a modern room, stop successful lease renewal while retaining its old connection identifier and omitting a disconnect signal, then prove another authenticated viewer sees it before 90 seconds, never sees it after the deadline, and removes it without an extra grace period; repeat with a matching disconnect signal for the 30-second path and through a direct link.

### Tests for User Story 1

> Write these cases first and confirm they fail for the missing lease behavior.

- [x] T007 [US1] Add failing Playwright cases for initial lease creation, two 20-second renewals, 89-to-90-second expiry with a stale connection identifier, no additional grace, matching-session 30-second disconnect cleanup, and stale direct-link rejection in `tests/e2e/game.spec.ts`

### Implementation for User Story 1

- [x] T008 [P] [US1] Generate the first host session and atomically create the room with its initial server-timestamped `hostLease` in `components-new/CreateSection/index.tsx`
- [x] T009 [US1] Replace inline room `onDisconnect` mutation with `roomHostDisconnects/{gameId}/{sessionId}` registration and start/stop the conditional 20-second heartbeat in `hooks/useRoomGame.ts`
- [x] T010 [P] [US1] Subscribe to and combine current room plus disconnect-signal snapshots, filter before rendering, and schedule the nearest 30-second or 90-second deadline in `app/page.tsx`
- [x] T011 [US1] Feed matching disconnect evidence into the shared classifier before state application or visitor writes in `hooks/useRoomGame.ts`
- [x] T012 [US1] Preserve intentional host exit by cancelling the current disconnect signal, removing the active room immediately, and cleaning its signal subtree in `hooks/useRoomGame.ts`
- [x] T013 [US1] Run authenticated setup and the focused US1 heartbeat, lease-expiry, disconnect-grace, and direct-link cases from `tests/e2e/auth.setup.ts` and `tests/e2e/game.spec.ts` against local emulators

**Checkpoint**: The original ghost-room failure is bounded to 90 seconds even when `onDisconnect` produces no usable room signal.

---

## Phase 4: User Story 2 - Survive Brief Host Reconnection (Priority: P2)

**Goal**: A valid returning owner replaces or renews the current session safely, while delayed work from an obsolete session cannot close, extend, or recreate the room.

**Independent Test**: Disconnect and reconnect the owner before the applicable deadline, replace the session, then deliver an old heartbeat and old disconnect signal. The room and game state remain, only the new session renews, and a heartbeat submitted after room deletion cannot recreate `games/{gameId}`.

### Tests for User Story 2

- [x] T014 [US2] Add failing Playwright race cases for same-session recovery, owner session replacement, obsolete heartbeat rejection, obsolete disconnect-signal rejection, suspension beyond 90 seconds, and post-deletion heartbeat non-recreation in `tests/e2e/game.spec.ts`

### Implementation for User Story 2

- [x] T015 [P] [US2] Implement owner-only session replacement that aborts for missing rooms, different owners, or absent modern leases in `lib/game/hostLease.ts`
- [x] T016 [US2] Order reconnection as session registration, committed lease renewal, matching-signal cleanup, and old-loop shutdown without restarting room state when server-time offset changes in `hooks/useRoomGame.ts`
- [x] T017 [P] [US2] Reject guarded deletion when the room references a different session or has `lastRenewedAt` newer than the observed disconnect signal in `lib/game/roomCleanup.ts`
- [x] T018 [US2] Ensure room-null listeners stop heartbeat ownership and route hosts, controllers, and guests through the existing unavailable-room fallback in `hooks/useRoomGame.ts`
- [x] T019 [US2] Run the focused reconnect, replacement-session, stale-callback, suspended-host, and post-deletion non-recreation Playwright cases in `tests/e2e/game.spec.ts`

**Checkpoint**: Reconnects preserve live games, but an obsolete session has no authority over the lease or active-room path.

---

## Phase 5: User Story 3 - Remove Existing Ghost Rooms Safely (Priority: P2)

**Goal**: Pre-lease ghosts, including records with misleading old connection identifiers, clean after 24 hours while a currently open owner session can safely bootstrap a lease.

**Independent Test**: Seed an old room with `hostConnectionId` but no lease and prove it is hidden/deleted; seed a comparable room opened by its authenticated owner and prove one guarded bootstrap establishes a current lease before cleanup; run concurrent viewers and confirm idempotency and no Firestore history.

### Tests for User Story 3

- [x] T020 [US3] Add failing Playwright cases for old pre-lease rooms with stale connection identifiers, young ambiguous rooms, owner lease bootstrap, concurrent cleanup, and absence of cleanup-only Firestore history in `tests/e2e/game.spec.ts`

### Implementation for User Story 3

- [x] T021 [P] [US3] Treat legacy `hostConnectionId` without a usable lease as non-authoritative and apply the conservative 24-hour fallback in `lib/game/hostPresence.ts`
- [x] T022 [P] [US3] Implement one-time owner-verified whole-room lease bootstrap for an existing room with no `hostLease`, while aborting for missing rooms and non-owners, in `lib/game/hostLease.ts`
- [x] T023 [US3] Invoke legacy lease bootstrap only for the parsed authenticated owner before starting heartbeat ownership in `hooks/useRoomGame.ts`
- [x] T024 [US3] Run focused pre-lease backlog, active-owner bootstrap, concurrent viewer, and no-history Playwright cases in `tests/e2e/game.spec.ts`

**Checkpoint**: The old backlog no longer survives merely because it contains a stale connection string, and active owners can migrate safely without a data job.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Reconcile documentation, verify permissions and regressions, and protect explicit scope boundaries.

- [x] T025 [P] Reconcile final field names, state precedence, and validation results across `specs/002-cleanup-ghost-rooms/spec.md`, `specs/002-cleanup-ghost-rooms/plan.md`, `specs/002-cleanup-ghost-rooms/data-model.md`, `specs/002-cleanup-ghost-rooms/contracts/room-cleanup-contract.md`, and `specs/002-cleanup-ghost-rooms/quickstart.md`
- [x] T026 Run TypeScript, targeted ESLint, and translation validation using `package.json` scripts, fixing every lease-related failure in `components-new/CreateSection/index.tsx`, `hooks/useRoomGame.ts`, `app/page.tsx`, `interfaces/Game.ts`, and `lib/game/*.ts`
- [x] T027 Run authenticated setup followed by all focused lifecycle scenarios documented in `specs/002-cleanup-ghost-rooms/quickstart.md` against the Firebase emulators
- [x] T028 Run the complete Chromium regression suite in `tests/e2e/game.spec.ts`, covering classic-speed, Reaction Battle, passwords, intentional host exit, reconnects, and legacy-shaped room data
- [x] T029 Validate read/write/delete behavior for `games/{gameId}/hostLease` and `roomHostDisconnects/{gameId}/{sessionId}` under emulator and deployed-equivalent rules without broadening `database.rules.json` or testing destructive writes against an unsafe environment
  - Verified in `specs/002-cleanup-ghost-rooms/permission-validation.md` using an isolated auth+RTDB emulator loaded with the deployed-equivalent ruleset: unauthenticated clients are denied, authenticated clients are allowed for the required lease and disconnect-signal operations.
- [x] T030 Review `firebase.json`, `database.rules.json`, `app/legacy/page.tsx`, the final git diff, and runtime timers to confirm no `/legacy` change, takeover, cron/job/backend service, viewer polling loop, room recreation path, or cleanup-only Firestore write was introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 - Setup**: Starts immediately and establishes safe test controls.
- **Phase 2 - Foundation**: Depends on Setup and blocks every story. T004-T005 depend on T003; T006 depends on T005.
- **Phase 3 - US1**: Depends on Foundation and is the release MVP.
- **Phase 4 - US2**: Depends on US1 heartbeat/session integration and hardens its races.
- **Phase 5 - US3**: Depends on Foundation and the US1 host lifecycle; its failing tests may be prepared while US2 is implemented.
- **Phase 6 - Polish**: Depends on every selected story.

### User Story Dependency Graph

```text
Setup -> Foundation -> US1 (MVP) -> US2
                              `----> US3
US2 + US3 -> Polish
```

### User Story Dependencies

- **US1 (P1)**: Delivers the authoritative lease, heartbeat, disconnect signal, list filtering, and direct-link behavior.
- **US2 (P2)**: Builds on US1 to protect reconnect and delayed-session races; independently testable through session replacement scenarios.
- **US3 (P2)**: Reuses the lease model to clean/migrate pre-lease data; independently testable with seeded old rooms.

### Within Each User Story

- Add the story's Playwright cases first and confirm failure for the missing behavior.
- Implement pure types/classification and transaction primitives before UI/hook integration.
- Commit server renewal before clearing disconnect evidence.
- Filter before rendering and recheck destructive evidence inside the room transaction.
- Complete the story's focused emulator checkpoint before advancing.

### Parallel Opportunities

- T002 and T003 can proceed in parallel after T001 confirms emulator safety.
- After T003, T004 and T005 touch separate modules and can proceed in parallel before T006 integrates them.
- T014 (US2 tests) and T020 (US3 tests) can be prepared in parallel after US1 stabilizes, with coordinated edits to `tests/e2e/game.spec.ts`.
- T015-T018 and T021-T023 target different primary modules but must coordinate shared edits to `hooks/useRoomGame.ts` and `lib/game/hostLease.ts`.
- T025 documentation reconciliation can proceed alongside T026 static validation once implementation stabilizes.

---

## Parallel Examples

### User Story 1

```text
Task A: T008 add atomic new-room lease initialization in components-new/CreateSection/index.tsx
Task B: T010 combine room/signal snapshots and deadlines in app/page.tsx
```

Start both after T007 has failed for the expected missing lease behavior.

### User Story 2 and User Story 3

```text
Task A: T014-T019 implement and validate reconnect/session race safety
Task B: T020-T024 implement and validate pre-lease migration/backlog cleanup
```

Coordinate `tests/e2e/game.spec.ts`, `hooks/useRoomGame.ts`, and `lib/game/hostLease.ts` before merging the streams.

---

## Implementation Strategy

### MVP First: User Story 1

1. Complete Setup and Foundation.
2. Add US1 failing tests.
3. Initialize leases, start conditional heartbeat, move disconnect evidence outside the room, and integrate current list/direct links.
4. Stop and validate the no-`onDisconnect` 90-second journey plus the reliable 30-second journey.
5. Do not promote until the new path proves it cannot recreate a deleted room.

### Incremental Delivery

1. **Foundation**: Lease/session model and transactional primitives.
2. **US1 MVP**: Bound new ghosts to 90 seconds and preserve 30-second reliable disconnect cleanup.
3. **US2**: Reconnect, replacement, suspension, and delayed-callback safety.
4. **US3**: Pre-lease backlog and guarded owner bootstrap.
5. **Polish**: Full regression, permission gate, documentation, and scope audit.

### Parallel Team Strategy

After US1:

- Developer A: US2 session-race implementation and tests.
- Developer B: US3 legacy bootstrap/classification and tests.
- Coordinate shared hook/helper/test files before integration.

---

## Notes

- `[P]` means different files and no incomplete dependency.
- Never run destructive cleanup tests against a preview or domain that may use production Firebase.
- Do not introduce host takeover, player heartbeat redesign, cron configuration, Cloud Functions, queues, backend routes, or viewer polling.
- Do not make `/legacy` changes; legacy-shaped data remains covered through current `/` and `/game/{gameId}` flows.
- Do not broaden Realtime Database permissions as an incidental fix; failed permission validation requires a separate narrow rule decision.
- Commit after each reviewed task or coherent task group.
