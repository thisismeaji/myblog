# AGENTS.md

## Project Guidelines

This project uses Next.js with shadcn/ui components.

The AI agent must strictly follow the existing design system and avoid creating custom UI patterns unless explicitly required.

After completing user requests that would normally require a preview, only run `npm run build` for verification. Do not start a dev server, production server, browser preview, or runtime preview unless the user explicitly asks for it.

---

## UI & Component Rules

- Always use default shadcn/ui components.
- Prefer using existing shadcn/ui components and blocks before creating new components.
- Do not modify the default shadcn/ui styling, spacing, typography, radius, or behavior.
- Do not create custom variants if an equivalent shadcn/ui component already exists.
- Keep all components visually consistent with the default shadcn/ui design system.
- Avoid unnecessary CSS overrides.
- Avoid adding custom design systems or new UI libraries.

Example:
✅ Use:
- Button from shadcn/ui
- Card from shadcn/ui
- Input from shadcn/ui
- Dialog from shadcn/ui
- Sheet from shadcn/ui
- Form components from shadcn/ui

❌ Avoid:
- Custom buttons
- Custom inputs
- Manual styled cards
- Rebuilding existing shadcn components

---

## Layout & Styling Rules

- Do not change existing spacing unless explicitly requested.
- Preserve default shadcn/ui spacing behavior.
- Do not adjust padding, margin, gap, or sizing arbitrarily.
- Do not add unnecessary animations or visual effects.
- Keep layouts clean and minimal.

---

## Typography Rules

- Never modify character spacing.
- Never add or change `letter-spacing`.
- Never use custom tracking classes (`tracking-*`) unless explicitly required.
- Preserve default font rendering.
- Do not change text transform behavior.

Avoid:
```tsx
className="tracking-wide uppercase"
