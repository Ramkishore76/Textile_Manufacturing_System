# 🗄️ AGT Textile Mills — Database Architecture & Data Dictionary

[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Supabase](https://img.shields.io/badge/Cloud-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma%20v5.22-2D3748?logo=prisma&logoColor=white)](https://prisma.io)

This document provides complete documentation of the **32 relational entities**, indexes, constraints, foreign key cascades, and connection configurations powering **AGT Textile Mills**.

---

## 🌐 Supabase Connection & Configuration

The application connects to a managed PostgreSQL cluster on **Supabase** via the IPv4 connection pooler located in the AWS Asia Pacific (Singapore) region (`ap-southeast-1`).

```env
DATABASE_URL="postgresql://postgres.cipfdzjrlgtyletdcqql:%40Textile_Manufacturing@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

| Parameter | Configuration Value |
|---|---|
| **Host** | `aws-0-ap-southeast-1.pooler.supabase.com` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres.cipfdzjrlgtyletdcqql` |
| **Password Encoding** | `%40Textile_Manufacturing` (Decodes to `@Textile_Manufacturing`) |
| **Pool Mode** | Session Pooler (Maximum client pool size: 15) |

---

## 📊 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    BUYER ||--o{ ORDER : places
    BUYER ||--o{ BUYER_ACCOUNT : has
    BUYER ||--o{ INVOICE : billed
    BUYER ||--o{ PAYMENT : remits
    BUYER ||--o{ DISPATCH : receives

    SUPPLIER ||--o{ PURCHASE_ORDER : receives
    SUPPLIER ||--o{ GOODS_RECEIPT : supplies

    FABRIC_PRODUCT ||--o{ BILL_OF_MATERIALS : defines
    YARN_MATERIAL ||--o{ BILL_OF_MATERIALS : required_in
    YARN_MATERIAL ||--o{ INVENTORY_TRANSACTION : tracks
    YARN_MATERIAL ||--o{ PURCHASE_REQUEST : triggers
    YARN_MATERIAL ||--o{ GOODS_RECEIPT : received_as

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ PRODUCTION_JOB : schedules
    ORDER ||--o{ ROLL : produces
    ORDER ||--o{ DISPATCH : ships
    ORDER ||--o{ INVOICE : generates
    ORDER ||--o{ EXPENSE_RECORD : incurs

    MACHINE ||--o{ PRODUCTION_JOB : assigned_to
    SHIFT ||--o{ PRODUCTION_JOB : operates_in
    PRODUCTION_JOB ||--|{ PRODUCTION_LOG : logs
    PRODUCTION_JOB ||--o{ ROLL : creates

    FINISHED_GOODS_LOCATION ||--o{ ROLL : stores
    ROLL ||--o{ QUALITY_INSPECTION : inspected_by
    ROLL ||--o{ REWORK_RECORD : reworked_by
    ROLL ||--o{ DISPATCH_ITEM : included_in

    DISPATCH ||--|{ DISPATCH_ITEM : contains
    DISPATCH ||--o{ INVOICE : generates

    INVOICE ||--|{ INVOICE_ITEM : items
    INVOICE ||--o{ PAYMENT : settles

    EMPLOYEE ||--o{ ATTENDANCE : records
    EMPLOYEE ||--o{ WAGE_RECORD : earns
    EMPLOYEE ||--o{ PRODUCTION_JOB : operates
```

---

## 🗃️ Complete Data Dictionary (32 Entities)

### 1. Identity & Access Control
- **`User`**: Internal mill staff accounts (`ADMIN`, `SALES`, `STORE`, `PRODUCTION`, `QUALITY`, `DISPATCH`, `ACCOUNTS`, `HR`). Fields: `id`, `name`, `email` (unique), `passwordHash`, `role`, `createdAt`.
- **`BuyerAccount`**: Credentials for authenticated external buyers. Fields: `id`, `buyerId` (unique), `email` (unique), `passwordHash`, `lastLoginAt`.
- **`AuditLog`**: Immutable operational trail. Fields: `id`, `action`, `entityType`, `entityId`, `performedById`, `performedByName`, `details` (JSON), `createdAt`.
- **`Notification`**: Real-time alerts for staff and buyers. Fields: `id`, `userId`, `buyerId`, `title`, `message`, `type` (`INFO`, `WARNING`, `SUCCESS`, `ERROR`), `isRead`, `link`, `createdAt`.

### 2. Partners & Raw Material Catalog
- **`Buyer`**: Global apparel brands. Fields: `id`, `companyName`, `contactPerson`, `email`, `phone`, `gstNumber`, `billingAddress`, `shippingAddress`.
- **`Supplier`**: Yarn and chemical vendors. Fields: `id`, `name`, `contactPerson`, `email`, `phone`, `materialsSupplied`, `leadTimeDays`, `rating`.
- **`FabricProduct`**: Manufactured textile lines. Fields: `id`, `code` (unique), `name`, `fabricType`, `gsm`, `widthInches`, `weaveType`, `basePricePerMeter`.
- **`YarnMaterial`**: Raw yarn inventory stock. Fields: `id`, `code` (unique), `name`, `yarnType`, `yarnCount`, `unit` (`KG`), `currentStock`, `reservedStock`, `minimumStockAlert`, `costPerUnit`.
- **`BillOfMaterials` (BOM)**: Yarn consumption formulation per fabric meter. Fields: `id`, `fabricProductId`, `yarnMaterialId`, `yarnQuantityPerMeter`, `wastagePercentage`. Unique: `(fabricProductId, yarnMaterialId)`.

### 3. Orders & Procurement Lifecycle
- **`Order`**: Commercial buyer contracts. Fields: `id`, `orderNumber` (unique), `buyerId`, `orderDate`, `requiredDeliveryDate`, `status` (`DRAFT`, `CONFIRMED`, `MATERIAL_ALLOCATED`, `IN_PRODUCTION`, `QUALITY_INSPECTION`, `READY_TO_SHIP`, `PARTIALLY_DISPATCHED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`), `totalAmount`, `notes`.
- **`OrderItem`**: Specific fabric lines ordered. Fields: `id`, `orderId`, `fabricProductId`, `color`, `requiredQuantity`, `dispatchedQuantity`, `unitPrice`, `totalPrice`.
- **`PurchaseRequest`**: Shortage-triggered yarn requisitions. Fields: `id`, `requestNumber` (unique), `yarnMaterialId`, `quantityRequested`, `requestedDate`, `status` (`PENDING`, `APPROVED`, `PO_GENERATED`, `REJECTED`), `reason`, `notes`.
- **`PurchaseOrder`**: Official vendor procurement POs. Fields: `id`, `poNumber` (unique), `supplierId`, `totalAmount`, `status` (`ORDERED`, `PARTIALLY_RECEIVED`, `COMPLETED`, `CANCELLED`), `deliveryDueDate`.
- **`GoodsReceipt` (GRN)**: Inward warehouse receiving notes. Fields: `id`, `grnNumber` (unique), `supplierId`, `yarnMaterialId`, `quantityReceived`, `batchLotNumber`, `receivedDate`, `qualityAccepted`.
- **`InventoryTransaction`**: Double-entry stock ledger. Fields: `id`, `yarnMaterialId`, `transactionType` (`RECEIPT`, `ISSUE_TO_PRODUCTION`, `SCRAP_ADJUSTMENT`, `RETURN`), `quantity`, `referenceDocument`, `balanceAfter`.

### 4. Plant Floor, Looms & Quality Tracking
- **`Machine`**: Spinning frames, weaving looms, and dyeing vats. Fields: `id`, `code` (unique), `name`, `type` (`SPINNING`, `WEAVING`, `DYEING`, `FINISHING`), `capacityPerHour`, `hourlyOperatingCost`, `status` (`RUNNING`, `IDLE`, `MAINTENANCE`, `BREAKDOWN`), `lastMaintenanceDate`.
- **`Shift`**: Working schedules. Fields: `id`, `name` (`SHIFT_A_MORNING`, `SHIFT_B_EVENING`, `SHIFT_C_NIGHT`), `startTime`, `endTime`.
- **`ProductionJob`**: Loom work orders. Fields: `id`, `jobNumber` (unique), `orderId`, `machineId`, `shiftId`, `stage` (`SPINNING`, `WEAVING`, `DYEING`, `FINISHING`), `plannedQuantity`, `actualQuantity`, `status` (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `assignedEmployeeId`.
- **`ProductionLog`**: Hourly meter logs. Fields: `id`, `productionJobId`, `logDate`, `quantityProduced`, `wasteQuantity`, `machineDowntimeMinutes`, `operatorNotes`.
- **`FinishedGoodsLocation`**: Warehouse storage coordinates. Fields: `id`, `zone`, `rack`, `bin` (unique), `capacityRolls`.
- **`Roll`**: Discrete barcode-serialized fabric pieces. Fields: `id`, `rollId` (unique), `orderId`, `orderItemId`, `productionJobId`, `lengthMeters`, `weightKg`, `qualityStatus` (`PENDING_INSPECTION`, `PASSED`, `REWORK_REQUIRED`, `REJECTED`), `qualityGrade` (`GRADE_A`, `GRADE_B`, `GRADE_C`), `inventoryStatus` (`IN_PRODUCTION`, `IN_FINISHED_STOCK`, `ALLOCATED_FOR_DISPATCH`, `DISPATCHED`), `locationId`.
- **`QualityInspection`**: Standard 4-point inspection audits. Fields: `id`, `inspectionNumber` (unique), `rollId`, `pointsTotal`, `assignedGrade`, `holesPoints`, `slubsPoints`, `stainsPoints`, `otherDefectsPoints`, `overallResult` (`PASS`, `FAIL_REWORK`, `FAIL_SCRAP`), `inspectorId`.
- **`ReworkRecord`**: Corrective processing cycle. Fields: `id`, `rollId`, `defectDescription`, `reworkAction`, `status` (`ASSIGNED`, `IN_PROGRESS`, `RE_INSPECTED_PASSED`, `SCRAPPED`).

### 5. Dispatch, Billing & Financial Ledger
- **`Dispatch`**: Consignment transport documentation. Fields: `id`, `dispatchNumber` (unique), `orderId`, `buyerId`, `carrierName`, `vehicleNumber`, `trackingNumber` (unique), `dispatchDate`, `status` (`PREPARED`, `DISPATCHED`, `DELIVERED`), `totalMeters`, `totalRolls`, `dispatchStaffId`.
- **`DispatchItem`**: Rolls attached to a shipment. Fields: `id`, `dispatchId`, `orderItemId`, `rollId` (unique), `meters`.
- **`Invoice`**: Commercial tax invoices. Fields: `id`, `invoiceNumber` (unique), `orderId`, `buyerId`, `dispatchId`, `subtotal`, `taxRate` (5%), `taxAmount`, `totalAmount`, `paidAmount`, `balanceAmount`, `status` (`UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`), `issueDate`, `dueDate`.
- **`InvoiceItem`**: Invoice line breakdown. Fields: `id`, `invoiceId`, `description`, `quantity`, `unit`, `unitPrice`, `amount`.
- **`Payment`**: Verified payment settlements. Fields: `id`, `paymentNumber` (unique), `invoiceId`, `buyerId`, `amount`, `paymentDate`, `paymentMethod` (`BANK_TRANSFER`, `CHEQUE`, `UPI`, `CASH`), `transactionReference` (unique), `recordedById`.
- **`ExpenseRecord`**: Plant overhead expenditures. Fields: `id`, `expenseNumber` (unique), `category` (`RAW_MATERIAL_CONSUMED`, `DIRECT_LABOUR`, `MACHINE_OPERATING`, `ELECTRICITY_UTILITIES`, `DYEING_PROCESSING`, `MAINTENANCE`, `OTHER`), `orderId`, `amount`, `description`, `receiptReference`.

### 6. Workforce Management & Wages
- **`Employee`**: Factory workforce registry. Fields: `id`, `employeeCode` (unique), `name`, `department`, `role`, `phone`, `dailyBaseWage`, `hourlyRate`, `overtimeHourlyRate`.
- **`Attendance`**: Shift presence tracker. Fields: `id`, `employeeId`, `date`, `shiftId`, `status` (`PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE`), `hoursWorked`, `overtimeHours`. Unique: `(employeeId, date)`.
- **`WageRecord`**: Monthly payroll ledger. Fields: `id`, `employeeId`, `periodMonth`, `periodYear`, `basePay`, `overtimePay`, `bonuses`, `deductions`, `netWage`, `status` (`PENDING`, `APPROVED`, `PAID`). Unique: `(employeeId, periodMonth, periodYear)`.

---

## 🔒 Indexing & Performance Optimizations

1. **Foreign Key Indices:** Explicit indices placed on foreign key columns (`orderId`, `buyerId`, `rollId`, `yarnMaterialId`, `employeeId`) to prevent table scans during relational queries.
2. **Unique Business Identifiers:** Natural business codes (`orderNumber`, `rollId`, `invoiceNumber`, `paymentNumber`, `trackingNumber`, `transactionReference`) are enforced via unique constraints.
3. **Idempotent Payment Protection:** `Payment.transactionReference` has a unique constraint, preventing double-credit vulnerabilities.
4. **Attendance Uniqueness:** Composite unique index on `(employeeId, date)` ensures single attendance entry per worker per calendar day.
5. **Wage Register Uniqueness:** Composite unique index on `(employeeId, periodMonth, periodYear)` prevents multiple payroll calculations for the same pay cycle.

---

## 🛠️ Database Maintenance Scripts

Run these scripts from the `server` directory:

```bash
# 1. Regenerate Prisma Client
npm run db:generate

# 2. Push Schema Modifications to Supabase
npm run db:push

# 3. Seed Database with Realistic Factory Data
npm run db:seed

# 4. Run Instant Database Health & Table Diagnostics
npm run db:check

# 5. Audit Schema Integrity & Foreign Key Indexes
npm run db:audit
```

---

## ⚡ Performance Optimization & Indexing

High-frequency query performance indexes are implemented in [`server/prisma/performance_indexes.sql`](file:///c:/Users/Sathish%20B/OneDrive/Desktop/Textile_Mannufacturing_System/server/prisma/performance_indexes.sql):
- **Orders & Lookups**: `idx_orders_buyer_status`, `idx_orders_delivery_date`, `idx_orders_created_at`
- **Loom Allocations**: `idx_prodjobs_machine_status`, `idx_prodjobs_order_id`
- **Roll Traceability**: `idx_rolls_barcode`, `idx_rolls_job_qc`, `idx_rolls_grade`
- **QC 4-Point Inspections**: `idx_inspections_roll_date`, `idx_inspections_status`
- **Logistics & Shipments**: `idx_dispatches_order`, `idx_dispatches_buyer_status`, `idx_dispatches_tracking`
- **Financial Invoicing**: `idx_invoices_order_status`, `idx_invoices_due_date`, `idx_payments_invoice`
- **Yarn Material Inventory**: `idx_yarn_stock_level`, `idx_inventory_tx_material`
- **HR & Wages**: `idx_attendance_employee_date`, `idx_wages_employee_month`

---

## 📊 Database Query Benchmark & Latency Monitor

Run real-time Supabase query and latency benchmarks:

```bash
cd server
npm run db:benchmark
```

Automated verification measures:
1. Connection pool latency (`SELECT 1`)
2. Complex multi-table relational joins (`Order` + `OrderItem` + `Buyer` + `FabricProduct`)
3. Roll genealogy and 4-point inspection traceability lookups
4. Commercial invoicing & payment balance aggregates
5. Raw yarn stock levels & transaction audit histories
6. Workforce daily shift attendance and payroll rosters
7. Sequential immutable audit log retrieval

---

*Lead Database Engineer: Sanjay Selvakumar <sanjayselvakumar05@gmail.com>*
*Maintained by the AGT Textile Mills Database Engineering Team.*
