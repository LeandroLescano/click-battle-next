# SEO acquisition experiments

## Baseline — 2026-10-18

### User-provided Search Console observations (not an API export)

- `/click-speed-test`: selected 3-month report showed 1 click, 51 impressions, 2% CTR, average position 6.4.
- Visible query `click battle`: 1 click, 44 impressions.
- Do not infer that remaining impressions are non-brand: query tables can omit data.
- These observations do not prove the URL is currently unindexed, explain the traffic decline, or validate GA4 event collection.

### Live HTTP audit

- `/`, `/click-speed-test`, `/how-to-play`, `/ranking`: 200 and `index, follow` in server HTML.
- Home title: `Click Battle | Play online`.
- Test title: `Click Speed Test | Click Battle`.
- Test H1: `How many clicks can you make in 5 seconds?`.
- Test content is present in server HTML; do not describe it as client-only.
- Home initially returns an authentication-loading surface with a screen-reader-only heading and no HTML anchor to `/click-speed-test`.
- `/how-to-play` does include a crawlable anchor to the test, so the test is NOT completely orphaned.
- Home, ranking and how-to-play need separate goals; avoid competing near-duplicate landing pages for each duration.

## E1 — Public discovery links

Hypothesis: adding a stable, visible, server-rendered home navigation to the existing test, instructions and ranking improves discoverability without changing gameplay or canonical URLs.

Scope:
- Add public navigation outside the home client authentication/loading boundary.
- Use actual `a href` links via Next Link, translated for existing supported locales.
- Keep titles, scoring, test duration, Firebase, room creation, canonical URLs and robots policy unchanged.
- Existing runtime language code `pr` is retained for compatibility; standards-compliant Portuguese routing is a separate audit item, not silently fixed here.

Verification:
- Regression test first failed against production: no public discovery navigation.
- After implementation: 7 Playwright checks passed locally (raw HTML plus rendered navigation at 375/1440px for en/es/pr).
- Rendered probes block all requests outside the local Next origin: they do not exercise authenticated gameplay or write Firebase records.
- React streaming transports some server HTML in hidden containers; raw HTML assertions include those nodes, while separate hydrated tests assert visible navigation.
- Screenshots verify the public navigation in the loading state only, NOT the whole populated lobby.
- Targeted ESLint, project TypeScript, translation validation and whitespace checks passed.
- No production build run alongside dev; no deployment performed yet.

Measurement after an approved deployment:
1. Record production deployment timestamp and SHA; verify public HTML links on canonical host.
2. In URL Inspection, distinguish indexed URL status from live-fetch eligibility; request recrawl through Search Console UI if appropriate.
3. Keep an initial 28 complete days as a review window, not a ranking promise. Start comparison after confirming Google has recrawled; retain actual crawl dates.
4. Compare page impressions and clicks with the previous equivalent period; split brand/non-brand for visible queries, report hidden-query limitations.
5. Inspect GA4 users entering the test and progressing through start, completion, challenge click, lobby arrival. Do not divide raw repeat-event counts and call that a user conversion rate.
6. With this traffic volume, report absolute counts and uncertainty. No statistical significance or causal attribution claim from tiny before/after totals.
7. Track `/how-to-play` and `/ranking` separately as contextual comparisons, not randomized controls.

## Remaining candidate experiments

- Verify real Analytics collection and source attribution with internal/debug traffic excluded from acquisition reporting.
- CPS/5-second title and explanation implemented as E2 below; no unsupported average/record claims.
- Review home value proposition and readable public content without forcing a login.
- Measure Core Web Vitals using available field data; distinguish PageSpeed lab results and lack of CrUX coverage from actual field failures.
- Review language discovery: one URL currently varies by request language/cookie, and `pr` is used internally for Portuguese. Do not add fake hreflang URLs.
- Structured data only for facts shown on the page; no invented reviews, ratings, records or promised FAQ rich results.

## Primary references already consulted

- Google: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

This file records hypotheses and local acceptance criteria, not achieved SEO growth.

## E2 — Specific CPS acquisition page (review proposal)

The user authorized finishing a complete reviewable solution and using non-production scopes. E1 and E2 are now in the same review branch; if released together, evaluate the acquisition package, NOT the isolated causal effect of either change.

- Title: `5-Second Click Speed Test (CPS) | Click Battle`.
- H1: `5-Second Click Speed Test`, translated into existing en/es/pr locales.
- Description states duration, clicks, CPS and no-sign-up scope for the solo test.
- Visible, pre-rendered guide explains instructions, formula, example, input fairness, no-account solo play and the route to multiplayer.
- The guide hydrates with the existing i18n provider so changing language updates both game and guide without reload.
- Keep existing canonical, path, five-second timer, scoring and lock-before-retry behavior.
- Fix a reproduced short-screen clipping issue: let the hero grow rather than hiding translated copy outside a fixed viewport height.

Acceptance on local Next dev:
- 25 targeted Playwright checks passed, including HTML metadata/content, real three-click completion (0.6 CPS), retry, challenge URL, four existing Analytics events, 3 locales, 2 widths, 2 color schemes, language switch and a short-screen regression.
- Analytics test captures the real Firebase/gtag dataLayer events (view/start/complete/challenge click), blocks Google collection requests and prevents navigation into auth/rooms. This proves frontend dispatch only, NOT GA4 ingestion or user acquisition.
- 12 pure SEO tests passed; TypeScript, targeted ESLint, translations and formatting passed.
- No Firebase rules or backend edits, no production rollout approved yet.
