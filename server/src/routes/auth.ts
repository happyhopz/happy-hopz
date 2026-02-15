import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { NotificationService } from '../services/notificationService';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = Router();

// Validation schemas
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    phone: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

// Signup
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone } = signupSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: 'USER',
                isVerified: true
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isVerified: true
            }
        } as any);


        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        // Create Admin Notification
        await NotificationService.create({
            isAdmin: true,
            title: 'New User Signup! 🎉',
            message: `A new user ${user.email} has just joined Happy Hopz.`,
            type: 'SECURITY',
            priority: 'NORMAL',
            metadata: { userId: user.id, email: user.email }
        });

        res.status(201).json({ user, token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        console.log('Login attempt for email:', req.body.email);
        const { email, password } = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        // Notify admin of login
        await NotificationService.notifySecurityEvent(
            'User Login',
            `${user.name || user.email} logged in.`,
            user.id,
            { role: user.role, email: user.email }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified,
                emailNotifications: user.emailNotifications,
                promoNotifications: user.promoNotifications,
                whatsappOrderNotifications: (user as any).whatsappOrderNotifications,
                whatsappPromoNotifications: (user as any).whatsappPromoNotifications
            },
            token
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isVerified: true,
                emailNotifications: true,
                promoNotifications: true,
                whatsappOrderNotifications: true,
                whatsappPromoNotifications: true
            } as any
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Verify Email
router.post('/verify-email', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { code } = z.object({ code: z.string() }).parse(req.body);

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if ((user as any).isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        if ((user as any).verificationCode !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if ((user as any).codeExpires && (user as any).codeExpires < new Date()) {
            return res.status(400).json({ error: 'Code expired' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationCode: null,
                codeExpires: null
            } as any
        });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Verification code is required' });
        }
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Resend OTP
router.post('/resend-otp', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if ((user as any).isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCode,
                codeExpires
            } as any
        });

        await sendVerificationEmail(user.email, verificationCode);

        res.json({ message: 'New verification code sent' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to resend code' });
    }
});

// Google Login
router.post('/google', async (req: Request, res: Response) => {
    try {
        const { credential } = z.object({ credential: z.string() }).parse(req.body);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        const { email, name } = payload;

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Create user for Google login (automatically verified)
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || '',
                    password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
                    isVerified: true,
                    role: 'USER'
                } as any
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified
            },
            token
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Google login failed' });
    }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const profileSchema = z.object({
            name: z.string().optional(),
            phone: z.string().optional()
        });

        const { name, phone } = profileSchema.parse(req.body);

        const updatedUser = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                name,
                phone
            } as any,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isVerified: true,
                whatsappOrderNotifications: true,
                whatsappPromoNotifications: true,
                emailNotifications: true,
                promoNotifications: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const passwordSchema = z.object({
            oldPassword: z.string(),
            newPassword: z.string().min(6)
        });

        const { oldPassword, newPassword } = passwordSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check old password
        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Update notification preferences (Email & WhatsApp)
router.put('/notification-preferences', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const prefsSchema = z.object({
            emailNotifications: z.boolean().optional(),
            promoNotifications: z.boolean().optional(),
            whatsappOrderNotifications: z.boolean().optional(),
            whatsappPromoNotifications: z.boolean().optional()
        });

        const data = prefsSchema.parse(req.body);

        const updatedUser = await prisma.user.update({
            where: { id: req.user!.id },
            data: data as any,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isVerified: true,
                emailNotifications: true,
                promoNotifications: true,
                whatsappOrderNotifications: true,
                whatsappPromoNotifications: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Address Book Endpoints
router.get('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user!.id }
        });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

router.post('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const addressSchema = z.object({
            name: z.string(),
            phone: z.string(),
            line1: z.string(),
            line2: z.string().optional(),
            city: z.string(),
            state: z.string(),
            pincode: z.string()
        });

        const data = addressSchema.parse(req.body);
        const address = await prisma.address.create({
            data: {
                ...data,
                userId: req.user!.id
            }
        });

        res.status(201).json(address);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add address' });
    }
});

router.delete('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.address.deleteMany({
            where: {
                id: req.params.id as string,
                userId: req.user!.id // Security check
            }
        });
        res.json({ message: 'Address deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

// Kids' Profile Endpoints
router.get('/kids', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const profiles = await prisma.childProfile.findMany({
            where: { userId: req.user!.id }
        });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch kids profiles' });
    }
});

router.post('/kids', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const kidSchema = z.object({
            name: z.string(),
            size: z.string(),
            gender: z.string().optional(),
            birthday: z.string().optional()
        });

        const { name, size, gender, birthday } = kidSchema.parse(req.body);
        const profile = await prisma.childProfile.create({
            data: {
                name,
                size,
                gender,
                birthday: birthday ? new Date(birthday) : null,
                userId: req.user!.id
            }
        });

        res.status(201).json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create kids profile' });
    }
});

router.delete('/kids/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.childProfile.deleteMany({
            where: {
                id: req.params.id as string,
                userId: req.user!.id
            }
        });
        res.json({ message: 'Profile deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// Permanent Account Deletion
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // In a real app, we might want to anonymize order data instead of deleting it
        // and keep it for tax/legal compliance. 
        // For now, we perform a cascaded delete as defined in schema.
        await prisma.user.delete({
            where: { id: req.user!.id }
        });

        res.json({ message: 'Account permanently deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});


// Forgot Password
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = z.object({ email: z.string().email() }).parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Return success even if user not found for security
            return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetExpires
            } as any
        });

        // Send reset email
        await sendPasswordResetEmail(email, resetToken);

        // Notify admin
        await NotificationService.create({
            isAdmin: true,
            title: 'Password Reset Requested',
            message: `User ${email} requested a password reset.`,
            type: 'SECURITY',
            priority: 'LOW',
            metadata: { userId: user.id, email }
        });

        res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Valid email is required' });
        }
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = z.object({
            token: z.string(),
            password: z.string().min(6)
        }).parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetExpires: { gte: new Date() }
            } as any
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetExpires: null
            } as any
        });

        res.json({ message: 'Password has been reset successfully' });

        // Notify admin
        await NotificationService.create({
            isAdmin: true,
            title: 'Password Changed',
            message: `User ${user.email} successfully reset their password.`,
            type: 'SECURITY',
            priority: 'NORMAL',
            metadata: { userId: user.id, email: user.email }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Token and new password (min 6 chars) are required' });
        }
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
