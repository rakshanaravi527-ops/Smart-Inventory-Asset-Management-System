# Smart Inventory and Asset Management System
> Centralized digital asset lifecycle management for laboratory equipment and institutional assets in higher-education and department settings.

---

## 📌 Problem Solved
Educational and institutional laboratories historically tracked equipment across scattered paper registers and spreadsheets. This led to:
- Lack of real-time visibility into equipment availability and location
- Missed periodic calibration and routine safety inspections
- Inability to hold borrowers accountable for overdue or damaged items
- Tedious, error-prone manual inventory audits

**Smart Inventory & Asset Management System** solves this by establishing a unified digital registry covering the complete lifecycle: registration, QR tag printing, check-out/in workflows, recurring maintenance alarms, consumable reorder thresholds, and institutional PDF/CSV audit reports.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Recharts, `html5-qrcode`, `jspdf`, `jspdf-autotable`, `react-hot-toast`, `react-icons` |
| **Backend** | Node.js, Express.js REST API, JWT authentication, `bcryptjs`, `zod` validation, `multer` |
| **Database & ORM** | SQLite (with zero-setup local dev) via **Prisma ORM** (seamless switch to PostgreSQL) |
| **QR / Tagging** | `qrcode` (backend PNG generation), `html5-qrcode` (in-browser camera scanner) |
| **Scheduled Tasks** | `node-cron` (daily automated maintenance alerts & overdue return notices) |
| **Alerts & Mail** | In-app notification center + configurable Nodemailer SMTP transporter |
| **Testing** | Jest, Supertest |

---

## 👥 Role-Based Access Control (RBAC)

| Role | Permissions & Access Scope |
|---|---|
| **Admin** | Full system administration: manage users, create departments, view complete audit logs, approve asset retirements |
| **Lab Incharge / Store Manager** | Department-scoped management: register assets, edit equipment, schedule calibrations, log service, process checkouts, adjust consumables |
| **Staff / Student Scholar** | Equipment self-service: browse available assets, request checkouts, view personal usage history |
| **Department Head** | Read-only executive view: dashboard analytics, utilization trends, audit trail, compliance reports |

---

## 🔑 Demo Accounts

The database comes pre-seeded with realistic institutional demo data:

| Role | Email | Password |
|---|---|---|
| **System Administrator** | `admin@college.edu` | `admin123` |
| **Facility Admin** | `admin2@college.edu` | `admin123` |
| **CSE Lab Incharge** | `labincharge@college.edu` | `lab123` |
| **ECE Lab Incharge** | `labincharge2@college.edu` | `lab123` |
| **Research Scholar** | `staff@college.edu` | `staff123` |
| **Lab Assistant** | `staff2@college.edu` | `staff123` |
| **CSE Department Head** | `depthead@college.edu` | `dept123` |
| **ECE Department Head** | `depthead2@college.edu` | `dept123` |

*(Quick-login buttons are also provided directly on the Login page for convenience)*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or newer)
- npm

### 2. Backend Setup
```bash
cd backend

# Install dependencies (already completed)
npm install

# Push schema to SQLite database (already completed)
npx prisma db push

# Seed realistic demo data (departments, assets, users, logs)
npm run seed

# Run automated tests
npm test

# Start the backend server (starts on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies (already completed)
npm install

# Start Vite development server (starts on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📡 API Endpoint Reference

### Authentication & Profiles
- `POST /api/auth/login` — Authenticate user and issue JWT
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Asset Registry & Tagging
- `GET /api/assets` — Filterable, paginated asset registry (`search`, `status`, `categoryId`, `departmentId`)
- `POST /api/assets` — Register a new asset with auto-generated code (`AST-<DEPT>-00001`)
- `GET /api/assets/:id` — Full asset specification, custodian history, and maintenance tabs
- `PATCH /api/assets/:id` — Update asset specifications, condition, or consumable levels
- `DELETE /api/assets/:id` — Retire asset (requires reason, records approver)
- `GET /api/assets/:id/qr` — Generate high-resolution printable QR code PNG data URL
- `POST /api/assets/import` — Bulk import assets from CSV text

### Check-out & Check-in Station
- `POST /api/checkout` — Check out available asset with purpose and expected return
- `POST /api/checkout/:id/checkin` — Check in equipment, record condition on return (Good/Fair/Damaged)
- `GET /api/checkout` — Filterable usage logs and active loans

### Maintenance & Calibration Scheduler
- `GET /api/maintenance/upcoming` — Fetch upcoming due items (next 30 days) and overdue items
- `GET /api/maintenance/schedules` — List recurring maintenance schedules
- `POST /api/maintenance/schedules` — Create recurring interval schedule (`intervalDays`, `alertDaysBefore`)
- `POST /api/maintenance/logs` — Record completed service with technician notes and cost

### Stock & Consumables
- `GET /api/reports/stock` — Real-time consumable stock report with low-stock and excess-stock flags

### Analytics & Reports
- `GET /api/dashboard/stats` — Aggregate metrics (total, in use, maintenance, low stock, overdue)
- `GET /api/dashboard/charts/*` — Category, department, and status distributions
- `GET /api/reports/utilization` — Equipment usage frequency and idle asset detection
- `GET /api/reports/maintenance` — Service history log report
- `GET /api/reports/audit` — Tamper-proof audit trail

---

## 🔮 Future Extension Points (Architectural Roadmap)

The codebase has been designed with clean extension points for institutional scalability:

1. **PostgreSQL Migration**:
   - In `backend/prisma/schema.prisma`, simply replace `provider = "sqlite"` with `provider = "postgresql"` and configure `DATABASE_URL="postgresql://user:pass@host:5432/dbname"`.
2. **RFID Hardware Scanner Integration**:
   - The `Asset` model already includes unique `assetCode` and `serialNumber` indexes. An additional `rfidTag` string field can be linked to an RFID reader daemon posting to `POST /api/checkout/rfid-scan`.
3. **Institutional ERP & Financial Integration**:
   - Asset models can link to institutional PO vouchers by adding optional `purchaseOrderId` and `grantBudgetCode` fields.
4. **Mobile Native Scanner**:
   - The REST API provides full JSON payloads with standard `Bearer` token authentication, allowing a React Native or Flutter mobile app to consume the existing endpoints without modifications.

