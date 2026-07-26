# Contract: Search Console and AdSense Validation

This contract defines what evidence must be gathered after implementation and deployment.

## Baseline

Capture the starting values from the user's Search Console screenshot:

- Total web search clicks: 947
- Indexed pages: 1
- Not indexed pages: 5
- Date range visible in screenshot: approximately March-June 2026

## Preview validation

Before merging into `develop`, validate the branch preview or local production build:

1. Load `/`, `/how-to-play`, `/ranking`, `/about/privacy-policy`, `/about/terms-of-service`.
2. Inspect each page's rendered HTML/head for title, description, canonical URL, Open Graph, Twitter card, and robots directives.
3. Load `/robots.txt` and confirm it exposes the intended rules and sitemap.
4. Load `/sitemap.xml` and confirm it contains only canonical production URLs.
5. Load `/ads.txt` and confirm the Google publisher entry remains present.
6. Smoke test home, ranking, create/join room path if safe in the target environment, and legal page navigation.

## Develop validation

After merge to `develop`, validate on `https://dev.click-battle.com.ar/`:

1. Confirm dev does not advertise itself as the production canonical origin.
2. Confirm core public flows still work.
3. Confirm no Firebase data-writing tests are run against production-connected environments without explicit approval.

## Production Search Console validation

After production deployment:

1. Submit or resubmit `https://www.click-battle.com.ar/sitemap.xml` in Google Search Console.
2. Use URL Inspection for each sitemap URL:
   - `https://www.click-battle.com.ar/`
   - `https://www.click-battle.com.ar/how-to-play`
   - `https://www.click-battle.com.ar/ranking`
   - `https://www.click-battle.com.ar/about/privacy-policy`
   - `https://www.click-battle.com.ar/about/terms-of-service`
3. Request indexing for intended public URLs when Search Console allows it.
4. Inspect excluded URLs, especially `/admin` and a representative `/game/{id}`, and confirm exclusions match the route contract.
5. Record not-indexed reasons and distinguish intentional exclusions from problems.
6. Monitor coverage and performance for at least 30 days.

## AdSense validation

After production deployment:

1. Confirm `https://www.click-battle.com.ar/ads.txt` returns the expected Google seller line.
2. Confirm public pages still contain usable content if ads fail to load.
3. Confirm ads do not obscure title/copy/legal content on desktop or mobile.
4. Check AdSense dashboard for new `ads.txt` or policy warnings after crawlers refresh.

## Acceptance evidence

The implementation is considered validated when the report records:

- Sitemap submitted or discoverable via robots.
- All intended indexable URLs discovered/submitted in Search Console.
- Any remaining not-indexed URLs classified as intentional or needing follow-up.
- `/ads.txt` reachable from production.
- No regression in home/ranking/legal navigation.
- Local checks completed: `npm run check:tsc`, `npm run lint`, `npm run check:i18n`, `npm run build`.
