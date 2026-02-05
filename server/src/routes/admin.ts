import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest, requireStaff } from '../middleware/auth';
import { z } from 'zod';
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
            totalRevenueAgg,
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
            (prisma as any).orderItem.findMany({
                orderBy: { quantity: 'desc' },
                take: 5,
                include: { product: true }
            })
        ]);

        // Calculate Average Order Value
        const totalRevenue = totalRevenueAgg._sum.total || 0;

        // Calculate Total Profit (Revenue - Cost of Sold Items)
        const completedOrders = await (prisma as any).order.findMany({
            where: { paymentStatus: 'COMPLETED' },
            include: { items: { include: { product: true } } }
        });

        let totalProfit = 0;
        completedOrders.forEach((order: any) => {
            order.items?.forEach((item: any) => {
                const cost = item.product?.costPrice || (item.price * 0.6); // Default 60% if cost missing
                totalProfit += (item.price - cost) * item.quantity;
            });
        });

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
            totalRevenue,
            totalProfit,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
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
        if (status) where.status = status as string;
        if (paymentStatus) where.paymentStatus = paymentStatus as string;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        if (search) {
            const s = search as string;
            where.OR = [
                { id: { contains: s } },
                { user: { email: { contains: s } } },
                { user: { name: { contains: s } } }
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

// Redundant route removed. Order status updates are handled in src/routes/orders.ts

// Product Management
// Bulk import products
router.post('/products/bulk', async (req: AuthRequest, res: Response) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        const formattedProducts = products.map((p: any) => ({
            sku: p.sku || `HH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
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
            tags: JSON.stringify(p.tags || []),
            seoTitle: p.seoTitle || null,
            seoDescription: p.seoDescription || null
        }));

        const result = await (prisma.product as any).createMany({
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
        const { sku, name, description, price, discountPrice, category, ageGroup, sizes, colors, stock, images, status, seoTitle, seoDescription } = req.body;

        const product = await (prisma.product as any).create({
            data: {
                sku: sku || `HH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
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
                status: status || 'ACTIVE',
                seoTitle,
                seoDescription
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
        const { sku, name, description, price, discountPrice, category, ageGroup, sizes, colors, stock, images, status, seoTitle, seoDescription } = req.body;

        const product = await (prisma.product as any).update({
            where: { id: id as string },
            data: {
                sku,
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
                status,
                seoTitle,
                seoDescription
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

// Bulk Delete products (using POST for body support compatibility)
router.post('/products/bulk-delete', async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = z.object({
            ids: z.array(z.string())
        }).parse(req.body);

        const result = await prisma.product.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        await logActivity({
            action: 'BULK_PRODUCT_DELETE',
            entity: 'PRODUCT',
            details: { count: result.count, ids },
            adminId: req.user!.id
        });

        res.json({ message: `Successfully deleted ${result.count} products`, count: result.count });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: 'Bulk delete failed' });
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

// Update user role (Admin only)
router.put('/users/:id/role', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { role } = z.object({
            role: z.enum(['USER', 'STAFF', 'ADMIN'])
        }).parse(req.body);

        const updatedUser = await prisma.user.update({
            where: { id: (req.params.id as string) as any },
            data: { role: (role as string) as any }
        });

        await logActivity({
            action: 'UPDATE_ROLE',
            entity: 'User',
            entityId: req.params.id as string,
            details: { newRole: role },
            adminId: req.user!.id
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// GET Shipping Label (HTML/Printable)
router.get('/orders/:id/shipping-label', authenticate, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id as string },
            include: {
                user: true,
                address: true,
                items: true
            }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const o = order as any;
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .label { border: 2px solid #000; padding: 20px; max-width: 400px; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="header">
                            <h2>HAPPY HOPZ</h2>
                            <p>Order ID: ${o.id.slice(0, 8)}</p>
                        </div>
                        <div class="to">
                            <strong>SHIP TO:</strong><br/>
                            ${o.address?.name || o.user?.name || 'Customer'}<br/>
                            ${o.address?.street || 'N/A'}<br/>
                            ${o.address?.city || 'N/A'}, ${o.address?.state || 'N/A'} ${o.address?.zipCode || 'N/A'}<br/>
                            India
                        </div>
                        <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">
                            <strong>ITEMS:</strong> ${o.items?.length || 0}<br/>
                            <strong>WEIGHT:</strong> Approx. ${(o.items?.length || 0) * 0.5}kg
                        </div>
                        <div style="margin-top: 20px; text-align: center;">
                            <div style="font-size: 10px; margin-bottom: 5px;">*SCANNABLE BARCODE*</div>
                            <div style="background: #000; height: 40px; width: 100%;"></div>
                        </div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate shipping label' });
    }
});

// Bulk Stock Update
router.put('/inventory/bulk-stock', async (req: AuthRequest, res: Response) => {
    try {
        const { updates } = z.object({
            updates: z.array(z.object({
                sku: z.string(),
                stock: z.number().int().nonnegative()
            }))
        }).parse(req.body);

        const results = await Promise.all(updates.map(update =>
            prisma.product.updateMany({
                where: { sku: update.sku },
                data: { stock: update.stock }
            })
        ));

        const updatedCount = results.reduce((acc, r) => acc + r.count, 0);

        await logActivity({
            action: 'BULK_STOCK_UPDATE',
            entity: 'PRODUCT',
            details: { updatedCount, skus: updates.map(u => u.sku) },
            adminId: req.user!.id as string
        });

        res.json({ message: `Successfully updated stock for ${updatedCount} products`, count: updatedCount });
    } catch (error) {
        res.status(500).json({ error: 'Bulk stock update failed' });
    }
});

// AI SEO Generation Mock
router.post('/products/:id/seo-generate', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id: id as string } });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Simulate AI generation logic
        const seoTitle = `${product.name} - Premium Kids Footwear | Happy Hopz`;
        const seoDescription = `Shop the latest ${product.name} from Happy Hopz. Specialized ${product.category} for ${product.ageGroup} with 18% GST benefits and free shipping above ₹999.`;

        await logActivity({
            action: 'AI_SEO_GENERATED',
            entity: 'PRODUCT',
            entityId: id as string,
            adminId: req.user!.id as string
        });

        res.json({ seoTitle, seoDescription });
    } catch (error) {
        res.status(500).json({ error: 'SEO generation failed' });
    }
});

// Site Settings - Payment Control
router.get('/site-settings/payment', async (req: AuthRequest, res: Response) => {
    try {
        const settings = await prisma.siteContent.findUnique({
            where: { key: 'payment_methods' }
        });

        // Default settings if not found
        const defaultMethods = {
            COD: true,
            UPI: false,
            CARD: false,
            NETBANKING: false
        };

        res.json(settings ? JSON.parse(settings.content) : defaultMethods);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment settings' });
    }
});

router.post('/site-settings/payment', async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            COD: z.boolean(),
            UPI: z.boolean(),
            CARD: z.boolean(),
            NETBANKING: z.boolean()
        });
        const data = schema.parse(req.body);

        const settings = await prisma.siteContent.upsert({
            where: { key: 'payment_methods' },
            update: { content: JSON.stringify(data) },
            create: { key: 'payment_methods', content: JSON.stringify(data) }
        });

        await logActivity({
            action: 'UPDATE_PAYMENT_SETTINGS',
            entity: 'SITE_CONTENT',
            details: data,
            adminId: req.user!.id
        });

        res.json(JSON.parse(settings.content));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update payment settings' });
    }
});

export default router;
