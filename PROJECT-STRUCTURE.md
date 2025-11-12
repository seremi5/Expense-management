# Expense Management - Complete Project Structure

## 📁 Directory Layout

```
/Users/sergireina/Documents/GitHub/Expense-management/
│
├── 📂 docs/                         # Documentation (one level up from backend)
│   └── 📂 ocr/
│       ├── README.md                # 📖 START HERE - OCR overview & quick start
│       ├── gemini-api-overview.md   # Gemini 2.5 Flash Lite capabilities
│       ├── image-input-methods.md   # Base64 vs Files API
│       ├── structured-output.md     # JSON Schema for Gemini
│       ├── ocr-implementation-guide.md  # 🔥 Complete implementation walkthrough
│       ├── error-handling.md        # Validation, retry logic, circuit breaker
│       ├── security-best-practices.md   # API keys, encryption, GDPR
│       └── quick-reference.md       # Code snippets & common patterns
│
└── 📂 backend/                      # Backend application
    ├── .env                         # ⚙️ Configuration (YOUR GEMINI API KEY HERE)
    ├── .gitignore                   # Git ignore rules
    ├── package.json                 # Dependencies & scripts
    ├── tsconfig.json                # TypeScript config
    ├── README.md                    # 📖 Backend API documentation
    ├── TEST.md                      # 🧪 Testing guide & examples
    │
    └── 📂 src/
        ├── index.ts                 # 🚀 Main Express server entry point
        │
        ├── 📂 config/
        │   ├── env.ts               # Environment variables (updated for Gemini)
        │   └── constants.ts         # App constants
        │
        ├── 📂 db/
        │   ├── index.ts             # Database connection
        │   └── schema.ts            # Database schema
        │
        ├── 📂 schemas/              # ✨ JSON Schemas for OCR
        │   ├── index.ts             # Schema exports
        │   ├── invoice.schema.ts    # Invoice extraction schema
        │   └── receipt.schema.ts    # Receipt extraction schema
        │
        ├── 📂 services/             # 🎯 Core OCR Services
        │   ├── fileValidation.service.ts   # File validation (format, size, quality)
        │   ├── gemini.service.ts           # Gemini API client
        │   └── ocr.service.ts              # OCR orchestration (main service)
        │
        └── 📂 routes/               # 🛣️ API Routes
            └── ocr.routes.ts        # OCR endpoints
```

## 📍 File Locations

### Documentation (Read First!)
```bash
cd /Users/sergireina/Documents/GitHub/Expense-management

# View documentation
ls docs/ocr/

# Read main guide
cat docs/ocr/README.md
```

### Backend Code
```bash
cd /Users/sergireina/Documents/GitHub/Expense-management/backend

# Start server
npm run dev

# View backend docs
cat README.md
cat TEST.md
```

## 🔑 Key Files & What They Do

### Configuration
- **`backend/.env`** - Your API keys & settings (GEMINI_API_KEY here!)
- **`backend/src/config/env.ts`** - Loads & validates environment variables

### Services (Business Logic)
- **`backend/src/services/ocr.service.ts`** - Main OCR orchestration
- **`backend/src/services/gemini.service.ts`** - Gemini API communication
- **`backend/src/services/fileValidation.service.ts`** - File validation

### API
- **`backend/src/routes/ocr.routes.ts`** - OCR API endpoints
- **`backend/src/index.ts`** - Express server setup

### Schemas
- **`backend/src/schemas/invoice.schema.ts`** - Invoice JSON schema
- **`backend/src/schemas/receipt.schema.ts`** - Receipt JSON schema

### Documentation
- **`docs/ocr/README.md`** - Overview & quick start
- **`docs/ocr/ocr-implementation-guide.md`** - Complete implementation guide
- **`backend/README.md`** - Backend API documentation
- **`backend/TEST.md`** - Testing guide

## 🚀 Quick Start Paths

### 1. First Time Setup
```bash
# Navigate to backend
cd /Users/sergireina/Documents/GitHub/Expense-management/backend

# Install dependencies (already done)
# npm install

# Configure API key
nano .env
# Set: GEMINI_API_KEY=your_key_here

# Start server
npm run dev
```

### 2. Read Documentation
```bash
# Navigate to docs
cd /Users/sergireina/Documents/GitHub/Expense-management

# Read overview
cat docs/ocr/README.md

# Read implementation guide
cat docs/ocr/ocr-implementation-guide.md
```

### 3. Test OCR
```bash
# In another terminal
curl http://localhost:3000/health

curl -X POST http://localhost:3000/api/ocr/extract/invoice \
  -F "file=@your-invoice.pdf"
```

## 📂 What's Where

| What You Need | Where It Is |
|--------------|-------------|
| API Key Configuration | `backend/.env` |
| Start Server | `backend/` → `npm run dev` |
| API Endpoints | `backend/src/routes/ocr.routes.ts` |
| OCR Logic | `backend/src/services/ocr.service.ts` |
| File Validation | `backend/src/services/fileValidation.service.ts` |
| Gemini Client | `backend/src/services/gemini.service.ts` |
| Invoice Schema | `backend/src/schemas/invoice.schema.ts` |
| Receipt Schema | `backend/src/schemas/receipt.schema.ts` |
| Documentation | `docs/ocr/` |
| Testing Guide | `backend/TEST.md` |
| API Docs | `backend/README.md` |

## 🎯 Common Tasks

### View Documentation
```bash
cd ~/Documents/GitHub/Expense-management
ls -lh docs/ocr/
```

### Start Backend
```bash
cd ~/Documents/GitHub/Expense-management/backend
npm run dev
```

### Test API
```bash
# Health check
curl http://localhost:3000/health

# OCR health
curl http://localhost:3000/api/ocr/health

# Extract invoice
curl -X POST http://localhost:3000/api/ocr/extract/invoice \
  -F "file=@invoice.pdf"
```

### Edit Configuration
```bash
cd ~/Documents/GitHub/Expense-management/backend
nano .env
```

### View Logs
Server logs appear in the terminal where you ran `npm run dev`

## ✅ Verification Checklist

- [ ] Documentation exists: `ls ~/Documents/GitHub/Expense-management/docs/ocr/`
- [ ] Backend exists: `ls ~/Documents/GitHub/Expense-management/backend/src/`
- [ ] API key configured: `cat ~/Documents/GitHub/Expense-management/backend/.env | grep GEMINI_API_KEY`
- [ ] Server starts: `cd ~/Documents/GitHub/Expense-management/backend && npm run dev`
- [ ] Health check works: `curl http://localhost:3000/health`

## 🔗 File Relationships

```
.env (API Key)
    ↓
config/env.ts (Load config)
    ↓
services/gemini.service.ts (Use API)
    ↓
services/ocr.service.ts (Orchestrate)
    ↓
routes/ocr.routes.ts (Expose endpoints)
    ↓
index.ts (Run server)
```

## 📞 Need Help?

1. **Can't find docs?** They're at: `/Users/sergireina/Documents/GitHub/Expense-management/docs/ocr/`
2. **Can't start server?** Check: `/Users/sergireina/Documents/GitHub/Expense-management/backend/.env`
3. **Want to test?** Read: `/Users/sergireina/Documents/GitHub/Expense-management/backend/TEST.md`
4. **Need API reference?** See: `/Users/sergireina/Documents/GitHub/Expense-management/backend/README.md`

---

**All files saved and verified! ✅**
