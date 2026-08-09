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

Todo sin depender de servicios de pago (SendGrid, Mailchimp, etc.) durante el desarrollo.  
En producción podéis usar vuestro propio servidor de correo o conectar un ESP más adelante.

---

## Stack tecnológico

| Capa              | Tecnología                      |
|-------------------|---------------------------------|
| Monorepo          | pnpm + Turborepo                |
| Backend           | NestJS + Prisma                 |
| Frontend          | Next.js 15 (App Router)         |
| Base de datos     | PostgreSQL                      |
| Cola de trabajos  | Redis + BullMQ                  |
| Email (desarrollo)| Mailpit                         |
| Auth              | Better Auth / JWT propio        |
| UI                | Tailwind CSS + shadcn/ui        |
| Infra local       | Docker Compose                  |

---

## Documentación

| Documento | Descripción |
|---------|-------------|
| [SETUP.md](docs/SETUP.md) | Cómo levantar el proyecto en local |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema |
| [ROADMAP.md](docs/ROADMAP.md) | Plan de trabajo por fases + distribución de tareas |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Modelo de datos |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Cómo trabajamos juntos (ramas, PRs, convenciones) |

---

## Equipo

- **Esteban** → Enfocado principalmente en Backend + Infraestructura + Base de datos
- **Joseph** → Enfocado principalmente en Frontend + UI/UX + Experiencia de usuario

Ambos pueden tocar cualquier parte, pero la distribución está pensada para que podáis avanzar **en paralelo** sin bloquearos.

---

## Estado actual

**Fase 0 – Fundación del repositorio**

---

## Licencia

MIT (o la que decidáis)
