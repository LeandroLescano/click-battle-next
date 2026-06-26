# Research: Automatic Ghost Room Cleanup

## Decision 1: Trigger cleanup from room-list evaluation

**Decision**: Reuse the existing Realtime Database `onValue` room-list subscription. Classify every raw room before setting visible list state, hide stale rooms immediately, and start their deletion asynchronously.

**Rationale**: This directly matches the requested traffic-driven behavior, fixes the player-facing symptom before any write finishes, and avoids scheduled infrastructure. It also extends logic already present in `app/page.tsx` instead of creating a second lifecycle system.

**Alternatives considered**:

- Scheduled Cloud Function, Vercel Cron, or queue worker: rejected because the user explicitly wants to avoid jobs and the current scale does not justify new infrastructure.
- Filter only, without deletion: rejected because stale active records would keep accumulating and still require manual Firebase cleanup.
- Cleanup only when a player opens a room: rejected because ghosts would remain visible in the list and invite users into dead sessions.

## Decision 2: Use one viewer deadline timer, not viewer polling

**Decision**: Retain the latest raw room and disconnect-signal snapshots and schedule one timeout for the nearest 30-second disconnect deadline, 90-second lease deadline, or 24-hour legacy deadline. On timeout, reevaluate, update the visible list, and attempt deletion for newly stale rooms. The host heartbeat is a bounded writer owned by the host session; viewers do not poll.

**Rationale**: Realtime Database does not emit a second snapshot merely because wall-clock time passed. The current implementation can therefore leave a room visible indefinitely when its disconnect marker arrives during the grace period. A single nearest-deadline timeout closes that gap without polling or a recurring process.

**Alternatives considered**:

- `setInterval` polling: rejected because it creates continuous work and unnecessary reevaluations.
- One timeout per room: rejected because one reschedulable timeout is easier to cancel and has lower timer overhead.
- Wait for another Firebase update: rejected because no later update is guaranteed.

## Decision 3: Guard deletion with a Realtime Database transaction

**Decision**: Replace unconditional cleanup `remove()` calls with a helper that runs a transaction at `games/{gameId}`. The transaction reclassifies the current value and returns `null` only if it is still stale; it aborts when the room is missing, active, pending, recovered, or ambiguous.

**Rationale**: A host can reconnect after a list snapshot marks a room stale but before deletion reaches the database. Rechecking at commit time prevents that race and makes concurrent cleanup attempts idempotent. Firebase documents transactions as the mechanism for updates that depend on current data.

**Alternatives considered**:

- Keep unconditional `remove()`: rejected because it can delete a recovered room.
- Compare only the previously observed connection identifier: rejected because legacy-age cleanup also needs a safe current-value check.
- Add a server endpoint for deletion: rejected because it adds backend surface and deployment complexity that the transaction can avoid at current scope.

## Decision 4: Make the server-timestamped lease authoritative

**Decision**: Add `hostLease { ownerId, sessionId, claimedAt, lastRenewedAt }` inside each modern room and use the existing `.info/serverTimeOffset` helper for comparisons. Classify rooms as follows:

- A lease renewed less than 90 seconds ago: `active`, unless a later matching disconnect signal is pending.
- A matching session disconnect signal before its 30-second deadline: `pending`.
- A matching session disconnect signal after its deadline, with no later renewal: `stale-host-disconnect`.
- A lease at least 90 seconds old: `stale-lease-expired`, with no additional grace.
- No usable lease or disconnect evidence plus numeric `created` older than 24 hours: `stale-legacy-age`.
- Missing or malformed evidence that does not satisfy a stale rule: `unknown`, kept visible if otherwise parseable and never deleted by cleanup.

**Rationale**: A non-empty `hostConnectionId` can survive a failed `onDisconnect` and is therefore not proof of liveness. The renewed lease bounds that failure to 90 seconds. Server timestamps prevent client clock skew from deciding destructive behavior, while conservative legacy handling protects ambiguous young rooms.

**Alternatives considered**:

- Use `Date.now()` directly: rejected because a badly skewed device could delete too early or retain ghosts too long.
- Continue trusting `hostConnectionId`: rejected because that is the exact failure mode that can leave a ghost forever.
- Use the 2-second/3.5-second timing from the reference project: rejected because ClickBattle closes rather than transfers the room, making false positives destructive.
- Delete every room older than 24 hours: rejected because age alone must not override a valid current lease.
- Delete malformed snapshots: rejected because ambiguity is not sufficient evidence for a destructive action.

## Decision 5: Cover the current list and direct links

**Decision**: Apply the same pure classification to `app/page.tsx` and the stale branch in `hooks/useRoomGame.ts`. Leave the obsolete `/legacy` UI unchanged.

**Rationale**: Direct links can bypass the current list. Shared classification prevents `/game/{gameId}` from joining a room that `/` considers stale, without investing in a UI route scheduled for removal.

**Alternatives considered**:

- Update `/legacy` as well: rejected after product clarification that the route is obsolete and will be removed.
- Rewrite the current page around a new global room-list hook: rejected as a broader refactor than the feature needs.

## Decision 6: Do not create cleanup history

**Decision**: Opportunistic cleanup removes only the active room record. It does not create or mutate Firestore room-history summaries.

**Rationale**: A list viewer does not own the host's in-memory statistics, and inventing partial history would distort analytics. Existing intentional-close history behavior remains unchanged.

**Alternatives considered**:

- Write a minimal automatic-expiration history row: rejected because it would change analytics semantics and require additional cross-store permissions.
- Delete existing history: rejected because active-room cleanup must not destroy retained historical records.

## Decision 7: Verify with emulators and authenticated Playwright users

**Decision**: Extend the existing authenticated fixtures to seed lifecycle states in the Realtime Database emulator, then test list visibility and eventual database deletion. Run auth setup before the logged-in E2E cases.

**Rationale**: These are user-visible and destructive realtime flows. The repository already has Playwright, authenticated storage states, and Firebase emulator helpers. Next.js guidance recommends E2E testing through a running application; project instructions require auth setup and warn that previews may point at production Firebase.

**Alternatives considered**:

- Manual Firebase console verification: rejected as destructive, difficult to repeat, and unable to prove race handling.
- Introduce a new unit-test framework only for the classifier: rejected for this narrow feature; deterministic helper branches can be exercised through focused Playwright scenarios without adding tooling.

## Decision 8: Treat deployed rules as a release gate, not an invitation to broaden access

**Decision**: Expect no security-rule change because the current client already removes room paths, but explicitly verify on the emulator and safe branch environment that authenticated list viewers can complete the guarded transaction. If deployed rules reject it, amend the design with the narrowest conditional rule rather than granting broad delete access.

**Rationale**: `database.rules.json` currently denies all and is not wired into `firebase.json`, so it does not reliably describe deployed production permissions. Guessing or broadening rules during planning would violate environment separation and Firebase contract discipline.

**Alternatives considered**:

- Commit permissive rules now: rejected as unsafe and unsupported by repository configuration.
- Ignore permission behavior: rejected because filtering without successful cleanup would only partially solve the user request.

## Decision 9: Renew a narrow embedded lease with session-checked transactions

**Decision**: The active room stores `hostLease` with `ownerId`, `sessionId`, `claimedAt`, and `lastRenewedAt`. The current host renews it every 20 seconds through a transaction at `games/{gameId}/hostLease`. The update function returns a new server timestamp only when the existing owner and session match; null or mismatched data aborts.

**Rationale**: A transaction at the lease node avoids conflict with frequent click/game-state writes. Requiring an existing matching lease means a delayed interval cannot recreate a deleted room or renew a replaced session. New rooms initialize the lease with room creation; legacy bootstrap is a separate one-time guarded path.

**Alternatives considered**:

- Transaction at the entire room every 20 seconds: rejected because every game-state write below that path could cause retries and contention.
- Unconditional `update()` heartbeat: rejected because a delayed client could recreate a partial room after deletion.
- Trust client `Date.now()`: rejected because lease expiry is destructive and must use server-aligned committed time.

## Decision 10: Move `onDisconnect` evidence outside the active-room path

**Decision**: Register `onDisconnect` at `roomHostDisconnects/{gameId}/{sessionId}` and write a server `disconnectedAt` timestamp. The classifier uses only a signal matching the room's current lease session. Matching signals preserve the fast 30-second path; lease expiry remains the 90-second fallback when no reliable signal arrives.

**Rationale**: The existing `onDisconnect(...gameRef).update(...)` can recreate partial `games/{gameId}` data if another client deletes the room before the host connection finally closes. A separate session-scoped signal cannot recreate the active room, and an old session cannot mark a new session disconnected.

**Alternatives considered**:

- Keep writing disconnect timestamps under the room: rejected because delayed callbacks can recreate deleted room data.
- `onDisconnect(room).remove()`: rejected because it bypasses the reconnect grace and can delete a room after a newer session connects.
- Remove `onDisconnect` entirely: rejected because it would make every unexpected disconnect wait the full 90-second lease.

## Decision 11: No takeover and no host/player presence redesign

**Decision**: Lease expiry closes the room. It does not elect another host, modify player authority, or introduce player heartbeats. Existing visitor `onDisconnect(...player).remove()` behavior remains unchanged.

**Rationale**: Host takeover changes game authority and product behavior far beyond ghost-room cleanup. The user explicitly selected close-on-expiry. Player cleanup is already separate from the host-room ghost problem.

**Alternatives considered**:

- Deterministic oldest-player takeover: rejected for this feature because it requires authority migration, game-state continuity rules, and substantially broader testing.
- Player heartbeat redesign: deferred because it is not required to prove host availability or delete abandoned rooms.

## Decision 12: Revalidate deletion using embedded renewal evidence

**Decision**: Keep deletion transactional at `games/{gameId}`. For lease expiry, recheck the current `lastRenewedAt`. For disconnect cleanup, also require the expected session and ensure the current lease was not renewed after the observed disconnect timestamp. Remove sibling disconnect signals only after room deletion commits.

**Rationale**: Reconnection writes the embedded lease before clearing the external signal, so the transaction can reject deletion even if signal cleanup races. This preserves idempotency without a transaction at the database root.

**Alternatives considered**:

- Delete based only on the last list snapshot: rejected because renewal may commit between classification and deletion.
- Root-level transaction across room and signal: rejected because its contention and data scope are disproportionate.
- Write cleanup history: rejected because active-room lifecycle cleanup must remain isolated from Firestore analytics.

## Sources

- Firebase Realtime Database offline/presence behavior: https://firebase.google.com/docs/database/web/offline-capabilities
- Firebase Realtime Database reads, writes, and transactions: https://firebase.google.com/docs/database/web/read-and-write
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Playwright testing guide: https://nextjs.org/docs/app/guides/testing/playwright
