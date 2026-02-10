import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/notifications
 * Fetch notifications for the current user.
 * If admin, also returns broadcast admin notifications.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === 'ADMIN';

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { userId }, // Targeted to this user
                    { isAdmin: true, userId: null, ...(isAdmin ? {} : { id: 'none' }) } // Admin broadcasts (only if user is admin)
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * GET /api/notifications/admin
 * Fetch notifications for administrators.
 * Returns both broadcast (userId is null) and targeted notifications.
 */
router.get('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                isAdmin: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to last 50
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin notifications' });
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read.
 */
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id as string }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Check permissions: either broadcast admin, admin-targeted, or user-targeted
        if (notification.isAdmin && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!notification.isAdmin && notification.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.notification.update({
            where: { id: id as string },
            data: { isRead: true }
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all visible notifications as read for the current context (admin or user).
 */
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { type } = z.object({ type: z.enum(['admin', 'user']) }).parse(req.query);

        if (type === 'admin') {
            if (req.user!.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied' });
            }

            await prisma.notification.updateMany({
                where: { isAdmin: true, isRead: false },
                data: { isRead: true }
            });
        } else {
            await prisma.notification.updateMany({
                where: { userId: req.user!.id, isRead: false },
                data: { isRead: true }
            });
        }

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

export default router;
