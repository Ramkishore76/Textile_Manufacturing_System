import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireBuyerOrStaff, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// Apply authentication and buyer/staff access to all routes in this router
router.use(authenticateToken);
router.use(requireBuyerOrStaff);

// GET Fabric Products Catalog for Buyer Portal
router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.fabricProduct.findMany({
      include: {
        boms: {
          include: {
            yarnMaterial: {
              select: { id: true, code: true, name: true, count: true, color: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Also get stock rolls passed in finished inventory per product
    const rolls = await prisma.roll.findMany({
      where: {
        qualityStatus: 'PASSED',
        inventoryStatus: 'IN_FINISHED_STOCK',
      },
      select: {
        fabricType: true,
        lengthMeters: true,
      },
    });

    const stockMap: Record<string, number> = {};
    for (const r of rolls) {
      stockMap[r.fabricType] = (stockMap[r.fabricType] || 0) + r.lengthMeters;
    }

    const catalog = products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      fabricType: p.fabricType,
      gsm: p.gsm,
      widthInches: p.widthInches,
      weaveType: p.weaveType,
      unitPricePerMeter: p.unitPricePerMeter,
      requiresSpinning: p.requiresSpinning,
      description: p.description,
      inStockMeters: stockMap[p.name] || stockMap[p.fabricType] || 0,
      materials: p.boms.map((b) => ({
        yarnName: b.yarnMaterial.name,
        yarnCode: b.yarnMaterial.code,
        yarnCount: b.yarnMaterial.count,
        quantityPerMeter: b.yarnQuantityPerMeter,
      })),
    }));

    res.json(catalog);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products catalog', details: err.message });
  }
});

// UPDATE Fabric Product Details & Cost Price (Strictly ADMIN and STORE alone)
router.put('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!['ADMIN', 'STORE'].includes(req.user?.role || '')) {
      res.status(403).json({
        error: 'Permission Denied. Only Plant Owner and Store Manager are authorized to modify fabric details and cost prices.',
      });
      return;
    }

    const schema = z.object({
      name: z.string().min(2).optional(),
      code: z.string().min(2).optional(),
      fabricType: z.string().min(2).optional(),
      gsm: z.number().positive().optional(),
      widthInches: z.number().positive().optional(),
      weaveType: z.string().min(2).optional(),
      unitPricePerMeter: z.number().positive('Cost price must be greater than zero').optional(),
      description: z.string().optional(),
      requiresSpinning: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const existing = await prisma.fabricProduct.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Fabric product not found' });
      return;
    }

    const updated = await prisma.fabricProduct.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    await logAudit({
      action: 'UPDATE_FABRIC_PRODUCT_PRICING',
      entityType: 'FabricProduct',
      entityId: updated.id,
      details: `${req.user?.role} (${req.user?.name}) updated ${updated.name} cost price to ₹${updated.unitPricePerMeter}/m. Details: ${JSON.stringify(parsed.data)}`,
      performedById: req.user?.id,
      performedByName: req.user?.name,
    });

    res.json({
      ...updated,
      product: updated,
      message: 'Product specifications and cost price updated successfully',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

// PLACE NEW PURCHASE ORDER via Buyer Portal
router.post('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId;
    if (!buyerId) {
      res.status(400).json({ error: 'No active buyer profile associated with this account' });
      return;
    }

    // Normalize payload to handle either single item payload or { items: [...] } format
    let fabricProductId = req.body.fabricProductId;
    let requiredQuantity = req.body.requiredQuantity;
    let color = req.body.color;
    let requiredDeliveryDate = req.body.requiredDeliveryDate || req.body.deliveryDate;
    let priority = req.body.priority || 'NORMAL';
    let notes = req.body.notes;

    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      const firstItem = req.body.items[0];
      fabricProductId = firstItem.fabricProductId;
      requiredQuantity = firstItem.quantityMeters ?? firstItem.requiredQuantity;
      color = firstItem.colorOrShade ?? firstItem.color ?? 'Standard';
      if (!requiredDeliveryDate && firstItem.deliveryDate) {
        requiredDeliveryDate = firstItem.deliveryDate;
      }
      if (!notes && firstItem.notes) {
        notes = firstItem.notes;
      }
    }

    if (!requiredDeliveryDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 21);
      requiredDeliveryDate = defaultDate.toISOString().split('T')[0];
    }

    const schema = z.object({
      fabricProductId: z.string(),
      requiredQuantity: z.number().min(10, 'Minimum order quantity is 10 meters'),
      color: z.string().min(2, 'Color / shade specification is required'),
      requiredDeliveryDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid delivery date is required'),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
      notes: z.string().optional(),
    });

    const parsed = schema.safeParse({
      fabricProductId,
      requiredQuantity: Number(requiredQuantity),
      color,
      requiredDeliveryDate,
      priority,
      notes,
    });

    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const product = await prisma.fabricProduct.findUnique({
      where: { id: parsed.data.fabricProductId },
    });

    if (!product) {
      res.status(404).json({ error: 'Selected fabric product does not exist' });
      return;
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      res.status(404).json({ error: 'Buyer record not found' });
      return;
    }

    // Calculate financials
    const unitPrice = product.unitPricePerMeter;
    const subtotal = parsed.data.requiredQuantity * unitPrice;
    const taxAmount = subtotal * 0.05; // 5% GST
    const totalAmount = subtotal + taxAmount;

    // Generate Order Number
    const count = await prisma.order.count();
    const orderNumber = `ORD-2026-${String(count + 1).padStart(3, '0')}`;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          orderDate: new Date(),
          requiredDeliveryDate: new Date(parsed.data.requiredDeliveryDate),
          priority: parsed.data.priority,
          status: 'CONFIRMED',
          totalAmount,
          notes: parsed.data.notes || `Order placed via Buyer Portal by ${buyer.companyName}`,
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          fabricProductId: product.id,
          color: parsed.data.color,
          requiredQuantity: parsed.data.requiredQuantity,
          unit: 'METERS',
          unitPrice,
          totalPrice: subtotal,
          specifications: `${product.name} | ${product.gsm} GSM | ${product.widthInches}" | ${product.weaveType}`,
        },
      });

      // Internal factory notification
      await tx.notification.create({
        data: {
          title: `New Order Placed: ${orderNumber}`,
          message: `${buyer.companyName} placed order for ${parsed.data.requiredQuantity}m of ${product.name} (${parsed.data.color}). Total: ₹${totalAmount.toLocaleString()}`,
          type: 'INFO',
          link: '/app/orders',
        },
      });

      // Buyer notification
      await tx.notification.create({
        data: {
          buyerId,
          title: `Order ${orderNumber} Confirmed`,
          message: `Your order for ${parsed.data.requiredQuantity}m ${product.name} has been confirmed. Production is scheduled.`,
          type: 'SUCCESS',
          link: `/buyer/orders/${createdOrder.id}`,
        },
      });

      return createdOrder;
    });

    await logAudit({
      action: 'BUYER_ORDER_PLACED',
      entityType: 'Order',
      entityId: order.id,
      details: `Buyer ${buyer.companyName} (${req.user?.name}) placed order ${orderNumber} for ₹${totalAmount.toLocaleString()}`,
      performedById: req.user?.id,
      performedByName: req.user?.name,
    });

    res.status(201).json({
      message: 'Purchase order placed successfully!',
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalMeters: parsed.data.requiredQuantity,
      subtotal,
      taxAmount,
      totalAmount,
      order,
    });
  } catch (err: any) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place purchase order', details: err.message });
  }
});


// GET Buyer Dashboard Summary
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: {
        items: true,
        rolls: true,
        dispatches: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
    const inProduction = orders.filter((o) => ['MATERIAL_ALLOCATED', 'IN_PRODUCTION'].includes(o.status));
    const awaitingQuality = orders.filter((o) => o.status === 'QUALITY_INSPECTION');
    const readyToShip = orders.filter((o) => o.status === 'READY_TO_SHIP');
    const dispatched = orders.filter((o) => ['DISPATCHED', 'PARTIALLY_DISPATCHED', 'DELIVERED'].includes(o.status));

    const invoices = await prisma.invoice.findMany({
      where: { buyerId },
    });

    const totalOutstanding = invoices.reduce((sum, i) => sum + i.balanceAmount, 0);

    const upcomingDeliveries = activeOrders
      .map((o) => ({
        orderNumber: o.orderNumber,
        deliveryDate: o.requiredDeliveryDate,
        status: o.status,
      }))
      .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
      .slice(0, 5);

    res.json({
      summary: {
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        inProduction: inProduction.length,
        awaitingQuality: awaitingQuality.length,
        readyToShip: readyToShip.length,
        dispatched: dispatched.length,
        totalOutstandingBalance: totalOutstanding,
      },
      upcomingDeliveries,
      recentOrders: orders.slice(0, 5),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch buyer dashboard', details: err.message });
  }
});

// GET Buyer Orders
router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: {
        items: {
          include: {
            fabricProduct: {
              select: { name: true, fabricType: true, gsm: true, widthInches: true },
            },
          },
        },
        dispatches: {
          select: { dispatchNumber: true, status: true, trackingNumber: true, dispatchDate: true },
        },
        invoices: {
          select: { invoiceNumber: true, totalAmount: true, status: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch buyer orders', details: err.message });
  }
});

// GET Single Buyer Order Details (strictly scoped to buyerId)
router.get('/orders/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        buyerId, // Strict isolation! (TEST 5)
      },
      include: {
        items: {
          include: {
            fabricProduct: {
              select: {
                name: true,
                fabricType: true,
                gsm: true,
                widthInches: true,
                weaveType: true,
              },
            },
          },
        },
        rolls: {
          select: {
            rollId: true,
            lengthMeters: true,
            qualityStatus: true,
            inventoryStatus: true,
            createdAt: true,
          },
        },
        dispatches: {
          include: {
            items: {
              include: {
                roll: { select: { rollId: true } },
              },
            },
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
            issueDate: true,
            dueDate: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found or you are not authorized to view this record.' });
      return;
    }

    // Buyer-friendly stage timeline
    let stageIndex = 1;
    switch (order.status) {
      case 'CONFIRMED':
        stageIndex = 1;
        break;
      case 'MATERIAL_ALLOCATED':
        stageIndex = 2;
        break;
      case 'IN_PRODUCTION':
        stageIndex = 3;
        break;
      case 'QUALITY_INSPECTION':
        stageIndex = 4;
        break;
      case 'READY_TO_SHIP':
        stageIndex = 5;
        break;
      case 'PARTIALLY_DISPATCHED':
      case 'DISPATCHED':
        stageIndex = 6;
        break;
      case 'DELIVERED':
        stageIndex = 7;
        break;
      default:
        stageIndex = 1;
    }

    const stages = [
      { id: 1, label: 'Order Confirmed', completed: stageIndex >= 1, current: stageIndex === 1 },
      { id: 2, label: 'Material Preparation', completed: stageIndex >= 2, current: stageIndex === 2 },
      { id: 3, label: 'Production in Progress', completed: stageIndex >= 3, current: stageIndex === 3 },
      { id: 4, label: 'Quality Inspection', completed: stageIndex >= 4, current: stageIndex === 4 },
      { id: 5, label: 'Ready to Ship', completed: stageIndex >= 5, current: stageIndex === 5 },
      { id: 6, label: 'Dispatched', completed: stageIndex >= 6, current: stageIndex === 6 },
      { id: 7, label: 'Delivered', completed: stageIndex >= 7, current: stageIndex === 7 },
    ];

    res.json({
      order,
      stages,
      currentStageIndex: stageIndex,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order details', details: err.message });
  }
});

// GET Buyer Invoices
router.get('/invoices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const invoices = await prisma.invoice.findMany({
      where: { buyerId },
      include: {
        order: { select: { id: true, orderNumber: true } },
        dispatch: { select: { id: true, dispatchNumber: true, trackingNumber: true } },
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoices', details: err.message });
  }
});

// GET Buyer Payments History
router.get('/payments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const payments = await prisma.payment.findMany({
      where: { buyerId },
      include: {
        invoice: { select: { invoiceNumber: true, totalAmount: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payment history', details: err.message });
  }
});

// GET Buyer Notifications
router.get('/notifications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const notifications = await prisma.notification.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// Mark Notification as read
router.put('/notifications/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user!.buyerId!;

    const notif = await prisma.notification.findFirst({
      where: { id: req.params.id, buyerId },
    });

    if (!notif) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification', details: err.message });
  }
});

export default router;
