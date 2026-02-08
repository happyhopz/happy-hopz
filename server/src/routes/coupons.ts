import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all coupons (Admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// Create coupon (Admin only)
const couponSchema = z.object({
    code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
    discountType: z.enum(['PERCENTAGE', 'FLAT']),
    discountValue: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().default(true)
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = couponSchema.parse(req.body);

        const existing = await prisma.coupon.findUnique({
            where: { code: data.code }
        });

        if (existing) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const coupon = await prisma.coupon.create({
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_COUPON',
                entity: 'COUPON',
                entityId: coupon.id,
                details: `Coupon "${coupon.code}" created`,
                adminId: req.user!.id
            }
        });

        res.status(201).json(coupon);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// Update coupon (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = couponSchema.partial().parse(req.body);

        const coupon = await prisma.coupon.update({
            where: { id: req.params.id as string },
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : data.expiryDate === null ? null : undefined
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_COUPON',
                entity: 'COUPON',
                entityId: coupon.id,
                details: `Coupon "${coupon.code}" updated`,
                adminId: req.user!.id
            }
        });

        res.json(coupon);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update coupon' });
    }
});

// Delete coupon (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.coupon.delete({
            where: { id: req.params.id as string }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE_COUPON',
                entity: 'COUPON',
                entityId: req.params.id as string,
                details: `Coupon deleted`,
                adminId: req.user!.id
            }
        });

        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// Validate coupon (Public - for checkout)
router.post('/validate', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { code, cartTotal } = z.object({
            code: z.string().transform(v => v.toUpperCase()),
            cartTotal: z.number()
        }).parse(req.body);

        const coupon = await prisma.coupon.findUnique({
            where: { code }
        });

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ error: 'Invalid or inactive coupon' });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            return res.status(400).json({ error: `Minimum order value of ₹${coupon.minOrderValue} required` });
        }

        // Check if first-time only coupon
        if (coupon.firstTimeOnly) {
            const userIdentifier = req.user?.id || req.body.guestEmail;
            const existingOrders = await prisma.order.findMany({
                where: req.user?.id
                    ? { userId: req.user.id }
                    : { guestEmail: req.body.guestEmail }
            });

            if (existingOrders.length > 0) {
                return res.status(400).json({ error: 'This coupon is only valid for first-time purchases' });
            }
        }

        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discount = (cartTotal * coupon.discountValue) / 100;
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: Math.min(discount, cartTotal)
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

// Apply coupon (creates reservation with 10-min timer)
router.post('/apply', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { code, cartTotal, guestEmail } = z.object({
            code: z.string().transform(v => v.toUpperCase()),
            cartTotal: z.number(),
            guestEmail: z.string().email().optional()
        }).parse(req.body);

        const coupon = await prisma.coupon.findUnique({
            where: { code }
        });

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ error: 'Invalid or inactive coupon' });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            return res.status(400).json({ error: `Minimum order value of ₹${coupon.minOrderValue} required` });
        }

        // Check if first-time only coupon
        if (coupon.firstTimeOnly) {
            const userEmail = req.user?.email || guestEmail;
            if (!userEmail) {
                return res.status(400).json({ error: 'Email required for first-time coupon validation' });
            }

            // Check for existing orders by user ID or email
            const existingOrders = await prisma.order.findMany({
                where: {
                    OR: [
                        req.user?.id ? { userId: req.user.id } : {},
                        { guestEmail: userEmail }
                    ].filter(obj => Object.keys(obj).length > 0)
                }
            });

            if (existingOrders.length > 0) {
                return res.status(400).json({ error: 'This coupon is only valid for first-time purchases' });
            }

            // Check if coupon was already used by this user/email
            const existingUsage = await prisma.couponUsage.findFirst({
                where: {
                    couponId: coupon.id,
                    OR: [
                        req.user?.id ? { userId: req.user.id } : {},
                        { userEmail: userEmail }
                    ].filter(obj => Object.keys(obj).length > 0)
                }
            });

            if (existingUsage) {
                return res.status(400).json({ error: 'You have already used this coupon' });
            }
        }

        // Clean up expired reservations
        await prisma.couponReservation.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });

        // Check for existing active reservation
        const userIdentifier = req.user?.id || guestEmail;
        const existingReservation = await prisma.couponReservation.findFirst({
            where: {
                couponCode: code,
                OR: [
                    req.user?.id ? { userId: req.user.id } : {},
                    guestEmail ? { userEmail: guestEmail } : {}
                ].filter(obj => Object.keys(obj).length > 0),
                expiresAt: { gt: new Date() }
            }
        });

        if (existingReservation) {
            // Reservation already exists, return existing expiry
            let discount = 0;
            if (coupon.discountType === 'PERCENTAGE') {
                discount = (cartTotal * coupon.discountValue) / 100;
            } else {
                discount = coupon.discountValue;
            }

            return res.json({
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: Math.min(discount, cartTotal),
                expiresAt: existingReservation.expiresAt.toISOString()
            });
        }

        // Create new reservation (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.couponReservation.create({
            data: {
                couponCode: code,
                userId: req.user?.id || null,
                userEmail: guestEmail || null,
                expiresAt
            }
        });

        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discount = (cartTotal * coupon.discountValue) / 100;
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: Math.min(discount, cartTotal),
            expiresAt: expiresAt.toISOString()
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Apply coupon error:', error);
        res.status(500).json({ error: 'Failed to apply coupon' });
    }
});

// Remove coupon (deletes reservation)
router.post('/remove', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { code, guestEmail } = z.object({
            code: z.string().transform(v => v.toUpperCase()),
            guestEmail: z.string().email().optional()
        }).parse(req.body);

        await prisma.couponReservation.deleteMany({
            where: {
                couponCode: code,
                OR: [
                    req.user?.id ? { userId: req.user.id } : {},
                    guestEmail ? { userEmail: guestEmail } : {}
                ].filter(obj => Object.keys(obj).length > 0)
            }
        });

        res.json({ message: 'Coupon removed successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to remove coupon' });
    }
});


export default router;
