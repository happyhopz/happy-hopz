import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Omni-Search
router.get('/', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        const query = req.query.q as string;
        if (!query || query.length < 2) {
            return res.json({ products: [], suggestions: [] });
        }

        // 1. Search Products
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                    { tags: { contains: query, mode: 'insensitive' } }
                ],
                status: 'ACTIVE'
            },
            take: 10,
            select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                images: true,
                category: true
            }
        });

        // 2. Search Orders (if logged in)
        let orders: any[] = [];
        if (req.user) {
            orders = await prisma.order.findMany({
                where: {
                    userId: req.user.id,
                    OR: [
                        { id: { contains: query, mode: 'insensitive' } },
                        { trackingNumber: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    status: true,
                    createdAt: true
                }
            });
        }

        // 3. Generate suggestions (unique categories or common tags)
        const suggestions = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } }
                ],
                status: 'ACTIVE'
            },
            take: 5,
            distinct: ['category'],
            select: {
                category: true
            }
        });

        res.json({
            products,
            orders,
            suggestions: suggestions.map(s => s.category)
        });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
