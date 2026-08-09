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
- status (`subscribed` | `unsubscribed` | `bounced` | `complained`)
- consentAt
- consentSource
- customFields (Json)
- createdAt
- updatedAt

### AudienceSubscriber (tabla de unión)
- audienceId
- subscriberId
- subscribedAt

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

## Notas de diseño

1. **Siempre** filtrar por `organizationId` en el backend.
2. Los emails se guardan en minúsculas y se normalizan.
3. El campo `customFields` (Json) nos da flexibilidad sin tener que crear columnas nuevas constantemente.
4. Los estados de `Subscriber` y `EmailLog` deben estar bien definidos y documentados en el código (enums de Prisma o TypeScript).
