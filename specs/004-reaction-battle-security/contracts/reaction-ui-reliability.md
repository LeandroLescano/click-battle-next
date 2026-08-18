# Reaction UI Reliability Contract

## Server-time readiness

The time hook exposes an offset value and explicit readiness. Readiness is false until a finite server-time offset arrives; an initial value of zero is not evidence of readiness. If the listener becomes unavailable, new signal scheduling is unavailable until readiness returns. The host sees localized waiting/recovery feedback.

## Transition contract

Start, signal promotion, finalization, reset, and return-to-lobby each have a pending state keyed to room and round. They must:

1. Prevent duplicate activation while the same request is pending.
2. Write conditionally against expected current room/round state.
3. Await remote confirmation before updating local success state.
4. Treat an already-achieved matching target as an idempotent successful result.
5. On failure, clear the pending guard, show a localized recoverable error, and permit retry.
6. Never leave an unhandled rejected write promise.

## Result/finalization contract

Participant submission is a write-once operation. The host finalizes only from the latest confirmed persisted result set, after all required outcomes are visible or timeout conditions are met. A new round always has a distinct identity, so old results cannot appear in it.
