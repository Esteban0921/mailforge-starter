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
- Mailpit (cuando se use) → http://localhost:8026

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
docker compose up -d   # Postgres :5433 · Redis :6380 · Mailpit :8026
```

Puertos desplazados (+1 en el último dígito) porque el equipo puede tener
otro stack Docker corriendo en los puertos estándar; ver la nota al
principio de `docker-compose.yml`.

Y para la base de datos (cuando haya modelos):

```bash
pnpm db:generate       # prisma generate
pnpm db:migrate        # prisma migrate dev
pnpm db:studio         # prisma studio
```

## 6. Deliverability antes de producción

Esto no aplica a desarrollo local (Mailpit no comprueba nada de esto), pero
**bloquea cualquier envío real** desde el momento en que MailForge hable con
Postal (o cualquier SMTP de producción) en vez de con Mailpit. Sin lo de
abajo, el primer envío masivo cae en spam o quema la reputación del dominio
antes de que importe ninguna otra decisión de producto — es infraestructura
de correo, no una opción de configuración a posponer (TASK-0052).

1. **SPF** — registro TXT en el dominio remitente autorizando qué servidores
   pueden enviar en su nombre: `v=spf1 ip4:<ip-del-servidor-postal> -all`.
   Un solo registro SPF por dominio; si ya existe uno (p. ej. de Google
   Workspace), se añade el mecanismo, no se duplica el registro.
2. **DKIM** — Postal genera su propio par de claves por dominio remitente
   (`postal dkim generate` en su CLI); la clave pública se publica como TXT
   en `<selector>._domainkey.<dominio>`. Cada dominio que una organización
   quiera usar como remitente necesita su propio DKIM.
3. **DMARC** — registro TXT en `_dmarc.<dominio>` declarando qué hacer si
   SPF/DKIM fallan. Empezar en modo observación,
   `v=DMARC1; p=none; rua=mailto:<direccion-de-reportes>`, y subir a
   `p=quarantine` (y eventualmente `p=reject`) solo después de confirmar en
   los reportes que el propio envío legítimo pasa SPF/DKIM de forma
   consistente — pasar a `p=reject` antes de verificar eso puede bloquear
   correo propio.
4. **Verificación**: antes de dar por buena la configuración de un dominio,
   un envío de prueba a [mail-tester.com](https://www.mail-tester.com) (o
   equivalente) confirma que SPF/DKIM/DMARC resuelven correctamente end to
   end, no solo que los registros DNS existen.

Esto es responsabilidad de quien despliega (por dominio, por organización),
no algo que MailForge pueda automatizar completamente — pero si Fase 3
demuestra que hace falta, un asistente en la UI que verifique estos tres
registros por dominio antes de permitir el primer envío es candidato natural
a TASK propia.

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

### `Error: spawn UNKNOWN` al ejecutar cualquier comando de turbo

En Windows, `turbo.exe` puede quedar bloqueado por una directiva de **Control
de aplicaciones** (WDAC / Smart App Control): el binario está instalado pero el
sistema se niega a ejecutarlo. Se reconoce porque falla igual `pnpm lint`,
`pnpm build`, `pnpm test` y `pnpm e2e`, todos con `errno -4094`, y al invocar
el `.exe` a mano Windows responde _"una directiva de Control de aplicaciones
bloqueó este archivo"_.

No es un problema del repo y no se arregla reinstalando. Mientras dure el
bloqueo, las puertas de RULE-004 se pueden pasar sin turbo:

```bash
pnpm format:check
pnpm exec eslint .
pnpm -r run build
pnpm -r run test
pnpm --filter @mailforge/web e2e
```

La solución de fondo es permitir el binario en la política de App Control de la
máquina; eso lo decide quien administre el equipo.

### El build de los E2E choca con un `next dev` abierto

`next dev` y `next build` escriben los dos en `apps/web/.next`. Lo más simple es
parar el dev server antes de `pnpm e2e`. Si necesitas los dos a la vez existe la
escotilla `NEXT_DIST_DIR` (p. ej. `.next-e2e`, ya ignorado en git), pero al
usarla Next reescribe
`next-env.d.ts` y `apps/web/tsconfig.json` apuntando al directorio nuevo: son
ficheros trackeados, así que reviértelos antes de commitear.
