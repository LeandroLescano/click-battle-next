# Implementation Plan: Public Ranking Payload Privacy

**Branch**: `codex/ranking-public-payload-privacy` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-public-ranking-payload-privacy/spec.md`

## Summary

Limit the public ranking data at the server-to-client boundary to explicit mode-specific DTOs. Query only the Classic profile fields needed for scoring (`username`, `maxScores`), attach the Firestore document ID, retain the existing core ranking calculation, and project Classic and Reaction rows to explicit allowlists. Reuse the Classic projection for the client-created signed-in row so profile fields are not spread into client state. Keep Reaction eligibility, aggregation, and sorting unchanged.

## Preparation Handoff Snapshot

At the start of this preparation task, the repository was already on the dedicated branch `codex/ranking-public-payload-privacy` at base commit `50cad99b3e48ca7f361c0d74b04fac7398e7496b`. The initial worktree was not clean: `app/ranking/page.tsx`, `components-new/Ranking/components/RankingList/index.tsx`, and `components-new/Ranking/types.d.ts` were modified; `lib/ranking/`, `tests/lib/publicRanking.test.ts`, and `specs/007-public-ranking-payload-privacy/` were untracked. Those edits were present before this specification task and are preserved. The next worker must refresh `git status` and inspect the live diff before implementation or validation; no real user records were read.

## Technical Context

**Language/Version**: TypeScript 5.9.3

**Primary Dependencies**: Next.js 15.5.18, React 18.2.0, Firebase Admin SDK, `@leandrolescano/click-battle-core` 1.3.x

**Storage**: Firestore reads only; no schema or write changes

**Testing**: Node built-in test runner with synthetic fixtures, `npm run check:tsc`, targeted ESLint

**Target Platform**: Next.js App Router server-rendered `/ranking` page

**Project Type**: Web application

**Performance Goals**: Preserve ranking results and avoid expanding the page payload; no new network requests

**Constraints**: No real profile reads for tests, Firebase writes, E2E player setup, preview, deployment, merge, localization, analytics, or unrelated SEO changes

**Scale/Scope**: `app/ranking/page.tsx`, shared ranking DTO/projection, active `components-new/Ranking` types and local-row construction, focused unit tests, and this feature's Spec Kit artifacts

## Constitution Check

- **I. Production Gameplay Stability**: PASS. Classic display/order/local position and Reaction eligibility, ranking, and display are acceptance criteria.
- **II. Next.js App Router With Respect For Existing Patterns**: PASS. The active App Router page and its existing `components-new/Ranking` consumer are retained.
- **III. Firebase-Backed Contract Discipline**: PASS. No persisted data contract, rules, or writes change; the server query is narrowed to the fields needed for this read-only calculation.
- **IV. Verification Before Promotion**: PASS. Synthetic allowlist regression, focused test, TypeScript, and targeted lint are required. Preview/dev validation is left for the authorized delivery stage.
- **V. Branched Delivery And Incremental Safety**: PASS. Work is isolated on `codex/ranking-public-payload-privacy`; no push, merge, or deployment is authorized.

## Design Decisions

1. Represent public rows with explicit `PublicClassicRankingEntry` and `PublicReactionRankingEntry` types in a pure ranking projection module.
2. Keep `calculateRanking` responsible for Classic score eligibility, calculation, rounding, and order. Project its results explicitly before returning server page props.
3. Use Firestore field selection for `username` and `maxScores`, and add `doc.id` as the stable public key. Do not pass raw Firestore profile objects into the ranking calculator.
4. Use the same Classic row projection for the authenticated local score; never spread `gameUser` into ranking state.
5. Preserve Reaction filtering/aggregation/sorting code and project its final rows explicitly, preventing accidental additions from becoming public.

## Project Structure

```text
specs/007-public-ranking-payload-privacy/
├── spec.md
├── checklists/
│   └── requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-report.md
├── contracts/public-ranking-payload.md
└── tasks.md
app/ranking/page.tsx
components-new/Ranking/types.d.ts
components-new/Ranking/components/RankingList/index.tsx
lib/ranking/publicRanking.ts
tests/lib/publicRanking.test.ts
```

## Verification Plan

- Run a focused Node test with synthetic already-calculated rows decorated with private profile fields (email, provider metadata, preferences, timestamps, score history); JSON-serialize results and assert exact allowlists plus preservation of score/order/name/time values.
- Assert local Classic projection and Reaction projection preserve their public values while discarding unexpected profile properties.
- Run `npm run check:tsc`.
- Run ESLint on the touched TypeScript/TSX files.
- Run `git diff --check` and inspect the final diff/branch.
- Do not run browser E2E, Firebase-backed tests, build/deploy, or external preview validation for this read-only DTO change.

## Complexity Tracking

No constitution violations or additional infrastructure are introduced.
