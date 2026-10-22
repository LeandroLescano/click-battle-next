# Feature Specification: Public Ranking Payload Privacy

**Feature Branch**: `codex/ranking-public-payload-privacy`

**Created**: 2026-10-20

**Status**: Scope approved; implementation and validation remain subject to review.

**Input**: Approved request to keep public ranking behavior while excluding unnecessary private profile information from ranking data delivered to visitors.

## User Scenarios & Testing

### User Story 1 - View a ranking without private profile details (Priority: P1)

A visitor opens the public ranking and sees the same names, scores, modes, and positions, while account details that are not needed to present the ranking remain private.

**Why this priority**: Visitors need ranking results, not the account and preference details stored with a player profile.

**Independent Test**: Use synthetic ranking inputs that include private profile attributes, then verify that public ranking output contains only information needed to identify and display each row, while visible names, scores, and ordering stay the same.

**Acceptance Scenarios**:

1. **Given** synthetic Classic ranking rows containing private account attributes, **When** the public ranking is prepared, **Then** only row identity and display information needed for the ranking are exposed, with the same names, scores, durations, and order.
2. **Given** a signed-in player has a Classic score absent from the server ranking, **When** the local row is added, **Then** it retains the same displayed name and score behavior without exposing unrelated account details.
3. **Given** eligible Reaction ranking results, **When** the public ranking is prepared, **Then** the same results, win counts, ordering, and display are retained without unrelated profile details.

### Edge Cases

- Players without an eligible Classic score remain absent from the Classic ranking.
- Reaction results that fail the existing eligibility checks remain excluded.
- Empty ranking results retain the existing empty-state behavior.
- A public row retains a stable identity so the existing ranking list behavior is unaffected.

## Requirements

### Functional Requirements

- **FR-001**: Public ranking data MUST exclude private account details and include only information necessary to identify and display a ranking row.
- **FR-002**: Classic score selection, displayed names and scores, duration, ordering, visible position, and current-player behavior MUST remain unchanged.
- **FR-003**: Reaction eligibility, score values, win counts, ordering, and display MUST remain unchanged.
- **FR-004**: The signed-in player's locally added Classic row MUST follow the same privacy and display requirements as server-provided rows.
- **FR-005**: Regression coverage MUST use synthetic profiles containing private attributes and verify both their exclusion and preservation of public ranking behavior.

## Out of Scope

- Changes to saved player information or ranking eligibility.
- Language, analytics, general SEO, migration, deployment, or integration work.

### Key Entities

- **Public ranking result**: Mode-specific name and score information needed to present a ranking.
- **Private profile details**: Account, provider, preference, timestamp, and score-history attributes that are not needed to present a public ranking.

## Success Criteria

### Measurable Outcomes

- **SC-001**: No private account attributes appear in public ranking information built from synthetic fixtures.
- **SC-002**: Classic regression checks confirm names, scores, durations, ordering, visible positions, and local-row behavior are unchanged.
- **SC-003**: Reaction regression checks confirm eligible results, scores, win counts, ordering, and display behavior are unchanged.
- **SC-004**: Privacy regression scenarios use synthetic records only; no real profile information is used for validation.

## Assumptions

- Ranking names and scores are already intended to be public; the scope does not change ranking eligibility or presentation.
- The change affects only information presented through the public ranking; it does not change stored profiles or score history.
