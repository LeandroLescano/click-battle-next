# Feature Specification: Reaction Battle Web Mode

**Feature Branch**: `001-reaction-battle-web-mode`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "Add Reaction Battle as the first real alternative web game mode using the shared room game mode contract, while preserving the existing classic click-speed flow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Rooms By Game Mode (Priority: P1)

As a player starting a room, I can choose between the existing classic-speed game and the new Reaction Battle mode so that the room clearly represents the kind of match I want to play.

**Why this priority**: This is the entry point for the minigame hub direction and must preserve the existing room creation behavior while adding the first alternate mode.

**Independent Test**: Can be tested by creating one classic-speed room and one reaction room, then verifying each room displays the selected mode and stores enough mode information for later screens to interpret it correctly.

**Acceptance Scenarios**:

1. **Given** a player is creating a room, **When** they select classic-speed and confirm, **Then** a classic-speed room is created and appears as a classic-speed room wherever rooms are listed or joined.
2. **Given** a player is creating a room, **When** they select Reaction Battle and confirm, **Then** a reaction room is created and appears as a Reaction Battle room wherever rooms are listed or joined.
3. **Given** a room is created, **When** the room is viewed in a list, lobby, or game context, **Then** players can tell which game mode the room uses before or during play.

---

### User Story 2 - Play A Reaction Battle Room (Priority: P2)

As players in a reaction room, we wait for a visual signal, avoid clicking early, and compete to record the fastest valid reaction after the signal.

**Why this priority**: The alternate mode must be playable end to end, not just selectable, for the product to become a real multi-mode experience.

**Independent Test**: Can be tested by having two players join a reaction room, start the match, click before and after the signal, and verify false starts, reaction results, and winner selection are handled consistently.

**Acceptance Scenarios**:

1. **Given** two players are in a reaction room, **When** the game begins, **Then** both players see a Reaction Battle-specific game experience instead of the classic-speed experience.
2. **Given** the reaction signal has not appeared, **When** a player clicks, **Then** that click is treated as a false start and cannot count as a winning valid reaction.
3. **Given** the reaction signal has appeared for a player, **When** that player clicks, **Then** the game records that player's locally measured reaction time from the moment their client displayed the shared signal.
4. **Given** multiple players have valid reaction results, **When** results are compared, **Then** the player with the fastest valid reaction is shown as the winner.

---

### User Story 3 - Preserve Classic And Legacy Rooms (Priority: P3)

As a player joining existing or classic-speed rooms, I continue to get the current classic click-speed gameplay even if older rooms do not include explicit mode metadata.

**Why this priority**: The new mode must not break current production behavior or existing room data.

**Independent Test**: Can be tested by opening a room with no explicit game mode and by creating a new classic-speed room, then verifying both route to the classic-speed game experience.

**Acceptance Scenarios**:

1. **Given** an existing room has no explicit game mode, **When** a player opens it, **Then** the room is interpreted as classic-speed.
2. **Given** a newly created classic-speed room, **When** players join and play, **Then** the gameplay behavior remains compatible with the current classic click-speed game.
3. **Given** a room has unsupported or missing mode settings, **When** a player opens it, **Then** the room falls back to a safe classic-speed-compatible interpretation or shows a non-blocking recovery state without corrupting room data.

### Edge Cases

- A player clicks repeatedly before the reaction signal appears.
- A player joins a reaction room after the reaction session has started.
- One player false-starts while another player waits and clicks after the signal.
- Two valid reactions produce the same measured result.
- A room exists without game mode metadata because it was created before this feature.
- A room has a recognized game mode but incomplete mode settings.
- A reaction player disconnects or leaves before recording a result.
- The interface is used on narrow mobile screens where the signal and click target must remain clear.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to select a game mode during room creation, with classic-speed and Reaction Battle available options.
- **FR-002**: The system MUST create both classic-speed rooms and reaction rooms through the canonical room creation contract.
- **FR-003**: The system MUST preserve the normalized room game mode and mode settings produced during room creation.
- **FR-004**: The system MUST interpret rooms without explicit game mode metadata as classic-speed rooms.
- **FR-005**: The system MUST display a readable room mode label in room lists, lobby context, and game context.
- **FR-006**: The game screen MUST choose the player-facing game experience from the room's normalized game mode.
- **FR-007**: Classic-speed room creation and gameplay MUST remain compatible with the existing player flow.
- **FR-008**: Reaction rooms MUST present a waiting phase before a randomized visual signal appears.
- **FR-009**: Reaction rooms MUST evaluate all players' clicks against the same reaction signal for the active session.
- **FR-010**: A click before the reaction signal MUST be recorded as a false start and MUST NOT be eligible to win through reaction time.
- **FR-011**: A click after the reaction signal MUST record a valid reaction result measured locally from when the player's client displayed the signal.
- **FR-012**: Reaction Battle winner selection MUST prefer the fastest valid reaction result over false starts and missing results.
- **FR-013**: Reaction Battle MUST show each player whether their latest result is waiting, false start, valid reaction, or unavailable.
- **FR-014**: A second player MUST be able to join a reaction room and see the same reaction-specific room and game context as the creator.
- **FR-015**: The interface MUST remain usable on desktop and mobile web viewports for mode selection, room lists, lobby context, and gameplay.
- **FR-016**: Verification coverage MUST prove room creation mode metadata, game-mode routing, reaction false-start handling, valid reaction recording, and legacy classic-speed fallback.
- **FR-017**: Reaction Battle MUST schedule the shared signal far enough in the future that joined clients can receive it before it appears under normal realtime latency.

### Key Entities *(include if feature involves data)*

- **Room**: A joinable game space with a room code or identifier, participants, game mode, mode settings, and current game state.
- **Game Mode**: The room's declared play style. Supported values for this feature are classic-speed and reaction.
- **Mode Settings**: Mode-specific room configuration needed to interpret or play a room. Reaction settings include enough information to run a minimal reaction session consistently for all players.
- **Reaction Session**: The active Reaction Battle attempt within a room, including waiting state, scheduled signal state, client-visible signal state, player results, and completion state.
- **Reaction Result**: A player's outcome for a reaction session, represented as waiting, false start, valid locally measured reaction time, or unavailable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly created rooms expose a readable game mode label before gameplay begins.
- **SC-002**: 100% of legacy rooms without game mode metadata route to the classic-speed experience during verification.
- **SC-003**: Two players can create, join, and complete a minimal reaction room session in under 2 minutes during acceptance testing.
- **SC-004**: In reaction verification, 100% of pre-signal clicks are marked as false starts and never beat valid post-signal clicks.
- **SC-005**: In reaction verification, 100% of valid post-signal clicks produce a visible result and deterministic winner outcome.
- **SC-006**: Classic-speed room creation and gameplay acceptance checks continue to pass after Reaction Battle is added.
- **SC-007**: Mode selection, room labels, and reaction gameplay remain usable without horizontal scrolling on representative desktop and mobile viewport widths.

## Assumptions

- The first Reaction Battle release is a single-session minimal mode, not best-of-3.
- Classic-speed remains the default interpretation for older rooms and for any room where mode metadata is absent.
- Reaction Battle prioritizes correctness and clarity over advanced visual polish for this first vertical slice.
- Reaction results are compared within a single room session and do not affect global ranking redesign.
- Existing player identity, joining, and room lifecycle concepts continue to be used.
- No large historical data migration is required beyond storing the fields needed for room mode and reaction session behavior.
