# Data Model: Public Ranking Payload Privacy

This feature changes the shape of data sent to the public ranking client, not the persisted Firestore schema.

## Server scoring input (internal only)

The Classic ranking calculation receives a new object containing:

- `key`: Firestore user document ID
- `username`: selected display name
- `maxScores`: selected score history required by the existing core calculator

This input is server-side only. It is not serialized as a page prop.

## Public Classic ranking entry

| Field | Type | Purpose |
|---|---|---|
| `key` | `string` | Stable ranking row identity from the Firestore document ID (or Auth UID for the local row) |
| `username` | `string` | Existing public display name |
| `cps` | `number` | Existing best clicks-per-second score from core ranking calculation |
| `time` | `number` | Duration associated with the selected score |
| `mode` | `"classic-speed"` | Discriminator used by ranking UI |

No other properties are permitted. In particular, `maxScores`, `email`, `clicks`, account/provider metadata, preferences, and timestamps are excluded.

## Public Reaction ranking entry

| Field | Type | Purpose |
|---|---|---|
| `key` | `string` | Existing reaction row identity |
| `mode` | `"reaction"` | Discriminator used by ranking UI |
| `reactionMs` | `number` | Best eligible reaction time |
| `roundsWon` | `number` | Existing aggregate count of eligible wins |
| `username` | `string` | Existing public display name |

No other properties are permitted. Existing eligibility checks and ordering do not change.

## Invariants

- Every public row is newly constructed by explicit field assignment; no profile or ranking result is spread into client data.
- Serialized Classic keys equal exactly `key`, `username`, `cps`, `time`, `mode`.
- Serialized Reaction keys equal exactly `key`, `mode`, `reactionMs`, `roundsWon`, `username`.
- Visible position is derived from array order in the list; no position field is added.
