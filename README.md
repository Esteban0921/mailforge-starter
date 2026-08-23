# MailForge

**Plataforma multi-tenant de email marketing orientada a B2C**, self-hosted y 100% open-source.

Construida por **Esteban** y **Joseph**.

---

## ¿Qué es MailForge?

MailForge permite a varios clientes (organizations) gestionar de forma aislada:

- Sus audiencias y suscriptores
- Campañas de email one-shot
- Automatizaciones B2C simples (bienvenida, carrito abandonado, re-engagement…)
- Tracking de aperturas, clics y bajas

Todo sin depender de servicios de pago durante el desarrollo: la API y el frontend
arrancan sin infraestructura, y Postgres/Redis/Mailpit llegan por Docker cuando se
necesitan.

---

## Stack tecnológico

| Capa               | Tecnología                            |
| ------------------ | ------------------------------------- |
| Monorepo           | pnpm + Turborepo                      |
| Backend            | NestJS 11 + Prisma                    |
| Frontend           | Next.js 15 (App Router) + Tailwind v4 |
| Base de datos      | PostgreSQL                            |
| Cola de trabajos   | Redis + BullMQ                        |
| Email (desarrollo) | Mailpit                               |
| Tests              | Vitest + supertest + Playwright       |
| Calidad            | ESLint 9 + Prettier + Husky + CI      |
| Infra local        | Docker Compose                        |

---

## Arranque exprés

```bash
pnpm install
pnpm build && pnpm test   # sin necesidad de Docker
pnpm dev                  # API :3001 · Web :3000
pnpm e2e                  # Playwright contra build producción
```

Requisitos: Node 20+ y pnpm 9 (ver [docs/SETUP.md](docs/SETUP.md)).

---

## Documentación

| Documento                               | Descripción                                                          |
| --------------------------------------- | -------------------------------------------------------------------- |
| [SETUP.md](docs/SETUP.md)               | Cómo levantar el proyecto en local                                   |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema, pruebas y tooling                          |
| [ISSUES.md](ISSUES.md)                  | **Ledger de tareas TASK-XXXX — fuente única de verdad del trabajo**  |
| [AGENTS.md](AGENTS.md)                  | **Manual de operaciones con reglas RULE-XXX para agentes y humanos** |
| [ROADMAP.md](docs/ROADMAP.md)           | Plan de trabajo por fases                                            |
| [DATA_MODEL.md](docs/DATA_MODEL.md)     | Modelo de datos                                                      |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Resumen humano de cómo trabajamos                                    |

---

## Equipo

- **Esteban** → Enfocado principalmente en Backend + Infraestructura + Base de datos
- **Joseph** → Enfocado principalmente en Frontend + UI/UX + Experiencia de usuario

Ambos pueden tocar cualquier parte; los agentes IA siguen [AGENTS.md](AGENTS.md).

---

## Estado actual

**Fase 0 completada — Fundación operativa**: monorepo, API, web, tests
(unitarios + integración + E2E), linting, hooks y CI funcionando.
Siguiente parada: Fase 1 (Auth + Organizations) según [ROADMAP.md](docs/ROADMAP.md).

---

## Licencia

MIT (o la que decidáis)
