# Presence Resilience Requirements Checklist: Automatic Ghost Room Cleanup

**Purpose**: Assess whether the requirements can reliably distinguish a live host from an orphaned room when `onDisconnect` is missing, delayed, or leaves stale presence evidence.
**Created**: 2026-06-24
**Feature**: [Automatic Ghost Room Cleanup](../spec.md)

**Note**: This checklist evaluates the quality and completeness of the written requirements, not the current implementation.

## Requirement Completeness

- [ ] CHK001 Does the specification define how host availability remains current when `onDisconnect` registration fails or never produces a disconnect timestamp? [Gap, Spec §FR-001]
- [ ] CHK002 Are requirements defined for distinguishing a current `hostConnectionId` from an abandoned identifier left by a dead browser connection? [Gap, Spec §FR-001, §FR-010]
- [ ] CHK003 Does the specification require a bounded freshness signal, such as a host lease or last-seen timestamp, for rooms that contain apparently valid presence metadata? [Gap, Spec §FR-001]
- [ ] CHK004 Are lifecycle requirements documented for presence setup failing before the game screen finishes opening? [Completeness, Spec §Edge Cases]
- [ ] CHK005 Are the required persisted fields and their authoritative meanings documented for active, pending, stale, and unknown host-presence states? [Completeness, Spec §Key Entities]

## Requirement Clarity

- [ ] CHK006 Is “enough current host-availability information” defined with objective freshness and validity criteria? [Ambiguity, Spec §FR-001]
- [ ] CHK007 Is “currently available host” defined independently of merely having a non-empty connection identifier? [Ambiguity, Spec §FR-010, §FR-012]
- [ ] CHK008 Is the starting event for the 30-second reconnect grace period unambiguous when no reliable disconnect event exists? [Ambiguity, Spec §FR-003]
- [ ] CHK009 Is the maximum allowed age of host-availability evidence quantified for both foreground and background browser states? [Gap, Spec §FR-001]
- [ ] CHK010 Is the meaning of “usable host-presence evidence” precise enough to classify stale, malformed, missing, and contradictory values consistently? [Ambiguity, Spec §FR-011, §FR-012]

## Requirement Consistency

- [ ] CHK011 Do active-room preservation requirements remain consistent with cleanup requirements when a stale connection identifier exists but no host is reachable? [Conflict, Spec §FR-010, §FR-011]
- [ ] CHK012 Does the 24-hour fallback align with FR-001, or is it explicitly limited to records with no presence fields while stale-looking presence records follow another bounded rule? [Consistency, Spec §FR-001, §FR-011]
- [ ] CHK013 Are “no polling traffic” and “no continuously running cleanup process” reconciled with any requirement to keep host freshness evidence current? [Conflict, Plan §Performance Goals, Spec §FR-015]
- [ ] CHK014 Are direct-link and room-list classifications required to use the same definition of host freshness and the same time source? [Consistency, Spec §FR-005, §FR-007, §FR-009]

## Acceptance Criteria Quality

- [ ] CHK015 Can acceptance testing objectively prove that a room with a stale `hostConnectionId` and no disconnect timestamp becomes non-joinable within a bounded time? [Measurability, Spec §SC-001, Gap]
- [ ] CHK016 Does SC-003 define what constitutes a “valid available host” rather than assuming the presence marker is truthful? [Ambiguity, Spec §SC-003]
- [ ] CHK017 Are measurable false-positive limits defined for active hosts affected by delayed timers, background-tab throttling, temporary offline periods, or device sleep? [Gap, Spec §SC-002, §SC-003]
- [ ] CHK018 Is the maximum cleanup delay specified separately for disconnects reported normally and failures where no disconnect evidence is recorded? [Gap, Spec §SC-001, §SC-004]

## Recovery and Exception Coverage

- [ ] CHK019 Are recovery requirements defined when the host refreshes its availability immediately before or during a guarded cleanup decision? [Coverage, Spec §FR-004, §FR-013]
- [ ] CHK020 Are requirements defined for write failures while renewing host freshness, including whether the room becomes pending, unknown, or preserved? [Gap, Spec §FR-014]
- [ ] CHK021 Are contradictory snapshots—fresh host evidence plus an expired disconnect timestamp—assigned an explicit precedence rule? [Gap, Spec §FR-004, §FR-010]
- [ ] CHK022 Are clock skew, delayed server timestamps, and missing server-time offset requirements addressed for every expiration threshold? [Coverage, Gap]
- [ ] CHK023 Is behavior specified when no user evaluates the room list after host freshness expires, including the accepted persistence duration in storage? [Clarity, Spec §User Story 1 Scenario 2, §Assumptions]

## Dependencies and Scope Boundaries

- [ ] CHK024 Is Firebase’s `onDisconnect` delivery/registration behavior documented as an assumption rather than treated as guaranteed host liveness? [Assumption, Spec §FR-001]
- [ ] CHK025 Is the exclusion of multiple simultaneous host tabs reconciled with reconnects that briefly overlap old and new connection identifiers? [Scope, Spec §Assumptions]
- [ ] CHK026 Are heartbeat or lease write-frequency, bandwidth, and battery constraints specified if bounded host freshness is required without backend jobs? [Non-Functional, Gap]
- [ ] CHK027 Is the obsolete `/legacy` UI explicitly excluded while old room records encountered through current `/` and `/game/{gameId}` flows remain covered? [Consistency, Spec §Assumptions, Plan §Scale/Scope]

## Notes

- Check items off as completed: `[x]`.
- Record requirement amendments or unresolved decisions inline.
- Items intentionally focus on specification quality; implementation verification belongs in the feature test plan.
