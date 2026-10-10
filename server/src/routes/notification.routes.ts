import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role || 'ADMIN';

    const roleAllowedPrefixes: Record<string, string[]> = {
      PRODUCTION: ['/app/production', '/app/inventory', '/app/finished-goods', '/app/orders', '/app/quality'],
      QUALITY: ['/app/quality', '/app/finished-goods', '/app/production'],
      STORE: ['/app/inventory', '/app/purchases', '/app/finished-goods', '/app/orders'],
      SALES: ['/app/orders', '/app/finished-goods'],
      DISPATCH: ['/app/dispatch', '/app/finished-goods', '/app/orders'],
      ACCOUNTS: ['/app/accounts', '/app/attendance', '/app/wages', '/app/orders'],
    };

    const allowedPrefixes = roleAllowedPrefixes[role];

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId }, { userId: null, buyerId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const filtered = allowedPrefixes
      ? notifications.filter((n) => {
          if (!n.link) return true;
          return allowedPrefixes.some((prefix) => n.link?.startsWith(prefix));
        })
      : notifications;

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark notification as read', details: err.message });
  }
});

export default router;
