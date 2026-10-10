import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET attendance records
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'HR', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { date, employeeId } = req.query;
      const where: any = {};

      if (date) {
        const start = new Date(`${date}T00:00:00.000Z`);
        const end = new Date(`${date}T23:59:59.999Z`);
        where.date = { gte: start, lte: end };
      }

      if (employeeId) {
        where.employeeId = String(employeeId);
      }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          employee: true,
          shift: true,
        },
        orderBy: { date: 'desc' },
      });

      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch attendance', details: err.message });
    }
  }
);

// RECORD daily attendance
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'HR', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        employeeId: z.string(),
        date: z.string(),
        shiftId: z.string().optional(),
        status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE']),
        hoursWorked: z.number().min(0).max(24).default(8),
        overtimeHours: z.number().min(0).max(16).default(0),
        remarks: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const attendanceDate = new Date(parsed.data.date);

      const record = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: parsed.data.employeeId,
            date: attendanceDate,
          },
        },
        update: {
          shiftId: parsed.data.shiftId,
          status: parsed.data.status,
          hoursWorked: parsed.data.hoursWorked,
          overtimeHours: parsed.data.overtimeHours,
          remarks: parsed.data.remarks,
        },
        create: {
          employeeId: parsed.data.employeeId,
          date: attendanceDate,
          shiftId: parsed.data.shiftId,
          status: parsed.data.status,
          hoursWorked: parsed.data.hoursWorked,
          overtimeHours: parsed.data.overtimeHours,
          remarks: parsed.data.remarks,
        },
        include: {
          employee: true,
          shift: true,
        },
      });

      res.status(201).json(record);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save attendance', details: err.message });
    }
  }
);

export default router;
