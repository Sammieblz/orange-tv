# Design System Master File

> **Orange TV note:** TV shell UX, tokens, and focus rules in the **Orange TV frontend skill** (`.cursor/frontend/SKILL.md` when present locally) take precedence for launcher work. This file is the **ui-ux-pro-max** baseline for broader product styling.

> **Page overrides:** When building a specific page, first check `docs/design-system/pages/[page-name].md`. If that file exists, its rules **override** this Master file.

---

**Project:** Orange TV  
**Generated:** 2026-04-04 (regenerate via `npm run design-system` when `.cursor` skills are present)  
**Category:** Music Streaming

---

## Global Rules

### Color Palette

| Role       | Hex       | CSS Variable        |
| ---------- | --------- | ------------------- |
| Primary    | `#1E1B4B` | `--color-primary`   |
| Secondary  | `#4338CA` | `--color-secondary` |
| CTA/Accent | `#22C55E` | `--color-cta`       |
| Background | `#0F0F23` | `--color-background` |
| Text       | `#F8FAFC` | `--color-text`      |

**Color Notes:** Dark audio + play green

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mood:** Engaging + Clear hierarchy

### Spacing Variables

| Token        | Value               | Usage                    |
| ------------ | ------------------- | ------------------------ |
| `--space-xs` | `4px` / `0.25rem`   | Tight gaps               |
| `--space-sm` | `8px` / `0.5rem`    | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem`     | Standard padding         |
| `--space-lg` | `24px` / `1.5rem`   | Section padding          |
| `--space-xl` | `32px` / `2rem`     | Large gaps               |
| `--space-2xl`| `48px` / `3rem`     | Section margins          |
| `--space-3xl`| `64px` / `4rem`     | Hero padding             |

### Shadow Depths

| Level        | Value                              | Usage                      |
| ------------ | ---------------------------------- | -------------------------- |
| `--shadow-sm`| `0 1px 2px rgba(0,0,0,0.05)`       | Subtle lift                |
| `--shadow-md`| `0 4px 6px rgba(0,0,0,0.1)`        | Cards, buttons             |
| `--shadow-lg`| `0 10px 15px rgba(0,0,0,0.1)`      | Modals, dropdowns          |
| `--shadow-xl`| `0 20px 25px rgba(0,0,0,0.15)`     | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #22c55e;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #1e1b4b;
  border: 2px solid #1e1b4b;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #0f0f23;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1e1b4b;
  outline: none;
  box-shadow: 0 0 0 3px #1e1b4b20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Vibrant & Block-based

**Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic

**Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer

**Key Effects:** Large sections (48px+ gaps), animated patterns, bold hover (color shift), scroll-snap, large type (32px+), 200-300ms

### Page Pattern

**Pattern Name:** Minimal Single Column

- **Conversion Strategy:** Single CTA focus. Large typography. Lots of whitespace. No nav clutter. Mobile-first.
- **CTA Placement:** Center, large CTA button
- **Section Order:** 1. Hero headline, 2. Short description, 3. Benefit bullets (3 max), 4. CTA, 5. Footer

---

## Anti-Patterns (Do NOT Use)

- Flat design without depth
- Text-heavy pages

### Additional Forbidden Patterns

- **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons); launcher uses **Iconoir** per frontend skill.
- **Missing cursor:pointer** — All clickable elements must have cursor:pointer (TV shell is **focus-first**; pointer hints still help hybrid input).
- **Layout-shifting hovers** — Avoid scale transforms that shift layout
- **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- **Instant state changes** — Use transitions (150-300ms)
- **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set
- [ ] `cursor-pointer` on all clickable elements where pointer input applies
- [ ] Hover states with smooth transitions (150-300ms); **launcher:** keyboard/gamepad focus rings per frontend skill
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
