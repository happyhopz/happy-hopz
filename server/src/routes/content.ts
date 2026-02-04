import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get content by key
router.get('/:key', async (req, res) => {
    try {
        const content = await prisma.siteContent.findUnique({
            where: { key: req.params.key as string }
        });
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        res.json(JSON.parse(content.content));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// Update content by key (Admin only)
router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { key } = req.params;
        const { content } = req.body;

        const updated = await prisma.siteContent.upsert({
            where: { key: key as string },
            update: { content: JSON.stringify(content) },
            create: {
                key: key as string,
                content: JSON.stringify(content)
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_CONTENT',
                entity: 'CONTENT',
                entityId: key as string,
                details: `Site content "${key}" updated`,
                adminId: req.user!.id
            }
        });

        res.json(JSON.parse(updated.content));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update content' });
    }
});

export default router;
