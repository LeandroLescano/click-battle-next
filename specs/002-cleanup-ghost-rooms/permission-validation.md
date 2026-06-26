# Permission Validation: Automatic Ghost Room Cleanup

## Scope

Validate the read/write/delete behavior required by:

- `games/{gameId}/hostLease`
- `roomHostDisconnects/{gameId}/{sessionId}`

without broadening `database.rules.json` and without running destructive checks against an unsafe Firebase target.

## What was verified locally

### 1. Lifecycle behavior with the existing emulator-backed app

The feature logic was validated end-to-end through authenticated Playwright coverage against the local emulators:

- `tests/e2e/auth.setup.ts --project=setup`
- `tests/e2e/game.spec.ts --project=chromium --workers=1`

These runs proved the room-lifecycle behavior, but not representative Realtime Database authorization behavior, because the repository's main `firebase.json` does not wire `database.rules.json` into the RTDB emulator configuration.

### 2. Current deployed-equivalent rules on an isolated RTDB emulator

An isolated RTDB emulator was started with:

```powershell
rtk npx firebase emulators:start --config firebase.rules-check.json --only auth,database --project click-battle-rules-check
```

That config explicitly points to the repository `database.rules.json`, updated to match the deployed ruleset shared during validation:

- `games/**`: authenticated read/write
- `roomHostDisconnects/**`: authenticated read/write
- `gamesList/**`, `users/**`, `config/**`: authenticated read/write
- everything else: denied

Then the verification script was run:

```powershell
$env:RTDB_EMULATOR_HOST='127.0.0.1'
$env:RTDB_EMULATOR_PORT='9001'
$env:AUTH_EMULATOR_PORT='9098'
$env:RTDB_PROJECT_ID='click-battle-rules-check'
node scripts/verify-room-cleanup-rules.mjs
```

Observed result:

- unauthenticated client:
  - read/write/delete `games/{gameId}/hostLease` -> denied (`401`)
  - read/write/delete `roomHostDisconnects/{gameId}/{sessionId}` -> denied (`401`)
- authenticated client:
  - read/write/delete `games/{gameId}/hostLease` -> allowed
  - read/write/delete `roomHostDisconnects/{gameId}/{sessionId}` -> allowed

## Conclusion

The ghost-room cleanup feature's required RTDB paths are compatible with the deployed-equivalent ruleset provided for this project:

- unauthenticated access remains blocked
- authenticated clients can initialize, renew, read, and delete `hostLease`
- authenticated clients can write, read, and delete `roomHostDisconnects`

## Remaining caveat

The repository's main `firebase.json` still does not wire `database.rules.json` into the default RTDB emulator startup path, so the isolated harness remains the authoritative local permission check. This is a tooling consistency gap, not a feature-authorization blocker.
