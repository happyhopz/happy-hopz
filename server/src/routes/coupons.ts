import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

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
            where: { id: req.params.id },
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : data.expiryDate === null ? null : undefined
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
            where: { id: req.params.id }
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
            code: z.string().toUpperCase(),
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
            return res.status(400).json({ error: `Minimum order value of ?${coupon.minOrderValue} required` });
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

export default router;
