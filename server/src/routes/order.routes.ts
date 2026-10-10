import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all orders with items, buyer details, and progress statistics
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'PRODUCTION', 'STORE', 'QUALITY', 'DISPATCH', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          buyer: true,
          items: {
            include: {
              fabricProduct: {
                include: {
                  boms: {
                    include: { yarnMaterial: true },
                  },
                },
              },
            },
          },
          rolls: {
            select: { id: true, rollId: true, qualityStatus: true, inventoryStatus: true, lengthMeters: true },
          },
          dispatches: true,
          invoices: true,
        },
        orderBy: { orderDate: 'desc' },
      });

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
    }
  }
);

// GET single order with full traceability
router.get(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'PRODUCTION', 'STORE', 'QUALITY', 'DISPATCH', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          buyer: true,
          items: {
            include: {
              fabricProduct: {
                include: {
                  boms: {
                    include: { yarnMaterial: true },
                  },
                },
              },
            },
          },
          productionJobs: {
            include: {
              machine: true,
              shift: true,
              assignedEmployee: true,
              logs: true,
            },
          },
          rolls: {
            include: {
              inspections: true,
              reworks: true,
            },
          },
          dispatches: {
            include: {
              items: true,
            },
          },
          invoices: {
            include: {
              items: true,
              payments: true,
            },
          },
          purchaseRequests: {
            include: {
              yarnMaterial: true,
            },
          },
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch order details', details: err.message });
    }
  }
);

// CREATE order with BOM material availability calculation and auto Purchase Request if shortage
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        buyerId: z.string(),
        requiredDeliveryDate: z.string(),
        priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            fabricProductId: z.string(),
            color: z.string(),
            requiredQuantity: z.number().positive(),
            unit: z.string().default('METERS'),
            unitPrice: z.number().positive(),
            specifications: z.string().optional(),
          })
        ).min(1, 'At least one order line item is required'),
        autoReserveIfAvailable: z.boolean().default(true),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const { buyerId, requiredDeliveryDate, priority, notes, items, autoReserveIfAvailable } = parsed.data;

      const count = await prisma.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.requiredQuantity * item.unitPrice;
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            buyerId,
            requiredDeliveryDate: new Date(requiredDeliveryDate),
            priority,
            notes,
            status: 'CONFIRMED',
            totalAmount,
            items: {
              create: items.map((it) => ({
                fabricProductId: it.fabricProductId,
                color: it.color,
                requiredQuantity: it.requiredQuantity,
                unit: it.unit,
                unitPrice: it.unitPrice,
                totalPrice: it.requiredQuantity * it.unitPrice,
                specifications: it.specifications,
              })),
            },
          },
          include: {
            buyer: true,
            items: {
              include: {
                fabricProduct: {
                  include: {
                    boms: {
                      include: { yarnMaterial: true },
                    },
                  },
                },
              },
            },
          },
        });

        // 2. Calculate BOM Material Requirements
        const materialRequirements: {
          yarnMaterialId: string;
          yarnName: string;
          yarnCode: string;
          requiredKg: number;
          availableKg: number;
          shortageKg: number;
          hasShortage: boolean;
        }[] = [];

        for (const item of newOrder.items) {
          for (const bom of item.fabricProduct.boms) {
            const wastageMultiplier = 1 + (bom.wastagePercentage || 0) / 100;
            const yarnNeeded = item.requiredQuantity * bom.yarnQuantityPerMeter * wastageMultiplier;

            const existing = materialRequirements.find((m) => m.yarnMaterialId === bom.yarnMaterialId);
            if (existing) {
              existing.requiredKg += yarnNeeded;
            } else {
              const currentStock = bom.yarnMaterial.currentStock;
              const reservedStock = bom.yarnMaterial.reservedStock;
              const availableStock = Math.max(0, currentStock - reservedStock);

              materialRequirements.push({
                yarnMaterialId: bom.yarnMaterialId,
                yarnName: bom.yarnMaterial.name,
                yarnCode: bom.yarnMaterial.code,
                requiredKg: yarnNeeded,
                availableKg: availableStock,
                shortageKg: yarnNeeded > availableStock ? yarnNeeded - availableStock : 0,
                hasShortage: yarnNeeded > availableStock,
              });
            }
          }
        }

        // Re-check shortages after summing
        for (const mat of materialRequirements) {
          mat.shortageKg = mat.requiredKg > mat.availableKg ? mat.requiredKg - mat.availableKg : 0;
          mat.hasShortage = mat.shortageKg > 0;
        }

        const anyShortage = materialRequirements.some((m) => m.hasShortage);

        // 3. If Shortage -> Automatically generate Purchase Requests
        const generatedPurchaseRequests = [];
        if (anyShortage) {
          for (const mat of materialRequirements) {
            if (mat.hasShortage) {
              const prCount = await tx.purchaseRequest.count();
              const requestNumber = `PR-${new Date().getFullYear()}-${String(prCount + 1).padStart(3, '0')}`;

              const pr = await tx.purchaseRequest.create({
                data: {
                  requestNumber,
                  yarnMaterialId: mat.yarnMaterialId,
                  orderId: newOrder.id,
                  requestedQuantity: Math.ceil(mat.shortageKg),
                  requiredByDate: new Date(requiredDeliveryDate),
                  reason: `Shortage for Order ${orderNumber}: Needed ${mat.requiredKg.toFixed(
                    1
                  )} KG, Available ${mat.availableKg.toFixed(1)} KG`,
                  status: 'PENDING',
                  requestedById: req.user?.id,
                },
              });
              generatedPurchaseRequests.push(pr);
            }
          }
        } else if (autoReserveIfAvailable) {
          // 4. If Sufficient -> Allocate and Reserve Materials
          for (const mat of materialRequirements) {
            const yarn = await tx.yarnMaterial.findUnique({ where: { id: mat.yarnMaterialId } });
            if (yarn) {
              const prevReserved = yarn.reservedStock;
              const newReserved = prevReserved + mat.requiredKg;

              await tx.yarnMaterial.update({
                where: { id: mat.yarnMaterialId },
                data: { reservedStock: newReserved },
              });

              await tx.inventoryTransaction.create({
                data: {
                  yarnMaterialId: mat.yarnMaterialId,
                  transactionType: 'RESERVATION',
                  quantity: mat.requiredKg,
                  previousStock: yarn.currentStock,
                  newStock: yarn.currentStock,
                  previousReserved: prevReserved,
                  newReserved: newReserved,
                  referenceType: 'ORDER',
                  referenceId: newOrder.id,
                  reason: `Reserved for Order ${orderNumber}`,
                  performedById: req.user?.id,
                },
              });
            }
          }

          await tx.order.update({
            where: { id: newOrder.id },
            data: { status: 'MATERIAL_ALLOCATED' },
          });
        }

        return {
          order: newOrder,
          materialRequirements,
          hasShortage: anyShortage,
          generatedPurchaseRequests,
        };
      });

      await logAudit({
        action: 'ORDER_CREATED',
        entityType: 'Order',
        entityId: result.order.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: {
          orderNumber,
          buyer: result.order.buyer.companyName,
          totalAmount,
          hasShortage: result.hasShortage,
        },
      });

      res.status(201).json(result);
    } catch (err: any) {
      console.error('Order creation error:', err);
      res.status(500).json({ error: 'Failed to create order', details: err.message });
    }
  }
);

// Manual Material / Yarn Reservation Trigger
router.post(
  ['/:id/reserve-yarn', '/:id/reserve-materials'],
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'STORE', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
            include: {
              fabricProduct: {
                include: {
                  boms: { include: { yarnMaterial: true } },
                },
              },
            },
          },
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== 'CONFIRMED') {
        res.status(400).json({
          error: `Order is already in "${order.status}" status. Yarn materials can only be reserved for Confirmed orders.`,
        });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          for (const bom of item.fabricProduct.boms) {
            const needed = item.requiredQuantity * bom.yarnQuantityPerMeter * (1 + bom.wastagePercentage / 100);
            const yarn = await tx.yarnMaterial.findUnique({ where: { id: bom.yarnMaterialId } });

            if (!yarn) continue;
            const available = yarn.currentStock - yarn.reservedStock;
            if (available < needed) {
              throw new Error(
                `Insufficient yarn stock for ${yarn.name}. Required: ${needed.toFixed(1)} KG, Available: ${available.toFixed(1)} KG`
              );
            }

            const prevReserved = yarn.reservedStock;
            const newReserved = prevReserved + needed;

            await tx.yarnMaterial.update({
              where: { id: yarn.id },
              data: { reservedStock: newReserved },
            });

            await tx.inventoryTransaction.create({
              data: {
                yarnMaterialId: yarn.id,
                transactionType: 'RESERVATION',
                quantity: needed,
                previousStock: yarn.currentStock,
                newStock: yarn.currentStock,
                previousReserved: prevReserved,
                newReserved,
                referenceType: 'ORDER',
                referenceId: order.id,
                reason: `Reserved for Order ${order.orderNumber}`,
                performedById: req.user?.id,
              },
            });
          }
        }

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'MATERIAL_ALLOCATED' },
        });

        return updatedOrder;
      });

      await logAudit({
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'Order',
        entityId: order.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { newStatus: 'MATERIAL_ALLOCATED', action: 'MANUAL_YARN_RESERVATION' },
      });

      res.json({ message: 'Yarn materials reserved and allocated successfully', order: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to reserve materials' });
    }
  }
);

// Update Order Status
router.put(
  '/:id/status',
  authenticateToken,
  requireRole(['ADMIN', 'SALES', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status },
      });

      await logAudit({
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'Order',
        entityId: order.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { newStatus: status },
      });

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update order status', details: err.message });
    }
  }
);

export default router;
