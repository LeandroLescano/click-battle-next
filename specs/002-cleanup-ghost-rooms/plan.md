# Implementation Plan: Automatic Ghost Room Cleanup

**Branch**: `002-cleanup-ghost-rooms` | **Date**: 2026-06-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-cleanup-ghost-rooms/spec.md`

## Summary

Extend the existing opportunistic cleanup with a server-timestamped host lease renewed every 20 seconds and expired after 90 seconds. The lease is authoritative even when an old connection marker remains. It is bound to the current host identity and `sessionID`, renewed through a narrow transaction that aborts for missing or replaced sessions, and rechecked by guarded room deletion. Keep the faster 30-second `onDisconnect` path through a session-scoped signal outside `games/{gameId}` so a delayed disconnect callback cannot recreate a deleted active-room record. No host takeover, scheduled job, backend worker, `/legacy` UI change, or cleanup-only history write is introduced.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 18.2, Node.js 20-compatible project tooling

**Primary Dependencies**: Next.js 15.5.18 App Router, Firebase 12.13.0 Realtime Database/Auth, `@leandrolescano/click-battle-core` 1.3.x, React i18next, Sentry, Playwright 1.47+

**Storage**: Firebase Realtime Database `games/{gameId}` for active rooms and `roomHostDisconnects/{gameId}/{sessionId}` for session-scoped disconnect signals; Firestore room history remains unchanged

**Testing**: TypeScript check, targeted ESLint, i18n validation, and authenticated Playwright against Firebase Auth/Realtime Database/Firestore emulators

**Target Platform**: Modern desktop and mobile browsers deployed through the existing Vercel-hosted Next.js web app

**Project Type**: Single Next.js web application with client-side realtime room lifecycle handling

**Performance Goals**: One heartbeat transaction every 20 seconds per active host; one nearest-deadline list timer; no polling by viewers; stale rooms hidden before visible state commits; no heartbeat transaction at the whole-room path

**Constraints**: Lease expires at 90 seconds with no extra grace; reliable session-scoped disconnect signals retain the existing 30-second grace; no takeover, cron, Cloud Function schedule, Vercel Cron, queue, backend cleanup service, or continuously running viewer poller; delayed sessions cannot recreate rooms; destructive verification remains emulator-only unless the target is explicitly safe

**Scale/Scope**: Host lease/session registration, heartbeat renewal, disconnect signaling, shared lifecycle classification, guarded deletion, current `/` and `/game/{gameId}` consumers, fixtures/tests, and documentation; obsolete `/legacy` UI, player-host migration, multi-host support, and unrelated room/game state are out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- **Production Gameplay Stability**: PASS. The design preserves intentional host exit, the current 30-second reliable-disconnect grace, all game modes, and redirects stale direct links without introducing host migration. The 90-second lease behavior is explicitly specified for suspended or unreachable hosts.
- **Next.js App Router With Existing Patterns**: PASS. Heartbeat ownership remains in the existing client room hook; classification and Firebase mutation stay in existing `lib/game` modules. The obsolete `/legacy` UI remains untouched.
- **Firebase-Backed Contract Discipline**: PASS WITH RELEASE GATE. New fields and the disconnect-signal path are documented below. Emulator and deployed-equivalent permission behavior must be validated; `database.rules.json` is not wired through `firebase.json`, so this plan does not guess or broaden production rules.
- **Verification Before Promotion**: PASS. The design requires authenticated emulator coverage for lease expiry, renewal, session replacement, delayed callbacks, deletion races, direct links, and the existing full game regression suite.
- **Branched Delivery And Incremental Safety**: PASS. Work remains on `002-cleanup-ghost-rooms` and keeps the lifecycle changes isolated from game rules, history, and `/legacy`.

**Post-design re-check**: PASS. The data model and contracts preserve all gates. Permission verification remains an explicit pre-promotion gate rather than a constitution exception.

## Project Structure

### Documentation (this feature)

```text
specs/002-cleanup-ghost-rooms/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- room-cleanup-contract.md
|-- checklists/
|   |-- requirements.md
|   `-- presence-resilience.md
`-- tasks.md
```

### Source Code (repository root)

```text
components-new/CreateSection/index.tsx  # Initialize room + first host lease atomically

hooks/useRoomGame.ts                    # Register session, heartbeat, onDisconnect signal

lib/game/
|-- hostPresence.ts                     # Pure lease/disconnect/legacy classification
|-- roomCleanup.ts                      # Partitioning and guarded room deletion
|-- hostLease.ts                        # Session registration and conditional renewal helpers
`-- serverTimeOffset.ts                 # Existing server-aligned client clock

interfaces/Game.ts                      # Lease, session, and disconnect-signal shapes

app/page.tsx                            # Combine room/disconnect snapshots before display

tests/e2e/
|-- fixtures.ts                         # Seed/renew/expire/replace lease test controls
`-- game.spec.ts                        # Lease resilience and regression scenarios
```

**Structure Decision**: Extend the existing single-project room lifecycle. Store the authoritative lease inside each room so guarded deletion can recheck it atomically. Store only `onDisconnect` signals in a separate session-scoped path, preventing delayed callbacks from recreating an active room. Use one small helper for session registration/renewal rather than embedding interval and transaction details throughout `useRoomGame.ts`.

## Design Details

### Session registration

- New room creation generates one `sessionID` and writes the room, initial `hostLease`, and empty disconnect state in one root multi-location update.
- A returning authenticated owner may replace the current lease session through a conditional transaction. A missing room/lease aborts rather than creating data.
- A legacy room without `hostLease` may be bootstrapped once through a guarded whole-room transaction that proves the room exists and the authenticated user is its owner. Recurring heartbeat never transacts at the whole-room path.

### Heartbeat lifecycle

- The host renews `games/{gameId}/hostLease` every 20 seconds.
- Renewal uses `runTransaction`, succeeds only when `ownerId` and `sessionId` still match, and writes `lastRenewedAt` using a server timestamp.
- Null, deleted, replaced, or mismatched lease values abort. The interval stops when renewal loses authority, the room disappears, or the component unmounts.
- A failed network write does not advance local authority. Ninety seconds after the last committed renewal, the room is stale.

### Disconnect lifecycle

- `onDisconnect` writes `roomHostDisconnects/{gameId}/{sessionId}/disconnectedAt` instead of mutating `games/{gameId}`.
- Only a signal matching the room's current lease session participates in classification. Delayed signals from replaced sessions are ignored.
- A successful renewal clears the matching disconnect signal after the lease timestamp commits. Deletion safety still relies on the room's renewed lease timestamp, not signal removal ordering.
- Obsolete signal records are removed opportunistically after session replacement or room deletion; they never make a room joinable and cannot recreate `games/{gameId}`.

### Classification precedence

1. A valid current lease renewed within 90 seconds is active unless a matching, later disconnect signal is in its 30-second grace.
2. A matching disconnect signal is stale after 30 seconds unless the same lease has a later committed renewal.
3. A current lease older than 90 seconds is stale immediately, with no additional grace, even if `hostConnectionId` remains populated.
4. A malformed lease is unknown and non-deletable unless an independent conservative legacy-age rule applies.
5. A room without a usable lease or matching disconnect evidence becomes stale after the existing 24-hour fallback. A legacy `hostConnectionId` alone is not current liveness evidence.

### Guarded deletion

- The transaction remains at `games/{gameId}` and reclassifies the current embedded lease at commit time.
- For disconnect-triggered cleanup it also verifies that the room still references the expected session and that `lastRenewedAt` was not renewed after the observed disconnect timestamp.
- Returning `null` deletes only a still-stale room. Recovery, session replacement, ambiguity, or a fresher lease aborts.
- Disconnect-signal cleanup follows successful room deletion as a best-effort sibling-path removal and never creates Firestore history.

## Complexity Tracking

No constitution violations require justification. The additional disconnect-signal path is the smallest design that preserves the 30-second `onDisconnect` behavior without allowing a delayed callback to recreate or corrupt `games/{gameId}`.
