import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET Factory Dashboard Metrics (Live calculations from real database records)
router.get(
  '/dashboard',
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'STORE', 'PRODUCTION', 'QUALITY', 'DISPATCH', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      // Orders
      const allOrders = await prisma.order.findMany({
        include: { items: true, buyer: true },
      });

      const activeOrders = allOrders.filter(
        (o) => !['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(o.status)
      );

      const approachingDeadlineOrders = activeOrders.filter((o) => {
        const d = new Date(o.requiredDeliveryDate);
        return d >= now && d <= nextWeek;
      });

      const delayedOrders = activeOrders.filter((o) => {
        const d = new Date(o.requiredDeliveryDate);
        return d < now;
      });

      // Raw Material Inventory
      const yarns = await prisma.yarnMaterial.findMany();
      const totalYarnStockKg = yarns.reduce((sum, y) => sum + y.currentStock, 0);
      const totalReservedYarnKg = yarns.reduce((sum, y) => sum + y.reservedStock, 0);
      const lowStockAlerts = yarns.filter(
        (y) => y.currentStock - y.reservedStock <= y.minimumStockAlert
      );

      // Machines Status
      const machines = await prisma.machine.findMany();
      const machineStatusCounts = {
        running: machines.filter((m) => m.status === 'RUNNING').length,
        idle: machines.filter((m) => m.status === 'IDLE').length,
        maintenance: machines.filter((m) => m.status === 'MAINTENANCE').length,
        breakdown: machines.filter((m) => m.status === 'BREAKDOWN').length,
      };

      // Today's Production
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayLogs = await prisma.productionLog.findMany({
        where: { logDate: { gte: todayStart } },
      });
      const todayProducedMeters = todayLogs.reduce((sum, l) => sum + l.quantityProduced, 0);

      // Quality Status
      const allRolls = await prisma.roll.findMany();
      const pendingInspections = allRolls.filter((r) => r.qualityStatus === 'PENDING_INSPECTION').length;
      const reworkRolls = allRolls.filter((r) => r.qualityStatus === 'REWORK_REQUIRED');
      const rejectedRolls = allRolls.filter((r) => r.qualityStatus === 'REJECTED');
      const reworkMeters = reworkRolls.reduce((sum, r) => sum + r.lengthMeters, 0);
      const rejectedMeters = rejectedRolls.reduce((sum, r) => sum + r.lengthMeters, 0);

      // Finished Goods & Dispatches
      const finishedStockRolls = allRolls.filter(
        (r) => r.qualityStatus === 'PASSED' && r.inventoryStatus === 'IN_FINISHED_STOCK'
      );
      const availableFinishedMeters = finishedStockRolls.reduce((sum, r) => sum + r.lengthMeters, 0);

      const pendingDispatches = activeOrders.filter((o) => o.status === 'READY_TO_SHIP').length;

      // Invoices & Receivables
      const allInvoices = await prisma.invoice.findMany();
      const totalInvoiced = allInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = allInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
      const outstandingReceivables = allInvoices.reduce((sum, i) => sum + i.balanceAmount, 0);

      // Expenses
      const allExpenses = await prisma.expenseRecord.findMany();
      const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Wages
      const allWages = await prisma.wageRecord.findMany();
      const totalWages = allWages.reduce((sum, w) => sum + w.netWage, 0);

      // Financial Consolidation:
      // Revenue = Total Invoiced sales
      // Total Cost = Manufacturing Expenses + Wages + Raw materials consumed
      const totalRecordedCost = totalExpenses + totalWages;
      const estimatedGrossProfit = totalInvoiced - totalRecordedCost;

      res.json({
        orders: {
          total: allOrders.length,
          active: activeOrders.length,
          approachingDeadline: approachingDeadlineOrders.length,
          delayed: delayedOrders.length,
          pendingDispatch: pendingDispatches,
        },
        inventory: {
          totalStockKg: totalYarnStockKg,
          reservedStockKg: totalReservedYarnKg,
          availableStockKg: Math.max(0, totalYarnStockKg - totalReservedYarnKg),
          lowStockAlertsCount: lowStockAlerts.length,
          lowStockItems: lowStockAlerts.map((y) => ({
            code: y.code,
            name: y.name,
            available: y.currentStock - y.reservedStock,
            threshold: y.minimumStockAlert,
          })),
        },
        machines: machineStatusCounts,
        production: {
          todayProducedMeters,
          activeJobsCount: await prisma.productionJob.count({ where: { status: 'IN_PROGRESS' } }),
        },
        quality: {
          pendingInspections,
          reworkCount: reworkRolls.length,
          reworkMeters,
          rejectedCount: rejectedRolls.length,
          rejectedMeters,
        },
        finishedGoods: {
          rollsCount: finishedStockRolls.length,
          totalMeters: availableFinishedMeters,
        },
        financials: {
          totalInvoiced,
          totalPaid,
          outstandingReceivables,
          totalRecordedCost,
          estimatedGrossProfit,
          profitMargin: totalInvoiced > 0 ? ((estimatedGrossProfit / totalInvoiced) * 100).toFixed(1) : 0,
        },
      });
    } catch (err: any) {
      console.error('Dashboard metrics error:', err);
      res.status(500).json({ error: 'Failed to calculate dashboard metrics', details: err.message });
    }
  }
);

// GET Order-wise Cost & Profit Report (Sections 4 & 13)
router.get(
  '/order-cost/:orderId',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'PRODUCTION', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.orderId },
        include: {
          buyer: true,
          items: {
            include: {
              fabricProduct: {
                include: {
                  boms: { include: { yarnMaterial: true } },
                },
              },
            },
          },
          productionJobs: {
            include: { machine: true, logs: true, assignedEmployee: true },
          },
          invoices: true,
          expenses: true,
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // 1. Calculate Raw Material Cost based on BOM & unit cost
      let materialCost = 0;
      const materialBreakdown = [];

      for (const item of order.items) {
        for (const bom of item.fabricProduct.boms) {
          const qtyKg = item.requiredQuantity * bom.yarnQuantityPerMeter * (1 + bom.wastagePercentage / 100);
          const cost = qtyKg * bom.yarnMaterial.costPerUnit;
          materialCost += cost;

          materialBreakdown.push({
            yarnName: bom.yarnMaterial.name,
            yarnCode: bom.yarnMaterial.code,
            quantityKg: qtyKg,
            unitCost: bom.yarnMaterial.costPerUnit,
            totalCost: cost,
          });
        }
      }

      // 2. Calculate Machine Operating Cost
      let machineOperatingCost = 0;
      const machineBreakdown = [];

      for (const job of order.productionJobs) {
        const capacityPerHour = job.machine.capacityPerHour || 25;
        const estimatedHours = job.actualQuantity > 0 ? job.actualQuantity / capacityPerHour : job.plannedQuantity / capacityPerHour;
        const cost = estimatedHours * job.machine.hourlyOperatingCost;
        machineOperatingCost += cost;

        machineBreakdown.push({
          jobNumber: job.jobNumber,
          stage: job.stage,
          machineName: job.machine.name,
          operatingHours: estimatedHours.toFixed(1),
          hourlyRate: job.machine.hourlyOperatingCost,
          totalCost: cost,
        });
      }

      // 3. Attributable Expenses
      const attributableExpenses = order.expenses.reduce((sum, e) => sum + e.amount, 0);

      // 4. Revenue from Order Invoices or Order Total
      const totalRevenue = order.invoices.length > 0
        ? order.invoices.reduce((sum, i) => sum + i.subtotal, 0)
        : order.totalAmount;

      const totalCost = materialCost + machineOperatingCost + attributableExpenses;
      const netProfit = totalRevenue - totalCost;
      const profitMarginPercentage = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

      res.json({
        orderNumber: order.orderNumber,
        buyerName: order.buyer.companyName,
        status: order.status,
        financials: {
          revenue: totalRevenue,
          materialCost,
          machineOperatingCost,
          attributableExpenses,
          totalCost,
          netProfit,
          profitMarginPercentage,
        },
        breakdowns: {
          materials: materialBreakdown,
          machines: machineBreakdown,
          expenses: order.expenses,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate order cost report', details: err.message });
    }
  }
);

// GET Financials summary
router.get(
  '/financials',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invoices = await prisma.invoice.findMany();
      const payments = await prisma.payment.findMany();
      const expenses = await prisma.expenseRecord.findMany();
      const wages = await prisma.wageRecord.findMany();

      const totalSalesRevenue = invoices.reduce((sum, i) => sum + i.subtotal, 0);
      const totalGSTCollected = invoices.reduce((sum, i) => sum + i.taxAmount, 0);
      const cashPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingReceivables = invoices.reduce((sum, i) => sum + i.balanceAmount, 0);

      const totalManufacturingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalWages = wages.reduce((sum, w) => sum + w.netWage, 0);
      const totalOperatingCost = totalManufacturingExpenses + totalWages;

      const netProfit = totalSalesRevenue - totalOperatingCost;

      res.json({
        salesRevenue: totalSalesRevenue,
        gstCollected: totalGSTCollected,
        cashPaymentsReceived,
        outstandingReceivables,
        manufacturingExpenses: totalManufacturingExpenses,
        wagesAndSalaries: totalWages,
        totalOperatingCost,
        netProfit,
        profitMargin: totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(1) : 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch financials', details: err.message });
    }
  }
);

export default router;
