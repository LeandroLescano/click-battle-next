# Quickstart: Reaction Battle Web Mode

## Prerequisites

- Node dependencies installed with the repo's existing package manager.
- Firebase emulator data available through the existing `backups` import if running full Playwright flows locally.
- Work is on branch `001-reaction-battle-web-mode`.

## Implementation Path

1. Update `@leandrolescano/click-battle-core` to the latest published version used by this plan, currently `1.3.0`, and refresh the lockfile.
2. Extend room creation state to include `gameMode` and optional `modeSettings`.
3. Add a compact mode selector to room creation with classic-speed as the default and Reaction Battle as the alternate option.
4. Persist the normalized `gameMode` and `modeSettings` returned by `normalizeRoomCreation`.
5. Display mode labels in room cards and game/lobby context using i18n.
6. Route `/game/[gameID]` mode rendering from normalized `currentGame.gameMode`.
7. Add a minimal `components-new/ReactionBattle/` experience with waiting, scheduled signal, visible signal, false-start, valid-result, and ended states.
8. Store Reaction Battle session state additively under the live room, including future `signalAt`, sync buffer, and persisted `reactionMs` results.
9. Keep classic-speed timer, click handling, result display, and reset behavior unchanged.
10. Add Playwright coverage for classic creation, reaction creation/join/play, false start, valid result, and legacy fallback.

## Local Verification

Run targeted checks after implementation:

```powershell
rtk npm run check:tsc
rtk npm run lint
rtk npm run check:i18n
rtk npm run test -- tests/e2e/game.spec.ts
```

For manual verification:

1. Start the local app and Firebase emulators with the repo's existing dev flow.
2. Create a classic-speed room and confirm the existing game still plays.
3. Create a Reaction Battle room and confirm the room card and game screen show Reaction Battle.
4. Join the reaction room as a second player.
5. Click before the signal and confirm the player cannot win through that click.
6. Reset or create another reaction session, wait for the locally displayed signal, click, and confirm a valid `reactionMs` result appears.
7. Open or seed a legacy room without `gameMode` and confirm it renders as classic-speed.

## Promotion Notes

- Validate the feature branch preview when available.
- Merge to `develop` only after local verification passes.
- Validate integrated behavior on `https://dev.click-battle.com.ar/` before promotion to `master`.
