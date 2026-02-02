import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Bulk delete orders
router.delete('/orders/bulk', async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = req.body;
        console.log('[ADMIN] Bulk delete attempt:', ids);
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No order IDs provided' });
        }

        await prisma.$transaction([
            prisma.orderItem.deleteMany({
                where: { orderId: { in: ids } }
            }),
            prisma.order.deleteMany({
                where: { id: { in: ids } }
            })
        ]);

        res.json({ message: `${ids.length} orders deleted successfully` });
    } catch (error) {
        console.error('[ADMIN] Bulk delete error:', error);
        res.status(500).json({ error: 'Failed to delete orders' });
    }
});

// Delete single order
router.delete('/orders/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        console.log('[ADMIN] Single delete attempt for ID:', id);

        await prisma.orderItem.deleteMany({
            where: { orderId: id as string }
        });
        await prisma.order.delete({
            where: { id: id as string }
        });
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('[ADMIN] Delete order error:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers,
            totalOrders,
            totalRevenue,
            recentOrders,
            lowStockProducts,
            ordersByStatus,
            topSellingItems
        ] = await Promise.all([
            prisma.user.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { paymentStatus: 'COMPLETED' }
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true, name: true }
                    }
                }
            }),
            prisma.product.findMany({
                where: { stock: { lte: 5 } },
                orderBy: { stock: 'asc' },
                take: 5
            }),
            prisma.order.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.orderItem.groupBy({
                by: ['productId', 'name'],
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5
            })
        ]);

        // Calculate daily revenue (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await prisma.order.findMany({
            where: {
                paymentStatus: 'COMPLETED',
                createdAt: { gte: sevenDaysAgo }
            },
            select: { total: true, createdAt: true }
        });

        // Group by day manually
        const dailyRevenue: Record<string, number> = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total;
        });

        const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, revenue]) => ({
            date,
            revenue
        })).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            totalUsers,
            totalOrders,
            totalRevenue: totalRevenue._sum.total || 0,
            averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0,
            recentOrders,
            lowStockProducts: lowStockProducts.map(p => ({
                ...p,
                sizes: JSON.parse(p.sizes || '[]'),
                colors: JSON.parse(p.colors || '[]'),
                images: JSON.parse(p.images || '[]')
            })),
            dailyRevenue: dailyRevenueArray,
            ordersByStatus,
            topSellingProducts: topSellingItems
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all users
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all orders
router.get('/orders', async (req: AuthRequest, res: Response) => {
    try {
        const { status, paymentStatus, search, startDate, endDate } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        if (search) {
            where.OR = [
                { id: { contains: search as string } },
                { user: { email: { contains: search as string } } },
                { user: { name: { contains: search as string } } }
            ];
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true
                    }
                },
                items: true,
                address: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Product Management
// Get all products (admin view)
router.get('/products', async (req: AuthRequest, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const formattedProducts = products.map(p => ({
            ...p,
            sizes: JSON.parse(p.sizes),
            colors: JSON.parse(p.colors),
            images: JSON.parse(p.images)
        }));

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create product
router.post('/products', async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, price, discountPrice, category, ageGroup, sizes, colors, stock, images, status } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                category,
                ageGroup,
                sizes: JSON.stringify(sizes),
                colors: JSON.stringify(colors),
                stock: parseInt(stock),
                images: JSON.stringify(images),
                status: status || 'ACTIVE'
            }
        });

        res.json({
            ...product,
            sizes: JSON.parse(product.sizes),
            colors: JSON.parse(product.colors),
            images: JSON.parse(product.images)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, discountPrice, category, ageGroup, sizes, colors, stock, images, status } = req.body;

        const product = await prisma.product.update({
            where: { id: id as string },
            data: {
                name,
                description,
                price: parseFloat(price),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                category,
                ageGroup,
                sizes: JSON.stringify(sizes),
                colors: JSON.stringify(colors),
                stock: parseInt(stock),
                images: JSON.stringify(images),
                status
            }
        });

        res.json({
            ...product,
            sizes: JSON.parse(product.sizes),
            colors: JSON.parse(product.colors),
            images: JSON.parse(product.images)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id: id as string } });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

export default router;
