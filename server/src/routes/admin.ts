import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../utils/email';
import { logActivity } from '../lib/logger';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

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
// Bulk import products
router.post('/products/bulk', async (req: AuthRequest, res: Response) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        const formattedProducts = products.map((p: any) => ({
            name: p.name,
            description: p.description || '',
            price: parseFloat(p.price),
            discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : null,
            category: p.category || 'Sneakers',
            ageGroup: p.ageGroup || '3-6 years',
            sizes: JSON.stringify(p.sizes || []),
            colors: JSON.stringify(p.colors || []),
            stock: parseInt(p.stock) || 0,
            images: JSON.stringify(p.images || []),
            status: p.status || 'ACTIVE',
            tags: JSON.stringify(p.tags || [])
        }));

        const result = await prisma.product.createMany({
            data: formattedProducts
        });

        await logActivity({
            action: 'BULK_PRODUCT_IMPORT',
            entity: 'PRODUCT',
            details: { count: result.count },
            adminId: req.user!.id
        });

        res.json({ message: `Successfully imported ${result.count} products`, count: result.count });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ error: 'Bulk import failed' });
    }
});

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

        await logActivity({
            action: 'PRODUCT_CREATED',
            entity: 'PRODUCT',
            entityId: product.id,
            details: { name: product.name },
            adminId: req.user!.id
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

        await logActivity({
            action: 'PRODUCT_UPDATED',
            entity: 'PRODUCT',
            entityId: id as string,
            details: { name: product.name, changes: req.body },
            adminId: req.user!.id
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

        await logActivity({
            action: 'PRODUCT_DELETED',
            entity: 'PRODUCT',
            entityId: id as string,
            adminId: req.user!.id
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Global Search
router.get('/search', async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.json({ products: [], orders: [], users: [] });
        }

        const query = q;

        const [products, orders, users] = await Promise.all([
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { category: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma.order.findMany({
                where: {
                    OR: [
                        { id: { contains: query, mode: 'insensitive' } },
                        { user: { email: { contains: query, mode: 'insensitive' } } },
                        { user: { name: { contains: query, mode: 'insensitive' } } }
                    ]
                },
                include: {
                    user: { select: { name: true, email: true } }
                },
                take: 5
            }),
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                },
                take: 5
            })
        ]);

        res.json({
            products: products.map(p => ({
                ...p,
                sizes: JSON.parse(p.sizes || '[]'),
                colors: JSON.parse(p.colors || '[]'),
                images: JSON.parse(p.images || '[]')
            })),
            orders,
            users
        });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get audit logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
    try {
        const { entity, entityId } = req.query;
        const where: any = {};
        if (entity) where.entity = entity;
        if (entityId) where.entityId = entityId;

        const logs = await (prisma as any).auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

export default router;
