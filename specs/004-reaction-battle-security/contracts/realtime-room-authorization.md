# Realtime Room Authorization Contract

## Purpose

Define the ownership contract enforced by repository-versioned Realtime Database rules for live Click Battle rooms.

## Invariants

1. An authenticated room creator can create a room only when the owner UID, first participant UID, and initial lease owner are that creator.
2. An existing room root is not writable as a whole.
3. The room owner UID is immutable after creation.
4. A participant can affect only their explicitly permitted participant fields and can create one immutable Reaction Battle result only at their own UID path.
5. A guest cannot set room lifecycle, host lease ownership, round control state, winner, scheduling, another result, statistics, or cleanup state.
6. A host control transition must match the previous lifecycle state and current `roundId` and must not mutate result entries.
7. A result is valid only if it matches its path/authenticated participant identity, session state, allowed status/input set, and plausibility rules.
8. Pre-deployment rooms are deleted at rollout; all supported rooms use the secure owner and mode schema.

## Required allowed cases

- Owner creates a well-formed new room.
- Participant creates their first valid or false-start result for the active round.
- Two distinct participants concurrently create distinct result nodes.
- Owner creates/resets a round and performs legal scheduled, signal, ended, and lobby transitions.
- Existing authorized join, self leave, host kick, owner lease heartbeat, host disconnect signal, and trusted/owner cleanup flows remain available.

## Required rejected cases

- Any authenticated user writes an existing room root or immutable owner field.
- A participant writes a result below a different UID, writes twice, changes/deletes a result, uses an invalid payload, or submits outside its allowed state/window.
- A non-host creates/resets/finalizes a round, changes status/winner/schedule, alters host lease, or kicks another participant.
- Any viewer deletes a stale room merely because they can observe it.

## Emulator test boundary

Privileged fixture setup must seed emulator state through an Admin/privileged path. Authorization denial and allow assertions must use independent authenticated clients, so test setup cannot bypass the rules being tested.
