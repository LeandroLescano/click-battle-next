# Statistics and Ranking Integrity Contract

## Trusted persistence request

The client may request persistence only after a round reaches ended state. The trusted application path must:

1. Authenticate the caller and verify current room-host authority.
2. Read the specific completed immutable round by room and round identity.
3. Revalidate the accepted result set and deterministically derive the winner/statistics.
4. Persist once per room/round identity, making repeat requests idempotent.
5. Reject arbitrary payload statistics, mismatched room/round identities, unfinished rounds, non-host callers, invalid/suspicious values, and replay attempts that would alter a historical entry.

## Public ranking eligibility

A reaction result may be displayed publicly only when it is a derived valid outcome with a finite numeric reaction time from 100 ms through the round response window. False starts, malformed outcomes, invalid values, and suspicious sub-100 ms values are excluded.

## Trust representation

The ranking may describe these entries as protected client-measured results. It must not state or imply that browser timing is competitive-grade authoritative or immune to all cheating.

## Firestore rules boundary

Browser clients retain only the minimum read access required for displayed data. They cannot create, edit, or rewrite room statistics or historical ranking inputs directly. Trusted server credentials perform derived writes.
