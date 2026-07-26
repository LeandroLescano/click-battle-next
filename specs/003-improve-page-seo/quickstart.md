# Quickstart: Mejorar SEO de la página

## 1. Confirm feature context

```powershell
git branch --show-current
Get-Content .specify/feature.json
Get-Content specs/003-improve-page-seo/spec.md
Get-Content specs/003-improve-page-seo/plan.md
```

Expected branch: `003-improve-page-seo`.

## 2. Implement route-level SEO

Use the contracts as the source of truth:

- `contracts/seo-route-contract.md`
- `contracts/search-console-validation-contract.md`

Recommended implementation order:

1. Define shared production SEO constants for site name, production origin, default title template, descriptions, and share image.
2. Replace generic manual head metadata with typed App Router metadata where appropriate.
3. Add page-specific metadata for `/`, `/how-to-play`, `/ranking`, privacy policy, and terms.
4. Add route-level noindex/canonical decisions for admin and dynamic game rooms.
5. Add `app/sitemap.ts` with only canonical indexable production URLs.
6. Add `app/robots.ts` with public allow rules and a sitemap reference; use route-level `noindex` for admin.
7. Keep `public/ads.txt` unchanged and reachable.
8. Add crawlable explanatory copy to home and ranking using existing i18n patterns.

## 3. Local validation

Run the smallest meaningful validation set:

```powershell
npm run check:tsc
npm run lint
npm run check:i18n
npm run build
```

Then inspect generated/public URLs from a local production build or preview:

```text
/
/how-to-play
/ranking
/about/privacy-policy
/about/terms-of-service
/robots.txt
/sitemap.xml
/ads.txt
```

## 4. Manual SEO checks

For each indexable page, confirm:

- Unique `<title>`.
- Useful meta description.
- Canonical URL points to `https://www.click-battle.com.ar/...`.
- Open Graph and Twitter/X preview fields exist.
- Robots directive allows indexing.
- Page has visible/crawlable content that explains the page purpose.

For excluded pages, confirm:

- `/admin` is not a public landing page.
- `/game/[gameID]` is not listed in sitemap and does not create durable indexable content.
- Legacy routes are ignored for this SEO feature because they are planned for removal.

## 5. Preview and dev validation

Follow repository delivery flow:

1. Validate branch work on the Vercel preview URL when available.
2. Merge into `develop` first.
3. Validate integrated changes on `https://dev.click-battle.com.ar/`.
4. Promote to production only through PR.

When testing previews/dev, do not run data-writing gameplay tests against environments that may be connected to production Firebase unless explicitly approved.

## 6. Production Search Console follow-up

After production release:

1. Submit `https://www.click-battle.com.ar/sitemap.xml` in Google Search Console.
2. Use URL Inspection for home, how-to-play, ranking, privacy policy, and terms.
3. Request indexing for intended public URLs.
4. Record which of the 5 previously not-indexed URLs are now indexed, intentionally excluded, or still need action.
5. Recheck performance and coverage after 7, 14, and 30 days.

## 7. AdSense follow-up

After production release:

1. Visit `https://www.click-battle.com.ar/ads.txt`.
2. Confirm the existing Google publisher line is present.
3. Check AdSense dashboard for `ads.txt` or policy warnings after crawlers refresh.
4. Confirm ads do not block visible content or legal navigation.
