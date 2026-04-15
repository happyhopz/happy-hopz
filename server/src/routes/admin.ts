import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest, requireStaff } from '../middleware/auth';
import { z } from 'zod';
import { sendOrderConfirmationEmail } from '../utils/email';
import { logActivity } from '../lib/logger';
import { generateShippingLabelPDF } from '../utils/pdfUtils';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

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
        const authHeader = req.headers.authorization;
        console.log(`[Dashboard Stats] Auth Header: ${authHeader ? 'PRESENT (' + authHeader.split(' ')[0] + '...)' : 'MISSING'}`);
        console.log(`[Dashboard Stats] Auth: User=${req.user?.email || 'NONE'}, Role=${req.user?.role || 'NONE'}`);

        // MANUALLY CHECK AUTH (Detailed 401 for diagnostics)
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication Required',
                details: 'Your session has expired or is invalid. Please sign out and sign in again.',
                diagnostic: {
                    hasHeader: !!authHeader,
                    headerType: authHeader?.split(' ')[0],
                    timestamp: new Date().toISOString()
                }
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
            topSellingItems,
            allActiveProducts
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
            }),
            prisma.product.findMany({
                where: {
                    NOT: { status: 'DELETED' },
                    stock: { gt: 0 }
                },
                select: {
                    id: true,
                    name: true,
                    category: true,
                    stock: true,
                    costPrice: true,
                    boxPrice: true,
                    tagPrice: true,
                    shippingCost: true,
                    otherCosts: true,
                    price: true
                }
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

        // Calculate Total Investment (Current Stock Value) with details
        let totalInvestment = 0;
        const investmentByCategory: Record<string, number> = {};
        const productInvestmentDetails: any[] = [];

        allActiveProducts.forEach((product: any) => {
            const stock = product.stock || 0;
            const price = parseFloat(String(product.price)) || 0;
            const costPrice = parseFloat(String(product.costPrice)) || (price * 0.6);
            const boxPrice = parseFloat(String(product.boxPrice)) || 0;
            const tagPrice = parseFloat(String(product.tagPrice)) || 0;
            const shippingCost = parseFloat(String(product.shippingCost)) || 0;
            const otherCosts = parseFloat(String(product.otherCosts)) || 0;

            const totalUnitCost = costPrice + boxPrice + tagPrice + shippingCost + otherCosts;
            const productTotalInvestment = totalUnitCost * stock;

            totalInvestment += productTotalInvestment;

            // Group by category
            const category = product.category || 'Other';
            investmentByCategory[category] = (investmentByCategory[category] || 0) + productTotalInvestment;

            // Product details for ranking
            productInvestmentDetails.push({
                id: product.id,
                name: product.name,
                category: category,
                stock: stock,
                unitCost: totalUnitCost,
                totalInvestment: productTotalInvestment
            });
        });

        const investmentByCategoryArray = Object.entries(investmentByCategory).map(([name, value]) => ({
            name,
            value: parseFloat(value.toFixed(2))
        })).sort((a, b) => b.value - a.value);

        const topInvestedProducts = [...productInvestmentDetails]
            .sort((a, b) => b.totalInvestment - a.totalInvestment)
            .slice(0, 10);

        console.log(`[Dashboard Stats] Delivered Orders: ${completedOrders.length}, Net Profit: ₹${totalProfit.toFixed(2)}, Total Investment: ₹${totalInvestment.toFixed(2)}`);

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
            totalInvestment,
            investmentByCategory: investmentByCategoryArray,
            topInvestedProducts,
            allProductInvestments: productInvestmentDetails,
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
// IMPORTANT: This must be registered BEFORE GET /products/:id to prevent
// the list route being captured by the dynamic :id param.
router.get('/products', async (req: AuthRequest, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                NOT: { status: 'DELETED' }
            },
            select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                price: true,
                discountPrice: true,
                costPrice: true,
                boxPrice: true,
                tagPrice: true,
                shippingCost: true,
                otherCosts: true,
                category: true,
                ageGroup: true,
                sizes: true,
                colors: true,
                stock: true,
                inventory: true,
                status: true,
                tags: true,
                seoTitle: true,
                seoDescription: true,
                createdAt: true,
                updatedAt: true,
                order: true,
                avgRating: true,
                ratingCount: true
                // Note: images are NOT selected to greatly save memory/bandwidth
            },
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        const formattedProducts = products.map(p => ({
            ...p,
            sizes: JSON.parse(p.sizes || '[]'),
            inventory: (p as any).inventory ? JSON.parse((p as any).inventory) : [],
            colors: JSON.parse(p.colors || '[]'),
            // Inject optimized images
            images: [`/api/products/${p.id}/image/0`],
            tags: JSON.parse(p.tags || '[]')
        }));

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product (with full images for editing)
router.get('/products/:id', async (req: AuthRequest, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id as string }
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({
            ...product,
            sizes: JSON.parse(product.sizes || '[]'),
            inventory: (product as any).inventory ? JSON.parse((product as any).inventory) : [],
            colors: JSON.parse(product.colors || '[]'),
            images: JSON.parse(product.images || '[]'),
            tags: JSON.parse(product.tags || '[]')
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
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

// Bulk Reorder Products
router.put('/products/reorder', async (req: AuthRequest, res: Response) => {
    try {
        const { orders } = z.object({
            orders: z.array(z.object({
                id: z.string(),
                order: z.number()
            }))
        }).parse(req.body);

        // Update each product's order in a transaction
        await prisma.$transaction(
            orders.map(({ id, order }) =>
                prisma.product.update({
                    where: { id },
                    data: { order }
                })
            )
        );

        await logActivity({
            action: 'PRODUCTS_REORDERED',
            entity: 'PRODUCT',
            details: { count: orders.length },
            adminId: req.user!.id
        });

        res.json({ message: 'Products reordered successfully' });
    } catch (error) {
        console.error('Reorder error:', error);
        res.status(500).json({ error: 'Reordering failed' });
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

// Get visitor stats (custom page-view tracker)
router.get('/visitor-stats', async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now);
        startOfMonth.setDate(now.getDate() - 30);
        startOfMonth.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Count page views (total)
        const [todayViews, weekViews, monthViews, totalViews, last7DaysViews] = await Promise.all([
            (prisma as any).pageView.count({ where: { createdAt: { gte: startOfToday } } }),
            (prisma as any).pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
            (prisma as any).pageView.count({ where: { createdAt: { gte: startOfMonth } } }),
            (prisma as any).pageView.count(),
            (prisma as any).pageView.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true, sessionId: true }
            })
        ]);

        // Count unique visitors (distinct sessionIds - legacy/browser based)
        const [todayUnique, weekUnique, monthUnique, totalUnique] = await Promise.all([
            (prisma as any).pageView.groupBy({ by: ['sessionId'], where: { createdAt: { gte: startOfToday } } }).then((r: any[]) => r.length),
            (prisma as any).pageView.groupBy({ by: ['sessionId'], where: { createdAt: { gte: startOfWeek } } }).then((r: any[]) => r.length),
            (prisma as any).pageView.groupBy({ by: ['sessionId'], where: { createdAt: { gte: startOfMonth } } }).then((r: any[]) => r.length),
            (prisma as any).pageView.groupBy({ by: ['sessionId'] }).then((r: any[]) => r.length),
        ]);

        // Count real unique visitors (distinct IP addresses, fallback to sessionId if missing)
        const [todayRealUnique, weekRealUnique, monthRealUnique, totalRealUnique, last7DaysRealUniqueRaw] = await Promise.all([
            (prisma as any).pageView.findMany({ where: { createdAt: { gte: startOfToday } }, select: { ip: true, sessionId: true, userEmail: true } }),
            (prisma as any).pageView.findMany({ where: { createdAt: { gte: startOfWeek } }, select: { ip: true, sessionId: true, userEmail: true } }),
            (prisma as any).pageView.findMany({ where: { createdAt: { gte: startOfMonth } }, select: { ip: true, sessionId: true, userEmail: true } }),
            (prisma as any).pageView.findMany({ select: { ip: true, sessionId: true, userEmail: true } }),
            (prisma as any).pageView.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true, ip: true, sessionId: true, userEmail: true } }),
        ]);

        const getRealUniqueCount = (records: any[]) => {
            const uniqueSet = new Set();
            records.forEach(r => {
                 let id = r.userEmail || r.ip || r.sessionId;
                 if (id === '::1' || id === '127.0.0.1') id = r.sessionId; // Avoid local dev collapsing
                 uniqueSet.add(id);
            });
            return uniqueSet.size;
        };

        // Group last 7 days by date — both views and unique visitors
        const dailyViewsMap: Record<string, number> = {};
        const dailySessionsMap: Record<string, Set<string>> = {};
        const dailyRealUniqueMap: Record<string, Set<string>> = {};
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyViewsMap[key] = 0;
            dailySessionsMap[key] = new Set();
            dailyRealUniqueMap[key] = new Set();
        }

        (last7DaysViews as any[]).forEach((v: any) => {
            const date = new Date(v.createdAt).toISOString().split('T')[0];
            if (date in dailyViewsMap) {
                dailyViewsMap[date]++;
                dailySessionsMap[date].add(v.sessionId);
            }
        });

        (last7DaysRealUniqueRaw as any[]).forEach((v: any) => {
            const date = new Date(v.createdAt).toISOString().split('T')[0];
            if (date in dailyRealUniqueMap) {
                 let id = v.userEmail || v.ip || v.sessionId;
                 if (id === '::1' || id === '127.0.0.1') id = v.sessionId;
                 dailyRealUniqueMap[date].add(id);
            }
        });

        const dailyVisitors = Object.entries(dailyViewsMap).map(([date, views]) => ({
            date,
            views,
            visitors: dailySessionsMap[date]?.size || 0,
            realVisitors: dailyRealUniqueMap[date]?.size || 0
        }));

        res.json({
            // Page views (total)
            todayViews,
            weekViews,
            monthViews,
            totalViews,
            
            // Unique visitors (distinct sessions)
            todayVisitors: todayUnique,
            weekVisitors: weekUnique,
            monthVisitors: monthUnique,
            totalVisitors: totalUnique,
            
            // Real Unique visitors (distinct IPs/Emails)
            todayRealVisitors: getRealUniqueCount(todayRealUnique),
            weekRealVisitors: getRealUniqueCount(weekRealUnique),
            monthRealVisitors: getRealUniqueCount(monthRealUnique),
            totalRealVisitors: getRealUniqueCount(totalRealUnique),
            
            // Chart data
            dailyVisitors
        });
    } catch (error: any) {
        console.error('❌ [Visitor Stats] Error:', error.message);
        res.status(500).json({ error: 'Failed to load visitor stats' });
    }
});

// Get detailed visitor data (paginated + aggregations)
router.get('/visitors', async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const skip = (page - 1) * limit;
        const { device, country, startDate, endDate } = req.query;

        // Build filter
        const where: any = {};
        if (device && device !== 'all') where.device = device as string;
        if (country && country !== 'all') where.country = { contains: country as string, mode: 'insensitive' };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // Fetch data + count in parallel
        const [totalCount, visitorsRaw, allRecordsRaw, allEventsRaw] = await Promise.all([
            (prisma as any).pageView.count({ where }),
            (prisma as any).pageView.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            (prisma as any).pageView.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                select: { sessionId: true, device: true, country: true, referrer: true, path: true, browser: true, os: true, utmSource: true, utmCampaign: true, duration: true, isNewVisitor: true }
            }),
            (prisma as any).analyticsEvent.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                select: { type: true, label: true, path: true }
            })
        ]);

        const visitors = visitorsRaw as any[];
        const visitorEmails = [...new Set(visitors.filter(v => v.userEmail).map(v => v.userEmail))];
        const visitorUserIds = [...new Set(visitors.filter(v => v.userId).map(v => v.userId))];

        const [relatedUsers, relatedOrders] = await Promise.all([
            visitorUserIds.length > 0 ? prisma.user.findMany({
                where: { id: { in: visitorUserIds } },
                select: { id: true, name: true, phone: true, email: true }
            }) : Promise.resolve([]),
            (visitorEmails.length > 0 || visitorUserIds.length > 0) ? prisma.order.findMany({
                where: {
                    OR: [
                        { userId: { in: visitorUserIds as string[] } },
                        { guestEmail: { in: visitorEmails as string[] } }
                    ]
                },
                select: { guestEmail: true, guestName: true, guestPhone: true, userId: true },
                orderBy: { createdAt: 'desc' }
            }) : Promise.resolve([])
        ]);

        const leadMap = new Map();
        relatedUsers.forEach((u: any) => leadMap.set(u.id, { name: u.name, phone: u.phone }));
        relatedOrders.forEach((o: any) => {
            if (o.userId && !leadMap.has(o.userId)) leadMap.set(o.userId, { name: o.guestName, phone: o.guestPhone });
            if (o.guestEmail && !leadMap.has(o.guestEmail)) leadMap.set(o.guestEmail, { name: o.guestName, phone: o.guestPhone });
        });

        const enrichedVisitors = visitors.map(v => ({
            ...v,
            leadName: v.userId ? leadMap.get(v.userId)?.name : (v.userEmail ? leadMap.get(v.userEmail)?.name : null),
            leadPhone: v.userId ? leadMap.get(v.userId)?.phone : (v.userEmail ? leadMap.get(v.userEmail)?.phone : null)
        }));

        const allRecords = allRecordsRaw as any[];
        const allEvents = allEventsRaw as any[];

        // Compute aggregations
        const deviceCount: Record<string, number> = {};
        const countryCount: Record<string, number> = {};
        const referrerCount: Record<string, number> = {};
        const pageCount: Record<string, number> = {};
        const browserCount: Record<string, number> = {};
        const osCount: Record<string, number> = {};
        const utmSourceCount: Record<string, number> = {};
        const utmCampaignCount: Record<string, number> = {};
        let totalDuration = 0;
        const sessionVisitorTypeMap = new Map<string, boolean>(); // sessionId -> isNew
        const funnel = { visits: 0, product_views: 0, cart_views: 0, checkout_starts: 0, purchases: 0 };
        const sessionsSeen = new Set<string>();

        for (const rec of allRecords) {
            const d = rec.device || 'unknown';
            deviceCount[d] = (deviceCount[d] || 0) + 1;

            if (rec.country) {
                countryCount[rec.country] = (countryCount[rec.country] || 0) + 1;
            }
            if (rec.referrer) {
                try {
                    const host = new URL(rec.referrer).hostname || rec.referrer;
                    referrerCount[host] = (referrerCount[host] || 0) + 1;
                } catch {
                    referrerCount[rec.referrer] = (referrerCount[rec.referrer] || 0) + 1;
                }
            }
            if (rec.path) {
                pageCount[rec.path] = (pageCount[rec.path] || 0) + 1;
            }
            if (rec.browser) {
                browserCount[rec.browser] = (browserCount[rec.browser] || 0) + 1;
            }
            if (rec.os) {
                osCount[rec.os] = (osCount[rec.os] || 0) + 1;
            }
            if (rec.utmSource) {
                utmSourceCount[rec.utmSource] = (utmSourceCount[rec.utmSource] || 0) + 1;
            }
            if (rec.utmCampaign) {
                utmCampaignCount[rec.utmCampaign] = (utmCampaignCount[rec.utmCampaign] || 0) + 1;
            }

            // Duration and Visitor Type tracking per session
            totalDuration += rec.duration || 0;
            if (!sessionVisitorTypeMap.has(rec.sessionId)) {
                sessionVisitorTypeMap.set(rec.sessionId, !!rec.isNewVisitor);
            } else if (rec.isNewVisitor) {
                // If any pageview in the session is marked as New, the entire session is New
                sessionVisitorTypeMap.set(rec.sessionId, true);
            }

            // Simple Funnel Mapping
            if (!sessionsSeen.has(rec.sessionId)) {
                sessionsSeen.add(rec.sessionId);
                const p = rec.path.toLowerCase();
                if (p === '/' || p === '/index') funnel.visits++;
                else if (p.startsWith('/products/')) funnel.product_views++;
                else if (p.startsWith('/cart')) funnel.cart_views++;
                else if (p.startsWith('/checkout')) funnel.checkout_starts++;
                else if (p.includes('order-success')) funnel.purchases++;
            }
        }

        // Aggregate Events
        const eventCounts: Record<string, number> = {};
        for (const ev of allEvents) {
            const key = `${ev.type}${ev.label ? ': ' + ev.label : ''}`;
            eventCounts[key] = (eventCounts[key] || 0) + 1;
        }

        const sortDesc = (obj: Record<string, number>, limit = 10) =>
            Object.entries(obj)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([name, count]) => ({ name, count }));

        res.json({
            visitors: enrichedVisitors,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
            aggregations: {
                devices: sortDesc(deviceCount),
                countries: sortDesc(countryCount),
                referrers: sortDesc(referrerCount),
                topPages: sortDesc(pageCount),
                browsers: sortDesc(browserCount),
                operatingSystems: sortDesc(osCount),
                utmSources: sortDesc(utmSourceCount),
                utmCampaigns: sortDesc(utmCampaignCount),
                avgDuration: allRecords.length > 0 ? Math.round(totalDuration / allRecords.length) : 0,
                visitorTypes: (() => {
                    let newCount = 0;
                    let returningCount = 0;
                    sessionVisitorTypeMap.forEach((isNew) => isNew ? newCount++ : returningCount++);
                    return { new: newCount, returning: returningCount };
                })(),
                funnel,
                topEvents: sortDesc(eventCounts, 15)
            }
        });
    } catch (error: any) {
        console.error('❌ [Visitors] Error:', error.message);
        res.status(500).json({ error: 'Failed to load visitor data' });
    }
});

// Export visitor data as Excel (with user + checkout data merged)
router.get('/visitors/export', async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, device } = req.query;
        const ExcelJS = require('exceljs');

        // Build filter
        const where: any = {};
        if (device && device !== 'all') where.device = device as string;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // Fetch all matching page views
        const pageViews = await (prisma as any).pageView.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10000, // cap at 10k rows
        });

        // Collect all unique userIds and emails to fetch user profiles + orders
        const userIds = [...new Set(pageViews.filter((v: any) => v.userId).map((v: any) => v.userId))];
        const userEmails = [...new Set(pageViews.filter((v: any) => v.userEmail).map((v: any) => v.userEmail))];

        // Fetch user profiles with their orders and addresses
        const users = userIds.length > 0 ? await prisma.user.findMany({
            where: { id: { in: userIds as string[] } },
            select: { id: true, name: true, email: true, phone: true },
        }) : [];

        // Fetch orders with addresses (for checkout data enrichment)
        const orders = (userIds.length > 0 || userEmails.length > 0)
            ? await prisma.order.findMany({
                where: {
                    OR: [
                        ...(userIds.length > 0 ? [{ userId: { in: userIds as string[] } }] : []),
                        ...(userEmails.length > 0 ? [{ guestEmail: { in: userEmails as string[] } }] : []),
                    ]
                },
                select: {
                    userId: true, guestEmail: true, guestName: true, guestPhone: true,
                    address: { select: { name: true, phone: true, line1: true, line2: true, city: true, state: true, pincode: true } }
                },
                orderBy: { createdAt: 'desc' },
            })
            : [];

        // Build lookup maps
        const userMap = new Map(users.map((u: any) => [u.id, u]));
        const orderByUser = new Map<string, any>();
        const orderByEmail = new Map<string, any>();
        for (const order of orders) {
            if (order.userId && !orderByUser.has(order.userId)) orderByUser.set(order.userId, order);
            if (order.guestEmail && !orderByEmail.has(order.guestEmail)) orderByEmail.set(order.guestEmail, order);
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Happy Hopz Admin';
        workbook.created = new Date();

        // ─── SHEET 1: Visitor Data ───
        const ws = workbook.addWorksheet('Visitor Data', {
            views: [{ state: 'frozen', ySplit: 1 }],
        });

        ws.columns = [
            { header: 'Date & Time', key: 'datetime', width: 20 },
            { header: 'Page', key: 'path', width: 25 },
            { header: 'Session ID', key: 'sessionId', width: 18 },
            { header: 'IP Address', key: 'ip', width: 15 },
            { header: 'City', key: 'city', width: 15 },
            { header: 'State', key: 'region', width: 15 },
            { header: 'Country', key: 'country', width: 12 },
            { header: 'Device', key: 'device', width: 10 },
            { header: 'Browser', key: 'browser', width: 14 },
            { header: 'OS', key: 'os', width: 12 },
            { header: 'Screen', key: 'screen', width: 12 },
            { header: 'Language', key: 'language', width: 8 },
            { header: 'Referrer', key: 'referrer', width: 30 },
            { header: 'User Email', key: 'userEmail', width: 25 },
            { header: 'User Name', key: 'userName', width: 18 },
            { header: 'User Phone', key: 'userPhone', width: 16 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'UTM Source', key: 'utmSource', width: 15 },
            { header: 'UTM Medium', key: 'utmMedium', width: 15 },
            { header: 'UTM Campaign', key: 'utmCampaign', width: 15 },
            { header: 'UTM Term', key: 'utmTerm', width: 15 },
            { header: 'UTM Content', key: 'utmContent', width: 15 },
            { header: 'Duration (sec)', key: 'duration', width: 12 },
            { header: 'Visitor Type', key: 'visitorType', width: 12 },
        ];

        // Style header row
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add data rows with enrichment
        for (const pv of pageViews) {
            const user = pv.userId ? userMap.get(pv.userId) : null;
            const checkoutData = (pv.userId ? orderByUser.get(pv.userId) : null) || (pv.userEmail ? orderByEmail.get(pv.userEmail) : null);
            const addr = checkoutData?.address || {};

            ws.addRow({
                datetime: new Date(pv.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                path: pv.path,
                sessionId: pv.sessionId,
                ip: pv.ip || '',
                city: pv.city || (addr?.city || ''),
                region: pv.region || (addr?.state || ''),
                country: pv.country || '',
                device: pv.device || 'desktop',
                browser: pv.browser || '',
                os: pv.os || '',
                screen: pv.screenWidth && pv.screenHeight ? `${pv.screenWidth}×${pv.screenHeight}` : '',
                language: pv.language || '',
                referrer: pv.referrer || 'Direct',
                userEmail: pv.userEmail || user?.email || '',
                userName: user?.name || checkoutData?.guestName || '',
                userPhone: user?.phone || checkoutData?.guestPhone || (addr?.phone || ''),
                address: addr.line1 ? `${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}` : '',
                utmSource: pv.utmSource || '',
                utmMedium: pv.utmMedium || '',
                utmCampaign: pv.utmCampaign || '',
                utmTerm: pv.utmTerm || '',
                utmContent: pv.utmContent || '',
                duration: pv.duration || 0,
                isNewVisitor: pv.isNewVisitor ? 'Yes' : 'No',
            });
        }

        // Auto-filter
        ws.autoFilter = { from: 'A1', to: `Q${pageViews.length + 1}` };

        // ─── SHEET 2: Summary ───
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 20 },
            { header: 'Count', key: 'count', width: 10 },
        ];
        summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };

        // Aggregates
        const deviceAgg: Record<string, number> = {};
        const countryAgg: Record<string, number> = {};
        const browserAgg: Record<string, number> = {};
        const uniqueEmails = new Set<string>();
        const uniquePhones = new Set<string>();

        for (const v of pageViews) {
            const d = v.device || 'desktop';
            deviceAgg[d] = (deviceAgg[d] || 0) + 1;
            if (v.country) countryAgg[v.country] = (countryAgg[v.country] || 0) + 1;
            if (v.browser) browserAgg[v.browser] = (browserAgg[v.browser] || 0) + 1;
            const email = v.userEmail || userMap.get(v.userId)?.email;
            if (email) uniqueEmails.add(email.toLowerCase());
            const phone = userMap.get(v.userId)?.phone;
            if (phone) uniquePhones.add(phone);
        }

        summarySheet.addRow({ metric: 'Total Page Views', value: String(pageViews.length), count: pageViews.length });
        summarySheet.addRow({ metric: 'Unique Sessions', value: String(new Set(pageViews.map((v: any) => v.sessionId)).size) });
        summarySheet.addRow({ metric: 'Unique Emails Captured', value: String(uniqueEmails.size) });
        summarySheet.addRow({ metric: 'Unique Phones Captured', value: String(uniquePhones.size) });
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: '— DEVICE BREAKDOWN —', value: '' });
        Object.entries(deviceAgg).sort((a, b) => b[1] - a[1]).forEach(([name, count]) =>
            summarySheet.addRow({ metric: name, value: `${Math.round((count / pageViews.length) * 100)}%`, count })
        );
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: '— TOP COUNTRIES —', value: '' });
        Object.entries(countryAgg).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([name, count]) =>
            summarySheet.addRow({ metric: name, value: String(count), count })
        );
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: '— BROWSERS —', value: '' });
        Object.entries(browserAgg).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([name, count]) =>
            summarySheet.addRow({ metric: name, value: String(count), count })
        );

        // ─── SHEET 3: User Contacts (deduplicated) ───
        const contactsSheet = workbook.addWorksheet('User Contacts');
        contactsSheet.columns = [
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Phone', key: 'phone', width: 18 },
            { header: 'City', key: 'city', width: 15 },
            { header: 'State', key: 'state', width: 15 },
            { header: 'Pincode', key: 'pincode', width: 10 },
            { header: 'Full Address', key: 'address', width: 45 },
            { header: 'Source', key: 'source', width: 12 },
        ];
        contactsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        contactsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };

        // All registered users (with any phone/email)
        const allUsers = await prisma.user.findMany({
            where: { isGuest: false },
            select: { email: true, name: true, phone: true },
            orderBy: { createdAt: 'desc' },
        });

        // All orders with guest info
        const allOrders = await prisma.order.findMany({
            where: { OR: [{ guestEmail: { not: null } }, { userId: { not: null } }] },
            select: {
                guestEmail: true, guestName: true, guestPhone: true,
                user: { select: { email: true, name: true, phone: true } },
                address: { select: { line1: true, line2: true, city: true, state: true, pincode: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const seenEmails = new Set<string>();

        // Add registered users
        for (const u of allUsers) {
            if (!u.email || seenEmails.has(u.email.toLowerCase())) continue;
            seenEmails.add(u.email.toLowerCase());
            contactsSheet.addRow({
                email: u.email, name: u.name || '', phone: u.phone || '',
                city: '', state: '', pincode: '', address: '', source: 'Registered',
            });
        }

        // Add checkout users (guests)
        for (const o of allOrders) {
            const email = o.guestEmail || o.user?.email;
            if (!email || seenEmails.has(email.toLowerCase())) continue;
            seenEmails.add(email.toLowerCase());
            const addr = o.address;
            contactsSheet.addRow({
                email,
                name: o.guestName || o.user?.name || '',
                phone: o.guestPhone || o.user?.phone || addr?.phone || '',
                city: addr?.city || '',
                state: addr?.state || '',
                pincode: addr?.pincode || '',
                address: addr ? [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') : '',
                source: o.guestEmail ? 'Guest Checkout' : 'Checkout',
            });
        }

        contactsSheet.autoFilter = { from: 'A1', to: `H${seenEmails.size + 1}` };

        // Send the file
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=happyhopz_visitors_${dateStr}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error: any) {
        console.error('❌ [Visitor Export] Error:', error.message);
        res.status(500).json({ error: 'Failed to export visitor data' });
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
