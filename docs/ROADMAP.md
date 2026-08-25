# Roadmap de MailForge

Plan por fases para que **Esteban** y **Joseph** avancen en paralelo sin bloquearse.

> El estado real de cada tarea vive en [ISSUES.md](../ISSUES.md) con ids `TASK-XXXX`.
> Este documento narra objetivos y orden; **no duplica estados**.

---

## Principios de distribución de trabajo

1. **Contratos primero**: antes de una feature grande, se acuerda la forma de la API (endpoints + tipos) en packages/shared o en su TASK.
2. **Mocks cuando haga falta**: el frontend puede avanzar con datos falsos mientras el backend termina.
3. **PRs pequeños y frecuentes**: mejor 5 PRs pequeños que 1 gigante.
4. **Nadie espera al otro**: si algo no está listo, mock u otra tarea de la misma fase.
5. **Bloqueo > 1 día**: avisar y reasignar la TASK.

---

## Fase 0 – Fundación del repositorio ✅ COMPLETADA

**Objetivo:** clonar, instalar y trabajar sin fricción, con calidad automatizada.

| Tareas                                                                                                     | Ids                   |
| ---------------------------------------------------------------------------------------------------------- | --------------------- |
| Monorepo + docs iniciales; API mínima (/health); Web landing (Tailwind); packages/shared y email con tests | TASK-0001 … TASK-0005 |
| ESLint + Prettier + Husky; tests unit/integración/E2E; turbo tasks; CI; documentación del workflow         | TASK-0006 … TASK-0014 |
| Pendiente: verificar docker compose en máquina real                                                        | TASK-0015             |

Criterio cumplido: `pnpm install && pnpm dev` levanta API (:3001) + Web (:3000)
sin Docker, y todos los gates (`lint/build/test/e2e`) pasan también sin Docker.

---

## Fase 1 – Multi-tenant + Autenticación (1.5 – 2 semanas)

**Objetivo:** registrarse, crear organizaciones y cambiar entre ellas.

| Área     | Tareas                                                                                                             | Ids                   |
| -------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| Backend  | Modelos User/Organization/OrganizationMember; Prisma en la API; auth JWT; CRUD orgs + roles + guard organizationId | TASK-0016 … TASK-0019 |
| Frontend | Login/registro; layout autenticado; organization switcher; protección de rutas                                     | TASK-0020, TASK-0021  |

**Paralelismo:** Joseph puede empezar pantallas con mocks mientras Esteban levanta Prisma/auth.

---

## Fase 2 – Audiencias y Suscriptores (1.5 – 2 semanas)

**Objetivo:** cada organización gestiona listas y suscriptores.

| Área     | Tareas                                                                                              | Ids                  |
| -------- | --------------------------------------------------------------------------------------------------- | -------------------- |
| Backend  | Modelos Audience/Subscriber; endpoints CRUD; importación CSV; validación y estados                  | TASK-0022, TASK-0023 |
| Frontend | Listado/detalle de audiencias; alta de suscriptores; filtros; indicadores de estado; shadcn/ui base | TASK-0024, TASK-0025 |

---

## Fases 3+ — Por desglosar

Fase 3 (campañas one-shot + motor de envío con BullMQ), Fase 4 (tracking y
unsubscribe), Fase 5 (automatizaciones B2C), Fase 6 (pulido self-hosted) se
desglosarán en TASKs (a partir de TASK-0046) al llegar a cada fase, siguiendo
el protocolo de ISSUES.md.

---

## Cómo usar este Roadmap

1. Cada fase puede mapearse a un Milestone de GitHub si se desea.
2. Las tareas se gestionan SOLO desde ISSUES.md (alta, estado, cierre).
3. Ramas feature/task-XXXX-slug; PRs revisados; squash merge.
4. Al cerrar tareas de una fase, comprobar si queda algo pendiente antes de abrir la siguiente.

**Regla de oro:** bloqueado esperando al otro → avisa, usa un mock o coge otra tarea de la misma fase.
