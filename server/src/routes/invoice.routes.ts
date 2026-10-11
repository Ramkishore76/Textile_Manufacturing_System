import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all invoices
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'SALES', 'DISPATCH']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invoices = await prisma.invoice.findMany({
        include: {
          buyer: true,
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
  }
);

// GET single invoice
router.get(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'SALES', 'DISPATCH', 'BUYER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
        include: {
          buyer: true,
          order: true,
          dispatch: true,
          items: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });

      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      // Security: if BUYER role, verify ownership
      if (req.user?.role === 'BUYER' && invoice.buyerId !== req.user.buyerId) {
        res.status(403).json({ error: 'Access denied to this invoice' });
        return;
      }

      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch invoice details', details: err.message });
    }
  }
);

// GET printable tax invoice HTML (compatible with direct browser print-to-PDF)
router.get(
  '/:id/print',
  authenticateToken,
  requireRole(['ADMIN', 'ACCOUNTS', 'SALES', 'DISPATCH', 'BUYER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
        include: {
          buyer: true,
          order: true,
          dispatch: true,
          items: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });

      if (!invoice) {
        res.status(404).send('<h2>404 - Invoice not found</h2>');
        return;
      }

      if (req.user?.role === 'BUYER' && invoice.buyerId !== req.user.buyerId) {
        res.status(403).send('<h2>403 - Access denied to this invoice</h2>');
        return;
      }

      const { renderInvoiceHtml } = await import('../utils/invoiceTemplate');
      const html = renderInvoiceHtml(invoice);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: any) {
      res.status(500).send(`<h2>500 - Internal Server Error</h2><p>${err.message}</p>`);
    }
  }
);

export default router;

