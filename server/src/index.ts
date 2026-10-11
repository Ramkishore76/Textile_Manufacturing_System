import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import buyerRoutes from './routes/buyer.routes';
import inventoryRoutes from './routes/inventory.routes';
import purchaseRoutes from './routes/purchase.routes';
import orderRoutes from './routes/order.routes';
import machineRoutes from './routes/machine.routes';
import productionRoutes from './routes/production.routes';
import qualityRoutes from './routes/quality.routes';
import rollRoutes from './routes/roll.routes';
import dispatchRoutes from './routes/dispatch.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import wageRoutes from './routes/wage.routes';
import expenseRoutes from './routes/expense.routes';
import reportRoutes from './routes/report.routes';
import buyerPortalRoutes from './routes/buyerPortal.routes';
import notificationRoutes from './routes/notification.routes';
import { prisma } from './db/prisma';

import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const qualityUploadsDir = path.join(uploadsDir, 'quality');
if (!fs.existsSync(qualityUploadsDir)) {
  fs.mkdirSync(qualityUploadsDir, { recursive: true });
}

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Root API discovery endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'AGT Textile Mills — Enterprise API Gateway',
    version: '1.0.0',
    status: 'ONLINE',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth (Login, Profile, Verification)',
      buyers: '/api/buyers (Buyer directory & credit settings)',
      inventory: '/api/inventory (Yarn stocks, BOM formulas, reservation)',
      purchases: '/api/purchases (Suppliers, Purchase Requests, POs, GRN Receipts)',
      orders: '/api/orders (Buyer orders, BOM availability check)',
      machines: '/api/machines (Looms, Spinning frames, Status monitor, Downtime)',
      production: '/api/production (Jobs, Loom allocation, Hourly logs)',
      quality: '/api/quality (4-Point inspections, Defect grading, Rework cycles)',
      rolls: '/api/rolls (Roll barcodes, Finished stock, Traceability passport)',
      dispatch: '/api/dispatch (Atomic shipments, duplicate prevention, tax invoices)',
      invoices: '/api/invoices (Commercial invoices, 5% GST, net terms)',
      payments: '/api/payments (Buyer payments, unique reference validation)',
      employees: '/api/employees (Staff directory & base wage rates)',
      attendance: '/api/attendance (Daily shift attendance & overtime)',
      wages: '/api/wages (Attendance-derived monthly wage calculations & payroll)',
      expenses: '/api/expenses (Manufacturing overheads & cost categories)',
      reports: '/api/reports (Plant dashboard, order-wise margins, financials)',
      buyerPortal: '/api/buyer-portal (Isolated buyer dashboard, 7-stage tracker)',
      notifications: '/api/notifications (Real-time in-app alerts)',
    },
  });
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: 'UP',
      system: 'AGT Textile Mills Management API',
      timestamp: new Date().toISOString(),
      database: 'Connected (PostgreSQL / Supabase)',
      userCount,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DEGRADED',
      database: 'Error',
      error: err.message,
    });
  }
});

// Telemetry & runtime diagnostics
app.get('/api/system-status', async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;
    const mem = process.memoryUsage();
    res.json({
      service: 'AGT Textile Mills Backend Service Engine',
      uptimeSeconds: Math.floor(process.uptime()),
      databaseLatencyMs: dbLatency,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      error: 'System diagnostic failed',
      details: err.message,
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/rolls', rollRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wages', wageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/buyer-portal', buyerPortalRoutes);
app.use('/api/notifications', notificationRoutes);

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`AGT Textile Mills Server running on port ${PORT}`);
    console.log(`API Base: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down server gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connections closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
