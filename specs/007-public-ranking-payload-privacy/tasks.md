# Tasks: Public Ranking Payload Privacy

**Input**: Design documents in `specs/007-public-ranking-payload-privacy/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/public-ranking-payload.md`

**Execution note**: At the start of this preparation task, the shared worktree already contained uncommitted implementation, test, and Spec Kit files. These tasks are intentionally unchecked until the implementation worker refreshes status and reviews the existing diff; do not duplicate or discard those changes without inspection.

## Phase 1: Setup

- [x] T001 Confirm the current branch, base commit, and dirty worktree with Git from repository root `.` before continuing; preserve all existing edits and avoid reading real user records.

## Phase 2: User Story 1 - View a ranking without private profile details (P1)

**Goal**: Preserve Classic and Reaction ranking behavior while exposing only each row's mode-specific public information.

**Independent Test**: Use synthetic private profile attributes and confirm exact public allowlists, unchanged names/scores/durations/order, local Classic-row behavior, and unchanged Reaction values/order.

### Tests (write or verify before implementation)

- [x] T002 [US1] Add or verify synthetic allowlist and behavior regressions in `tests/lib/publicRanking.test.ts`; ensure fixtures contain no real user data.

### Implementation

- [x] T003 [US1] Add or verify explicit Classic and Reaction DTO projection helpers in `lib/ranking/publicRanking.ts`.
- [x] T004 [US1] Add or verify the narrowed user-field query, minimal scoring input, and server-side public projections in `app/ranking/page.tsx`.
- [x] T005 [US1] Add or verify public ranking types in `components-new/Ranking/types.d.ts` and the local Classic-row projection in `components-new/Ranking/components/RankingList/index.tsx`.

### Verification

- [x] T006 [US1] Run `node --test tests/lib/publicRanking.test.ts`, `npm run check:tsc`, and `git diff --check`; run focused ESLint on `app/ranking/page.tsx`, `components-new/Ranking/types.d.ts`, `components-new/Ranking/components/RankingList/index.tsx`, `lib/ranking/publicRanking.ts`, and `tests/lib/publicRanking.test.ts` from repository root `.`; record actual results.
- [x] T007 [US1] Inspect the final diff at repository root `.` and confirm the listed ranking files preserve names, scores, ordering, position, and Reaction behavior, with no Firebase writes, E2E, preview, deployment, merge, or push.

## Dependencies & Execution Order

- T001 precedes all work so the existing shared worktree is preserved.
- T002 precedes any changes to T003-T005; it may be verified against the already-present test before deciding whether edits are needed.
- T003 precedes T004 and T005 because both consumers use the projection contract.
- T006-T007 follow implementation/reconciliation and confirm the acceptance criteria.

## Safety Constraints

Use synthetic fixtures only. Do not read real user records, write to Firebase, run destructive/authenticated E2E, preview, deploy, merge, or push. Keep `.codex/`, `.impeccable/`, and `.playwright-mcp/` out of the tracked patch.
