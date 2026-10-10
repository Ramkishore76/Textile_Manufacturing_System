import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all expenses with category breakdown
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { category, orderId } = req.query;
      const where: any = {};
      if (category) where.category = String(category);
      if (orderId) where.orderId = String(orderId);

      const expenses = await prisma.expenseRecord.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { expenseDate: 'desc' },
      });

      res.json(expenses);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
    }
  }
);

// RECORD expense
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        category: z.enum([
          'RAW_MATERIAL_CONSUMED',
          'DIRECT_LABOUR',
          'MACHINE_OPERATING',
          'ELECTRICITY_UTILITIES',
          'DYEING_PROCESSING',
          'MAINTENANCE',
          'OTHER',
        ]),
        orderId: z.string().optional(),
        amount: z.number().positive(),
        description: z.string().min(3),
        receiptReference: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const count = await prisma.expenseRecord.count();
      const expenseNumber = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const expense = await prisma.expenseRecord.create({
        data: {
          expenseNumber,
          category: parsed.data.category,
          orderId: parsed.data.orderId,
          amount: parsed.data.amount,
          description: parsed.data.description,
          receiptReference: parsed.data.receiptReference,
          recordedById: req.user?.id,
        },
      });

      await logAudit({
        action: 'EXPENSE_RECORDED',
        entityType: 'ExpenseRecord',
        entityId: expense.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { category: expense.category, amount: expense.amount, description: expense.description },
      });

      res.status(201).json(expense);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record expense', details: err.message });
    }
  }
);

export default router;
