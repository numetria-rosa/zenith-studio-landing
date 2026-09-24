# Obsidian design system

Dark glass UI for AI and automation products: a near-black void, frosted glass layers, one cold glow, and thin wires that show how things connect.

**For Claude Code:** follow this file for every UI change in this repo. Tokens live in `styles/obsidian.css` (CSS variables + `.ob-*` recipes) and `styles/tailwind-theme.css` (Tailwind v4 `@theme`). Use the tokens. Never hardcode new hex values.

## House rules
1. Background is Void `#05060A`, never pure `#000` or `#fff` surfaces.
2. The primary action is a solid Frost pill (`.ob-btn--primary` / `bg-frost text-void rounded-full`). Every other surface is glass.
3. **One glow color per screen.** Cyan by default. Violet for automation and AI surfaces. Don't mix cyan and violet glows on the same screen.
4. The Prism rim (iridescent 1.5px border) appears at most once per screen, and only on the hero element.
5. Depth comes from glass (translucent fill, light rim, top highlight), not from heavy drop shadows.
6. Labels and captions: Geist Mono, 12px, uppercase, +0.14em tracking, Mist. Everything people read: Geist.
7. Headings use weight 500 with tight negative tracking (-0.02 to -0.05em). Never bold 700 for headlines, except the uppercase automation variant (600).
8. Wires in diagrams: 1.2 to 2px, Frost at 35 to 60% opacity, rounded caps. Ports are 10px white dots with a soft glow.
9. Glow means state: focus, live/running, selected, featured. Never use glow for decoration alone. Background nebulae (large blurred radial gradients) are the exception.
10. Contrast: body text is at least Mist on Void. Dim `#7D8392` is only for captions 12px and up.

## Color
| Token | Hex | Use |
|---|---|---|
| void | #05060A | page |
| ink | #0C0E14 | panels |
| ink-2 | #0A0B10 | section cards |
| graphite | #161922 | raised surface |
| steel | #2A2E3A | solid lines, disabled |
| mist | #A9AEBA | secondary text |
| dim | #7D8392 | captions only |
| frost | #F5F6F8 | primary text, primary buttons |
| cyan | #5CC8FF | default glow |
| cobalt | #3B6BFF | nebula, aurora middle |
| violet | #8B5CF6 | automation glow |
| orchid | #E052F0 | ports, prism |
| mint | #3DDC97 | success |
| ember | #FF5C7A | danger |

Gradients: **Aurora** (cyan→cobalt→violet, 135°) for gradient CTAs and active toggles. **Prism** (cyan→violet→orchid→amber) for the single hero rim. **Nebula** (cobalt radial fading to void) for page backdrops.

## Type scale (Geist)
Display 96 / 0.95 / -5% · H1 60 / 1.02 / -4% · H2 36 / 1.1 / -3% · H3 22 / 1.25 / -2% · Body 16 / 1.6 · Small 14 · Caption mono 12 uppercase +14%.
Signature move: a giant faded wordmark behind the content (`.ob-wordmark`, 250–280px).

## Radius and spacing
Radius: chip 8 · input 14 · card 22 · panel 32 · pill 999 for all buttons and nav.
Spacing: 4pt base, 4 8 12 16 24 32 48 64 96. Section gaps 88. Card padding 32–36.

## Elevation
| Level | Recipe |
|---|---|
| Glass 1 (cards) | fill white 4%, rim white 12%, inset top highlight 10%, blur 16 |
| Glass 2 (modals, nav, toasts) | fill 8%, rim 20%, highlight 18%, float shadow, blur 28 |
| Glow ring (featured, focus) | rim `rgba(166,225,255,.85)` 1.5px, halo 40px cyan 35%, inner glow |
| Prism rim (hero only) | 1.5px Prism gradient wrapper around a 92% ink inner |

## Components
- **Nav:** logo on the left, a centered glass pill holding links plus a Frost "primary" pill at its end. The active link gets a 2px cyan glowing underline dash.
- **Buttons:** primary (Frost), glass, outline, glow (cyan rim + halo), aurora (gradient, for the one hero CTA), 48px round icon button. 44px minimum hit area.
- **Toggle:** 56×32 track. Off is glass 8%. On is the Aurora gradient + cyan glow with a white knob.
- **Segmented control:** glass pill. The active segment is a Frost fill with Void text.
- **Checklist:** 24–26px round glass checks. On the featured card, checks are cyan-tinted.
- **Inputs:** 48px, radius 14, glass fill. Focus = cyan rim + 4px cyan ring + soft halo.
- **Badges:** radius 8, tinted fill 10%, rim 35%, glowing status dot (Active mint, Running cyan, Failed ember, Paused neutral).
- **Pricing card:** radius 32, glass on ink 55%, blur 24. The featured plan uses the glow ring and a "Popular" mono pill.
- **Stat tile:** glass 1, label in Mist 13px, value 30–40px weight 500, sparkline 2px with a 6px 25%-opacity glow stroke under it.
- **Workflow node:** 220×100, 1px gradient rim (white→violet→transparent), inner `rgba(18,15,34,.92)`, gradient icon tile, name, Mist subtitle, Active badge. White ports on the edges.
- **Network node:** avatar = 110px sculpted dark glass sphere (radial highlight at top-left). Hub = chamfered square tile with a gradient rim and the logo.
- **Isometric stack** (for architecture visuals): planes use `transform: rotateX(58deg) rotateZ(-45deg)` stacked 110px apart. Label them with mono captions and 1px vertical tick lines.

## Don'ts
No emoji, no Inter/Roboto/Arial, no pure black, no colorful multi-gradient cards, no more than one glow hue per screen, no left-border accent cards, no drop shadows as the main depth cue.
