# Feature Specification: Reaction Battle Security and Reliability

**Feature Branch**: `004-reaction-battle-security`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: User description: "Harden Reaction Battle's production data contract and improve round reliability without redesigning the game or breaking classic-speed. Existing live rooms may be deleted at deployment; no legacy-room data compatibility is required."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a protected reaction round (Priority: P1)

As a Reaction Battle participant, I can submit one legitimate outcome for my own turn, so that no player can alter another player's outcome or replace a result after seeing it.

**Why this priority**: Fair, immutable player outcomes are the minimum requirement for a multiplayer reaction game and for trustworthy round winners.

**Independent Test**: Two authenticated participants play one round. Each can submit one valid personal outcome; attempts to submit for the other player, revise a submitted outcome, or remove it are rejected.

**Acceptance Scenarios**:

1. **Given** an active Reaction Battle round and a participating player without a result, **When** that player submits one valid outcome for their own identity, **Then** exactly that outcome is recorded for the round.
2. **Given** a player has submitted an outcome for the active round, **When** the player or any other participant tries to modify or delete it, **Then** the stored outcome remains unchanged and the request is rejected.
3. **Given** two participants submit valid personal outcomes at nearly the same time, **When** both submissions are processed, **Then** both outcomes are preserved and neither replaces the other.

---

### User Story 2 - Run a host-controlled, reliable round (Priority: P1)

As the room host, I can start, advance, complete, reset, and return a Reaction Battle round to the lobby safely, so that shared game state cannot be manipulated by guests and transient failures do not leave the room frozen.

**Why this priority**: Shared transitions determine every player's view of the match; unauthorized or failed transitions make the mode unplayable.

**Independent Test**: A host completes a normal round while a guest attempts every shared transition. Guest attempts are rejected; a deliberately failed host transition displays recoverable feedback and succeeds on retry without reloading the room.

**Acceptance Scenarios**:

1. **Given** a Reaction Battle room, **When** a non-host attempts to start, reset, finalize, select a winner, or change shared room lifecycle state, **Then** the request is rejected and the visible state is unchanged.
2. **Given** an eligible host, **When** the host performs an allowed transition, **Then** the state changes once and all connected participants converge on the persisted state.
3. **Given** an allowed host transition fails temporarily, **When** the failure is reported, **Then** the host receives a recoverable error and can retry successfully without leaving the round permanently blocked.
4. **Given** the host rapidly activates a start or reset control more than once, **When** the request is processed, **Then** at most one successful transition is recorded.

---

### User Story 3 - Start only with a synchronized clock (Priority: P1)

As a room host, I see when the game clock is still synchronizing and cannot schedule the round signal until synchronization is ready, so players receive a consistent signal time.

**Why this priority**: A signal scheduled before clock synchronization produces inconsistent reaction measurements between players.

**Independent Test**: Open a host room before a server-time value is available, verify start is unavailable with clear feedback, then provide a valid value and verify start becomes available and schedules a normal round.

**Acceptance Scenarios**:

1. **Given** a host has not received a valid server-time synchronization value, **When** the host views the round controls, **Then** start is unavailable and the interface explains that synchronization is in progress.
2. **Given** server-time synchronization becomes ready, **When** the host starts the round, **Then** the signal is scheduled using the synchronized clock.
3. **Given** synchronization is lost after it was ready, **When** a new signal would otherwise be scheduled, **Then** the host receives predictable waiting or recovery feedback and no unsynchronized signal is scheduled.

---

### User Story 4 - Preserve valid outcomes and rankings (Priority: P2)

As a player, I can trust that only valid round outcomes determine the winner and appear in public Reaction rankings, while suspicious client-measured results are not presented as authoritative anti-cheat proof.

**Why this priority**: Invalid values can poison a winner, room statistics, and rankings even when normal gameplay appears to work.

**Independent Test**: Submit malformed, out-of-window, non-numeric, negative, and implausibly fast values and verify none changes winner selection, statistics, or public ranking; complete a valid round and verify its deterministic outcome is eligible.

**Acceptance Scenarios**:

1. **Given** a submitted outcome is malformed or outside the round's allowed response window, **When** it is evaluated, **Then** it is rejected and cannot influence a winner, statistic, or ranking.
2. **Given** a measured valid reaction is below 100 milliseconds, **When** it is submitted, **Then** it is treated as suspicious and is ineligible for winner selection and public ranking.
3. **Given** accepted outcomes have equal valid reaction times, **When** the round determines a winner, **Then** the documented deterministic tie-breaker selects the same winner for every participant.
4. **Given** a false start is accepted for a player, **When** that player later attempts a valid reaction in the same round, **Then** the later reaction is rejected and the false start remains terminal.

---

### User Story 5 - Keep classic-speed playable (Priority: P2)

As an existing Click Battle player, I can continue using newly created classic-speed rooms while Reaction Battle protection is introduced.

**Why this priority**: The security work must not regress the established game paths that share room infrastructure.

**Independent Test**: Create a new classic-speed room and complete its join, play, kick, leave, and cleanup flow without Reaction Battle-only controls or restrictions.

**Acceptance Scenarios**:

1. **Given** a classic-speed room, **When** players create, join, play, and leave it, **Then** its existing behavior remains unchanged.
2. **Given** a player joins, leaves, is kicked, reconnects, or is cleaned up as a ghost in a newly created supported room, **When** the flow completes, **Then** the room remains consistent and permitted users retain only their intended capabilities.

### Edge Cases

- A participant disconnects, is kicked, or leaves during an active round; the remaining room state settles according to existing completion and timeout rules without granting the departed participant further write access.
- A valid response arrives while the host is evaluating completion; the host does not finalize until the accepted triggering outcomes are visible in shared state.
- The response timeout expires with zero or one participant outcome; the round completes using the existing timeout behavior without stale outcomes entering the next round.
- A host reconnects or refreshes during a recoverable failure; retry capability follows the current room ownership rather than a stale local control state.
- Existing live rooms are deleted as part of deployment; no migration or fallback authorization is supplied for rooms created before this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve authenticated read access needed for existing supported game flows while enforcing least-privilege write access for room, participant, configuration, and game-list data.
- **FR-002**: The system MUST permit a participant to create one Reaction Battle result only at the location and identity assigned to that participant for the active round.
- **FR-003**: The system MUST reject a Reaction Battle result whose participant identity does not match the authenticated submitting participant or, where participant identity can be verified safely, whose displayed name does not match the room participant identity.
- **FR-004**: The system MUST reject attempts to create, edit, delete, or replace another participant's result, and MUST reject edits or deletion of a submitted result for the lifetime of its round.
- **FR-005**: The system MUST accept only documented outcome statuses and input types, with all fields required for each outcome type.
- **FR-006**: The system MUST require a finite numeric reaction time for valid outcomes, reject negative, non-numeric, non-finite, and out-of-window values, and treat values below 100 milliseconds as suspicious and ineligible for a win, statistic, or public ranking.
- **FR-007**: The system MUST keep a false-start outcome terminal for its participant and round; it cannot later be converted to a valid reaction.
- **FR-008**: The system MUST permit only the current room host to create or reset a Reaction Battle session, change its shared status or winner, and modify the shared room lifecycle state.
- **FR-009**: The system MUST retain the existing authorized participant join, leave, kick, password, host-presence, and ghost-room-cleanup flows, each limited to its necessary ownership.
- **FR-010**: The system MUST prevent unauthorized participants from altering room statistics or historical game records unrelated to a room they host; a permitted statistics update must correspond to that room's completed round data.
- **FR-011**: The system MUST ensure that invalid, malformed, suspicious, or untrusted reaction values do not become public ranked winning results. Public client-measured results MUST not be represented as competitive-grade authoritative proof.
- **FR-012**: The system MUST expose whether server-time synchronization is ready and MUST not treat an initial default clock offset as synchronized.
- **FR-013**: The system MUST prevent a Reaction Battle signal from being scheduled until server-time synchronization is ready, and MUST give the host clear waiting or recovery feedback when it is unavailable.
- **FR-014**: The system MUST wait for shared-state transition confirmation before marking signal promotion, round finalization, reset, or return-to-lobby actions complete locally.
- **FR-015**: The system MUST clear local transition guards after a failed write, provide recoverable error or retry feedback, prevent unhandled failures, and prevent duplicate successful transitions.
- **FR-016**: The system MUST preserve one result per participant per round, isolate results between rounds, wait for accepted completion-triggering results before finalization, preserve timeout completion, and select winners deterministically, including ties.
- **FR-017**: The system MUST version and keep the production authorization configuration in the repository so it can be deployed and tested reproducibly.
- **FR-018**: The system MUST include automated authorization tests for allowed and rejected participant, host, result, transition, concurrent-result, and statistics-write cases, plus deterministic gameplay coverage for synchronization, retry, normal, false-start, simultaneous-input, timeout, next-round, and newly created classic-speed flows.

### Key Entities

- **Reaction session**: The shared state of one Reaction Battle round, including its lifecycle status, scheduled signal, winner, and participant outcomes.
- **Reaction result**: One immutable outcome submitted by a room participant for one session, with outcome category, input category, participant identity, and, when valid, reaction time.
- **Room host**: The current participant authorized to control shared room lifecycle and Reaction Battle session transitions.
- **Room participant**: An authenticated player associated with a room and eligible to submit only their own outcome while participating.
- **Room statistics**: Persisted completed-room summaries and historical game entries that may inform public rankings.
- **Server-time readiness**: The explicit state that a valid shared clock offset has been received and can safely be used to schedule a signal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In automated authorization coverage, 100% of attempts to write another participant's result, overwrite or delete a submitted result, or perform a non-host shared transition are rejected.
- **SC-002**: In deterministic two-player gameplay coverage, 100% of normal, false-start, simultaneous-input, timeout, and next-round scenarios complete with the expected persisted outcomes and deterministic winner.
- **SC-003**: In synchronization coverage, 100% of attempted Reaction Battle starts before valid server-time readiness remain blocked with host-visible feedback; eligible starts become available after readiness.
- **SC-004**: In simulated transient write-failure coverage, 100% of start, promote, finalize, reset, and return-to-lobby failures leave a recoverable state in which a subsequent retry succeeds without page reload.
- **SC-005**: In validation coverage, 100% of malformed, non-finite, negative, out-of-window, and sub-100-millisecond reaction values are unable to influence winner selection, stored statistics, or the public Reaction ranking.
- **SC-006**: Newly created classic-speed automated journeys pass unchanged after this feature.
- **SC-007**: All changed source files pass the project's type, translation, focused lint, authorization-test, and relevant gameplay-test checks.

## Assumptions

- The existing room host identity is the authority for host-only permissions. Rooms present at deployment may be deleted; every supported post-deployment room has a reliable owner UID.
- A valid reaction time is greater than or equal to 100 milliseconds and no greater than the active round's configured response window. This is a casual-game plausibility policy, not a claim of authoritative anti-cheat measurement.
- Existing client-measured Reaction Battle data can be protected against unauthorized writes and invalid values but cannot provide competitive-grade proof without a trusted measurement authority; the feature will describe this limitation wherever ranking trust is represented.
- Existing participant membership, password, host-presence, and ghost-room-cleanup behavior remain product requirements and may be narrowed only to their demonstrated necessary permissions.
- No migration of pre-deployment room data, domain rules, new game mode, UI redesign, React Native work, monetization work, global-ranking redesign, or unrelated cleanup is included.
