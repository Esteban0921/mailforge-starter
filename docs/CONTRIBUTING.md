# Cómo trabajamos en MailForge

> **Nota normativa:** las reglas vinculantes viven en [AGENTS.md](../AGENTS.md)
> (RULE-001 a RULE-014) y el estado del trabajo, en [ISSUES.md](../ISSUES.md).
> Este documento es su resumen para humanos; si hay divergencia, mandan AGENTS.md e ISSUES.md.

---

## Roles orientativos

| Persona     | Enfoque principal                                           | Puede tocar también        |
| ----------- | ----------------------------------------------------------- | -------------------------- |
| **Esteban** | Backend (NestJS), Prisma, colas, Docker, infraestructura    | Frontend cuando haga falta |
| **Joseph**  | Frontend (Next.js), UI, experiencia de usuario, componentes | Backend cuando haga falta  |

La idea es **minimizar bloqueos**: contrato primero (tipos + endpoints en
packages/shared o en la TASK), mocks mientras tanto, vertical slices pequeños.

---

## Flujo de trabajo (resumen)

1. **TASK antes de codear** — alta o elige tarea en ISSUES.md, márcala `En curso` (RULE-001).
2. **Rama por tarea** — `feature/task-XXXX-slug` desde `main` actualizado (RULE-002).
3. **Conventional Commits** citando la TASK — `feat(api): ... (TASK-0018)`.
4. **Puertas de calidad en verde** antes de abrir PR (RULE-004):
   ```bash
   pnpm format:check && pnpm lint && pnpm build && pnpm test && pnpm e2e
   ```
5. **Pull Request** — review obligatoria del otro, squash merge a main (RULE-003).
6. **Cerrar TASK** — fecha + referencia al PR en ISSUES.md (RULE-013).

---

## Cómo evitar bloqueos entre los dos

- **Contratos primero**: define tipos/endpoints antes de implementar.
- **Mocks**: MSW, datos hardcodeados o rama temporal para que el frontend avance.
- **Vertical slices**: mejor "crear campaña (solo DB)" → PR, que todo el módulo entero.
- Si estás bloqueado más de 1 día: habladlo y reasignad la TASK.

---

## Reglas de oro

1. Nunca se commitea directo a `main`.
2. No se deja `main` roto: si los gates no pasan, no hay merge.
3. Cambios de schema Prisma → migración en el mismo PR y aviso (RULE-007).
4. Decisiones importantes documentadas en /docs o en el propio PR (RULE-009).
5. Bloqueo > 1 día → reasignación de la TASK.

---

## Checklist antes de abrir un PR

- [ ] Gates en verde (format, lint, build, test, e2e)
- [ ] Tests nuevos según RULE-008 (lógica → unit; bug → regresión; UI crítica → e2e)
- [ ] Si hay cambios de Prisma → migración creada
- [ ] Sin `.env` ni secretos
- [ ] Docs actualizadas si procede (RULE-009)
- [ ] Ledger actualizado (estado, refs)
