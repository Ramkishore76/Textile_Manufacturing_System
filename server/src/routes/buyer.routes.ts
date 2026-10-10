import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

const buyerSchema = z.object({
  name: z.string().min(2, 'Contact name required'),
  companyName: z.string().min(2, 'Company name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone required'),
  address: z.string().min(5, 'Address required'),
  taxNumber: z.string().optional(),
  creditLimit: z.number().optional().default(1000000),
});

// GET all buyers (Internal staff only)
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'DISPATCH', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const buyers = await prisma.buyer.findMany({
        include: {
          orders: {
            select: { id: true, orderNumber: true, status: true, totalAmount: true },
          },
          accounts: {
            include: {
              users: { select: { id: true, email: true, name: true, isActive: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(buyers);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch buyers', details: err.message });
    }
  }
);

// GET single buyer
router.get(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'DISPATCH', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const buyer = await prisma.buyer.findUnique({
        where: { id: req.params.id },
        include: {
          orders: { orderBy: { orderDate: 'desc' } },
          invoices: { orderBy: { issueDate: 'desc' } },
          dispatches: { orderBy: { dispatchDate: 'desc' } },
        },
      });

      if (!buyer) {
        res.status(404).json({ error: 'Buyer not found' });
        return;
      }

      res.json(buyer);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch buyer details', details: err.message });
    }
  }
);

// CREATE buyer
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = buyerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const buyer = await prisma.buyer.create({
        data: parsed.data,
      });

      // Also create buyer account for portal access
      const buyerAccount = await prisma.buyerAccount.create({
        data: {
          buyerId: buyer.id,
          status: 'ACTIVE',
        },
      });

      await logAudit({
        action: 'BUYER_CREATED',
        entityType: 'Buyer',
        entityId: buyer.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { companyName: buyer.companyName, email: buyer.email },
      });

      res.status(201).json({ ...buyer, accountId: buyerAccount.id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create buyer', details: err.message });
    }
  }
);

// UPDATE buyer
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const buyer = await prisma.buyer.update({
        where: { id: req.params.id },
        data: req.body,
      });

      await logAudit({
        action: 'BUYER_UPDATED',
        entityType: 'Buyer',
        entityId: buyer.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: req.body,
      });

      res.json(buyer);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update buyer', details: err.message });
    }
  }
);

export default router;
