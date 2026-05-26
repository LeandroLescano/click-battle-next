# Data Model: Reaction Battle Web Mode

## Room

Represents a live joinable game room.

**Fields**:

- `key`: room identifier.
- `roomName`: user-facing room name.
- `ownerUser`: owner username and key.
- `listUsers`: active room users.
- `status`: current room state, one of `lobby`, `countdown`, `playing`, or `ended`.
- `settings`: shared room settings, including `timer`, `maxUsers`, and optional password.
- `gameMode`: normalized game mode. For this feature, expected values are `classic-speed` or `reaction`.
- `modeSettings`: normalized mode-specific settings.
- `reactionSession`: optional live Reaction Battle session state, present for reaction rooms after a session is prepared or started.

**Validation rules**:

- Missing `gameMode` MUST normalize to `classic-speed`.
- Missing `modeSettings` MUST normalize through the shared core defaults for the resolved mode.
- New room creation MUST persist the normalized `gameMode` and `modeSettings`.
- Classic-speed rooms MUST remain valid without `reactionSession`.

## Game Mode

Declares which game experience a room uses.

**Values in scope**:

- `classic-speed`: existing click-speed game.
- `reaction`: new Reaction Battle mode.

**Validation rules**:

- Unsupported values MUST NOT silently create an unsupported room.
- Game rendering MUST use the normalized mode from the shared core, not raw room input.

## Mode Settings

Stores mode-specific configuration returned by shared core normalization.

**Classic-speed settings**:

- `gameMode`: `classic-speed`.
- `config`: empty object.

**Reaction settings**:

- `gameMode`: `reaction`.
- `config.windowMs`: positive integer result window duration, defaulted by shared core when omitted.

**Validation rules**:

- `modeSettings.gameMode` MUST match the room `gameMode`.
- Invalid mode settings MUST be rejected or safely recovered before gameplay starts.

## Reaction Session

Represents one minimal Reaction Battle attempt inside a reaction room.

**Fields**:

- `status`: `waiting`, `scheduled`, `signal`, or `ended`.
- `createdAt`: server-generated creation timestamp when available.
- `signalAt`: shared scheduled server-time timestamp for when joined clients should display the signal.
- `signalDelayMs`: randomized delay chosen for the round.
- `syncBufferMs`: minimum future buffer between scheduling and display so clients can receive the signal before it appears.
- `results`: mapping from player key to Reaction Result.
- `winnerKey`: player key for the fastest valid reaction, if one exists.

**State transitions**:

- `waiting` -> `scheduled`: host starts a randomized wait and writes a future shared signal timestamp.
- `scheduled` -> `signal`: each client displays the signal locally when its server-time-adjusted clock reaches `signalAt`.
- `signal` -> `ended`: enough results are recorded or the result window closes.
- `ended` -> `waiting`: host resets or starts a new minimal session.

**Validation rules**:

- A result attempted before the local client has displayed the signal MUST be a false start.
- A valid result MUST be measured locally from the moment the client displayed the signal.
- Persisted valid results MUST include `reactionMs` so winner selection does not depend on comparing raw client timestamps.
- Winner selection MUST ignore false starts and missing results.
- Ties MUST use a deterministic tie-breaker, such as earliest stored result time and then stable player key order.

## Reaction Result

Represents a single player's outcome for the active reaction session.

**Fields**:

- `playerKey`: user key.
- `username`: display name at the time of result.
- `status`: `waiting`, `false-start`, `valid`, or `unavailable`.
- `clickedAt`: client-observed click timestamp for audit/debug display when present.
- `signalShownAt`: client-observed timestamp for when the signal was displayed locally.
- `reactionMs`: non-negative reaction time for valid results.

**Validation rules**:

- A player may have at most one final result per active session.
- Repeated early clicks MUST remain a false start and MUST NOT become valid later in the same session.
- Valid `reactionMs` MUST be non-negative.
- Winner comparison MUST use persisted `reactionMs`, not raw `clickedAt`.

## Room Stats

Represents historical room summary data already collected by the app.

**Fields affected by this feature**:

- Optional mode label can be recorded for future analysis, but current stats behavior must not block gameplay.

**Validation rules**:

- Existing room stats shape MUST remain compatible.
- Reaction implementation MUST NOT require a historical stats migration.
