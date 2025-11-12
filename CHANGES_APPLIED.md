# Changes Applied - 2025-11-12

## Summary
All requested changes have been successfully applied to both backend and frontend.

## Latest Fixes - Database Schema & Validation (2025-11-12 12:00)

### Fix 4: user_id Column Constraint

**Issue:** Expense creation failed with "null value in column user_id violates not-null constraint"

**Solution:** Made `user_id` column nullable since expenses can be submitted by users who provide their email/phone but aren't necessarily logged in.

**File:** `backend/fix-user-id.js` (migration script executed successfully)

```sql
ALTER TABLE expenses ALTER COLUMN user_id DROP NOT NULL
```

---

### Fix 3: Catalan Validation Messages + Missing Column

**Issues Reported:**
1. Validation error messages were in English, not Catalan
2. Creating expense failed with "column reference_number does not exist"

**Solutions:**

**Part 1: Added Missing Database Column**

**File: `backend/add-reference-number.js` (migration script)**

The expenses table was missing the `reference_number` column. Created migration script that:
1. Adds the `reference_number` column
2. Generates unique reference numbers for existing expenses (format: `EXP-YYYYMMDD-timestamp`)
3. Sets NOT NULL constraint
4. Adds UNIQUE constraint

**Migration executed successfully:**
```bash
✅ Successfully added reference_number column with constraints
```

**Part 2: Translated All Validation Messages to Catalan**

**File: `backend/src/validators/expense.validator.ts`**

Updated all error messages from English to Catalan:

| Field | English | Catalan |
|-------|---------|---------|
| Email | "Invalid email format" | "Format de correu electrònic invàlid" |
| Phone | "Phone number must be at least 9 characters" | "El telèfon ha de tenir almenys 9 caràcters" |
| Name | "Name must be at least 2 characters" | "El nom ha de tenir almenys 2 caràcters" |
| Surname | "Surname must be at least 2 characters" | "Els cognoms han de tenir almenys 2 caràcters" |
| Event | (default enum error) | "Selecciona un esdeveniment vàlid" |
| Category | (default enum error) | "Selecciona una categoria vàlida" |
| Type | (default enum error) | "Selecciona un tipus vàlid" |
| Invoice Number | "Invoice number is required" | "El número de factura és obligatori" |
| Date | "Must be a valid date in YYYY-MM-DD format" | "Ha de ser una data vàlida en format AAAA-MM-DD" |
| Vendor Name | "Vendor name must be at least 2 characters" | "El nom del proveïdor ha de tenir almenys 2 caràcters" |
| NIF (length) | "NIF must be at least 9 characters" | "El NIF ha de tenir almenys 9 caràcters" |
| NIF (format) | "NIF must contain only uppercase letters and numbers" | "El NIF només pot contenir lletres majúscules i números" |
| Amount | "Must be a valid number with up to 2 decimal places" | "Ha de ser un número vàlid amb fins a 2 decimals" |
| File URL | "Invalid file URL" | "URL del fitxer invàlida" |
| File Name | "File name is required" | "El nom del fitxer és obligatori" |
| Bank Account | "Bank account and account holder are required for reimbursable expenses" | "El compte bancari i el titular són obligatoris per a despeses reemborsables" |
| Description | "Description is required" | "La descripció és obligatòria" |

**Testing:**

Now when users enter invalid data, they will see clear Catalan error messages:

```json
// Example: Invalid NIF format
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El NIF només pot contenir lletres majúscules i números"
  }
}
```

---

## Previous Fix - Profile Persistence (2025-11-12 11:30)

### Issue
User reported that after saving profile data (phone, bank account), the values would disappear when refreshing the page, and the expense form wasn't auto-filling with the saved data. Database confirmed the data was saved correctly.

### Root Causes (Two Issues Fixed)

**Issue 1 - Backend Not Returning Profile Fields:**
The `/api/auth/me`, `/api/auth/login`, and `/api/auth/register` endpoints were only returning basic user fields (id, email, name, role) but NOT the new profile fields (phone, bankAccount, bankName, accountHolder). This meant the frontend never received the data even though it was in the database.

**Issue 2 - Frontend Form Not Updating:**
The ProfilePage component was using `defaultValues` in react-hook-form, which are only evaluated once on component mount. When the user data updated after saving, the form didn't re-render with the new values from the updated auth store.

### Solutions Applied

**Part 1: Backend - Return Profile Fields**

**File: `backend/src/routes/auth.routes.ts`**

Updated three endpoints to include all profile fields in the response:

1. **GET /api/auth/me** (lines 184-187) - Added phone, bankAccount, bankName, accountHolder
2. **POST /api/auth/register** (lines 100-105) - Added all profile fields + createdAt, lastLogin
3. **POST /api/auth/login** (lines 157-162) - Added all profile fields + createdAt, lastLogin

**Code Changes:**
```typescript
// All three endpoints now return complete user object
data: {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  phone: user.phone || null,              // NEW
  bankAccount: user.bankAccount || null,  // NEW
  bankName: user.bankName || null,        // NEW
  accountHolder: user.accountHolder || null, // NEW
  createdAt: user.createdAt.toISOString(),
  lastLogin: user.lastLogin?.toISOString() || null,
}
```

**Part 2: Frontend - Form State Management**

**File: `frontend/src/pages/ProfilePage.tsx`**

1. **Added useEffect import** (line 6)
2. **Added `reset` to form destructuring** (line 37)
3. **Added useEffect hook** (lines 50-59) that watches the `user` object and calls `reset()` with the latest user data whenever it changes
4. **Changed defaultValues to empty strings** (lines 41-46) since the form is now populated by the useEffect

**File: `frontend/src/types/api.types.ts`**

Fixed User interface to match backend response:
- Changed `updatedAt` to `lastLogin`
- Made all optional fields explicitly `string | null` for type safety

**Code Changes:**
```typescript
// Added reset function
const {
  register,
  handleSubmit,
  reset,  // NEW
  formState: { errors, isDirty },
} = useForm<ProfileFormData>({
  resolver: zodResolver(profileSchema),
  defaultValues: {
    phone: '',
    bankAccount: '',
    bankName: '',
    accountHolder: '',
  },
})

// Added useEffect to sync form with user data
useEffect(() => {
  if (user) {
    reset({
      phone: user.phone || '',
      bankAccount: user.bankAccount || '',
      bankName: user.bankName || '',
      accountHolder: user.accountHolder || '',
    })
  }
}, [user, reset])
```

### How It Works Now

1. **Save Flow:**
   - User enters phone/bank data in profile form
   - Clicks "Desar canvis" (Save changes)
   - Backend saves to database
   - Backend returns updated user object
   - `useProfile.ts` hook calls `setAuth(user, token)` (line 16)
   - Auth store updates with new user data
   - Auth store persists to localStorage
   - Profile form useEffect detects user change
   - Form resets with new values
   - ✅ Form now shows saved values

2. **Refresh Flow:**
   - Page refreshes
   - Zustand loads auth store from localStorage
   - User object includes phone/bank data
   - Profile form useEffect runs
   - Form populates with saved data
   - ✅ Values persist after refresh

3. **Auto-Fill Flow:**
   - User navigates to `/expenses/new`
   - NewExpensePage useEffect runs (lines 58-81)
   - Reads user data from auth store
   - Pre-fills name, surname, email, phone, bankAccount, accountHolder
   - ✅ Expense form auto-filled with profile data

### Testing Instructions

1. **Test Profile Save:**
   - Go to `/profile`
   - Enter phone: "+34617690940"
   - Enter IBAN: "ES23434"
   - Enter bank name: "Caixa"
   - Enter account holder: "Sergi Reina"
   - Click "Desar canvis"
   - ✅ Values should remain visible in the form

2. **Test Profile Persistence:**
   - After saving profile, refresh the page (F5 or Cmd+R)
   - ✅ Form should still show your saved values

3. **Test Auto-Fill:**
   - Navigate to `/expenses/new`
   - ✅ Form should be pre-filled with:
     - Name: "Sergi"
     - Surname: "Reina"
     - Email: "sreinami@gmail.com"
     - Phone: "+34617690940"
     - Bank Account: "ES23434"
     - Account Holder: "Sergi Reina"

### Files Modified
- `backend/src/routes/auth.routes.ts` - Return profile fields in all auth endpoints
- `frontend/src/pages/ProfilePage.tsx` - Form state management with useEffect
- `frontend/src/types/api.types.ts` - Fixed User interface type

---

## Backend Changes

### 1. Database Schema (`backend/src/db/schema.ts`)
**Profile Table - Added Fields:**
- `phone` (TEXT, optional) - Phone number
- `bankAccount` (TEXT, optional) - IBAN or bank account number
- `bankName` (TEXT, optional) - Name of the bank
- `accountHolder` (TEXT, optional) - Account holder name

**Event Enum - Updated to Catalan Values:**
```typescript
'peregrinatge_estiu_roma'  // Peregrinatge d'estiu (Roma)
'bartimeu'                 // Bartimeu
'be_apostle'               // Be apostle
'emunah'                   // Emunah
'escola_pregaria'          // Escola de pregària
'exercicis_espirituals'    // Exercicis espirituals
'har_tabor'                // Har Tabor
'nicodemus'                // Nicodemus
'trobada_adolescents'      // Trobada adolescents
'equip_dele'               // Equip Dele
'general'                  // General
```

**Category Enum - Updated to Catalan Values:**
```typescript
'menjar'                  // Menjar per activitats o reunions
'transport'               // Transport
'material_activitats'     // Material per activitats o reunions
'dietes'                  // Dietes
'impresos_fotocopies'     // Impresos i fotocòpies
'web_xarxes'             // Web/Xarxes socials
'casa_convis'            // Casa de convis
'formacio'               // Formació
'cancellacions'          // Cancel·lacions
'material_musica'        // Material música
'reparacions'            // Reparacions
'mobiliari'              // Mobiliari
```

### 2. Validation (`backend/src/validators/expense.validator.ts`)

**Date Format:**
- Changed from: ISO 8601 datetime (`2024-11-12T00:00:00.000Z`)
- Changed to: Simple date format (`2024-11-12`)
- Pattern: `YYYY-MM-DD`

**Bank Account Validation:**
- **Before**: Required for both `reimbursable` AND `payable` expenses
- **After**: Required ONLY for `reimbursable` expenses
- **Impact**: "a pagar" (payable) expenses no longer require bank account details

**Enum Values:**
- Updated event enum values to match schema
- Updated category enum values to match schema

### 3. Database Migration
**Script**: `backend/update-schema.js`

**Changes Applied:**
1. ✅ Added 4 new columns to profiles table
2. ✅ Created new event enum type with Catalan values
3. ✅ Created new category enum type with Catalan values
4. ✅ Migrated expenses table to use new enum types
5. ✅ Dropped old enum types
6. ✅ Set NOT NULL constraints on required fields

## Frontend Changes

### 1. Constants (`frontend/src/lib/constants.ts`)

**Event Constants - Updated:**
```typescript
export const EVENTS = {
  PEREGRINATGE_ESTIU_ROMA: 'peregrinatge_estiu_roma',
  BARTIMEU: 'bartimeu',
  BE_APOSTLE: 'be_apostle',
  // ... all 11 events
}

export const EVENT_LABELS = {
  peregrinatge_estiu_roma: 'Peregrinatge d\'estiu (Roma)',
  bartimeu: 'Bartimeu',
  // ... with proper Catalan labels
}
```

**Category Constants - Updated:**
```typescript
export const CATEGORIES = {
  MENJAR: 'menjar',
  TRANSPORT: 'transport',
  MATERIAL_ACTIVITATS: 'material_activitats',
  // ... all 12 categories
}

export const CATEGORY_LABELS = {
  menjar: 'Menjar per activitats o reunions',
  transport: 'Transport',
  // ... with proper Catalan labels
}
```

### 2. Types (`frontend/src/types/api.types.ts`)

**User Interface - Added Fields:**
```typescript
export interface User {
  // ... existing fields
  phone?: string
  bankAccount?: string
  bankName?: string
  accountHolder?: string
}
```

## Testing

### Registration Test
```bash
curl -X POST 'http://localhost:3000/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sergi Reina","email":"test456@example.com","password":"Test1234"}'
```

**Result**: ✅ Success
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "fefe9324-afd7-4aa2-b282-80f8bc7af507",
      "email": "test456@example.com",
      "name": "Sergi Reina",
      "role": "viewer"
    }
  },
  "message": "Registration successful"
}
```

## How to See Changes

### Backend
The backend auto-restarts with tsx watch mode. Changes are live immediately.

### Frontend
**Refresh your browser** or rebuild:
```bash
cd frontend
npm run build  # Production build (already done)
# OR
npm run dev    # Development mode
```

Then **hard refresh** your browser:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

## Verification Checklist

✅ Backend schema updated with new enum values
✅ Backend validation updated (date format, bank data)
✅ Database migration applied successfully
✅ Frontend constants updated with new values
✅ Frontend types updated with profile fields
✅ Frontend builds without errors
✅ Registration endpoint tested and working

## Next Steps for User

1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. **Register with sreinami@gmail.com** - should now work!
3. **Fill out expense form** - you'll see:
   - New event options (Peregrinatge d'estiu, Bartimeu, etc.)
   - New category options (Menjar, Transport, etc.)
   - Date picker working with YYYY-MM-DD format
   - Bank account optional for "a pagar" expenses
4. **Update profile** with phone and bank details (coming in next update)

## Files Modified

### Backend (3 files)
- `src/db/schema.ts`
- `src/validators/expense.validator.ts`
- `update-schema.js` (migration script)

### Frontend (2 files)
- `src/lib/constants.ts`
- `src/types/api.types.ts`

## Known Issues
None - all changes applied successfully!
