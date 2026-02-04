import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest, requireStaff } from '../middleware/auth';

const router = Router();

// --- Flash Sales ---

const flashSaleSchema = z.object({
    name: z.string(),
    discountValue: z.number().positive(),
    discountType: z.enum(['PERCENTAGE', 'FLAT']),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    isActive: z.boolean().default(true)
});

// Create Flash Sale (Admin)
router.post('/flash-sales', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = flashSaleSchema.parse(req.body);
        const sale = await prisma.flashSale.create({
            data: {
                ...data,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime)
            }
        });
        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create flash sale' });
    }
});

// Get all Flash Sales
router.get('/flash-sales', authenticate, requireStaff, async (req, res) => {
    try {
        const sales = await prisma.flashSale.findMany({
            orderBy: { startTime: 'desc' }
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch flash sales' });
    }
});

// Get Active Flash Sale (Public)
router.get('/flash-sales/active', async (req, res) => {
    try {
        const now = new Date();
        const activeSale = await prisma.flashSale.findFirst({
            where: {
                isActive: true,
                startTime: { lte: now },
                endTime: { gte: now }
            }
        });
        res.json(activeSale);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active flash sale' });
    }
});

// --- Marketing Popups ---

const popupSchema = z.object({
    title: z.string(),
    content: z.string(),
    image: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    type: z.enum(['NEWSLETTER', 'SALE', 'ANNOUNCEMENT']),
    active: z.boolean().default(false)
});

// Create/Update Popup
router.post('/popups', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = popupSchema.parse(req.body);
        const popup = await prisma.marketingPopup.create({ data });
        res.status(201).json(popup);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create popup' });
    }
});

// Get Active Popup (Public)
router.get('/popups/active', async (req, res) => {
    try {
        const popup = await prisma.marketingPopup.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(popup);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active popup' });
    }
});

// --- Abandoned Carts ---

router.get('/abandoned-carts', authenticate, requireStaff, async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find users who have cart items but haven't placed an order in the last 24h
        // and whose cart hasn't been updated recently.
        const abandonedCarts = await prisma.user.findMany({
            where: {
                cartItems: { some: {} },
                orders: {
                    none: {
                        createdAt: { gte: twentyFourHoursAgo }
                    }
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                cartItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.json(abandonedCarts);
    } catch (error) {
        console.error('Abandoned cart fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch abandoned carts' });
    }
});

export default router;
