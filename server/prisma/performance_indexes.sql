-- =========================================================================
-- AGT TEXTILE MILLS — SUPABASE POSTGRESQL PERFORMANCE OPTIMIZATION INDEXES
-- Authored by: Sanjay Selvakumar <sanjayselvakumar05@gmail.com>
-- =========================================================================

-- 1. Orders & Buyer Lookups
CREATE INDEX IF NOT EXISTS "idx_orders_buyer_status" ON "Order" ("buyerId", "status");
CREATE INDEX IF NOT EXISTS "idx_orders_delivery_date" ON "Order" ("deliveryDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "Order" ("createdAt" DESC);

-- 2. Production Jobs & Loom Allocations
CREATE INDEX IF NOT EXISTS "idx_prodjobs_machine_status" ON "ProductionJob" ("machineId", "status");
CREATE INDEX IF NOT EXISTS "idx_prodjobs_order_id" ON "ProductionJob" ("orderId");

-- 3. Rolls Traceability & Finished Goods
CREATE INDEX IF NOT EXISTS "idx_rolls_barcode" ON "Roll" ("barcode");
CREATE INDEX IF NOT EXISTS "idx_rolls_job_qc" ON "Roll" ("jobId", "qcStatus");
CREATE INDEX IF NOT EXISTS "idx_rolls_grade" ON "Roll" ("grade");

-- 4. Quality 4-Point Inspections
CREATE INDEX IF NOT EXISTS "idx_inspections_roll_date" ON "QualityInspection" ("rollId", "inspectionDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_inspections_status" ON "QualityInspection" ("status");

-- 5. Dispatches, Logistics & Tracking
CREATE INDEX IF NOT EXISTS "idx_dispatches_order" ON "Dispatch" ("orderId");
CREATE INDEX IF NOT EXISTS "idx_dispatches_buyer_status" ON "Dispatch" ("buyerId", "status");
CREATE INDEX IF NOT EXISTS "idx_dispatches_tracking" ON "Dispatch" ("trackingNumber");

-- 6. Financial Invoicing & Remittances
CREATE INDEX IF NOT EXISTS "idx_invoices_order_status" ON "Invoice" ("orderId", "status");
CREATE INDEX IF NOT EXISTS "idx_invoices_due_date" ON "Invoice" ("dueDate" ASC);
CREATE INDEX IF NOT EXISTS "idx_payments_invoice" ON "Payment" ("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_payments_ref" ON "Payment" ("referenceNumber");

-- 7. Yarn Inventory & Raw Material Tracking
CREATE INDEX IF NOT EXISTS "idx_yarn_stock_level" ON "YarnMaterial" ("currentStockKg");
CREATE INDEX IF NOT EXISTS "idx_inventory_tx_material" ON "InventoryTransaction" ("materialId", "createdAt" DESC);

-- 8. Workforce Attendance & Payroll Calculations
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_date" ON "Attendance" ("employeeId", "date");
CREATE INDEX IF NOT EXISTS "idx_wages_employee_month" ON "WageRecord" ("employeeId", "monthYear");
