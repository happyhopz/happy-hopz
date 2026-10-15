import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const safeJsonParse = (val: any, fallback: any = []) => {
    if (!val) return fallback;
    if (typeof val !== 'string') return Array.isArray(val) ? val : fallback;
    try {
        return JSON.parse(val);
    } catch {
        return fallback;
    }
};

// Get user cart (returns [] for unauthenticated users instead of 401 crash)
router.get('/', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.json([]);
        }

        const cartItems = await prisma.cartItem.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch product details for each cart item
        const itemsWithProducts = await Promise.all(
            cartItems.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        discountPrice: true,
                        category: true,
                        sizes: true,
                        colors: true,
                        inventory: true,
                        status: true,
                        stock: true,
                        tags: true
                    }
                });

                return {
                    ...item,
                    product: product ? {
                        ...product,
                        sizes: safeJsonParse(product.sizes, []),
                        inventory: safeJsonParse((product as any).inventory, []),
                        colors: safeJsonParse(product.colors, []),
                        images: [`/api/products/${product.id}/image/0`]
                    } : null
                };
            })
        );

        res.json(itemsWithProducts);
    } catch (error: any) {
        console.error('Failed to fetch cart error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch cart' });
    }
});

// Add item to cart
const addToCartSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.union([z.number(), z.string().transform(v => parseInt(v, 10))])
        .pipe(z.number().int().positive())
        .default(1),
    size: z.union([z.string(), z.number().transform(v => String(v))])
        .transform(v => String(v).trim())
        .default('Standard'),
    color: z.union([z.string(), z.number().transform(v => String(v))])
        .optional()
        .nullable()
        .transform(v => (v ? String(v).trim() : 'Standard'))
        .default('Standard')
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Please log in to add items to your online account bag' });
        }

        const data = addToCartSchema.parse(req.body);

        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if item already exists
        const existing = await prisma.cartItem.findFirst({
            where: {
                userId: req.user.id,
                productId: data.productId,
                size: data.size,
                color: data.color
            }
        });

        let cartItem;
        if (existing) {
            // Update quantity
            cartItem = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + data.quantity }
            });
        } else {
            // Create new cart item
            cartItem = await prisma.cartItem.create({
                data: {
                    userId: req.user.id,
                    productId: data.productId,
                    quantity: data.quantity,
                    size: data.size,
                    color: data.color
                }
            });
        }

        res.status(201).json(cartItem);
    } catch (error: any) {
        console.error('Failed to add to cart error:', error);
        if (error instanceof z.ZodError) {
            const firstMsg = error.errors?.[0]?.message || 'Validation failed';
            return res.status(400).json({ error: firstMsg, details: error.errors });
        }
        res.status(500).json({ error: error.message || 'Failed to add to cart' });
    }
});

// Update cart item quantity
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { quantity } = z.object({
            quantity: z.union([z.number(), z.string().transform(v => parseInt(v, 10))])
                .pipe(z.number().int().positive())
        }).parse(req.body);

        const id = String(req.params.id || '').trim();
        const existing = await prisma.cartItem.findFirst({
            where: {
                id,
                userId: req.user!.id
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const cartItem = await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity }
        });

        res.json(cartItem);
    } catch (error: any) {
        console.error('Failed to update cart item error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message || 'Failed to update cart item' });
    }
});

// Remove item from cart
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id || '').trim();
        const existing = await prisma.cartItem.findFirst({
            where: {
                id,
                userId: req.user!.id
            }
        });

        if (existing) {
            await prisma.cartItem.delete({
                where: { id: existing.id }
            });
        }

        res.json({ message: 'Item removed from cart' });
    } catch (error: any) {
        console.error('Failed to remove cart item error:', error);
        res.status(500).json({ error: error.message || 'Failed to remove item' });
    }
});

// Clear cart
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.cartItem.deleteMany({
            where: { userId: req.user!.id }
        });

        res.json({ message: 'Cart cleared' });
    } catch (error: any) {
        console.error('Failed to clear cart error:', error);
        res.status(500).json({ error: error.message || 'Failed to clear cart' });
    }
});

export default router;
