# Research: Public Ranking Payload Privacy

## Baseline data path (verified against `HEAD` 50cad99, before the current worktree edits)

- `app/ranking/page.tsx` is the active App Router `/ranking` page and renders `components-new/Ranking`.
- The baseline reads complete documents from the Firestore `users` collection, casts each document to `GameUser`, and spreads its fields into the input to `calculateRanking`, adding the document ID as `key`.
- The installed `@leandrolescano/click-battle-core` 1.3.x `calculateRanking` implementation copies each eligible user with a spread, retains `maxScores`, calculates and rounds CPS to two decimals, selects the associated time, and sorts by descending CPS. The installed `GameUser` type includes `email`, provider information, timestamps, and preferences.
- The baseline page spreads calculated Classic rows while adding `mode`, then serializes ranking data into props for the public ranking component.
- The baseline `components-new/Ranking/components/RankingList/index.tsx` adds a signed-in player's missing Classic row by spreading `gameUser` into client ranking state.
- Reaction rows are constructed from explicit fields after the existing eligibility checks, aggregated by username, then sorted by best reaction time, wins, and username.
- `components-new/Ranking` displays username and mode-specific score details. Visible position comes from row order, React row identity uses `key`, and current-player highlighting compares usernames.

## Current worktree findings (files were already modified when this preparation task began)

- `app/ranking/page.tsx` currently narrows the user query to `username` and `maxScores`, constructs a minimal scoring input with the document ID, and projects Classic and Reaction rows through `lib/ranking/publicRanking.ts` before passing them to the component.
- `components-new/Ranking/types.d.ts` currently uses the public ranking types. The local signed-in Classic row in `components-new/Ranking/components/RankingList/index.tsx` currently uses the Classic projection helper rather than spreading `gameUser`.
- `tests/lib/publicRanking.test.ts` is present with synthetic private fields and assertions for serialized allowlists, public values, order, the local Classic row, and Reaction projection.
- These production/test changes predate this specification-preparation task. They remain uncommitted in the shared worktree and were not modified here; the implementation/validation task must refresh `git status` and inspect the live diff before deciding whether any work remains.

## Decisions

### Boundary and query

Keep the public projection at the server-to-client boundary. Select only the Classic profile fields needed for scoring, construct a new minimal scoring input with the document ID, and never pass raw profile documents or spreads into public props.

### Classic contract

The verified Classic allowlist is exactly `{key, username, cps, time, mode}`. Keep `calculateRanking` responsible for eligibility, score calculation, rounding, selected time, and descending order; project its results into new objects. Use the same projection for the locally added signed-in row.

### Reaction contract

The verified Reaction allowlist is exactly `{key, mode, reactionMs, roundsWon, username}`. Preserve the current eligibility predicates, aggregation, tie-breaking, and values; project the final rows explicitly.

### Testing and safety

Use Node's existing `node:test` pattern in `tests/lib` and pure helpers with synthetic fixtures. Assert exact serialized keys, public values, and ordering. No Firebase emulator, authenticated player, browser, or real user data is needed.

## Alternatives rejected

- Filtering only in the React component: private data would already have crossed into the page props.
- Retaining spreads and relying on TypeScript types: runtime serialization can retain enumerable extra fields.
- Changing the core ranking algorithm: unnecessary; eligibility and scoring behavior must remain unchanged.
- Modifying the legacy `components/RankingList`: the active `/ranking` route uses `components-new/Ranking`.

## Open Questions

None for the approved scope. Preview, development-domain validation, and production promotion require a separate delivery decision.
