import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// [PUBLIC] Submit contact form
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const contact = await prisma.contactForm.create({
            data: { name, email, subject, message }
        });

        res.status(201).json(contact);
    } catch (error) {
        console.error('Contact submit error:', error);
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
});

// [ADMIN] Get all contact entries
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        // @ts-ignore - isAdmin is check in middleware but typing might vary
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const status = req.query.status as string | undefined;
        const where: any = {};
        if (status) where.status = status;

        const entries = await prisma.contactForm.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(entries);
    } catch (error) {
        console.error('Fetch contacts error:', error);
        res.status(500).json({ error: 'Failed to fetch contact entries' });
    }
});

// [ADMIN] Update contact status (e.g., mark as read/replied)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { id } = req.params;
        const inputStatus: any = req.body.status;
        if (!inputStatus || typeof inputStatus !== 'string') {
            return res.status(400).json({ error: 'Status is required and must be a string' });
        }

        const entry = await prisma.contactForm.update({
            where: { id: id as string },
            data: { status: inputStatus }
        });

        res.json(entry);
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Failed to update contact entry' });
    }
});

export default router;
