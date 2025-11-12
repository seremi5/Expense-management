# Resend Email Service: Transactional Email Integration

## Executive Summary

This document provides comprehensive research on implementing Resend as the email notification service for the Expense Reimbursement System. Resend offers a modern, developer-friendly email API with excellent deliverability, React Email template support, and generous free tier perfect for small-scale applications.

**Key Advantages:**
- **Modern DX**: Clean REST API with official SDKs
- **React Email Integration**: Build templates with React components
- **High Deliverability**: DKIM/SPF/DMARC authentication
- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Webhook Support**: Track delivery, opens, clicks

**For 40-200 submissions/month**: ~800 emails/month (well within free tier) ✅

---

## 1. Resend Overview and Pricing

### Pricing (2025)

**Free Tier**:
- **3,000 emails/month**
- **100 emails/day**
- 1 custom domain
- 1 team member
- Webhook support

**Pro Plan ($20/month)**:
- 50,000 emails/month
- Unlimited custom domains
- Unlimited team members
- Email logs (30 days)

### Cost Analysis for Expense System

**Email Types and Volumes**:
```
Per submission (4 emails):
1. Confirmation email (to user)
2. Review request (to admin)
3. Status update - approved/declined (to user)
4. Payment confirmation (to user)

Monthly volumes (200 submissions):
- 200 confirmations
- 200 review requests
- 200 status updates
- 200 payment confirmations
= 800 emails/month

Additional:
- Password reset: ~20/month
- System notifications: ~50/month
Total: ~870 emails/month ✅ (well under 3,000 limit)
```

**Recommended Plan**: Free tier is sufficient

---

## 2. Setup and Configuration

### Create Resend Account

1. Sign up at: https://resend.com
2. Verify email address
3. Create API key

### Domain Configuration

**Add Your Domain**:
1. Go to **Domains** → **Add Domain**
2. Enter: `yourdomain.com`
3. Add DNS records:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Records (provided by Resend)
Type: TXT
Name: resend._domainkey
Value: [provided-by-resend]

# DMARC Record (optional but recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

4. Verify domain (usually takes 24-48 hours)

### Environment Variables

```bash
# Backend .env
RESEND_API_KEY="re_..." # Secret key
FROM_EMAIL="despeses@yourdomain.com"
FROM_NAME="Sistema de Despeses"
ADMIN_EMAIL="admin@yourdomain.com"
```

---

## 3. Node.js Integration

### Installation

```bash
npm install resend
```

### Resend Client Setup

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export const FROM_EMAIL = process.env.FROM_EMAIL!
export const FROM_NAME = process.env.FROM_NAME!
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

export { resend }
```

---

## 4. Email Templates with React Email

### Installation

```bash
npm install react-email @react-email/components
npm install -D @react-email/render
```

### Template Structure

```
emails/
├── templates/
│   ├── ExpenseSubmitted.tsx
│   ├── ExpenseApproved.tsx
│   ├── ExpenseDeclined.tsx
│   ├── ExpensePaid.tsx
│   ├── ReviewRequest.tsx
│   └── PasswordReset.tsx
├── styles/
│   └── common.ts
└── utils.ts
```

### Example Template: Expense Submitted (Catalan)

```tsx
// emails/templates/ExpenseSubmitted.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ExpenseSubmittedEmailProps {
  userName: string
  expenseId: string
  invoiceNumber: string
  amount: number
  vendor: string
  submittedAt: string
  dashboardUrl: string
}

export const ExpenseSubmittedEmail = ({
  userName = 'Usuari',
  expenseId = '123e4567-e89b-12d3-a456-426614174000',
  invoiceNumber = 'FAC-2025-001',
  amount = 125.50,
  vendor = 'Proveïdor SL',
  submittedAt = '15 de gener de 2025, 14:30',
  dashboardUrl = 'https://despeses.yourdomain.com/dashboard',
}: ExpenseSubmittedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Despesa #{invoiceNumber} rebuda correctament</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Despesa rebuda</Heading>

          <Text style={text}>
            Hola {userName},
          </Text>

          <Text style={text}>
            Hem rebut la teva sol·licitud de reemborsament. A continuació trobaràs
            el resum de la despesa:
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Número de factura:</Text>
            <Text style={infoValue}>{invoiceNumber}</Text>

            <Hr style={divider} />

            <Text style={infoLabel}>Proveïdor:</Text>
            <Text style={infoValue}>{vendor}</Text>

            <Hr style={divider} />

            <Text style={infoLabel}>Import total:</Text>
            <Text style={infoAmount}>{amount.toFixed(2)}€</Text>

            <Hr style={divider} />

            <Text style={infoLabel}>Data de presentació:</Text>
            <Text style={infoValue}>{submittedAt}</Text>
          </Section>

          <Text style={text}>
            El teu reemborsament està pendent de revisió per part de l'administració.
            Rebràs un correu electrònic quan s'hagi processat.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Veure detalls
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Sistema de Gestió de Despeses
            <br />
            Aquest és un correu automàtic, si us plau no responguis.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 40px',
}

const infoBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
}

const infoLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
}

const infoValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px 0',
}

const infoAmount = {
  color: '#059669',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
}

const buttonContainer = {
  margin: '32px 40px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 40px',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 40px',
  textAlign: 'center' as const,
}

export default ExpenseSubmittedEmail
```

### Additional Templates

**Review Request (Admin)**:
```tsx
// emails/templates/ReviewRequest.tsx
export const ReviewRequestEmail = ({
  adminName,
  userName,
  expenseId,
  invoiceNumber,
  amount,
  vendor,
  reviewUrl,
}: ReviewRequestEmailProps) => {
  return (
    <Html>
      {/* Similar structure */}
      <Text>
        Hola {adminName},
      </Text>
      <Text>
        {userName} ha presentat una nova despesa que requereix la teva revisió.
      </Text>
      {/* Expense details */}
      <Button href={reviewUrl}>
        Revisar despesa
      </Button>
    </Html>
  )
}
```

**Expense Approved**:
```tsx
export const ExpenseApprovedEmail = ({
  userName,
  invoiceNumber,
  amount,
  approvedBy,
  approvedAt,
  notes,
}: ExpenseApprovedEmailProps) => {
  return (
    <Html>
      <Heading>Despesa aprovada ✅</Heading>
      <Text>
        Bona notícia! La teva despesa #{invoiceNumber} ha estat aprovada.
      </Text>
      <Text style={successText}>
        Import aprovat: {amount.toFixed(2)}€
      </Text>
      {notes && (
        <>
          <Text style={infoLabel}>Notes de l'administrador:</Text>
          <Text style={notesBox}>{notes}</Text>
        </>
      )}
      <Text>
        Rebràs el pagament segons el calendari establert.
      </Text>
    </Html>
  )
}
```

**Expense Declined**:
```tsx
export const ExpenseDeclinedEmail = ({
  userName,
  invoiceNumber,
  amount,
  declinedBy,
  reason,
  canResubmit,
}: ExpenseDeclinedEmailProps) => {
  return (
    <Html>
      <Heading>Despesa denegada</Heading>
      <Text>
        Hola {userName},
      </Text>
      <Text>
        Lamentem informar-te que la teva despesa #{invoiceNumber} ha estat denegada.
      </Text>
      <Section style={warningBox}>
        <Text style={warningLabel}>Motiu:</Text>
        <Text style={warningText}>{reason}</Text>
      </Section>
      {canResubmit && (
        <Text>
          Pots tornar a presentar la despesa amb les correccions necessàries.
        </Text>
      )}
    </Html>
  )
}
```

---

## 5. Sending Emails

### Email Service Functions

```typescript
// services/email-service.ts
import { resend, FROM_EMAIL, FROM_NAME, ADMIN_EMAIL } from '@/lib/email'
import { render } from '@react-email/render'
import ExpenseSubmittedEmail from '@/emails/templates/ExpenseSubmitted'
import ReviewRequestEmail from '@/emails/templates/ReviewRequest'
import ExpenseApprovedEmail from '@/emails/templates/ExpenseApproved'
import ExpenseDeclinedEmail from '@/emails/templates/ExpenseDeclined'

interface SendExpenseSubmittedOptions {
  to: string
  userName: string
  expenseId: string
  invoiceNumber: string
  amount: number
  vendor: string
  submittedAt: Date
}

export async function sendExpenseSubmittedEmail(
  options: SendExpenseSubmittedOptions
) {
  const {
    to,
    userName,
    expenseId,
    invoiceNumber,
    amount,
    vendor,
    submittedAt,
  } = options

  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard/expenses/${expenseId}`

  const emailHtml = render(
    ExpenseSubmittedEmail({
      userName,
      expenseId,
      invoiceNumber,
      amount,
      vendor,
      submittedAt: submittedAt.toLocaleString('ca-ES', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
      dashboardUrl,
    })
  )

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Despesa rebuda: ${invoiceNumber}`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'expense-submitted',
        },
        {
          name: 'expense_id',
          value: expenseId,
        },
      ],
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

export async function sendReviewRequestEmail(
  options: {
    adminEmail: string
    adminName: string
    userName: string
    expenseId: string
    invoiceNumber: string
    amount: number
    vendor: string
  }
) {
  const reviewUrl = `${process.env.FRONTEND_URL}/admin/review/${options.expenseId}`

  const emailHtml = render(
    ReviewRequestEmail({
      ...options,
      reviewUrl,
    })
  )

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: options.adminEmail,
    subject: `Nova despesa per revisar: ${options.invoiceNumber}`,
    html: emailHtml,
    tags: [
      {
        name: 'category',
        value: 'review-request',
      },
    ],
  })

  if (error) throw error
  return data
}

export async function sendExpenseApprovedEmail(
  options: {
    to: string
    userName: string
    invoiceNumber: string
    amount: number
    approvedBy: string
    approvedAt: Date
    notes?: string
  }
) {
  const emailHtml = render(ExpenseApprovedEmail(options))

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: options.to,
    subject: `✅ Despesa aprovada: ${options.invoiceNumber}`,
    html: emailHtml,
    tags: [
      {
        name: 'category',
        value: 'expense-approved',
      },
    ],
  })

  if (error) throw error
  return data
}

export async function sendExpenseDeclinedEmail(
  options: {
    to: string
    userName: string
    invoiceNumber: string
    amount: number
    declinedBy: string
    reason: string
    canResubmit: boolean
  }
) {
  const emailHtml = render(ExpenseDeclinedEmail(options))

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: options.to,
    subject: `Despesa denegada: ${options.invoiceNumber}`,
    html: emailHtml,
    tags: [
      {
        name: 'category',
        value: 'expense-declined',
      },
    ],
  })

  if (error) throw error
  return data
}
```

### Integration with Expense Workflow

```typescript
// In your expense submission endpoint
router.post('/expenses', authenticate, async (req, res) => {
  try {
    // 1. Create expense in database
    const expense = await createExpense(req.body, req.userId!)

    // 2. Get user details
    const user = await getUserById(req.userId!)

    // 3. Send confirmation email to user
    await sendExpenseSubmittedEmail({
      to: user.email,
      userName: user.full_name,
      expenseId: expense.id,
      invoiceNumber: expense.invoice_number,
      amount: expense.total_amount,
      vendor: expense.vendor_name,
      submittedAt: expense.submitted_at,
    })

    // 4. Send review request to admin
    const admin = await getAdminUser()
    await sendReviewRequestEmail({
      adminEmail: admin.email,
      adminName: admin.full_name,
      userName: user.full_name,
      expenseId: expense.id,
      invoiceNumber: expense.invoice_number,
      amount: expense.total_amount,
      vendor: expense.vendor_name,
    })

    res.json({ success: true, expense })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to submit expense' })
  }
})
```

---

## 6. Error Handling and Retry Logic

### Retry Failed Emails

```typescript
async function sendEmailWithRetry<T>(
  sendFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await sendFn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors
      if ((error as any).statusCode === 400) {
        throw error
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error(`Email failed after ${maxRetries} attempts: ${lastError!.message}`)
}

// Usage
await sendEmailWithRetry(() =>
  sendExpenseSubmittedEmail(options)
)
```

### Email Queue (Background Processing)

```typescript
// Using a simple queue
interface EmailJob {
  id: string
  type: 'expense-submitted' | 'review-request' | 'expense-approved' | 'expense-declined'
  data: any
  attempts: number
  createdAt: Date
}

const emailQueue: EmailJob[] = []

export function queueEmail(type: EmailJob['type'], data: any) {
  emailQueue.push({
    id: randomUUID(),
    type,
    data,
    attempts: 0,
    createdAt: new Date(),
  })
}

// Process queue every minute
setInterval(async () => {
  while (emailQueue.length > 0) {
    const job = emailQueue.shift()!

    try {
      switch (job.type) {
        case 'expense-submitted':
          await sendExpenseSubmittedEmail(job.data)
          break
        case 'review-request':
          await sendReviewRequestEmail(job.data)
          break
        // ... other cases
      }
    } catch (error) {
      job.attempts++
      if (job.attempts < 3) {
        emailQueue.push(job) // Re-queue
      } else {
        console.error('Email failed permanently:', error)
        // Store in failed jobs table for manual review
      }
    }
  }
}, 60000) // Every minute
```

---

## 7. Webhooks for Delivery Tracking

### Setup Webhook Endpoint

```typescript
// routes/webhooks.ts
import express from 'express'
import { resend } from '@/lib/email'

const router = express.Router()

router.post('/resend', async (req, res) => {
  const event = req.body

  switch (event.type) {
    case 'email.sent':
      console.log('Email sent:', event.data.email_id)
      // Update email status in database
      break

    case 'email.delivered':
      console.log('Email delivered:', event.data.email_id)
      break

    case 'email.bounced':
      console.log('Email bounced:', event.data.email_id)
      // Handle bounce (invalid email, full mailbox, etc.)
      break

    case 'email.complained':
      console.log('Spam complaint:', event.data.email_id)
      // Handle spam complaint
      break

    case 'email.opened':
      console.log('Email opened:', event.data.email_id)
      break

    case 'email.clicked':
      console.log('Link clicked:', event.data.link)
      break
  }

  res.json({ received: true })
})

export default router
```

### Configure Webhook in Resend Dashboard

1. Go to **Settings** → **Webhooks**
2. Add endpoint: `https://yourapi.com/webhooks/resend`
3. Select events to subscribe to
4. Save and verify

---

## 8. Testing Email Templates

### Preview in Development

```bash
# Install React Email CLI
npm install -D @react-email/cli

# Start preview server
npm run email:dev
```

**package.json**:
```json
{
  "scripts": {
    "email:dev": "email dev -p 3001"
  }
}
```

Access at: `http://localhost:3001`

### Send Test Emails

```typescript
// scripts/test-email.ts
import { sendExpenseSubmittedEmail } from '@/services/email-service'

async function testEmail() {
  await sendExpenseSubmittedEmail({
    to: 'test@example.com',
    userName: 'Joan Martí',
    expenseId: 'test-123',
    invoiceNumber: 'FAC-2025-001',
    amount: 125.50,
    vendor: 'Proveïdor SL',
    submittedAt: new Date(),
  })

  console.log('Test email sent!')
}

testEmail()
```

---

## 9. Catalan Email Best Practices

### Language Consistency

- Use **formal Catalan** (vostè/vós) for professional communication
- Include accent marks: à, è, é, í, ï, ò, ó, ú, ü, ç
- Use proper Catalan date formats: `15 de gener de 2025`
- Currency format: `125,50€` (comma as decimal separator)

### Translation Guide

```typescript
const emailTranslations = {
  ca: {
    subject: {
      submitted: 'Despesa rebuda: {invoiceNumber}',
      approved: '✅ Despesa aprovada: {invoiceNumber}',
      declined: 'Despesa denegada: {invoiceNumber}',
      review: 'Nova despesa per revisar: {invoiceNumber}',
    },
    greeting: 'Hola {name},',
    footer: 'Aquest és un correu automàtic, si us plau no responguis.',
    // ... more translations
  },
  es: {
    subject: {
      submitted: 'Gasto recibido: {invoiceNumber}',
      approved: '✅ Gasto aprobado: {invoiceNumber}',
      declined: 'Gasto denegado: {invoiceNumber}',
      review: 'Nuevo gasto para revisar: {invoiceNumber}',
    },
    greeting: 'Hola {name},',
    footer: 'Este es un correo automático, por favor no respondas.',
  },
}
```

---

## 10. Monitoring and Analytics

### Track Email Metrics

```typescript
interface EmailMetrics {
  sent: number
  delivered: number
  bounced: number
  opened: number
  clicked: number
  complained: number
}

async function getEmailMetrics(dateRange: {
  from: Date
  to: Date
}): Promise<EmailMetrics> {
  // Query from webhook data stored in database
  const metrics = await db.query.emailLogs.findMany({
    where: and(
      gte(emailLogs.createdAt, dateRange.from),
      lte(emailLogs.createdAt, dateRange.to)
    ),
  })

  return {
    sent: metrics.filter(m => m.status === 'sent').length,
    delivered: metrics.filter(m => m.status === 'delivered').length,
    bounced: metrics.filter(m => m.status === 'bounced').length,
    opened: metrics.filter(m => m.status === 'opened').length,
    clicked: metrics.filter(m => m.status === 'clicked').length,
    complained: metrics.filter(m => m.status === 'complained').length,
  }
}
```

---

## 11. Free Tier Limitations and Monitoring

### Daily Limit (100 emails/day)

```typescript
async function checkDailyLimit(): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailLogs)
    .where(gte(emailLogs.createdAt, today))

  return count[0].count < 100
}

// Before sending
if (!(await checkDailyLimit())) {
  throw new Error('Daily email limit reached')
}
```

### Monthly Monitoring

```typescript
async function getMonthlyEmailCount(): Promise<number> {
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailLogs)
    .where(gte(emailLogs.createdAt, firstDayOfMonth))

  return result[0].count
}

// Alert if approaching limit
const monthlyCount = await getMonthlyEmailCount()
if (monthlyCount > 2700) { // 90% of 3,000
  console.warn(`Approaching monthly email limit: ${monthlyCount}/3000`)
}
```

---

## 12. Official Resources

- **Resend Documentation**: https://resend.com/docs
- **React Email**: https://react.email/
- **API Reference**: https://resend.com/docs/api-reference
- **Email Best Practices**: https://resend.com/docs/knowledge-base

---

## 13. Next Steps for Architecture

The architecture team should design:
1. Email notification preferences for users
2. Digest emails for multiple pending expenses
3. Email template versioning and A/B testing
4. Unsubscribe management
5. Email scheduling for batch processing
6. Fallback email templates (plain text)
7. Admin notification aggregation
8. Email audit trail and compliance logging
