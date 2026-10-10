import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all yarn materials with available stock and alert indicators
router.get(
  '/yarns',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'PRODUCTION', 'SALES', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const yarns = await prisma.yarnMaterial.findMany({
        include: {
          boms: {
            include: {
              fabricProduct: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { code: 'asc' },
      });

      const enrichedYarns = yarns.map((y) => {
        const availableStock = Math.max(0, y.currentStock - y.reservedStock);
        const isLowStock = availableStock <= y.minimumStockAlert;
        return {
          ...y,
          availableStock,
          isLowStock,
        };
      });

      res.json(enrichedYarns);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch yarn inventory', details: err.message });
    }
  }
);

// CREATE new yarn material
router.post(
  '/yarns',
  authenticateToken,
  requireRole(['ADMIN', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        yarnType: z.string().min(2),
        count: z.string().min(1),
        color: z.string().min(1),
        unit: z.string().default('KG'),
        currentStock: z.number().default(0),
        minimumStockAlert: z.number().default(100),
        costPerUnit: z.number().default(0),
        storageLocation: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const yarn = await prisma.yarnMaterial.create({
        data: parsed.data,
      });

      if (yarn.currentStock > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            yarnMaterialId: yarn.id,
            transactionType: 'RECEIPT',
            quantity: yarn.currentStock,
            previousStock: 0,
            newStock: yarn.currentStock,
            unitCost: yarn.costPerUnit,
            reason: 'Initial Opening Stock',
            performedById: req.user?.id,
          },
        });
      }

      await logAudit({
        action: 'YARN_CREATED',
        entityType: 'YarnMaterial',
        entityId: yarn.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: yarn,
      });

      res.status(201).json(yarn);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create yarn material', details: err.message });
    }
  }
);

// Stock Adjustment (Reason required, never silently overwrite)
router.post(
  '/adjust',
  authenticateToken,
  requireRole(['ADMIN', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        yarnMaterialId: z.string(),
        adjustmentType: z.enum(['INCREASE', 'DECREASE']),
        quantity: z.number().positive('Quantity must be greater than zero'),
        reason: z.string().min(5, 'Specific reason required for stock adjustment'),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const { yarnMaterialId, adjustmentType, quantity, reason } = parsed.data;

      const result = await prisma.$transaction(async (tx) => {
        const yarn = await tx.yarnMaterial.findUnique({
          where: { id: yarnMaterialId },
        });

        if (!yarn) {
          throw new Error('Yarn material not found');
        }

        const previousStock = yarn.currentStock;
        let newStock = previousStock;

        if (adjustmentType === 'INCREASE') {
          newStock = previousStock + quantity;
        } else {
          if (previousStock - yarn.reservedStock < quantity) {
            throw new Error(
              `Cannot decrease stock by ${quantity} KG. Available unreserved stock is only ${
                previousStock - yarn.reservedStock
              } KG.`
            );
          }
          newStock = previousStock - quantity;
        }

        const updatedYarn = await tx.yarnMaterial.update({
          where: { id: yarnMaterialId },
          data: { currentStock: newStock },
        });

        const txRecord = await tx.inventoryTransaction.create({
          data: {
            yarnMaterialId,
            transactionType: 'ADJUSTMENT',
            quantity: adjustmentType === 'INCREASE' ? quantity : -quantity,
            previousStock,
            newStock,
            previousReserved: yarn.reservedStock,
            newReserved: yarn.reservedStock,
            unitCost: yarn.costPerUnit,
            referenceType: 'MANUAL_ADJUSTMENT',
            reason: `[${adjustmentType}] ${reason}`,
            performedById: req.user?.id,
          },
        });

        return { updatedYarn, txRecord };
      });

      await logAudit({
        action: 'STOCK_ADJUSTED',
        entityType: 'YarnMaterial',
        entityId: yarnMaterialId,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { adjustmentType, quantity, reason, newStock: result.updatedYarn.currentStock },
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to adjust stock' });
    }
  }
);

// GET Inventory Transactions History
router.get(
  '/transactions',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { yarnId } = req.query;
      const where = yarnId ? { yarnMaterialId: String(yarnId) } : {};

      const transactions = await prisma.inventoryTransaction.findMany({
        where,
        include: {
          yarnMaterial: { select: { code: true, name: true, unit: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch inventory transactions', details: err.message });
    }
  }
);

// GET Fabric Products
router.get(
  '/fabrics',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'PRODUCTION', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const fabrics = await prisma.fabricProduct.findMany({
        include: {
          boms: {
            include: {
              yarnMaterial: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });
      res.json(fabrics);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch fabric products', details: err.message });
    }
  }
);

// CREATE Fabric Product
router.post(
  '/fabrics',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        fabricType: z.string().min(2),
        gsm: z.number().positive(),
        widthInches: z.number().positive(),
        weaveType: z.string().min(2),
        unitPricePerMeter: z.number().positive(),
        requiresSpinning: z.boolean().default(true),
        description: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const fabric = await prisma.fabricProduct.create({
        data: parsed.data,
      });

      res.status(201).json(fabric);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create fabric product', details: err.message });
    }
  }
);

// GET & CREATE Bill of Materials (BOM)
router.get(
  '/boms',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'STORE', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const boms = await prisma.billOfMaterials.findMany({
        include: {
          fabricProduct: true,
          yarnMaterial: true,
        },
      });
      res.json(boms);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch BOMs', details: err.message });
    }
  }
);

router.post(
  '/boms',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        fabricProductId: z.string(),
        yarnMaterialId: z.string(),
        yarnQuantityPerMeter: z.number().positive(),
        wastagePercentage: z.number().min(0).default(3.0),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const bom = await prisma.billOfMaterials.upsert({
        where: {
          fabricProductId_yarnMaterialId: {
            fabricProductId: parsed.data.fabricProductId,
            yarnMaterialId: parsed.data.yarnMaterialId,
          },
        },
        update: parsed.data,
        create: parsed.data,
        include: {
          fabricProduct: true,
          yarnMaterial: true,
        },
      });

      res.status(201).json(bom);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save BOM', details: err.message });
    }
  }
);

export default router;
