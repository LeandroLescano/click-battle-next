# Ads Strategy

## Product Goal

Ads should help cover hosting costs without getting in the way of the core loop: create room, join friends, click or react, see results, and play again. Click Battle is a fast-input game, so ads must be small, clearly separated from controls, and never positioned where a player could accidentally hit one while playing.

## Current State

- AdSense is loaded manually from the root layouts.
- Home uses a compact ad card inside the available rooms grid.
- Classic mode shows a desktop ad below the local player controls.
- Reaction Battle currently has no dedicated ad placement.
- `public/ads.txt` authorizes the current AdSense publisher ID.
- Ad placements are centralized in `lib/ads/placements.ts`.
- Ad lifecycle events are tracked as `ad_slot_lifecycle`.

## Policy Guardrails

- Do not encourage or imply clicking ads.
- Do not make ads look like navigation, menus, rooms, game buttons, or gameplay content.
- Keep ads away from active game controls. Google specifically calls out game windows and play buttons near ads as accidental-click risks, and recommends meaningful distance around game surfaces.
- Do not auto-refresh ads or reload ad elements without a user-requested page/action refresh.
- If an ad is labeled, use safe labels such as `Advertisements` or `Sponsored Links`.

References:

- https://support.google.com/adsense/answer/1346295
- https://adsense.googleblog.com/2012/03/avoiding-accidental-clicks-pt-3-tips.html
- https://support.google.com/adsense/answer/9183362
- https://support.google.com/adsense/answer/9183363

## Recommended Placements

### Home

- Keep one compact sponsor tile in the room list when there are no rooms, one room, or after a small group of rooms.
- The tile should be visually related to the arcade UI but not identical to room cards.
- It should include a tiny `Advertisements` label.
- It should collapse completely when unfilled.

### Classic Speed

- Show ads only in low-risk states: lobby, waiting, or post-game surfaces.
- Hide ads during countdown and playing.
- Keep desktop placement away from the click button. Mobile should avoid gameplay ads entirely for now.

### Reaction Battle

- No ad during get-ready, signal, click, or false-start moments.
- Possible future placement: result/lobby-only small footer tile, below the primary next-round/back-to-lobby actions.

### Ranking

- Candidate for a low-risk bottom banner because it is content browsing, not active gameplay.
- Avoid delaying navigation to ranking or blocking the leaderboard.
- Current implementation uses a bottom placement with existing home ad slots and separate internal lifecycle tracking names.

## Provider Direction

Stay with manual AdSense for now. It gives the most control over gameplay safety and visual restraint.

Ezoic is worth revisiting only after traffic is meaningful enough to justify the integration overhead. Their current setup expectations include JavaScript integration, Google MCM approval, `ads.txt` reseller entries, privacy/CMP work, and removing non-Ezoic ad code so their system can optimize placements.

Reference:

- https://osticket.ezoic.com/kb/article/ezoic-site-requirements-for-monetization

## Implementation Plan

1. Review the home placement after a few days of fill/unfilled data.
2. Decide whether Reaction Battle should stay ad-free or get a result-only placement.
3. Add an admin panel section later for ad performance by page/mode once enough data exists.

## Open Questions

- Should Reaction Battle get a result-only ad, or stay ad-free because the mode is intentionally intense and short?
- Should home ads stay inside the room grid, or become a small separate row under available rooms?
- Should ranking get dedicated AdSense slots later to separate AdSense-side reporting from home placements?
- Do we want a feature flag/env toggle for ads on dev and preview deployments?
