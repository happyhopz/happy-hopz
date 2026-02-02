import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user cart
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: req.user!.id }
        });

        // Fetch product details for each cart item
        const itemsWithProducts = await Promise.all(
            cartItems.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId }
                });

                return {
                    ...item,
                    product: product ? {
                        ...product,
                        sizes: JSON.parse(product.sizes),
                        colors: JSON.parse(product.colors),
                        images: JSON.parse(product.images)
                    } : null
                };
            })
        );

        res.json(itemsWithProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add item to cart
const addToCartSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    size: z.string(),
    color: z.string()
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const data = addToCartSchema.parse(req.body);

        // Check if item already exists
        const existing = await prisma.cartItem.findFirst({
            where: {
                userId: req.user!.id,
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
                    userId: req.user!.id,
                    ...data
                }
            });
        }

        res.status(201).json(cartItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { quantity } = z.object({ quantity: z.number().int().positive() }).parse(req.body);

        const cartItem = await prisma.cartItem.update({
            where: { id: req.params.id },
            data: { quantity }
        });

        res.json(cartItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// Remove item from cart
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.cartItem.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Clear cart
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.cartItem.deleteMany({
            where: { userId: req.user!.id }
        });

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

export default router;
