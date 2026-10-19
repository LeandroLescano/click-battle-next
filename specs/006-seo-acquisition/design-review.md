# Speed-test redesign review

## Scope

Requested review feedback: the existing timer was not prominent, the 600 ms safety lock looked like an empty broken panel, the experience felt static, and mobile layout needed a fresh composition. This revision is UI/feedback only: five-second deadline, count calculation, event names, canonical URL and multiplayer behavior remain unchanged.

| Before | After | Why |
| --- | --- | --- |
| Small integer timer in an isolated tile | Large tenths-of-a-second display plus progress track | Make elapsed time continuously legible; use the existing deadline, not a second game clock |
| Global grid visible behind sparse controls | Opaque, themed arena over the existing Click Battle grid | Give interaction and score a clear visual boundary |
| Long intro above the mobile play area | Compact heading/context, instructions below | Put the play target in the first mobile viewport |
| Blank outlined rectangle during safety lock | Score visible immediately; actions disabled for the same 600 ms | Preserve protection against accidental retries without a broken-looking loading state |
| Abrupt result swap | Brief score entrance, tactile button press and running indicator | Communicate state changes without animation on every click or extra gameplay delay |
| Result buttons squeezed into a fixed-height row | Stable result canvas and two responsive 44px+ hit targets | Keep English/Spanish/Portuguese actions inside the arena |
| No motion-specific treatment | Reduced-motion disables decorative transitions/animations | Preserve timer and score information without decorative movement |

## Brand alignment after review

- Tiny5 is reserved for the Click Battle brand; headings, controls and metrics inherit the existing Handjet font.
- The original global grid remains visible; smaller corner radii and a solid offset shadow replace the detached soft-card treatment.
- The cursor SVG uses a 16×16 integer grid, filled staircase edges and `crispEdges`, without diagonal strokes or rounded joins.
- Larger localized labels retain stable arena geometry at 320px as well as 375px.

## Narrow annotated corrections

1. Extract the existing home title markup/classes unchanged into `Header/BrandTitle.tsx`, used by both the home Header and the test. Remove the decorative brand arrow; do not invent a replacement logo.
2. Result retry uses the existing outlined Button without palette overrides. Challenge uses a native-link adapter around the same shared button styles; locked challenge is a genuinely disabled Button. Keep the URL, Analytics handler and 600 ms safety window.
3. Ready/running targets render the same primary Button used in LocalSection. Remove the test-specific press animation and background/shadow overrides. Preserve only page geometry and the existing scoped reduced-motion override.

Regression checks compare rendered control colors, border, radius, shadow and transform against an unmodified shared Button reference; they also exercise the original pressed transform. The geometry test clock is explicitly paused so screenshot latency cannot consume the safety-lock window.

## Preparation countdown

- Starting and retrying now show 3–2–1 inside the same shared gameplay Button. Preparation is disabled and ignores clicks; its main timer remains at 5.0 seconds.
- Only after preparation finishes is a fresh five-second deadline created. Preparation cannot consume the playable time.
- The original 600 ms result safety lock and CPS calculation remain unchanged.
- The start Analytics event now fires when the playable round actually begins, not when preparation is requested. There are no new event names.
- Update visible instructions in English, Spanish and Portuguese; the guide no longer claims an immediate start.
- Countdown digits use the existing brief result entrance animation and disable decorative motion under reduced-motion preferences.
- Deterministic tests cover exact 3/2/1 boundaries, ignored preparation clicks, a full five-second round, retry preparation, score reset, and Analytics start timing. The responsive/theme/locale matrix now also checks preparation geometry.

## Animation and performance choices

- Progress fill uses a transform and the existing 100 ms countdown tick.
- Press feedback now uses the original shared gameplay Button (150 ms transform/box-shadow); result entrance uses transform/opacity for 240 ms.
- No confetti dependency, sound, page-load animation, per-click particle creation or extra animation loop.
- The lock remains 600 ms. It is a click-safety window, not score-processing latency.
- No measured Core Web Vitals improvement is claimed.

## SEO versus experience: exact distinction

The acquisition changes already in this PR are:

1. A specific `5-Second Click Speed Test (CPS) | Click Battle` title, corresponding H1 and truthful description. Hypothesis: clearer query relevance and result messaging, not guaranteed ranking or CTR.
2. Pre-rendered instructions, score formula and visible explanations. This adds useful context, not keyword filler. The old test already had server-rendered content, so this is NOT a repair of an allegedly invisible React page.
3. Real public home anchors to the existing test/instructions/ranking, outside the authentication-loading boundary. This addresses the absence of those anchors in initial home HTML. The test was already in the sitemap and linked from how-to-play, so it was NOT completely orphaned.
4. Preservation of canonical URL, sitemap entry and production indexability. No duplicate duration pages, new language URLs or invented schema/reviews.
5. Measurement protocol and a test of actual frontend Analytics queue events. Queue assertions are NOT verification of GA4 ingestion or an improvement to search ranking.

The redesign in this revision is an experience/interaction improvement. Animations and a nicer result panel are not independent SEO ranking levers. They can be evaluated through task completion/retry/challenge behavior, separately from Search Console visibility.

## Verification

Before implementation, three targeted tests failed for the missing progress/tenths, missing nonblank locked result, and mobile play target below the first viewport.

After implementation:
- 57 targeted Playwright tests passed locally, including preparation/retry timing, typography/pixel-SVG and shared branding/button-palette regressions.
- Includes ready/running/locked/complete states at 320, 375, 768, 1440px, three locales, light/dark, stable arena geometry, action hit areas, reduced motion, exact 3-click score, retry and Analytics event sequence.
- Screenshot inspection covered mobile result/full page and desktop running panel.
- TypeScript, targeted ESLint and translation coverage passed.

This is not a full multiplayer regression suite, real-device touch test, field performance measurement, GA4 ingestion check, or evidence of SEO growth.

## Sources

- Google title links: https://developers.google.com/search/docs/appearance/title-link
- Google crawlable/internal links: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content

Deployment target: existing PR #76 preview only. Production remains pending user review.
