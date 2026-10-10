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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Quick DB ping
    const userCount = await prisma.user.count();
    res.json({
      status: 'UP',
      system: 'Everest Textile Mills Management API',
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
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Everest Textile Mills Server running on port ${PORT}`);
    console.log(`API Base: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

export default app;
