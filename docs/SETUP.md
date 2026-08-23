# Setup de MailForge (Desarrollo local)

Este documento explica cómo levantar el proyecto completo en tu máquina.

---

## Requisitos previos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker + Docker Compose
- Git

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/mailforge.git
cd mailforge
```

---

## 2. Instalar dependencias

```bash
pnpm install
```

---

## 3. Variables de entorno

```bash
cp .env.example .env
```

Editad el archivo `.env` si hace falta (por defecto debería funcionar con Docker).

---

## 4. Levantar los servicios de infraestructura

```bash
docker compose up -d
```

Esto levanta:

- **PostgreSQL** → puerto 5432
- **Redis** → puerto 6379
- **Mailpit** → interfaz web en http://localhost:8025

Para ver los logs:

```bash
docker compose logs -f
```

---

## 5. Configurar la base de datos

```bash
# Generar el cliente de Prisma
pnpm --filter database generate

# Ejecutar migraciones
pnpm --filter database migrate:dev
```

---

## 6. Arrancar la aplicación en modo desarrollo

Desde la raíz del monorepo:

```bash
pnpm dev
```

Esto debería arrancar:

- API (NestJS) → http://localhost:3001
- Frontend (Next.js) → http://localhost:3000
- Mailpit → http://localhost:8025

---

## Comandos útiles

| Comando                              | Descripción                          |
| ------------------------------------ | ------------------------------------ |
| `pnpm dev`                           | Arranca API + Frontend               |
| `pnpm --filter api start:dev`        | Solo la API                          |
| `pnpm --filter web dev`              | Solo el Frontend                     |
| `pnpm --filter database migrate:dev` | Crear/ejecutar migraciones           |
| `pnpm --filter database studio`      | Abrir Prisma Studio                  |
| `docker compose up -d`               | Levantar infra                       |
| `docker compose down`                | Parar infra                          |
| `docker compose down -v`             | Parar y borrar volúmenes (¡cuidado!) |

---

## Verificar que todo funciona

1. Abrir http://localhost:3000 → deberíais ver la página de inicio
2. Abrir http://localhost:3001/api (o la ruta de health) → la API responde
3. Abrir http://localhost:8025 → interfaz de Mailpit (vacía al principio)

---

## Problemas comunes

### Puerto ya en uso

Cambiad los puertos en `docker-compose.yml` o parad el proceso que los esté usando.

### Error de conexión a PostgreSQL

Aseguraos de que el contenedor de Postgres está healthy:

```bash
docker compose ps
```

### Prisma no encuentra el schema

Ejecutad siempre los comandos de Prisma desde la raíz con el filtro:

```bash
pnpm --filter database <comando>
```

---

## Flujo de trabajo recomendado (Esteban + Joseph)

1. Cada uno trabaja en su propia rama
2. Antes de empezar el día: `git pull origin main`
3. Después de cambios importantes en el schema: avisar al otro y ejecutar migraciones
4. Usad Mailpit para probar todos los envíos (no hace falta configurar SMTP real)
