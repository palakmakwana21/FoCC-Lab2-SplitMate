---
name: Warm Social Ledger
colors:
  surface: '#e8ffef'
  surface-dim: '#bbe3cb'
  surface-bright: '#e8ffef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#d4fde4'
  surface-container: '#cff7de'
  surface-container-high: '#c9f2d9'
  surface-container-highest: '#c4ecd3'
  on-surface: '#002113'
  on-surface-variant: '#404941'
  inverse-surface: '#123726'
  inverse-on-surface: '#d2fae1'
  outline: '#717970'
  outline-variant: '#c0c9be'
  surface-tint: '#2e6a41'
  primary: '#003b1b'
  on-primary: '#ffffff'
  primary-container: '#14532d'
  on-primary-container: '#87c695'
  inverse-primary: '#96d5a3'
  secondary: '#6a5f00'
  on-secondary: '#ffffff'
  secondary-container: '#f8e136'
  on-secondary-container: '#6f6300'
  tertiary: '#293528'
  on-tertiary: '#ffffff'
  tertiary-container: '#404c3e'
  on-tertiary-container: '#aebcaa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f2be'
  primary-fixed-dim: '#96d5a3'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#12512c'
  secondary-fixed: '#fbe439'
  secondary-fixed-dim: '#ddc815'
  on-secondary-fixed: '#201c00'
  on-secondary-fixed-variant: '#504700'
  tertiary-fixed: '#d9e7d4'
  tertiary-fixed-dim: '#bdcab8'
  on-tertiary-fixed: '#131e13'
  on-tertiary-fixed-variant: '#3e4a3c'
  background: '#e8ffef'
  on-background: '#002113'
  surface-variant: '#c4ecd3'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  currency-display:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  currency-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a warm, humanized financial narrative centered around ease, transparency, and friendship. By moving away from sterile corporate fintech clichés, the interface introduces an organic, approachable atmosphere through soft cream backdrops, lush botanical greens, and cheerful butter-yellow accents.

The design movement mixes **Tactile Minimalism** with **Warm Playful Functionalism**:
- Visual tone balances deep structural greens with joyful, high-contrast badges and clear transactional ledgers.
- Physical softness is reinforced through generous 20px card curvatures, pill-like interactive elements, and delicate organic borders.
- Emotional goal: Dispel the friction, anxiety, and social awkwardness of debt settlement by transforming group expenses into a shared, collaborative celebration.

## Colors

The palette establishes an organic, friendly financial surface that feels grounded and premium. 

### Core Palette Application
- **Primary Canvas**: `#FAF9F0` serves as the warm cream canvas across the entire application, eliminating harsh white glares while keeping contrast high.
- **Surface & Cards**: `#FFFFFF` acts as elevated surface cards, surrounded by crisp `#E1E3D5` outlines.
- **Deep & Forest Greens**:
  - `#14532D` (Forest Green): Primary buttons, dominant iconography, active state fills.
  - `#103D27` (Deep Green): High-emphasis structural elements, active sidebar states, modal titles.
  - `#21864A` (Primary Action Green & Success): Interactive CTA states, payment settled badges, positive balances ("you are owed").
- **Butter Yellow Accents**:
  - `#FFE83D` (Butter Yellow): Attention-grabbing highlights, primary action pills, unsettled reminder pings.
  - `#FFF7BF` (Pale Yellow): Subtle pill badges, notification banners, hover tinting.
- **Neutrals & Soft Sage**:
  - `#173B2A` (Main Text): Rich dark green for absolute readability without the starkness of pure black.
  - `#68776A` (Secondary Text): Subdued earthy sage for subtitles, timestamps, and secondary metadata.
  - `#DDEBD8` (Soft Sage Accent): Background fills for avatars, transaction categories, and chips.
- **Feedback & Semantics**:
  - **Success**: `#21864A` (Owed to you / Completed).
  - **Warning**: `#F0A42B` (Pending reminder / Due soon).
  - **Error / Debt**: `#D94841` (You owe / Overdue settlement).

## Typography

The typography couples the modern, geometric stability of **Manrope** for numbers, headlines, and prominent labels with the utilitarian readability of **Inter** for dense transactional line items.

- **Currency Treatment**: Currency symbols (₹) and amounts must use **Manrope** with tabular figures (`font-variant-numeric: tabular-nums`) to preserve vertical alignment across ledger lists.
- **Negative and Positive Amounts**: Rendered in `currency-display` or `currency-sm`, backed with corresponding semantic tints (`#21864A` for credits, `#D94841` for debts).
- **Secondary Identifiers**: Dates, participant subtexts, and division metadata utilize `body-sm` set in `#68776A`.

## Layout & Spacing

The web application utilizes a structured desktop SaaS layout that collapses into a bottom-navigated responsive canvas on mobile.

### Architecture
- **Sidebar Navigation**: Fixed `240px` width on desktop (`>= 1024px`), docked to the left with an internal vertical padding of `space-lg`.
- **Top Bar**: Fixed `64px` height housing the search input, contextual group selector, and the highlighted `+ Add Expense` quick CTA.
- **Main Ledger Canvas**: Flexible viewport containing a 12-column grid system with `1.25rem` (20px) gutters and `1.5rem` (24px) responsive outer padding. Max content constraint of `1280px` centered within the remaining viewport width.

### Responsive Behavior
- **Desktop (1024px+)**: 240px fixed sidebar, top bar active, multi-column dashboard showing balance summaries, group lists, and recent activity side-by-side.
- **Tablet (768px - 1023px)**: Sidebar shrinks to a compact 72px icon rail. Main content reflows into single-column or 2-column stacked summaries.
- **Mobile (< 768px)**: Sidebar converts to a fixed bottom navigation bar (64px). Top bar contains only identity and the `+ Add Expense` butter-yellow action pill. Inner canvas margins drop to `1rem`.

## Elevation & Depth

Visual hierarchy combines warm tonal separation, structural containment, and colored ambient shadows rather than grey industrial drops.

- **Ambient Tinted Shadows**: All elevated cards use soft forest-tinted drop shadows: `0 4px 14px rgba(20, 83, 45, 0.06)`. This prevents dirty gray halos on the warm cream canvas.
- **Structural Outlines**: All interactive and elevated containers feature a distinct border treatment: `1.5px solid #E1E3D5`.
- **Level 0 (Canvas)**: `#FAF9F0` flat base.
- **Level 1 (Cards & Groups)**: Pure `#FFFFFF` fill, 1.5px `#E1E3D5` border, and the ambient forest shadow.
- **Level 2 (Popovers, Modals & Floating Action Buttons)**: `#FFFFFF` fill, `0 12px 32px rgba(20, 83, 45, 0.12)`, bordered with `#E1E3D5`.
- **Level 3 (Sticky Split Sliders & Dynamic Balance Tickers)**: Tinted `#FFF7BF` or `#DDEBD8` with `0 6px 20px rgba(20, 83, 45, 0.08)`.

## Shapes

The interface embraces a noticeably rounded, tactile design language that reinforces comfort and approachability.

- **Cards & Primary Modules**: Fixed `20px` border-radius (`rounded-xl` customization).
- **Buttons & Form Fields**: Fixed `14px` border-radius (`rounded-lg` customization), creating comfortable, pressable geometric touchpoints.
- **Chips, Category Tags & Status Badges**: Full pill curves (`9999px` border-radius).
- **Avatars**: Circular (`9999px`) with a `2px solid #FAF9F0` separator in overlapping group stacks.

## Components

### Buttons
- **Primary Action (CTA / Add Expense)**:
  - Radius: `14px`. Padding: `10px 20px`.
  - Base: `#FFE83D` (Butter Yellow) background with `#103D27` (Deep Green) bold typography (`label-lg`). Border: `1.5px solid #14532D`.
  - Hover: Background shifts to `#FFF7BF` with a subtle `-1px` transform lift.
- **Secondary Solid**:
  - Base: `#14532D` background, `#FFFFFF` text, radius: `14px`.
  - Hover: `#21864A`.
- **Outlined / Ghost**:
  - Base: Transparent background, `1.5px solid #E1E3D5`, `#173B2A` text.
  - Hover: `#DDEBD8` background fill.

### Expense & Balance Cards
- **Container**:
  - Radius: `20px`. Background: `#FFFFFF`. Border: `1.5px solid #E1E3D5`. Shadow: `0 4px 14px rgba(20, 83, 45, 0.06)`. Internal padding: `space-lg` (24px).
- **Balance Highlights**:
  - "You are owed": Rendered with `#21864A` accent tag and soft `#DDEBD8` circular icon backdrop.
  - "You owe": Rendered with `#D94841` text accent and soft coral tinted background chip.

### Input Fields
- **Container**:
  - Radius: `14px`. Background: `#FFFFFF`. Border: `1.5px solid #E1E3D5`. Height: `48px`. Padding: `0 16px`.
  - Text: `body-md` in `#173B2A`. Placeholder: `#68776A`.
- **Focus State**:
  - Border: `1.5px solid #14532D`. Outline: `3px solid #FFF7BF`.

### Chips & Badges
- **Status Pills**:
  - Height: `28px`. Padding: `4px 12px`. Radius: `9999px`.
  - Settlement Done: `#DDEBD8` background, `#14532D` text.
  - Pending Share: `#FFF7BF` background, `#103D27` text.

### Checkboxes & Split Selectors
- **Selection Control**:
  - Box size: `20px * 20px`. Radius: `6px`. Border: `1.5px solid #68776A`.
  - Checked: `#14532D` background with `#FFE83D` checkmark icon.

### Split Sliders & Dynamic Splitters
- **Track**: `8px` height, `#E1E3D5` background fill, `9999px` radius.
- **Fill**: `#21864A` progress indication.
- **Thumb**: `24px` circular grab handle in `#FFFFFF`, with `2px solid #14532D` and `0 2px 6px rgba(20, 83, 45, 0.15)`.

### Lists & Ledger Rows
- Interactive list items use seamless dividers (`1px solid #E1E3D5`), with transparent backdrops that turn `#FAF9F0` on hover. Each item displays category icon containers with rounded `12px` geometries filled with `#DDEBD8`.