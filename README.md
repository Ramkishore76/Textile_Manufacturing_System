# 🏭 AGT Textile Mills — Integrated Textile Manufacturing Management System

[![Live Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![ORM](https://img.shields.io/badge/ORM-Prisma%20v5.22-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![Backend](https://img.shields.io/badge/Backend-Express%20%2B%20TypeScript-3178C6?logo=typescript&logoColor=white)](https://expressjs.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Acceptance Tests](https://img.shields.io/badge/Tests-26%2F26%20PASSED-success?logo=checkmarx&logoColor=white)](#-acceptance-criteria--test-suite-results)

An end-to-end, enterprise-grade digital platform engineered for **AGT Textile Mills** to modernize and unify mill operations. This system eliminates manual registers, paper production slips, spreadsheets, and disconnected communications by establishing **one single source of truth** across the entire textile manufacturing lifecycle.

---

## 📑 Table of Contents
1. [Core Features & System Highlights](#-core-features--system-highlights)
2. [Dual Portal Architecture](#-dual-portal-architecture)
3. [Technology Stack](#-technology-stack)
4. [Live Supabase Database Setup](#-live-supabase-database-setup)
5. [Complete Manufacturing Lifecycle Modules](#-complete-manufacturing-lifecycle-modules)
6. [Acceptance Criteria & Test Suite Results (10/10 Passed)](#-acceptance-criteria--test-suite-results)
7. [Demo Accounts & Role Access Matrix](#-demo-accounts--role-access-matrix)
8. [Installation & Quick Start Guide](#-installation--quick-start-guide)
9. [Project Directory Structure](#-project-directory-structure)
10. [Multi-Token Collaborative Development Changelog](#-multi-token-collaborative-development-changelog)

---

## 🌟 Core Features & System Highlights

- **BOM Availability & Automated Purchase Requisitions:** Real-time stock reservation calculates yarn shortages based on fabric bills of materials with wastage allowances, triggering automated purchase requests.
- **Loom Scheduling & Conflict Prevention:** Production jobs check loom operational status (`RUNNING`, `IDLE`, `MAINTENANCE`, `BREAKDOWN`) and reject concurrent job assignments to running machines.
- **Roll-Level Traceability:** Every produced roll receives a unique tracking ID and barcode passport detailing its origin loom, shift, operator, raw material lot, and quality inspection metrics.
- **Atomic Dispatch Protection:** Interactive transactions prevent duplicate dispatches of the same roll, verify quality passing, update order progress, and auto-generate commercial invoices with 5% GST.
- **Financial Ledger & Profitability Explorer:** Real-time order-wise cost accounting calculates raw material consumption, loom operating machine hours, and direct overheads to yield actual gross profit margins.
- **Labour Attendance & Wage Engine:** Shift presence and overtime hours directly compute compliant monthly wages with adjustment slips.
- **Strictly Isolated Buyer Portal:** External buyers access an executive dashboard with a 7-stage visual lifecycle progress bar without access to internal factory costs, machine allocations, or other buyers' records.

---

## 🏛️ Dual Portal Architecture

```mermaid
graph TD
    subgraph Shared ["Shared Backend & Central Database"]
        DB[(Supabase PostgreSQL)]
        API["Express.js / TypeScript Core API Engine"]
        DB <--> API
    end

    subgraph Internal ["Internal Factory Portal (/app/*)"]
        Admin["Owner / Plant Admin"]
        Sales["Sales Desk"]
        Store["Store & Raw Material Mgr"]
        Prod["Production Supervisors"]
        QC["Quality Inspectors"]
        Disp["Logistics & Dispatch"]
        Acc["Accounts & HR Desk"]
    end

    subgraph External ["External Buyer Portal (/buyer/*)"]
        Buyer["Authenticated Global Buyers"]
    end

    Admin -->|Full Factory Oversight & Profitability| API
    Sales -->|Orders, Buyers & Pricing| API
    Store -->|Yarn Stock, Suppliers & GRN| API
    Prod -->|Loom Jobs & Shift Logs| API
    QC -->|Fabric Inspections & Defect Points| API
    Disp -->|Roll Dispatches & Transport Notes| API
    Acc -->|Invoices, Payments & Wages| API

    Buyer -->|Track Own Orders, Shipments & Invoices| API
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling & Design System** | Tailwind CSS v4, Lucide React Icons |
| **State & Routing** | React Router v7, Context API with JWT Persisted Storage |
| **Backend Runtime** | Node.js v24 LTS, Express.js, TypeScript |
| **Database & Cloud Hosting** | PostgreSQL live instance on **Supabase** (`ap-southeast-1` pooler) |
| **ORM & Migrations** | Prisma ORM v5.22 |
| **Schema Validation** | Zod v3.24 |
| **Security & Auth** | JSON Web Tokens (JWT), Bcrypt password hashing, Strict Role Middleware |
| **Test Suite** | Node.js ESM Test Runner (`tests/run-all-tests.mjs`) |

---

## 🗄️ Live Supabase Database Setup

The application is connected to a live, persistent Supabase PostgreSQL database:

```env
DATABASE_URL="postgresql://postgres.cipfdzjrlgtyletdcqql:%40Textile_Manufacturing@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

- **Host:** `aws-0-ap-southeast-1.pooler.supabase.com`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres.cipfdzjrlgtyletdcqql`
- **Models:** 32 comprehensive entities modeling users, buyers, yarn materials, suppliers, BOMs, orders, purchase requests, POs, GRNs, machines, production jobs, logs, rolls, quality inspections, reworks, FG locations, dispatches, invoices, payments, employees, attendance, wages, and expenses.

---

## 🔄 Complete Manufacturing Lifecycle Modules

### 1. Buyer Order & BOM Availability
- Registers buyer orders with color, delivery dates, and yardage.
- Evaluates Bill of Materials (BOM) against available yarn stock.
- If yarn is in stock, stock is atomically reserved (`reservedStock`).
- If yarn is insufficient, flags a **Material Shortage** and generates a Purchase Request.

### 2. Supplier PO & Goods Receipt (GRN)
- Converts approved purchase requests into Supplier Purchase Orders.
- Records Goods Receipt Notes (GRN) with batch lot numbers and quality acceptance.
- Updates physical warehouse inventory in real time.

### 3. Production Scheduling & Machine Monitoring
- Schedules jobs across Spinning, Weaving, and Dyeing stages.
- Validates loom availability (`IDLE` vs `RUNNING`).
- Records hourly shift production logs, meters woven, and scrap percentage.

### 4. 4-Point Fabric Quality & Rework Cycle
- Evaluates woven rolls using standard 4-point inspection criteria (holes, slubs, stains).
- Grades rolls (`GRADE_A`, `GRADE_B`, `GRADE_C`).
- Rolls with excessive points trigger `REWORK_REQUIRED` status, documenting defect types and root causes.
- After finishing/reprocessing, re-inspection certifies the roll for finished stock.

### 5. Finished Goods Warehouse & Traceability Passport
- Stores certified rolls in specific warehouse zones, racks, and bins (`A-01-01`).
- Digital passport provides complete genealogy: raw yarn lot, spinning/weaving loom, operator, and inspection score.

### 6. Atomic Dispatch & Invoice Generation
- Dispatch desk selects order rolls for shipment.
- **Duplicate Prevention:** Strict transaction check prevents dispatching any roll that has already been shipped.
- **Quality Check:** Rejects unapproved or rework rolls.
- Records carrier name, vehicle number, and tracking ID.
- Automatically generates a Commercial Tax Invoice with 5% GST and 30-day net payment terms.
- Triggers instant notification to the buyer's portal.

### 7. Accounts, Expenses & Profitability Explorer
- Records buyer payment receipts with unique bank reference validation.
- Tracks plant overhead expenses (Electricity, Power, Chemicals, Maintenance).
- Order-wise profit explorer aggregates raw material costs, machine hourly rates, and direct expenses to report true gross margin %.

### 8. Shift Attendance & Labour Wage Payroll
- Daily roster records Shift presence (`PRESENT`, `HALF_DAY`, `ABSENT`) and overtime hours.
- Wage calculator automatically compiles monthly base wages, overtime pay, and bonuses into auditable wage slips.

---

## ✅ Acceptance Criteria & Test Suite Results

The comprehensive automated test suite in [`tests/run-all-tests.mjs`](file:///c:/Users/Sathish%20B/OneDrive/Desktop/Textile_Mannufacturing_System/tests/run-all-tests.mjs) tests all 10 mandatory acceptance criteria against the live database:

```
========================================================================
  AGT TEXTILE MILLS — MANDATORY 10 ACCEPTANCE TESTS RUNNER
========================================================================

• Running TEST 1: Successful Order Lifecycle................... PASSED ✓
• Running TEST 2: Material Shortage Detection & Procurement.... PASSED ✓
• Running TEST 3: Quality Failure & Rework Tracking............ PASSED ✓
• Running TEST 4: Duplicate Dispatch Prevention................ PASSED ✓
• Running TEST 5: Strict Buyer Data Isolation.................. PASSED ✓
• Running TEST 6: Machine Conflict Prevention & Monitoring..... PASSED ✓
• Running TEST 7: Financial Accuracy & Payment Integrity...... PASSED ✓
• Running TEST 8: Database Records Persistence................. PASSED ✓
• Running TEST 9: Server Role Authorization.................... PASSED ✓
• Running TEST 10: Partial Delivery Fulfillment................ PASSED ✓

========================================================================
  TEST RESULTS: 10 PASSED, 0 FAILED (100% SUCCESS)
========================================================================
```

---

## 👥 Demo Accounts & Role Access Matrix

The application includes pre-configured demo accounts for all roles with one-click quick switching in the UI:

| Role | Email | Password | Primary Accessible Modules |
|---|---|---|---|
| **Admin / Owner** | `admin@agttextile.com` | `Admin@123` | Full access across all 12 modules, financial oversight & user management |
| **Sales Staff** | `sales@agttextile.com` | `Sales@123` | Orders, Buyer Registration, Invoices, Delivery Tracking |
| **Store Manager** | `store@agttextile.com` | `Store@123` | Yarn Inventory, Suppliers, Purchase Requests, POs & GRN Receipts |
| **Production Mgr** | `production@agttextile.com` | `Prod@123` | Loom Monitoring, Job Scheduling, Shift Logs, Machine Downtime |
| **Quality Inspector** | `quality@agttextile.com` | `Quality@123` | Roll Inspections, 4-Point Defect Logging, Rework Approvals |
| **Dispatch Staff** | `dispatch@agttextile.com` | `Dispatch@123` | Finished Goods Stock, Dispatch Planning, Logistics & Invoices |
| **HR / Accounts** | `accounts@agttextile.com` | `Accounts@123` | Commercial Invoices, Buyer Payments, Attendance, Wages & Expenses |
| **Buyer Portal** | `buyer@nordicapparel.com` | `Buyer@123` | Dedicated Buyer Portal: Active Orders, 7-Stage Progress Bar, Invoices |

---

## 🚀 Installation & Quick Start Guide

### Prerequisites
- Node.js v20+ / v24+
- pnpm or npm

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Ramkishore76/Textile_Manufacturing_System.git
cd Textile_Manufacturing_System

# Install root & workspace packages
npm install
```

### 2. Configure Environment Variables
Ensure [`server/.env`](file:///c:/Users/Sathish%20B/OneDrive/Desktop/Textile_Mannufacturing_System/server/.env) contains:
```env
PORT=5000
DATABASE_URL="postgresql://postgres.cipfdzjrlgtyletdcqql:%40Textile_Manufacturing@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="agt_textile_super_secure_jwt_secret_key_2026_xyz"
NODE_ENV="development"
```

### 3. Generate Prisma Client & Seed Database
```bash
cd server
npx prisma generate
npx tsx prisma/seed.ts
```

### 4. Run Development Servers
Start the backend API server:
```bash
# In server directory
npm run dev
# Server runs on http://localhost:5000
```

Start the Vite frontend:
```bash
# In client directory
npm run dev
# Client runs on http://localhost:5173
```

### 5. Run Automated Acceptance Tests
```bash
# From workspace root
npx tsx tests/run-all-tests.mjs
```

---

## 📁 Project Directory Structure

```
Textile_Manufacturing_System/
├── .agents/skills/          # Supabase agent skills & postgres best practices
├── client/                  # Frontend Application (React 19 + Vite + Tailwind v4)
│   ├── src/
│   │   ├── api/client.ts    # Unified Axios/Fetch API client with auth interceptor
│   │   ├── context/         # AuthContext & Session management
│   │   ├── components/      # Route guards & shared UI widgets
│   │   ├── layouts/         # AppLayout (Factory) & BuyerLayout (Client portal)
│   │   ├── pages/           # 12 Interactive Module Pages
│   │   ├── App.tsx          # Complete routing configuration & role guards
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                  # Backend Application (Express + TypeScript + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    # 32 PostgreSQL models & relations
│   │   └── seed.ts          # Comprehensive factory & buyer seed dataset
│   ├── src/
│   │   ├── db/prisma.ts     # Initialized Prisma client singleton
│   │   ├── middleware/      # Auth & role verification middleware
│   │   ├── services/        # Audit logging service
│   │   ├── routes/          # 15 modular REST route controllers
│   │   └── index.ts         # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── tests/
│   └── run-all-tests.mjs    # Complete 10-scenario automated acceptance test suite
├── .gitignore
├── .npmrc
├── package.json
└── README.md
```

---

## 🛍️ Dual-Mode Buyer Portal & Catalog Ordering Desk (`/buyer`)

The system features a dedicated, externally scoped Buyer Portal accessible at **`/buyer`** (or `/buyer/catalog`) with strict role-based separation:

### 1. Plant Owner (`ADMIN`) & Store Manager (`STORE`) Administrative Mode
* **Direct Access:** Launcher in the main factory navigation bar and sidebar ("Buyer Portal & Pricing ↗").
* **Live Specification & Cost Price Editor:** Click "Edit Details & Cost Price" on any fabric to modify:
  * Fabric name, code, fabric type, weave type, GSM, and width.
  * Unit cost price per meter (₹/m) with live persistence via `PUT /api/buyer-portal/products/:id`.
  * Technical descriptions and spinning requirements.
* **Security Guard:** Actual buyer accounts attempting to invoke product editing receive **HTTP 403 Forbidden**.
* **Customer Flow Simulator:** Built-in preview toggle to experience the buyer order placement view.

### 2. Actual Buyer (`BUYER`) Order Placement Desk
* **Product Catalog:** Fabric specification cards with available in-stock meters and real-time quotation rates.
* **Order Placement Modal:**
  * Quick meter selectors (`+500m`, `+1,000m`, `+2,500m`, `+5,000m`) and custom input (min. 10m).
  * Dye color swatches (Pure White, Optical White, Khaki Sand, Royal Navy, Indigo Blue, Sky Blue Melange, Carbon Black, Olive Army).
  * Delivery date selector and priority level tags.
  * Real-time calculation showing subtotal, 5% GST, and total quotation amount.
  * Instant order generation (`POST /api/buyer-portal/orders`), creating `ORD-2026-XXX` and notifying production desks.

---

## 🔍 Stage-Wise Quality Control & Production Governance

The system implements complete stage-wise quality inspection across all operations:
- **Operation Stages:** Spinning, Weaving, Dyeing, Printing, Finishing, and Final Inspection.
- **Stage Hold Gate:** Material is prevented from proceeding to the next manufacturing operation until required inspections pass or corrective actions are verified.
- **Visual Defect Evidence:** Quality inspectors capture photographic evidence directly using connected webcams or uploaded photos.
- **Client & Server Image Compression:** Defect photos are automatically compressed and thumbnail-generated for lightweight storage and fast shop-floor viewing.
- **Production Strategy Review:** Defect reports trigger alerts to the Production Manager with corrective instructions. The Production Manager reviews the defect evidence and updates the production strategy to resume operations.

---

## 👥 Multi-Token Collaborative Development Changelog

All code contributions were authored, verified, and pushed across the authorized team member tokens:

| Contributor | GitHub Account | Token Attribution | Primary Functional Focus |
|---|---|---|---|
| **RAMKISHORE SM** | `Ramkishore76` | `Verified PAT (Ram)` | Frontend architecture, Stage-wise QC UI, Buyer Catalog Desk, Brevo OTP UI & responsive styling |
| **SANJAY S** | `Sanjay8555` | `Verified PAT (Sanjay)` | Database query indexing, Supabase PostgreSQL seeds, performance audit benchmarks & verification |
| **Santhoshkumar S** | `SanthoshkumarS2407` | `Verified PAT (Santhosh)` | Express API gateway, Stage-wise QC holds & photo compression, RBAC middleware, 5% GST & E2E suite |

---

*© 2026 AGT Textile Mills. All rights reserved.*

