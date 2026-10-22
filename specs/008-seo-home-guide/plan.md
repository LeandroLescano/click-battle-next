# Plan de implementación: SEO social de home y guía

**Branch**: `codex/seo-social-discovery` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)

## Summary

Ajustar metadata/copy de home y `/how-to-play` con Click Battle como identidad principal y los modos existentes como reglas específicas de la guía; hacer que español sea el fallback de la URL `.com.ar` respetando la cookie explícita `i18next`, y retirar el viewport manual duplicado mediante la API de Next.js. No tocar gameplay, Firebase, Analytics, rutas de idioma, CPS ni ranking.

## Technical Context

- **Stack**: TypeScript 5.9.3, React 18.2.0, Next.js 15.5.18, i18next/react-i18next y Playwright.
- **Fuentes existentes**: `specs/006-seo-acquisition/audit.md` y `experiments.md`; plan priorizado y auditorías técnica/on-page adjuntos a Kanban (`t_43300622`, `t_26bf076c`, `t_00195363`). Revalidar supuestos con código actual; no repetir auditoría general.
- **Archivos centrales**: `lib/seo/routes.ts`, `components-new/WelcomeMessage/index.tsx`, `app/page.tsx`, `app/page-client.tsx`, `components-new/PlayOnlineGuide/index.tsx`, `i18n/server.ts`, `i18n/settings.ts`, `i18n/i18n-context.tsx`, los tres `i18n/locales/*/translation.json` y `app/layout.tsx`.
- **Persistencia**: sin cambios; cookie existente `i18next` conserva preferencias. No se realizan escrituras a Firebase.
- **Verificación**: regresiones Playwright para HTML/metadata/idioma/enlaces y responsive; `npm run check:i18n`, `npm run check:tsc`, ESLint focalizado y `git diff --check`.

## Constitution Check

- **I. Estabilidad de gameplay**: PASS — las reglas y estados no cambian.
- **II. App Router y patrones existentes**: PASS — reutiliza metadata/i18n/componentes activos.
- **III. Contratos Firebase**: PASS — sin cambios ni datos de prueba; requests externos se bloquean.
- **IV. Verificación antes de promoción**: PASS — se agregan regresiones de las rutas públicas y checks estáticos.
- **V. Entrega ramificada**: PASS — rama feature desde `develop`, PR a `develop`; no merge ni deploy manual.

## Diseño y decisiones

1. El idioma inicial depende únicamente de una cookie `i18next` válida (`en`, `es`, `pr`); si falta o no es válida, usar `defaultLng=es`. No depender de `Accept-Language` ni de `navigator.language` para que el HTML de `/` sea estable. Mantener `fallbackLng=en` para no cambiar la conducta de traducciones faltantes en los locales explícitos; conservar la lista/selector y caché por cookie.
2. Traducir claves nuevas para los tres locales. Title/H1 de home y guía priorizan Click Battle; la descripción de home explica batallas online y el flujo real de crear/compartir una sala, sin promesas sobre registro o precio.
3. La guía sigue con el componente existente y sus CTA actuales. Solo los pasos de reglas nombran Speed Battle (más clicks antes del fin del temporizador) y Reaction Battle (esperar la señal y reaccionar; anticiparse pierde la ronda); no se presentan como la definición exhaustiva del producto.
4. La auditoría técnica confirmó dos `meta viewport` y el layout actual agrega uno manualmente, mientras Next.js también tiene viewport predeterminado. Cambiar a `export const viewport: Viewport` y conservar `width=device-width`, `initial-scale=1`, `minimum-scale=1` y `viewport-fit=cover`.
5. No rehacer ni duplicar el trabajo de PR #76 (CPS) ni PR #78 (privacidad del ranking); la rama de trabajo se actualiza sobre el `develop` que ya contiene #78.

## Estructura

```text
specs/008-seo-home-guide/{spec.md,plan.md,tasks.md}
lib/seo/routes.ts
i18n/server.ts
 i18n/settings.ts
 i18n/i18n-context.tsx
 i18n/locales/{en,es,pr}/translation.json
app/{layout.tsx,page.tsx,page-client.tsx}
app/how-to-play/page.tsx
components-new/{WelcomeMessage,PlayOnlineGuide}/index.tsx
tests/e2e/seo-home-guide.spec.ts
tests/e2e/seo-public-discovery.spec.ts
```

## Seguridad y entrega

Solo leer páginas locales. Playwright intercepta y aborta requests fuera del origen local (Firebase, Analytics, anuncios u otros servicios). No usar cuentas de jugadores, emuladores, staging ni pruebas con escrituras. Tras los checks, revisar diff completo, commit, push y abrir PR hacia `develop`; observar preview si Vercel lo genera. La integración/merge y el deploy en `develop`/producción quedan fuera de esta tarea.
