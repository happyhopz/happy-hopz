import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to safely parse stored product IDs
function parseProductIds(productIdsStr?: string | null): string[] {
    if (!productIdsStr) return [];
    try {
        const parsed = JSON.parse(productIdsStr);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

interface CartItemInput {
    productId: string;
    price: number;
    quantity?: number;
}

function calculateCouponDiscount(
    coupon: {
        discountType: string;
        discountValue: number;
        appliesTo?: string | null;
        productIds?: string | null;
        minOrderValue?: number | null;
    },
    cartTotal: number,
    items?: CartItemInput[]
): {
    discountAmount: number;
    eligibleSubtotal: number;
    isEligible: boolean;
    error?: string;
} {
    const isSpecific = coupon.appliesTo === 'SPECIFIC';
    const productIds = parseProductIds(coupon.productIds);

    let eligibleSubtotal = cartTotal;

    if (isSpecific) {
        if (items && items.length > 0) {
            const eligibleItems = items.filter(item => productIds.includes(item.productId));
            if (eligibleItems.length === 0) {
                return {
                    discountAmount: 0,
                    eligibleSubtotal: 0,
                    isEligible: false,
                    error: 'This coupon is only valid for specific products not currently in your bag.'
                };
            }
            eligibleSubtotal = eligibleItems.reduce(
                (sum, item) => sum + (Number(item.price) * (item.quantity || 1)),
                0
            );
        }
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        return {
            discountAmount: 0,
            eligibleSubtotal,
            isEligible: false,
            error: `Minimum order value of ₹${coupon.minOrderValue} required`
        };
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
        discount = (eligibleSubtotal * coupon.discountValue) / 100;
    } else {
        discount = coupon.discountValue;
    }

    const discountAmount = Math.min(Math.round(discount * 100) / 100, eligibleSubtotal, cartTotal);

    return {
        discountAmount,
        eligibleSubtotal,
        isEligible: true
    };
}

const cartItemSchema = z.object({
    productId: z.string(),
    price: z.number(),
    quantity: z.number().int().positive().optional().default(1)
});

// Get all coupons (Admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        const formatted = coupons.map(c => ({
            ...c,
            productIds: parseProductIds(c.productIds)
        }));
        res.json(formatted);
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
    isActive: z.boolean().default(true),
    isHidden: z.boolean().default(false),
    firstTimeOnly: z.boolean().optional().default(false),
    appliesTo: z.enum(['ALL', 'SPECIFIC']).default('ALL'),
    productIds: z.array(z.string()).optional().default([])
}).refine(data => {
    if (data.appliesTo === 'SPECIFIC' && (!data.productIds || data.productIds.length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Please select at least one product for product-specific coupon',
    path: ['productIds']
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
                code: data.code,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minOrderValue: data.minOrderValue,
                maxUses: data.maxUses,
                isActive: data.isActive,
                isHidden: data.isHidden,
                firstTimeOnly: data.firstTimeOnly,
                appliesTo: data.appliesTo,
                productIds: JSON.stringify(data.appliesTo === 'SPECIFIC' ? (data.productIds || []) : []),
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_COUPON',
                entity: 'COUPON',
                entityId: coupon.id,
                details: `Coupon "${coupon.code}" created (${coupon.appliesTo === 'SPECIFIC' ? 'Specific Products' : 'All Products'})`,
                adminId: req.user!.id
            }
        });

        res.status(201).json({
            ...coupon,
            productIds: parseProductIds(coupon.productIds)
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// Update coupon (Admin only)
const couponUpdateSchema = z.object({
    code: z.string().min(3).max(20).transform(v => v.toUpperCase()).optional(),
    discountType: z.enum(['PERCENTAGE', 'FLAT']).optional(),
    discountValue: z.number().positive().optional(),
    minOrderValue: z.number().nonnegative().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    firstTimeOnly: z.boolean().optional(),
    appliesTo: z.enum(['ALL', 'SPECIFIC']).optional(),
    productIds: z.array(z.string()).optional()
}).refine(data => {
    if (data.appliesTo === 'SPECIFIC' && data.productIds !== undefined && data.productIds.length === 0) {
        return false;
    }
    return true;
}, {
    message: 'Please select at least one product for product-specific coupon',
    path: ['productIds']
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = couponUpdateSchema.parse(req.body);

        const updateData: any = { ...data };
        if (data.expiryDate !== undefined) {
            updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        }
        if (data.appliesTo !== undefined) {
            updateData.appliesTo = data.appliesTo;
            if (data.appliesTo === 'ALL') {
                updateData.productIds = '[]';
            }
        }
        if (data.productIds !== undefined && data.appliesTo !== 'ALL') {
            updateData.productIds = JSON.stringify(data.productIds);
        }

        const coupon = await prisma.coupon.update({
            where: { id: req.params.id as string },
            data: updateData
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

        res.json({
            ...coupon,
            productIds: parseProductIds(coupon.productIds)
        });
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

// Get active coupons (Public - for checkout list)
router.get('/active', async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany({
            where: {
                isActive: true,
                isHidden: false,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: new Date() } }
                ]
            },
            select: {
                id: true,
                code: true,
                discountType: true,
                discountValue: true,
                minOrderValue: true,
                firstTimeOnly: true,
                appliesTo: true,
                productIds: true
            }
        });
        const formatted = coupons.map(c => ({
            ...c,
            productIds: parseProductIds(c.productIds)
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active coupons' });
    }
});

// Validate coupon (Public - for checkout)
router.post('/validate', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { code, cartTotal, items } = z.object({
            code: z.string().transform(v => v.toUpperCase()),
            cartTotal: z.number(),
            items: z.array(cartItemSchema).optional()
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

        const calc = calculateCouponDiscount(coupon, cartTotal, items);
        if (!calc.isEligible) {
            return res.status(400).json({ error: calc.error });
        }

        res.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: calc.discountAmount,
            appliesTo: coupon.appliesTo,
            productIds: parseProductIds(coupon.productIds)
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
        const { code, cartTotal, guestEmail, items } = z.object({
            code: z.string().transform(v => v.toUpperCase()),
            cartTotal: z.number(),
            guestEmail: z.string().email().optional().nullable(),
            items: z.array(cartItemSchema).optional()
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

        const calc = calculateCouponDiscount(coupon, cartTotal, items);
        if (!calc.isEligible) {
            return res.status(400).json({ error: calc.error });
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
            return res.json({
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: calc.discountAmount,
                appliesTo: coupon.appliesTo,
                productIds: parseProductIds(coupon.productIds),
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

        res.json({
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: calc.discountAmount,
            appliesTo: coupon.appliesTo,
            productIds: parseProductIds(coupon.productIds),
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
