import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Default settings keys
const DEFAULT_SETTINGS = [
    { key: 'gst_percentage', value: '18', type: 'number' },
    { key: 'delivery_charge', value: '99', type: 'number' },
    { key: 'free_delivery_threshold', value: '999', type: 'number' }
];

// Initialize default settings if they don't exist
const initializeSettings = async () => {
    for (const setting of DEFAULT_SETTINGS) {
        await prisma.siteSettings.upsert({
            where: { key: setting.key },
            update: {},
            create: setting
        });
    }
};

// GET /api/settings - Public endpoint for checkout
router.get('/', async (req: Request, res: Response) => {
    try {
        await initializeSettings(); // Ensure defaults exist
        const settings = await prisma.siteSettings.findMany();

        // Convert to a more usable object
        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            if (s.type === 'number') settingsMap[s.key] = parseFloat(s.value);
            else if (s.type === 'boolean') settingsMap[s.key] = s.value === 'true';
            else settingsMap[s.key] = s.value;
        });

        res.json(settingsMap);
    } catch (error) {
        console.error('[Get Settings Error]:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PATCH /api/settings - Admin only update
router.patch('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { settings } = req.body; // Expecting { key: value, ... }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings format' });
        }

        const updates = Object.entries(settings).map(([key, value]) =>
            prisma.siteSettings.update({
                where: { key },
                data: { value: String(value) }
            })
        );

        await Promise.all(updates);

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_SETTINGS',
                entity: 'SiteSettings',
                details: `Updated settings: ${Object.keys(settings).join(', ')}`,
                adminId: req.user!.id
            }
        });

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('[Update Settings Error]:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
