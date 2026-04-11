# UI Design Standards (Current and Target)

## Current state in code
- Base typography is global sans from frontend/src/app/globals.css.
- Tailwind has a small custom palette in frontend/tailwind.config.cjs (ink/night/mist/pop/aqua/lime/gold), but most pages use direct utility colors (slate/indigo/etc) rather than shared semantic tokens.
- Design language is mostly implemented as per-component class strings, not shared primitives.

## Practical standard to enforce now

### Typography
- Page title: 22px bold (track -0.02em)
- Section title: 18-19px bold
- Body: 13px
- Meta/help: 12px
- Tiny labels/chips: 10-11px

### Shape and spacing
- Radius tokens:
  - Small interactive: 7px or 8px
  - Standard card: 9px
  - Section shells: 13px
- Spacing scale: 4/8/12/16/20/24/32

### Colors (semantic)
- Primary action: indigo-600 / indigo-700 hover
- Surface: white on slate-50 app background
- Borders: slate-200 baseline
- Success: emerald family
- Warning: amber family
- Error: red/rose family

### Component patterns
- Module page header pattern should be consistent across redesigned modules.
- Progress rows should use the same chip/badge styles and text sizing.
- Disclosure rows should use consistent border, icon, and chevron behavior.

## What is missing
- No centralized design tokens file consumed by components.
- No shared component primitives for cards/chips/buttons/disclosures.
- Some pages still use older style patterns (larger radii, mixed text-sm/text-xs conventions).

## Recommended implementation path
1. Add semantic token map in one place (for color, radius, text scales).
2. Introduce minimal reusable primitives:
   - Card
   - SectionHeader
   - PillBadge
   - DisclosureRow
   - PrimaryButton and SecondaryButton
3. Use primitives in all app modules before adding new page styles.
4. Keep auth pages and app pages aligned unless intentionally different.

## Rule for future work
No new module page should ship with ad-hoc sizing/color conventions that bypass this document.
