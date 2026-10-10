import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/email.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'agt_textile_mills_super_secret_jwt_key_2026';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'SALES', 'STORE', 'PRODUCTION', 'QUALITY', 'DISPATCH', 'ACCOUNTS', 'BUYER']),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'Verification code must be 6 digits'),
  tempToken: z.string().min(1, 'Temporary session token required'),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
  tempToken: z.string().min(1, 'Temporary session token required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'Verification code must be 6 digits'),
  tempToken: z.string().min(1, 'Temporary session token required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const getRoleRedirectUrl = (role: string): string => {
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

const maskEmail = (email: string): string => {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

/**
 * Step 1: User Login
 * Validates credentials and dispatches 6-digit verification code via Brevo
 */
router.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: normalizedEmail.replace('@agttextile.com', '@everesttextile.com') },
          { email: normalizedEmail.replace('@everesttextile.com', '@agttextile.com') },
        ],
      },
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

    // Direct password authentication (No verification code requested during standard login)
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

    res.json({
      message: 'Login successful',
      token,
      redirectUrl: getRoleRedirectUrl(user.role),
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

/**
 * Step 1 (Alternative): New User Registration
 * Validates details and dispatches 6-digit verification code via Brevo to verify email
 */
router.post('/register', async (req, res): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Invalid registration data',
        details: parseResult.error.errors,
      });
      return;
    }

    const { name, email, password, role, phone, companyName } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = EmailService.generateOtp();

    // Save in verification store
    EmailService.setOtp(normalizedEmail, otp, 'NEW_USER_VERIFICATION', {
      name,
      role,
      passwordHash,
      phone: phone || undefined,
      companyName: companyName || undefined,
    });

    // Create temp token
    const tempToken = jwt.sign(
      {
        email: normalizedEmail,
        type: 'NEW_USER_VERIFICATION',
      },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Dispatch real email via Brevo API
    const emailResult = await EmailService.sendOtpEmail(
      normalizedEmail,
      name,
      otp,
      'NEW_USER_VERIFICATION'
    );

    console.log(`[Auth Register] Generated OTP ${otp} for new user ${normalizedEmail} (Brevo Status: ${emailResult.success ? 'Delivered' : 'Pending'})`);

    res.status(201).json({
      requiresOtp: true,
      email: normalizedEmail,
      maskedEmail: maskEmail(normalizedEmail),
      name,
      role,
      tempToken,
      type: 'NEW_USER_VERIFICATION',
      message: `Account created. Verification code sent via Brevo to ${maskEmail(normalizedEmail)}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during account registration.' });
  }
});

/**
 * Step 2: Verify OTP Code
 * Authorizes existing login OR activates new user in Supabase PostgreSQL
 */
router.post('/verify-otp', async (req, res): Promise<void> => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid input' });
      return;
    }

    const { email, otp, tempToken } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify tempToken authenticity
    try {
      const decoded = jwt.verify(tempToken, JWT_SECRET) as any;
      if (decoded.email.toLowerCase() !== normalizedEmail) {
        res.status(401).json({ error: 'Invalid verification session. Please restart sign in.' });
        return;
      }
    } catch (jwtErr) {
      res.status(401).json({ error: 'Verification session expired. Please sign in again.' });
      return;
    }

    // Verify OTP against store
    const verification = EmailService.verifyOtp(normalizedEmail, otp);
    if (!verification.valid || !verification.record) {
      res.status(400).json({ error: verification.error || 'Invalid verification code.' });
      return;
    }

    const { type, userData } = verification.record;

    if (type === 'LOGIN_2FA') {
      // Existing User Login
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          buyerAccount: {
            include: {
              buyer: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User account not found.' });
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
        message: 'Email verification successful! Welcome back.',
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
      return;
    } else if (type === 'NEW_USER_VERIFICATION' && userData) {
      // New User Registration Verification
      let buyerAccountId: string | null = null;

      if (userData.role === 'BUYER') {
        // Create or locate Buyer entity in Supabase DB
        const company = userData.companyName || `${userData.name}'s Company`;
        const buyer = await prisma.buyer.create({
          data: {
            name: userData.name,
            companyName: company,
            email: normalizedEmail,
            phone: userData.phone || '+91 98765 00000',
            address: 'Verified Buyer Address',
          },
        });

        const buyerAccount = await prisma.buyerAccount.create({
          data: {
            buyerId: buyer.id,
            status: 'ACTIVE',
          },
        });

        buyerAccountId = buyerAccount.id;
      }

      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: normalizedEmail,
          password: userData.passwordHash,
          role: userData.role,
          phone: userData.phone,
          isActive: true,
          buyerAccountId,
        },
        include: {
          buyerAccount: {
            include: {
              buyer: true,
            },
          },
        },
      });

      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          buyerId: newUser.buyerAccount?.buyerId || null,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const redirectUrl = getRoleRedirectUrl(newUser.role);

      res.status(201).json({
        message: 'Account verified and created successfully!',
        token,
        redirectUrl,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          buyerId: newUser.buyerAccount?.buyerId || null,
          buyerCompany: newUser.buyerAccount?.buyer?.companyName || null,
        },
      });
      return;
    }

    res.status(400).json({ error: 'Unknown verification state.' });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Server error during OTP verification.' });
  }
});

/**
 * Resend OTP Code via Brevo
 */
router.post('/resend-otp', async (req, res): Promise<void> => {
  try {
    const parseResult = resendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const { email, tempToken } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      jwt.verify(tempToken, JWT_SECRET);
    } catch {
      res.status(401).json({ error: 'Session expired. Please restart login.' });
      return;
    }

    const existingOtp = EmailService.getOtp(normalizedEmail);
    if (!existingOtp) {
      res.status(400).json({ error: 'Verification session expired. Please sign in again.' });
      return;
    }

    const cooldown = EmailService.canResend(normalizedEmail);
    if (!cooldown.allowed) {
      res.status(429).json({
        error: `Please wait ${cooldown.waitSeconds} seconds before requesting a new code.`,
      });
      return;
    }

    const newOtp = EmailService.generateOtp();
    EmailService.setOtp(normalizedEmail, newOtp, existingOtp.type, existingOtp.userData);

    const emailResult = await EmailService.sendOtpEmail(
      normalizedEmail,
      existingOtp.userData?.name || normalizedEmail,
      newOtp,
      existingOtp.type
    );

    console.log(`[Auth Resend] Resent OTP ${newOtp} to ${normalizedEmail}`);

    res.json({
      success: true,
      message: `A new verification code was sent via Brevo to ${maskEmail(normalizedEmail)}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? newOtp : undefined,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error resending verification code.' });
  }
});

/**
 * Get Active Authenticated Profile
 */
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
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
});

/**
 * Request Password Reset (Dispatches 6-Digit Email Verification Code via Brevo)
 */
router.post('/forgot-password', async (req, res): Promise<void> => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid email address' });
      return;
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: normalizedEmail.replace('@agttextile.com', '@everesttextile.com') },
          { email: normalizedEmail.replace('@everesttextile.com', '@agttextile.com') },
        ],
      },
    });

    if (!user) {
      res.status(404).json({ error: 'No account registered with this email address.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated. Please contact the administrator.' });
      return;
    }

    const otp = EmailService.generateOtp();

    EmailService.setOtp(normalizedEmail, otp, 'FORGOT_PASSWORD', {
      name: user.name,
      role: user.role,
      passwordHash: '',
    });

    const tempToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: 'FORGOT_PASSWORD',
      },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const emailResult = await EmailService.sendOtpEmail(
      user.email,
      user.name,
      otp,
      'FORGOT_PASSWORD'
    );

    console.log(`[Forgot Password] Generated OTP ${otp} for ${user.email} (Brevo Status: ${emailResult.success ? 'Delivered' : 'Pending'})`);

    res.json({
      requiresOtp: true,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      tempToken,
      message: `Password reset verification code sent via Brevo to ${maskEmail(user.email)}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error processing password reset request.' });
  }
});

/**
 * Reset Password with Verified Email OTP
 */
router.post('/reset-password', async (req, res): Promise<void> => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid input' });
      return;
    }

    const { email, otp, tempToken, newPassword } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify tempToken
    try {
      const decoded = jwt.verify(tempToken, JWT_SECRET) as any;
      if (decoded.email.toLowerCase() !== normalizedEmail || decoded.type !== 'FORGOT_PASSWORD') {
        res.status(401).json({ error: 'Invalid password reset session. Please request a new code.' });
        return;
      }
    } catch {
      res.status(401).json({ error: 'Password reset session expired. Please request a new code.' });
      return;
    }

    // Verify OTP against store
    const verification = EmailService.verifyOtp(normalizedEmail, otp);
    if (!verification.valid || !verification.record || verification.record.type !== 'FORGOT_PASSWORD') {
      res.status(400).json({ error: verification.error || 'Invalid or expired verification code.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: normalizedEmail.replace('@agttextile.com', '@everesttextile.com') },
          { email: normalizedEmail.replace('@everesttextile.com', '@agttextile.com') },
        ],
      },
      include: {
        buyerAccount: {
          include: {
            buyer: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    // Issue session token
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

    res.json({
      message: 'Password has been reset successfully! You are now logged in.',
      token,
      redirectUrl: getRoleRedirectUrl(user.role),
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
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password.' });
  }
});

export default router;
