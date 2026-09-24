# AI Team web app (Halo design system)

Next.js 15 (App Router) + React 19 + TypeScript. Styling is **CSS Modules + CSS variables**, no Tailwind or UI library.
Fonts are self-hosted with `@fontsource` (Sora, Manrope, JetBrains Mono), so there's no Google Fonts request.

These two screens are a pixel-exact build of the Halo design canvas at 1440x900:

| Route            | Screen               | Reference                          |
| ---------------- | -------------------- | ---------------------------------- |
| `/`              | Web · Team home      | `design-reference/WebHome.png`     |
| `/agents/claims` | Web · Claims Agent   | `design-reference/WebAgent.png`    |

Verified: 0 differing pixels against the references (`scripts/visual-diff.py`).

## Commands
- `npm install`
- `npm run dev` (http://localhost:3000)
- `npm run build && npm start`, then `python scripts/visual-diff.py` to re-check pixel accuracy

## Structure
- `app/globals.css`: **all design tokens** (colors, alpha lines/fills, `--edge` gradient, font stacks), plus `.dots` and `.sr-only`
- `app/layout.tsx`: font imports + shell (sidebar + page)
- `app/page.tsx` + `home.module.css`: Team home
- `app/agents/claims/page.tsx` + `agent.module.css`: Claims Agent
- `components/Sidebar.tsx`: client component, active item from `usePathname()`
- `components/TeamMap.tsx`: fixed 680x440 node diagram (SVG wires + absolutely positioned tiles)
- `components/Icon.tsx`: every stroke icon (24px grid, round caps/joins)
- `components/ui.tsx` / `ui.module.css`: StatusChip, Eyebrow, pill buttons, icon button, list card
- `lib/demo-data.ts`: all copy and demo data. Numbers are SAMPLE data; `[BRACKETS]` are placeholders

## Rules to keep it accurate
1. **Use tokens, never new hex values.** If a color is missing, add a token to `globals.css` first.
2. **Don't add a CSS reset or global `box-sizing: border-box`.** The design relies on browser defaults; `box-sizing` is set per element where the design sets it.
3. **Neon edge** = `background: linear-gradient(<fill>,<fill>) padding-box, var(--edge) border-box; border: 1px solid transparent;`. Use it only for AI entities (agent tiles, the active step, the brand mark).
4. **Glow only means "live".** Cyan glow = running, amber = needs a human, mint = done or primary action. Don't glow static UI.
5. Radii: 11 (small icon boxes), 12 (nav), 14 (inputs, icon buttons), 16 (tiles, steps), 18 (cards), 20 (orchestrator), 22 (big panels), 999 (pills/chips).
6. Type: Sora = display and numbers (600, or 400 for the big %), Manrope = UI/body, JetBrains Mono = eyebrows, step meta, IDs, durations.
7. Mono eyebrows: 12px, `letter-spacing: 0.12em`, `--muted`, uppercase.
8. Links inside cards set their own color and `:hover` so they don't inherit the global cyan `a:hover`.
9. Keep real semantics: `<button>`, `<a>`/`<Link>`, `<label>` + `<input>`, `aria-label` on icon-only buttons.
10. After any visual change to these two screens, run `scripts/visual-diff.py`. Intentional changes: regenerate the reference PNGs and say so.

## Layout behaviour
Designed at 1440x900. The sidebar is sticky at 240px; main is fluid (grid `1fr 360px` on home, `1fr 380px` on the agent page), so wider screens stretch the map/workflow panels. The team map and workflow column stay fixed-size and centered. No mobile breakpoint yet; the mobile screens are separate designs on the canvas.

## Interaction states added beyond the static design
- Search field: cyan focus ring on `:focus-within`
- "Needs you" card: amber border brightens on hover
- Nav items: text brightens on hover
