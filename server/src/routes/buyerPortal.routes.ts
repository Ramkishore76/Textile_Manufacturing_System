import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { authenticateToken, requireBuyerOrStaff, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'agt-super-secret-jwt-key-2026';

const router = Router();

// PUBLIC: Buyer Enrollment (Direct Registration for B2B Buyer Clients)
router.post('/enroll', async (req, res): Promise<void> => {
  try {
    const { companyName, name, email, password, phone, address, taxNumber } = req.body;

    if (!companyName || !name || !email || !password) {
      res.status(400).json({
        error: 'Company Name, Contact Person Name, Email Address, and Password are all required.',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      res.status(409).json({
        error: 'An account with this email address already exists. Please sign in instead.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Buyer, BuyerAccount, and User transactionally
    const enrolled = await prisma.$transaction(async (tx) => {
      const buyer = await tx.buyer.create({
        data: {
          companyName: String(companyName).trim(),
          name: String(name).trim(),
          email: normalizedEmail,
          phone: phone ? String(phone).trim() : '+91 98000 00000',
          address: address ? String(address).trim() : 'B2B Client Delivery Address',
          taxNumber: taxNumber ? String(taxNumber).trim() : null,
          creditLimit: 1500000,
        },
      });

      const buyerAccount = await tx.buyerAccount.create({
        data: {
          buyerId: buyer.id,
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: passwordHash,
          role: 'BUYER',
          phone: phone ? String(phone).trim() : null,
          isActive: true,
          buyerAccountId: buyerAccount.id,
        },
      });

      // Factory welcome notification
      await tx.notification.create({
        data: {
          title: `New Buyer Enrolled: ${buyer.companyName}`,
          message: `${buyer.companyName} (${buyer.name}) has registered as an active B2B purchasing client.`,
          type: 'SUCCESS',
          link: '/app/orders',
        },
      });

      return { buyer, user };
    });

    const token = jwt.sign(
      {
        id: enrolled.user.id,
        email: enrolled.user.email,
        role: 'BUYER',
        buyerId: enrolled.buyer.id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Buyer account successfully enrolled! Welcome to AGT Mills.',
      token,
      redirectUrl: '/buyer/catalog',
      user: {
        id: enrolled.user.id,
        name: enrolled.user.name,
        email: enrolled.user.email,
        role: 'BUYER',
        buyerId: enrolled.buyer.id,
        buyerCompany: enrolled.buyer.companyName,
      },
    });
  } catch (err: any) {
    console.error('Buyer enrollment error:', err);
    res.status(500).json({ error: 'Failed to enroll buyer: ' + err.message });
  }
});

// Apply authentication and buyer/staff access to all remaining routes in this router
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

// GET Yarn Materials (for Admin / Store to configure initial BOM when creating product)
router.get('/yarns', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const yarns = await prisma.yarnMaterial.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        count: true,
        color: true,
        yarnType: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(yarns);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch yarn materials', details: err.message });
  }
});

// CREATE New Fabric Product (Strictly ADMIN and STORE alone)
router.post('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!['ADMIN', 'STORE'].includes(req.user?.role || '')) {
      res.status(403).json({
        error: 'Permission Denied. Only Plant Owner and Store Manager are authorized to add new fabric products.',
      });
      return;
    }

    const schema = z.object({
      name: z.string().min(2, 'Product name is required (min 2 characters)'),
      code: z.string().min(2, 'Product code is required (min 2 characters)'),
      fabricType: z.string().min(2, 'Fabric category is required'),
      gsm: z.number().positive('GSM must be a positive number'),
      widthInches: z.number().positive('Width in inches must be a positive number'),
      weaveType: z.string().min(2, 'Weave type is required'),
      unitPricePerMeter: z.number().positive('Unit price must be greater than zero'),
      description: z.string().optional(),
      requiresSpinning: z.boolean().default(true),
      yarnMaterialId: z.string().optional(),
      yarnQuantityPerMeter: z.number().positive().optional(),
      wastagePercentage: z.number().nonnegative().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const normalizedCode = parsed.data.code.trim().toUpperCase();

    // Check if product code already exists
    const existing = await prisma.fabricProduct.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      res.status(409).json({
        error: `A fabric product with code "${normalizedCode}" already exists (${existing.name}). Please use a unique code.`,
      });
      return;
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.fabricProduct.create({
        data: {
          code: normalizedCode,
          name: parsed.data.name.trim(),
          fabricType: parsed.data.fabricType.trim(),
          gsm: parsed.data.gsm,
          widthInches: parsed.data.widthInches,
          weaveType: parsed.data.weaveType.trim(),
          unitPricePerMeter: parsed.data.unitPricePerMeter,
          requiresSpinning: parsed.data.requiresSpinning,
          description: parsed.data.description?.trim() || null,
        },
      });

      // If initial BOM yarn is specified, link it immediately
      if (parsed.data.yarnMaterialId && parsed.data.yarnQuantityPerMeter) {
        await tx.billOfMaterials.create({
          data: {
            fabricProductId: product.id,
            yarnMaterialId: parsed.data.yarnMaterialId,
            yarnQuantityPerMeter: parsed.data.yarnQuantityPerMeter,
            wastagePercentage: parsed.data.wastagePercentage ?? 3.0,
          },
        });
      }

      return await tx.fabricProduct.findUnique({
        where: { id: product.id },
        include: {
          boms: {
            include: {
              yarnMaterial: true,
            },
          },
        },
      });
    });

    await logAudit({
      action: 'PRODUCT_CREATED',
      entityType: 'FabricProduct',
      entityId: newProduct!.id,
      performedById: req.user?.id,
      performedByName: req.user?.name,
      details: {
        code: newProduct!.code,
        name: newProduct!.name,
        unitPricePerMeter: newProduct!.unitPricePerMeter,
        fabricType: newProduct!.fabricType,
        gsm: newProduct!.gsm,
        widthInches: newProduct!.widthInches,
      },
    });

    res.status(201).json({
      product: newProduct,
      message: `Product "${newProduct!.name}" (${newProduct!.code}) created and published successfully!`,
    });
  } catch (err: any) {
    console.error('Create fabric product error:', err);
    res.status(500).json({ error: 'Failed to create fabric product', details: err.message });
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

// PLACE NEW PURCHASE ORDER via Buyer Portal (Supports Multiple Products in a Single Order)
router.post('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let buyerId = req.user?.buyerId;
    if (!buyerId && req.user?.email) {
      const b = await prisma.buyer.findFirst({ where: { email: req.user.email } });
      buyerId = b?.id || null;
    }
    if (!buyerId && ['ADMIN', 'STORE'].includes(req.user?.role || '')) {
      const firstBuyer = await prisma.buyer.findFirst();
      buyerId = firstBuyer?.id || null;
    }

    if (!buyerId) {
      res.status(400).json({ error: 'No active buyer profile associated with this account. Please enroll as a buyer.' });
      return;
    }

    // Normalize payload to handle either multiple items array or legacy single item
    let itemsToProcess: Array<{
      fabricProductId: string;
      requiredQuantity: number;
      color: string;
      notes?: string;
    }> = [];

    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      itemsToProcess = req.body.items.map((it: any) => ({
        fabricProductId: it.fabricProductId,
        requiredQuantity: Number(it.quantityMeters ?? it.requiredQuantity ?? it.quantity ?? 0),
        color: String(it.colorOrShade ?? it.color ?? 'Standard').trim(),
        notes: it.notes ? String(it.notes).trim() : undefined,
      }));
    } else if (req.body.fabricProductId) {
      itemsToProcess = [
        {
          fabricProductId: req.body.fabricProductId,
          requiredQuantity: Number(req.body.requiredQuantity ?? req.body.quantityMeters ?? 0),
          color: String(req.body.color ?? req.body.colorOrShade ?? 'Standard').trim(),
          notes: req.body.notes ? String(req.body.notes).trim() : undefined,
        },
      ];
    }

    if (itemsToProcess.length === 0) {
      res.status(400).json({ error: 'At least one fabric product must be selected to place an order.' });
      return;
    }

    // Validate each item
    for (let idx = 0; idx < itemsToProcess.length; idx++) {
      const it = itemsToProcess[idx];
      if (!it.fabricProductId) {
        res.status(400).json({ error: `Item #${idx + 1} is missing fabricProductId.` });
        return;
      }
      if (isNaN(it.requiredQuantity) || it.requiredQuantity < 1) {
        res.status(400).json({ error: `Item #${idx + 1} ordered meters must be at least 1 meter.` });
        return;
      }
      if (!it.color || it.color.length < 1) {
        it.color = 'Pure White';
      }
    }

    // Determine delivery date
    let requiredDeliveryDate = req.body.requiredDeliveryDate || req.body.deliveryDate;
    if (!requiredDeliveryDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 21);
      requiredDeliveryDate = defaultDate.toISOString().split('T')[0];
    }

    // Fetch buyer
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      res.status(404).json({ error: 'Buyer record not found' });
      return;
    }

    // Fetch all referenced products
    const productIds = Array.from(new Set(itemsToProcess.map((it) => it.fabricProductId)));
    const products = await prisma.fabricProduct.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const it of itemsToProcess) {
      if (!productMap.has(it.fabricProductId)) {
        res.status(404).json({ error: `Selected fabric product (${it.fabricProductId}) does not exist.` });
        return;
      }
    }

    // Calculate financials across all products
    let subtotal = 0;
    let totalMeters = 0;
    const preparedItems = itemsToProcess.map((it) => {
      const p = productMap.get(it.fabricProductId)!;
      const unitPrice = p.unitPricePerMeter;
      const lineTotal = it.requiredQuantity * unitPrice;
      subtotal += lineTotal;
      totalMeters += it.requiredQuantity;
      return {
        ...it,
        product: p,
        unitPrice,
        lineTotal,
      };
    });

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
          requiredDeliveryDate: new Date(requiredDeliveryDate),
          priority: req.body.priority || 'NORMAL',
          status: 'CONFIRMED',
          totalAmount,
          notes:
            req.body.notes ||
            `Multi-item order (${preparedItems.length} fabric line items) placed via Buyer Portal by ${buyer.companyName}`,
        },
      });

      for (const it of preparedItems) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            fabricProductId: it.product.id,
            color: it.color,
            requiredQuantity: it.requiredQuantity,
            unit: 'METERS',
            unitPrice: it.unitPrice,
            totalPrice: it.lineTotal,
            specifications: `${it.product.name} | ${it.product.gsm} GSM | ${it.product.widthInches}" | ${it.product.weaveType}`,
          },
        });
      }

      // Internal factory notification
      const productSummary = preparedItems.map((i) => `${i.product.name} (${i.requiredQuantity}m ${i.color})`).join(', ');
      await tx.notification.create({
        data: {
          title: `New Order Placed: ${orderNumber}`,
          message: `${buyer.companyName} placed order for ${totalMeters.toLocaleString()}m (${preparedItems.length} fabrics: ${productSummary}). Total: ₹${totalAmount.toLocaleString()}`,
          type: 'INFO',
          link: '/app/orders',
        },
      });

      // Buyer notification
      await tx.notification.create({
        data: {
          buyerId,
          title: `Order ${orderNumber} Confirmed`,
          message: `Your order for ${totalMeters.toLocaleString()}m (${preparedItems.length} products) has been confirmed. Production is scheduled.`,
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
      details: `Buyer ${buyer.companyName} (${req.user?.name}) placed order ${orderNumber} with ${preparedItems.length} line items for ₹${totalAmount.toLocaleString()}`,
      performedById: req.user?.id,
      performedByName: req.user?.name,
    });

    res.status(201).json({
      message: 'Purchase order placed successfully!',
      orderId: order.id,
      orderNumber: order.orderNumber,
      itemsCount: preparedItems.length,
      totalMeters,
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
    let buyerId = req.user?.buyerId;
    if (!buyerId && req.user?.email) {
      const b = await prisma.buyer.findFirst({ where: { email: req.user.email } });
      buyerId = b?.id || null;
    }
    if (!buyerId && ['ADMIN', 'STORE'].includes(req.user?.role || '')) {
      const firstBuyer = await prisma.buyer.findFirst();
      buyerId = firstBuyer?.id || null;
    }

    const whereClause: any = buyerId ? { buyerId } : {};

    const orders = await prisma.order.findMany({
      where: whereClause,
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
      where: whereClause,
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
    let whereClause: any = {};
    if (req.user?.role === 'BUYER') {
      let buyerId = req.user.buyerId;
      if (!buyerId && req.user.email) {
        const b = await prisma.buyer.findFirst({ where: { email: req.user.email } });
        buyerId = b?.id || null;
      }
      whereClause = { buyerId: buyerId || '' };
    } else if (['ADMIN', 'STORE'].includes(req.user?.role || '')) {
      if (req.query.buyerId) {
        whereClause = { buyerId: req.query.buyerId as string };
      }
      // If no query buyerId, admin sees all buyer orders
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: { id: true, name: true, companyName: true, email: true, phone: true, address: true },
        },
        items: {
          include: {
            fabricProduct: true,
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

// GET Single Buyer Order Details
router.get('/orders/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaff = ['ADMIN', 'STORE'].includes(req.user?.role || '');
    let whereClause: any = { id: req.params.id };

    if (!isStaff) {
      let buyerId = req.user?.buyerId;
      if (!buyerId && req.user?.email) {
        const b = await prisma.buyer.findFirst({ where: { email: req.user.email } });
        buyerId = b?.id || null;
      }
      whereClause.buyerId = buyerId || '';
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            address: true,
            taxNumber: true,
          },
        },
        items: {
          include: {
            fabricProduct: true,
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
    const buyerId = req.user?.buyerId;

    const notifications = await prisma.notification.findMany({
      where: buyerId ? { buyerId } : {},
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// Mark Notification as read
router.put('/notifications/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buyerId = req.user?.buyerId;

    const notif = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        ...(buyerId ? { buyerId } : {}),
      },
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
