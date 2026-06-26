# Contract: Lease-Based Opportunistic Room Cleanup

## Scope

This contract governs host-session registration, heartbeat renewal, disconnect signaling, room classification, display, and guarded deletion without a scheduled job or host takeover.

## Persisted Contract

Modern rooms contain:

```text
games/{gameId}/hostLease {
  ownerId: string,
  sessionId: string,
  claimedAt: server timestamp,
  lastRenewedAt: server timestamp
}
```

Reliable disconnect callbacks write outside the active room:

```text
roomHostDisconnects/{gameId}/{sessionId} {
  disconnectedAt: server timestamp
}
```

`hostConnectionId` and inline `hostDisconnectedAt` remain readable compatibility fields but are not sufficient to prove a modern host is alive.

## Host Session Contract

1. A new room is created with its initial host lease in the same atomic root update.
2. A returning owner may replace the current session only while the room and current lease still exist and ownership matches.
3. A legacy room without a lease may be bootstrapped once through a guarded whole-room transaction.
4. No session registration, renewal, or delayed callback may recreate an absent `games/{gameId}` record.
5. Ownership is never transferred to a guest.

## Heartbeat Contract

1. The current host attempts renewal every 20 seconds.
2. Renewal transacts only at `games/{gameId}/hostLease`.
3. It commits a server timestamp only if `ownerId` and `sessionId` equal the caller's current host session.
4. A null, missing, deleted, or mismatched lease aborts and stops that heartbeat loop.
5. After 90 seconds without a committed renewal, the lease is stale immediately; no additional grace applies.
6. Background throttling, device sleep, and browser suspension do not extend the 90-second deadline.

## Disconnect Contract

1. `onDisconnect` writes `disconnectedAt` under the exact session's sibling signal path.
2. Only a signal matching the room's current `hostLease.sessionId` participates in classification.
3. A matching signal starts the existing 30-second reconnect grace.
4. A later committed renewal for that same session supersedes the signal; signal removal ordering is not destructive authority.
5. Signals for replaced sessions are ignored and cleaned best-effort.

## Classification Contract

Given room `room`, matching disconnect signal `signal`, and server-aligned `now`:

| Condition | State | Visible | Delete requested | Next reevaluation |
|---|---|---|---|---|
| Valid lease, `lastRenewedAt > signal.disconnectedAt` or no matching signal, and age `< 90s` | active | Yes | No | At lease deadline |
| Matching signal is newer than renewal and age `< 30s` | pending | Yes | No | At disconnect deadline |
| Matching signal is newer than renewal and age `>= 30s` | stale disconnect | No | Yes | None |
| Lease renewal age `>= 90s` | stale lease | No | Yes | None |
| No usable lease/current signal and room age `>= 24h` | stale legacy | No | Yes | None |
| No usable evidence and room age `< 24h` | unknown legacy | Yes if parseable | No | At 24-hour boundary |
| Malformed or contradictory evidence without a positive stale rule | unknown | Yes if parseable | No | None |

The classifier is pure and shared by current `/` and `/game/{gameId}` flows. `/legacy` is excluded.

## Room List Contract

1. Subscribe to current rooms and session-scoped disconnect signals.
2. Retain the latest value from both sources and evaluate a consistent in-memory pair whenever either changes.
3. Estimate server time through the existing server-time offset.
4. Partition before committing visible list state.
5. Start guarded deletion for stale rooms without blocking rendering.
6. Maintain one cancellable timeout for the earliest disconnect, lease, or legacy deadline.
7. Clear listeners and the timeout on unmount.

No viewer polling interval, scheduled job, backend endpoint, or continuously running cleanup service is allowed.

## Guarded Deletion Contract

Input: database, room key, lifecycle evidence, server-aligned time provider.

1. Transact at `games/{gameId}`.
2. Abort if the room is absent, malformed, active, pending, recovered, or references a newer/different host session.
3. For lease expiry, recheck current `hostLease.lastRenewedAt + 90s`.
4. For disconnect expiry, require the expected session and abort if current `lastRenewedAt > observedDisconnectedAt`.
5. Return `null` only for positive current stale evidence.
6. After a committed deletion, remove `roomHostDisconnects/{gameId}` best-effort.
7. Never create, mutate, or delete Firestore room history.

Concurrent cleanup attempts are idempotent. Network/permission failures leave the room eligible for later reevaluation while stale rooms remain hidden.

## Direct-Room Contract

- A stale direct-room snapshot cannot add a visitor.
- The direct-room flow consumes the same current-session disconnect evidence and lease classifier.
- A pending room permits recovery until its deadline.
- Missing/expired/replaced authority stops the old host heartbeat.
- When the room snapshot becomes null, all current clients follow the existing unavailable-room fallback.

## Compatibility and Permission Gate

- Applies to classic-speed and Reaction Battle.
- Existing pre-lease rooms remain readable and receive the 24-hour conservative fallback.
- A current authenticated owner may bootstrap a legacy room lease; guests may not.
- Repository `database.rules.json` is not configured by `firebase.json`; deployed-equivalent read/write rules for the new lease and disconnect path must be proven in an explicitly safe environment.
- This contract does not authorize broad client write/delete grants.
