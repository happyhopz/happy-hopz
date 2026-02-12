import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// Create payment intent (Razorpay Order)
const paymentIntentSchema = z.object({
    amount: z.number().positive(),
    orderId: z.string()
});

router.post('/intent', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { amount, orderId } = paymentIntentSchema.parse(req.body);

        // Convert amount to paise (INR)
        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${orderId.slice(0, 10)}`,
            notes: {
                orderId: orderId
            }
        };

        const rzpOrder = await razorpay.orders.create(options);

        res.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            orderId: orderId // Internal Order ID
        });
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Verify Payment Signature
const verifySchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    orderId: z.string() // Our internal DB ID or custom ID
});

router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifySchema.parse(req.body);

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Find and update the order
            const order = await (prisma.order as any).findFirst({
                where: { OR: [{ id: req.body.orderId }, { orderId: req.body.orderId }] },
                include: { items: { include: { product: true } }, address: true, user: true }
            });

            if (!order) {
                return res.status(404).json({ error: 'Order not found for verification' });
            }

            // Update order status
            const updatedOrder = await (prisma.order as any).update({
                where: { id: order.id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'COMPLETED',
                    transactionId: razorpay_payment_id,
                    statusHistory: [
                        ...(order.statusHistory || []),
                        { status: 'CONFIRMED', updatedAt: new Date(), updatedBy: 'RAZORPAY_VERIFY' }
                    ]
                },
                include: { items: { include: { product: true } }, address: true, user: true }
            });

            // Trigger Notifications (Async)
            NotificationService.notifyOrderPlaced(updatedOrder).catch(err =>
                console.error('Failed to trigger order notifications:', err)
            );

            NotificationService.notifyNewOrder(
                updatedOrder.orderId || updatedOrder.id,
                updatedOrder.address?.name || 'Customer',
                updatedOrder.total
            ).catch(e => console.error(e));

            res.json({ verified: true, orderId: updatedOrder.id });
        } else {
            res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Payment webhook (Razorpay implementation ready)
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'] as string;

        if (secret && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (expectedSignature !== signature) {
                console.error('[Webhook] Invalid signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }
        }

        const { event, payload } = req.body;
        console.log(`[Razorpay Webhook] Event: ${event}`);

        if (event === 'order.paid') {
            const rzpOrder = payload.order.entity;
            const internalOrderId = rzpOrder.notes?.orderId;

            if (internalOrderId) {
                // Find order
                const order = await (prisma.order as any).findFirst({
                    where: {
                        OR: [{ id: internalOrderId }, { orderId: internalOrderId }],
                        paymentStatus: 'PENDING' // Only update if still pending
                    },
                    include: { items: { include: { product: true } }, address: true, user: true }
                });

                if (order) {
                    console.log(`[Webhook] Updating order ${order.id} to COMPLETED`);
                    const updatedOrder = await (prisma.order as any).update({
                        where: { id: order.id },
                        data: {
                            status: 'CONFIRMED',
                            paymentStatus: 'COMPLETED',
                            statusHistory: [
                                ...(order.statusHistory || []),
                                { status: 'CONFIRMED', updatedAt: new Date(), updatedBy: 'RAZORPAY_WEBHOOK' }
                            ]
                        },
                        include: { items: { include: { product: true } }, address: true, user: true }
                    });

                    // Trigger Notifications
                    NotificationService.notifyOrderPlaced(updatedOrder).catch(err =>
                        console.error('Failed to trigger order notifications (webhook):', err)
                    );
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing failed:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
