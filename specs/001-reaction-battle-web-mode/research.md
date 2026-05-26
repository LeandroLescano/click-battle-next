# Research: Reaction Battle Web Mode

## Decision: Update core package to 1.3.0 before implementation

**Rationale**: The installed `@leandrolescano/click-battle-core` package is `1.2.2`, and its types do not include `gameMode`, `modeSettings`, `NormalizedGame`, or game-mode helpers. The latest published version is `1.3.0`, which adds `SUPPORTED_GAME_MODES`, `GameMode`, `GameModeSettings`, normalized room creation output, and legacy fallback behavior in room normalization.

**Alternatives considered**:

- Keep `1.2.2` and define mode types locally. Rejected because the feature explicitly requires the shared core contract.
- Implement mode normalization only in the web app. Rejected because it would duplicate the shared package responsibility and risk drift.

## Decision: Use core normalization for all room creation and room interpretation

**Rationale**: `normalizeRoomCreation` in core `1.3.0` defaults missing mode data to `classic-speed`, validates requested modes, and returns a normalized room with `gameMode` and `modeSettings`. `parseGameSnapshot` also returns a normalized game, including legacy fallback to `classic-speed` when `gameMode` is absent.

**Alternatives considered**:

- Add web-only fallback checks around every room read. Rejected because it scatters compatibility rules and makes future modes harder to add.
- Store display labels only and infer behavior from room name or route. Rejected because labels are not a reliable gameplay contract.

## Decision: Keep classic-speed components unchanged and route mode UI at the game page boundary

**Rationale**: The existing classic-speed flow is already split across `/game/[gameID]`, `useRoomGame`, `LocalSection`, `OpponentSection`, `ResultSection`, and `useGameTimer`. Routing by `currentGame.gameMode` near `/game/[gameID]` preserves that existing flow and lets Reaction Battle use its own minimal UI without changing click-speed rules.

**Alternatives considered**:

- Merge mode branches deeply into `LocalSection`, `OpponentSection`, and `ResultSection`. Rejected because it raises regression risk in the current production game.
- Create separate routes per mode. Rejected because rooms should remain joinable by the existing room URL and mode should come from normalized room data.

## Decision: Represent Reaction Battle as an additive live session state under the room

**Rationale**: Reaction Battle needs shared signal state and per-player outcomes. Keeping this data in the current live room record lets both players observe the same session through the existing realtime subscription and avoids a separate service or schema migration.

**Alternatives considered**:

- Store reaction state only in local component state. Rejected because clients would disagree about signal timing and results.
- Add a new top-level database collection for reaction sessions. Rejected for the first vertical slice because the room already carries live game state and lifecycle cleanup.

## Decision: Use a scheduled shared signal plus local reaction measurement

**Rationale**: The host should coordinate the round by writing a shared signal time that is scheduled far enough in the future for joined clients to receive it before display. Each client should use the shared scheduled signal, adjusted with Firebase server time offset when available, to display the signal locally and then measure `reactionMs` from the moment that client actually displayed it. Persisting `reactionMs` gives all clients one deterministic value to compare while avoiding unfair raw comparisons between a host timestamp and remote client click timestamps.

**Alternatives considered**:

- Let each client generate its own random signal. Rejected because players would see different start moments.
- Compare raw click timestamps directly against the host-created signal timestamp. Rejected because network latency, delivery timing, and client clock skew can make this unfair.
- Use only client-local elapsed timers with no stored scheduled signal. Rejected because it increases disagreement about when a round began.
- Require a server-authoritative reaction service for v1. Deferred because this first vertical slice can reach acceptable fairness with a scheduled shared signal, Firebase server time offset, and persisted local `reactionMs`.

## Decision: Add Playwright coverage for the user-visible vertical slice

**Rationale**: The constitution expects gameplay and room-flow changes to include meaningful verification. Existing tests already cover creating, joining, starting, clicking, password rooms, kicking, and timer settings. Extending these tests for mode selection, labels, reaction false starts, valid results, and legacy fallback provides the most direct safety net.

**Alternatives considered**:

- Only run TypeScript and lint. Rejected because this feature changes user-facing realtime gameplay.
- Add broad unit tests before E2E. Deferred because the highest risk is cross-client behavior; pure helper tests can still be added if reaction scoring helpers are extracted.
