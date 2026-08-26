# ISSUES.md — Ledger de tareas de MailForge

Este fichero es la **fuente única de verdad** del trabajo del proyecto. Cada tarea
tiene un identificador estable `TASK-XXXX`; los estados viven aquí y solo aquí.

## Protocolo del ledger (normativa completa en AGENTS.md: RULE-001 y RULE-013)

1. Antes de empezar un trabajo no trivial, alta la entrada con el siguiente id secuencial.
2. Estados válidos: `Pendiente → En curso → Hecha`, o `Bloqueada` / `Cancelada`.
3. Un id **nunca** se reutiliza ni se renumera; lo cancelado queda registrado como `Cancelada`.
4. Cada PR referencia sus TASK en título y commits (p. ej. `(TASK-0016)`).
5. Al cerrar: fecha de cierre y referencia al PR que lo resolvió.
6. ROADMAP.md narra las fases y enlaza ids; nunca duplica estados.

---

## Fase 0 — Fundación operativa

| ID        | Título                                                                   | Responsable | Estado    | Cierre     | Refs / Notas                                                                                                      |
| --------- | ------------------------------------------------------------------------ | ----------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| TASK-0001 | Estructura monorepo pnpm + Turborepo y documentación inicial             | Ambos       | Hecha     | 2026-08-22 | Commit inicial 4e6c409                                                                                            |
| TASK-0002 | API NestJS mínima: GET /health, CORS, puerto por API_PORT, sin DB        | Agente      | Hecha     | 2026-08-23 | Arranca sin Docker; Prisma diferido a TASK-0017                                                                   |
| TASK-0003 | Web Next.js 15 + Tailwind v4 con landing "Hello MailForge"               | Agente      | Hecha     | 2026-08-23 | shadcn/ui diferido a TASK-0025                                                                                    |
| TASK-0004 | packages/shared: normalizeEmail, slugify, Result, paginación, rutas      | Agente      | Hecha     | 2026-08-23 | Consumido por api y web                                                                                           |
| TASK-0005 | packages/email: renderTemplate {{var}} + escape HTML + variante estricta | Agente      | Hecha     | 2026-08-23 | Cero dependencias runtime                                                                                         |
| TASK-0006 | ESLint 9 flat config raíz para todos los workspaces                      | Agente      | Hecha     | 2026-08-23 | packages/database excluido hasta Fase 1                                                                           |
| TASK-0007 | Prettier + scripts format / format:check                                 | Agente      | Hecha     | 2026-08-23 | endOfLine lf + .gitattributes                                                                                     |
| TASK-0008 | Husky v9 + lint-staged en pre-commit                                     | Agente      | Hecha     | 2026-08-23 | Compatible Windows/CI                                                                                             |
| TASK-0009 | Tests unitarios Vitest (shared, email)                                   | Agente      | Hecha     | 2026-08-23 | 33 tests en total                                                                                                 |
| TASK-0010 | Tests de integración API: @nestjs/testing + supertest sobre /health      | Agente      | Hecha     | 2026-08-23 | Receta SWC: decorators + metadata                                                                                 |
| TASK-0011 | E2E Playwright (chromium) de la landing contra build producción          | Agente      | Hecha     | 2026-08-23 | next start en 127.0.0.1:4123                                                                                      |
| TASK-0012 | Tareas turbo test/e2e + scripts raíz                                     | Agente      | Hecha     | 2026-08-23 | e2e dependsOn ^build + build                                                                                      |
| TASK-0013 | Workflow CI GitHub Actions: lint → build → test → e2e                    | Agente      | Hecha     | 2026-08-23 | .github/workflows/ci.yml                                                                                          |
| TASK-0014 | Docs: ARCHITECTURE, ISSUES, AGENTS, README, CONTRIBUTING, ROADMAP, SETUP | Agente      | Hecha     | 2026-08-23 | Esta misma entrega                                                                                                |
| TASK-0015 | Verificar docker compose (Postgres/Redis/Mailpit) en máquina real        | Esteban     | Pendiente | —          | Requiere Docker instalado                                                                                         |
| TASK-0016 | Prisma: modelos User/Organization/OrganizationMember + primera migración | Esteban     | En curso  | —          | Modelos + migración init generada; falta aplicarla contra Postgres (TASK-0015)                                    |
| TASK-0017 | Conectar PrismaModule a la API + health check de BD                      | Esteban     | Pendiente | —          | Fase 1                                                                                                            |
| TASK-0018 | Módulo auth: registro + login + JWT access/refresh                       | Esteban     | Pendiente | —          | Fase 1; incluye ValidationPipe global + class-validator (nada que validar aún)                                    |
| TASK-0019 | CRUD Organizations + roles + guard organizationId                        | Esteban     | Pendiente | —          | Fase 1                                                                                                            |
| TASK-0020 | UI login/registro + layout autenticado con sidebar                       | Joseph      | En curso  | —          | UI y layout en f2d94dc sobre store mock; real con TASK-0018                                                       |
| TASK-0021 | Organization switcher + protección de rutas Next                         | Joseph      | Pendiente | —          | Guard de cliente ya en f2d94dc; falta el switcher                                                                 |
| TASK-0022 | Modelos Audience/Subscriber + endpoints CRUD + validación                | Esteban     | En curso  | —          | Schema (Audience/Subscriber/AudienceSubscriber/Segment) + migración generados; endpoints bloqueados por TASK-0015 |
| TASK-0023 | Importación de suscriptores por CSV                                      | Esteban     | En curso  | —          | parseSubscriberCsv (parseo + validación, sin I/O) en packages/shared; endpoint bloqueado por TASK-0015/TASK-0022  |
| TASK-0024 | UI audiencias/suscriptores: listado, alta, filtros, estados              | Joseph      | Pendiente | —          | Fase 2                                                                                                            |
| TASK-0025 | Adoptar shadcn/ui + tokens de diseño base                                | Agente      | Hecha     | 2026-08-25 | Adelantada a petición de Esteban; ver TASK-0045 para el alcance real                                              |

## Auditoría transversal 2026-08-25 (backend + frontend + proceso)

Tres agentes de exploración auditaron apps/api, apps/web y el resto del repo (docs,
dependencias, packages/shared, packages/email, CI) contra las reglas de AGENTS.md.
TASK-0026 a TASK-0030 son el trabajo que salió de ahí y se cerró en la misma sesión;
TASK-0031 en adelante son los hallazgos que quedan pendientes de priorizar.

| ID        | Título                                                                 | Responsable | Estado    | Cierre     | Refs / Notas                                                                                          |
| --------- | ---------------------------------------------------------------------- | ----------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| TASK-0026 | Backend: hardening base (CORS por entorno, Helmet, rate limiting, env) | Agente      | Hecha     | 2026-08-25 | CORS_ORIGIN, helmet, @nestjs/throttler, bootstrap fail-fast, readApiPort avisa                        |
| TASK-0027 | Frontend: sidebar del dashboard responsive (mobile-first)              | Agente      | Hecha     | 2026-08-25 | Bloqueante del audit: 87px útiles en 375px antes del fix                                              |
| TASK-0028 | Frontend: accesibilidad y estados reales en los formularios de auth    | Agente      | Hecha     | 2026-08-25 | Foco visible, error por campo, weak_password ya no es dead code                                       |
| TASK-0029 | Frontend: páginas de sistema (404, error boundary, favicon, loading)   | Agente      | Hecha     | 2026-08-25 | No existía ninguna antes del audit                                                                    |
| TASK-0030 | Frontend: extraer Wordmark + hook de auth, adoptar APP_ROUTES          | Agente      | Hecha     | 2026-08-25 | APP_ROUTES era un contrato muerto desde TASK-0020                                                     |
| TASK-0031 | Backend: verificación de email de usuario (campo + flujo)              | Esteban     | Pendiente | —          | Depende de decidir SMTP en Fase 1 vs Fase 3; Mailpit ya disponible                                    |
| TASK-0032 | Backend: recuperación de contraseña (forgot/reset)                     | Esteban     | Pendiente | —          | No está en el alcance actual de TASK-0018, falta decidir si entra ahí                                 |
| TASK-0033 | Backend: invitaciones a Organization (modelo + flujo + token)          | Esteban     | Pendiente | —          | Fase 1, relacionado con TASK-0019                                                                     |
| TASK-0034 | Backend: email case-insensitive a nivel de esquema (citext / índice)   | Agente      | Hecha     | 2026-08-25 | CHECK (email = lower(email)) implementado en migración 20260825120100, no solo decidido               |
| TASK-0035 | Backend: estrategia de soft-delete/retención de datos de negocio       | Agente      | Hecha     | 2026-08-25 | Decidido: deletedAt anulable + filtro en queries. Ver DATA_MODEL.md                                   |
| TASK-0036 | Frontend: sistema de toasts/notificaciones + loaders globales          | Agente      | Hecha     | 2026-08-25 | ToastProvider/useToast; usado en logout (TASK-0037 lo reusa)                                          |
| TASK-0037 | Frontend: página de perfil de usuario (nombre, contraseña)             | Agente      | Hecha     | 2026-08-25 | Bug real corregido: sidebar no se refrescaba tras editar (SESSION_CHANGE_EVENT)                       |
| TASK-0038 | Frontend: página de ajustes de organización (nombre, branding)         | Joseph      | Pendiente | —          | Diferida: no existe ningún concepto de "organización actual" en el frontend aún, depende de TASK-0021 |
| TASK-0039 | Frontend: infraestructura de testing de componentes (Testing Library)  | Agente      | Hecha     | 2026-08-25 | happy-dom + Testing Library; verificado con test real de interacción                                  |
| TASK-0040 | Frontend: pase sistemático de accesibilidad (eslint-plugin-jsx-a11y)   | Agente      | Hecha     | 2026-08-25 | 3 hallazgos reales corregidos (Label/CardTitle/LinkButton con props ocultas)                          |
| TASK-0041 | Frontend: navegación responsive completa (drawer, breadcrumbs)         | Agente      | Hecha     | 2026-08-25 | Drawer real; breadcrumbs diferidos (solo hay una ruta real hoy, ver notas)                            |
| TASK-0042 | Proceso: quitar typescript-eslint de 4 package.json sin uso propio     | Agente      | Hecha     | 2026-08-25 | Verificado: eslint sigue resolviendo vía hoisting desde la raíz                                       |
| TASK-0043 | Proceso: test directo de validatePassword en packages/shared           | Agente      | Hecha     | 2026-08-25 | packages/shared/src/auth.spec.ts                                                                      |
| TASK-0044 | Proceso: decidir soporte dot-path en variables de renderTemplate       | Agente      | Hecha     | 2026-08-25 | Dot-path real implementado (objetos anidados, no arrays); ver render-template.ts                      |

## Rediseño visual 2026-08-25

Esteban probó la app, notó que "aún no está terminado" y pidió cambiar el estilo del
frontend por uno minimalista y moderno. Tras confirmar dirección (claro estilo SaaS,
abandonando la identidad "forja"), se ejecutó en la misma sesión.

| ID        | Título                                                               | Responsable | Estado | Cierre     | Refs / Notas                                                           |
| --------- | -------------------------------------------------------------------- | ----------- | ------ | ---------- | ---------------------------------------------------------------------- |
| TASK-0045 | Rediseño visual completo: paleta clara, Inter, sin identidad "forja" | Agente      | Hecha  | 2026-08-25 | Toca landing/auth/dashboard/páginas de sistema; copy también reescrito |

## Auditoría comparativa 2026-08-25 (vs. Listmonk / SendPortal / Mautic)

Esteban pidió comparar MailForge contra proyectos reales de GitHub del mismo sector
(email marketing self-hosted) y auditar cumplimiento de reglas/invariantes tras las
últimas sesiones. Referencias usadas: **Listmonk** (knadh/listmonk — segmentación SQL,
colas multi-SMTP con rate limiting, bounces/quejas, analítica, plantillas con editor
visual, API transaccional, SSO+RBAC), **SendPortal** (mettle/sendportal — multi-tenant
explícito, integraciones SES/Postmark/Sendgrid/Mailgun/Mailjet), **Mautic**
(automatización multi-canal). TASK-0046 a TASK-0049 son correcciones de documentación
que salieron de la re-auditoría de reglas y se cerraron en la misma sesión; TASK-0050
en adelante son las capacidades que estas herramientas tienen y MailForge todavía no
tiene diseñadas, priorizadas para cuando toque cada fase.

| ID        | Título                                                                 | Responsable | Estado    | Cierre     | Refs / Notas                                                                                          |
| --------- | ---------------------------------------------------------------------- | ----------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| TASK-0046 | Documentar Helmet + rate limiting global en ARCHITECTURE.md            | Agente      | Hecha     | 2026-08-25 | TASK-0026 los construyó pero no se documentaron                                                       |
| TASK-0047 | Añadir updatedAt de OrganizationMember a DATA_MODEL.md                 | Agente      | Hecha     | 2026-08-25 | El campo existe desde TASK-0016, el doc no lo listaba                                                 |
| TASK-0048 | Traducir "Dashboard" a "Panel" en nav y &lt;title&gt;                  | Agente      | Hecha     | 2026-08-25 | RULE-011: única palabra en inglés mezclada con el resto del copy                                      |
| TASK-0049 | Quitar tw-animate-css sin uso real                                     | Agente      | Hecha     | 2026-08-25 | RULE-010: importado en TASK-0045, ninguna clase que aporta se usa                                     |
| TASK-0050 | Ingestión de bounces/quejas (webhook Postal/SES → EmailLog/Subscriber) | Esteban     | Pendiente | —          | Sin esto, bounced/complained son valores de enum que nadie activa nunca                               |
| TASK-0051 | Suppression list (global vs. por audiencia)                            | Esteban     | Pendiente | —          | Depende de TASK-0050 y TASK-0022; evita reenviar a quien ya rebotó                                    |
| TASK-0052 | Guía de deliverability SPF/DKIM/DMARC antes de producción con Postal   | Agente      | Hecha     | 2026-08-25 | Guía operativa en SETUP.md §6; falta el servicio Postal en docker-compose.yml                         |
| TASK-0053 | Cumplimiento one-click unsubscribe (List-Unsubscribe, RFC 8058)        | Esteban     | Pendiente | —          | Requisito de facto de Gmail/Yahoo para remitentes masivos desde 2024                                  |
| TASK-0054 | GDPR: exportar y borrar datos de un subscriber a petición              | Esteban     | Pendiente | —          | Distinto de TASK-0035 (retención interna, no derechos del titular)                                    |
| TASK-0055 | Ciclo de vida de opt-in simple/doble (pending/confirmed + token)       | Agente      | Hecha     | 2026-08-25 | Decidido y documentado en DATA_MODEL.md; implementación real sigue en TASK-0022                       |
| TASK-0056 | Motor de envío: multi-SMTP, rate limiting, reintentos/backoff          | Agente      | Hecha     | 2026-08-25 | Diseño con números concretos en ARCHITECTURE.md; implementación en Fase 3                             |
| TASK-0057 | Segmentación real: entidad Segment + query builder                     | Agente      | Hecha     | 2026-08-25 | DSL de reglas (no SQL libre) documentado en DATA_MODEL.md                                             |
| TASK-0058 | Roadmap de capacidades de plantillas (condicionales, loops, editor)    | Agente      | Hecha     | 2026-08-25 | Decidido: sin ampliar por ahora, sin caso de uso real esperando. Ver DATA_MODEL.md                    |
| TASK-0059 | Analítica de campaña (agregados de apertura/clic, top links)           | Esteban     | Pendiente | —          | Hoy solo se capturarían eventos crudos, sin capa de reporte diseñada                                  |
| TASK-0060 | API pública + tokens de API para integraciones externas                | Agente      | Hecha     | 2026-08-25 | Diseño de ApiToken + convención de auth en DATA_MODEL.md; implementación bloqueada por TASK-0018/0019 |
| TASK-0061 | Media library / almacenamiento de assets para campañas                 | Esteban     | Pendiente | —          | Sin storage de imágenes, cualquier editor de plantillas no tiene de dónde                             |

## Fase 3 y siguientes — Pendiente de desglosar

Las tareas de Fase 3+ (campañas, tracking, automatizaciones) se darán de alta en este
ledger conforme se planifiquen, con ids a partir de TASK-0062, siguiendo el protocolo
de arriba. El detalle narrativo de cada fase vive en ROADMAP.md.
