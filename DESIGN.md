# Spryte — Design System

> Glassmorphism UI. Pure black background, white text, single accent color.
> No gradients. No decorative color. Accent (`#00E5A0`) touches only: active states, primary buttons, focus rings, done badges.

---

## 1. Brand

| Item | Value |
|------|-------|
| Service name | **Spryte** |
| Tagline concept | Game sprites · AI-powered |
| Mascot | Crystal fairy — hexagonal teal eyes, geometric angular wings |
| Mascot assets | `public/assets/mascot-icon.svg` (28px app logo), `public/assets/mascot-full.svg` (sidebar / landing) |

---

## 2. Color Tokens

### CSS Custom Properties

```css
:root {
  /* Background */
  --bg: #000000;

  /* Glass surfaces — layered opacity creates depth */
  --g1: rgba(255, 255, 255, 0.05);   /* subtle: hover fill */
  --g2: rgba(255, 255, 255, 0.08);   /* panel: default surface */
  --g3: rgba(255, 255, 255, 0.12);   /* raised: card, modal */

  /* Borders */
  --border:    rgba(255, 255, 255, 0.08);   /* default separator */
  --border-hi: rgba(255, 255, 255, 0.14);   /* elevated border */

  /* Text */
  --text:   #FFFFFF;                        /* primary */
  --text-2: rgba(255, 255, 255, 0.50);      /* secondary / muted */
  --text-3: rgba(255, 255, 255, 0.28);      /* tertiary / label */

  /* Accent — #00E5A0 ("Cyber") — USE SPARINGLY */
  --neon:      #00E5A0;
  --neon-dim:  rgba(0, 229, 160, 0.12);     /* active fill */
  --neon-glow: rgba(0, 229, 160, 0.35);     /* button shadow */
  --neon-ring: rgba(0, 229, 160, 0.06);     /* focus ring fill */
}
```

### Accent Usage Rules

| Context | Usage |
|---------|-------|
| Nav item (active) | `color: var(--neon)` + `background: var(--neon-dim)` + `border: var(--neon) / 0.2` |
| Primary button | `background: var(--neon)` + `color: #000` + `box-shadow: 0 0 16px var(--neon-glow)` |
| Tab (active) | same as nav item |
| Type chip (active) | `background: var(--neon-dim)` + `border: var(--neon) / 0.3` + `color: var(--neon)` |
| Input focus | `border-color: rgba(0,229,160,0.4)` + `box-shadow: 0 0 0 3px var(--neon-ring)` |
| Done badge | `background: var(--neon-dim)` + `color: var(--neon)` |
| Logo wordmark | `Spryt` white + `e` in `var(--neon)` |

**Never use `--neon` for:** body text, backgrounds, decorative elements, icons in idle state.

---

## 3. Typography

| Role | Font | Size | Weight | Other |
|------|------|------|--------|-------|
| Body | Inter | 13px | 400 | — |
| Body small | Inter | 12px | 400 | — |
| Label / meta | JetBrains Mono | 10–11px | 400–500 | `letter-spacing: 0.06–0.08em`, `text-transform: uppercase` |
| Nav item | Inter | 13px | 400–500 | — |
| Panel title | JetBrains Mono | 11px | 500 | uppercase, `letter-spacing: 0.08em` |
| Heading | Inter | 15–16px | 600 | `letter-spacing: -0.01em` |
| Code / count | JetBrains Mono | 10–12px | 400–500 | monospace everywhere numeric |

```html
<!-- Google Fonts import -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

---

## 4. Glassmorphism Spec

### The Rule

Every surface is a layer of semi-transparent glass on a pure black base.
Depth comes from stacking opacity, **not** from gradients or shadows.

```
Layer 0  background: #000000
Layer 1  rgba(255,255,255,0.03)  — sidebar, drawer
Layer 2  rgba(255,255,255,0.04)  — panels, cards (default)
Layer 3  rgba(255,255,255,0.08)  — hover, raised card
Layer 4  rgba(255,255,255,0.12)  — modal, dropdown
```

### Glass Mixin (CSS)

```css
.glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
```

### Topbar (sticky)

```css
.topbar {
  background: rgba(0, 0, 0, 0.75);  /* dark tint, not glass-white */
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Do / Don't

| Do | Don't |
|----|-------|
| Stack glass layers for depth | Add gradient backgrounds |
| Single accent touch per component | Use multiple colors |
| `border: 1px solid rgba(255,255,255,0.08)` | Use solid colored borders |
| Subtle glow on primary CTA only | Add glow to every element |

---

## 5. Components

### Sidebar

```
width: 220px
background: rgba(255,255,255,0.03)
backdrop-filter: blur(20px) saturate(180%)
border-right: 1px solid var(--border)
```

- Logo area: 20px top padding, mascot SVG 28×28px + wordmark
- Nav section label: JetBrains Mono 10px, uppercase, `--text-3`
- Nav item height: ~36px, radius: 8px, gap: 9px
- Bottom user strip: avatar 28px circle + name/plan stack

### Nav Item States

```css
/* default */
color: var(--text-2);
background: transparent;
border: 1px solid transparent;

/* hover */
background: var(--g2);
color: var(--text);
border-color: var(--border);

/* active */
background: var(--neon-dim);
color: var(--neon);
border-color: rgba(0, 229, 160, 0.2);
```

### Buttons

```css
/* shared */
.btn {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: Inter, sans-serif;
  transition: all 0.12s;
}

/* ghost */
.btn-ghost {
  background: var(--g1);
  color: var(--text-2);
  border: 1px solid var(--border);
}
.btn-ghost:hover {
  background: var(--g2);
  color: var(--text);
  border-color: var(--border-hi);
}

/* primary */
.btn-primary {
  background: var(--neon);
  color: #000;
  font-weight: 600;
  border: none;
  box-shadow: 0 0 16px var(--neon-glow);
}
.btn-primary:hover {
  box-shadow: 0 0 28px var(--neon-glow);
  filter: brightness(1.08);
}
```

### Page Tabs

```css
.page-tabs {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}
.p-tab {
  padding: 6px 16px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  border: 1px solid transparent;
}
.p-tab.active {
  background: var(--neon-dim);
  color: var(--neon);
  border-color: rgba(0, 229, 160, 0.2);
}
```

### Type Chip (pill selector)

```css
.type-chip {
  padding: 5px 14px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  font-family: JetBrains Mono, monospace;
  border: 1px solid var(--border);
  color: var(--text-2);
  background: transparent;
}
.type-chip.active {
  background: var(--neon-dim);
  border-color: rgba(0, 229, 160, 0.3);
  color: var(--neon);
  box-shadow: 0 0 8px rgba(0, 229, 160, 0.15);
}
```

### Glass Panel

```css
.gen-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(20px) saturate(180%);
}
```

### Form Fields

```css
/* Textarea / Input */
.field {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  padding: 11px 14px;
  font-size: 13px;
  font-family: Inter, sans-serif;
  outline: none;
  transition: border-color 0.12s;
}
.field::placeholder { color: var(--text-3); }
.field:focus {
  border-color: rgba(0, 229, 160, 0.4);
  box-shadow: 0 0 0 3px var(--neon-ring);
}

/* Select */
.field-select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-size: 12px;
  font-family: JetBrains Mono, monospace;
  outline: none;
}
.field-select:focus { border-color: rgba(0, 229, 160, 0.3); }
```

### Asset Card

```css
.asset-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(12px) saturate(180%);
  transition: all 0.18s ease;
}
.asset-card:hover {
  border-color: rgba(0, 229, 160, 0.25);
  background: rgba(255, 255, 255, 0.06);
}
```

### Badge / Status Chip

```
done:       background var(--neon-dim), color var(--neon), border rgba(0,229,160,0.2)
processing: background rgba(255,255,255,0.06), color var(--text-3), border var(--border)
error:      background rgba(255,60,60,0.10), color rgba(255,100,100,0.9), border rgba(255,60,60,0.2)
```

---

## 6. Motion

| Property | Value |
|----------|-------|
| Default transition | `all 0.12s ease` |
| Card hover | `all 0.18s ease` |
| No spring / bounce | Keep it tight. Dark UIs feel heavy with overshooting. |
| Glow on hover | `box-shadow` transition only on `.btn-primary` |

---

## 7. Spacing & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | 8px | buttons, nav items, small inputs |
| `--r-md` | 10px | tabs container, select |
| `--r-lg` | 12px | asset cards |
| `--r-xl` | 14px | main panels |
| Content padding | 24px | main content area |
| Sidebar padding | 12–18px | depends on element |
| Section gap | 22–24px | between major blocks |

---

## 8. Layout

```
┌─────────────┬──────────────────────────────┐
│  Sidebar    │  Topbar (sticky)             │
│  220px      ├──────────────────────────────┤
│  glass      │  Content (scrollable)        │
│  z-10       │  padding: 24px               │
│             │  z-10                        │
└─────────────┴──────────────────────────────┘
```

- Body: `display: flex; height: 100vh; overflow: hidden; background: #000`
- Sidebar: `min-width: 220px; z-index: 10`
- Main: `flex: 1; overflow-y: auto`
- Topbar: `position: sticky; top: 0; z-index: 20`
- Gallery grid: `grid-template-columns: repeat(3, 1fr); gap: 10px`

---

## 9. Asset Reference

| Asset | Path | Usage |
|-------|------|-------|
| App logo (icon) | `public/assets/mascot-icon.svg` | 28px sidebar logo, favicon base |
| Full mascot | `public/assets/mascot-full.svg` | Sidebar footer, landing hero, empty states |
| Design mockup | `~/.gstack/projects/game-assets-maker/designs/main-screens-20260427/variant-glass.html` | Source of truth for all component visuals |

---

## 10. Tailwind Config Mapping

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#00E5A0',
        'neon-dim': 'rgba(0,229,160,0.12)',
        'neon-glow': 'rgba(0,229,160,0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '20px',
      },
      backdropSaturate: {
        glass: '180%',
      },
    },
  },
} satisfies Config
```

---

## 11. Implementation Checklist

- [ ] `globals.css` — CSS custom properties (`--bg`, `--neon`, `--g1~3`, `--border`, `--text~3`)
- [ ] `tailwind.config.ts` — extend with color/font tokens
- [ ] `layout.tsx` — Google Fonts import (Inter + JetBrains Mono)
- [ ] `Sidebar` component — glass + nav items + mascot logo
- [ ] `Topbar` component — dark glass sticky bar
- [ ] `Button` component — ghost + primary variants
- [ ] `GlassPanel` component — reusable panel wrapper
- [ ] `TypeChip` component — pill selector
- [ ] `AssetCard` component — gallery card with hover
- [ ] `Badge` component — done / processing / error states
