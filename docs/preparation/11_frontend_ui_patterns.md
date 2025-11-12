# Frontend UI/UX Patterns: Expense Reimbursement System

## Executive Summary

This document provides comprehensive UI/UX research and practical recommendations for implementing a youth-friendly, mobile-first expense management interface. Based on 2025 industry best practices, this research focuses on creating a fast, accessible, and intuitive experience tailored for the Catalan youth ministry context (ages 12-30) handling 40-200 monthly expense submissions.

**Key Recommendations:**
- **Mobile-First Design**: Bottom navigation tabs, thumb-friendly zones, generous tap targets (44x44px minimum)
- **Youth-Friendly Aesthetics**: Move beyond corporate blue; incorporate warm, vibrant colors while maintaining accessibility
- **Progressive Disclosure**: Layer complexity to show essential features first
- **Receipt Capture Excellence**: Camera integration with alignment guides and immediate visual feedback
- **Fast Feedback Loops**: Real-time validation, optimistic UI updates, <3 second submission target

---

## 1. Modern Expense Management UI Patterns

### 1.1 Core Design Philosophy for 2025

**Minimalist & Clean Interfaces**
- Bare-bones interfaces that prioritize usability over decoration
- Emphasis on negative space and clear visual hierarchy
- Focus on essential actions, remove unnecessary UI elements
- Clean aesthetics with clear typography

**Mobile-First Imperative**
- 80%+ of volunteer users will access via mobile devices
- Design for mobile, enhance for desktop (not the reverse)
- Touch targets minimum 44x44px (WCAG 2.1 AA)
- Thumb-friendly zones: bottom 50% of screen for primary actions

**Progressive Disclosure**
- Don't overwhelm users with all features at once
- Reveal information in manageable layers
- Show advanced options only when needed
- Example: Basic form first → Optional fields collapsed → Advanced settings in modal

### 1.2 Visual Data Management Patterns

**Categorization with Icons**
Expense types should use recognizable icons for quick scanning:
- Transport: Car/Bus icon
- Food: Fork/Knife icon
- Accommodation: Bed icon
- Materials: Box icon
- Other: Three dots icon

**Status Visualization**
Use multiple indicators (not color alone for accessibility):
- ✅ Approved: Green + Check icon + "Aprovada"
- ⏳ Pending: Yellow + Clock icon + "Pendent de revisió"
- ❌ Declined: Red + X icon + "Denegada"
- 💰 Paid: Blue + Money icon + "Pagada"

**Progress Indicators**
- Linear progress bars for multi-step forms
- Circular progress for file uploads (with percentage)
- Skeleton screens during data loading
- Optimistic UI updates (show immediately, sync later)

### 1.3 Color Coding Best Practices

**Semantic Colors (with accessibility)**
```
Success: Green (#059669) + Check icon
Warning: Orange (#d97706) + Alert icon (use dark text)
Error: Red (#dc2626) + X icon
Info: Blue (#1d4ed8) + Info icon
Neutral: Gray (#6b7280)
```

**Important**: Never use color alone. Always pair with:
- Icon indicator
- Text label
- Pattern/texture (if needed for colorblind users)

### 1.4 Data Visualization for Admin Dashboard

**Spending Overview Cards**
```
┌─────────────────────────────┐
│  Total Pendent              │
│  €1,234.50                  │
│  ↑ 15% vs mes anterior      │
└─────────────────────────────┘
```

**Charts and Graphs**
- Pie charts: Expenses by category (max 5-6 slices)
- Line graphs: Spending trends over time
- Bar charts: Compare monthly/weekly spending
- Keep charts simple, avoid 3D effects

---

## 2. Receipt Submission UI/UX Patterns

### 2.1 Photo Capture Flow

**Pattern 1: Camera-First Approach** (Recommended)
```
User Journey:
1. Tap "Nova Despesa" (floating action button)
2. Camera opens immediately with alignment guide
3. User takes photo (or selects from gallery)
4. Preview with crop/rotate options
5. OCR processing (show loading animation)
6. Form pre-filled with OCR data (editable)
7. User reviews/edits
8. Submit
```

**Camera Interface Elements**
- **Alignment Guide**: Overlay rectangle showing receipt bounds
- **Flash Toggle**: Top-right corner
- **Camera/Gallery Switch**: Bottom-left corner
- **Capture Button**: Large circle at bottom center (80x80px)
- **Guidance Text**: "Centra la factura dins del rectangle"

**Mobile OS Integration**
On mobile, `<input type="file" accept="image/*" capture="environment">` triggers:
- iOS: Prompt for "Take Photo" or "Choose from Library"
- Android: Direct camera launch or file picker

### 2.2 File Upload UX Best Practices

**Upload Sources** (in priority order):
1. Camera (primary for mobile)
2. Photo library/gallery
3. File system (for desktop)
4. Future: Scan from another app

**Upload Feedback Pattern**
```tsx
// States to show:
- Idle: "Carrega una factura"
- Uploading: Progress bar with percentage "Carregant... 47%"
- Processing OCR: "Extraient dades..." (with spinner)
- Success: "Factura carregada!" (with checkmark, then form)
- Error: "Error al carregar. Torna-ho a provar" (with retry button)
```

**File Validation**
Display errors clearly with actionable guidance:
- ❌ "Fitxer massa gran. Màxim 5MB" (with current file size)
- ❌ "Format no compatible. Usa JPG, PNG o PDF"
- ✅ Show file preview immediately after selection

**User Control**
- **Remove Button**: X icon in top-right of thumbnail
- **Replace Option**: "Canviar foto" button below preview
- **Multiple Files**: Show thumbnails in horizontal scroll

### 2.3 Form Design Patterns

**Single Column Layout** (Mobile-First)
- Stack all form fields vertically
- One question per screen for complex flows
- Avoid side-by-side fields (difficult on mobile)

**Field Grouping**
```
Dades de la Factura
├── Número de factura
├── Data
└── Proveïdor

Imports
├── Subtotal
├── IVA
└── Total (auto-calculated, read-only)

Descripció
└── Comentaris (opcional)
```

**Smart Defaults & Autofill**
- Default date: Today
- Auto-calculate VAT: subtotal × 0.21
- Auto-calculate total: subtotal + VAT
- Remember last used vendor (autocomplete)

**Real-Time Validation**
- Validate on blur (not on every keystroke)
- Show success state: green border + checkmark
- Show error state: red border + error message below field
- Inline corrections: "El NIF ha de començar amb una lletra"

---

## 3. Admin Dashboard Workflow Patterns

### 3.1 Dashboard Layout Structure

**Top-Level Navigation**
```
┌─────────────────────────────────────────┐
│ [Logo] Despeses  Usuaris  Configuració │ [Avatar ▼]
└─────────────────────────────────────────┘
```

**Dashboard Sections**
```
┌──────────────────────────────────────────────┐
│  Resum Ràpid (Quick Stats Cards)            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Pend.│ │Aprov.│ │Pagat.│ │Total │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
├──────────────────────────────────────────────┤
│  Filtres i Cerca                             │
│  [Estat ▼] [Data ▼] [Usuari ▼] [🔍 Cerca]  │
├──────────────────────────────────────────────┤
│  Despeses per Revisar (Table/Cards)         │
│  ┌────────────────────────────────────────┐ │
│  │ ⏳ FAC-001 | €45.50 | Joan P. | 2 dies│ │
│  │ ⏳ FAC-002 | €120.00 | Maria G. | 1 dia│ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 3.2 Multi-Level Approval Patterns

**Simple Approval (1 Level) - Recommended for Youth Ministry**
```
User submits → Admin reviews → Approve/Decline → User notified
```

**Review Interface Elements**
- **Side-by-Side View**: Receipt image on left, details on right (desktop)
- **Stacked View**: Receipt top, details below (mobile)
- **Action Buttons**:
  - Primary: "Aprovar" (green, large)
  - Secondary: "Denegar" (red, outline)
  - Tertiary: "Sol·licitar més info" (gray, text)

**Bulk Actions**
For processing multiple expenses:
- Checkbox selection (with select all)
- Bulk approve (with confirmation dialog)
- Bulk export to CSV
- Filter by status before bulk action

### 3.3 Expense Detail View Pattern

**Information Hierarchy**
```
┌─────────────────────────────────────┐
│ ← Tornar                            │
│                                     │
│ Factura #FAC-2025-001               │
│ Estat: ⏳ Pendent de revisió        │
│                                     │
│ [Receipt Image Preview - clickable] │
│                                     │
│ Detalls de la Despesa               │
│ • Usuari: Joan Puig                │
│ • Data: 15 de gener de 2025        │
│ • Proveïdor: Esplai Materials SL   │
│ • Import: €45.50                   │
│ • IVA: €9.56                       │
│ • Total: €55.06                    │
│                                     │
│ Descripció                          │
│ Materials per activitat de Nadal   │
│                                     │
│ ──────────────────────────────      │
│                                     │
│ [Aprovar] [Denegar]                │
└─────────────────────────────────────┘
```

**Modal for Decline Reason**
```
┌────────────────────────────────┐
│ Denegar Despesa                │
│                                │
│ Motiu (obligatori):            │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │ (textarea)                 │ │
│ │                            │ │
│ └────────────────────────────┘ │
│                                │
│ [Cancel·lar] [Denegar]         │
└────────────────────────────────┘
```

---

## 4. User Flow Patterns

### 4.1 Onboarding for First-Time Users

**Goals:**
- Get user to first successful submission quickly
- Explain OCR benefit without overwhelming
- Build trust in the system

**Onboarding Flow (Optional Tooltips)**
```
Step 1: Welcome screen (skippable)
  "Benvingut! Envia les teves despeses en menys de 3 segons"

Step 2: Dashboard tour (skippable)
  Highlight: "Nova Despesa" button

Step 3: First submission guidance
  "Prova-ho ara! Fes una foto d'una factura"

Step 4: Success celebration
  "Genial! La teva primera despesa s'ha enviat correctament"
```

**Progressive Onboarding** (Recommended)
Instead of upfront tutorial, show contextual help:
- First time on form: "Consell: Pots editar les dades extretes de la foto"
- First OCR result: "Revisa que les dades siguin correctes abans d'enviar"
- After first approval: "La teva despesa ha estat aprovada! Rebràs un email"

### 4.2 Expense Submission Flow

**Happy Path (Target: <3 seconds)**
```
1. Tap "Nova Despesa" (0s)
2. Camera opens, take photo (1-2s)
3. OCR processing + form prefill (1s)
4. Review data (10-15s)
5. Tap "Enviar" (0.5s)
6. Success message (instant)
Total: ~15-20 seconds (well under target with OCR)
```

**Manual Entry Path** (Fallback)
```
1. Tap "Nova Despesa"
2. Tap "Entrada Manual" (skip camera)
3. Fill form fields manually
4. Upload receipt separately
5. Submit
```

**Draft Saving**
- Auto-save every 30 seconds
- Show "Desat" indicator
- "Esborranys" section on dashboard
- Resume from where user left off

### 4.3 Status Tracking Flow

**User Perspective**
```
Submission → Email confirmation
          → Dashboard shows "Pendent de revisió"
          → Wait for admin review
          → Push notification (optional)
          → Email: "Aprovada" or "Denegada"
          → Dashboard updates status
```

**Status Timeline Component**
```
┌──────────────────────────────────┐
│ Història                         │
│                                  │
│ ✅ 15 gen 10:30 - Enviada        │
│ ⏳ 15 gen 10:31 - Pendent...     │
│ ✅ 16 gen 14:22 - Aprovada       │
│    Per: Admin Name               │
└──────────────────────────────────┘
```

### 4.4 Notification Design

**In-App Notifications**
- Toast messages for immediate feedback
- Badge count on navigation
- Notification center (bell icon)

**Email Notifications** (Transactional)
Priority order:
1. Expense submitted (confirmation)
2. Expense approved (success)
3. Expense declined (needs action)
4. More info requested (needs action)
5. Weekly summary (digest)

**Push Notifications** (Future Enhancement)
Only for high-priority events:
- Expense declined (user needs to resubmit)
- Payment completed
- System maintenance

---

## 5. Mobile-First Navigation Patterns

### 5.1 Bottom Tab Navigation (Recommended)

**Optimal for Youth Users**
- 3-5 primary destinations
- Icons + labels (always visible)
- Active tab highlighted
- Thumb-friendly zone (bottom of screen)

**Tab Structure for Users:**
```
┌─────────────────────────────────────────┐
│                                         │
│        (Main Content Area)              │
│                                         │
│                                         │
└─────────────────────────────────────────┘
┌─────┬─────┬─────┬─────┬─────┐
│ 🏠  │ 💰  │  ➕ │ 📊  │ 👤  │
│Inici│Desp.│Nova │Hist.│Perf.│
└─────┴─────┴─────┴─────┴─────┘
```

**Tab Structure for Admins:**
```
┌─────┬─────┬─────┬─────┐
│ 📋  │ ✅  │ 👥  │ ⚙️  │
│Pend.│Aprov│Users│Conf.│
└─────┴─────┴─────┴─────┘
```

### 5.2 Floating Action Button (FAB)

**For Primary Action: "Nova Despesa"**
- Position: Bottom-right corner
- Size: 56x56px (material design standard)
- Color: Primary brand color
- Icon: Camera or Plus sign
- Elevation: Raised shadow
- Always visible (doesn't scroll away)

```tsx
// FAB Component
<button className="fixed bottom-20 right-4 w-14 h-14 bg-primary
  rounded-full shadow-lg flex items-center justify-center">
  <Camera className="w-6 h-6 text-white" />
</button>
```

### 5.3 Hamburger Menu vs. Bottom Nav

**Don't Use Hamburger Menu For:**
- Primary navigation (hides important actions)
- Frequently used features
- Main user flows

**Do Use Hamburger Menu For:**
- Secondary features (Help, Settings, About)
- Admin-only features
- Profile actions (Logout, Edit Profile)

### 5.4 Gesture Navigation Considerations

**Support Common Mobile Gestures:**
- Swipe left/right: Navigate between tabs or pages
- Pull to refresh: Update expense list
- Swipe item: Quick actions (approve/decline)
- Long press: Show contextual menu

---

## 6. Responsive Design Patterns

### 6.1 Breakpoint Strategy

**Mobile-First Breakpoints**
```css
/* Mobile: 0-639px (default styles) */
/* Tablet: 640px-1023px */
@media (min-width: 640px) { ... }
/* Desktop: 1024px+ */
@media (min-width: 1024px) { ... }
/* Large Desktop: 1280px+ */
@media (min-width: 1280px) { ... }
```

**Layout Transformations**
```
Mobile (default):
- Single column
- Stacked form fields
- Full-width buttons
- Bottom navigation

Tablet (640px+):
- Two-column forms (related fields)
- Side drawer navigation appears
- Cards in 2-column grid

Desktop (1024px+):
- Three-column layout for dashboard
- Side-by-side receipt + form
- Data tables (replacing cards)
- Top navigation bar
```

### 6.2 Component Adaptations

**Form Fields**
- Mobile: Full width, large tap targets
- Desktop: Max-width 500px, centered

**Data Tables**
- Mobile: Card view with key info
- Tablet: Horizontal scroll table
- Desktop: Full table with all columns

**Modals**
- Mobile: Full-screen overlay
- Desktop: Centered modal with backdrop

### 6.3 Touch Target Sizing

**WCAG 2.1 AA Requirements**
- Minimum: 44x44px (CSS pixels)
- Recommended: 48x48px
- Spacing between targets: 8px minimum

**Interactive Elements**
```css
button, a, input {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

---

## 7. Youth-Friendly Design Principles

### 7.1 Beyond Corporate Blue

**Youth-Oriented Color Approaches**
While financial apps traditionally use blue for trust, youth-focused apps can experiment with:
- **Warm Palettes**: Guava (orange-pink mix), coral, peach
- **Vibrant Accents**: Purple, teal, bright green
- **Friendly Neutrals**: Warm grays instead of cold grays

**Important Constraints**
- Must maintain WCAG 2.1 AA contrast (4.5:1)
- Financial context requires some professionalism
- Catalan cultural considerations

**Recommended Approach for Youth Ministry**
- Primary: Warm blue (#1d7ed8) - trust + friendly
- Secondary: Orange (#f97316) - energy, warmth
- Success: Green (#059669) - approval, positive
- Background: Warm white (#fafaf9)

### 7.2 Friendly Microcopy

**Replace Corporate Language:**
```
❌ "Submit Expense Report"
✅ "Envia la teva despesa"

❌ "Pending Administrator Review"
✅ "Esperant revisió 👀"

❌ "Transaction Declined"
✅ "Ups! Hem detectat un problema"

❌ "Upload Receipt Image"
✅ "Fes una foto de la factura 📸"
```

**Catalan Cultural Tone**
- Use informal "tu" form (not formal "vostè")
- Friendly but clear
- Encouraging, not patronizing
- Use emojis sparingly (only where it aids understanding)

### 7.3 Gamification Elements (Optional Future)

**Light Gamification Ideas:**
- Submission streaks: "3 despeses seguides envades correctament! 🔥"
- Progress badges: "Primera despesa enviada ✅"
- Leaderboard (if appropriate): "Despeses més ràpides"
- Fun illustrations for empty states

**Keep it Optional and Subtle**
- Don't force gamification on users who just want functionality
- Make it feel helpful, not childish
- Align with ministry values (collaboration, not competition)

---

## 8. Performance Patterns

### 8.1 Perceived Performance

**Instant Feedback**
- Button clicks: Immediate visual response (ripple effect)
- Form submission: Disable button + show spinner
- Page transitions: Smooth animations (but keep under 300ms)

**Optimistic UI**
Show expected result immediately, sync in background:
```
User submits expense →
  Immediately show "Enviat!" + add to list →
  API call happens in background →
  If error, revert + show error message
```

**Progressive Loading**
```
1. Show skeleton screens immediately (structure)
2. Load critical data first (expense list)
3. Load non-critical data second (statistics)
4. Lazy load images (receipts)
```

### 8.2 Skeleton Screens

**Better than spinners for perceived performance**
```tsx
// Expense Card Skeleton
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
</div>
```

### 8.3 Image Optimization

**Receipt Images**
- Upload: Max 5MB, compress before upload
- Storage: Generate thumbnail (200x200) + full size
- Display: Show thumbnail by default, full size on tap
- Format: WebP with JPEG fallback
- Lazy loading: Below the fold images

---

## 9. Error Handling & Empty States

### 9.1 Error Message Patterns

**Characteristics of Good Error Messages**
- Clear explanation of what went wrong
- Why it happened (if user needs to know)
- How to fix it (actionable)
- Friendly tone (not blaming user)

**Examples:**
```
❌ "Error 500"
✅ "No hem pogut desar la despesa. Torna-ho a provar."

❌ "Invalid input"
✅ "El NIF ha de començar amb una lletra (exemple: A12345678)"

❌ "Network error"
✅ "No hi ha connexió a internet. Verifica la teva connexió i torna-ho a provar."
```

### 9.2 Empty State Design

**First-Time User (No Expenses Yet)**
```
┌─────────────────────────────────┐
│        📋                       │
│                                 │
│  Encara no tens despeses       │
│                                 │
│  Envia la teva primera despesa  │
│  en menys de 3 segons!          │
│                                 │
│  [➕ Nova Despesa]              │
└─────────────────────────────────┘
```

**Filtered Results (No Matches)**
```
┌─────────────────────────────────┐
│        🔍                       │
│                                 │
│  No hem trobat despeses         │
│  amb aquests filtres            │
│                                 │
│  [Esborrar filtres]             │
└─────────────────────────────────┘
```

**Network Error**
```
┌─────────────────────────────────┐
│        📡                       │
│                                 │
│  No es pot connectar            │
│                                 │
│  Verifica la connexió i         │
│  torna-ho a provar              │
│                                 │
│  [Tornar a intentar]            │
└─────────────────────────────────┘
```

---

## 10. Accessibility Patterns in UI

### 10.1 Focus Indicators

**Visible keyboard focus** (WCAG 2.1 AA requirement)
```css
button:focus-visible,
input:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
```

### 10.2 Skip Links

**Allow keyboard users to skip to main content**
```tsx
<a href="#main-content"
   className="sr-only focus:not-sr-only">
  Saltar al contingut principal
</a>
```

### 10.3 ARIA Labels for Icon Buttons

```tsx
<button aria-label="Eliminar despesa">
  <Trash2 aria-hidden="true" />
</button>
```

### 10.4 Loading States for Screen Readers

```tsx
<div role="status" aria-live="polite">
  {isLoading && "Carregant despeses..."}
</div>
```

---

## 11. Design System Foundations

### 11.1 Spacing Scale (Tailwind Compatible)

```
0: 0px
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
16: 4rem (64px)
```

**Common Spacing Patterns:**
- Card padding: 4-6 (16-24px)
- Section spacing: 8-12 (32-48px)
- Form field gap: 4 (16px)
- Button padding: 3-4 (12-16px)

### 11.2 Border Radius Scale

```
none: 0
sm: 0.125rem (2px)
default: 0.25rem (4px)
md: 0.375rem (6px)
lg: 0.5rem (8px)
xl: 0.75rem (12px)
2xl: 1rem (16px)
full: 9999px (circular)
```

**Usage:**
- Buttons: lg (8px)
- Cards: xl (12px)
- Modals: 2xl (16px)
- Avatar: full (circular)

### 11.3 Shadow Scale

```
sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
default: 0 1px 3px 0 rgb(0 0 0 / 0.1)
md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

**Usage:**
- Cards: default or md
- Modals: xl
- FAB: lg
- Dropdown: lg

---

## 12. Animation & Transitions

### 12.1 Timing Guidelines

**Duration**
- Micro-interactions: 100-200ms (hover, focus)
- UI transitions: 200-300ms (modals, drawers)
- Page transitions: 300-500ms (route changes)
- Never exceed 500ms (feels sluggish)

**Easing Functions**
```css
/* Default: ease-in-out for most transitions */
transition: all 200ms ease-in-out;

/* Exits: ease-in (accelerate out) */
transition: transform 200ms ease-in;

/* Entrances: ease-out (decelerate in) */
transition: transform 300ms ease-out;
```

### 12.2 Common Animation Patterns

**Button Ripple Effect**
Material Design ripple on tap/click

**Toast Notifications**
Slide in from top or bottom with fade

**Modal Entrance**
Fade in backdrop + slide up modal

**Loading Spinners**
Smooth rotation, never jerky

**Skeleton Pulse**
Subtle shimmer effect

---

## 13. Print Styles (For Receipts)

**Print-Friendly Expense Summary**
```css
@media print {
  /* Hide navigation, buttons */
  nav, button, .no-print {
    display: none;
  }

  /* Optimize for printing */
  body {
    font-size: 12pt;
    color: black;
  }

  /* Show URLs for links */
  a[href]:after {
    content: " (" attr(href) ")";
  }
}
```

---

## 14. Component Pattern Library

### 14.1 Card Component Variations

**Expense Card (List View)**
```tsx
<div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="font-semibold text-gray-900">€45.50</h3>
      <p className="text-sm text-gray-600">Esplai Materials SL</p>
      <p className="text-xs text-gray-400">15 de gener, 2025</p>
    </div>
    <StatusBadge status="pending" />
  </div>
</div>
```

**Stat Card (Dashboard)**
```tsx
<div className="bg-gradient-to-br from-blue-500 to-blue-600
  rounded-xl p-6 text-white">
  <p className="text-sm opacity-90">Despeses Pendents</p>
  <p className="text-3xl font-bold mt-2">12</p>
  <p className="text-xs mt-2 opacity-75">↑ 3 des d'ahir</p>
</div>
```

### 14.2 Button Variants

**Primary Button**
```tsx
<button className="bg-primary text-white px-6 py-3 rounded-lg
  font-medium hover:bg-primary/90 transition">
  Enviar
</button>
```

**Secondary Button**
```tsx
<button className="border border-gray-300 text-gray-700 px-6 py-3
  rounded-lg font-medium hover:bg-gray-50 transition">
  Cancel·lar
</button>
```

**Destructive Button**
```tsx
<button className="bg-red-600 text-white px-6 py-3 rounded-lg
  font-medium hover:bg-red-700 transition">
  Eliminar
</button>
```

---

## 15. References & Resources

**Design Inspiration:**
- Dribbble: Search "expense tracker" for visual ideas
- Behance: Finance app UX case studies
- Mobbin: Mobile app UI patterns (requires subscription)
- UI8: Premium expense management templates

**UX Research:**
- Nielsen Norman Group: Form usability guidelines
- Baymard Institute: Mobile commerce UX research
- Material Design: Mobile patterns documentation
- Apple Human Interface Guidelines: iOS design principles

**Accessibility:**
- WebAIM: WCAG quick reference
- A11y Project: Accessibility checklist
- Inclusive Components: Accessible component patterns

---

## 16. Next Steps for Architecture Phase

The architecture team should use this research to:

1. **Create Component Hierarchy**: Map out all UI components needed
2. **Define Page Templates**: Dashboard, Form, Detail view, Admin panel
3. **Design Navigation Structure**: User vs Admin navigation flows
4. **Specify Interaction Patterns**: Hover states, focus states, loading states
5. **Create Wireframes**: Low-fidelity mockups of key screens
6. **Define Animation Strategy**: Which transitions to implement
7. **Document Component API**: Props and variants for each component

**Key Files to Create:**
- `04_frontend_architecture.md` - Detailed component structure
- `wireframes/` - Visual mockups of key screens
- `component-api.md` - Component specifications

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Author**: PACT Preparer
**Status**: Ready for Architecture Review
