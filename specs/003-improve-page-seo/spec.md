# Feature Specification: Mejorar SEO de la página

**Feature Branch**: `003-improve-page-seo`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Mejorar el SEO de la página, ya tengo google search console y google adsense"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Indexar correctamente las páginas públicas (Priority: P1)

Como dueño del sitio, quiero que Google descubra, entienda e indexe las páginas públicas importantes de Click Battle, para que la búsqueda no quede limitada a una sola URL y no acumule páginas "not indexed" sin explicación.

**Why this priority**: Es el problema más visible en Search Console: actualmente se observa 1 página indexada y 5 no indexadas. Sin una base de indexación clara, los demás cambios de SEO tienen menos impacto.

**Independent Test**: Se puede probar revisando el inventario de URLs públicas, sus decisiones de indexación y el estado resultante en Google Search Console después de solicitar rastreo.

**Acceptance Scenarios**:

1. **Given** el sitio de producción está disponible, **When** un buscador rastrea las señales públicas del sitio, **Then** encuentra todas las páginas públicas destinadas a indexación y no encuentra rutas privadas, duplicadas o efímeras como objetivos principales.
2. **Given** una URL pública importante existe, **When** se inspecciona en Search Console, **Then** la URL muestra una decisión coherente: indexable si es una landing pública, o excluida intencionalmente si no debe aparecer en resultados.
3. **Given** una ruta duplicada, de desarrollo o con parámetros representa el mismo contenido que otra URL, **When** el buscador la evalúa, **Then** recibe una señal clara de cuál es la versión preferida.

---

### User Story 2 - Mejorar cómo se presenta Click Battle en resultados y compartidos (Priority: P2)

Como jugador potencial que descubre Click Battle desde Google o redes, quiero ver títulos, descripciones e imágenes claras para cada página, para entender rápido qué puedo jugar y por qué entrar.

**Why this priority**: Una vez que las páginas están descubiertas, snippets útiles y específicos aumentan la probabilidad de clic y reducen la apariencia genérica del sitio.

**Independent Test**: Se puede probar abriendo cada página pública indexable y validando que tenga título, descripción, URL preferida y preview social específicos.

**Acceptance Scenarios**:

1. **Given** un usuario busca Click Battle o juegos de clicks online, **When** una página pública aparece en resultados, **Then** el título y la descripción describen claramente el modo de juego o contenido de esa página.
2. **Given** alguien comparte la home o ranking, **When** la vista previa se genera en una plataforma social, **Then** muestra nombre, descripción e imagen adecuados para Click Battle.
3. **Given** una página existe en más de un idioma o variante, **When** un buscador evalúa su idioma, **Then** no recibe señales contradictorias sobre el idioma principal o destino preferido.

---

### User Story 3 - Validar crecimiento SEO sin romper AdSense ni experiencia de juego (Priority: P3)

Como dueño del sitio, quiero medir el impacto en Google Search Console y mantener AdSense funcionando, para mejorar tráfico orgánico sin afectar monetización, políticas ni la experiencia de juego.

**Why this priority**: Search Console y AdSense ya están configurados; la mejora debe apoyarse en esas herramientas existentes y evitar regresiones de cumplimiento o usabilidad.

**Independent Test**: Se puede probar verificando que los archivos y señales requeridos por Google sigan accesibles, que las páginas legales estén disponibles y que Search Console reciba los cambios para seguimiento.

**Acceptance Scenarios**:

1. **Given** AdSense ya está configurado, **When** se despliegan los cambios SEO, **Then** la autorización de anuncios y las páginas de soporte legal siguen disponibles para producción.
2. **Given** Search Console ya contiene la propiedad del sitio, **When** se publica la mejora, **Then** el dueño puede enviar las señales actualizadas, solicitar recrawl y monitorear cobertura, rendimiento y experiencia.
3. **Given** un jugador entra desde búsqueda orgánica, **When** usa la home, ranking o una landing pública, **Then** puede entender el juego y continuar sin bloqueos por scripts, anuncios o contenido invisible.

---

### Edge Cases

- URLs de producción con y sin `www` deben converger en una versión preferida para evitar duplicados.
- URLs de desarrollo, previews o sandbox no deben competir con la producción en resultados de búsqueda.
- Rutas administrativas, privadas o internas no deben aparecer como páginas indexables.
- Salas de juego temporales o con IDs dinámicos no deben generar indexación masiva de páginas poco duraderas; si se comparten, deben guiar al usuario sin crear contenido duplicado o vacío.
- Rutas legacy quedan fuera del alcance SEO porque serán eliminadas; no se debe invertir esfuerzo en indexarlas, consolidarlas ni optimizarlas dentro de esta feature.
- Páginas con poco contenido visible por carga dinámica deben exponer suficiente contenido rastreable para que Google entienda el propósito de la página.
- La ausencia temporal de anuncios, bloqueadores de ads o fallas de red de AdSense no deben impedir que el contenido principal sea usable o rastreable.
- Si una página legal o de confianza no es una landing comercial, debe seguir disponible y coherente para cumplimiento, pero no necesariamente priorizarse como página de captación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain an explicit inventory of production URLs that should be indexed, excluded, redirected, or treated as canonical duplicates.
- **FR-002**: The system MUST expose discovery signals that allow crawlers to find all indexable public pages from the production domain.
- **FR-003**: The system MUST prevent private, administrative, development, preview, transient room, and intentionally duplicated URLs from being treated as primary search landing pages.
- **FR-004**: Each indexable public page MUST have a unique, human-readable title that reflects its specific purpose within Click Battle.
- **FR-005**: Each indexable public page MUST have a unique, useful summary suitable for search snippets and social previews.
- **FR-006**: Each indexable public page MUST declare a preferred canonical destination so duplicate URL variants consolidate search signals.
- **FR-007**: The public home experience MUST include crawlable explanatory content that describes what Click Battle is, how to play, and why a new visitor should start or join a battle.
- **FR-008**: Ranking or score-related public pages MUST communicate the ranking purpose, supported game modes, and update expectations in a way users and crawlers can understand.
- **FR-009**: Public legal and trust pages relevant to ads, privacy, or terms MUST remain accessible from the production site.
- **FR-010**: The system MUST preserve the existing Google Search Console and AdSense account setup; the feature must not require migrating to new Google accounts or properties.
- **FR-011**: The system MUST keep ad authorization signals available for the production domain and avoid SEO changes that obscure content, mislead crawlers, or create policy-risky ad placements.
- **FR-012**: The system MUST provide page preview signals for the main public pages, including title, description, site identity, and share image.
- **FR-013**: The system MUST ignore legacy routes for SEO implementation because they are planned for removal, and MUST NOT add sitemap, metadata, or canonical work specifically for them.
- **FR-014**: The system MUST provide a post-deployment validation workflow for Search Console covering URL inspection, discovery submission, coverage review, and performance monitoring.
- **FR-015**: The system MUST define the baseline metrics from the current Search Console state before rollout so future improvements can be compared against known values.
- **FR-016**: SEO improvements MUST NOT block the core game flow, room creation, room joining, ranking visibility, authentication prompts, or mobile usability.

### Key Entities *(include if feature involves data)*

- **Public URL Inventory**: List of production URLs and route patterns with their intended SEO treatment: index, exclude, consolidate, redirect, or monitor.
- **Search Presentation Profile**: Per-page title, description, canonical destination, language intent, site identity, and preview image used by search engines and social platforms.
- **Indexing Decision**: A documented reason for whether a URL should be searchable, excluded, or consolidated with another URL.
- **Validation Report**: Post-deployment record of Search Console checks, indexed/not-indexed reasons, submitted discovery signals, and follow-up actions.
- **AdSense Surface**: Public page areas where ads may appear, including their relationship to content visibility, legal compliance, and crawler-safe page structure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Within 30 days of production deployment, every intentionally indexable production URL appears in Search Console as discovered or submitted, with no intended public page blocked by crawler rules or missing from discovery signals.
- **SC-002**: Within 30 days of production deployment, the current "not indexed" count is reduced from the observed baseline of 5 to 0 for URLs that should be indexed, or every remaining not-indexed URL has a documented intentional exclusion reason.
- **SC-003**: Within 60 days of production deployment, organic clicks or impressions for branded/game/ranking queries increase by at least 20% versus the comparable pre-rollout baseline, unless Search Console reports insufficient data; in that case, no regression in clicks is acceptable.
- **SC-004**: 100% of indexable public pages pass a manual metadata review for unique title, useful description, canonical destination, and share preview.
- **SC-005**: AdSense authorization and public legal/trust pages remain valid after deployment, with no known ad-serving or policy regression caused by SEO changes.
- **SC-006**: Core public flows remain usable on mobile and desktop: loading the home page, viewing rankings, creating or joining a room, and reaching legal pages.

## Assumptions

- The primary production domain is `https://www.click-battle.com.ar/`; other host variants should consolidate toward the production preference unless project ownership decides otherwise.
- Google Search Console and Google AdSense are already configured and should be reused.
- The screenshot provided is the starting SEO baseline: 947 total web search clicks, 1 indexed page, and 5 not indexed pages around March-June 2026.
- Public growth targets include the home page, ranking page, game-mode/landing content if present, and trust/legal pages where appropriate.
- Admin pages, development/previews, and short-lived game room URLs are not primary SEO landing pages.
- The feature scope is specification for SEO improvements; implementation planning will decide the exact technical approach.
