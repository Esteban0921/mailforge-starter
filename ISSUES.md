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

| ID        | Título                                                                   | Responsable | Estado    | Cierre     | Refs / Notas                                                                   |
| --------- | ------------------------------------------------------------------------ | ----------- | --------- | ---------- | ------------------------------------------------------------------------------ |
| TASK-0001 | Estructura monorepo pnpm + Turborepo y documentación inicial             | Ambos       | Hecha     | 2026-08-22 | Commit inicial 4e6c409                                                         |
| TASK-0002 | API NestJS mínima: GET /health, CORS, puerto por API_PORT, sin DB        | Agente      | Hecha     | 2026-08-23 | Arranca sin Docker; Prisma diferido a TASK-0017                                |
| TASK-0003 | Web Next.js 15 + Tailwind v4 con landing "Hello MailForge"               | Agente      | Hecha     | 2026-08-23 | shadcn/ui diferido a TASK-0025                                                 |
| TASK-0004 | packages/shared: normalizeEmail, slugify, Result, paginación, rutas      | Agente      | Hecha     | 2026-08-23 | Consumido por api y web                                                        |
| TASK-0005 | packages/email: renderTemplate {{var}} + escape HTML + variante estricta | Agente      | Hecha     | 2026-08-23 | Cero dependencias runtime                                                      |
| TASK-0006 | ESLint 9 flat config raíz para todos los workspaces                      | Agente      | Hecha     | 2026-08-23 | packages/database excluido hasta Fase 1                                        |
| TASK-0007 | Prettier + scripts format / format:check                                 | Agente      | Hecha     | 2026-08-23 | endOfLine lf + .gitattributes                                                  |
| TASK-0008 | Husky v9 + lint-staged en pre-commit                                     | Agente      | Hecha     | 2026-08-23 | Compatible Windows/CI                                                          |
| TASK-0009 | Tests unitarios Vitest (shared, email)                                   | Agente      | Hecha     | 2026-08-23 | 33 tests en total                                                              |
| TASK-0010 | Tests de integración API: @nestjs/testing + supertest sobre /health      | Agente      | Hecha     | 2026-08-23 | Receta SWC: decorators + metadata                                              |
| TASK-0011 | E2E Playwright (chromium) de la landing contra build producción          | Agente      | Hecha     | 2026-08-23 | next start en 127.0.0.1:4123                                                   |
| TASK-0012 | Tareas turbo test/e2e + scripts raíz                                     | Agente      | Hecha     | 2026-08-23 | e2e dependsOn ^build + build                                                   |
| TASK-0013 | Workflow CI GitHub Actions: lint → build → test → e2e                    | Agente      | Hecha     | 2026-08-23 | .github/workflows/ci.yml                                                       |
| TASK-0014 | Docs: ARCHITECTURE, ISSUES, AGENTS, README, CONTRIBUTING, ROADMAP, SETUP | Agente      | Hecha     | 2026-08-23 | Esta misma entrega                                                             |
| TASK-0015 | Verificar docker compose (Postgres/Redis/Mailpit) en máquina real        | Esteban     | Pendiente | —          | Requiere Docker instalado                                                      |
| TASK-0016 | Prisma: modelos User/Organization/OrganizationMember + primera migración | Esteban     | En curso  | —          | Modelos + migración init generada; falta aplicarla contra Postgres (TASK-0015) |
| TASK-0017 | Conectar PrismaModule a la API + health check de BD                      | Esteban     | Pendiente | —          | Fase 1                                                                         |
| TASK-0018 | Módulo auth: registro + login + JWT access/refresh                       | Esteban     | Pendiente | —          | Fase 1; incluye ValidationPipe global + class-validator (nada que validar aún) |
| TASK-0019 | CRUD Organizations + roles + guard organizationId                        | Esteban     | Pendiente | —          | Fase 1                                                                         |
| TASK-0020 | UI login/registro + layout autenticado con sidebar                       | Joseph      | En curso  | —          | UI y layout en f2d94dc sobre store mock; real con TASK-0018                    |
| TASK-0021 | Organization switcher + protección de rutas Next                         | Joseph      | Pendiente | —          | Guard de cliente ya en f2d94dc; falta el switcher                              |
| TASK-0022 | Modelos Audience/Subscriber + endpoints CRUD + validación                | Esteban     | Pendiente | —          | Fase 2                                                                         |
| TASK-0023 | Importación de suscriptores por CSV                                      | Esteban     | Pendiente | —          | Fase 2                                                                         |
| TASK-0024 | UI audiencias/suscriptores: listado, alta, filtros, estados              | Joseph      | Pendiente | —          | Fase 2                                                                         |
| TASK-0025 | Adoptar shadcn/ui + tokens de diseño base                                | Joseph      | Pendiente | —          | Fase 2                                                                         |

## Auditoría transversal 2026-08-25 (backend + frontend + proceso)

Tres agentes de exploración auditaron apps/api, apps/web y el resto del repo (docs,
dependencias, packages/shared, packages/email, CI) contra las reglas de AGENTS.md.
TASK-0026 a TASK-0030 son el trabajo que salió de ahí y se cerró en la misma sesión;
TASK-0031 en adelante son los hallazgos que quedan pendientes de priorizar.

| ID        | Título                                                                 | Responsable | Estado    | Cierre     | Refs / Notas                                                                   |
| --------- | ---------------------------------------------------------------------- | ----------- | --------- | ---------- | ------------------------------------------------------------------------------ |
| TASK-0026 | Backend: hardening base (CORS por entorno, Helmet, rate limiting, env) | Agente      | Hecha     | 2026-08-25 | CORS_ORIGIN, helmet, @nestjs/throttler, bootstrap fail-fast, readApiPort avisa |
| TASK-0027 | Frontend: sidebar del dashboard responsive (mobile-first)              | Agente      | Hecha     | 2026-08-25 | Bloqueante del audit: 87px útiles en 375px antes del fix                       |
| TASK-0028 | Frontend: accesibilidad y estados reales en los formularios de auth    | Agente      | Hecha     | 2026-08-25 | Foco visible, error por campo, weak_password ya no es dead code                |
| TASK-0029 | Frontend: páginas de sistema (404, error boundary, favicon, loading)   | Agente      | Hecha     | 2026-08-25 | No existía ninguna antes del audit                                             |
| TASK-0030 | Frontend: extraer Wordmark + hook de auth, adoptar APP_ROUTES          | Agente      | Hecha     | 2026-08-25 | APP_ROUTES era un contrato muerto desde TASK-0020                              |
| TASK-0031 | Backend: verificación de email de usuario (campo + flujo)              | Esteban     | Pendiente | —          | Depende de decidir SMTP en Fase 1 vs Fase 3; Mailpit ya disponible             |
| TASK-0032 | Backend: recuperación de contraseña (forgot/reset)                     | Esteban     | Pendiente | —          | No está en el alcance actual de TASK-0018, falta decidir si entra ahí          |
| TASK-0033 | Backend: invitaciones a Organization (modelo + flujo + token)          | Esteban     | Pendiente | —          | Fase 1, relacionado con TASK-0019                                              |
| TASK-0034 | Backend: email case-insensitive a nivel de esquema (citext / índice)   | Esteban     | Pendiente | —          | Hoy solo lo garantiza normalizeEmail() en aplicación, no la BD                 |
| TASK-0035 | Backend: estrategia de soft-delete/retención de datos de negocio       | Esteban     | Pendiente | —          | Decidir antes de que TASK-0022 empiece a acumular suscriptores                 |
| TASK-0036 | Frontend: sistema de toasts/notificaciones + loaders globales          | Joseph      | Pendiente | —          | Fase 2                                                                         |
| TASK-0037 | Frontend: página de perfil de usuario (nombre, contraseña)             | Joseph      | Pendiente | —          | Fase 2                                                                         |
| TASK-0038 | Frontend: página de ajustes de organización (nombre, branding)         | Joseph      | Pendiente | —          | Distinta del switcher de TASK-0021                                             |
| TASK-0039 | Frontend: infraestructura de testing de componentes (Testing Library)  | Joseph      | Pendiente | —          | vitest.config usa environment:'node'; hoy no se puede testear JSX              |
| TASK-0040 | Frontend: pase sistemático de accesibilidad (eslint-plugin-jsx-a11y)   | Joseph      | Pendiente | —          | Fase 2, más allá de los fixes puntuales de TASK-0028                           |
| TASK-0041 | Frontend: navegación responsive completa (drawer, breadcrumbs)         | Joseph      | Pendiente | —          | TASK-0027 resolvió lo bloqueante; esto es la versión pulida                    |
| TASK-0042 | Proceso: quitar typescript-eslint de 4 package.json sin uso propio     | Esteban     | Pendiente | —          | Solo la config raíz lo usa; RULE-010                                           |
| TASK-0043 | Proceso: test directo de validatePassword en packages/shared           | Esteban     | Pendiente | —          | Hoy solo cubierto indirectamente vía apps/web/store.spec.ts                    |
| TASK-0044 | Proceso: decidir soporte dot-path en variables de renderTemplate       | Esteban     | Pendiente | —          | Fase 3; el regex ya acepta puntos pero el docstring dice claves planas         |

## Fase 3 y siguientes — Pendiente de desglosar

Las tareas de Fase 3+ (campañas, tracking, automatizaciones) se darán de alta en este
ledger conforme se planifiquen, con ids a partir de TASK-0026, siguiendo el protocolo
de arriba. El detalle narrativo de cada fase vive en ROADMAP.md.
