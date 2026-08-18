# Research: Mejorar SEO de la página

## Decision: Use Next.js App Router metadata exports for page-specific SEO

**Rationale**: The project already uses the `app/` directory, and Next.js supports metadata in `layout.tsx` and `page.tsx`, resolving the final `<head>` tags server-side. The official docs state that metadata can be added to layouts/pages, that Next resolves it into relevant head tags, and that `metadata`/`generateMetadata` are Server Component features. This fits the requirement for crawlable, route-specific titles, descriptions, canonical URLs, Open Graph, Twitter cards, and robots decisions.

**Alternatives considered**:

- Keep all SEO tags manually in `<head>` inside `app/layout.tsx`: rejected because it currently creates generic metadata for every route and makes route-specific canonical/snippet behavior harder to verify.
- Add a third-party SEO library: rejected because Next.js has first-party support and the route set is small.
- Client-only metadata updates: rejected because search and social previews need server-visible metadata.

**References**:

- Next.js `generateMetadata` and metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

## Decision: Generate a small canonical sitemap from the production URL inventory

**Rationale**: Google recommends sitemaps as a way to tell search engines which pages/files are important and notes that sitemap URLs should represent preferred canonical URLs when duplicate URLs exist. Next.js provides `app/sitemap.ts` as a metadata file convention that returns a typed sitemap and is cached by default unless dynamic behavior is introduced. Click Battle has a small, stable set of public pages, so a generated static sitemap is enough for v1.

**Alternatives considered**:

- Manual `public/sitemap.xml`: acceptable but easier to forget when routes change; generated code keeps inventory closer to the application.
- Dynamic sitemap from Firebase rooms: rejected because ephemeral rooms are not durable SEO landing pages and would create index bloat.
- Include removed/soon-to-be-removed routes and dynamic URLs: rejected because legacy routes are planned for removal and dynamic rooms are not durable SEO landing pages.

**References**:

- Google Search Central sitemap overview: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Google Search Central build/submit sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Next.js sitemap file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

## Decision: Generate robots rules in the App Router and reference the sitemap

**Rationale**: Next.js supports `app/robots.ts` returning a `MetadataRoute.Robots` object. The existing `public/robots.txt` allows all and disallows `/admin`, but it does not reference a sitemap and does not document dynamic route decisions. A generated robots file can keep production crawl rules clear while excluding admin and non-landing surfaces.

**Alternatives considered**:

- Keep static `public/robots.txt`: acceptable for a tiny site, but less expressive and easier to drift from sitemap/canonical decisions.
- Block all game routes only via robots: rejected as the only strategy because blocked pages may still appear in edge cases if linked elsewhere; route-level noindex/canonical decisions should complement crawler hints.

## Decision: Do not spend SEO effort on legacy routes

**Rationale**: The product direction is to remove legacy routes, so optimizing, canonicalizing, or redirect-planning them inside this SEO feature would create churn and distract from the active public surface. Legacy cleanup/removal should be handled by its own implementation work.

**Alternatives considered**:

- Canonicalize legacy routes to current routes: rejected because the routes are planned for removal.
- Add legacy URLs to the SEO inventory as excluded pages: rejected because this would still create tasks and validation overhead for soon-to-be-removed code.

**References**:

- Next.js robots file convention: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

## Decision: Treat `/`, `/ranking`, privacy policy, and terms as indexable; treat admin and transient game URLs as excluded

**Rationale**: The home page and ranking page are the strongest public landing pages for the game. Privacy and terms support trust and AdSense/compliance expectations, though they are not growth landing pages. Admin is internal and should not be indexed. Dynamic game room URLs are temporary and can expose empty, duplicate, or expired content; they should be excluded or canonicalized to the home unless a future feature creates durable public match pages.

**Alternatives considered**:

- Index game room URLs: rejected for v1 because rooms are transient and may depend on authentication/session state.
- Index admin for transparency: rejected because it is internal/private.
- Exclude legal pages: rejected because trust/legal accessibility matters for users and monetization.

## Decision: Preserve `ads.txt` at root and verify AdSense after SEO changes

**Rationale**: The repository already has `public/ads.txt` with the Google publisher entry. Google's AdSense/platform docs describe `ads.txt` as a root-domain file listing publisher IDs authorized to request ads on the domain. SEO changes should not move or obscure this file, and the validation checklist should confirm it remains reachable at `/ads.txt`.

**Alternatives considered**:

- Generate `ads.txt` dynamically: unnecessary for a single known publisher entry.
- Couple AdSense validation to Search Console only: rejected because ad authorization has its own crawler/access requirements.

**References**:

- Google AdSense platforms ads.txt docs: https://developers.google.com/adsense/platforms/transparent/ads-txt

## Decision: Add crawlable explanatory content without changing the core game UI contract

**Rationale**: The current home page is mostly a dynamic game-room interface. The spec requires enough crawlable copy to explain what Click Battle is, how to play, and why users should join. This can be added as visible or progressive public content using existing localization/design patterns, without changing gameplay behavior.

**Alternatives considered**:

- Hide keyword-heavy text only for crawlers: rejected because it risks misleading crawlers and users.
- Create a separate marketing microsite: rejected as too broad for this feature.
- Keep current copy only: rejected because Search Console already shows weak indexation and the spec calls for richer crawlable context.

## Decision: Keep localization compatible with existing i18n and avoid conflicting language signals

**Rationale**: The app detects language through existing i18n utilities. New public copy should use current localization patterns, and metadata should avoid declaring language/canonical variants that the app does not actually support as stable URLs. If stable localized URLs are not available, canonical URLs should remain production URL paths without inventing language-specific alternates.

**Alternatives considered**:

- Add new locale-prefixed URLs during SEO implementation: rejected because that is a routing/product expansion beyond the spec.
- Hardcode all SEO copy in one language only: rejected because the constitution requires preserving localization quality.

## Decision: Validate through local build checks plus Search Console after deployment

**Rationale**: Metadata and sitemap correctness can be validated locally through static checks, build, and direct route inspection. Indexing outcomes require Google Search Console after deployment. The plan will include a post-deployment validation report recording submitted sitemap, URL inspection status, coverage changes, and baseline comparison.

**Alternatives considered**:

- Rely only on build success: rejected because SEO success depends on crawler-visible output and Search Console state.
- Wait for organic traffic only: rejected because discovery/indexing signals can be verified earlier.
