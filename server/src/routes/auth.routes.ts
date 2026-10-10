import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'everest_textile_mills_super_secret_jwt_key_2026';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const getRoleRedirectUrl = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return '/app/dashboard';
    case 'SALES':
      return '/app/orders';
    case 'STORE':
      return '/app/inventory';
    case 'PRODUCTION':
      return '/app/production';
    case 'QUALITY':
      return '/app/quality';
    case 'DISPATCH':
      return '/app/dispatch';
    case 'ACCOUNTS':
      return '/app/accounts';
    case 'BUYER':
      return '/buyer/dashboard';
    default:
      return '/app/dashboard';
  }
};

router.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        buyerAccount: {
          include: {
            buyer: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated. Please contact the administrator.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        buyerId: user.buyerAccount?.buyerId || null,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const redirectUrl = getRoleRedirectUrl(user.role);

    res.json({
      message: 'Login successful',
      token,
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        buyerId: user.buyerAccount?.buyerId || null,
        buyerCompany: user.buyerAccount?.buyer?.companyName || null,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        buyerAccount: {
          include: {
            buyer: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        buyerId: user.buyerAccount?.buyer?.id || null,
        buyerCompany: user.buyerAccount?.buyer?.companyName || null,
        redirectUrl: getRoleRedirectUrl(user.role),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching user profile.' });
  }
});

export default router;
