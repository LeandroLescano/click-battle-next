# Feature Specification: Room Lobby and Mode Selection

**Feature Branch**: `feature/room-lobby-mode-selection`  
**Created**: 2026-09-12  
**Status**: Draft

## Intent

Make Click Battle understandable and shareable before changing how a match is played. The work is deliberately incremental:

1. Replace the home page's form-first entry with a responsive mode-selection experience.
2. In a later slice, improve the existing room lobby for host setup, invitations, presence, rematch, and switching modes.
3. Preserve the current room data model, gameplay rules, authentication, room entry, rankings, and Firebase contracts unless a later approved slice explicitly requires a change.

## User Scenarios & Testing

### User Story 1 - Choose a battle before configuring it (Priority: P1)

A new visitor can understand the two available game modes and choose one before seeing room configuration controls.

**Why this priority**: The current home page begins with implementation-shaped controls. A mode-first choice explains the product and gives the room form a useful default.

**Independent Test**: On the home page, select either mode card and verify that the existing room-creation controls remain available with the selected mode already applied.

**Acceptance Scenarios**:

1. **Given** a visitor opens the home page, **When** the page is ready, **Then** they see distinct cards for Speed Battle and Reaction Battle, each explaining its objective in plain language.
2. **Given** a visitor selects Speed Battle, **When** the room configuration is revealed, **Then** the existing creation flow is preselected for `classic-speed` and retains its existing timer control.
3. **Given** a visitor selects Reaction Battle, **When** the room configuration is revealed, **Then** the existing creation flow is preselected for `reaction` and keeps its existing mode-specific configuration behavior.
4. **Given** an existing user uses room creation after the redesign, **When** they create a room, **Then** the persisted game mode, room settings, host lease, analytics event, and route to `/game/{roomId}` follow the current contract.

---

### User Story 2 - Use the home page on any supported viewport (Priority: P1)

A visitor can discover a mode and create or join a room without clipped controls, horizontal scrolling, or inaccessible content on phone, tablet, or desktop widths.

**Why this priority**: Responsive behavior is a non-negotiable acceptance criterion for every visual change in this feature.

**Independent Test**: Exercise the primary home-page path at phone, tablet, and desktop viewport sizes and assert that the selected card, controls, and primary CTA are visible and usable.

**Acceptance Scenarios**:

1. **Given** a narrow viewport, **When** the home page loads, **Then** mode cards and room controls stack naturally with no horizontal page overflow.
2. **Given** a medium or wide viewport, **When** the home page loads, **Then** the mode cards use the available width without leaving interaction controls in an artificially narrow column.
3. **Given** any supported viewport, **When** a visitor changes mode or opens room configuration, **Then** keyboard focus, selected state, and the create action remain reachable without overlap or clipping.

---

### User Story 3 - Keep available rooms easy to join (Priority: P2)

A visitor can still discover and join an available room while the new mode-selection composition is present.

**Why this priority**: Mode discovery must not hide the active multiplayer surface that already works.

**Independent Test**: Seed or observe an available room and confirm its card remains visible and its existing join behavior is unchanged.

**Acceptance Scenarios**:

1. **Given** one or more joinable rooms exist, **When** a visitor opens the home page, **Then** the available-room list remains visible and joinable.
2. **Given** a room is full, password-protected, kicked, or stale, **When** a visitor interacts with it, **Then** the existing protection and error behavior remains unchanged.

---

### User Story 4 - Configure and invite from the room lobby (Priority: P3, later slice)

A room host can understand the room state, adjust allowed pre-game settings, and send an invitation without making a player decode a room ID.

**Why this priority**: This is the next product slice after the home entry is visually and behaviorally stable. It must not be bundled into the home change.

**Acceptance Scenarios**:

1. **Given** a host has created a lobby room, **When** the match has not started, **Then** they can see room name, selected mode, player capacity, player presence, and a prominent invitation action.
2. **Given** a player opens a room invitation, **When** the room is joinable, **Then** they arrive at the existing entry flow without manually entering an internal room identifier.
3. **Given** a room has started, **When** a player views the room, **Then** game settings cannot be changed in a way that alters the active match.

## Edge Cases

- A user selects a mode before auth/game-user initialization completes; the selection must remain visible and be applied once room creation becomes available.
- A user switches modes repeatedly; mode-specific controls must not preserve invalid values or cause a layout collision.
- JavaScript is slow or unavailable; the existing page heading and core entry messaging must remain meaningful in the initial document.
- Existing deep links, password-protected rooms, full-room handling, kicked-room handling, and stale-room cleanup remain outside the mode cards and must retain their current behavior.

## Requirements

### Functional Requirements

- **FR-001**: The home page MUST present Speed Battle and Reaction Battle as distinct selectable game-mode cards before or alongside detailed room configuration.
- **FR-002**: Each mode card MUST use localized title, description, and accessibility text.
- **FR-003**: Selecting a card MUST use the existing `GameMode` values and route through the existing room-creation normalization path; it MUST NOT create a parallel room schema or bypass Firebase room creation.
- **FR-004**: The existing mode-specific timer behavior MUST remain intact: Classic Speed exposes the timer control; Reaction Battle does not expose an irrelevant timer field.
- **FR-005**: The page MUST preserve the existing available-room list and its join, password, full-room, kicked-room, and stale-room behavior.
- **FR-006**: Every visual change in this feature MUST be fully responsive. At minimum, automated coverage and visual verification MUST cover a narrow phone, tablet, and 1080p desktop viewport in light and dark themes where applicable.
- **FR-007**: The home page MUST not introduce horizontal overflow at any verified viewport. Primary actions and selected-state feedback MUST remain visible and operable with mouse, touch, and keyboard.
- **FR-008**: Existing room creation analytics MUST continue emitting the selected mode. New acquisition or mode-selection analytics MAY be added only with an explicit event contract and without sensitive data.
- **FR-009**: The initial implementation slice MUST remain visual/compositional. It MUST NOT modify Firebase rules, room persistence shape, game rules, ranking logic, or the mobile client.
- **FR-010**: Any behavior change or new helper MUST follow test-first development. Existing Playwright flows MUST be adapted rather than deleted or skipped.

## Key Entities

- **Game mode card**: A localized, accessible presentation of an already-supported web `GameMode`; it does not introduce a new game mode or persistence type.
- **Room creation draft**: Existing client-side room values such as name, password, capacity, timer, and selected `GameMode`, normalized by `click-battle-core` before persistence.
- **Available room**: An existing Realtime Database game snapshot assessed through the current room-join contract.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new visitor can identify the objective of either mode and select it without interpreting a raw game-mode dropdown.
- **SC-002**: At verified phone, tablet, and 1920×1080 desktop viewports, the primary mode-selection and room-creation path has no horizontal overflow and no clipped actionable controls.
- **SC-003**: Targeted Playwright coverage proves both cards select the correct existing mode and the pre-existing room creation/join flows remain covered and passing.
- **SC-004**: Type checking, i18n validation, relevant Playwright tests, and a production build pass before the feature is proposed for integration.

## Assumptions

- The first slice targets the web home page only. The existing mobile app is not changed, although the selected values continue using shared core contracts.
- Classic Speed and Reaction Battle remain the only selectable web modes in this slice.
- The room-lobby invitation/rematch work is intentionally deferred until the home slice is validated.
- Local compilation or a local preview will be announced before it is started so the user can inspect it.
- Existing user-facing text will be translated through the English, Spanish, and Portuguese locale files.
