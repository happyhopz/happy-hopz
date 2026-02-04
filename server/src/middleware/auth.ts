import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
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
        req.user = decoded;
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

// Site Maintenance Check
export const checkMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prisma } = await import('../lib/prisma');
        const settings = await prisma.siteContent.findUnique({
            where: { key: 'site_settings' }
        });

        if (settings) {
            const content = JSON.parse(settings.content);
            if (content.maintenanceMode && !req.url.includes('/admin') && !req.url.includes('/auth/login')) {
                return res.status(503).json({
                    error: 'Maintenance Mode',
                    message: content.maintenanceMessage || 'Happy Hopz is currently undergoing maintenance. We will be back soon!'
                });
            }
        }
    } catch (error) {
        console.error('Maintenance check failed:', error);
    }
    next();
};
