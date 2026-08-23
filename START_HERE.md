# Empieza aquí – MailForge

Hola Esteban y Joseph 👋

Este repositorio ya no es solo documentación: **la Fase 0 está construida y operativa**.

## Qué tenéis ahora mismo

- API (NestJS) y Web (Next.js) funcionando: `pnpm dev`
- Tests unitarios, de integración y E2E con Playwright: `pnpm test && pnpm e2e`
- ESLint + Prettier + Husky + CI en cada PR
- Ledger de tareas en [ISSUES.md](ISSUES.md) con ids TASK-XXXX
- Reglas del proyecto en [AGENTS.md](AGENTS.md): RULE-001 a RULE-014

## Cómo se trabaja ahora

1. Elige (o alta) una tarea en [ISSUES.md](ISSUES.md) y márcala `En curso`
2. Crea rama `feature/task-XXXX-descripcion` desde `main` actualizado
3. Trabaja con sus tests; las puertas de calidad pasan antes de PR
   (`pnpm format:check && pnpm lint && pnpm build && pnpm test && pnpm e2e`)
4. Pull Request → review del otro → squash merge
5. Marca la TASK como `Hecha` con fecha y PR

La regla más importante sigue siendo la misma: nada se commitea directo a `main`.

¡A construir!
