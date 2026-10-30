# Kharcho Design System

## Brand Identity & Aesthetic Principles

Kharcho is designed to evoke calm, clarity, and trust. Personal finance often triggers anxiety; our visual architecture counteracts that with:
- **Calm Warmth**: Soft off-white backgrounds instead of harsh clinical whites.
- **Deep Forest Green (`#0F382C`)**: Stability, grounded wealth, and growth.
- **Vibrant Emerald Accents (`#10B981` / `#34D399`)**: Clarity for positive financial actions.
- **Restrained Depth**: Delicate 1px borders and soft shadows rather than garish heavy dropshadows.
- **Micro-Interactions**: Tactile haptic feedback on button presses and segment selections.

---

## Color Palette Tokens

### 1. Light Premium Palette

| Token | Hex Value | Usage |
|---|---|---|
| `background` | `#F8F9F8` | Primary screen canvas background |
| `backgroundSecondary` | `#EFF2EF` | Secondary background layers |
| `surface` | `#FFFFFF` | Cards, modals, elevated surfaces |
| `surfaceElevated` | `#FFFFFF` | Higher z-index elevated elements |
| `surfaceSubtle` | `#F4F6F4` | Neutral pill tags and input backgrounds |
| `brandPrimary` | `#0F382C` | Deep forest green hero cards and primary buttons |
| `brandPrimaryDark`| `#0A261E` | Pressed state for primary actions |
| `brandAccent` | `#10B981` | Emerald indicator, highlights, progress bars |
| `textPrimary` | `#0F172A` | High-contrast body, titles, headline text |
| `textSecondary` | `#475569` | Subtitles, labels, metadata |
| `textMuted` | `#94A3B8` | Dates, timestamps, placeholders |
| `income` | `#059669` | Income amount text, positive trends |
| `incomeLight` | `#ECFDF5` | Income pill background |
| `expense` | `#E11D48` | Expense tags, overrun alerts |
| `expenseLight` | `#FFF1F2` | Expense pill background |
| `warning` | `#D97706` | Warning alerts, near-budget-cap banner |
| `warningLight` | `#FFFBEB` | Warning pill background |
| `border` | `#E2E8F0` | Default 1px card and input borders |
| `borderLight` | `#F1F5F9` | Inner separators and row dividers |

---

### 2. Dark Premium Palette

| Token | Hex Value | Usage |
|---|---|---|
| `background` | `#0B1311` | Deep charcoal forest canvas background |
| `backgroundSecondary` | `#070D0C` | Recessed layers |
| `surface` | `#12201C` | Elevated cards and sheets |
| `surfaceElevated` | `#172B26` | Floating modals and dialogs |
| `surfaceSubtle` | `#101B18` | Recessed rows and segment containers |
| `brandPrimary` | `#10B981` | Vibrant emerald for dark buttons |
| `brandAccent` | `#34D399` | Accent text, active tabs, progress bars |
| `textPrimary` | `#F8FAFC` | Bright high-contrast text |
| `textSecondary` | `#CBD5E1` | Muted descriptions |
| `textMuted` | `#64748B` | Secondary hints and inactive labels |
| `income` | `#34D399` | Inflow amounts |
| `incomeLight` | `rgba(16,185,129,0.16)` | Inflow pill background |
| `expense` | `#FB7185` | Outflow amounts |
| `expenseLight` | `rgba(244,63,94,0.16)` | Outflow pill background |
| `border` | `#1E332D` | Charcoal-green card borders |

---

## Typography Scale

System fonts are used for optimal native rendering, zero layout shift, and low binary footprint (`San Francisco` on iOS, `Roboto` on Android).

| Scale | Size (pt) | Line Height (pt) | Weight | Intended Usage |
|---|---|---|---|---|
| `display` | 34 | 40 | 800 (Bold) | Hero balance numbers |
| `title1` | 28 | 34 | 700 (Bold) | Screen top titles, onboarding titles |
| `title2` | 22 | 28 | 700 (Bold) | Screen headers, modal headers |
| `title3` | 18 | 24 | 600 (SemiBold)| Section headers, card titles |
| `headline` | 16 | 22 | 600 (SemiBold)| Card primary text, list titles |
| `body` | 15 | 20 | 400 (Regular) | Transaction row titles, descriptions |
| `callout` | 14 | 18 | 500 (Medium) | Subtitle text, secondary labels |
| `subhead` | 13 | 16 | 500 (Medium) | Category tags, segment controls |
| `footnote` | 12 | 15 | 400 (Regular) | Timestamps, payment modes |
| `caption` | 11 | 13 | 500 (Medium) | Micro-badges, chart axes |

---

## Spacing & Ergonomics

| Token | Value (px) | Application |
|---|---|---|
| `xs` | 4 | Tight gaps inside pills and icon chips |
| `sm` | 8 | Gap between icon and label, chip padding |
| `md` | 12 | Standard internal card element spacing |
| `lg` | 16 | Standard container padding, list item margins |
| `xl` | 20 | Horizontal screen gutters, hero card padding |
| `xxl` | 24 | Section vertical margins |
| `xxxl` | 32 | Major section separation |

**Touch Target Rule**: All interactive buttons, icon hits, and form controls have a minimum touch target of **48pt** with proper hit slop to prevent accidental mis-taps.

---

## Shadows & Elevation

```ts
// Light mode subtle elevation
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 8,
elevation: 2
```

In Dark Mode, elevated surfaces use higher lightness surfaces (`#172B26`) combined with dark ambient shadows (`rgba(0,0,0,0.4)`).
