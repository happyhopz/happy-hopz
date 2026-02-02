import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get reviews for a product
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: {
                productId: req.params.productId as string,
                isApproved: true
            },
            include: {
                user: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Post a review
const reviewSchema = z.object({
    productId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(500)
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const data = reviewSchema.parse(req.body);

        // Check if order exists for this user and product (optional but good for verified purchase)
        const order = await prisma.order.findFirst({
            where: {
                userId: req.user!.id,
                items: {
                    some: { productId: data.productId }
                },
                status: 'DELIVERED'
            }
        });

        if (!order) {
            return res.status(403).json({ error: 'You can only review products you have purchased and received' });
        }

        const review = await prisma.review.upsert({
            where: {
                productId_userId: {
                    productId: data.productId,
                    userId: req.user!.id
                }
            },
            update: {
                rating: data.rating,
                comment: data.comment,
                isApproved: false // Re-approve after edit
            },
            create: {
                ...data,
                userId: req.user!.id
            }
        });

        res.status(201).json(review);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to post review' });
    }
});

// Admin: Get all reviews
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: { select: { email: true, name: true } },
                product: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Admin: Approve review
router.put('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const review = await prisma.review.update({
            where: { id: req.params.id as string },
            data: { isApproved: req.body.isApproved }
        });
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update review status' });
    }
});

// Admin: Feature/Unfeature review
router.put('/:id/feature', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const review = await prisma.review.update({
            where: { id: req.params.id as string },
            data: { isFeatured: req.body.isFeatured }
        });
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update review featured status' });
    }
});

// Admin: Delete review
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.review.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

export default router;
