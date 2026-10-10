import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all wage records
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'HR']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { month, year } = req.query;
      const where: any = {};
      if (month) where.periodMonth = Number(month);
      if (year) where.periodYear = Number(year);

      const wages = await prisma.wageRecord.findMany({
        where,
        include: { employee: true },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      });

      res.json(wages);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch wage records', details: err.message });
    }
  }
);

// CALCULATE wages for an employee for a specific month/year based on attendance
router.post(
  '/calculate',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'HR']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        employeeId: z.string(),
        periodMonth: z.number().min(1).max(12),
        periodYear: z.number().min(2020),
        bonuses: z.number().min(0).default(0),
        deductions: z.number().min(0).default(0),
        adjustmentReason: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const { employeeId, periodMonth, periodYear, bonuses, deductions, adjustmentReason } = parsed.data;

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      // Fetch all attendance for this employee in the month
      const startDate = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
      const endDate = new Date(Date.UTC(periodYear, periodMonth, 0, 23, 59, 59));

      const attendanceList = await prisma.attendance.findMany({
        where: {
          employeeId,
          date: { gte: startDate, lte: endDate },
        },
      });

      let presentDays = 0;
      let totalOvertimeHours = 0;

      for (const att of attendanceList) {
        if (att.status === 'PRESENT') presentDays += 1;
        else if (att.status === 'HALF_DAY') presentDays += 0.5;
        totalOvertimeHours += att.overtimeHours || 0;
      }

      // Calculation breakdown
      const basePay = presentDays * employee.dailyBaseWage;
      const overtimePay = totalOvertimeHours * employee.overtimeHourlyRate;
      const netWage = basePay + overtimePay + bonuses - deductions;

      const notes = `Days Worked: ${presentDays} days @ ₹${employee.dailyBaseWage}/day = ₹${basePay}. Overtime: ${totalOvertimeHours} hrs @ ₹${employee.overtimeHourlyRate}/hr = ₹${overtimePay}. Bonuses: ₹${bonuses}. Deductions: ₹${deductions}.${
        adjustmentReason ? ` Adjustment note: ${adjustmentReason}` : ''
      }`;

      const wageRecord = await prisma.wageRecord.upsert({
        where: {
          employeeId_periodMonth_periodYear: {
            employeeId,
            periodMonth,
            periodYear,
          },
        },
        update: {
          basePay,
          overtimePay,
          bonuses,
          deductions,
          netWage,
          calculationNotes: notes,
        },
        create: {
          employeeId,
          periodMonth,
          periodYear,
          basePay,
          overtimePay,
          bonuses,
          deductions,
          netWage,
          status: 'PENDING',
          calculationNotes: notes,
        },
        include: { employee: true },
      });

      await logAudit({
        action: 'WAGE_CALCULATED',
        entityType: 'WageRecord',
        entityId: wageRecord.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { employee: employee.name, netWage, period: `${periodMonth}/${periodYear}` },
      });

      res.status(201).json(wageRecord);
    } catch (err: any) {
      console.error('Wage calculation error:', err);
      res.status(500).json({ error: 'Failed to calculate wage', details: err.message });
    }
  }
);

// APPROVE or PAY wage record
router.put(
  '/:id/status',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      if (!['PENDING', 'APPROVED', 'PAID'].includes(status)) {
        res.status(400).json({ error: 'Invalid wage status' });
        return;
      }

      const updated = await prisma.wageRecord.update({
        where: { id: req.params.id },
        data: {
          status,
          paymentDate: status === 'PAID' ? new Date() : undefined,
        },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update wage status', details: err.message });
    }
  }
);

export default router;
