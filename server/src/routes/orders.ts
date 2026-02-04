import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../utils/email';

const router = Router();

// Create order
const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().positive(),
        size: z.string(),
        color: z.string()
    })),
    total: z.number().positive(),
    addressId: z.string()
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const data = createOrderSchema.parse(req.body);

        // Run as transaction
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId: req.user!.id,
                    total: data.total,
                    addressId: data.addressId,
                    items: {
                        create: data.items
                    }
                },
                include: {
                    items: true
                }
            });

            // 1.5 Create "Order Placed" notification
            await tx.notification.create({
                data: {
                    userId: req.user!.id,
                    title: 'Order Placed Successfully! 🎊',
                    message: `Your order #${order.id.slice(0, 8)} has been placed and is being processed.`,
                    type: 'ORDER_STATUS',
                    orderId: order.id
                }
            });

            // 2. Reduce stock for each product
            for (const item of data.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.name}`);
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            // 3. Clear cart after order
            await tx.cartItem.deleteMany({
                where: { userId: req.user!.id }
            });

            // 4. Fetch full order for email
            const fullOrder = await tx.order.findUnique({
                where: { id: order.id },
                include: { items: true, address: true }
            });

            // 5. Send confirmation email (don't await to avoid slowing down response)
            sendOrderConfirmationEmail(req.user!.email, fullOrder).catch(err =>
                console.error('Email sending failed:', err)
            );

            return order;
        });

        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
});

// Get user orders
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user!.id },
            include: {
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id as string },
            include: {
                items: true,
                address: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Update order status (Admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { status, paymentStatus, trackingNumber, expectedDelivery } = z.object({
            status: z.enum(['PLACED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
            paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
            trackingNumber: z.string().nullable().optional(),
            expectedDelivery: z.string().datetime().nullable().optional()
        }).parse(req.body);

        const result = await prisma.$transaction(async (tx) => {
            // Get original order to check current status
            const originalOrder = await tx.order.findUnique({
                where: { id: req.params.id as string },
                include: { items: true }
            });

            if (!originalOrder) throw new Error('Order not found');

            // 1. If status is being changed TO cancelled and it WASN'T already cancelled
            if (status === 'CANCELLED' && originalOrder.status !== 'CANCELLED') {
                for (const item of originalOrder.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });
                }
            }

            // 2. If status is being changed FROM cancelled to something else (unlikely but possible)
            if (originalOrder.status === 'CANCELLED' && status && status !== 'CANCELLED') {
                for (const item of originalOrder.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }

            const updatedOrder = await tx.order.update({
                where: { id: req.params.id as string },
                data: {
                    ...(status && { status }),
                    ...(paymentStatus && { paymentStatus }),
                    ...(trackingNumber !== undefined && { trackingNumber }),
                },
                include: {
                    items: true,
                    address: true
                }
            });

            // Create notification for the user
            if (status || paymentStatus) {
                await tx.notification.create({
                    data: {
                        userId: updatedOrder.userId,
                        title: status ? `Order Status: ${status}` : 'Payment Update',
                        message: status
                            ? `Order #${updatedOrder.id.slice(0, 8)} is now ${status.toLowerCase()}.`
                            : `Payment for order #${updatedOrder.id.slice(0, 8)} is ${paymentStatus?.toLowerCase()}.`,
                        type: 'ORDER_STATUS',
                        orderId: updatedOrder.id
                    }
                });
            }

            return updatedOrder;
        });

        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update order' });
    }
});

export default router;
