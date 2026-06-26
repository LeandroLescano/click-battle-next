# Feature Specification: Automatic Ghost Room Cleanup

**Feature Branch**: `002-cleanup-ghost-rooms`

**Created**: 2026-06-24

**Status**: Draft

**Input**: User description: "Quiero dejar de tener salas fantasma que quedan eternamente hasta que yo las elimino a mano desde firebase"

## Clarifications

### Session 2026-06-24

- Q: Should ClickBattle transfer host authority when the current host lease expires? → A: No. Heartbeat is used only to detect abandonment; an expired host lease closes the room.
- Q: What heartbeat frequency and host-lease duration should ClickBattle use? → A: Renew every 20 seconds; expire after 90 seconds without a successful renewal.
- Q: Does an expired 90-second host lease start an additional reconnect grace period? → A: No. At 90 seconds the room is immediately stale, hidden, and eligible for guarded deletion.
- Q: What happens when browser suspension prevents heartbeat renewal for more than 90 seconds? → A: The lease remains authoritative and the room closes; a suspended host is no longer considered reliably available.
- Q: Which host session may renew the lease? → A: Only the current host and current `sessionID`, and only while the room still exists; delayed or replaced sessions cannot renew or recreate it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Close Abandoned Rooms Automatically (Priority: P1)

As the product operator, I want an abandoned room to be hidden and cleaned when players evaluate the room list so that ghost rooms stop reaching users without requiring scheduled infrastructure.

**Why this priority**: This directly eliminates the manual cleanup burden and prevents players from encountering rooms that can no longer be played.

**Independent Test**: Create a room, disconnect the host unexpectedly, wait for the reconnect grace period to expire, and open the room list as another user. Verify that the abandoned room is never shown and is removed in the background.

**Acceptance Scenarios**:

1. **Given** a host disconnects unexpectedly and does not return during the 30-second grace period, **When** any user next loads or receives an update to the active room list, **Then** the abandoned room is excluded before display and its background deletion is requested.
2. **Given** a host disconnects while no guests remain in the room, **When** no one is viewing the room list, **Then** the room may remain stored until the next room-list evaluation but MUST NOT be displayed once that evaluation occurs.
3. **Given** a host disconnects while guests remain in the room, **When** the grace period expires, **Then** the room closes through the existing connected-player lifecycle or the next room-list evaluation, whichever occurs first.
4. **Given** a host intentionally leaves through the available room-exit action, **When** the exit completes, **Then** the room closes immediately without waiting for the unexpected-disconnect grace period.

---

### User Story 2 - Survive Brief Host Reconnection (Priority: P2)

As a room host, I want a brief network interruption or page reload to preserve my room so that an ordinary reconnect does not destroy an active match.

**Why this priority**: Automatic cleanup must solve abandoned rooms without making live gameplay fragile.

**Independent Test**: Disconnect and reconnect the host before the grace period expires, then verify that the same room, players, mode, and game state remain available.

**Acceptance Scenarios**:

1. **Given** a host loses connection, **When** the same host reconnects within 30 seconds, **Then** pending room closure is cancelled and the room remains active.
2. **Given** a long-running room has an available host but no recent gameplay action, **When** opportunistic cleanup evaluates the room, **Then** the room remains active.

---

### User Story 3 - Remove Existing Ghost Rooms Safely (Priority: P2)

As the product operator, I want already-abandoned rooms to be cleared after the feature becomes operational so that the current backlog of ghost rooms disappears without a one-off manual deletion.

**Why this priority**: Preventing new ghosts does not remove the stale rooms that already create operational work and a misleading room list.

**Independent Test**: Seed old active-room records with no usable evidence of an available host, including a legacy-shaped room, and verify they are cleaned while a room with a currently available host is preserved.

**Acceptance Scenarios**:

1. **Given** a pre-existing room has no usable host-presence evidence and was created more than 24 hours ago, **When** a user loads or receives an update to the room list, **Then** the room is excluded before display and removed in the background.
2. **Given** a pre-existing room has incomplete lifecycle metadata but its host is currently available, **When** cleanup evaluates it, **Then** the room is preserved.
3. **Given** multiple cleanup evaluations target the same stale room, **When** they complete in any order, **Then** the room is closed once without errors, duplicate history, or effects on other rooms.

### Edge Cases

- The host disconnects and reconnects exactly at the grace-period boundary.
- The room is created but the host connection is lost before the game screen finishes opening.
- The host deliberately closes the room while an automatic cleanup decision is already pending.
- Two or more cleanup evaluations attempt to close the same room concurrently.
- Guests try to join from a stale room card or direct link while the room is being closed.
- A cleanup attempt is interrupted or temporarily fails after identifying an abandoned room.
- No user opens the room list for an extended period after a room becomes stale.
- A legacy room lacks newer lifecycle fields, mode metadata, or a complete participant list.
- A room remains open for many hours with an available host but no game rounds are started.
- The host browser is backgrounded or suspended long enough for the 90-second lease to expire.
- A delayed heartbeat from an obsolete host session arrives after reconnection, session replacement, or room deletion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain enough current host-availability information to distinguish an active room from an abandoned room.
- **FR-002**: The system MUST close a room immediately when its host intentionally uses the supported room-exit action.
- **FR-003**: The system MUST allow an unexpectedly disconnected host a 30-second reconnect grace period before declaring the room abandoned.
- **FR-004**: The system MUST cancel pending abandonment cleanup when a valid host connection returns during the grace period.
- **FR-005**: Every room-list evaluation MUST identify stale rooms before rendering, exclude them from the player-visible list, and request their deletion in the background.
- **FR-006**: Closing an abandoned room MUST remove its active-room record rather than only hiding it from the room list.
- **FR-007**: A closed room MUST no longer appear in active room listings and MUST reject new join attempts, including direct-link attempts.
- **FR-008**: Players who attempt to enter a room that has already been removed MUST follow the existing unavailable-room fallback without being added to a new room session.
- **FR-009**: The cleanup behavior MUST apply consistently to every supported game mode in the current room list and game routes.
- **FR-010**: Cleanup MUST preserve a room while its current host session is available, regardless of room age or recent gameplay activity.
- **FR-011**: Pre-existing active-room records that lack usable host-availability evidence and are older than 24 hours MUST be treated as stale during room-list evaluation, excluded before display, and queued for background deletion.
- **FR-012**: Pre-existing or legacy-shaped rooms with a currently available host MUST not be removed solely because lifecycle metadata is missing or incomplete.
- **FR-013**: Repeated or concurrent cleanup decisions for the same room MUST be safe and MUST NOT create duplicate history or affect unrelated rooms.
- **FR-014**: A temporarily failed cleanup MUST remain eligible for later automatic retry and MUST NOT require manual deletion to recover.
- **FR-015**: The feature MUST NOT require a scheduled job, recurring backend task, or continuously running cleanup process.
- **FR-016**: A room-list view that is already open MUST reevaluate a disconnected room when its grace period expires, even if no additional room data changes arrive.
- **FR-017**: Opportunistic cleanup MUST NOT create new historical room summaries; existing history records and existing intentional-close history behavior MUST remain unchanged.
- **FR-018**: The system MUST NOT transfer room ownership when host availability expires; heartbeat expiry MUST lead to the existing room-closure flow rather than host takeover.
- **FR-019**: While the host session is active, the system MUST renew server-timestamped host availability every 20 seconds, and that availability MUST expire after 90 seconds without a successful renewal.
- **FR-020**: Host-lease expiration MUST be the final abandonment boundary: at 90 seconds without renewal the room MUST be classified stale without adding the separate 30-second disconnect grace period.
- **FR-021**: Host-lease expiration MUST remain authoritative when browser throttling, backgrounding, device sleep, or suspension prevents renewal; a room MUST NOT be preserved solely because an older connection identifier remains stored.
- **FR-022**: A host-lease renewal MUST be accepted only while the room exists and both the host identity and `sessionID` match the room's current host session; an obsolete or delayed session MUST NOT extend the lease or recreate a deleted room.

### Key Entities

- **Active Room**: A currently joinable game space with an identifier, host, participants, game mode, creation time, current state, and host-availability status.
- **Host Connection**: Evidence that the room's current host session is available.
- **Host Lease**: Server-timestamped host-availability evidence renewed every 20 seconds and considered expired after 90 seconds without renewal.
- **Host Session**: The unique `sessionID` paired with the room's current host identity; together they authorize lease renewal until that session is replaced or the room is removed.
- **Pending Room Expiration**: The temporary state between an unexpected loss of the last host connection and the end of the reconnect grace period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of rooms already stale when a room list is evaluated are absent from the rendered list and have deletion requested within five seconds of that evaluation.
- **SC-002**: In acceptance testing, 100% of hosts that reconnect within the 30-second grace period retain the same room and game state.
- **SC-003**: In at least 100 tested active-room lifecycle variations, no room with a valid available host is removed by automatic cleanup.
- **SC-004**: Pre-existing rooms older than 24 hours with no usable evidence of an available host are never rendered and have deletion requested during the first room-list evaluation that encounters them.
- **SC-005**: A guest in a room that expires reaches a safe non-game screen with an understandable explanation within five seconds of the closure becoming observable.
- **SC-006**: No scheduled or continuously running cleanup process is required to satisfy the accepted room-list scenarios.
- **SC-007**: A failed background deletion is retried on a later room-list evaluation while the stale room remains hidden from players.
- **SC-008**: When no reliable disconnect timestamp is produced, a room with no successful host-lease renewal is classified stale, excluded from the room list, and eligible for guarded deletion no later than 90 seconds after its last server-timestamped renewal.
- **SC-009**: Acceptance coverage explicitly treats a host browser suspended beyond 90 seconds as unavailable and produces the same stale classification as any other missed-lease scenario.
- **SC-010**: Delayed heartbeat attempts from a replaced host session or a deleted room are rejected in 100% of acceptance race scenarios and never recreate an active-room record.

## Assumptions

- Room ownership is not transferred when the host disappears; heartbeat is only an abandonment signal and an expired host lease closes the room through the existing cleanup flow.
- Supporting multiple simultaneous host tabs or devices is outside this feature; the existing single-host-session behavior remains unchanged.
- Thirty seconds is the established reconnect tolerance for unexpected host disconnections and is sufficient for ordinary reloads or brief network interruptions.
- A host whose browser cannot renew the lease for 90 seconds is intentionally treated as unavailable, including when caused by background throttling or device suspension.
- A 24-hour age threshold is a conservative fallback only for pre-existing records that lack usable host-availability evidence; current host availability always takes precedence over age.
- Cleanup is opportunistic: if nobody evaluates the room list, a stale active-room record may remain stored until the next evaluation.
- Existing room history remains unchanged; opportunistic stale-room deletion does not create a new historical summary.
- Both classic-speed and Reaction Battle rooms are in scope through the current `/` and `/game/{gameId}` flows; the obsolete `/legacy` UI is out of scope.
- Temporary service failures may delay cleanup, but automatic retry is expected to restore the target outcome without operator intervention.
