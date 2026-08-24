# AGENTS.md — Manual de operaciones de MailForge

Normativa para **agentes IA y personas** que trabajen en este repositorio.
Las reglas son numeradas y vinculantes. El resumen humano clásico vive en
[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md); el ledger de tareas, en [ISSUES.md](ISSUES.md).

---

## Inicio rápido

```bash
corepack enable 2>/dev/null || npm i -g pnpm@9.12.0
pnpm install
pnpm build && pnpm test        # unit + integración, sin Docker
pnpm dev                       # API :3001 · Web :3000
pnpm e2e                       # Playwright contra build producción (:3100)
```

---

## Mapa del proyecto

| Ruta              | Contenido                                           | Estado       |
| ----------------- | --------------------------------------------------- | ------------ |
| apps/api          | NestJS 11 · health check · sin DB aún               | Operativo    |
| apps/web          | Next.js 15 + Tailwind v4 · landing                  | Operativo    |
| packages/shared   | utils multi-paquete + contratos de rutas            | Operativo    |
| packages/email    | renderizador de plantillas {{var}}                  | Operativo    |
| packages/database | Prisma: modelos User/Org/Member + migración inicial | Fase 1       |
| ISSUES.md         | ledger de tareas TASK-XXXX                          | Fuente única |

---

## Reglas

### RULE-001 — Ledger de tareas obligatorio

Todo trabajo no trivial requiere un id `TASK-XXXX` en ISSUES.md **antes** de empezar:
se da de alta si no existe, se marca `En curso` al comenzar y solo pasa a `Hecha`
cuando las puertas de calidad (RULE-004) pasan. Trivial = typos o cambios de una línea.

### RULE-002 — Ramas y commits

Prohibido commitear a `main`. Ramas `feature|fix|chore|docs/task-XXXX-slug-corto`.
Conventional Commits en español citando la TASK: `feat(api): ... (TASK-0018)`.
Nunca reescribas historia compartida ni hagas force-push a ramas del equipo.

### RULE-003 — Pull Requests

Todo cambio llega a `main` vía PR: review obligatoria aunque seamos dos, squash merge,
plantilla completa (qué/cómo probarlo/Prisma). Vincula `Closes #n` cuando haya issue
de GitHub paralelo al TASK.

### RULE-004 — Puertas de calidad

Antes de pedir review y antes de merge, en verde y en este orden:

    pnpm format:check && pnpm lint && pnpm build && pnpm test && pnpm e2e

Prohibido `--no-verify`, saltarse hooks o desactivar tests para que pase.

### RULE-005 — Invariante multi-tenant

Toda consulta sobre datos de negocio filtra por `organizationId`. Ningún endpoint de
negocio sin guard que inyecte la organización actual. Es el invariante más importante
del producto; una fuga entre tenants es el bug más grave posible aquí.

### RULE-006 — Secretos y entorno

`.env` jamás al repo. Toda variable nueva se añade a `.env.example` y a la tabla de
variables de docs/ARCHITECTURE.md en el mismo PR. Si un secreto se filtra, rota primero,
documenta después.

### RULE-007 — Disciplina Prisma

El schema cambia solo con migración creada en el mismo PR (`db:migrate`), aviso al
equipo (afecta a los dos) y nunca editando migraciones ya aplicadas. Bump mayor de
Prisma = TASK propio.

### RULE-008 — Tests esperados

Lógica nueva → unit test. Fix de bug → test de regresión que falle antes del fix.
Flujo UI crítico → e2e Playwright. Sin excepciones "luego lo añado".

### RULE-009 — Documentación en el mismo PR

Si cambias comportamiento, comandos, endpoints o variables: actualizas ARCHITECTURE/
SETUP/DATA_MODEL en el mismo PR. La documentación "para después" no ocurre.

### RULE-010 — Política de dependencias

Mínimo indispensable; justifica cada dependencia nueva en el PR y prefiere lo ya
presente (revisa packages/shared antes de añadir nada). Bump de packageManager o de
mayores (Next/Nest/Prisma/Tailwind) es TASK propio con gates completos.

### RULE-011 — Convenciones de idioma

Documentación, comentarios de commit y copy de UI en español. Identificadores,
comentarios de código y nombres de rama en inglés. Sin mezclas dentro del mismo artefacto.

### RULE-012 — Estilo: lo deciden las herramientas

Prettier y ESLint deciden el estilo; cero debate de formato en review. Los hooks
arreglan lo formateable automáticamente; lo que el linter no arregla, no se mergea.

### RULE-013 — Protocolo del ledger

Estados y transiciones válidos: Pendiente → En curso → Hecha, o Bloqueada / Cancelada
(con motivo). Ids inmutables. Cerrar = fecha + PR. Cancelar ≠ borrar.

### RULE-014 — Meta-regla sobre reglas

Reglas nuevas: número siguiente correlativo, nunca renumerar ni eliminar en silencio.
Modificar una regla exige PR propio referenciado desde ISSUES.md.

---

## Definición de hecho (Definition of Done)

- [ ] Gates RULE-004 en verde en local y en CI
- [ ] Tests incluidos según RULE-008
- [ ] Docs actualizadas según RULE-009
- [ ] Entradas del ledger actualizadas (RULE-001/RULE-013)
- [ ] PR abierta hacia main, revisada y squash-mergeada
