# Setup de MailForge (desarrollo local)

## Requisitos previos

- **Node.js 20+** (recomendado 22; hay `.nvmrc`)
- **pnpm 9** — fijado por `packageManager`. Actívalo con:
  ```bash
  corepack enable
  # si falla por permisos (Windows):
  npm install -g pnpm@9.12.0
  ```
- **Git**
- **Docker** — solo necesario a partir de Fase 1 (Postgres/Redis/Mailpit).
  La Fase 0 funciona completa sin Docker.

---

## 1. Clonar e instalar

```bash
git clone https://github.com/Esteban0921/mailforge-starter.git
cd mailforge-starter
pnpm install
```

## 2. Variables de entorno

```bash
cp .env.example .env
```

Los valores por defecto funcionan en local. Referencia completa de variables:
tabla en [ARCHITECTURE.md](ARCHITECTURE.md).

## 3. Arrancar en desarrollo

```bash
pnpm dev
```

- API (NestJS) → http://localhost:3001 — health: `curl localhost:3001/health`
- Web (Next.js) → http://localhost:3000
- Mailpit (cuando se use) → http://localhost:8025

## 4. Verificar la calidad del proyecto

```bash
pnpm format:check   # Prettier
pnpm lint           # ESLint 9 (todos los workspaces)
pnpm build          # builds turbo en orden de dependencias
pnpm test           # unitarios + integración (sin Docker)
pnpm e2e            # Playwright contra build de producción (:4123)
```

La primera vez, Playwright necesita su navegador:

```bash
pnpm --filter @mailforge/web exec playwright install chromium
```

## 5. Infraestructura con Docker (Fase 1+)

```bash
docker compose up -d   # Postgres :5432 · Redis :6379 · Mailpit :8025
```

Y para la base de datos (cuando haya modelos):

```bash
pnpm db:generate       # prisma generate
pnpm db:migrate        # prisma migrate dev
pnpm db:studio         # prisma studio
```

---

## Comandos útiles

| Comando                            | Descripción                          |
| ---------------------------------- | ------------------------------------ |
| `pnpm dev`                         | API + Web en paralelo                |
| `pnpm --filter @mailforge/api dev` | Solo la API (tsc watch + node watch) |
| `pnpm --filter @mailforge/web dev` | Solo el Frontend                     |
| `pnpm test`                        | Tests unitarios y de integración     |
| `pnpm e2e`                         | Tests E2E Playwright                 |
| `pnpm format`                      | Formatear todo con Prettier          |
| `pnpm db:*`                        | Comandos Prisma (Fase 1+)            |
| `docker compose up -d`             | Levantar infra (Fase 1+)             |
| `docker compose down -v`           | Parar y borrar volúmenes (¡cuidado!) |

---

## Problemas comunes

### `pnpm: command not found` o turbo no encuentra pnpm

Activa pnpm como se indica arriba. Turbo necesita el binario `pnpm` en PATH
(no basta invocarlo por `corepack pnpm`).

### Puerto ya en uso

- Web dev: 3000 · API: 3001 · E2E: 4123 (dedicado, para chocar lo mínimo)
- Cambia el puerto o para el proceso que lo ocupa. El E2E reutiliza un
  servidor ya arrancado salvo en CI.

### Tailwind no aplica estilos en dev

Borra la caché y reinicia: `rm -rf apps/web/.next && pnpm dev`.

### Playwright no descarga el navegador (red corporativa)

Exporta un espejo antes de instalar:
`PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright`

### Prisma no encuentra el schema (Fase 1+)

Ejecuta siempre los comandos desde la raíz con el filtro:
`pnpm --filter @mailforge/database <comando>`
