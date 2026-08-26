# Arquitectura de MailForge

MailForge es una plataforma **multi-tenant** de email marketing B2C, self-hosted y
open-source. Cada Organization (cliente) gestiona sus datos de forma aislada.

Este documento describe la arquitectura objetivo marcando qué está ya implementado
(✅) y qué queda planificado (⏳). El trabajo vivo está en [ISSUES.md](../ISSUES.md).

---

## Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js (apps/web) ✅                   │
│  Landing operativa · dashboard multi-tenant (Fase 1+)       │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP / JSON
┌─────────────────────────────▼───────────────────────────────┐
│                     NestJS (apps/api) ✅                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Health ✅   │  │ Auth ✅      │  │ Organizations ✅    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Audiences ✅│  │ Campaigns ⏳  │  │ Automations ⏳      │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────┬───────────────────────┬───────────────────────┘
              │ Prisma ✅             │ BullMQ ⏳
     ┌────────▼────────┐     ┌────────▼────────┐
     │   PostgreSQL    │     │  Redis + BullMQ │
     └─────────────────┘     └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │    Mailpit      │ ← desarrollo
                             │ (Postal luego)  │ ← producción self-hosted
                             └─────────────────┘
```

---

## Estado por componente

| Carpeta             | Contenido                                                                                                                                               | Estado       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `apps/api`          | NestJS 11, Express, health (con chequeo de BD), auth, Organizations, Audiences/Subscribers (CRUD + import CSV), CORS por entorno, Helmet, rate limiting | ✅ Operativo |
| `apps/web`          | Next.js 15 App Router, Tailwind v4 CSS-first, componentes shadcn/ui, auth real vía HTTP (TASK-0020; E2E sigue en mock, ver abajo)                       | ✅ Operativo |
| `packages/shared`   | normalizeEmail, slugify, Result, paginación, rutas compartidas                                                                                          | ✅ Operativo |
| `packages/email`    | renderTemplate {{var}} + escape HTML + variante estricta                                                                                                | ✅ Operativo |
| `packages/database` | Prisma; modelos base + migraciones aplicadas contra Postgres real (TASK-0015/0016)                                                                      | ✅ Operativo |
| CI (`ci.yml`)       | format → lint → build → test → e2e en cada PR                                                                                                           | ✅ Operativo |

---

## Estrategia Multi-tenant

Usamos **Shared Database + tenant_id** (la más simple y escalable para empezar).

- Casi todas las tablas tendrán `organizationId`
- Todos los queries del backend filtrarán **obligatoriamente** por `organizationId`
- En NestJS: `OrganizationGuard` (confirma membership vía el `:id` de la ruta) +
  decorador `@CurrentOrganizationRole()`, detrás de `JwtAuthGuard` + `@CurrentUserId()`
- `POST /auth/register` provisiona una Organization personal (el usuario queda
  `owner`) en la misma transacción que crea el `User` — nadie existe sin
  organización, ni un instante (TASK-0019)
- Invariante nº 1 del proyecto: RULE-005 de [AGENTS.md](../AGENTS.md)

Ventajas: fácil de implementar, buen rendimiento, backups simples.
Evolución futura posible a schema-per-tenant si hiciera falta.

---

## Flujo de envío de una campaña (objetivo, Fase 3)

1. Usuario crea una Campaign y elige una Audience
2. El backend crea jobs en la cola BullMQ por cada suscriptor (o por lotes)
3. Los workers procesan los jobs: renderizan plantilla con los datos del suscriptor,
   envian vía Nodemailer a Mailpit (dev) y registran en EmailLog
4. Los eventos de tracking (open, click, unsubscribe) actualizan EmailLog y el estado
   del Subscriber

La pieza ya construida para esto es renderTemplate() en packages/email:
interpolación {{variable}} (plana y dot-path) con escape HTML por defecto y
variante estricta que falla antes de enviar si falta una variable.

### Diseño concreto del motor de envío (decidido, TASK-0056)

Hasta ahora "BullMQ" era una palabra suelta sin números. Punto de partida:

- **Rate limiting**: límite configurable por organización (`sendsPerSecond`,
  default conservador — p. ej. 10/s — mucho más bajo que lo que Mailpit/la
  mayoría de proveedores toleran, porque el límite real lo marca la
  reputación del dominio remitente, no la capacidad técnica de la cola).
  BullMQ soporta esto nativo vía `limiter` por cola.
- **Multi-SMTP**: patrón adapter (`EmailProvider` interface) con Nodemailer
  como implementación de desarrollo (Mailpit) y una implementación por
  proveedor de producción (Postal u otro SMTP) seleccionada por
  configuración de organización, no hardcodeada — así una organización con
  su propio dominio/SMTP no compite por reputación con las demás.
- **Reintentos**: backoff exponencial, 3 intentos, base 30s (BullMQ:
  `attempts: 3, backoff: { type: 'exponential', delay: 30_000 }`). Un fallo
  tras 3 intentos marca `EmailLog.status = 'failed'` con `errorMessage`, no
  reintento infinito.
- **Bounces/quejas** (TASK-0050) alimentan el `Subscriber.status` de vuelta
  vía webhook del proveedor, no polling — el worker de envío y el receptor
  de webhooks son procesos distintos.

### Deliverability antes de producción (TASK-0052)

Ver [SETUP.md](./SETUP.md#6-deliverability-antes-de-producción) para la guía
operativa de SPF/DKIM/DMARC — sin esto, el primer envío masivo real desde un
dominio nuevo cae en spam o quema la reputación del dominio antes de que
importe cualquier otra decisión de diseño de este documento.

---

## Estructura del monorepo

```
apps/api/src/
  main.ts                  # bootstrap Nest
  env.ts                   # lectura de configuración
  app.module.ts            # módulo raíz
  prisma/                  # PrismaModule + PrismaService (@Global, conexión perezosa) + fake para tests
  modules/auth/            # registro/login/refresh/me/me-password, JwtAuthGuard, DTOs, bcrypt, JWT
  modules/organizations/   # CRUD + roles + OrganizationGuard (:id -> membership)
  modules/audiences/       # anidado en organizations/:id/audiences; CRUD + import CSV (TASK-0022/0023)
  modules/health/          # controller + service (chequea BD) + specs
  *.integration.spec.ts    # supertest contra el servidor real
apps/web/
  src/app/                 # App Router: layout, page, globals.css
  src/lib/api-client.ts    # fetch wrapper de bajo nivel hacia apps/api, sin lógica de auth
  src/lib/authenticated-fetch.ts # adjunta el access token + reintenta una vez tras refrescar en un 401
  src/lib/auth/            # store.ts (mock), http-store.ts (real), session-storage.ts (compartido),
                           # client.ts (elige uno de los dos, ver "Estrategia de pruebas")
  src/lib/organizations/   # listOrganizations() + organización "actual" (solo localStorage, TASK-0021)
  src/components/organization-switcher.tsx # dropdown en el sidebar; null si la API no responde
  e2e/                     # specs Playwright + fixtures.ts (fuerza el store mock)
  playwright.config.ts     # next start en :4123 tras build
packages/shared/src/       # result, normalize-email, slugify, pagination, routes
packages/email/src/        # render-template (+ specs)
packages/database/         # prisma/ (schema, migraciones) + src/index.ts (re-exporta @prisma/client)
```

Módulos backend planificados: users, audiences, subscribers, templates,
campaigns, automations, tracking, queue, common. (auth y organizations ya construidos.)

---

## Estrategia de pruebas

Tres capas, todas ejecutables sin Docker:

| Capa        | Herramientas                                        | Qué cubre                                                                   |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Unitaria    | Vitest por paquete (shared, email, api)             | Lógica pura: validaciones, render, servicios con mocks                      |
| Integración | Vitest + @nestjs/testing + unplugin-swc + supertest | DI real de Nest y capa HTTP completa contra /health, /auth y /organizations |
| E2E         | Playwright (chromium)                               | La landing servida por next start tras build de producción                  |

Detalles importantes:

- **SWC en tests de API**: Nest depende de decorators legacy + metadata de tipos
  (design:paramtypes). El transform por defecto de vitest (esbuild) la pierde;
  unplugin-swc con legacyDecorator + decoratorMetadata la restaura.
- **E2E contra producción**: Playwright arranca next start en 127.0.0.1:4123
  (puerto dedicado, host explícito para evitar el flake localhost->::1), así cada PR
  valida además el build real.
- **Sin base de datos, incluso con Prisma ya conectado**: `pnpm test` y CI corren
  sin Docker por diseño. `PrismaService` conecta perezosamente (nunca en boot),
  `HealthService` envuelve su `SELECT 1` en try/catch, y los tests de auth,
  organizations y audiences sustituyen `PrismaService` por un fake en memoria
  (`prisma/prisma.fake.ts`, incluye `$transaction`) vía `.overrideProvider()`.
  La verificación contra Postgres real se hace a mano
  (`docker compose up -d` + `curl`), no en el gate automático.
- **E2E sigue sin Docker aunque el frontend ya hable con la API real**: desde
  TASK-0020, `apps/web/src/lib/auth/client.ts` usa `createHttpAuthStore` por
  defecto (HTTP real contra `NEXT_PUBLIC_API_URL`, default `localhost:3001`).
  Un `NEXT_PUBLIC_*` fijado solo para el proceso de `next start` de Playwright
  no serviría — se inlinea en el build (`pnpm build`), no se lee en caliente al
  servir. En su lugar, `e2e/fixtures.ts` inyecta con `addInitScript` la clave
  `mailforge.e2e-force-mock` en `localStorage` antes de que cargue cualquier
  script de la página; `client.ts` la lee en caliente y cae al store mock
  (`createAuthStore`) para ese test. Todo spec de E2E que registre/inicie
  sesión debe importar `test`/`expect` desde `./fixtures`, no desde
  `@playwright/test` directamente.
- **Organizations no tiene mock, a propósito**: a diferencia de auth y
  audiences, `lib/organizations` llama siempre a la API real — no existe un
  `createMockOrganizationsStore`. Por eso no hay specs E2E de
  `<OrganizationSwitcher>`: en el build que sirve Playwright la API no
  responde, así que el componente cae a su estado `loadFailed` (no renderiza
  nada) — cubierto por un test de componente
  (`organization-switcher.spec.tsx`, fetch mockeado con Testing Library), no
  por E2E. Verificado a mano contra Postgres real: listar organizaciones,
  cambiar entre ellas, y que la elección sobrevive un reload.
- **Audiences: backend real, frontend todavía en su mock**: TASK-0022/0023
  construyeron `POST/GET /organizations/:id/audiences/...` de verdad (CRUD +
  import CSV), pero `apps/web/src/lib/audiences/store.ts` (TASK-0024) sigue
  sin conectar — a diferencia de auth, nadie ha pedido ese swap todavía. El
  modelo real usa la relación muchos-a-muchos de verdad
  (`AudienceSubscriber`): un mismo `Subscriber` (único por
  `organizationId`+`email`) puede pertenecer a varias audiencias sin
  duplicarse, a diferencia del mock (que trata cada audiencia como dueña de
  sus propios suscriptores). El día que se conecte, esa es la diferencia de
  comportamiento a tener en cuenta.

---

## Tooling de calidad

| Pieza               | Cómo funciona                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint 9            | Flat config única en la raíz; cada workspace hace eslint . resolviendo la config hacia arriba. typescript-eslint recommended (sin type-aware en Fase 0). |
| Prettier            | Config raíz única; format / format:check. endOfLine lf + .gitattributes evitan ruido CRLF entre Windows/CI.                                              |
| Husky + lint-staged | Pre-commit formatea/arregla solo lo staged. prepare: "husky                                                                                              |     | exit 0" tolera entornos sin git. |
| Turborepo           | build respeta dependencias (^build); test tras builds de deps; e2e tras el build propio; dev persistente.                                                |
| GitHub Actions      | Job en ubuntu: install --frozen-lockfile, format:check, lint, build, test, e2e (chromium cacheado). Reporte Playwright como artefacto solo si falla.     |

---

## Variables de entorno

| Variable                   | Usada por                   | Desde    | Por defecto                                                            |
| -------------------------- | --------------------------- | -------- | ---------------------------------------------------------------------- |
| API_PORT                   | apps/api                    | ahora    | 3001                                                                   |
| CORS_ORIGIN                | apps/api                    | ahora    | refleja cualquier origin                                               |
| NEXT_PUBLIC_API_URL        | apps/web                    | ahora    | http://localhost:3001 (hardcodeado en api-client.ts, no requiere .env) |
| NEXT_DIST_DIR              | apps/web                    | opcional | .next                                                                  |
| E2E_PORT                   | apps/web (E2E)              | opcional | 4123                                                                   |
| DATABASE_URL               | apps/api, packages/database | ahora    | postgresql://...localhost:5433/mailforge                               |
| REDIS_URL                  | worker/queue                | Fase 3   | -                                                                      |
| JWT_SECRET, JWT_EXPIRES_IN | apps/api (auth)             | ahora    | JWT_EXPIRES_IN=7d; JWT_SECRET sin default                              |
| SMTP_*, SMTP_FROM          | envío email                 | Fase 3   | -                                                                      |

Referencia canónica: .env.example en la raíz — pero Next.js **no lee el .env de
la raíz**, solo `apps/web/.env*`. Para apuntar el frontend a otra URL de API,
crea `apps/web/.env.local` (gitignored) con `NEXT_PUBLIC_API_URL=...`; sin él,
usa el default de `api-client.ts`.

---

## Decisiones importantes de diseño

### ¿Por qué NestJS?

Estructura modular clara, guards/decoradores potentes para multi-tenant, buena
integración con Prisma y BullMQ.

### ¿Por qué BullMQ y no enviar en el request?

Los envíos masivos no pueden ser síncronos; la cola da reintentos, rate limiting y
control de concurrencia.

### ¿Por qué Mailpit en desarrollo?

Cero configuración, interfaz web, no contamina dominios reales.

### ¿Por qué tsc + node --watch en vez de @nestjs/cli o tsx?

tsx/esbuild no emite emitDecoratorMetadata y rompe la DI de Nest. tsc la emite
nativamente; concurrently lanza watch de compilación y proceso. El CLI de Nest
(webpack) se ahorra como dependencia pesada.

### Autenticación (Fase 1)

Sistema propio simple (JWT + refresh tokens) o Better Auth; login social después.

---

## Seguridad desde el principio

- ✅ Helmet (cabeceras) y rate limiting global (`@nestjs/throttler`, 120 req/min) desde TASK-0026
- ✅ CORS restringible por entorno vía `CORS_ORIGIN` (TASK-0026)
- ⏳ Todas las rutas de negocio requerirán autenticación
- ⏳ Todas las consultas filtrarán por organizationId (RULE-005)
- ⏳ Validación de entrada con class-validator o Zod
- ⏳ Rate limiting específico en endpoints públicos (unsubscribe, tracking)
- ⏳ Tokens de unsubscribe firmados y con expiración
