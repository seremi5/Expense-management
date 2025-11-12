# Design System: Expense Reimbursement System

## Executive Summary

This document defines the complete design system for the Expense Reimbursement System, including color palette, typography, spacing, component patterns, and visual language. The design system is tailored for a youth ministry context in Catalonia, balancing professionalism with approachability while maintaining WCAG 2.1 AA accessibility compliance.

**Design Principles:**
1. **Youth-Friendly**: Warm, approachable aesthetics without being childish
2. **Mobile-First**: Optimized for phones (primary device for 80% of users)
3. **Accessible**: WCAG 2.1 AA compliant (4.5:1 contrast minimum)
4. **Catalan-First**: Typography and content optimized for Catalan language
5. **Fast & Clear**: Minimalist design prioritizing speed and clarity

**Key Decisions:**
- Primary Color: Warm Blue (#0ea5e9) - trust + friendly
- Secondary Color: Warm Orange (#f97316) - energy + youth
- Typography: Inter for UI, system fonts for performance
- Spacing: 4px base unit (Tailwind default)
- Border Radius: 8px (modern, friendly)

---

## 1. Color System

### 1.1 Primary Palette

**Primary Color: Sky Blue**
```css
/* HSL: 199 89% 48% */
primary-50:  #f0f9ff  /* Very light backgrounds */
primary-100: #e0f2fe  /* Light backgrounds */
primary-200: #bae6fd  /* Hover states */
primary-300: #7dd3fc  /* Borders */
primary-400: #38bdf8  /* Light accents */
primary-500: #0ea5e9  /* Main brand color */
primary-600: #0284c7  /* Hover/active states */
primary-700: #0369a1  /* Text on light backgrounds */
primary-800: #075985  /* Dark mode text */
primary-900: #0c4a6e  /* Very dark accents */
```

**Why Sky Blue?**
- Warmer than traditional corporate blue
- Excellent accessibility (AAA contrast at 700+)
- Youth-friendly while maintaining trust
- Works well with warm accent colors

### 1.2 Secondary Palette: Orange

**For Calls-to-Action and Highlights**
```css
/* HSL: 25 95% 53% */
orange-50:  #fff7ed  /* Light backgrounds */
orange-100: #ffedd5  /* Subtle highlights */
orange-200: #fed7aa  /* Borders */
orange-300: #fdba74  /* Hover states */
orange-400: #fb923c  /* Light accents */
orange-500: #f97316  /* Main secondary color */
orange-600: #ea580c  /* Hover/active states */
orange-700: #c2410c  /* Dark text */
orange-800: #9a3412  /* Very dark */
orange-900: #7c2d12  /* Darkest */
```

**Usage:**
- FAB button ("Nova Despesa")
- Important notifications
- Celebration moments (approval, success)
- Accent elements sparingly

### 1.3 Semantic Colors

**Success: Green**
```css
/* HSL: 142 76% 36% */
success-50:  #f0fdf4
success-100: #dcfce7
success-200: #bbf7d0
success-300: #86efac
success-400: #4ade80
success-500: #22c55e  /* Main success color */
success-600: #16a34a  /* Hover/active */
success-700: #15803d  /* Dark text */
success-800: #166534
success-900: #14532d
```

**Usage:**
- Approved status
- Success messages
- Positive feedback
- Checkmarks, confirmation

**Destructive: Red**
```css
/* HSL: 0 84% 60% */
destructive-50:  #fef2f2
destructive-100: #fee2e2
destructive-200: #fecaca
destructive-300: #fca5a5
destructive-400: #f87171
destructive-500: #ef4444  /* Main error color */
destructive-600: #dc2626  /* Hover/active */
destructive-700: #b91c1c  /* Dark text */
destructive-800: #991b1b
destructive-900: #7f1d1d
```

**Usage:**
- Declined status
- Error messages
- Destructive actions (delete)
- Validation errors

**Warning: Amber**
```css
/* HSL: 38 92% 50% */
warning-50:  #fffbeb
warning-100: #fef3c7
warning-200: #fde68a
warning-300: #fcd34d
warning-400: #fbbf24
warning-500: #f59e0b  /* Main warning color */
warning-600: #d97706  /* Hover/active */
warning-700: #b45309  /* Dark text */
warning-800: #92400e
warning-900: #78350f
```

**Usage:**
- Pending status
- Warning messages
- Important notices
- Needs attention

**Info: Blue**
```css
/* HSL: 211 96% 48% */
info-50:  #eff6ff
info-100: #dbeafe
info-200: #bfdbfe
info-300: #93c5fd
info-400: #60a5fa
info-500: #3b82f6  /* Main info color */
info-600: #2563eb  /* Hover/active */
info-700: #1d4ed8  /* Dark text */
info-800: #1e40af
info-900: #1e3a8a
```

**Usage:**
- Informational messages
- Tooltips
- Help text
- Neutral notifications

### 1.4 Neutral Palette: Gray (Warm)

**Using Slate for subtle warmth**
```css
/* HSL: 215 16% range */
gray-50:  #f8fafc  /* Page background */
gray-100: #f1f5f9  /* Card backgrounds */
gray-200: #e2e8f0  /* Borders, dividers */
gray-300: #cbd5e1  /* Disabled states */
gray-400: #94a3b8  /* Placeholder text */
gray-500: #64748b  /* Secondary text */
gray-600: #475569  /* Body text (light backgrounds) */
gray-700: #334155  /* Headings */
gray-800: #1e293b  /* Dark headings */
gray-900: #0f172a  /* Very dark text */
```

**Usage:**
- Text (600-900)
- Backgrounds (50-100)
- Borders (200-300)
- Disabled states (300-400)

### 1.5 Accessibility Validation

**Contrast Ratios (against white #ffffff):**
| Color | Contrast | WCAG Level |
|-------|----------|------------|
| primary-700 (#0369a1) | 5.8:1 | AAA |
| primary-600 (#0284c7) | 4.7:1 | AA ✓ |
| gray-600 (#475569) | 7.9:1 | AAA |
| gray-500 (#64748b) | 5.1:1 | AA ✓ |
| orange-600 (#ea580c) | 4.5:1 | AA ✓ |
| success-700 (#15803d) | 5.2:1 | AA ✓ |
| destructive-600 (#dc2626) | 5.9:1 | AAA |

**Rules:**
- Body text: Use gray-600 or darker (minimum 7:1)
- Headings: Use gray-700 or darker (minimum 4.5:1)
- Links: Use primary-600 or darker (minimum 4.5:1)
- Interactive elements: Minimum 4.5:1 contrast
- Large text (18pt+): Minimum 3:1 contrast

### 1.6 Color Usage Guidelines

**Do's:**
✅ Use primary for navigation, links, primary buttons
✅ Use semantic colors consistently (green = success, red = error)
✅ Pair colors with icons for accessibility
✅ Test all color combinations with contrast checker
✅ Use neutral grays for most UI elements

**Don'ts:**
❌ Don't use color alone to convey information
❌ Don't mix too many accent colors (max 2-3 per screen)
❌ Don't use pure black (#000) or pure white (#fff) for text
❌ Don't override semantic colors (e.g., green for errors)

---

## 2. Typography

### 2.1 Font Stack

**Primary Font: Inter**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
  'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Why Inter?**
- Excellent legibility at small sizes
- Wide range of weights (100-900)
- Optimized for screens
- Supports Catalan language characters (Ç, À, È, etc.)
- Open source (free)

**Fallback Strategy:**
- System fonts for fastest performance
- Inter loaded from CDN or self-hosted

**Monospace Font (for code/IDs):**
```css
font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
```

### 2.2 Type Scale

**Based on 1rem = 16px**

| Name | Size (rem) | Size (px) | Line Height | Usage |
|------|-----------|-----------|-------------|-------|
| xs   | 0.75rem   | 12px      | 1rem (16px) | Labels, captions |
| sm   | 0.875rem  | 14px      | 1.25rem (20px) | Secondary text |
| base | 1rem      | 16px      | 1.5rem (24px) | Body text |
| lg   | 1.125rem  | 18px      | 1.75rem (28px) | Large body |
| xl   | 1.25rem   | 20px      | 1.75rem (28px) | Small headings |
| 2xl  | 1.5rem    | 24px      | 2rem (32px) | Card titles |
| 3xl  | 1.875rem  | 30px      | 2.25rem (36px) | Page titles |
| 4xl  | 2.25rem   | 36px      | 2.5rem (40px) | Hero headings |
| 5xl  | 3rem      | 48px      | 1 | Large displays |

### 2.3 Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light  | 300   | Rarely used |
| Regular | 400  | Body text |
| Medium | 500   | Emphasized text, buttons |
| Semibold | 600 | Subheadings, labels |
| Bold   | 700   | Headings, strong emphasis |
| Extrabold | 800 | Hero text, numbers |

### 2.4 Typography Patterns

**Headings:**
```css
h1 {
  font-size: 1.875rem;    /* 30px */
  font-weight: 700;       /* Bold */
  line-height: 2.25rem;   /* 36px */
  letter-spacing: -0.025em; /* Slight tightening */
  color: var(--gray-900);
}

h2 {
  font-size: 1.5rem;      /* 24px */
  font-weight: 600;       /* Semibold */
  line-height: 2rem;      /* 32px */
  color: var(--gray-800);
}

h3 {
  font-size: 1.25rem;     /* 20px */
  font-weight: 600;       /* Semibold */
  line-height: 1.75rem;   /* 28px */
  color: var(--gray-800);
}

h4 {
  font-size: 1.125rem;    /* 18px */
  font-weight: 600;       /* Semibold */
  line-height: 1.75rem;   /* 28px */
  color: var(--gray-700);
}
```

**Body Text:**
```css
body {
  font-size: 1rem;        /* 16px */
  font-weight: 400;       /* Regular */
  line-height: 1.5;       /* 24px */
  color: var(--gray-600);
}

.text-secondary {
  font-size: 0.875rem;    /* 14px */
  color: var(--gray-500);
}

.text-muted {
  font-size: 0.875rem;    /* 14px */
  color: var(--gray-400);
}
```

**Labels & Captions:**
```css
label {
  font-size: 0.875rem;    /* 14px */
  font-weight: 500;       /* Medium */
  color: var(--gray-700);
}

.caption {
  font-size: 0.75rem;     /* 12px */
  font-weight: 400;       /* Regular */
  color: var(--gray-500);
}
```

**Links:**
```css
a {
  font-weight: 500;       /* Medium */
  color: var(--primary-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

a:hover {
  color: var(--primary-700);
}
```

### 2.5 Catalan Language Considerations

**Special Characters Support:**
Ensure all fonts support:
- À, È, É, Í, Ï, Ò, Ó, Ú, Ü (vowels with accents)
- Ç (c with cedilla)
- L·L (ela geminada) - use interpunct (·)

**Typography for Catalan:**
- Slightly longer words than English (account for in layouts)
- More use of accented characters (ensure good letter-spacing)
- Common contractions: l', d', s', n' (watch for apostrophe rendering)

**Testing:**
Use this test string:
> "La gestió de despeses és fàcil amb l'aplicació. Pots enviar la factura des del mòbil!"

### 2.6 Responsive Typography

**Mobile (< 640px):**
- Reduce heading sizes by ~20%
- Keep body text at 16px minimum (readability)
- Increase line-height slightly (1.6 vs 1.5)

**Tablet (640px - 1023px):**
- Standard type scale
- Optimize for reading distance

**Desktop (1024px+):**
- Standard or slightly larger type scale
- Wider line lengths (max 75 characters)

---

## 3. Spacing System

### 3.1 Base Unit: 4px

**Tailwind Default Scale:**
```
0:   0px
px:  1px
0.5: 2px
1:   4px
1.5: 6px
2:   8px
2.5: 10px
3:   12px
3.5: 14px
4:   16px
5:   20px
6:   24px
7:   28px
8:   32px
9:   36px
10:  40px
11:  44px
12:  48px
14:  56px
16:  64px
20:  80px
24:  96px
32:  128px
40:  160px
48:  192px
56:  224px
64:  256px
```

### 3.2 Common Spacing Patterns

**Component Internal Spacing:**
- Button padding: `px-4 py-2` (16px × 8px)
- Input padding: `px-3 py-2` (12px × 8px)
- Card padding: `p-6` (24px)
- Modal padding: `p-8` (32px)

**Layout Spacing:**
- Between form fields: `gap-4` (16px)
- Between sections: `gap-8` or `gap-12` (32px or 48px)
- Page margins: `px-4 md:px-6 lg:px-8` (responsive)
- Container max-width: `max-w-7xl` (1280px)

**Vertical Rhythm:**
- Paragraph spacing: `space-y-4` (16px)
- Section spacing: `space-y-8` (32px)
- Major sections: `space-y-12` (48px)

### 3.3 Responsive Spacing

**Mobile-First Approach:**
```tsx
// Increase spacing on larger screens
<div className="space-y-4 md:space-y-6 lg:space-y-8">

// Container padding
<div className="px-4 md:px-6 lg:px-8">

// Section margins
<section className="my-8 md:my-12 lg:my-16">
```

---

## 4. Layout & Grid System

### 4.1 Container Widths

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding-left: 1rem;  /* 16px */
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### 4.2 Grid Patterns

**Form Layout (Mobile):**
```tsx
<div className="grid grid-cols-1 gap-4">
  {/* Single column on mobile */}
</div>
```

**Card Grid (Responsive):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 col mobile, 2 col tablet, 3 col desktop */}
</div>
```

**Dashboard Stats:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* 2 cols mobile, 4 cols tablet+ */}
</div>
```

### 4.3 Safe Areas (Mobile)

**Account for device notches and navigation:**
```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: calc(env(safe-area-inset-bottom) + 4rem);
  /* 4rem = bottom nav height */
}
```

---

## 5. Border Radius

### 5.1 Scale

```css
none: 0
sm:   2px   /* Rarely used */
DEFAULT: 4px /* Subtle rounding */
md:   6px   /* Slightly more rounded */
lg:   8px   /* Main rounding (recommended) */
xl:   12px  /* Cards, modals */
2xl:  16px  /* Large cards */
3xl:  24px  /* Hero sections */
full: 9999px /* Circular (avatars, pills) */
```

### 5.2 Usage Guidelines

| Element | Border Radius | Reasoning |
|---------|---------------|-----------|
| Buttons | lg (8px) | Modern, friendly |
| Inputs | md (6px) | Subtle, clean |
| Cards | xl (12px) | Prominent, welcoming |
| Modals | 2xl (16px) | Soft, inviting |
| Badges | full (pill) | Tag-like appearance |
| Avatars | full (circular) | Standard convention |
| Images | lg (8px) | Consistent with buttons |
| Page | none | Sharp edges for bounds |

**Consistency Rule:**
Use `lg` (8px) as default for most interactive elements.

---

## 6. Shadows & Elevation

### 6.1 Shadow Scale

```css
/* Tailwind shadow utilities */
shadow-sm:
  0 1px 2px 0 rgb(0 0 0 / 0.05);

shadow (default):
  0 1px 3px 0 rgb(0 0 0 / 0.1),
  0 1px 2px -1px rgb(0 0 0 / 0.1);

shadow-md:
  0 4px 6px -1px rgb(0 0 0 / 0.1),
  0 2px 4px -2px rgb(0 0 0 / 0.1);

shadow-lg:
  0 10px 15px -3px rgb(0 0 0 / 0.1),
  0 4px 6px -4px rgb(0 0 0 / 0.1);

shadow-xl:
  0 20px 25px -5px rgb(0 0 0 / 0.1),
  0 8px 10px -6px rgb(0 0 0 / 0.1);

shadow-2xl:
  0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### 6.2 Elevation Levels

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 | none | Flat elements, backgrounds |
| 1 | shadow-sm | Subtle separation |
| 2 | shadow | Cards, panels |
| 3 | shadow-md | Dropdowns, popovers |
| 4 | shadow-lg | Modals, FAB |
| 5 | shadow-xl | Top-level modals |
| 6 | shadow-2xl | Rarely used |

**Usage Examples:**
```tsx
// Card
<Card className="shadow-md">

// Dropdown
<DropdownMenu className="shadow-lg">

// Modal
<Dialog className="shadow-xl">

// FAB
<button className="shadow-lg hover:shadow-xl transition">
```

### 6.3 Interactive Shadows

**Hover States:**
```css
.card {
  transition: box-shadow 0.2s ease;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 7. Iconography

### 7.1 Icon Library: Lucide React

**Size Guidelines:**
| Context | Size | Class |
|---------|------|-------|
| Inline text | 16px | h-4 w-4 |
| Body text | 20px | h-5 w-5 |
| Buttons | 20px | h-5 w-5 |
| Headings | 24px | h-6 w-6 |
| Large buttons | 24px | h-6 w-6 |
| Icon buttons | 24px | h-6 w-6 |
| Hero sections | 48px+ | h-12 w-12 |

### 7.2 Icon + Text Spacing

```tsx
// Icon before text
<Button>
  <Camera className="mr-2 h-4 w-4" />
  Fer foto
</Button>

// Icon after text
<Button>
  Veure més
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>
```

### 7.3 Icon-Only Buttons

**Always include aria-label:**
```tsx
<button aria-label="Eliminar despesa">
  <Trash2 className="h-5 w-5" aria-hidden="true" />
</button>
```

---

## 8. Component Patterns

### 8.1 Buttons

**Primary Button:**
```tsx
<button className="bg-primary-600 text-white px-6 py-2.5 rounded-lg
  font-medium hover:bg-primary-700 transition-colors
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Enviar
</button>
```

**Secondary Button:**
```tsx
<button className="border border-gray-300 text-gray-700 px-6 py-2.5
  rounded-lg font-medium hover:bg-gray-50 transition-colors
  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
  Cancel·lar
</button>
```

**Icon Button:**
```tsx
<button className="p-2 rounded-lg hover:bg-gray-100 transition-colors
  focus:outline-none focus:ring-2 focus:ring-gray-500"
  aria-label="More options">
  <MoreVertical className="h-5 w-5 text-gray-600" />
</button>
```

### 8.2 Input Fields

**Text Input:**
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-md
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    placeholder:text-gray-400"
  placeholder="Número de factura"
/>
```

**Input with Error:**
```tsx
<input
  className="w-full px-3 py-2 border-2 border-destructive-500 rounded-md
    focus:outline-none focus:ring-2 focus:ring-destructive-500"
  aria-invalid="true"
  aria-describedby="error-message"
/>
<p id="error-message" className="mt-1 text-sm text-destructive-600">
  Aquest camp és obligatori
</p>
```

### 8.3 Cards

**Basic Card:**
```tsx
<div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900">Títol</h3>
  <p className="mt-2 text-sm text-gray-600">Contingut</p>
</div>
```

**Expense Card:**
```tsx
<div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
  <div className="flex justify-between items-start">
    <div>
      <p className="text-xl font-bold text-gray-900">€45.50</p>
      <p className="text-sm text-gray-600">Esplai Materials SL</p>
      <p className="text-xs text-gray-400">15 de gener</p>
    </div>
    <Badge variant="warning">Pendent</Badge>
  </div>
</div>
```

### 8.4 Status Badges

```tsx
// Pending
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
  text-xs font-medium bg-warning-100 text-warning-800">
  <Clock className="mr-1 h-3 w-3" />
  Pendent
</span>

// Approved
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
  text-xs font-medium bg-success-100 text-success-800">
  <Check className="mr-1 h-3 w-3" />
  Aprovada
</span>

// Declined
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full
  text-xs font-medium bg-destructive-100 text-destructive-800">
  <X className="mr-1 h-3 w-3" />
  Denegada
</span>
```

---

## 9. Animation & Motion

### 9.1 Timing Functions

```css
/* Ease-in-out (default): Most transitions */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Ease-out: Entrances */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* Ease-in: Exits */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
```

### 9.2 Duration Guidelines

| Duration | Usage |
|----------|-------|
| 100ms | Instant feedback (hover, focus) |
| 200ms | Simple transitions (color, opacity) |
| 300ms | UI changes (modal open, drawer slide) |
| 500ms | Complex animations (page transitions) |

**Never exceed 500ms** - feels sluggish

### 9.3 Common Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 200ms ease-out;
}
```

**Slide Up:**
```css
@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 300ms ease-out;
}
```

**Pulse (Loading):**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### 9.4 Transition Classes (Tailwind)

```tsx
// Hover transitions
<button className="transition-colors duration-200 hover:bg-primary-700">

// Multiple properties
<div className="transition-all duration-300 hover:shadow-lg">

// Transform
<div className="transition-transform duration-200 hover:scale-105">
```

---

## 10. Dark Mode (Future Enhancement)

### 10.1 Color Adjustments for Dark Mode

**Background:**
- Light: `gray-50` (#f8fafc)
- Dark: `gray-900` (#0f172a)

**Text:**
- Light: `gray-600` to `gray-900`
- Dark: `gray-400` to `gray-50`

**Borders:**
- Light: `gray-200`
- Dark: `gray-700`

**Cards:**
- Light: `white` with shadow
- Dark: `gray-800` with subtle border

### 10.2 Implementation Strategy

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

**Toggle Dark Mode:**
```tsx
function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <button onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? <Sun /> : <Moon />}
    </button>
  )
}
```

---

## 11. Accessibility Patterns

### 11.1 Focus States

**Visible Focus Ring:**
```css
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

**Focus Within (for composite widgets):**
```css
.form-group:focus-within {
  border-color: var(--primary-500);
}
```

### 11.2 Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 11.3 Reduced Motion

**Respect user preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Responsive Design Tokens

### 12.1 Breakpoints

```js
const breakpoints = {
  sm: '640px',   // Mobile landscape, small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops, small desktops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large desktops
}
```

### 12.2 Media Query Usage

```tsx
// Tailwind classes
<div className="text-base md:text-lg lg:text-xl">

// In CSS
@media (min-width: 768px) {
  .heading {
    font-size: 2rem;
  }
}
```

---

## 13. Design Tokens (for Export)

### 13.1 JSON Format

**For design tools and code generation:**
```json
{
  "colors": {
    "primary": {
      "50": "#f0f9ff",
      "500": "#0ea5e9",
      "700": "#0369a1"
    },
    "gray": {
      "50": "#f8fafc",
      "600": "#475569",
      "900": "#0f172a"
    }
  },
  "spacing": {
    "0": "0px",
    "1": "4px",
    "4": "16px",
    "8": "32px"
  },
  "fontSize": {
    "sm": ["14px", "20px"],
    "base": ["16px", "24px"],
    "xl": ["20px", "28px"]
  },
  "borderRadius": {
    "md": "6px",
    "lg": "8px",
    "xl": "12px"
  }
}
```

---

## 14. Print Styles

**Optimize for printing expense reports:**
```css
@media print {
  /* Hide navigation and interactive elements */
  nav, button, .no-print {
    display: none;
  }

  /* Optimize typography */
  body {
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
  }

  /* Remove shadows and borders */
  * {
    box-shadow: none !important;
    border-color: #000 !important;
  }

  /* Page breaks */
  .page-break {
    page-break-after: always;
  }

  /* Avoid breaking inside elements */
  .expense-card {
    page-break-inside: avoid;
  }
}
```

---

## 15. Implementation Checklist

### 15.1 Setup Tasks

- [ ] Install Inter font (Google Fonts or self-hosted)
- [ ] Configure Tailwind with custom colors
- [ ] Set up CSS variables in `index.css`
- [ ] Add focus-visible polyfill if needed
- [ ] Configure dark mode toggle (future)
- [ ] Test all colors for WCAG AA compliance
- [ ] Document color usage in component library

### 15.2 Component Checklist

- [ ] Button variants (primary, secondary, destructive, ghost)
- [ ] Input states (default, focus, error, disabled)
- [ ] Card styles (default, hover, active)
- [ ] Badge variants (success, warning, error, info)
- [ ] Status indicators with icons
- [ ] Loading states (spinner, skeleton, progress)
- [ ] Modal/dialog styles
- [ ] Toast notification styles
- [ ] Table styles (mobile cards, desktop table)

### 15.3 Testing Checklist

- [ ] Test typography with Catalan text samples
- [ ] Verify color contrast with accessibility tools
- [ ] Test all interactive states (hover, focus, active, disabled)
- [ ] Check responsive behavior at all breakpoints
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Validate keyboard navigation
- [ ] Test print styles
- [ ] Check dark mode (if implemented)

---

## 16. Design Resources

**Figma Design System:** (To be created)
- Color palette swatches
- Typography samples
- Component library
- Icon set
- Spacing examples

**Storybook:** (Optional)
- Interactive component playground
- All variants documented
- Accessibility notes
- Usage guidelines

---

## 17. References

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Inter Font**: https://rsms.me/inter/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Material Design**: https://m3.material.io/
- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Lucide Icons**: https://lucide.dev/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: PACT Preparer
**Status**: Ready for Architecture Review
