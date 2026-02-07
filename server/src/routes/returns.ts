import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Customer Endpoints

// POST /api/returns/create - Create a new return/exchange request
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { orderId, type, items, comments, pickupAddress } = req.body;

        // Validate request
        if (!orderId || !type || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (type !== 'RETURN' && type !== 'EXCHANGE') {
            return res.status(400).json({ error: 'Invalid return type' });
        }

        // Fetch order with items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, address: true }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check ownership
        if (order.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Check if order is delivered
        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Only delivered orders can be returned' });
        }

        // Check 14-day window
        const deliveryDate = order.updatedAt; // Assuming updatedAt is when it was delivered
        const daysSinceDelivery = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceDelivery > 14) {
            return res.status(400).json({ error: 'Return window has expired (14 days from delivery)' });
        }

        // Check if return request already exists
        const existingReturn = await prisma.returnRequest.findFirst({
            where: {
                orderId,
                status: { in: ['PENDING', 'APPROVED'] }
            }
        });

        if (existingReturn) {
            return res.status(400).json({ error: 'A return request already exists for this order' });
        }

        // Calculate items total
        let itemsTotal = 0;
        const returnItems = [];

        for (const item of items) {
            const orderItem = order.items.find(oi => oi.id === item.orderItemId);
            if (!orderItem) {
                return res.status(400).json({ error: `Order item ${item.orderItemId} not found` });
            }

            if (item.quantity > orderItem.quantity) {
                return res.status(400).json({ error: `Invalid quantity for item ${orderItem.name}` });
            }

            const itemTotal = orderItem.price * item.quantity;
            itemsTotal += itemTotal;

            returnItems.push({
                orderItemId: item.orderItemId,
                productId: orderItem.productId,
                productName: orderItem.name,
                quantity: item.quantity,
                price: orderItem.price,
                size: orderItem.size,
                color: orderItem.color,
                reason: item.reason,
                condition: item.condition || 'UNUSED',
                images: item.images ? JSON.stringify(item.images) : null
            });
        }

        // Calculate pickup charge and refund amount
        const pickupCharge = type === 'RETURN' ? 50 : 0;
        const refundAmount = type === 'RETURN' ? itemsTotal - pickupCharge : null;

        // Create return request
        const returnRequest = await prisma.returnRequest.create({
            data: {
                orderId,
                userId,
                type,
                reason: items[0].reason, // Primary reason
                comments,
                itemsTotal,
                pickupCharge,
                refundAmount,
                pickupAddress: pickupAddress || `${order.address.line1}, ${order.address.line2 || ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
                items: {
                    create: returnItems
                }
            },
            include: {
                items: true,
                order: {
                    include: {
                        items: true
                    }
                }
            }
        });

        res.json({
            success: true,
            returnRequest,
            message: type === 'RETURN'
                ? `Return request created. Refund amount: ₹${refundAmount} (₹50 pickup charge deducted)`
                : 'Exchange request created. Free delivery for exchange item.'
        });

    } catch (error: any) {
        console.error('[Return Create Error]:', error);
        res.status(500).json({ error: 'Failed to create return request' });
    }
});

// GET /api/returns/my-requests - Get user's return requests
router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const returnRequests = await prisma.returnRequest.findMany({
            where: { userId },
            include: {
                items: true,
                order: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(returnRequests);

    } catch (error: any) {
        console.error('[My Returns Error]:', error);
        res.status(500).json({ error: 'Failed to fetch return requests' });
    }
});

// GET /api/returns/:id - Get specific return request details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                items: true,
                order: {
                    include: {
                        items: true,
                        address: true
                    }
                },
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

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        // Check ownership
        if (returnRequest.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(returnRequest);

    } catch (error: any) {
        console.error('[Return Detail Error]:', error);
        res.status(500).json({ error: 'Failed to fetch return request' });
    }
});

// PATCH /api/returns/:id/cancel - Cancel a pending return request
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        if (returnRequest.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (returnRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending requests can be cancelled' });
        }

        const updated = await prisma.returnRequest.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        res.json({ success: true, returnRequest: updated });

    } catch (error: any) {
        console.error('[Return Cancel Error]:', error);
        res.status(500).json({ error: 'Failed to cancel return request' });
    }
});

export default router;
