# Research: Reaction Battle Security and Reliability

## Decision: Apply RTDB permissions at granular child paths

**Decision**: Deny writes at the root of an existing room and permit narrowly defined create/update operations only at owned child paths.

**Rationale**: Current `database.rules.json` accepts any authenticated write to `/games`, so a guest can replace a room, host lease, session, or another player's result. In RTDB, a permitted parent write cannot be undone by a more restrictive child rule. Room creation can remain a root create only when the creator's authenticated UID equals both the immutable `ownerUser.key` and initial host lease owner; subsequent writes must target granular paths.

**Alternatives considered**:

- Retain root write and add result validation: rejected because root permission bypasses child ownership.
- Rely on UI host controls: rejected because browser clients are untrusted.

## Decision: Use `ownerUser.key` as the authorization identity

**Decision**: Authorize host-only actions with the immutable creator UID in `ownerUser.key`, with host-lease validation as an additional continuity guard. Do not authorize with a username or UI `isHost` flag.

**Rationale**: Room creation already stores the authenticated UID in `ownerUser.key`; names can change or collide and UI state is not security evidence. Rooms without a reliable owner key are deleted at deployment and need no compatibility behavior.

**Alternatives considered**:

- Use only `hostLease.ownerId`: rejected because a writable or stale lease alone must not be able to transfer authority.
- Use username: rejected because it is not a stable authenticated identifier.

## Decision: Make results immutable by round identity

**Decision**: Create a new uniquely identified Reaction Battle round for every host reset/start cycle. Keep its control data host-owned and its `results/{uid}` entries participant-owned and write-once; point the room at the current round rather than deleting or overwriting old results.

**Rationale**: A host-owned parent session that also contains participant-owned results cannot safely let the host reset the parent without gaining permission to rewrite results. Distinct rounds preserve auditability, prevent stale-result leakage, and permit concurrent participant writes.

**Alternatives considered**:

- Clear `reactionSession/results` before the next round: rejected because parent permission would undermine result immutability.
- Permit host edits to result entries: rejected because it violates player result ownership.

## Decision: Validate plausibility, not authoritative human reaction

**Decision**: Validate only finite numeric valid reactions in the active response window and at least 100 ms; accept only known statuses/input types and terminal false starts. Treat valid browser measurements as client-measured, not anti-cheat authoritative.

**Rationale**: Rules can verify payload structure, identity, state, and range but cannot establish the physical time at which a player reacted. The 100 ms threshold rejects impossible/implausible values without claiming competitive-grade measurement.

**Alternatives considered**:

- Accept any non-negative client value: rejected because it poisons winners and rankings.
- Claim rules make reaction times cheat-proof: rejected because client clock/input claims remain untrusted.

## Decision: Derive persisted statistics and ranking through a trusted application path

**Decision**: Remove browser authority to persist Firestore room statistics/ranking inputs. A narrow authenticated server-side application route verifies caller host identity, reads the completed immutable round, derives eligibility/winner/statistics idempotently, and performs the write with trusted credentials.

**Rationale**: `firestore.rules` currently permits any authenticated client to write any document. Firestore rules cannot inspect RTDB state, so host-only Firestore writes alone cannot prove the submitted statistic was derived from an accepted round. A trusted route is the smallest reliable boundary and does not move domain rules to `click-battle-core`.

**Alternatives considered**:

- Restrict Firestore writes to a room host client: rejected because the host could still forge historical games.
- Keep client statistics but label them as untrusted: rejected because the public ranking would remain manipulable.
- Build a broader authoritative reaction service: rejected as out of scope.

## Decision: Confirm transitions and retry failed actions

**Decision**: Host start, promote, finalize, reset, and return-to-lobby actions use conditional/transactional writes that check expected current state and round ID, await remote confirmation, and expose a pending/recoverable error state. Finalization recomputes eligibility and deterministic winner from the transaction's current persisted results.

**Rationale**: Existing code marks local refs as complete before unawaited writes succeed, making a transient failure freeze the UI and allowing stale reads to select a winner. Conditional idempotent transitions tolerate double activation and retry while preserving one successful state change.

**Alternatives considered**:

- Keep local ref guards and fire-and-forget writes: rejected because failures become unrecoverable until reload.
- Use plain updates for every transition: rejected because they lack expected-state protection.

## Decision: Separate server-time readiness from offset value

**Decision**: The server-time hook returns `{ offsetMs, isReady }`, with `isReady` false until it receives a finite server-time offset value. A listener loss makes future scheduling unavailable until readiness resumes.

**Rationale**: An initial `0` offset and a valid zero offset are indistinguishable when only a number is exposed.

**Alternatives considered**:

- Treat zero as unsynchronized forever: rejected because zero can be valid.
- Start with zero before a listener response: rejected because players may receive inconsistent signal times.

## Decision: Reconcile cleanup with least privilege

**Decision**: Constrain host-disconnect signals to the active owner/lease session and remove arbitrary viewer authority to delete stale rooms. Use an owner-constrained or trusted cleanup path for deletion.

**Rationale**: The current client-side stale-room deletion can be performed by a non-host under broad rules and conflicts with the requested least-privilege contract.

**Alternatives considered**:

- Preserve arbitrary viewer cleanup: rejected because it grants destructive room authority.
- Disable cleanup entirely: rejected because ghost-room recovery is a required existing flow.
