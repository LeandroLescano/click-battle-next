# Contract: Reaction Battle Mode

## Room Creation Contract

When a user creates a room, the web app passes the selected mode through the shared room creation contract.

**Inputs**:

- `roomName` or `name`: optional user-entered name.
- `password`: optional user-entered password.
- `timer`: classic-speed timer value, preserved for existing settings compatibility.
- `maxUsers`: room capacity.
- `gameMode`: `classic-speed` or `reaction`.
- `modeSettings`: optional mode settings input.

**Outputs persisted to the room**:

- `gameMode`: normalized mode from core.
- `modeSettings`: normalized settings from core.
- Existing room fields: `roomName`, `status`, `ownerUser`, `created`, `settings`, and `listUsers`.

**Compatibility**:

- Classic-speed creation persists `gameMode: classic-speed` and classic mode settings.
- Reaction creation persists `gameMode: reaction` and reaction mode settings.
- Password hashing behavior remains unchanged.

## Room Interpretation Contract

Every room snapshot used by room lists, lobby/game context, and game rendering is interpreted through shared core normalization.

**Rules**:

- Missing `gameMode` resolves to `classic-speed`.
- Missing compatible `modeSettings` resolves to core defaults.
- Unsupported modes are not rendered as playable reaction or classic rooms unless core normalization resolves them.
- The game screen routes UI from normalized `game.gameMode`.

## Reaction Gameplay Contract

Reaction Battle is a single-session minimal mode for this feature.

**Session lifecycle**:

- `waiting`: players can see the reaction UI and must wait.
- `scheduled`: host has written a future shared signal time; clients wait for their server-time-adjusted clock to reach it.
- `signal`: the signal is visible on the local client and valid clicks can be recorded.
- `ended`: results and winner are visible.

**Signal synchronization**:

- The host schedules `signalAt` in the future using a randomized delay plus a synchronization buffer.
- Clients estimate server time using Firebase server time offset when available.
- Clients display the signal locally when estimated server time reaches `signalAt`.
- Clients should not show the active signal before receiving the scheduled signal data.

**Click handling**:

- If a player clicks before their local UI has displayed the signal, store `status: false-start`.
- If a player clicks after their local UI has displayed the signal, store `status: valid`, `signalShownAt`, `clickedAt`, and `reactionMs`.
- Once a player has a false start for the current session, later clicks cannot turn that same session into a valid result.

**Winner handling**:

- Fastest valid `reactionMs` wins.
- False starts and unavailable results cannot win.
- Raw client timestamps must not be used as the primary winner metric.
- Ties resolve deterministically by stable stored ordering.

## UI Contract

**Room creation**:

- Mode selector includes classic-speed and Reaction Battle.
- Classic-speed remains the default selection.

**Room list and lobby/game context**:

- Room cards display a readable mode label.
- Reaction rooms display Reaction Battle-specific context.
- Legacy rooms display as classic-speed.

**Game screen**:

- `classic-speed` renders the existing click-speed UI.
- `reaction` renders the Reaction Battle UI.
- Reaction UI shows waiting, signal, false-start, valid result, and winner states.

## Verification Contract

Coverage must prove:

- Classic-speed room creation still works.
- Reaction room creation persists and displays reaction mode.
- A second player can join a reaction room.
- Reaction rooms render the reaction UI for both players.
- Early click becomes false start.
- Post-signal click records a valid result.
- Legacy rooms without `gameMode` route to classic-speed.
