# AGENTS.md: rules for the coding agent

## Workflow
1. At the start of every session, read AGENTS.md, PRODUCT.md, DESIGN.md and NOTES.md.
2. Work on ONE phase only. Stop when it's done and tell me what to check.
3. At the end of each phase, update NOTES.md: what was built, what's next, known issues.
4. Keep changes small. Don't rewrite files that already work.

## Hard don'ts
- Do NOT use browser or screenshot tools. I send screenshots myself.
- Do NOT use helper agents/subagents.
- Do NOT install extra libraries unless the phase says so (allowed: react, motion).
- Do NOT use Minecraft/Mojang art, names or lookalike designs.
- Do NOT touch .gitignore except with lines that have no leading spaces.

## Stack
Vite + React, plain JavaScript (no TypeScript), plain CSS with variables. Motion for page transitions. Sprites via CSS steps() or text-grid sprites.

## Quality
- Works at 360px wide (phone) and desktop.
- Keyboard accessible, visible focus, prefers-reduced-motion respected.
- Pixel font for headings only.
- Run `npm run build` at the end of each phase and fix errors.