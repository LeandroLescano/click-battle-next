# Data Model: Mejorar SEO de la página

## Public URL Inventory

Represents the canonical list of production URLs and route patterns that the site intentionally exposes to crawlers.

| Field | Description | Validation |
|-------|-------------|------------|
| `routePattern` | Application route or route pattern, such as `/`, `/ranking`, `/game/[gameID]` | Must match an active route in scope |
| `productionUrl` | Preferred production URL when indexable | Must use `https://www.click-battle.com.ar/` for canonical production URLs |
| `seoTreatment` | `index`, `noindex`, `canonicalize`, `redirect`, or `monitor` | Required for every public/internal route pattern |
| `priority` | Relative sitemap priority for indexable routes | Required only for sitemap entries |
| `changeFrequency` | Expected update cadence for sitemap entries | Required only for sitemap entries |
| `reason` | Human explanation for the treatment | Required |

### Initial inventory

| Route pattern | SEO treatment | Reason |
|---------------|---------------|--------|
| `/` | `index` | Main public game landing page |
| `/how-to-play` | `index` | Durable public guide for new players |
| `/ranking` | `index` | Public ranking/score discovery page |
| `/about/privacy-policy` | `index` | Trust/legal page relevant to users and ads |
| `/about/terms-of-service` | `index` | Trust/legal page relevant to users and ads |
| `/admin` | `noindex` | Internal administrative surface |
| `/game/[gameID]` | `noindex` or `canonicalize` to `/` | Ephemeral room URLs are not durable landing pages |

Legacy route patterns are intentionally omitted from this inventory because they are planned for removal and should not receive SEO-specific implementation work.

## Search Presentation Profile

Represents the crawler/social preview profile for each indexable route.

| Field | Description | Validation |
|-------|-------------|------------|
| `title` | Search/browser title | Unique per indexable route; clear game intent |
| `description` | Search/social summary | Unique per indexable route; natural language, not keyword stuffing |
| `canonicalUrl` | Preferred URL for the route | Absolute production URL |
| `openGraph` | Social preview title, description, type, URL, image | Must match route purpose; use `website` for game pages |
| `twitter` | Twitter/X card title, description, image | Must mirror or intentionally adapt Open Graph profile |
| `languageIntent` | Language signal for the page | Must not invent unsupported localized URL variants |
| `robots` | Index/follow directives | Must match Public URL Inventory treatment |

## Indexing Decision

Represents why a route is indexable or excluded.

| Field | Description | Validation |
|-------|-------------|------------|
| `routePattern` | Route being evaluated | Must exist in Public URL Inventory |
| `decision` | `index`, `noindex`, `canonicalize`, `redirect`, or `monitor` | Required |
| `canonicalTarget` | Target route/URL when consolidated | Required for `canonicalize` or `redirect` |
| `searchConsoleExpectation` | Expected Search Console outcome | Must state if "Indexed", "Excluded by noindex", "Duplicate, Google chose canonical", etc. |
| `ownerNote` | Human reason for future review | Required |

## Validation Report

Post-deployment record used to compare outcomes against the baseline.

| Field | Description | Validation |
|-------|-------------|------------|
| `deploymentUrl` | Preview/dev/production URL inspected | Required |
| `dateChecked` | Date of validation | Required |
| `baseline` | Search Console baseline used for comparison | Must include 947 clicks, 1 indexed page, 5 not indexed pages from screenshot |
| `sitemapStatus` | Search Console sitemap submission/processing status | Required after production deployment |
| `urlInspectionResults` | Per-URL coverage/indexability observations | Required for each indexable URL |
| `adsenseStatus` | `/ads.txt` and ad script/placement sanity checks | Required |
| `coreFlowStatus` | Home, ranking, create/join room, legal page smoke results | Required |
| `followUps` | Any remaining Search Console warnings or delayed crawler states | Required if not fully green |

## AdSense Surface

Represents where SEO and ads intersect.

| Field | Description | Validation |
|-------|-------------|------------|
| `routePattern` | Page where ads may appear | Must be public and policy-safe |
| `adAuthorization` | Root `ads.txt` entry and publisher identity | Must remain reachable at `/ads.txt` |
| `contentRelationship` | How ads relate to visible content | Ads must not obscure content or make pages thin/misleading |
| `fallbackBehavior` | Behavior if ads do not load | Main content remains usable and crawlable |

## State Transitions

### Route indexing lifecycle

```text
Uninventoried → Inventoried → Metadata defined → Discovery exposed → Submitted/validated → Monitored
```

### Search Console validation lifecycle

```text
Baseline captured → Preview verified → Production deployed → Sitemap submitted → URLs inspected → Coverage monitored → Follow-ups documented
```
