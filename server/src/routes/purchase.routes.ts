import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// ==================== SUPPLIERS ====================
router.get(
  '/suppliers',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' },
      });
      res.json(suppliers);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch suppliers', details: err.message });
    }
  }
);

router.post(
  '/suppliers',
  authenticateToken,
  requireRole(['ADMIN', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        contactPerson: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(5),
        address: z.string().min(5),
        yarnTypesSupplied: z.string().min(2),
        paymentTerms: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const supplier = await prisma.supplier.create({
        data: parsed.data,
      });

      res.status(201).json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create supplier', details: err.message });
    }
  }
);

// ==================== PURCHASE REQUESTS ====================
router.get(
  '/requests',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'PRODUCTION', 'SALES', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const requests = await prisma.purchaseRequest.findMany({
        include: {
          yarnMaterial: true,
          order: { select: { id: true, orderNumber: true } },
          purchaseOrders: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch purchase requests', details: err.message });
    }
  }
);

router.post(
  '/requests',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'PRODUCTION', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        yarnMaterialId: z.string(),
        orderId: z.string().optional(),
        requestedQuantity: z.number().positive(),
        requiredByDate: z.string(),
        reason: z.string().min(3),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const count = await prisma.purchaseRequest.count();
      const requestNumber = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const pr = await prisma.purchaseRequest.create({
        data: {
          requestNumber,
          yarnMaterialId: parsed.data.yarnMaterialId,
          orderId: parsed.data.orderId,
          requestedQuantity: parsed.data.requestedQuantity,
          requiredByDate: new Date(parsed.data.requiredByDate),
          reason: parsed.data.reason,
          status: 'PENDING',
          requestedById: req.user?.id,
        },
        include: {
          yarnMaterial: true,
          order: true,
        },
      });

      await logAudit({
        action: 'PURCHASE_REQUEST_CREATED',
        entityType: 'PurchaseRequest',
        entityId: pr.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { requestNumber, yarn: pr.yarnMaterial.name, quantity: pr.requestedQuantity },
      });

      res.status(201).json(pr);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create purchase request', details: err.message });
    }
  }
);

// ==================== PURCHASE ORDERS ====================
router.get(
  '/orders',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const pos = await prisma.purchaseOrder.findMany({
        include: {
          supplier: true,
          yarnMaterial: true,
          purchaseRequest: true,
          goodsReceipts: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(pos);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch purchase orders', details: err.message });
    }
  }
);

router.post(
  '/orders',
  authenticateToken,
  requireRole(['ADMIN', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        purchaseRequestId: z.string().optional(),
        supplierId: z.string(),
        yarnMaterialId: z.string(),
        orderedQuantity: z.number().positive(),
        unitPrice: z.number().positive(),
        expectedDeliveryDate: z.string(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const count = await prisma.purchaseOrder.count();
      const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
      const totalCost = parsed.data.orderedQuantity * parsed.data.unitPrice;

      const po = await prisma.$transaction(async (tx) => {
        const newPo = await tx.purchaseOrder.create({
          data: {
            poNumber,
            purchaseRequestId: parsed.data.purchaseRequestId,
            supplierId: parsed.data.supplierId,
            yarnMaterialId: parsed.data.yarnMaterialId,
            orderedQuantity: parsed.data.orderedQuantity,
            unitPrice: parsed.data.unitPrice,
            totalCost,
            expectedDeliveryDate: new Date(parsed.data.expectedDeliveryDate),
            status: 'ORDERED',
          },
          include: {
            supplier: true,
            yarnMaterial: true,
          },
        });

        if (parsed.data.purchaseRequestId) {
          await tx.purchaseRequest.update({
            where: { id: parsed.data.purchaseRequestId },
            data: { status: 'ORDERED' },
          });
        }

        return newPo;
      });

      await logAudit({
        action: 'PURCHASE_ORDER_CREATED',
        entityType: 'PurchaseOrder',
        entityId: po.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { poNumber, supplier: po.supplier.name, totalCost },
      });

      res.status(201).json(po);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create purchase order', details: err.message });
    }
  }
);

// ==================== GOODS RECEIPT (GRN) ====================
// Atomic Goods Receipt with stock update and audit log
router.get(
  '/receipts',
  authenticateToken,
  requireRole(['ADMIN', 'STORE', 'ACCOUNTS', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const grns = await prisma.goodsReceipt.findMany({
        include: {
          supplier: true,
          yarnMaterial: true,
          purchaseOrder: true,
        },
        orderBy: { receiptDate: 'desc' },
      });
      res.json(grns);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch goods receipts', details: err.message });
    }
  }
);

router.post(
  '/receipts',
  authenticateToken,
  requireRole(['ADMIN', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        purchaseOrderId: z.string().optional(),
        supplierId: z.string(),
        yarnMaterialId: z.string(),
        batchNumber: z.string().min(2, 'Batch/Lot number required'),
        quantityReceived: z.number().positive(),
        unit: z.string().default('KG'),
        unitCost: z.number().positive(),
        inspectionStatus: z.enum(['ACCEPTED', 'REJECTED', 'PENDING']).default('ACCEPTED'),
        remarks: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const totalCost = parsed.data.quantityReceived * parsed.data.unitCost;
      const count = await prisma.goodsReceipt.count();
      const receiptNumber = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      // Atomic transaction: create GRN, update Yarn stock, record InventoryTransaction, update PO
      const result = await prisma.$transaction(async (tx) => {
        const grn = await tx.goodsReceipt.create({
          data: {
            receiptNumber,
            purchaseOrderId: parsed.data.purchaseOrderId,
            supplierId: parsed.data.supplierId,
            yarnMaterialId: parsed.data.yarnMaterialId,
            batchNumber: parsed.data.batchNumber,
            quantityReceived: parsed.data.quantityReceived,
            unit: parsed.data.unit,
            unitCost: parsed.data.unitCost,
            totalCost,
            inspectionStatus: parsed.data.inspectionStatus,
            remarks: parsed.data.remarks,
            receivedById: req.user?.id,
          },
          include: {
            supplier: true,
            yarnMaterial: true,
          },
        });

        // Only increase saleable currentStock if inspection is ACCEPTED
        if (parsed.data.inspectionStatus === 'ACCEPTED') {
          const yarn = await tx.yarnMaterial.findUnique({
            where: { id: parsed.data.yarnMaterialId },
          });

          if (!yarn) {
            throw new Error('Yarn material not found');
          }

          const previousStock = yarn.currentStock;
          const newStock = previousStock + parsed.data.quantityReceived;

          await tx.yarnMaterial.update({
            where: { id: parsed.data.yarnMaterialId },
            data: {
              currentStock: newStock,
              costPerUnit: parsed.data.unitCost, // Update latest valuation cost
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              yarnMaterialId: parsed.data.yarnMaterialId,
              transactionType: 'RECEIPT',
              quantity: parsed.data.quantityReceived,
              previousStock,
              newStock,
              previousReserved: yarn.reservedStock,
              newReserved: yarn.reservedStock,
              unitCost: parsed.data.unitCost,
              referenceType: 'GOODS_RECEIPT',
              referenceId: grn.id,
              goodsReceiptId: grn.id,
              reason: `Received under GRN ${receiptNumber} (Batch: ${parsed.data.batchNumber})`,
              performedById: req.user?.id,
            },
          });
        }

        // If linked to a PO, update PO status
        if (parsed.data.purchaseOrderId) {
          const po = await tx.purchaseOrder.findUnique({
            where: { id: parsed.data.purchaseOrderId },
            include: { goodsReceipts: true },
          });

          if (po) {
            const totalReceived =
              po.goodsReceipts
                .filter((r) => r.inspectionStatus === 'ACCEPTED')
                .reduce((sum, r) => sum + r.quantityReceived, 0) +
              (parsed.data.inspectionStatus === 'ACCEPTED' ? parsed.data.quantityReceived : 0);

            const isComplete = totalReceived >= po.orderedQuantity;

            await tx.purchaseOrder.update({
              where: { id: po.id },
              data: {
                status: isComplete ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
              },
            });

            if (po.purchaseRequestId && isComplete) {
              await tx.purchaseRequest.update({
                where: { id: po.purchaseRequestId },
                data: { status: 'RECEIVED' },
              });
            }
          }
        }

        return grn;
      });

      await logAudit({
        action: 'GOODS_RECEIVED',
        entityType: 'GoodsReceipt',
        entityId: result.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: {
          receiptNumber,
          batchNumber: parsed.data.batchNumber,
          quantity: parsed.data.quantityReceived,
          supplier: result.supplier.name,
          inspectionStatus: parsed.data.inspectionStatus,
        },
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record goods receipt' });
    }
  }
);

export default router;
