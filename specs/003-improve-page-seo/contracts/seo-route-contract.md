# Contract: SEO Route Behavior

This contract defines the expected SEO behavior for each relevant route pattern. Implementation tasks should satisfy this contract without changing gameplay, authentication, Firebase writes, or ranking calculations.

## Global production contract

- Preferred production origin: `https://www.click-battle.com.ar`
- All canonical URLs for production search must use the preferred origin.
- Development, preview, and sandbox domains must not become canonical destinations.
- Shared metadata must identify the site as Click Battle.
- Public previews must use a valid share image and useful alt/context where supported.
- `robots.txt` must reference the production sitemap.
- `ads.txt` must remain reachable at `/ads.txt`.

## Route contracts

| Route pattern | Indexing | Canonical target | Sitemap | Metadata requirement | Content requirement |
|---------------|----------|------------------|---------|----------------------|--------------------|
| `/` | index, follow | `/` | included | Unique title/description for multiplayer click battles | Crawlable explanation of game, how to play, rooms, rankings |
| `/how-to-play` | index, follow | `/how-to-play` | included | Unique how-to title and description | Crawlable room, invitation, and gameplay guide |
| `/ranking` | index, follow | `/ranking` | included | Unique ranking/leaderboard title and description | Crawlable explanation of ranking modes and update cadence |
| `/about/privacy-policy` | index, follow | `/about/privacy-policy` | included | Privacy-specific title/description | Legal content remains accessible |
| `/about/terms-of-service` | index, follow | `/about/terms-of-service` | included | Terms-specific title/description | Legal content remains accessible |
| `/admin` | noindex, nofollow or disallowed | none | excluded | Must not present as public landing page | No public search content requirement |
| `/game/[gameID]` | noindex, follow or canonicalize to `/` | `/` if canonicalized | excluded | Avoid durable room-specific snippets | User can still join valid rooms normally |
| Legacy route patterns | out of scope | none | excluded | No SEO work | Planned for removal outside this feature |

## Sitemap contract

Sitemap entries must include only canonical, indexable production URLs:

```text
https://www.click-battle.com.ar/
https://www.click-battle.com.ar/how-to-play
https://www.click-battle.com.ar/ranking
https://www.click-battle.com.ar/about/privacy-policy
https://www.click-battle.com.ar/about/terms-of-service
```

Optional sitemap metadata:

- Home: highest priority, regular change cadence.
- Ranking: high priority, more frequent change cadence.
- Legal pages: lower priority, infrequent change cadence.

## Robots contract

Robots rules must:

- Allow public crawling of the production site.
- Allow `/admin` to be fetched so its route-level `noindex, nofollow` directive can be read.
- Avoid listing transient room URLs as sitemap entries.
- Include the sitemap URL.

## Metadata contract

Every indexable route must provide:

- Unique title.
- Unique description.
- Canonical URL.
- Open Graph title, description, URL, site name, image, and website type.
- Twitter/X summary card or large image card.
- Robots directive matching the route indexing decision.

## Non-goals

- No new durable public game-room pages.
- No Firebase schema changes.
- No AdSense account migration.
- No new locale-prefixed routing unless specified in a future feature.
- No SEO optimization, canonicalization, or sitemap work for legacy routes because they are planned for removal.
