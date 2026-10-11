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
        jobsBreakdown: {
          pending: await prisma.productionJob.count({ where: { status: 'PENDING' } }),
          inProgress: await prisma.productionJob.count({ where: { status: 'IN_PROGRESS' } }),
          completed: await prisma.productionJob.count({ where: { status: 'COMPLETED' } }),
        },
        yarnsDistribution: yarns.map((y) => ({
          name: y.code,
          fullName: y.name,
          stockKg: y.currentStock,
        })),
        // Confidential financials are only accessible to ADMIN and ACCOUNTS
        financials:
          req.user?.role === 'ADMIN' || req.user?.role === 'ACCOUNTS'
            ? {
                totalInvoiced,
                totalPaid,
                outstandingReceivables,
                totalRecordedCost,
                estimatedGrossProfit,
                profitMargin:
                  totalInvoiced > 0
                    ? ((estimatedGrossProfit / totalInvoiced) * 100).toFixed(1)
                    : '0.0',
              }
            : null,
        // Role-filtered recent operational events
        recentEvents: await (async () => {
          const role = req.user?.role || 'ADMIN';
          const roleEntityMap: Record<string, string[]> = {
            PRODUCTION: ['Machine', 'ProductionJob', 'ProductionLog', 'Roll', 'YarnMaterial'],
            QUALITY: ['QualityInspection', 'Roll', 'ReworkRecord'],
            STORE: ['YarnMaterial', 'PurchaseRequest', 'PurchaseOrder', 'GoodsReceipt', 'InventoryTransaction'],
            SALES: ['Order', 'Buyer'],
            DISPATCH: ['Dispatch', 'Roll', 'Order'],
            ACCOUNTS: ['Invoice', 'Payment', 'WageRecord', 'ExpenseRecord', 'Attendance'],
          };
          const allowedEntities = roleEntityMap[role];
          const whereClause = allowedEntities ? { entityType: { in: allowedEntities } } : {};
          const logs = await prisma.auditLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 8,
          });
          return logs.map((l) => ({
            id: l.id,
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId,
            details: l.details,
            performedByName: l.performedByName || 'System Process',
            createdAt: l.createdAt,
          }));
        })(),
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

// GET Plant Owner Monthly & Annual Financial Profit & Expense Analytics
router.get(
  '/financial-analytics',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const yearParam = req.query.year ? parseInt(String(req.query.year), 10) : new Date().getFullYear();
      const selectedYear = isNaN(yearParam) ? new Date().getFullYear() : yearParam;

      // 1. Fetch Invoices, Expenses, Wages across all records to compute selected year and multi-year comparisons
      const [allInvoices, allExpenses, allWages, allPayments] = await Promise.all([
        prisma.invoice.findMany({
          include: { buyer: { select: { companyName: true } } },
          orderBy: { issueDate: 'asc' },
        }),
        prisma.expenseRecord.findMany({
          orderBy: { expenseDate: 'asc' },
        }),
        prisma.wageRecord.findMany({
          include: { employee: { select: { name: true, department: true } } },
          orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
        }),
        prisma.payment.findMany({
          orderBy: { paymentDate: 'asc' },
        }),
      ]);

      // 2. Discover available years from data
      const yearSet = new Set<number>();
      yearSet.add(2024);
      yearSet.add(2025);
      yearSet.add(2026);
      yearSet.add(new Date().getFullYear());

      allInvoices.forEach((i) => yearSet.add(new Date(i.issueDate).getFullYear()));
      allExpenses.forEach((e) => yearSet.add(new Date(e.expenseDate).getFullYear()));
      allWages.forEach((w) => yearSet.add(w.periodYear));

      const availableYears = Array.from(yearSet).sort((a, b) => b - a);

      // Category definitions & display metadata
      const categoryMetadata: Record<string, { label: string; color: string; icon: string }> = {
        ELECTRICITY_UTILITIES: { label: 'Electricity & Power Grid', color: '#f59e0b', icon: 'Zap' },
        RAW_MATERIAL_CONSUMED: { label: 'Raw Materials & Yarn', color: '#3b82f6', icon: 'Boxes' },
        DIRECT_LABOUR: { label: 'Direct Production Labour', color: '#8b5cf6', icon: 'Users' },
        WAGES_PAYROLL: { label: 'Wages & Shift Payroll', color: '#6366f1', icon: 'Wallet' },
        MACHINE_OPERATING: { label: 'Machine Fuel & Operating', color: '#ec4899', icon: 'Cpu' },
        DYEING_PROCESSING: { label: 'Dyeing & Chemical Auxiliaries', color: '#14b8a6', icon: 'FlaskConical' },
        MAINTENANCE: { label: 'Preventive Loom Maintenance', color: '#f97316', icon: 'Wrench' },
        OTHER: { label: 'Administrative Overheads', color: '#64748b', icon: 'Building2' },
      };

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // 3. Aggregate Monthly breakdown for selectedYear
      const monthlyData = [];
      let totalAnnualRevenue = 0;
      let totalAnnualDirectExpenses = 0;
      let totalAnnualWages = 0;
      let totalAnnualPaidRevenue = 0;
      let totalAnnualOutstanding = 0;
      let totalAnnualTaxCollected = 0;

      const annualCategoryTotals: Record<string, number> = {
        ELECTRICITY_UTILITIES: 0,
        RAW_MATERIAL_CONSUMED: 0,
        DIRECT_LABOUR: 0,
        WAGES_PAYROLL: 0,
        MACHINE_OPERATING: 0,
        DYEING_PROCESSING: 0,
        MAINTENANCE: 0,
        OTHER: 0,
      };

      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthName = monthNames[m];

        // Filter invoices for this month & year
        const monthInvoices = allInvoices.filter((inv) => {
          const d = new Date(inv.issueDate);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });

        // Filter expenses for this month & year
        const monthExpenses = allExpenses.filter((exp) => {
          const d = new Date(exp.expenseDate);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });

        // Filter wages for this month & year
        const monthWages = allWages.filter((w) => {
          return w.periodYear === selectedYear && w.periodMonth === monthNum;
        });

        // Filter payments
        const monthPayments = allPayments.filter((p) => {
          const d = new Date(p.paymentDate);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });

        const revSubtotal = monthInvoices.reduce((s, i) => s + (i.subtotal || i.totalAmount), 0);
        const revTotal = monthInvoices.reduce((s, i) => s + i.totalAmount, 0);
        const taxCollected = monthInvoices.reduce((s, i) => s + i.taxAmount, 0);
        const paidRevenue = monthInvoices.reduce((s, i) => s + i.paidAmount, 0);
        const balanceReceivable = monthInvoices.reduce((s, i) => s + i.balanceAmount, 0);

        const directExpTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
        const wagesTotal = monthWages.reduce((s, w) => s + w.netWage, 0);
        const totalExp = directExpTotal + wagesTotal;

        const netProfit = revSubtotal - totalExp;
        const profitMargin = revSubtotal > 0 ? Number(((netProfit / revSubtotal) * 100).toFixed(1)) : 0;

        // Tally category totals for this month
        const categoryBreakdown: Record<string, number> = {
          ELECTRICITY_UTILITIES: 0,
          RAW_MATERIAL_CONSUMED: 0,
          DIRECT_LABOUR: 0,
          WAGES_PAYROLL: wagesTotal,
          MACHINE_OPERATING: 0,
          DYEING_PROCESSING: 0,
          MAINTENANCE: 0,
          OTHER: 0,
        };

        for (const exp of monthExpenses) {
          const cat = exp.category in categoryBreakdown ? exp.category : 'OTHER';
          categoryBreakdown[cat] += exp.amount;
          annualCategoryTotals[cat] += exp.amount;
        }
        annualCategoryTotals.WAGES_PAYROLL += wagesTotal;

        totalAnnualRevenue += revSubtotal;
        totalAnnualDirectExpenses += directExpTotal;
        totalAnnualWages += wagesTotal;
        totalAnnualPaidRevenue += paidRevenue;
        totalAnnualOutstanding += balanceReceivable;
        totalAnnualTaxCollected += taxCollected;

        monthlyData.push({
          month: monthNum,
          monthName,
          year: selectedYear,
          revenue: revSubtotal,
          grossInvoiced: revTotal,
          taxCollected,
          paidRevenue,
          outstandingReceivable: balanceReceivable,
          directExpenses: directExpTotal,
          wages: wagesTotal,
          totalExpenses: totalExp,
          netProfit,
          profitMargin,
          invoiceCount: monthInvoices.length,
          expenseCount: monthExpenses.length,
          categoryBreakdown,
          status: netProfit > 0 ? 'PROFITABLE' : netProfit === 0 ? 'BREAKEVEN' : 'LOSS',
          recentExpenses: monthExpenses.slice(0, 5).map((e) => ({
            id: e.id,
            expenseNumber: e.expenseNumber,
            category: e.category,
            categoryLabel: categoryMetadata[e.category]?.label || e.category,
            amount: e.amount,
            description: e.description,
            date: e.expenseDate,
          })),
        });
      }

      const totalAnnualExpenses = totalAnnualDirectExpenses + totalAnnualWages;
      const netAnnualProfit = totalAnnualRevenue - totalAnnualExpenses;
      const annualProfitMargin =
        totalAnnualRevenue > 0 ? Number(((netAnnualProfit / totalAnnualRevenue) * 100).toFixed(1)) : 0;

      // Category distribution list with percentages
      const categoryDistribution = Object.entries(annualCategoryTotals)
        .map(([key, amount]) => ({
          category: key,
          label: categoryMetadata[key]?.label || key,
          amount,
          color: categoryMetadata[key]?.color || '#94a3b8',
          percentage: totalAnnualExpenses > 0 ? Number(((amount / totalAnnualExpenses) * 100).toFixed(1)) : 0,
        }))
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Multi-year Annual comparison
      const annualComparison = availableYears
        .map((yr) => {
          const yrInvoices = allInvoices.filter((i) => new Date(i.issueDate).getFullYear() === yr);
          const yrExpenses = allExpenses.filter((e) => new Date(e.expenseDate).getFullYear() === yr);
          const yrWages = allWages.filter((w) => w.periodYear === yr);

          const rev = yrInvoices.reduce((s, i) => s + (i.subtotal || i.totalAmount), 0);
          const directExp = yrExpenses.reduce((s, e) => s + e.amount, 0);
          const wages = yrWages.reduce((s, w) => s + w.netWage, 0);
          const totExp = directExp + wages;
          const profit = rev - totExp;
          const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;

          return {
            year: yr,
            revenue: rev,
            directExpenses: directExp,
            wages,
            totalExpenses: totExp,
            netProfit: profit,
            profitMargin: margin,
            invoicesCount: yrInvoices.length,
            expensesCount: yrExpenses.length,
          };
        })
        .sort((a, b) => a.year - b.year);

      // YoY Calculations
      const annualComparisonWithGrowth = annualComparison.map((item, idx) => {
        if (idx === 0) {
          return { ...item, yoyRevenueGrowth: 0, yoyProfitGrowth: 0 };
        }
        const prev = annualComparison[idx - 1];
        const revGrowth =
          prev.revenue > 0 ? Number((((item.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)) : 0;
        const profitGrowth =
          prev.netProfit !== 0
            ? Number((((item.netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 100).toFixed(1))
            : 0;
        return {
          ...item,
          yoyRevenueGrowth: revGrowth,
          yoyProfitGrowth: profitGrowth,
        };
      });

      // Best and worst months
      const monthsWithData = monthlyData.filter((m) => m.revenue > 0 || m.totalExpenses > 0);
      const bestMonth =
        monthsWithData.length > 0
          ? [...monthsWithData].sort((a, b) => b.netProfit - a.netProfit)[0]
          : monthlyData[0];
      const highestExpenseMonth =
        monthsWithData.length > 0
          ? [...monthsWithData].sort((a, b) => b.totalExpenses - a.totalExpenses)[0]
          : monthlyData[0];

      // Plant Owner Strategic KPIs
      const activeMonthsCount = monthsWithData.length || 1;
      const kpis = {
        averageMonthlyRevenue: Math.round(totalAnnualRevenue / (activeMonthsCount || 1)),
        averageMonthlyExpense: Math.round(totalAnnualExpenses / (activeMonthsCount || 1)),
        averageMonthlyProfit: Math.round(netAnnualProfit / (activeMonthsCount || 1)),
        bestMonth: {
          name: bestMonth.monthName,
          month: bestMonth.month,
          profit: bestMonth.netProfit,
          revenue: bestMonth.revenue,
        },
        highestExpenseMonth: {
          name: highestExpenseMonth.monthName,
          month: highestExpenseMonth.month,
          expense: highestExpenseMonth.totalExpenses,
        },
        costToRevenueRatio:
          totalAnnualRevenue > 0 ? Number(((totalAnnualExpenses / totalAnnualRevenue) * 100).toFixed(1)) : 0,
        topExpenseDriver: categoryDistribution[0] || { label: 'None', amount: 0, percentage: 0 },
      };

      res.json({
        selectedYear,
        availableYears,
        summary: {
          totalAnnualRevenue,
          totalAnnualDirectExpenses,
          totalAnnualWages,
          totalAnnualExpenses,
          netAnnualProfit,
          annualProfitMargin,
          totalAnnualPaidRevenue,
          totalAnnualOutstanding,
          totalAnnualTaxCollected,
          invoicesCount: allInvoices.filter((i) => new Date(i.issueDate).getFullYear() === selectedYear).length,
          expensesCount: allExpenses.filter((e) => new Date(e.expenseDate).getFullYear() === selectedYear).length,
        },
        monthlyData,
        annualComparison: annualComparisonWithGrowth,
        categoryDistribution,
        kpis,
      });
    } catch (err: any) {
      console.error('Financial analytics error:', err);
      res.status(500).json({ error: 'Failed to compute financial analytics', details: err.message });
    }
  }
);

export default router;

