import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Get user notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: req.params.id as string,
                userId: req.user!.id
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.id },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.deleteMany({
            where: {
                id: req.params.id as string,
                userId: req.user!.id
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default router;
