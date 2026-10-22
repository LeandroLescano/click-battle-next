# Especificación: SEO social de home y guía

**Feature Branch**: `codex/seo-social-discovery`
**Created**: 2026-10-22
**Status**: Implemented — local verification complete; PR review pending
**Input**: Mejora acotada de la portada y `/how-to-play`, y español determinista para visitas sin preferencia guardada.

## Alcance y evidencia

Esta feature se limita a páginas y funciones existentes. Reutiliza `specs/006-seo-acquisition/audit.md`, `experiments.md` y el plan/auditorías SEO adjuntos a Kanban. La revisión del producto confirma que Speed Battle cuenta clicks hasta que termina el temporizador; Reaction Battle espera una señal y gana la reacción válida más rápida. Las salas se crean o se buscan desde el lobby y se pueden compartir por enlace. No se implementan modos ni promesas nuevas.

## User Scenarios & Testing

### US1 — Recibir la portada en un idioma estable (P1)

Una visita sin una elección de idioma guardada recibe español desde el HTML inicial, incluso si el navegador envía `Accept-Language: en`. Una preferencia explícita guardada como `en`, `es` o `pr` tiene prioridad y el selector continúa permitiendo cambiarla.

**Independent Test**: Solicitar la portada sin cookie y con distintos `Accept-Language`; después solicitar con cada cookie admitida y comprobar `html lang`, metadata y copia. Cambiar idioma en la guía, recargar y comprobar que la selección se conserva.

**Acceptance Scenarios**:
1. **Given** no existe cookie `i18next`, **When** se solicita `/` con `Accept-Language: en`, **Then** el documento y sus metadatos iniciales están en español.
2. **Given** existe una preferencia `i18next` válida (`en`, `es` o `pr`), **When** se carga una página pública, **Then** se sirve ese idioma aunque `Accept-Language` indique otro.
3. **Given** el visitante cambia el selector, **When** vuelve a cargar una página pública, **Then** la preferencia elegida sigue aplicada.

### US2 — Entender la propuesta de la portada (P1)

La home identifica Click Battle como batallas de clicks/reacción con amigos y explica que se puede crear una sala, compartir su enlace y jugar Speed Battle o Reaction Battle.

**Independent Test**: Inspeccionar el HTML inicial y metadata para cada locale; comprobar un H1 descriptivo, title/description coherentes y afirmaciones respaldadas por el lobby.

**Acceptance Scenarios**:
1. El HTML inicial incluye title, description y H1 localizados sobre salas/batallas con amigos.
2. El copy no promete ausencia de cuenta, gratuidad u otra condición no confirmada para partidas grupales.

### US3 — Aprender los pasos y la diferencia entre modos (P1)

La guía explica cómo crear o unirse a una sala, compartir el enlace, y qué hacer en cada modo; conserva enlaces a lobby y al test CPS existente.

**Independent Test**: Verificar texto, H1/H2 y hrefs en desktop y móvil, en `en`, `es` y `pr`, sin interactuar con partidas ni datos Firebase.

**Acceptance Scenarios**:
1. La guía describe Speed Battle como competencia por cantidad de clicks antes de que venza el temporizador.
2. La guía describe Reaction Battle como esperar la señal y hacer click/tap/Space después; la reacción válida más rápida gana y anticiparse pierde la ronda.
3. Los enlaces al lobby (`/`) y al test CPS (`/click-speed-test`) permanecen navegables.

### US4 — Emitir un único viewport desde Next.js (P2)

El layout usa la API `Viewport` de Next.js, conservando los parámetros existentes, y elimina la etiqueta manual duplicada confirmada en la auditoría.

**Independent Test**: Examinar HTML inicial de rutas públicas y contar exactamente una etiqueta `meta[name=viewport]`.

## Functional Requirements

- **FR-001**: Sin preferencia guardada válida, el idioma inicial será `es`; `Accept-Language` no podrá cambiar la variante de la URL principal.
- **FR-002**: Las preferencias explícitas `en`, `es` y `pr` se conservarán vía cookie y selector; no se agregarán rutas localizadas ni `hreflang`.
- **FR-003**: El title, description, H1 y texto nuevo de home y guía estarán en i18n para los tres locales.
- **FR-004**: El contenido describirá solo reglas y acciones existentes de Speed Battle, Reaction Battle, salas e invitaciones.
- **FR-005**: La guía mantendrá enlaces útiles a lobby y test CPS, sin rediseño amplio ni nuevas dependencias.
- **FR-006**: Si se confirma el viewport duplicado, el layout emitirá un único viewport usando la API tipada de Next.js y preservará `width`, escala mínima y `viewport-fit` actuales.
- **FR-007**: Las verificaciones de páginas públicas bloquearán solicitudes externas de Firebase/Analytics y no escribirán ni alterarán datos.

## Success Criteria

- **SC-001**: Sin cookie, HTML de `/` informa `lang="es"` y contenido/meta en español pese a un encabezado inglés.
- **SC-002**: Los tres valores de cookie (`en`, `es`, `pr`) conservan idioma en SSR y tras usar el selector.
- **SC-003**: Metadata, H1, reglas de ambos modos y hrefs pasan verificaciones automatizadas en los tres locales y a 375px/1440px sin desbordamiento horizontal.
- **SC-004**: El HTML probado contiene una sola etiqueta viewport; TypeScript, lint focalizado y `check:i18n` pasan.

## Fuera de alcance y supuestos

- No cambiar la página CPS ya entregada en PR #76 ni el fix de privacidad ya integrado desde PR #78.
- No migrar i18n, crear URLs inglesas/portuguesas, añadir `hreflang`, cambiar reglas de salas, Firebase, ranking o analítica.
- No esperar ni afirmar cambios de ranking, indexación, impresiones o conversiones de Google; requieren medición posterior y no son un resultado demostrable de los tests locales.
- Las pruebas de navegador serán de lectura; el preview puede compartir Firebase productivo, así que se bloquearán hosts externos y no se crearán jugadores/salas.
