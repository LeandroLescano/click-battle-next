# Quickstart: Automatic Ghost Room Cleanup

## Safety First

Cleanup tests delete live-room records. Use the local Firebase emulators and confirm the application is connected to them. Do not run destructive room-cleanup scenarios against a Vercel preview, sandbox, development domain, or production until its Firebase target is explicitly confirmed safe.

## Prerequisites

- Install existing project dependencies.
- Start the Next.js app with the Firebase Auth, Realtime Database, and Firestore emulators.
- Ensure authenticated Playwright storage states exist before logged-in E2E tests.

## Local Environment

```powershell
rtk yarn dev:start
```

In a separate terminal, prepare authenticated players before running game tests:

```powershell
rtk yarn playwright test --project=setup
```

## Implementation Order

1. Extend local room types with `hostLease` and session-scoped disconnect-signal shapes.
2. Add `lib/game/hostLease.ts` for initial session registration, one-time legacy bootstrap, 20-second conditional renewal, and heartbeat shutdown.
3. Extend `lib/game/hostPresence.ts` and `lib/game/roomCleanup.ts` with 90-second lease classification and session-aware guarded deletion.
4. Initialize new rooms with their first lease in `components-new/CreateSection/index.tsx`.
5. Replace inline room `onDisconnect` mutation in `hooks/useRoomGame.ts` with the sibling session signal and start/stop heartbeat ownership there.
6. Combine room and disconnect-signal snapshots in `app/page.tsx`, retaining one nearest-deadline timer.
7. Extend emulator fixtures and Playwright coverage before treating the previous implementation validation as current.

## Required E2E Scenarios

- A room already beyond the 30-second disconnect grace is never rendered and is deleted.
- A room whose deadline is about one second away initially remains eligible, then disappears and is deleted without another Firebase write.
- A host recovery before the deadline cancels deletion and preserves the room.
- A room whose lease has not renewed for 90 seconds is hidden and deleted even when an old `hostConnectionId` remains.
- A lease at 89 seconds remains visible, then expires without another Firebase write or an additional grace period.
- A matching host session renews every 20 seconds and remains active beyond the original 90-second deadline.
- A replaced session's delayed heartbeat aborts and cannot extend the current lease.
- A delayed `onDisconnect` signal from an old session cannot close or alter the current session.
- A heartbeat after room deletion cannot recreate `games/{gameId}`.
- A host browser suspended beyond 90 seconds is treated as unavailable.
- A legacy room older than 24 hours with no presence fields is hidden and deleted.
- An equally old room opened by its authenticated owner bootstraps a current lease before cleanup, while a comparable room with only stale legacy presence is removed.
- A failed/aborted guarded deletion is retried by a later list evaluation while the room remains hidden.
- Old room data without lifecycle fields is cleaned through the current room list.
- A stale direct link does not add a visitor and follows the existing unavailable-room fallback.
- Classic-speed and Reaction Battle room creation/join smoke checks continue to pass.

Run the focused tests:

```powershell
rtk yarn playwright test tests/e2e/game.spec.ts --project=chromium --grep "ghost room|stale room|disconnect grace|host lease|heartbeat|host session"
```

## Static Verification

```powershell
rtk yarn check:tsc
rtk yarn lint:es
rtk yarn check:i18n
```

## Permission Verification

Use the isolated RTDB rules harness when you need to prove what the repository rules actually allow:

```powershell
rtk npx firebase emulators:start --config firebase.rules-check.json --only auth,database --project click-battle-rules-check
```

In a separate terminal:

```powershell
$env:RTDB_EMULATOR_HOST='127.0.0.1'
$env:RTDB_EMULATOR_PORT='9001'
$env:AUTH_EMULATOR_PORT='9098'
$env:RTDB_PROJECT_ID='click-battle-rules-check'
node scripts/verify-room-cleanup-rules.mjs
```

Expected result with the current deployed-equivalent rules: unauthenticated access is denied, while authenticated access is allowed for all required `hostLease` and `roomHostDisconnects` read/write/delete operations. See [permission-validation.md](permission-validation.md) for the captured findings.

## Manual Verification

1. Create a room in the emulator-backed app and inspect its initial `hostLease` owner, session, and server timestamps.
2. Observe at least two 20-second renewals for the same session.
3. Stop renewals without writing a disconnect signal, keep the old connection ID, and open `/` as another authenticated player around the 90-second boundary.
4. Confirm the room is visible before the boundary, hidden at expiry, and removed without an extra 30-second grace.
5. Repeat with a matching disconnect signal and confirm the existing 30-second recovery path.
6. Replace the session, submit a delayed old-session heartbeat/signal, and confirm the new session remains authoritative.
7. Delete the room, attempt another old heartbeat, and confirm `games/{gameId}` remains absent.

The obsolete `/legacy` UI is intentionally untouched and is not part of manual validation.

## Previous Baseline Validation (Before Host Lease)

- Authenticated Playwright setup passed against the local Firebase emulators (2/2).
- Focused cleanup coverage passed (10/10), including list filtering, deadline reevaluation, direct-link rejection, host recovery, session replacement, no room recreation after deletion, no cleanup-only Firestore history, and concurrent idempotent deletion.
- The complete Chromium game regression suite passed (21/21).
- `check:tsc` and targeted ESLint validation for every touched TypeScript source/test file passed.
- Repository-wide `lint:es` still reports unrelated pre-existing errors outside the touched files.
- `check:i18n` still reports 12 unrelated pre-existing ranking translation entries; this feature adds no user-facing copy.
- `app/legacy/page.tsx`, `firebase.json`, and `database.rules.json` have no feature diff. No cron, scheduled job, backend cleanup service, or security-rule expansion was introduced.
- The isolated rules harness confirms the deployed-equivalent RTDB ruleset allows the required authenticated lease/disconnect operations while still denying unauthenticated access.

These results validate the first cleanup increment only. Lease/session implementation requires rerunning auth setup, the focused lifecycle scenarios, and the complete Chromium game suite.

## Promotion Verification

- Validate the branch on its Vercel preview only after confirming whether the preview points at production Firebase; avoid destructive tests if it does.
- Merge into `develop`, verify non-destructive list and reconnect behavior at `https://dev.click-battle.com.ar/`, and inspect cleanup permissions in the intended environment.
- Promote to `master` only through a PR after branch and integrated validation pass.
