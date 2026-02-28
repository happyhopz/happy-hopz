import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /analytics/pageview — public, no auth required
// Called by the client on every page navigation
router.post('/pageview', async (req: Request, res: Response) => {
    try {
        const { path, sessionId } = req.body;

        if (!path || !sessionId) {
            return res.status(400).json({ error: 'path and sessionId are required' });
        }

        // Skip admin routes from tracking
        if (path.startsWith('/admin')) {
            return res.status(204).send();
        }

        await (prisma as any).pageView.create({
            data: {
                path: String(path).slice(0, 500), // cap length
                sessionId: String(sessionId).slice(0, 100)
            }
        });

        res.status(204).send();
    } catch (error) {
        // Fail silently — never break the client for analytics errors
        res.status(204).send();
    }
});

export default router;
