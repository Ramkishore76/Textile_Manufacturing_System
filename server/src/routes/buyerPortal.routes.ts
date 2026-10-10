import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken, requireBuyer, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication and strict buyer check to all routes in this router
router.use(authenticateToken);
router.use(requireBuyer);

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
