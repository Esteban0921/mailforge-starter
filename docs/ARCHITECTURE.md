# Arquitectura de MailForge

## Visión general

MailForge es una aplicación **multi-tenant** donde cada **Organization** (cliente) tiene sus datos completamente aislados.

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js (apps/web)                      │
│  - Dashboard multi-tenant                                   │
│  - Editor de campañas y plantillas                          │
│  - Gestión de audiencias                                    │
│  - Visualización de automatizaciones y métricas             │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP / JSON
┌─────────────────────────────▼───────────────────────────────┐
│                     NestJS (apps/api)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Auth Module │  │ Organizations│  │ Campaigns Module   │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Subscribers │  │ Templates    │  │ Automations Module │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
     ┌────────▼────────┐     ┌────────▼────────┐
     │   PostgreSQL    │     │  Redis + BullMQ │
     │   (Prisma)      │     │  (colas)        │
     └─────────────────┘     └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │    Mailpit      │  ← Desarrollo
                             │ (o Postal luego)│  ← Producción self-hosted
                             └─────────────────┘
```

---

## Estrategia Multi-tenant

Usamos **Shared Database + tenant_id** (la más simple y escalable para empezar).

- Casi todas las tablas tienen `organizationId`
- Todos los queries del backend **obligatoriamente** filtran por `organizationId`
- En NestJS usamos un `OrganizationGuard` + decorador `@CurrentOrganization()`

Ventajas:

- Fácil de implementar
- Buen rendimiento
- Fácil de hacer backups

Más adelante se puede evolucionar a schema-per-tenant si hiciera falta.

---

## Flujo de envío de una campaña

1. Usuario crea una **Campaign** y elige una **Audience**
2. El backend crea un job en la cola de BullMQ por cada suscriptor (o por lotes)
3. Los workers van procesando los jobs
4. Cada worker:
   - Renderiza la plantilla con los datos del suscriptor
   - Envía el email a través de Nodemailer → Mailpit (dev)
   - Guarda un registro en `EmailLog`
5. Los eventos de tracking (open, click, unsubscribe) actualizan el `EmailLog` y el estado del `Subscriber`

---

## Módulos principales del Backend (NestJS)

```
apps/api/src/
├── auth/
├── organizations/
├── users/
├── audiences/
├── subscribers/
├── templates/
├── campaigns/
├── automations/
├── tracking/
├── queue/          # Configuración de BullMQ
└── common/         # Guards, decorators, filters...
```

---

## Packages compartidos

| Package             | Responsabilidad                              |
| ------------------- | -------------------------------------------- |
| `packages/database` | Schema de Prisma + cliente generado          |
| `packages/shared`   | Tipos TypeScript, constantes, utils          |
| `packages/email`    | Renderizado de plantillas + cliente de envío |
| `packages/ui`       | Componentes React compartidos (opcional)     |

---

## Decisiones importantes de diseño

### 1. ¿Por qué NestJS?

- Estructura modular muy clara
- Excelente para aplicaciones multi-tenant
- Decoradores y guards muy potentes
- Buena integración con Prisma y BullMQ

### 2. ¿Por qué BullMQ y no solo enviar en el request?

- Los envíos masivos no pueden hacerse de forma síncrona
- Permite reintentos, rate limiting y control de concurrencia
- Escala mucho mejor

### 3. ¿Por qué Mailpit en desarrollo?

- Cero configuración
- Interfaz web para ver todos los emails enviados
- No contamina la reputación de ningún dominio real

### 4. Autenticación

Empezamos con un sistema propio simple (JWT + refresh tokens) o Better Auth.  
Más adelante se puede añadir login social si se quiere.

---

## Seguridad básica que debemos implementar desde el principio

- Todas las rutas de negocio requieren autenticación
- Todas las consultas filtran por `organizationId`
- Validación de entrada con `class-validator` o Zod
- Rate limiting en endpoints públicos (unsubscribe, tracking)
- Los tokens de unsubscribe deben ser firmados y de un solo uso (o con expiración)
