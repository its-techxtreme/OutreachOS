# OutreachOS — Doodle Design System

## Mood
Sketchbook / hand-drawn ops console. Imperfect ink strokes, paper grain, highlighter accents, sticky-note CTAs. Playful but readable for CRM tables.

## Anti-patterns (do not use)
- Purple-on-white / indigo SaaS gradients
- Cream + terracotta + serif broadsheet
- Flat zinc-950 teal dark dashboard
- Inter / Roboto / Geist / Arial as primary fonts
- Generic glassmorphism / glow stacks

## Color tokens
| Token | Hex | Use |
|-------|-----|-----|
| `--paper` | `#FFFDF7` | Page background |
| `--paper-deep` | `#F3EDE0` | Panels / table zebra |
| `--ink` | `#1C1917` | Primary text |
| `--ink-muted` | `#57534E` | Secondary text |
| `--marker` | `#0EA5E9` | Primary accent (sketch blue) |
| `--highlighter` | `#FACC15` | Emphasis / badges |
| `--coral` | `#F97316` | CTA / destructive warm |
| `--line` | `#292524` | Doodle borders |
| `--success` | `#16A34A` | Positive states |
| `--danger` | `#DC2626` | Errors |

## Typography
- **Display:** `Caveat` (handwritten headlines, brand)
- **Body:** `Nunito` (friendly rounded sans — readable tables)
- **Mono:** `IBM Plex Mono` (IDs, maps URLs)

## Surfaces
- Borders: 2px solid ink, slight rotate via utility `.doodle-border`
- Interactive containers only: sticky-note shadow (`4px 4px 0 #1C1917`)
- Paper texture overlay at low opacity
- No multi-layer soft shadows

## Motion
- Soft float on doodle accents (8–12s loop)
- CTA press: translate 1px + shadow shrink
- Respect `prefers-reduced-motion`

## Landing first viewport
Brand (OutreachOS) hero-level → one headline → one short line → CTA group (Sign up / Sign in / Demo) → full-bleed doodle field. No stats/cards in hero.
