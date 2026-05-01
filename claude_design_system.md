# Design System Inspired by Claude (Anthropic)
**Category:** AI & LLM  

---

## 1. Visual Theme & Atmosphere

Claude's interface is a literary salon reimagined as a product page—warm, unhurried, and quietly intellectual. The entire experience is built on a parchment-toned canvas (`#f5f4ed`) that evokes high-quality paper rather than a digital surface.

The design avoids cold, futuristic aesthetics and instead radiates human warmth. Its signature element is the custom **Anthropic Serif** typeface, paired with organic, hand-drawn-style illustrations in terracotta (`#c96442`), black, and muted green.

### Key Characteristics
- Warm parchment canvas (`#f5f4ed`)
- Serif headlines + Sans UI + Mono code
- Terracotta accent (`#c96442`)
- Warm-toned neutrals only
- Organic illustrations (non-tech style)
- Ring-based shadow system (`0px 0px 0px 1px`)
- Editorial, magazine-like spacing

---

## 2. Color Palette & Roles

### Primary
- **Anthropic Near Black** `#141413`
- **Terracotta Brand** `#c96442`
- **Coral Accent** `#d97757`

### Secondary
- **Error Crimson** `#b53333`
- **Focus Blue** `#3898ec` (only cool color)

### Backgrounds
- **Parchment** `#f5f4ed`
- **Ivory** `#faf9f5`
- **White** `#ffffff`
- **Warm Sand** `#e8e6dc`
- **Dark Surface** `#30302e`

### Text Neutrals
- **Charcoal Warm** `#4d4c48`
- **Olive Gray** `#5e5d59`
- **Stone Gray** `#87867f`
- **Warm Silver** `#b0aea5`

### Borders & Rings
- **Border Cream** `#f0eee6`
- **Border Warm** `#e8e6dc`
- **Ring Warm** `#d1cfc5`

### Gradient Philosophy
No gradients. Depth comes from warm tone transitions.

---

## 3. Typography Rules

### Font Families
- Headline: Anthropic Serif (fallback: Georgia)
- Body/UI: Anthropic Sans (fallback: Arial / Inter)
- Code: Anthropic Mono

### Hierarchy (Simplified)

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|------------|
| Hero | Serif | 64px | 500 | 1.10 |
| Section | Serif | 52px | 500 | 1.20 |
| Subheading | Serif | 32px | 500 | 1.10 |
| Body | Sans | 16px | 400–500 | 1.60 |
| Caption | Sans | 14px | 400 | 1.43 |
| Code | Mono | 15px | 400 | 1.60 |

### Principles
- Serif = authority
- Sans = utility
- Single serif weight (500 only)
- Generous line-height (1.60)
- Tight but breathable headings

---

## 4. Component Stylings

### Buttons

#### Warm Sand
- Background: `#e8e6dc`
- Text: `#4d4c48`
- Radius: 8px
- Shadow: ring-based

#### White
- Background: `#ffffff`
- Radius: 12px

#### Dark
- Background: `#30302e`
- Text: `#faf9f5`

#### Brand CTA
- Background: `#c96442`
- Text: `#faf9f5`

---

### Cards
- Background: Ivory or White
- Border: `1px solid #f0eee6`
- Radius: 8–32px
- Shadow: soft (`rgba(0,0,0,0.05)`)

---

### Inputs
- Border: warm tones
- Focus: `#3898ec`
- Radius: 12px

---

### Navigation
- Sticky
- Warm background
- Minimal hover effects

---

## 5. Layout Principles

### Spacing
- Base: 8px
- Sections: 80–120px vertical spacing

### Grid
- Max width: 1200px
- 1–3 column layouts
- Alternating light/dark sections

### Philosophy
- Editorial rhythm
- Content as "rooms"
- Serif-driven spacing

---

## 6. Depth & Elevation

| Level | Style |
|------|------|
| Flat | No shadow |
| Contained | 1px border |
| Ring | 0px 0px 0px 1px |
| Whisper | soft shadow |
| Inset | inner border |

### Key Idea
Depth comes from **ring shadows**, not drop shadows.

---

## 7. Do's and Don'ts

### Do
- Use warm palette
- Keep serif at weight 500
- Use ring shadows
- Maintain serif/sans hierarchy
- Use large spacing

### Don't
- No cool grays
- No bold serif
- No heavy shadows
- No sharp corners
- No pure white backgrounds

---

## 8. Responsive Behavior

### Breakpoints
- Mobile: <640px
- Tablet: 768px+
- Desktop: 992px+

### Behavior
- Collapse nav
- Stack layouts
- Scale typography
- Maintain spacing rhythm

---

## 9. Agent Prompt Guide

### Quick Colors
- CTA: `#c96442`
- Background: `#f5f4ed`
- Card: `#faf9f5`
- Text: `#141413`

### Example Prompt
> Create a hero section on Parchment (#f5f4ed) with a 64px serif headline (weight 500), subtitle in Olive Gray (#5e5d59), and a Terracotta CTA button.

### Iteration Tips
- One component at a time
- Use exact color names
- Always specify serif vs sans
- Use "ring shadow", not "drop shadow"