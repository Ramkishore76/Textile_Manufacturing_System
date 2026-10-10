import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all employees
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'HR', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const employees = await prisma.employee.findMany({
        include: {
          attendance: { take: 5, orderBy: { date: 'desc' } },
          wageRecords: { take: 3, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { employeeCode: 'asc' },
      });
      res.json(employees);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch employees', details: err.message });
    }
  }
);

// CREATE employee
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'HR', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        employeeCode: z.string().min(2),
        name: z.string().min(2),
        department: z.string().min(2),
        role: z.string().min(2),
        phone: z.string().min(5),
        hourlyRate: z.number().min(0).default(100),
        dailyBaseWage: z.number().min(0).default(800),
        overtimeHourlyRate: z.number().min(0).default(150),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const emp = await prisma.employee.create({
        data: parsed.data,
      });

      res.status(201).json(emp);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create employee', details: err.message });
    }
  }
);

export default router;
