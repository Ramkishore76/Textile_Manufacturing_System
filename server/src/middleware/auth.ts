import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'agt_textile_mills_super_secret_jwt_key_2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  buyerAccountId?: string | null;
  buyerId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
      (typeof req.query.token === 'string' ? req.query.token : null);

    if (!token) {
      res.status(401).json({ error: 'Authentication required. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        buyerAccount: {
          include: {
            buyer: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or account is deactivated.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      buyerAccountId: user.buyerAccountId,
      buyerId: user.buyerAccount?.buyerId || null,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // ADMIN has full access to internal systems
    if (req.user.role === 'ADMIN' && !allowedRoles.includes('BUYER_ONLY')) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`,
      });
      return;
    }

    next();
  };
};

export const requireBuyer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== 'BUYER') {
    res.status(403).json({ error: 'Access restricted to authenticated Buyer accounts only.' });
    return;
  }

  if (!req.user.buyerId) {
    res.status(403).json({ error: 'No active buyer profile linked to this user account.' });
    return;
  }

  next();
};
