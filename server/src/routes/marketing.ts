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
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find users who have cart items updated between 2 and 24 hours ago
        // and haven't placed an order in that period.
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

        // Add a 'suggestedAction' based on item count/value (future enhancement)
        const enrichedCarts = abandonedCarts.map(cart => ({
            ...cart,
            itemCount: cart.cartItems.reduce((acc, item) => acc + item.quantity, 0),
            totalValue: cart.cartItems.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0)
        }));

        res.json(enrichedCarts.sort((a, b) => b.totalValue - a.totalValue));
    } catch (error) {
        console.error('Abandoned cart fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch abandoned carts' });
    }
});

import { sendAbandonedCartEmail, sendWelcomeCouponEmail } from '../utils/email';

// Manually trigger recovery for a specific user
router.post('/abandoned-carts/recover', authenticate, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = z.object({ userId: z.string() }).parse(req.body);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                cartItems: {
                    include: { product: true }
                }
            }
        });

        if (!user || user.cartItems.length === 0) {
            return res.status(404).json({ error: 'User not found or cart is empty' });
        }

        const email = user.email;
        const name = user.name || 'Friend';

        await sendAbandonedCartEmail(email, name, user.cartItems);

        // Log the recovery attempt
        await prisma.auditLog.create({
            data: {
                action: 'ABANDONED_CART_RECOVERY',
                entity: 'USER',
                entityId: userId,
                details: `Sent recovery email to ${email}`,
                adminId: req.user?.id
            }
        });

        res.json({ message: `Recovery email sent to ${email} successfully!` });
    } catch (error) {
        console.error('Recovery trigger error:', error);
        res.status(500).json({ error: 'Failed to send recovery message' });
    }
});

// --- Newsletter Subscription ---

const subscribeSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    source: z.enum(['FOOTER', 'POPUP']).default('FOOTER')
});

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email, name, source } = subscribeSchema.parse(req.body);

        // check if already subscribed
        const existing = await prisma.newsletterSubscriber.findUnique({
            where: { email }
        });

        if (existing) {
            if (existing.status === 'UNSUBSCRIBED') {
                await prisma.newsletterSubscriber.update({
                    where: { email },
                    data: { status: 'SUBSCRIBED', updatedAt: new Date() }
                });
                return res.json({ message: 'Welcome back! You have been re-subscribed.' });
            }
            return res.status(400).json({ error: 'You are already subscribed!' });
        }

        await prisma.newsletterSubscriber.create({
            data: { email, name: name || 'Friend', source }
        });

        // Send welcome email with coupon
        sendWelcomeCouponEmail(email, name || 'Friend').catch((err: Error) => {
            console.error('Failed to send welcome email:', err);
        });

        res.status(201).json({ message: 'Thank you for subscribing! 🐼' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
    }
});

export default router;
