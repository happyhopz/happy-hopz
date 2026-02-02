import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all notifications for the current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark a notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const notification = await prisma.notification.update({
            where: {
                id: req.params.id as string,
                userId: req.user!.id
            },
            data: { isRead: true }
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.id, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

export default router;
