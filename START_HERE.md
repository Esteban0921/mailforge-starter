# Empieza aquí – MailForge

Hola Esteban y Joseph 👋

Este repositorio contiene la **base documental y estructural** del proyecto.

## Qué tenéis ahora mismo

- Documentación completa en `/docs`
- Estructura de monorepo lista
- `docker-compose.yml` con Postgres + Redis + Mailpit
- Templates de Issues y Pull Requests
- Roadmap con tareas ya divididas entre los dos

## Primeros pasos recomendados (Fase 0)

### Día 1-2 (en paralelo)

**Esteban:**
1. Crear el repositorio en GitHub (privado)
2. Subir todo este contenido
3. Inicializar el monorepo real con Turborepo + NestJS
4. Dejar el `docker compose up -d` funcionando
5. Conectar Prisma a Postgres

**Joseph:**
1. Configurar ESLint + Prettier + Husky
2. Crear el proyecto Next.js dentro de `apps/web`
3. Configurar Tailwind + shadcn/ui
4. Dejar una página de inicio bonita
5. Revisar y mejorar la documentación si hace falta

### Cuando terminéis la Fase 0
- Los dos debéis poder hacer `pnpm install && pnpm dev` y ver API + Frontend + Mailpit funcionando.
- Entonces pasáis a la **Fase 1** (Auth + Organizations) siguiendo el ROADMAP.md

## Regla más importante

Trabajad en ramas y haced Pull Requests aunque seáis solo dos.
Es la mejor forma de no pisaros y de revisar el código del otro.

¡A construir!
