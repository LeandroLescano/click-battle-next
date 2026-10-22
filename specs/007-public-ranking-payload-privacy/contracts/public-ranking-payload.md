# Contract: Public Ranking Payload

## Producer

The `/ranking` server page prepares ranking entries for `components-new/Ranking`.

## Consumer contract

### Classic Speed

A row contains only:

```ts
type PublicClassicRankingEntry = {
  key: string;
  username: string;
  cps: number;
  time: number;
  mode: "classic-speed";
};
```

### Reaction

A row contains only:

```ts
type PublicReactionRankingEntry = {
  key: string;
  mode: "reaction";
  reactionMs: number;
  roundsWon: number;
  username: string;
};
```

## Behavioral compatibility

- Classic score eligibility, rounding, sorting, and the selected time continue to come from `calculateRanking`.
- Classic visible rank is still the one-based row index; current-user highlighting still compares username.
- The signed-in local Classic score is projected through the same Classic DTO mapper.
- Reaction eligibility, winner aggregation, score, tie ordering, and display remain unchanged.
- `lastUpdate` remains a page prop and is not a ranking-row profile field.

## Privacy invariant

No serialized row contains profile fields beyond its mode-specific allowlist. The producer must create new allowlisted objects at the server boundary; compile-time typing alone is not sufficient.
