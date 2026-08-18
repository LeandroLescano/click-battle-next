# Data Model: Reaction Battle Security and Reliability

## Ownership identities

| Entity | Source of truth | Use |
|---|---|---|
| Room owner UID | `ownerUser.key` | Immutable host authorization identity for an existing room. |
| Active host lease | `hostLease.ownerId` and session ID | Continuity/presence validation; must agree with room owner for sensitive actions. |
| Participant UID | `listUsers/{uid}` key | Identity allowed to create only `results/{uid}` while participating. |
| Pre-deployment room | Any room created before the secure schema rollout | Deleted at deployment; it receives no migration or compatibility behavior. |

## Reaction round model

Each host-created round has a new immutable `roundId`. A current-round reference selects the one displayed to players. Prior round results are never reset, deleted, or reused for a new round.

| Field/group | Owner | Validation |
|---|---|---|
| `roundId` / current-round reference | Host | Fresh for reset/start; cannot point to a non-Reaction Battle round. |
| Control | Host | Valid lifecycle only: waiting/lobby → scheduled → signal → ended; expected prior state and round ID required. |
| Schedule | Host | Finite future signal time and bounded delay/buffer/window values. |
| `results/{uid}` | Matching participant only | Create once; no update/delete; participant exists and is eligible for the active round. |
| `results/{uid}.playerKey` | Matching participant only | Exactly equals path UID and authenticated UID. |
| `results/{uid}.username` | Matching participant only | Equals verifiable room participant identity where safe to validate. |
| Valid result | Matching participant only | Known valid status/input, finite integer reaction time, `100 <= reactionMs <= response window`, submitted during signal. |
| False start | Matching participant only | Known false-start status/input, no valid reaction time, submitted only in the allowed pre-signal state; terminal once written. |
| Winner | Trusted finalizer / host transition contract | Derived only after eligible persisted results are visible; tie order: reaction time, then persisted click time, then UID. |

## Shared room lifecycle

| Operation | Authority | Expected behavior |
|---|---|---|
| Create room | Authenticated creator | Creator UID is installed as immutable owner, initial participant, and lease owner. |
| Join/leave and own classic input | Matching participant | Only own permitted participant fields change; capacity/password/current-state checks remain enforced. |
| Kick | Room owner | Only the host-owned kick marker changes for a target participant. |
| Host lease/presence | Room owner and matching lease session | Cannot transfer ownership or mutate unrelated room fields. |
| Reaction start/promote/finalize/reset/lobby | Room owner | Conditional, idempotent, confirmed remotely; guest requests are rejected. |
| Disconnect signal and stale cleanup | Current owner/session or trusted cleanup | Signal is lease-scoped; stale deletion is not available to arbitrary viewers. |

## Statistics and ranking model

| Entity | Writer | Eligibility |
|---|---|---|
| Completed room statistic | Trusted application path | Derived idempotently from an ended immutable round after caller/room authorization. |
| Public ranking entry | Trusted application path | Only accepted, eligible valid result; `reactionMs >= 100`, within its round window, and never a false start/suspicious value. |
| Client-measured label | Ranking presentation | Explains that protected client measurements are not competitive-grade authoritative anti-cheat evidence. |
