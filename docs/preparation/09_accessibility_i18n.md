# Accessibility and Catalan Internationalization

## Executive Summary

This document provides comprehensive guidance on implementing WCAG 2.1 AA accessibility compliance and Catalan language support for the Expense Reimbursement System. Accessibility ensures usability for all users including those with disabilities, while proper internationalization enables seamless Catalan language experience for the youth ministry in Catalonia.

**Key Requirements**:
- **WCAG 2.1 AA Compliance**: Required for public services in Spain
- **Primary Language**: Catalan (català)
- **Secondary Language**: Spanish (español) - optional fallback
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Tested with NVDA/VoiceOver
- **Color Contrast**: Minimum 4.5:1 for text

---

## 1. WCAG 2.1 AA Compliance Overview

### Four Principles: POUR

1. **Perceivable**: Information presented in ways users can perceive
2. **Operable**: User interface components must be operable
3. **Understandable**: Information and operation must be understandable
4. **Robust**: Content must work with current and future tools

### Essential Requirements

**Level A (Minimum)**:
- Text alternatives for non-text content
- Keyboard accessible
- Avoid seizure-inducing content
- Navigable content

**Level AA (Target)**:
- Color contrast ratio ≥ 4.5:1
- Resizable text up to 200%
- Multiple ways to find pages
- Meaningful sequence
- Consistent navigation

---

## 2. Semantic HTML and ARIA

### Proper HTML Structure

```tsx
// ✅ Good - Semantic HTML
function ExpenseForm() {
  return (
    <main>
      <h1>Nova Despesa</h1>

      <form aria-labelledby="form-title">
        <h2 id="form-title">Dades de la factura</h2>

        <div>
          <label htmlFor="invoice-number">
            Número de factura
            <span aria-label="obligatori">*</span>
          </label>
          <input
            id="invoice-number"
            type="text"
            required
            aria-required="true"
            aria-describedby="invoice-help"
          />
          <small id="invoice-help">
            El número que apareix a la factura
          </small>
        </div>

        <button type="submit">Enviar despesa</button>
      </form>
    </main>
  )
}

// ❌ Bad - No semantics
function ExpenseForm() {
  return (
    <div>
      <div className="title">Nova Despesa</div>
      <div>
        <div>Número de factura *</div>
        <div>
          <input type="text" />
        </div>
      </div>
      <div onClick={handleSubmit}>Enviar</div>
    </div>
  )
}
```

### ARIA Labels and Descriptions

```tsx
// Icon buttons need labels
<button
  aria-label="Eliminar despesa"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>

// Complex components need roles
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {uploadProgress}% carregat
</div>

// Form validation errors
<input
  id="amount"
  type="number"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'amount-error' : undefined}
/>
{hasError && (
  <div id="amount-error" role="alert">
    L'import ha de ser positiu
  </div>
)}
```

### Skip Links

```tsx
// components/SkipLinks.tsx
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Saltar al contingut principal
      </a>
      <a href="#navigation" className="sr-only focus:not-sr-only">
        Saltar a la navegació
      </a>
    </div>
  )
}

// Styles
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

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## 3. Keyboard Navigation

### Focus Management

```tsx
import { useRef, useEffect } from 'react'

function Modal({ isOpen, onClose, title, children }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus close button
      closeButtonRef.current?.focus()
    } else {
      // Restore focus when closed
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Trap focus inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      const firstElement = focusableElements?.[0] as HTMLElement
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement?.focus()
        e.preventDefault()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement?.focus()
        e.preventDefault()
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button ref={closeButtonRef} onClick={onClose}>
        Tancar
      </button>
    </div>
  )
}
```

### Keyboard Shortcuts

```tsx
import { useEffect } from 'react'

function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Ctrl/Cmd + N: New expense
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        navigate('/expenses/new')
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

      // ? key: Show keyboard shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
}

// Keyboard shortcuts help modal
function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTitle>Dreceres de teclat</DialogTitle>
      <table>
        <thead>
          <tr>
            <th>Drecera</th>
            <th>Acció</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><kbd>Ctrl</kbd> + <kbd>N</kbd></td>
            <td>Nova despesa</td>
          </tr>
          <tr>
            <td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
            <td>Desar</td>
          </tr>
          <tr>
            <td><kbd>?</kbd></td>
            <td>Mostrar dreceres</td>
          </tr>
        </tbody>
      </table>
    </Dialog>
  )
}
```

---

## 4. Color Contrast and Visual Design

### Color Contrast Requirements

**WCAG AA Requirements**:
- Normal text (< 18pt): Contrast ratio ≥ 4.5:1
- Large text (≥ 18pt or 14pt bold): Contrast ratio ≥ 3:1
- UI components and graphics: Contrast ratio ≥ 3:1

**Recommended Color Palette**:
```css
:root {
  /* Primary colors - 4.5:1 on white */
  --primary-600: #1d4ed8; /* Blue - passes AA */
  --primary-700: #1e40af;

  /* Success - 4.5:1 on white */
  --success-600: #059669; /* Green */

  /* Danger - 4.5:1 on white */
  --danger-600: #dc2626; /* Red */

  /* Warning - 4.5:1 on black */
  --warning-600: #d97706; /* Orange - use dark text */

  /* Text colors */
  --text-primary: #111827; /* 16.1:1 on white */
  --text-secondary: #6b7280; /* 4.9:1 on white */

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
}
```

### Don't Rely on Color Alone

```tsx
// ❌ Bad - Only color indicates status
<div className={expense.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
  {expense.status}
</div>

// ✅ Good - Icon + text + color
<div className={cn(
  'flex items-center gap-2',
  expense.status === 'approved' && 'text-green-600',
  expense.status === 'declined' && 'text-red-600'
)}>
  {expense.status === 'approved' && <CheckCircleIcon />}
  {expense.status === 'declined' && <XCircleIcon />}
  <span>{statusLabels[expense.status]}</span>
</div>
```

---

## 5. Catalan Language Implementation

### react-i18next Setup

**Installation**:
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

**Configuration**:
```typescript
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ca from './locales/ca.json'
import es from './locales/es.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ca: { translation: ca },
      es: { translation: es },
    },
    fallbackLng: 'ca', // Default to Catalan
    lng: 'ca', // Initial language
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
```

### Translation Files

**locales/ca.json**:
```json
{
  "common": {
    "submit": "Enviar",
    "cancel": "Cancel·lar",
    "delete": "Eliminar",
    "edit": "Editar",
    "save": "Desar",
    "loading": "Carregant...",
    "error": "Error",
    "success": "Èxit"
  },
  "auth": {
    "login": "Iniciar sessió",
    "logout": "Tancar sessió",
    "email": "Correu electrònic",
    "password": "Contrasenya",
    "forgotPassword": "Has oblidat la contrasenya?",
    "signUp": "Registrar-se"
  },
  "expenses": {
    "title": "Despeses",
    "newExpense": "Nova despesa",
    "invoiceNumber": "Número de factura",
    "vendor": "Proveïdor",
    "amount": "Import",
    "date": "Data",
    "status": "Estat",
    "receipt": "Factura",
    "uploadReceipt": "Carregar factura",
    "totalAmount": "Import total",
    "vatAmount": "Import IVA",
    "subtotal": "Subtotal"
  },
  "status": {
    "draft": "Esborrany",
    "submitted": "Enviada",
    "pending_review": "Pendent de revisió",
    "approved": "Aprovada",
    "declined": "Denegada",
    "paid": "Pagada"
  },
  "validation": {
    "required": "Aquest camp és obligatori",
    "invalidEmail": "Correu electrònic no vàlid",
    "minLength": "Mínim {{count}} caràcters",
    "maxLength": "Màxim {{count}} caràcters",
    "positiveNumber": "Ha de ser un número positiu",
    "invalidNIF": "NIF/CIF no vàlid"
  }
}
```

**locales/es.json**:
```json
{
  "common": {
    "submit": "Enviar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "save": "Guardar",
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Has olvidado la contraseña?",
    "signUp": "Registrarse"
  }
  // ... rest of translations
}
```

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next'

function ExpenseForm() {
  const { t } = useTranslation()

  return (
    <form>
      <h1>{t('expenses.newExpense')}</h1>

      <label htmlFor="vendor">
        {t('expenses.vendor')}
      </label>
      <input
        id="vendor"
        type="text"
        placeholder={t('expenses.vendor')}
      />

      <button type="submit">
        {t('common.submit')}
      </button>
    </form>
  )
}
```

### Pluralization

```json
{
  "expenses": {
    "count": "{{count}} despesa",
    "count_plural": "{{count}} despeses"
  }
}
```

```tsx
const { t } = useTranslation()

// Automatically uses singular/plural
<p>{t('expenses.count', { count: expenseCount })}</p>
```

### Date and Number Formatting

```typescript
import { useTranslation } from 'react-i18next'

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function ExpenseDetails({ expense }) {
  const { i18n } = useTranslation()
  const locale = i18n.language // 'ca' or 'es'

  return (
    <div>
      <p>{formatDate(expense.date, locale)}</p>
      <p>{formatCurrency(expense.amount, locale)}</p>
    </div>
  )
}
```

### Language Switcher

```tsx
import { useTranslation } from 'react-i18next'

function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Seleccionar idioma"
    >
      <option value="ca">Català</option>
      <option value="es">Español</option>
    </select>
  )
}
```

---

## 6. Screen Reader Support

### Live Regions

```tsx
// Announce dynamic content changes
function FileUpload() {
  const [status, setStatus] = useState('')

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        aria-describedby="upload-status"
      />

      <div
        id="upload-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status}
      </div>
    </div>
  )
}
```

### Descriptive Links

```tsx
// ❌ Bad
<a href="/expenses/123">Click here</a>

// ✅ Good
<a href="/expenses/123">
  Veure detalls de la despesa FAC-2025-001
</a>

// ✅ Better with context
<a href="/expenses/123" aria-label="Veure detalls de la despesa FAC-2025-001 de Proveïdor SL">
  Veure detalls
</a>
```

---

## 7. Form Accessibility

### Label Everything

```tsx
function AccessibleForm() {
  return (
    <form>
      {/* Visible label */}
      <label htmlFor="email">
        Correu electrònic
        <span aria-label="obligatori">*</span>
      </label>
      <input
        id="email"
        type="email"
        required
        aria-required="true"
        aria-describedby="email-help email-error"
      />
      <small id="email-help">
        Utilitzarem aquest correu per enviar-te notificacions
      </small>

      {/* Error message */}
      {error && (
        <div id="email-error" role="alert" className="text-red-600">
          {error}
        </div>
      )}

      {/* Radio group */}
      <fieldset>
        <legend>Tipus de despesa</legend>
        <div>
          <input
            type="radio"
            id="type-transport"
            name="expenseType"
            value="transport"
          />
          <label htmlFor="type-transport">Transport</label>
        </div>
        <div>
          <input
            type="radio"
            id="type-food"
            name="expenseType"
            value="food"
          />
          <label htmlFor="type-food">Menjar</label>
        </div>
      </fieldset>
    </form>
  )
}
```

---

## 8. Testing Accessibility

### Automated Testing

```bash
npm install -D @axe-core/react vitest-axe
```

```typescript
// tests/accessibility.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import ExpenseForm from './ExpenseForm'

expect.extend(toHaveNoViolations)

test('ExpenseForm has no accessibility violations', async () => {
  const { container } = render(<ExpenseForm />)
  const results = await axe(container)

  expect(results).toHaveNoViolations()
})
```

### Manual Testing Checklist

- ✅ Keyboard navigation works (Tab, Shift+Tab, Enter, Escape, Arrow keys)
- ✅ Screen reader announces all content (test with NVDA/VoiceOver)
- ✅ Color contrast meets 4.5:1 ratio
- ✅ All images have alt text
- ✅ All form inputs have labels
- ✅ Focus indicators visible
- ✅ No keyboard traps
- ✅ Skip links work
- ✅ Error messages announced
- ✅ Headings in logical order (h1 → h2 → h3)

---

## 9. Responsive and Mobile Accessibility

### Touch Targets

```css
/* Minimum touch target: 44x44px (WCAG 2.1 AA) */
button,
a,
input[type="checkbox"],
input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
}
```

### Mobile Navigation

```tsx
function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        aria-label="Obrir menú"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MenuIcon />
      </button>

      <nav
        id="mobile-menu"
        aria-label="Navegació principal"
        hidden={!isOpen}
      >
        {/* Menu items */}
      </nav>
    </>
  )
}
```

---

## 10. Official Resources

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **React i18next**: https://react.i18next.com/
- **Catalan Language**: https://www.uoc.edu/portal/ca/servei-linguistic/
- **Axe DevTools**: https://www.deque.com/axe/devtools/

---

## 11. Next Steps for Architecture

The architecture team should design:
1. Complete translation file structure
2. Language switcher UI/UX
3. Accessibility testing workflow
4. Screen reader testing protocol
5. Keyboard navigation flow diagrams
6. Focus management strategy
7. ARIA landmark structure
8. Mobile accessibility patterns
