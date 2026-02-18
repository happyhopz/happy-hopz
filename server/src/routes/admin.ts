import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuthenticate, requireAdmin, AuthRequest, requireStaff } from '../middleware/auth';
import { z } from 'zod';
import { sendOrderConfirmationEmail } from '../utils/email';
import { logActivity } from '../lib/logger';
import { generateShippingLabelPDF } from '../utils/pdfUtils';

const router = Router();

// All routes require session check
router.use(optionalAuthenticate);

// Helper for safe JSON parsing
const safeJsonParse = (str: string | null | undefined, fallback: any = []) => {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn(`⚠️ [JSON Parse Warning] Failed to parse: "${str}". Falling back to:`, fallback);
        return fallback;
    }
};

// Dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        console.log('[Dashboard Stats] === STATS REQUEST STARTED ===');
        console.log(`[Dashboard Stats] Auth: User=${req.user?.email || 'NONE'}, Role=${req.user?.role || 'NONE'}`);

        // MANUALLY CHECK AUTH (Prevents hard 401 middleware crash)
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication Required',
                details: 'Your session has expired or is invalid. Please sign out and sign in again.'
            });
        }

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'Access Denied',
                details: `Admin role required. Current role: ${req.user.role}`
            });
        }
        const [
            totalUsers,
            deliveredOrders,
            totalRevenueAgg,
            recentOrders,
            lowStockProducts,
            ordersByStatus,
            topSellingItems
        ] = await Promise.all([
            prisma.user.count(),
            prisma.order.count({
                where: {
                    status: 'DELIVERED',
                    paymentStatus: 'COMPLETED'
                }
            }),
            prisma.order.aggregate({
                _sum: { total: true },
                where: {
                    status: 'DELIVERED',
                    paymentStatus: 'COMPLETED'
                }
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
            ((prisma as any).orderItem || (prisma as any).order_item || { findMany: () => Promise.resolve([]) }).findMany({
                orderBy: { quantity: 'desc' },
                take: 5,
                include: { product: true }
            })
        ]);

        // Calculate Average Order Value
        const totalRevenue = totalRevenueAgg._sum.total || 0;

        // Calculate Total Profit & Costs efficiently
        // We only fetch DELIVERED/COMPLETED orders and only the necessary fields
        const completedOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                paymentStatus: 'COMPLETED'
            },
            select: {
                items: {
                    select: {
                        price: true,
                        quantity: true,
                        product: {
                            select: {
                                name: true,
                                costPrice: true,
                                boxPrice: true,
                                tagPrice: true,
                                shippingCost: true,
                                otherCosts: true
                            }
                        }
                    }
                }
            }
        });

        let totalProfit = 0;
        let totalProductCost = 0;
        let totalPackagingCost = 0;
        let totalLabelingCost = 0;
        let totalShippingCost = 0;
        let totalOtherCosts = 0;

        completedOrders.forEach((order: any) => {
            if (!order.items) return;

            order.items.forEach((item: any) => {
                const product = item.product;
                if (!product) return;

                const price = parseFloat(String(item.price)) || 0;
                const quantity = parseInt(String(item.quantity)) || 0;

                // Calculate costs with safe defaults
                const productCost = parseFloat(String(product.costPrice)) || (price * 0.6);
                const boxCost = parseFloat(String(product.boxPrice)) || 0;
                const tagCost = parseFloat(String(product.tagPrice)) || 0;
                const shipCost = parseFloat(String(product.shippingCost)) || 0;
                const otherCost = parseFloat(String(product.otherCosts)) || 0;

                const totalUnitCost = productCost + boxCost + tagCost + shipCost + otherCost;

                // Accumulate costs
                totalProductCost += productCost * quantity;
                totalPackagingCost += boxCost * quantity;
                totalLabelingCost += tagCost * quantity;
                totalShippingCost += shipCost * quantity;
                totalOtherCosts += otherCost * quantity;

                // Calculate profit
                totalProfit += (price - totalUnitCost) * quantity;
            });
        });

        console.log(`[Dashboard Stats] Delivered Orders: ${completedOrders.length}, Net Profit: ₹${totalProfit.toFixed(2)}, Total Costs: ₹${(totalProductCost + totalPackagingCost + totalLabelingCost + totalShippingCost + totalOtherCosts).toFixed(2)}`);

        // Calculate daily revenue (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
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
            totalOrders: deliveredOrders,
            totalRevenue,
            totalProfit,
            totalProductCost,
            totalPackagingCost,
            totalLabelingCost,
            totalShippingCost,
            totalOtherCosts,
            totalCosts: totalProductCost + totalPackagingCost + totalLabelingCost + totalShippingCost + totalOtherCosts,
            profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
            averageOrderValue: deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0,
            recentOrders,
            lowStockProducts: lowStockProducts.map(p => ({
                ...p,
                sizes: safeJsonParse(p.sizes, []),
                colors: safeJsonParse(p.colors, []),
                images: safeJsonParse(p.images, [])
            })),
            dailyRevenue: dailyRevenueArray,
            ordersByStatus,
            topSellingProducts: topSellingItems
        });
    } catch (error: any) {
        console.error('❌ [Dashboard Stats recovery] Error:', error.message);
        console.error('❌ [Dashboard Stats recovery] Stack:', error.stack);

        // Return 500 so frontend diagnostic UI triggers
        res.status(500).json({
            error: 'Failed to load statistics',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

// Get all products (admin view) - Filters out DELETED products
router.get('/products', async (req: AuthRequest, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                NOT: { status: 'DELETED' }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedProducts = products.map(p => ({
            ...p,
            sizes: JSON.parse(p.sizes || '[]'),
            inventory: (p as any).inventory ? JSON.parse((p as any).inventory) : [],
            colors: JSON.parse(p.colors || '[]'),
            images: JSON.parse(p.images || '[]'),
            tags: JSON.parse(p.tags || '[]')
        }));

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create product
router.post('/products', async (req: AuthRequest, res: Response) => {
    try {
        const {
            sku, name, description, price, discountPrice, costPrice,
            boxPrice, tagPrice, shippingCost, otherCosts,
            category, ageGroup, sizes, colors, stock, inventory, images,
            status, tags, seoTitle, seoDescription,
            isVariant, parentId, avgRating, ratingCount
        } = req.body;

        const productData: any = {
            sku: sku || `HH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            name,
            description,
            price: parseFloat(String(price)) || 0,
            discountPrice: (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') ? parseFloat(String(discountPrice)) : null,
            costPrice: (costPrice !== undefined && costPrice !== null && costPrice !== '') ? parseFloat(String(costPrice)) : null,
            boxPrice: (boxPrice !== undefined && boxPrice !== null && boxPrice !== '') ? parseFloat(String(boxPrice)) : null,
            tagPrice: (tagPrice !== undefined && tagPrice !== null && tagPrice !== '') ? parseFloat(String(tagPrice)) : null,
            shippingCost: (shippingCost !== undefined && shippingCost !== null && shippingCost !== '') ? parseFloat(String(shippingCost)) : null,
            otherCosts: (otherCosts !== undefined && otherCosts !== null && otherCosts !== '') ? parseFloat(String(otherCosts)) : null,
            avgRating: (avgRating !== undefined && avgRating !== null && avgRating !== '') ? parseFloat(String(avgRating)) : 4.5,
            ratingCount: (ratingCount !== undefined && ratingCount !== null && ratingCount !== '') ? parseInt(String(ratingCount)) : 0,
            category,
            ageGroup,
            sizes: Array.isArray(sizes) ? JSON.stringify(sizes) : sizes,
            inventory: Array.isArray(inventory) ? JSON.stringify(inventory) : (inventory || '[]'),
            colors: Array.isArray(colors) ? JSON.stringify(colors) : colors,
            stock: parseInt(String(stock)) || 0,
            images: Array.isArray(images) ? JSON.stringify(images) : images,
            status: status || 'ACTIVE',
            tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags || "[]"),
            seoTitle,
            seoDescription,
            isVariant: Boolean(isVariant),
            parentId
        };

        const product = await (prisma.product as any).create({
            data: productData
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
            sizes: JSON.parse(product.sizes || '[]'),
            inventory: (product as any).inventory ? JSON.parse((product as any).inventory) : [],
            colors: JSON.parse(product.colors || '[]'),
            images: JSON.parse(product.images || '[]'),
            tags: JSON.parse(product.tags || '[]')
        });
    } catch (error: any) {
        console.error('CRITICAL: Product Creation Failed', {
            error: error.message,
            stack: error.stack,
            body: { ...req.body, images: '[REDACTED]' }
        });
        res.status(500).json({
            error: 'Failed to create product',
            details: error.message
        });
    }
});

// Update product
router.put('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const {
            sku, name, description, price, discountPrice, costPrice,
            boxPrice, tagPrice, shippingCost, otherCosts,
            category, ageGroup, sizes, colors, stock, inventory, images,
            status, tags, seoTitle, seoDescription,
            isVariant, parentId, avgRating, ratingCount
        } = req.body;

        // Deep Analysis Fix: Ensure all numeric fields are properly sanitised
        // Ensure SKU is never just an empty string if provided but blank
        const finalSku = (sku && sku.trim() !== '') ? sku : undefined;

        const updateData: any = {
            sku: finalSku,
            name,
            description,
            price: parseFloat(String(price)) || 0,
            discountPrice: (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') ? parseFloat(String(discountPrice)) : null,
            costPrice: (costPrice !== undefined && costPrice !== null && costPrice !== '') ? parseFloat(String(costPrice)) : null,
            boxPrice: (boxPrice !== undefined && boxPrice !== null && boxPrice !== '') ? parseFloat(String(boxPrice)) : null,
            tagPrice: (tagPrice !== undefined && tagPrice !== null && tagPrice !== '') ? parseFloat(String(tagPrice)) : null,
            shippingCost: (shippingCost !== undefined && shippingCost !== null && shippingCost !== '') ? parseFloat(String(shippingCost)) : null,
            otherCosts: (otherCosts !== undefined && otherCosts !== null && otherCosts !== '') ? parseFloat(String(otherCosts)) : null,
            avgRating: (avgRating !== undefined && avgRating !== null && avgRating !== '') ? parseFloat(String(avgRating)) : undefined,
            ratingCount: (ratingCount !== undefined && ratingCount !== null && ratingCount !== '') ? parseInt(String(ratingCount)) : undefined,
            category,
            ageGroup,
            sizes: Array.isArray(sizes) ? JSON.stringify(sizes) : sizes,
            inventory: Array.isArray(inventory) ? JSON.stringify(inventory) : inventory,
            colors: Array.isArray(colors) ? JSON.stringify(colors) : colors,
            stock: inventory && Array.isArray(inventory)
                ? inventory.reduce((sum: number, i: any) => sum + (parseInt(i.stock) || 0), 0)
                : (parseInt(String(stock)) || 0),
            images: Array.isArray(images) ? JSON.stringify(images) : images,
            status: status || 'ACTIVE',
            tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags || "[]"),
            seoTitle,
            seoDescription,
            isVariant: Boolean(isVariant),
            parentId: (parentId && parentId.trim() !== '') ? parentId : null
        };

        // Debug logging for cost updates
        console.log(`[Product Update] ID: ${id}, Costs - Product: ${updateData.costPrice}, Box: ${updateData.boxPrice}, Tag: ${updateData.tagPrice}, Ship: ${updateData.shippingCost}, Other: ${updateData.otherCosts}`);

        const product = await (prisma.product as any).update({
            where: { id: id as string },
            data: updateData
        });

        await logActivity({
            action: 'PRODUCT_UPDATED',
            entity: 'PRODUCT',
            entityId: id as string,
            details: { name: product.name, changes: req.body },
            adminId: req.user!.id
        });

        // Helper to safely parse strings that might be arrays
        const safeParse = (str: any) => {
            if (typeof str !== 'string') return str;
            try { return JSON.parse(str); }
            catch (e) { return str.split(',').map((s: string) => s.trim()); }
        };

        res.json({
            ...product,
            sizes: safeParse(product.sizes),
            inventory: (product as any).inventory ? safeParse((product as any).inventory) : [],
            colors: safeParse(product.colors),
            images: safeParse(product.images),
            tags: safeParse(product.tags)
        });
    } catch (error: any) {
        console.error('CRITICAL: Product Update Failed', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            body: { ...req.body, images: '[REDACTED]' } // Redact images to keep logs clean
        });
        res.status(500).json({
            error: 'Failed to update product',
            details: error.message
        });
    }
});

// Delete product (Hybrid: Soft delete if in orders, else hard delete)
router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check for order history
        const orderCount = await prisma.orderItem.count({
            where: { productId: id as string }
        });

        if (orderCount > 0) {
            // Soft delete
            await prisma.product.update({
                where: { id: id as string },
                data: { status: 'DELETED' }
            });

            await logActivity({
                action: 'PRODUCT_SOFT_DELETED',
                entity: 'PRODUCT',
                entityId: id as string,
                details: { reason: 'Order history exists' },
                adminId: req.user!.id
            });
        } else {
            // Hard delete
            await prisma.product.delete({ where: { id: id as string } });

            await logActivity({
                action: 'PRODUCT_DELETED',
                entity: 'PRODUCT',
                entityId: id as string,
                adminId: req.user!.id
            });
        }

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

        // Identify which products have orders
        const productsWithOrders = await prisma.orderItem.findMany({
            where: { productId: { in: ids } },
            select: { productId: true },
            distinct: ['productId']
        });

        const idsWithOrders = productsWithOrders.map(p => p.productId);
        const idsWithoutOrders = ids.filter(id => !idsWithOrders.includes(id));

        let softDeletedCount = 0;
        let hardDeletedCount = 0;

        // Soft delete products with orders
        if (idsWithOrders.length > 0) {
            const result = await prisma.product.updateMany({
                where: { id: { in: idsWithOrders } },
                data: { status: 'DELETED' }
            });
            softDeletedCount = result.count;
        }

        // Hard delete products without orders
        if (idsWithoutOrders.length > 0) {
            const result = await prisma.product.deleteMany({
                where: { id: { in: idsWithoutOrders } }
            });
            hardDeletedCount = result.count;
        }

        await logActivity({
            action: 'BULK_PRODUCT_DELETE_HYBRID',
            entity: 'PRODUCT',
            details: {
                softDeleted: softDeletedCount,
                hardDeleted: hardDeletedCount,
                ids
            },
            adminId: req.user!.id
        });

        res.json({
            message: `Successfully processed ${ids.length} products`,
            softDeleted: softDeletedCount,
            hardDeleted: hardDeletedCount
        });
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

// GET Shipping Label (PDF)
router.get('/orders/:id/shipping-label', authenticate, requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: req.params.id as string },
                    { orderId: req.params.id as string }
                ]
            },
            include: {
                user: true,
                address: true,
                items: true
            }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const pdfBuffer = await generateShippingLabelPDF(order);

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=shipping_label_${order.orderId || order.id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Shipping Label Error:', error);
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

// DELETE /api/admin/orders/:id - Delete single order
router.delete('/orders/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user!.id;

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: id },
            include: { items: true }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Delete order (cascade will delete order items if configured, but let's be safe)
        // Check if OrderItem has a relation with Order that cascades
        await prisma.order.delete({
            where: { id: id }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'DELETE_ORDER',
                entity: 'Order',
                entityId: id,
                details: `Deleted order #${id.slice(0, 8)} with ${(order as any).items?.length || 0} items. Total: ₹${order.total}`,
                adminId
            }
        });

        res.json({ success: true, message: 'Order deleted successfully' });

    } catch (error: any) {
        console.error('[Delete Order Error]:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// DELETE /api/admin/orders/bulk - Delete multiple orders
router.delete('/orders-bulk', async (req: AuthRequest, res: Response) => {
    try {
        const { orderIds } = req.body as { orderIds: string[] };
        const adminId = req.user!.id;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ error: 'Order IDs are required' });
        }

        // Delete orders
        const result = await prisma.order.deleteMany({
            where: { id: { in: orderIds } }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'BULK_DELETE_ORDERS',
                entity: 'Order',
                entityId: 'BULK',
                details: `Bulk deleted ${result.count} orders. IDs sample: ${orderIds.slice(0, 5).join(', ')}${orderIds.length > 5 ? '...' : ''}`,
                adminId
            }
        });

        res.json({
            success: true,
            message: `${result.count} order(s) deleted successfully`,
            deletedCount: result.count
        });

    } catch (error: any) {
        console.error('[Bulk Delete Orders Error]:', error);
        res.status(500).json({ error: 'Failed to delete orders' });
    }
});

export default router;
