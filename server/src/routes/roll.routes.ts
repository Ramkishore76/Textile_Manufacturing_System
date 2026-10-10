import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all rolls with query filtering
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'QUALITY', 'STORE', 'DISPATCH', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, qualityStatus, orderId } = req.query;
      const where: any = {};

      if (status) where.inventoryStatus = String(status);
      if (qualityStatus) where.qualityStatus = String(qualityStatus);
      if (orderId) where.orderId = String(orderId);

      const rolls = await prisma.roll.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, buyer: { select: { companyName: true } } } },
          orderItem: true,
          location: true,
          inspections: { orderBy: { inspectionDate: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });

      const isOwner = req.user?.role === 'ADMIN';
      const sanitized = rolls.map((r) =>
        !isOwner && r.order ? { ...r, order: { ...r.order, buyer: null } } : r
      );
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch rolls', details: err.message });
    }
  }
);

// GET finished goods rolls available for dispatch
router.get(
  '/finished-stock',
  authenticateToken,
  requireRole(['ADMIN', 'DISPATCH', 'SALES', 'STORE', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const rolls = await prisma.roll.findMany({
        where: {
          qualityStatus: 'PASSED',
          inventoryStatus: 'IN_FINISHED_STOCK',
        },
        include: {
          order: { select: { id: true, orderNumber: true, buyer: { select: { id: true, companyName: true } } } },
          orderItem: true,
          location: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const isOwner = req.user?.role === 'ADMIN';
      const sanitized = rolls.map((r) =>
        !isOwner && r.order ? { ...r, order: { ...r.order, buyer: null } } : r
      );
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch finished stock', details: err.message });
    }
  }
);

// GET single roll with end-to-end manufacturing traceability
router.get(
  '/:rollId',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'QUALITY', 'DISPATCH', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const roll = await prisma.roll.findFirst({
        where: {
          OR: [{ id: req.params.rollId }, { rollId: req.params.rollId }],
        },
        include: {
          order: {
            include: { buyer: true },
          },
          orderItem: {
            include: {
              fabricProduct: {
                include: {
                  boms: { include: { yarnMaterial: true } },
                },
              },
            },
          },
          productionJob: {
            include: {
              machine: true,
              shift: true,
              assignedEmployee: true,
              logs: true,
            },
          },
          location: true,
          inspections: {
            orderBy: { inspectionDate: 'desc' },
          },
          reworks: {
            orderBy: { createdAt: 'desc' },
          },
          dispatchItems: {
            include: { dispatch: true },
          },
        },
      });

      if (!roll) {
        res.status(404).json({ error: 'Roll not found' });
        return;
      }

      const isOwner = req.user?.role === 'ADMIN';
      if (!isOwner && roll.order) {
        (roll.order as any).buyer = null;
      }

      res.json(roll);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch roll details', details: err.message });
    }
  }
);

export default router;
