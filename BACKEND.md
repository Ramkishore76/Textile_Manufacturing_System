# ⚙️ AGT Textile Mills — Backend API Architecture & Services

[![Node.js](https://img.shields.io/badge/Runtime-Node.js%20v24%20LTS-43853D?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Framework-Express%20v4.21-000000?logo=express&logoColor=white)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20v5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Security](https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt-FF6B6B?logo=auth0&logoColor=white)](#-security--authentication)

This document provides complete documentation of the **Backend REST API Engine** powering AGT Textile Mills, including route controllers, transactional workflows, authentication, role authorization, and audit logging.

---

## 🏛️ Architecture Overview

The backend engine is organized into modular services and controllers executing on Node.js and TypeScript, communicating with the Supabase PostgreSQL database via Prisma ORM:

```
server/src/
├── db/
│   ├── prisma.ts           # Prisma client connection singleton
│   └── dbCheck.ts          # Database diagnostic and row verification tool
├── middleware/
│   └── auth.ts             # JWT authentication, role guards & buyer isolation
├── services/
│   └── auditService.ts     # Immutable system audit trail service
├── routes/
│   ├── auth.routes.ts      # Authentication, login, role check
│   ├── buyer.routes.ts     # Internal buyer directory & profiles
│   ├── inventory.routes.ts # Yarn stock, BOM formulations, reservations
│   ├── purchase.routes.ts  # Purchase requests, vendor POs, GRN inward
│   ├── order.routes.ts     # Buyer orders, BOM shortage checks
│   ├── machine.routes.ts   # Looms, spinning frames, status & downtime
│   ├── production.routes.ts# Production jobs, stage scheduling, hourly logs
│   ├── quality.routes.ts   # 4-Point fabric inspection & rework tracking
│   ├── roll.routes.ts      # Roll serialization, FG stock, traceability
│   ├── dispatch.routes.ts  # Atomic shipments, duplicate checks, invoices
│   ├── invoice.routes.ts   # Commercial invoices, 5% GST calculation
│   ├── payment.routes.ts   # Remittances, unique transaction ref checks
│   ├── employee.routes.ts  # Plant staff registry & base wage rates
│   ├── attendance.routes.ts# Shift attendance roster & overtime hours
│   ├── wage.routes.ts      # Attendance-derived payroll calculation
│   ├── expense.routes.ts   # Plant overhead expenses & categorization
│   ├── report.routes.ts    # Dashboard metrics, order margins, financials
│   ├── buyerPortal.routes.ts # Strictly isolated external buyer endpoints
│   └── notification.routes.ts# Real-time staff notifications
└── index.ts                # Express server entry point, CORS & logging
```

---

## 🔐 Security & Authentication

### Token Issuance & Verification
- **JWT Authorization:** Requests to protected endpoints must supply an `Authorization: Bearer <token>` HTTP header.
- **Payload:** User tokens contain `{ id, name, email, role, buyerId? }` signed with `JWT_SECRET`.
- **Role Verification Middleware (`requireRole`):** Rejects unauthorized requests with HTTP `403 Forbidden`.
- **Buyer Scoping Middleware (`requireBuyer`):** Forces all queries in `/api/buyer-portal/*` to the authenticated user's `buyerId`, preventing horizontal privilege escalation across buyer accounts.

---

## 📡 Complete REST API Endpoint Directory

### 1. Authentication & Users (`/api/auth`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates staff or buyer, returning JWT token & redirect URL |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated profile and active role |
| `GET` | `/api/auth/users` | `ADMIN` | Lists internal factory user accounts |
| `POST` | `/api/auth/users` | `ADMIN` | Creates new internal user account |

### 2. Orders & BOM Availability (`/api/orders`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/orders` | `ADMIN`, `SALES`, `STORE`, `PRODUCTION`, `DISPATCH`, `ACCOUNTS` | Lists all buyer orders with status filter |
| `POST` | `/api/orders` | `ADMIN`, `SALES` | Creates new order, evaluates BOM availability, auto-creates Purchase Requests if short |
| `GET` | `/api/orders/:id` | `ADMIN`, `SALES`, `STORE`, `PRODUCTION`, `QUALITY`, `DISPATCH`, `ACCOUNTS` | Returns order details, line items, and BOM requirement analysis |
| `POST` | `/api/orders/:id/reserve-materials` | `ADMIN`, `STORE`, `PRODUCTION` | Atomically allocates and reserves available yarn stock |

### 3. Inventory & Raw Materials (`/api/inventory`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/inventory/yarns` | All Internal | Returns yarn inventory, current stock, reserved stock, and low stock alerts |
| `POST` | `/api/inventory/yarns` | `ADMIN`, `STORE` | Registers new yarn raw material specification |
| `GET` | `/api/inventory/boms` | All Internal | Lists Bills of Materials formulations per fabric product |
| `POST` | `/api/inventory/boms` | `ADMIN`, `PRODUCTION` | Creates fabric BOM recipe with wastage percentages |
| `GET` | `/api/inventory/transactions` | `ADMIN`, `STORE`, `ACCOUNTS` | Double-entry stock transaction ledger |

### 4. Purchasing & GRN (`/api/purchases`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/purchases/requests` | `ADMIN`, `STORE`, `PRODUCTION` | Lists yarn purchase requests and shortage alerts |
| `PUT` | `/api/purchases/requests/:id/status` | `ADMIN`, `STORE` | Approves or rejects purchase request |
| `GET` | `/api/purchases/suppliers` | `ADMIN`, `STORE` | Vendor registry with lead times and ratings |
| `POST` | `/api/purchases/orders` | `ADMIN`, `STORE` | Generates official supplier Purchase Order (PO) |
| `POST` | `/api/purchases/grn` | `ADMIN`, `STORE` | Records Goods Receipt Note (GRN) and increments warehouse stock |

### 5. Machines & Production Scheduling (`/api/machines`, `/api/production`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/machines` | All Internal | Returns machine status (`RUNNING`, `IDLE`, `MAINTENANCE`, `BREAKDOWN`) |
| `PUT` | `/api/machines/:id/status` | `ADMIN`, `PRODUCTION` | Updates loom operational status |
| `GET` | `/api/production/jobs` | `ADMIN`, `PRODUCTION` | Lists scheduled production jobs across stages |
| `POST` | `/api/production/jobs` | `ADMIN`, `PRODUCTION` | Schedules job; rejects assignments to running machines |
| `POST` | `/api/production/jobs/:id/logs` | `ADMIN`, `PRODUCTION` | Records hourly production meter logs and downtime |

### 6. Quality Control & Inspection (`/api/quality`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/quality/inspections` | `ADMIN`, `QUALITY`, `PRODUCTION` | Lists 4-point fabric roll inspections |
| `POST` | `/api/quality/inspect` | `ADMIN`, `QUALITY` | Records defect points; auto-assigns Grade A/B/C or triggers Rework |
| `POST` | `/api/quality/rework/:id/action` | `ADMIN`, `QUALITY`, `PRODUCTION` | Logs rework actions and schedules re-inspection |

### 7. Rolls & Finished Goods Warehouse (`/api/rolls`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/rolls` | All Internal | Lists fabric rolls with barcode IDs and quality status |
| `GET` | `/api/rolls/finished-stock` | All Internal | Rolls in finished warehouse ready for dispatch |
| `GET` | `/api/rolls/:rollId` | All Internal | End-to-end traceability passport (yarn, loom, operator, QC) |

### 8. Atomic Dispatch & Fulfilment (`/api/dispatch`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/dispatch/eligible-rolls/:orderId` | `ADMIN`, `DISPATCH`, `SALES` | Lists passed rolls eligible for dispatch |
| `POST` | `/api/dispatch/create` | `ADMIN`, `DISPATCH` | **Interactive Transaction:** Prevents duplicate dispatches, changes roll status to `DISPATCHED`, updates order status, generates 5% GST invoice, and notifies buyer |
| `GET` | `/api/dispatch/history` | `ADMIN`, `DISPATCH`, `SALES`, `ACCOUNTS` | Consignment shipping history and carrier tracking |

### 9. Commercial Invoices, Payments & Expenses (`/api/invoices`, `/api/payments`, `/api/expenses`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | `ADMIN`, `ACCOUNTS`, `SALES`, `DISPATCH` | Lists commercial tax invoices |
| `POST` | `/api/payments` | `ADMIN`, `ACCOUNTS` | **Atomic Payment:** Rejects duplicate bank references, decrements balance, updates status to `PAID` |
| `GET` | `/api/expenses` | `ADMIN`, `ACCOUNTS`, `PRODUCTION` | Lists manufacturing overhead expenses |
| `POST` | `/api/expenses` | `ADMIN`, `ACCOUNTS` | Records plant overhead expense with cost category |

### 10. HR, Attendance & Wage Payroll (`/api/attendance`, `/api/wages`, `/api/employees`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/employees` | `ADMIN`, `HR`, `ACCOUNTS`, `PRODUCTION` | Workforce directory and base wage rates |
| `POST` | `/api/attendance` | `ADMIN`, `HR`, `PRODUCTION` | Daily shift presence, base hours, and overtime |
| `GET` | `/api/wages` | `ADMIN`, `ACCOUNTS`, `HR` | Monthly wage registers |
| `POST` | `/api/wages/calculate` | `ADMIN`, `ACCOUNTS`, `HR` | Compiles attendance logs into net monthly wages |
| `PUT` | `/api/wages/:id/status` | `ADMIN`, `ACCOUNTS` | Approves or marks wage record as settled |

### 11. Reports & Financial Profitability (`/api/reports`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/reports/dashboard` | All Internal | Real-time factory KPI metrics from database |
| `GET` | `/api/reports/order-cost/:orderId` | `ADMIN`, `ACCOUNTS`, `PRODUCTION`, `SALES` | Calculates BOM yarn cost + Loom operating cost + Overheads vs Revenue |
| `GET` | `/api/reports/financials` | `ADMIN`, `ACCOUNTS` | Factory financial summary and net profit margin |

### 12. Isolated Buyer Portal (`/api/buyer-portal`)
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/buyer-portal/dashboard` | `BUYER` Only | Buyer KPI summary and delivery schedule |
| `GET` | `/api/buyer-portal/orders` | `BUYER` Only | Orders belonging strictly to the authenticated buyer |
| `GET` | `/api/buyer-portal/orders/:id` | `BUYER` Only | 7-Stage visual progress bar, roll list, shipments |
| `GET` | `/api/buyer-portal/invoices` | `BUYER` Only | Commercial invoices billed to buyer |
| `GET` | `/api/buyer-portal/payments` | `BUYER` Only | Payment credit receipts history |

---

## ⚡ Concurrency & Transactional Guarantees

Critical business mutations execute within `prisma.$transaction(async (tx) => { ... })`:
- **Dispatch Creation (`POST /api/dispatch/create`):**
  1. Validates all roll IDs against the order.
  2. Asserts `qualityStatus === 'PASSED'`.
  3. Rejects with error if any roll has `inventoryStatus === 'DISPATCHED'`.
  4. Changes roll status to `DISPATCHED`.
  5. Computes order completion status (`DISPATCHED` vs `PARTIALLY_DISPATCHED`).
  6. Auto-generates Commercial Tax Invoice with 5% GST.
  7. Emits in-app notification to buyer portal.
- **Payment Recording (`POST /api/payments`):**
  1. Checks for existing `transactionReference` to prevent double-crediting.
  2. Updates invoice `paidAmount` and remaining `balanceAmount`.
  3. Sets invoice status to `PAID` or `PARTIALLY_PAID`.

---

## 🧪 Testing Backend Services

Run all 10 acceptance criteria tests:
```bash
# In workspace root
npx tsx tests/run-all-tests.mjs
```

### 🛰️ Runtime Diagnostics & System Telemetry
The backend provides real-time heap telemetry, server uptime, and database latency at `GET /api/system-status`.


---

*Maintained by the AGT Textile Mills Backend Engineering Team.*
