# Auditoría SEO y prioridades de Click Battle

Fecha: 2026-10-18. Alcance: web pública y adquisición, no rediseño del multiplayer.

## Conclusiones y límites

Los datos de Search Console aportados son escasos: 1 clic y 51 impresiones para el test en tres meses, con 44 impresiones y el clic en la consulta visible `click battle`. No conocemos las consultas omitidas ni el estado actual del índice por URL Inspection. No hay evidencia suficiente para atribuir el resultado al dominio del competidor ni para prometer crecimiento tras un cambio técnico.

La auditoría HTTP encontró contenido, título y canonical del test en el HTML servido. Por tanto, no se debe afirmar que la página es invisible para Google por estar hecha en React. El problema observado más acotado es que la home sirve su estado de carga de sesión sin enlaces públicos al test; /how-to-play sí lo enlaza y el sitemap lo incluye.

## Prioridades investigadas

| Prioridad | Práctica | Aplicación y estado |
| --- | --- | --- |
| P0 | Medición e indexación verificables | Revisar URL Inspection (índice vs prueba publicada), query/page export, GA4 y exclusión de tráfico interno. No confundir elegibilidad HTTP con indexación real. Pendiente acceso a datos. |
| P1 | Enlaces internos HTML, descriptivos y visibles | E1 implementado localmente: enlaces de home a test, instrucciones y ranking, independientes de auth. Mantener la URL existente. |
| P1 | Intención y utilidad | El test debe explicar 5 segundos, CPS = clicks/5, instrucciones y qué hacer con el resultado. Cambiar primero una unidad coherente; no rellenar con texto SEO ni inventar benchmarks. E2 propuesto. |
| P1 | Títulos y snippets concretos | Evaluar un título específico como `5-Second Click Speed Test (CPS) | Click Battle` con traducciones y contenido concordante. Google puede reescribir título/snippet; no usar límites de caracteres como garantía. Pendiente. |
| P2 | Rendimiento medido | Obtener datos de campo si hay cobertura; medir LCP, INP, CLS y tareas largas durante clicks. Los resultados de laboratorio no equivalen al percentil 75 de usuarios reales. Sin mediciones actuales, no hay diagnóstico de lentitud. |
| P2 | Idiomas y canonical | Actualmente una URL varía por cookie/Accept-Language. Auditar URLs dedicadas y alternates recíprocos antes de implementarlos; `pr` interno no es `pt-BR`. No agregar hreflang ficticio ni migrar rutas sin preservar compatibilidad. |
| P2 | Descubrimiento externo legítimo | Buscar lugares donde el juego aporte valor real y comunicar una propuesta diferenciada. No comprar enlaces, automatizar spam ni prometer que una mención subirá posiciones. No es parte del primer cambio. |
| P3 | Datos estructurados veraces | Solo tipos aplicables y datos visibles. No inventar estrellas, puntuaciones, records ni reviews; no vender FAQ markup como crecimiento o rich results garantizados. |

## Qué NO haremos

- Publicar decenas de páginas casi idénticas por cada duración o keyword.
- Cambiar simultáneamente dominio, arquitectura de idiomas, scoring, homepage y metadata del test para luego atribuir una subida a un único factor.
- Repetir solicitudes de indexación o presentar sitemap/lastmod/priority como palancas mágicas.
- Prometer primera posición, un plazo fijo de indexación, CTR alto o significancia estadística con este volumen.
- Interpretar ausencia de consultas o de eventos como prueba automática de ausencia de usuarios.

## Secuencia de experimentos

1. E1: navegación pública de home. Alcance y aceptación en `experiments.md`. Mantener títulos, contenido del test y scoring para separar esta intervención.
2. Verificar medición real y recrawl después de publicar E1 aprobado. Revisar señales a 28 días completos; si el volumen no alcanza, extender observación y reportarlo, no declarar éxito o fracaso causal.
3. E2: título + encabezado + explicación CPS como unidad de intención de búsqueda, con todas las traducciones y test funcional existente.
4. E3: optimización de rendimiento únicamente basada en mediciones reproducibles.
5. Arquitectura de idiomas como proyecto separado por su riesgo y amplitud.

## Fuentes primarias

- Google, enlaces y anchors: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google, JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google, depurar JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript
- Google, títulos: https://developers.google.com/search/docs/appearance/title-link
- Google, snippets: https://developers.google.com/search/docs/appearance/snippet
- Google, contenido útil: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google, Search Console: https://developers.google.com/search/docs/monitor-debug/search-console-start
- Google, versiones localizadas: https://developers.google.com/search/docs/specialty/international/localized-versions
- Google, sitios multilingües: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Google, reglas de datos estructurados: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- web.dev, métricas y umbrales: https://web.dev/articles/vitals
- Next.js, Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

No se usaron estimaciones de volumen de búsquedas o tráfico del competidor.
