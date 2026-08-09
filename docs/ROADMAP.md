# Roadmap de MailForge

Plan de trabajo dividido para que **Esteban** y **Joseph** puedan avanzar en paralelo sin bloquearse.

---

## Principios de distribución de trabajo

1. **Contratos primero**: Antes de implementar una feature grande, acordamos la forma de la API (endpoints + tipos) en un Issue o en `packages/shared`.
2. **Mocks cuando haga falta**: Joseph puede avanzar el frontend usando mocks o datos falsos mientras Esteban termina el backend.
3. **PRs pequeños y frecuentes**: Mejor 5 PRs pequeños que 1 PR gigante.
4. **Comunicación diaria**: Comentad en el Issue o en el PR lo que estáis haciendo.
5. **Nadie espera al otro**: Si una parte no está lista, se usa un mock o se trabaja en otra tarea de la misma fase.

---

## Fase 0 – Fundación del repositorio (3-5 días)

**Objetivo:** Que los dos podáis clonar el repo, levantar todo con Docker y empezar a codear sin fricción.

### Tareas de Esteban (Backend / Infra)
- [ ] Inicializar monorepo con `pnpm` + Turborepo
- [ ] Crear `docker-compose.yml` con:
  - PostgreSQL
  - Redis
  - Mailpit
- [ ] Configurar Prisma en `packages/database`
- [ ] Crear el proyecto NestJS base en `apps/api`
- [ ] Hacer que la API arranque y se conecte a la base de datos
- [ ] Crear archivo `.env.example`

### Tareas de Joseph (Frontend / Tooling)
- [ ] Configurar ESLint + Prettier + Husky + lint-staged
- [ ] Crear el proyecto Next.js 15 en `apps/web`
- [ ] Configurar Tailwind CSS + shadcn/ui (estructura base)
- [ ] Crear layout inicial y página de “Hello MailForge”
- [ ] Escribir/refinar `README.md` y `docs/SETUP.md`
- [ ] Configurar los templates de GitHub (Issue + PR)

**Criterio de terminado de Fase 0:**  
Cualquiera de los dos puede hacer `pnpm install && pnpm dev` y ver la API + el frontend funcionando con Docker levantado.

---

## Fase 1 – Multi-tenant + Autenticación (1.5 – 2 semanas)

**Objetivo:** Poder registrarse, crear organizaciones (clientes) y cambiar de organización.

### Tareas de Esteban (Backend)
- [ ] Modelo de datos: `User`, `Organization`, `OrganizationMember`
- [ ] Módulo de autenticación (registro + login + JWT o Better Auth)
- [ ] CRUD de Organizations
- [ ] Sistema de roles (owner, admin, member)
- [ ] Middleware / Guard que inyecte el `organizationId` actual
- [ ] Endpoints protegidos de prueba

### Tareas de Joseph (Frontend)
- [ ] Páginas de Login y Registro
- [ ] Página de “Crear organización”
- [ ] Selector de organización (organization switcher)
- [ ] Layout autenticado (sidebar básica)
- [ ] Protección de rutas (middleware de Next.js)
- [ ] Integración con la API de auth (aunque sea con mocks al principio)

**Paralelismo:** Joseph puede empezar las pantallas con datos mockeados. Cuando Esteban tenga los endpoints, se conectan.

---

## Fase 2 – Gestión de Audiencias y Suscriptores (1.5 – 2 semanas)

**Objetivo:** Cada organización puede tener listas y suscriptores.

### Tareas de Esteban
- [ ] Modelos: `Audience`, `Subscriber`, `SubscriberTag`
- [ ] Endpoints CRUD de Audiences
- [ ] Endpoints de Suscriptores (crear, listar, buscar, cambiar estado)
- [ ] Importación de CSV (endpoint + procesamiento)
- [ ] Validación de emails y control de estado (`subscribed`, `unsubscribed`, `bounced`)

### Tareas de Joseph
- [ ] Página de listado de Audiencias
- [ ] Página de detalle de una Audiencia (tabla de suscriptores)
- [ ] Modal/formulario de creación de suscriptor
- [ ] Componente de importación de CSV
- [ ] Filtros y búsqueda de suscriptores
- [ ] Indicadores de estado visuales

---

## Fase 3 – Campañas one-shot + Motor de envío (2 – 2.5 semanas)

**Objetivo:** Crear una campaña, elegir audiencia y enviarla (aunque sea a Mailpit).

### Tareas de Esteban
- [ ] Modelos: `Template`, `Campaign`, `EmailLog`
- [ ] Sistema de plantillas simples (HTML + variables `{{nombre}}`)
- [ ] Creación y programación de campañas
- [ ] Cola de envío con BullMQ
- [ ] Worker que procesa los envíos
- [ ] Rate limiting básico
- [ ] Integración con Mailpit (Nodemailer)

### Tareas de Joseph
- [ ] Editor de plantillas simple (textarea + preview)
- [ ] Wizard de creación de campaña
- [ ] Selector de audiencia
- [ ] Página de detalle de campaña (estado del envío)
- [ ] Lista de campañas
- [ ] Visualización de logs de envío

---

## Fase 4 – Tracking y Unsubscribe (1 semana)

### Tareas de Esteban
- [ ] Pixel de apertura
- [ ] Tracking de clics (redirección con registro)
- [ ] Endpoint y lógica de unsubscribe
- [ ] Actualización automática de estado del suscriptor
- [ ] Webhooks internos de eventos

### Tareas de Joseph
- [ ] Página pública de unsubscribe (bonita y clara)
- [ ] Dashboard básico de métricas de una campaña (abiertos, clics, bajas)
- [ ] Mostrar estadísticas en el detalle de campaña

---

## Fase 5 – Automatizaciones B2C simples (2 – 3 semanas)

**Objetivo:** Tener al menos 2-3 flujos automáticos.

### Flujos prioritarios
1. Email de bienvenida (al suscribirse)
2. Re-engagement (inactividad)
3. Carrito abandonado (simulado con eventos)

### Tareas de Esteban
- [ ] Modelo de `Automation` / `Journey`
- [ ] Motor simple de journeys (estados + delays)
- [ ] Triggers (evento de suscripción, evento personalizado…)
- [ ] Ejecución de pasos de la automatización

### Tareas de Joseph
- [ ] Interfaz para crear/editar automatizaciones
- [ ] Visualización del flujo (aunque sea lista de pasos al principio)
- [ ] Página de métricas de automatizaciones
- [ ] Simulador de eventos (para probar)

---

## Fase 6 – Pulido y preparación self-hosted (ongoing)

- Mejoras de UI/UX
- Dominios de envío por organización
- Mejor editor de plantillas
- Documentación de despliegue en VPS
- Preparar para usar Postal o docker-mailserver en el futuro

---

## Cómo usar este Roadmap

1. Cread un **Milestone** en GitHub por cada Fase.
2. Cread **Issues** por cada tarea grande.
3. Asignad el Issue a Esteban o a Joseph.
4. Trabajad en ramas `feature/...`
5. Cuando terminéis una tarea, cerrad el Issue y actualizad este archivo si es necesario.

**Regla de oro:** Si estás bloqueado esperando al otro, avisa y trabaja en otra tarea de la misma fase o en mejoras de la fase anterior.
