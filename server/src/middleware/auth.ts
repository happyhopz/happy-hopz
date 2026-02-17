import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const TEST_DOMAINS = ['test.com', 'example.com', 'lovable.dev', 'dummy.com'];
const TEST_EMAILS = ['user@test.com', 'test@test.com', 'test2@example.com', 'unverified@test.com'];

export const isTestUser = (email: string): boolean => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    const domain = lowerEmail.split('@')[1];

    return TEST_DOMAINS.includes(domain) ||
        TEST_EMAILS.includes(lowerEmail) ||
        lowerEmail.includes('testuser') ||
        lowerEmail.startsWith('test.');
};

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token = req.headers.authorization?.split(' ')[1];

        // NEW: Fallback for file downloads (e.g., shipping labels) where window.open is used
        if (!token && req.query.token) {
            token = req.query.token as string;
        }

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Block test users from live site access
        if (isTestUser(decoded.email) && decoded.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'This account is a test account and is not allowed to access the live site.'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Optional auth: just don't set req.user if it's a test user
        if (!isTestUser(decoded.email) || decoded.role === 'ADMIN') {
            req.user = decoded;
        }
        next();
    } catch (error) {
        // Continue as guest
        next();
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = ['ADMIN', 'STAFF'];
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Staff access required' });
    }
    next();
};

// Site Maintenance Check (Cached to prevent DB exhaustion)
let maintenanceCache: { mode: boolean; message: string; expiry: number } | null = null;
const CACHE_DURATION = 60000; // 60 seconds

export const checkMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Skip check for admin and core auth routes
    if (req.url.includes('/admin') || req.url.includes('/auth/login') || req.url === '/health' || req.url === '/api/health') {
        return next();
    }

    try {
        const now = Date.now();

        // 2. Check Cache
        if (maintenanceCache && now < maintenanceCache.expiry) {
            if (maintenanceCache.mode) {
                console.log(`[Maintenance] CACHE HIT: Blocked ${req.url}`);
                return res.status(503).json({
                    error: 'Maintenance Mode',
                    message: maintenanceCache.message
                });
            }
            return next();
        }

        // 3. Cache Miss - Query DB
        console.log(`[Maintenance] CACHE MISS: Fetching from DB for ${req.url}`);
        const { prisma } = await import('../lib/prisma');
        const settings = await prisma.siteContent.findUnique({
            where: { key: 'site_settings' }
        });

        let maintenanceMode = false;
        let maintenanceMessage = 'Happy Hopz is currently undergoing maintenance. We will be back soon!';

        if (settings) {
            const content = JSON.parse(settings.content);
            maintenanceMode = !!content.maintenanceMode;
            maintenanceMessage = content.maintenanceMessage || maintenanceMessage;
        }

        // 4. Update Cache
        maintenanceCache = {
            mode: maintenanceMode,
            message: maintenanceMessage,
            expiry: now + CACHE_DURATION
        };

        if (maintenanceMode) {
            return res.status(503).json({
                error: 'Maintenance Mode',
                message: maintenanceMessage
            });
        }
    } catch (error) {
        console.error('[Maintenance] Check failed (falling back to ALLOW):', error);
        // Fallback to allow if DB is down - prevents complete block during DB exhaustion
    }
    next();
};
