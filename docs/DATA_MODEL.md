# Modelo de Datos – MailForge

Este documento describe las entidades principales.  
Se irá ampliando conforme avancemos en las fases.

---

## Entidades base (Fase 1)

### User

- id
- email (único)
- passwordHash
- name
- createdAt
- updatedAt

### Organization

- id
- name
- slug (único)
- createdAt
- updatedAt

### OrganizationMember

- id
- organizationId
- userId
- role (`owner` | `admin` | `member`)
- createdAt
- updatedAt

> Un usuario puede pertenecer a varias organizations.

---

## Audiencias y Suscriptores (Fase 2)

### Audience

- id
- organizationId
- name
- description (opcional)
- createdAt
- updatedAt

### Subscriber

- id
- organizationId
- email
- firstName (opcional)
- lastName (opcional)
- status (`pending` | `subscribed` | `unsubscribed` | `bounced` | `complained`)
- confirmToken (opcional; solo mientras `status = pending`)
- confirmedAt (opcional)
- consentAt
- consentSource
- customFields (Json)
- createdAt
- updatedAt

**Ciclo de vida de opt-in (decidido, TASK-0055):** doble opt-in por defecto para
altas por formulario público — se crea en `pending` con `confirmToken`, y el
email de confirmación (Fase 3, vía `packages/email`) lo mueve a `subscribed` y
limpia el token. Importaciones de listas ya consentidas (CSV, TASK-0023) pueden
crear directamente en `subscribed`, documentando el origen real en
`consentSource` (p. ej. `csv_import:lista-clientes-2026`) — la organización
declara que ya tenía consentimiento, MailForge no lo verifica por ella. Los
estados `unsubscribed`/`bounced`/`complained` son terminales: un suscriptor ahí
no vuelve a `pending`/`subscribed` automáticamente (evita reactivar a alguien
que se quejó). Ver TASK-0050/TASK-0051 para cómo `bounced`/`complained` se
alimentan de verdad desde el proveedor de envío.

### AudienceSubscriber (tabla de unión)

- audienceId
- subscriberId
- subscribedAt

### Segment

- id
- organizationId
- audienceId
- name
- rules (Json)
- createdAt
- updatedAt

**Segmentación real (decidido, TASK-0057):** `rules` es una lista de
condiciones simples combinadas con AND — deliberadamente NO un query builder
SQL libre, para no abrir superficie de inyección ni acoplar la UI a la forma
de las tablas:

```json
{
  "all": [
    { "field": "status", "op": "eq", "value": "subscribed" },
    { "field": "customFields.plan", "op": "eq", "value": "pro" },
    { "field": "consentAt", "op": "before", "value": "2026-01-01" }
  ]
}
```

`field` puede ser una columna de `Subscriber` o, con el mismo dot-path que ya
soporta `packages/email` (TASK-0044), una clave de `customFields`. `op` es un
conjunto cerrado (`eq`, `neq`, `contains`, `before`, `after`, `is_set`), no
SQL arbitrario. Un `Segment` se evalúa a demanda (no se materializa) cuando
Fase 2 construya el backend real; `OR`/agrupación anidada se añade si Fase 2
demuestra que hace falta, no antes.

### Tag / SubscriberTag (opcional en primera versión)

- Permite etiquetar suscriptores para segmentación.

---

## Campañas y Plantillas (Fase 3)

### Template

- id
- organizationId
- name
- subject
- htmlContent
- textContent (opcional)
- createdAt
- updatedAt

### Campaign

- id
- organizationId
- name
- templateId
- audienceId
- status (`draft` | `scheduled` | `sending` | `sent` | `cancelled`)
- scheduledAt (opcional)
- startedAt
- finishedAt
- createdAt
- updatedAt

### EmailLog

- id
- organizationId
- campaignId (opcional, null si es de automatización)
- subscriberId
- email
- status (`pending` | `sent` | `delivered` | `opened` | `clicked` | `bounced` | `failed`)
- providerMessageId
- errorMessage (opcional)
- sentAt
- openedAt
- clickedAt
- createdAt

---

## Tracking (Fase 4)

Los eventos de tracking se registran principalmente actualizando `EmailLog` y el `status` del `Subscriber`.

También se puede tener una tabla `TrackingEvent` si se quiere un historial más detallado:

### TrackingEvent

- id
- organizationId
- emailLogId
- type (`open` | `click` | `unsubscribe`)
- metadata (Json) – por ejemplo la URL clicada
- createdAt

---

## Automatizaciones (Fase 5)

### Automation

- id
- organizationId
- name
- triggerType (`subscriber_created` | `inactivity` | `custom_event` ...)
- status (`active` | `paused` | `draft`)
- createdAt
- updatedAt

### AutomationStep

- id
- automationId
- order
- type (`send_email` | `delay` | `condition`)
- config (Json) – ejemplo: `{ "templateId": "...", "delayHours": 24 }`
- createdAt

### AutomationEnrollment

- id
- automationId
- subscriberId
- currentStepId
- status (`active` | `completed` | `cancelled`)
- enrolledAt
- completedAt

---

## API pública (Fase 3+)

### ApiToken

- id
- organizationId
- name (para que el usuario identifique el token en su lista)
- tokenHash (nunca se guarda el token en claro, igual que `passwordHash`)
- lastUsedAt (opcional)
- revokedAt (opcional)
- createdAt

**Diseño (decidido, TASK-0060):** un token por fila, revocable individualmente
(no un secreto compartido por organización). Cabecera `Authorization: Bearer
<token>`; el backend resuelve `organizationId` desde el token, nunca desde un
parámetro de la petición — mismo invariante que RULE-005 aplicado a auth por
token en vez de por sesión. Alcance en la primera versión: igual de amplio que
un usuario `admin` de esa organización (sin scopes granulares); si hace falta
limitar por scope, es una migración de `ApiToken` añadiendo una columna, no un
rediseño. Implementación real bloqueada hasta que exista una API de negocio
que valga la pena exponer (Fase 3+, después de TASK-0018/TASK-0019).

---

## Notas de diseño

1. **Siempre** filtrar por `organizationId` en el backend.
2. Los emails se guardan en minúsculas y se normalizan.
3. El campo `customFields` (Json) nos da flexibilidad sin tener que crear columnas nuevas constantemente.
4. Los estados de `Subscriber` y `EmailLog` deben estar bien definidos y documentados en el código (enums de Prisma o TypeScript).
5. **Email case-insensitive a nivel de esquema (decidido, TASK-0034):** en vez
   de la extensión `citext` (requiere `CREATE EXTENSION`, no siempre disponible
   en Postgres gestionado) se añade un `CHECK (email = lower(email))` en la
   migración de `User` y de `Subscriber` — barrera de base de datos barata que
   no depende de que todo el código pase siempre por `normalizeEmail()`, sin
   acoplar el esquema a una extensión concreta del proveedor.
6. **Borrado (decidido, TASK-0035):** soft-delete con `deletedAt: DateTime?`
   anulable en los modelos de negocio (`Audience`, `Subscriber`, `Campaign`,
   futuros), no una tabla de archivo aparte. Todas las queries de negocio
   filtran `deletedAt: null` además de `organizationId` — mismo tipo de
   invariante que RULE-005, mismo mecanismo (guard/middleware de Prisma) el
   día que se implemente. Borrado físico solo vía job de limpieza aparte,
   nunca desde una request de usuario.
7. **Capacidades de plantillas (decidido, TASK-0058):** `packages/email` se
   queda en sustitución de variables (planas y dot-path, TASK-0044) para
   Fase 2/3. Nada de condicionales, loops o editor visual todavía — no hay
   ningún caso de uso real esperando esa capacidad hoy, y añadirla ahora sería
   diseñar para un requisito hipotético. Si Fase 3 demuestra que hace falta
   paridad con editores tipo Listmonk, es una TASK propia con su propio
   diseño, no una ampliación silenciosa de `render-template.ts`.
