# Premium frontend reference bank

Curated 2026-09-12 from Uiverse.io + legora.com, for lifting the `/demo/*` pages
(and anywhere else that needs it) above flat Tailwind cards into
senior-motion/3D territory. Each entry: what it is, the mechanism, where it
fits in this codebase.

Stack implication: everything below is CSS-only (transforms, `preserve-3d`,
`clip-path`, gradients, keyframes) except the Legora piece, which needs
scroll-linked JS. For React we already have Framer Motion available as the
natural home for the scroll-driven and hover-driven versions; plain CSS is
fine for the static ones. No Three.js is actually required for any of these —
they're all faked 3D via `perspective`/`rotateX/Y`/`translateZ`, which is
lighter and easier to theme than a WebGL scene.

## 1. Buttons & CTAs
- **Realism button** — https://uiverse.io/Spacious74/helpless-tiger-55
  Radial-gradient "metal" surface + a blurred color blob layer peeking from
  behind a rounded mask (`.blob1`/`.blob2` under an inner panel). Reads as a
  soft, lit physical button. Good for a hero "Book a demo" CTA.
- **Cyberpunk text button** — https://uiverse.io/Danishrehman786/slippery-moth-15
  Animated top/bottom underline bars that grow on hover, glowing text-shadow,
  letter-spacing widen. Pairs with the cyber tooltip below for a techy AI-team
  section.

## 2. Toggles & switches
- **Skeuomorphic red switch** — https://uiverse.io/njesenberger/brave-firefox-90
  Real light/dark gradient shading + inset shadows read as an actual
  chrome-and-plastic lever, not a flat pill. Use for demo on/off states
  (e.g. "AI mode: on").
- **Luminous recessed toggle** — https://uiverse.io/NK2552003/chatty-eel-90
  Whole card lights up (`box-shadow`/`opacity` layers) when its own toggle
  flips — the toggle drives ambient light on the parent, not just itself.
  Strong pattern for a "before/after AI" comparison card.

## 3. 3D tilt / glass cards
- **Perspective glass card** — https://uiverse.io/Smit-Prajapati/smart-liger-5
  `perspective` on parent + `transform-style: preserve-3d` on card; hover
  does `rotate3d` while inner elements each get their own `translateZ` so
  content visibly lifts off the surface at different depths. This is the
  single most reusable technique here — apply to the demo pages' feature/stat
  cards.
- **Metallic credit card w/ sheen sweep** — https://uiverse.io/mihocsaszilard/rare-fox-73
  Diagonal light/dark gradient border + a `::after` sheen that
  animates across on hover (`@keyframes rotate` translating a gradient
  block). Good motif for "your business card" style summaries.
- **Tailwind glass card w/ spinning orb** — https://uiverse.io/monkey_8812/curly-moth-56
  Simplest one: `backdrop-blur` + a `bg-gradient-to-tr ... animate-spin` orb
  behind frosted glass. Cheap ambient-motion filler for any empty card corner.
- **AI chat input** — https://uiverse.io/Cobp/dangerous-dolphin-47
  Gradient-border glow (radial `::after` blur) around a dark textarea, with a
  send button that scales/rotates its icon on focus/active. **Directly
  applicable**: replace the demo pages' plain form inputs with this for the
  "type your message" / chat-simulation UI.

## 4. Stat / dashboard cards
- **Blue stats card** — https://uiverse.io/Smit-Prajapati/great-bat-98
  Notched-header shape via layered `border-radius` + `box-shadow` cutouts,
  spring `cubic-bezier` scale on hover. Matches the existing 3-stat grid in
  `law-firm-ai-team/page.tsx` — this is a straight upgrade for `LEAK_STATS`.
- **Health/analytics card** — https://uiverse.io/NK2552003/silly-moth-73
  Clean white bar-chart card with hover-scale bars and a "vs average" line +
  label. Template for a results/ROI chart on any demo page.

## 5. Focus-group hover lists
- **Blur-siblings-on-hover cards** — https://uiverse.io/kamehame-ha/chilly-snake-91
  `.cards:hover > .card:not(:hover) { filter: blur(10px); scale(0.9) }` —
  hovering one card blurs+shrinks its neighbors. Great for a 3-engine
  selector (Text-Back / Follow-Up Clerk / Billing Clerk) so picking one
  visually de-emphasizes the others.

## 6. 3D rotating carousel (pure CSS)
- **Auto-rotating image ring** — https://uiverse.io/ilkhoeri/swift-panda-38
  N cards placed on a circle via `rotateY(360/N * i) translateZ(r)`, whole
  ring spun with one `@keyframes rotating` on the parent. No JS, no library.
  Use for a rotating "trusted by" / testimonial / feature ring.

## 7. Skeuomorphic device mockups
- **Apple Watch UI** — https://uiverse.io/chase2k25/warm-chicken-23
  Full smartwatch chassis + multi-screen swipe via radio-input `:checked ~`
  selectors (no JS). Overkill to copy wholesale, but the "device frame
  showing a live mini-UI" idea is worth reusing for an AI Receptionist demo
  ("what the caller's phone shows").
- **Pip-Boy CRT terminal** — https://uiverse.io/Gidarx/moody-falcon-73
  Scanlines, screen-glitch keyframes, CRT power-on animation, radar sweep.
  The individual pieces (scanline overlay, glitch-in text, radar ping) are
  more useful standalone than the retro terminal as a whole — e.g. a glitch-in
  reveal for a "system status" panel.

## 8. Tooltips / hover reveals
- **Discord-style profile tooltip** — https://uiverse.io/imtausef/fuzzy-dragon-2
  Icon skews on hover while 5 stacked ghost-layers fan out behind it
  (`nth-child` staggered `translate`+`opacity`), revealing a profile card
  above. Nice for team/agent avatars ("meet your AI team").
- **Cyberpunk hex tooltip** — https://uiverse.io/Danishrehman786/slippery-moth-15
  `clip-path` hexagon, animated scanline, neon corner brackets. Matches the
  amber/dark aesthetic already in `law-firm-ai-team`.
- **Flip-lid tooltip** — https://uiverse.io/Yaya12085/average-earwig-11
  `rotateX(-150deg)` lid that flips open via `perspective` on hover, tooltip
  slides up underneath. Different feel than a fade — a literal opening motion.

## 9. Scroll-driven 3D stacking (the Legora reference)
https://legora.com/ — the "Large Language Models → Agentic Harness → ... →
Security & Governance" section.

Mechanism (confirmed by scrolling it): one pinned/sticky section holds a
stack of flat rounded-rect "panes." As the user scrolls, each pane's
position/rotation is driven by scroll progress (not CSS-only — this needs
`framer-motion`'s `useScroll`/`useTransform` or GSAP ScrollTrigger):
1. Panes start stacked flat, each label visible edge-on.
2. Scrolling advances a step index; the active pane's card fans out to reveal
   sub-content in a dark rounded panel to the left, while the pane itself
   tilts/separates in 3D (`rotateX`/`translateZ`) from the stack.
3. At the final step all panes compress into a single cube-like block
   (`aOS`), i.e. the stack's `translateZ` gaps collapse and a subtle
   per-pane parallax stays as texture.

This is the highest-value, highest-effort item here — it needs real
scroll-progress-driven transforms, not hover CSS. Recommended build: a
`<ScrollStack>` client component using `framer-motion`'s `useScroll({target,
offset})` mapped via `useTransform` to `rotateX`/`z`/`opacity` per pane, with
`position: sticky` on the container so the scroll distance covers N panes.
Good fit for a "how it works" section that walks through the AI engine
pipeline (intake → draft → approval → send) on the demo pages.

## Where this plugs into `/demo/*` today
Current pages (`src/app/demo/{law-firm-ai-team,brokerage-ai-team,
ai-inbox-manager,ai-lead-capture-follow-up}/page.tsx`) are flat Tailwind:
static SVG diagram, a 3-column stat strip, plain cards. Concrete swaps, in
priority order:
1. Stat strip → **#4 blue stats card** (spring hover, notch shape).
2. Chat/message simulation inputs → **#3 AI chat input** (gradient glow).
3. The 3-engine explainer → **#5 blur-siblings hover** (one engine highlighted
   at a time) or **#9 scroll stack** if going full Legora-style.
4. Any icon-only nav/avatar → **#8 Discord tooltip** or **#8 cyber tooltip**
   depending on section tone (amber/cyber vs. neutral).
5. Empty corners / background — **#3 spinning-orb glass filler**.

Not pulled in yet: nothing has been changed in the actual demo pages. This
file is the reference bank; say which page/section to start on and whether
you want the full Legora-style scroll-stack (bigger lift, needs
framer-motion scroll hooks) or just the CSS-only pieces first.
