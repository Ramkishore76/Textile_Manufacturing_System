# 🎨 AGT Textile Mills — Frontend Architecture & UI Design System

[![React](https://img.shields.io/badge/Framework-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite%20v8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Lucide](https://img.shields.io/badge/Icons-Lucide%20React-F56565?logo=feather&logoColor=white)](https://lucide.dev)

This document provides complete documentation of the **Frontend Web Application** for AGT Textile Mills, including layout architectures, role-guarded routes, component hierarchies, design tokens, and module workflows.

---

## 🏛️ Dual Portal Architecture

The frontend provides two distinct, responsive, and secure user environments connected to the unified backend:

```
client/src/
├── api/
│   └── client.ts             # Axios/Fetch API client with auth interceptor
├── context/
│   └── AuthContext.tsx       # AuthProvider, JWT persistent state & role helpers
├── components/
│   └── ProtectedRoute.tsx    # Route guard with RBAC checks & buyer isolation
├── layouts/
│   ├── AppLayout.tsx         # Internal Factory Portal layout (Sidebar, Notifications, Role Switcher)
│   └── BuyerLayout.tsx       # External Buyer Portal layout (Executive header & isolated tabs)
├── pages/
│   ├── LoginPage.tsx         # Unified authentication screen with quick-demo credentials
│   ├── DashboardPage.tsx     # Factory live metrics, machine cards & financial indicators
│   ├── OrdersPage.tsx        # Buyer order management & automated BOM shortage checking
│   ├── InventoryPage.tsx     # Yarn stock, BOM formulation & warehouse transaction ledger
│   ├── PurchasesPage.tsx     # Supplier POs, purchase requests & GRN inward receiving
│   ├── ProductionPage.tsx    # Loom scheduling, status conflict checks & hourly logs
│   ├── QualityPage.tsx       # 4-Point fabric inspection, defect grading & rework cycles
│   ├── FinishedGoodsPage.tsx # Roll warehouse bins & traceability passports
│   ├── DispatchPage.tsx      # Atomic shipment execution, duplicate checks & invoices
│   ├── AccountsPage.tsx      # Invoices, payment recording, expenses & profitability explorer
│   ├── AttendancePage.tsx    # Daily shift attendance roster & overtime logger
│   ├── WagesPage.tsx         # Attendance-derived monthly payroll calculator
│   ├── BuyerDashboardPage.tsx# Buyer KPI summary, active orders & delivery countdown
│   ├── BuyerOrdersPage.tsx   # Buyer order catalog with stage filtering
│   ├── BuyerOrderDetailPage.tsx # 7-Stage visual progress timeline & roll certificates
│   ├── BuyerDispatchPage.tsx # Consignment tracking, carrier details & shipment notes
│   ├── BuyerInvoicesPage.tsx # Commercial invoices with item lines & bank instructions
│   └── BuyerPaymentsPage.tsx # Verified payment receipts ledger with credit stamps
├── App.tsx                   # React Router v7 configuration & route definitions
├── index.css                 # Base styles & smooth scrollbar utilities
└── main.tsx                  # React DOM root entry point
```

---

## 🧭 Routes & Role Access Hierarchy

| Route | Component | Guard / Access Level | Description |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Credentials entry with pre-filled demo role buttons |
| `/` | `RootRedirect` | Public / Auth Redirect | Automatically redirects to `/app/dashboard` or `/buyer/dashboard` based on role |
| **`/app/*`** | **`AppLayout`** | **Internal Roles Only** | **Internal Factory Management Portal** |
| `/app/dashboard` | `DashboardPage` | All Internal | Real-time plant metrics, loom statuses, financial counters |
| `/app/orders` | `OrdersPage` | `ADMIN`, `SALES`, `STORE` | Order booking, BOM evaluation, shortage flags |
| `/app/inventory` | `InventoryPage` | `ADMIN`, `STORE`, `PRODUCTION` | Raw yarn stock, BOM formulations, stock transactions |
| `/app/purchases` | `PurchasesPage` | `ADMIN`, `STORE` | Suppliers, Purchase Requests, POs, GRN stock receipt |
| `/app/production` | `ProductionPage` | `ADMIN`, `PRODUCTION` | Loom monitoring, job assignment, conflict validation |
| `/app/quality` | `QualityPage` | `ADMIN`, `QUALITY`, `PRODUCTION` | 4-point fabric roll inspection & rework cycle |
| `/app/finished-goods` | `FinishedGoodsPage` | All Internal | Rolls in finished warehouse & traceability passport |
| `/app/dispatch` | `DispatchPage` | `ADMIN`, `DISPATCH`, `SALES` | Shipment execution, duplicate checks & invoice trigger |
| `/app/accounts` | `AccountsPage` | `ADMIN`, `ACCOUNTS`, `SALES` | Invoices, payments, plant expenses, order gross profit |
| `/app/attendance` | `AttendancePage` | `ADMIN`, `HR`, `PRODUCTION` | Daily roster, shift attendance, overtime logging |
| `/app/wages` | `WagesPage` | `ADMIN`, `ACCOUNTS`, `HR` | Monthly wage auto-calculation derived from shift logs |
| **`/buyer/*`** | **`BuyerLayout`** | **`BUYER` Only** | **Dedicated External Buyer Portal** |
| `/buyer/dashboard` | `BuyerDashboardPage` | `BUYER` | Executive order status, upcoming deliveries, balance |
| `/buyer/orders` | `BuyerOrdersPage` | `BUYER` | Buyer's purchase orders with stage filtering |
| `/buyer/orders/:id` | `BuyerOrderDetailPage`| `BUYER` | 7-stage visual progress bar, roll breakdown, specs |
| `/buyer/dispatch` | `BuyerDispatchPage` | `BUYER` | Consignment tracking, carriers, vehicle numbers |
| `/buyer/invoices` | `BuyerInvoicesPage` | `BUYER` | Commercial tax invoices (5% GST), net payment terms |
| `/buyer/payments` | `BuyerPaymentsPage` | `BUYER` | Verified payment receipts ledger |

---

## 🎨 Design System & Styling Tokens

- **Modern Typography:** Styled with Google Fonts (`Inter` for crisp readability and `JetBrains Mono` for roll IDs, barcodes, and monetary figures).
- **Harmonious Palettes:**
  - **Factory Portal Primary:** Deep Slate & Indigo (`#4338ca` / `#4f46e5`) representing industrial reliability.
  - **Buyer Portal Primary:** Dark Emerald & Teal (`#0d9488` / `#0f766e`) representing executive transparency.
  - **Status Tokens:**
    - `PASSED` / `PAID` / `RUNNING` / `COMPLETED`: Emerald (`#10b981`)
    - `IN_PRODUCTION` / `CONFIRMED`: Indigo / Blue (`#3b82f6`)
    - `PENDING_INSPECTION` / `MAINTENANCE` / `PARTIAL`: Amber (`#f59e0b`)
    - `REWORK` / `BREAKDOWN` / `REJECTED`: Rose (`#f43f5e`)
- **Micro-Interactions & Usability:**
  - Real-time in-app notification dropdown with unread badge counter.
  - One-click demo role switcher in top bar for immediate evaluation across all 7 internal roles.
  - Clean modal dialogs with backdrop blur for payment recording, expense entry, and roll traceability passports.

---

## ⚡ Build & Bundle Optimization

The production bundle is built using Vite and Rolldown:

```bash
# In client directory
npm run build
```

```
✓ 2503 modules transformed.
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-ZRUIEv-d.css   48.05 kB │ gzip:   8.66 kB
dist/assets/index-5eaOeSLB.js   904.17 kB │ gzip: 235.41 kB
✓ built in 15.88s (Zero TypeScript errors)
```

---

*Maintained by the AGT Textile Mills Frontend Engineering Team.*
