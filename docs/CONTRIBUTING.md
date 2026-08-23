# Cómo trabajamos en MailForge

Este documento define las reglas para que Esteban y Joseph puedan colaborar de forma ordenada y sin pisarse.

---

## Roles orientativos

| Persona     | Enfoque principal                                           | Puede tocar también        |
| ----------- | ----------------------------------------------------------- | -------------------------- |
| **Esteban** | Backend (NestJS), Prisma, colas, Docker, infraestructura    | Frontend cuando haga falta |
| **Joseph**  | Frontend (Next.js), UI, experiencia de usuario, componentes | Backend cuando haga falta  |

La idea es **minimizar los bloqueos**. Si alguien necesita algo del otro, se crea un contrato (tipos + endpoints) y se sigue adelante con mocks.

---

## Flujo de Git

### 1. Siempre trabajamos en ramas

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-de-la-feature
```

Ejemplos de nombres de rama:

- `feature/auth-login`
- `feature/audiences-crud`
- `feature/campaign-sender`
- `fix/unsubscribe-token`
- `chore/update-dependencies`

### 2. Commits

Usamos **Conventional Commits**:

- `feat: añadir endpoint de creación de audiencia`
- `fix: corregir filtrado por organizationId`
- `docs: actualizar roadmap de fase 2`
- `chore: actualizar dependencias de prisma`
- `refactor: extraer lógica de renderizado de plantillas`

### 3. Pull Requests

- Todo cambio pasa por Pull Request (aunque seamos solo dos).
- El título del PR debe ser claro.
- En la descripción explicad:
  - Qué se ha hecho
  - Cómo probarlo
  - Si hay cambios en el schema de Prisma
- El otro tiene que hacer review (aunque sea rápido).
- Una vez aprobado → Squash and merge a `main`.

### 4. Issues

- Cada tarea medianamente grande debe tener un Issue.
- Asignad el Issue a la persona responsable.
- Usad labels: `backend`, `frontend`, `infra`, `docs`, `bug`, `enhancement`.
- Vinculad el PR al Issue (`Closes #123`).

---

## Cómo evitar bloqueos entre los dos

### Técnica 1: Contratos primero

Antes de implementar una feature que necesita backend + frontend:

1. Se define en un Issue o en `packages/shared` los tipos y los endpoints.
2. Joseph puede mockear la respuesta.
3. Esteban implementa el endpoint real.
4. Se conectan.

### Técnica 2: Mocks

Joseph puede usar:

- MSW (Mock Service Worker)
- Datos hardcodeados temporales
- Una rama de “mock” que luego se elimina

### Técnica 3: Trabajo en vertical slices pequeños

En lugar de “terminar todo el backend de campañas”, mejor:

- “Crear campaña (solo guardar en DB)” → PR
- “Listar campañas” → PR
- “Enviar campaña a Mailpit” → PR

Así el frontend puede ir integrando poco a poco.

---

## Reglas de oro

1. **Nunca subáis a `main` directamente.**
2. **No dejéis el proyecto roto en `main`.** Si algo no compila, no se mergea.
3. **Avisad de cambios en el schema de Prisma** (hay que correr migraciones).
4. **Documentad decisiones importantes** en `/docs` o en el propio PR.
5. **Si estáis bloqueados más de 1 día**, hablad y reasignad tareas.

---

## Checklist antes de abrir un PR

- [ ] El código compila (`pnpm build` o al menos `pnpm lint`)
- [ ] Probado localmente
- [ ] Si hay cambios de base de datos → migración creada
- [ ] No se han subido archivos `.env` ni secretos
- [ ] La descripción del PR explica cómo probarlo

---

## Comunicación

- Usad los comentarios de GitHub (Issues y PRs) como canal principal de decisiones técnicas.
- Para dudas rápidas podéis usar el chat que prefiráis, pero las decisiones importantes deben quedar reflejadas en el repo.
