import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all payments
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'SALES']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const payments = await prisma.payment.findMany({
        include: {
          invoice: {
            include: {
              buyer: true,
              order: { select: { id: true, orderNumber: true } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      });
      const isOwner = req.user?.role === 'ADMIN';
      const sanitizedPayments = payments.map((p) => {
        if (!isOwner && p.invoice?.buyer) {
          return {
            ...p,
            invoice: {
              ...p.invoice,
              buyer: {
                id: p.invoice.buyer.id,
                companyName: 'Client Confidential',
                name: 'Authorized Purchaser',
                email: 'confidential@client.internal',
                phone: '***',
                address: 'Direct Factory Consignment',
                taxNumber: '***',
              },
            },
          };
        }
        return p;
      });
      res.json(sanitizedPayments);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch payments', details: err.message });
    }
  }
);

// RECORD Buyer Payment (Atomically updates invoice paid amount & balance; prevents duplicate reference)
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        invoiceId: z.string(),
        amount: z.number().positive('Payment amount must be greater than zero'),
        paymentMethod: z.enum(['BANK_TRANSFER', 'CHEQUE', 'UPI', 'CASH']),
        transactionReference: z.string().min(3, 'Transaction reference required'),
        notes: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const { invoiceId, amount, paymentMethod, transactionReference, notes } = parsed.data;

      // 1. Check for Duplicate Payment Reference (TEST 7)
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionReference },
      });

      if (existingPayment) {
        res.status(400).json({
          error: `Duplicate Payment Rejected: Transaction reference '${transactionReference}' has ALREADY been recorded previously for payment ${existingPayment.paymentNumber}.`,
        });
        return;
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { buyer: true },
      });

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      if (invoice.balanceAmount <= 0) {
        res.status(400).json({ error: 'This invoice has already been fully paid.' });
        return;
      }

      const count = await prisma.payment.count();
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const result = await prisma.$transaction(async (tx) => {
        // Create Payment record
        const payment = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId,
            buyerId: invoice.buyerId,
            amount,
            paymentMethod,
            transactionReference,
            notes,
            recordedById: req.user?.id,
          },
        });

        // Update Invoice balances
        const newPaidAmount = invoice.paidAmount + amount;
        const newBalance = Math.max(0, invoice.totalAmount - newPaidAmount);
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            status: newStatus,
          },
        });

        // Send confirmation notification to Buyer
        await tx.notification.create({
          data: {
            buyerId: invoice.buyerId,
            title: `Payment Received: ₹${amount.toLocaleString()}`,
            message: `Payment ${paymentNumber} of ₹${amount.toLocaleString()} received for Invoice ${
              invoice.invoiceNumber
            }. Remaining Balance: ₹${newBalance.toLocaleString()}.`,
            type: 'SUCCESS',
            link: '/buyer/invoices',
          },
        });

        return { payment, invoice: updatedInvoice };
      });

      await logAudit({
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: result.payment.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: {
          paymentNumber,
          invoiceNumber: invoice.invoiceNumber,
          amount,
          reference: transactionReference,
        },
      });

      res.status(201).json(result);
    } catch (err: any) {
      console.error('Payment error:', err);
      res.status(500).json({ error: 'Failed to record payment', details: err.message });
    }
  }
);

export default router;
