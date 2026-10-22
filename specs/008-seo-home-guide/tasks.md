# Tasks: SEO social de home y guía

**Input**: [spec.md](./spec.md) y [plan.md](./plan.md)
**Organización**: Specify → plan → tasks → implement. No hay cambios de datos ni tareas de backend.

## Phase 1: Specify, plan y pruebas

- [x] T001 Revisar `AGENTS.md`, constitución, el plan/auditorías SEO y `specs/006-seo-acquisition`.
- [x] T002 Definir los comportamientos y exclusiones en `spec.md` y `plan.md`.
- [x] T003 Escribir regresiones para idioma, metadata/copy, guía/enlaces, viewport y responsive en `tests/e2e/seo-home-guide.spec.ts`.
- [x] T004 Ejecutar primero las regresiones y observar fallos atribuibles a los requisitos faltantes.

## Phase 2: Implementación

- [x] T005 Cambiar `i18n/settings.ts`, `i18n/server.ts` e `i18n/i18n-context.tsx` para español predeterminado y cookie explícita `en`/`es`/`pr`.
- [x] T006 Actualizar metadata de home en `lib/seo/routes.ts`, su H1/contexto en `components-new/WelcomeMessage/index.tsx`, `app/page.tsx` y `app/page-client.tsx`, y traducciones en los tres locales.
- [x] T007 Actualizar pasos y diferencias de modos en `components-new/PlayOnlineGuide/index.tsx`, metadata de guía en `lib/seo/routes.ts` y sus traducciones en los tres locales; conservar hrefs `/` y `/click-speed-test`.
- [x] T008 Reemplazar viewport manual duplicado en `app/layout.tsx` por `Viewport` de Next y conservar sus opciones actuales.
- [x] T009 Actualizar `tests/e2e/seo-public-discovery.spec.ts` para que los casos ingleses/portugueses expresen una preferencia guardada, no dependan de `Accept-Language`.

## Phase 3: Verificación y entrega

- [x] T010 Ejecutar E2E focalizado en Chromium para los casos de SEO/idioma y revisar móvil (375px) y escritorio (1440px), con requests externos bloqueados.
- [x] T011 Ejecutar `npm run check:i18n`, `npm run check:tsc`, lint focalizado y `git diff --check`; corregir regresiones.
- [ ] T012 Inspeccionar diff completo y estado Git, commit solo archivos del alcance, push de `codex/seo-social-discovery` y abrir PR a `develop`.
- [ ] T013 Leer PR/checks/preview remoto y entregar URL, resumen, checks y limitaciones por Kanban Review. No mergear ni desplegar manualmente.
