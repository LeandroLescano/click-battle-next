# Informe de implementación y validación

- **Fecha**: 22/10/2026
- **Rama**: `codex/ranking-public-payload-privacy`
- **Base**: `50cad99b3e48ca7f361c0d74b04fac7398e7496b` (sin commits nuevos; cambios locales revisables)

## Resultado

Se limitó el payload público de `/ranking` a DTOs con allowlist. La consulta de usuarios selecciona solo `username` y `maxScores`, y agrega el ID de documento como `key`; Classic conserva `calculateRanking` y sus resultados antes de construir cada fila permitida. La fila Classic local reutiliza el mismo constructor y ya no copia el perfil autenticado. Reaction conserva elegibilidad, filtros, redondeo, agregación y orden a través de `buildPublicReactionRanking`, una función pura usada por la ruta que crea objetos con solo los campos públicos permitidos.

Allowlist Classic: `key`, `username`, `cps`, `time`, `mode`.

Allowlist Reaction: `key`, `mode`, `reactionMs`, `roundsWon`, `username`.

## Ajustes de simplificación y regresión Reaction (21–22/10/2026)

Se reemplazaron los aliases `ClassicRankingEntry`/`ReactionRankingEntry` por uso directo de los DTO compartidos, definidos como interfaces. Se eliminaron las funciones de una sola pasada `toPublicClassicRanking` y `toPublicReactionRanking`; se conserva `toPublicClassicRankingEntry`, compartida por la fila de servidor y la fila local. En la corrección del 22/10 se extrajo la agregación Reaction no trivial como `buildPublicReactionRanking`, que la ruta consume directamente y que construye objetos permitidos con tipo contextual. No se agregaron traducciones ni se cambió el alcance de producto.

## Archivos de implementación y prueba

- `app/ranking/page.tsx`
- `components-new/Ranking/types.d.ts`
- `components-new/Ranking/components/RankingList/index.tsx`
- `components-new/Ranking/components/RankingList/types.d.ts`
- `lib/ranking/publicRanking.ts`
- `tests/lib/publicRanking.test.ts`

## Artefactos Spec Kit

- `specs/007-public-ranking-payload-privacy/spec.md`
- `specs/007-public-ranking-payload-privacy/plan.md`
- `specs/007-public-ranking-payload-privacy/research.md`
- `specs/007-public-ranking-payload-privacy/data-model.md`
- `specs/007-public-ranking-payload-privacy/contracts/public-ranking-payload.md`
- `specs/007-public-ranking-payload-privacy/quickstart.md`
- `specs/007-public-ranking-payload-privacy/tasks.md`

## Evidencia de validación

- La nueva regresión se escribió antes de implementar el productor: la primera ejecución (`node --test tests/lib/publicRanking.test.ts`) falló como se esperaba porque `buildPublicReactionRanking` aún no estaba exportada.
- `node --test tests/lib/publicRanking.test.ts tests/lib/classicTimer.test.ts` — PASS: 5 pruebas, 0 fallidas. La regresión Reaction usa fixtures sintéticos con campos privados de sala y resultado, y verifica elegibilidad, agregación, redondeo, orden por puntuación/ganadas/nombre y claves serializadas exactas.
- `npm run check:tsc` — PASS: tipos de rutas generados y `tsc --noEmit` terminó con código 0. Aviso no bloqueante: Next.js infirió `C:\Users\leand\package-lock.json` como raíz por lockfiles múltiples.
- ESLint focalizado sobre `app/ranking/page.tsx`, los tipos/componentes del ranking, `lib/ranking/publicRanking.ts` y `tests/lib/publicRanking.test.ts` — PASS después de aplicar el formato requerido. Aviso no bloqueante: no está configurada la versión de React para `eslint-plugin-react`.
- `git diff HEAD --check` — PASS en la revisión completa del diff.
- La prueba Reaction no requiere emuladores: el productor es una función pura alimentada únicamente por fixtures; no accede a Firebase.
- No se leyeron datos reales ni se hicieron escrituras Firebase, E2E, preview, despliegue, merge, push o commit durante esta ronda.

## Avisos no bloqueantes observados

- Node muestra `MODULE_TYPELESS_PACKAGE_JSON` al ejecutar los tests `.ts`; todas las pruebas terminaron correctamente.
- Next.js detecta varios lockfiles y selecciona `C:\Users\leand\package-lock.json` como raíz inferida; `check:tsc` terminó correctamente.
- ESLint avisa que no está configurada la versión de React para `eslint-plugin-react`; lint terminó correctamente.

## Límites y seguridad

No se leyeron registros reales de usuarios ni se ejecutó una página conectada a Firebase; las pruebas usan solo fixtures sintéticos. La consulta de Firestore existente permanece en la ruta; no se ejecutaron accesos a Firebase en esta validación. No hubo escrituras Firebase, E2E autenticado/destructivo, preview, despliegue, merge, push ni commit. La validación del HTML/RSC entregado y el flujo de preview → `develop` → dominio dev quedan para revisión y autorización de integración posteriores.

**Estado**: el productor Reaction extraído a una función pura es usado por `/ranking` y su regresión sintética pasa junto con TypeScript, ESLint focalizado y `git diff HEAD --check`. Cambios locales sin commit; pendiente revisión humana. Sin autorización de integración ni despliegue.
