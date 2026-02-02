import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const addressSchema = z.object({
    name: z.string(),
    phone: z.string(),
    line1: z.string(),
    line2: z.string().optional().nullable(),
    city: z.string(),
    state: z.string(),
    pincode: z.string()
});

// Get user addresses
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user!.id }
        });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// Create address
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const data = addressSchema.parse(req.body);
        const address = await prisma.address.create({
            data: {
                ...data,
                userId: req.user!.id
            }
        });
        res.status(201).json(address);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create address' });
    }
});

// Delete address
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.address.deleteMany({
            where: {
                id: req.params.id as string,
                userId: req.user!.id
            }
        });
        res.json({ message: 'Address deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

export default router;
