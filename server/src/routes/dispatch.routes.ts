import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all eligible rolls for dispatch for a given order
router.get(
  '/eligible-rolls/:orderId',
  authenticateToken,
  requireRole(['ADMIN', 'DISPATCH', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const rolls = await prisma.roll.findMany({
        where: {
          orderId: req.params.orderId,
          qualityStatus: 'PASSED',
          inventoryStatus: 'IN_FINISHED_STOCK',
        },
        include: {
          orderItem: { include: { fabricProduct: true } },
          location: true,
        },
      });

      res.json(rolls);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch eligible rolls', details: err.message });
    }
  }
);

// GET dispatch history
router.get(
  '/history',
  authenticateToken,
  requireRole(['ADMIN', 'DISPATCH', 'SALES', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const dispatches = await prisma.dispatch.findMany({
        include: {
          order: { select: { id: true, orderNumber: true } },
          buyer: true,
          items: {
            include: {
              roll: true,
              orderItem: { include: { fabricProduct: true } },
            },
          },
          invoices: true,
        },
        orderBy: { dispatchDate: 'desc' },
      });

      res.json(dispatches);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch dispatch history', details: err.message });
    }
  }
);

// GET single dispatch details
router.get(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN', 'DISPATCH', 'SALES', 'ACCOUNTS', 'BUYER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const dispatch = await prisma.dispatch.findUnique({
        where: { id: req.params.id },
        include: {
          order: { include: { buyer: true } },
          buyer: true,
          items: {
            include: {
              roll: {
                include: { location: true },
              },
              orderItem: { include: { fabricProduct: true } },
            },
          },
          invoices: {
            include: { payments: true },
          },
        },
      });

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch record not found' });
        return;
      }

      // Security check for BUYER role: only allow own buyer's dispatches
      if (req.user?.role === 'BUYER' && dispatch.buyerId !== req.user.buyerId) {
        res.status(403).json({ error: 'Access denied. You can only view your own dispatches.' });
        return;
      }

      res.json(dispatch);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch dispatch details', details: err.message });
    }
  }
);

// CREATE Dispatch (ATOMIC transaction with duplicate prevention, invoice generation & notification)
router.post(
  '/create',
  authenticateToken,
  requireRole(['ADMIN', 'DISPATCH']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        orderId: z.string(),
        carrierName: z.string().min(2, 'Carrier / Logistics provider required'),
        vehicleNumber: z.string().optional(),
        trackingNumber: z.string().optional(),
        rollIds: z.array(z.string()).min(1, 'At least one roll must be selected for dispatch'),
        notes: z.string().optional(),
        generateInvoice: z.boolean().default(true),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const { orderId, carrierName, vehicleNumber, trackingNumber, rollIds, notes, generateInvoice } = parsed.data;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: true,
          items: { include: { fabricProduct: true } },
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch and validate all rolls
        const rolls = await tx.roll.findMany({
          where: {
            id: { in: rollIds },
          },
          include: {
            orderItem: true,
          },
        });

        if (rolls.length !== rollIds.length) {
          throw new Error('One or more selected rolls could not be found.');
        }

        // 2. Strict Validations:
        for (const r of rolls) {
          // Validation A: Must belong to the specified order
          if (r.orderId !== orderId) {
            throw new Error(`Security Violation: Roll ${r.rollId} belongs to Order ${r.orderId}, not ${order.orderNumber}.`);
          }

          // Validation B: Must be Quality Passed
          if (r.qualityStatus !== 'PASSED') {
            throw new Error(
              `Quality Rejection: Roll ${r.rollId} has status '${r.qualityStatus}'. Only 'PASSED' rolls can be dispatched.`
            );
          }

          // Validation C: Prevent Duplicate Dispatch (TEST 4)
          if (r.inventoryStatus === 'DISPATCHED') {
            throw new Error(
              `Duplicate Dispatch Rejected: Roll ${r.rollId} has ALREADY been dispatched. Cannot dispatch the same roll twice!`
            );
          }

          // Validation D: Must be in finished goods stock
          if (r.inventoryStatus !== 'IN_FINISHED_STOCK') {
            throw new Error(
              `Inventory Status Error: Roll ${r.rollId} is currently in '${r.inventoryStatus}', not in finished goods stock.`
            );
          }
        }

        // Calculate total dispatched meters in this shipment
        const totalMeters = rolls.reduce((sum, r) => sum + r.lengthMeters, 0);
        const count = await tx.dispatch.count();
        const dispatchNumber = `DSP-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
        const autoTracking =
          trackingNumber || `TRK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

        // 3. Create Dispatch Record
        const newDispatch = await tx.dispatch.create({
          data: {
            dispatchNumber,
            orderId,
            buyerId: order.buyerId,
            carrierName,
            vehicleNumber,
            trackingNumber: autoTracking,
            status: 'DISPATCHED',
            totalMeters,
            totalRolls: rolls.length,
            dispatchStaffId: req.user?.id,
            notes,
            items: {
              create: rolls.map((r) => ({
                orderItemId: r.orderItemId,
                rollId: r.id,
                meters: r.lengthMeters,
              })),
            },
          },
        });

        // 4. Update Rolls status to DISPATCHED
        for (const r of rolls) {
          await tx.roll.update({
            where: { id: r.id },
            data: {
              inventoryStatus: 'DISPATCHED',
            },
          });

          // Update Order Item dispatched quantity
          await tx.orderItem.update({
            where: { id: r.orderItemId },
            data: {
              dispatchedQuantity: { increment: r.lengthMeters },
            },
          });
        }

        // 5. Check if order is fully fulfilled or partially delivered (TEST 10)
        const updatedOrderItems = await tx.orderItem.findMany({ where: { orderId } });
        const allCompleted = updatedOrderItems.every((it) => it.dispatchedQuantity >= it.requiredQuantity);
        const newOrderStatus = allCompleted ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED';

        await tx.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });

        // 6. Generate Commercial Invoice if requested
        let invoice = null;
        if (generateInvoice) {
          const invCount = await tx.invoice.count();
          const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(3, '0')}`;

          // Calculate subtotal for these specific dispatched rolls
          let subtotal = 0;
          const invoiceItemsData = [];

          for (const item of order.items) {
            const rollsForItem = rolls.filter((r) => r.orderItemId === item.id);
            if (rollsForItem.length > 0) {
              const metersForItem = rollsForItem.reduce((sum, r) => sum + r.lengthMeters, 0);
              const amount = metersForItem * item.unitPrice;
              subtotal += amount;

              invoiceItemsData.push({
                description: `${item.fabricProduct.name} (${item.color}) - ${rollsForItem.length} rolls`,
                quantity: metersForItem,
                unit: item.unit,
                unitPrice: item.unitPrice,
                amount,
              });
            }
          }

          const taxRate = 5.0; // 5% GST
          const taxAmount = (subtotal * taxRate) / 100;
          const totalAmount = subtotal + taxAmount;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30); // 30 Days Net

          invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              orderId,
              buyerId: order.buyerId,
              dispatchId: newDispatch.id,
              subtotal,
              taxRate,
              taxAmount,
              totalAmount,
              paidAmount: 0,
              balanceAmount: totalAmount,
              status: 'UNPAID',
              dueDate,
              items: {
                create: invoiceItemsData,
              },
            },
          });
        }

        // 7. Send In-App Notification to Buyer Portal
        await tx.notification.create({
          data: {
            buyerId: order.buyerId,
            title: `Order ${order.orderNumber} Dispatched!`,
            message: `Dispatch ${dispatchNumber}: ${totalMeters} meters (${rolls.length} rolls) shipped via ${carrierName}. Tracking: ${autoTracking}.`,
            type: 'SUCCESS',
            link: '/buyer/dispatch',
          },
        });

        return {
          dispatch: newDispatch,
          invoice,
          orderStatus: newOrderStatus,
        };
      });

      await logAudit({
        action: 'DISPATCH_CONFIRMED',
        entityType: 'Dispatch',
        entityId: result.dispatch.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: {
          dispatchNumber: result.dispatch.dispatchNumber,
          orderNumber: order.orderNumber,
          totalRolls: rollIds.length,
          orderStatus: result.orderStatus,
        },
      });

      res.status(201).json(result);
    } catch (err: any) {
      console.error('Dispatch creation error:', err);
      res.status(400).json({ error: err.message || 'Failed to create dispatch' });
    }
  }
);

export default router;
