# Data Model: Automatic Ghost Room Cleanup

## Active Room

Path: `games/{gameId}` in Firebase Realtime Database.

| Field | Type | Required | Lifecycle meaning |
|---|---|---|---|
| `created` | number | Expected | Server timestamp for the conservative 24-hour fallback. |
| `ownerUser.key` | string | Expected for modern rooms | Auth UID allowed to establish the host session. |
| `hostLease` | object | Required for new rooms | Authoritative current host session and last committed renewal. |
| `hostConnectionId` | string | Legacy optional | Compatibility metadata only; never sufficient liveness evidence by itself. |
| `hostDisconnectedAt` | number or null | Legacy optional | Existing inline disconnect evidence for pre-lease compatibility. New sessions use the separate signal path. |
| Existing game fields | existing types | Existing contract | Unchanged and irrelevant to lease classification. |

### Embedded Host Lease

Path: `games/{gameId}/hostLease`.

| Field | Type | Required | Validation |
|---|---|---|---|
| `ownerId` | string | Yes | Must match `ownerUser.key` when established. |
| `sessionId` | string | Yes | Unique opaque ID for one host browser session. |
| `claimedAt` | number | Yes | Server timestamp for session establishment and missing-presence safety. |
| `lastRenewedAt` | number | Yes | Server timestamp advanced only by the matching current session. |

Validation rules:

- A recurring heartbeat transaction aborts if the lease is absent or either identity differs.
- Heartbeat never creates a missing lease or room.
- A returning owner may replace a present lease session; a legacy missing lease requires a one-time guarded room bootstrap.
- `lastRenewedAt + 90_000` is the final lease deadline. No extra 30-second grace is added.
- Old `hostConnectionId` values do not override an expired or missing lease.

## Host Disconnect Signal

Path: `roomHostDisconnects/{gameId}/{sessionId}`.

| Field | Type | Required | Meaning |
|---|---|---|---|
| `disconnectedAt` | number | Yes | Server timestamp written by `onDisconnect` for that exact session. |

Rules:

- Only the entry whose `sessionId` matches the room's current lease can influence room state.
- A newer committed `lastRenewedAt` for the same session supersedes the signal.
- A matching signal reaches its deadline at `disconnectedAt + 30_000`.
- Old or orphaned signals are non-authoritative and may be removed opportunistically.
- Signal writes cannot recreate `games/{gameId}` because they live outside the active-room path.

## Room Lifecycle Assessment

| Field | Type | Meaning |
|---|---|---|
| `state` | `active` \| `pending` \| `stale` \| `unknown` | Whether display and deletion are allowed. |
| `reason` | `lease-active` \| `disconnect-grace` \| `host-disconnected` \| `lease-expired` \| `legacy-age` \| `insufficient-evidence` | Deterministic classification reason. |
| `cleanupAt` | number or null | Next server-aligned deadline for one-shot reevaluation. |
| `mayDelete` | boolean | True only with positive stale evidence. |
| `expectedSessionId` | string or null | Session guard supplied to destructive cleanup. |
| `observedDisconnectedAt` | number or null | Signal timestamp used to reject deletion after a newer renewal. |

## State Transitions

```text
session registered -> lease-active
lease-active -- matching onDisconnect signal --> disconnect-grace (30s)
disconnect-grace -- same session renews --> lease-active
disconnect-grace -- deadline passes --> stale(host-disconnected)
lease-active -- no committed renewal for 90s --> stale(lease-expired)
stale -- guarded transaction sees newer renewal/session --> lease-active
stale -- guarded transaction confirms evidence --> deleted

pre-lease room -- no usable liveness + age reaches 24h --> stale(legacy-age)
```

## Concurrency and Idempotency

- Renewal transactions touch only `hostLease`, avoiding contention with clicks and other game state.
- Guarded deletion touches the whole room only when stale cleanup is attempted.
- A replaced session cannot renew because its identity no longer matches.
- A delayed disconnect signal cannot affect a newer session.
- A delayed heartbeat sees a missing/mismatched lease and aborts, so it cannot recreate a deleted room.
- Concurrent deletion attempts remain idempotent; the first commit removes the room and later attempts abort.

## Retention

- Stale active rooms are removed opportunistically when current clients evaluate them.
- Disconnect signals are best-effort cleanup metadata and are removed after room deletion or session replacement.
- Existing Firestore room history is never created, changed, or removed by opportunistic cleanup.
- The obsolete `/legacy` UI and its code remain untouched.
