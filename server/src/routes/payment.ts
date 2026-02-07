import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';

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
    razorpay_signature: z.string()
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
            res.json({ verified: true });
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
        if (secret) {
            const signature = req.headers['x-razorpay-signature'] as string;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (expectedSignature !== signature) {
                return res.status(400).json({ error: 'Invalid signature' });
            }
        }

        const { event, payload } = req.body;
        console.log(`Razorpay webhook: ${event}`, payload);

        // Handle events like order.paid or payment.authorized
        res.json({ received: true });
    } catch (error) {
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
