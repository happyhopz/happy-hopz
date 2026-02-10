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
    console.log('📬 [PATCH /api/settings] Request received');
    console.log('👤 [PATCH /api/settings] User:', req.user?.email, 'Role:', req.user?.role);

    try {
        const { settings } = req.body;
        console.log('📦 [PATCH /api/settings] Body:', JSON.stringify(req.body, null, 2));

        if (!settings || typeof settings !== 'object') {
            console.warn('⚠️ [PATCH /api/settings] Invalid format');
            return res.status(400).json({ error: 'Invalid settings format' });
        }

        const entries = Object.entries(settings);
        console.log(`🔄 [PATCH /api/settings] Updating ${entries.length} items:`, Object.keys(settings));

        const updates = entries.map(([key, value]) => {
            console.log(`   - Upserting key: "${key}" to value: "${value}"`);
            return prisma.siteSettings.upsert({
                where: { key },
                update: { value: String(value) },
                create: {
                    key,
                    value: String(value),
                    type: typeof value === 'number' ? 'number' : 'string'
                }
            });
        });

        await Promise.all(updates);
        console.log('✅ [PATCH /api/settings] DB Upserts completed');

        // Audit Log
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'UPDATE_SETTINGS',
                    entity: 'SiteSettings',
                    details: `Updated settings: ${Object.keys(settings).join(', ')}`,
                    adminId: req.user!.id
                }
            });
            console.log('✅ [PATCH /api/settings] Audit log created');
        } catch (auditError) {
            console.error('❌ [PATCH /api/settings] Audit log failed (non-blocking):', auditError);
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error('❌ [UPDATE SETTINGS ERROR]:', error.message || error);
        if (error.code === 'P2025') {
            console.error('   - Cause: Single or more keys were not found in SiteSettings table');
        }
        res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
});

export default router;
