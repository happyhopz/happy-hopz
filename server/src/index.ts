import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import couponRoutes from './routes/coupons';
import reviewRoutes from './routes/reviews';
import contentRoutes from './routes/content';
import notificationRoutes from './routes/notifications';
import addressRoutes from './routes/addresses';
import contactRoutes from './routes/contacts';
import returnsRoutes from './routes/returns';
import adminReturnsRoutes from './routes/adminReturns';
import marketingRoutes from './routes/marketing';
import searchRoutes from './routes/search';
import settingsRoutes from './routes/settings';
import { authenticate, requireAdmin, AuthRequest, checkMaintenance } from './middleware/auth';
import { PrismaClient } from '@prisma/client';
import { prisma } from './lib/prisma';

const app: Express = express();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// Request logging & Auto-fix for common route errors
app.use((req, res, next) => {
    // 1. Log the incoming request
    console.log(`📡 [${req.method}] ${req.url} (Origin: ${req.headers.origin})`);

    // 2. Fix double slashes or doubled /api prefix
    if (req.url.includes('//')) req.url = req.url.replace(/\/\//g, '/');
    if (req.url.startsWith('/api/api')) req.url = req.url.replace('/api/api', '/api');

    next();
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:8080',
            'http://localhost:3000', // Added by user instruction
            'https://happy-hopz.vercel.app',
            'https://happyhopz.com', // Added by user instruction
            'https://www.happyhopz.com', // Added by user instruction
            process.env.CLIENT_URL
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl) or matching origins
        // Also allow any vercel.app subdomain
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute'
});
app.use('/api/', limiter);

// Admin-specific rate limiting (stricter)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per 15 minutes
    message: 'Too many admin login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply to admin login route specifically
app.use('/api/auth/login', adminLimiter);

// Body parser (Increased to 50MB for large base64 product image arrays)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Maintenance Check (Allows Admin/Auth only)
app.use(checkMaintenance);

// Health check (Versioned to verify deployment)
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        version: '2.1-RESILIENT',
        message: 'Happy Hopz API is LIVE and RESILIENT!'
    });
});

// Resilient Routes - Works with and without /api prefix
const registerRoutes = (prefix: string) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/products`, productRoutes);
    app.use(`${prefix}/cart`, cartRoutes);
    app.use(`${prefix}/orders`, orderRoutes);
    app.use(`${prefix}/payment`, paymentRoutes);
    app.use(`${prefix}/admin`, adminRoutes);
    app.use(`${prefix}/coupons`, couponRoutes);
    app.use(`${prefix}/reviews`, reviewRoutes);
    app.use(`${prefix}/content`, contentRoutes);
    app.use(`${prefix}/notifications`, notificationRoutes);
    app.use(`${prefix}/addresses`, addressRoutes);
    app.use(`${prefix}/contacts`, contactRoutes);
    app.use(`${prefix}/returns`, returnsRoutes);
    app.use(`${prefix}/admin/returns`, adminReturnsRoutes);
    app.use(`${prefix}/marketing`, marketingRoutes);
    app.use(`${prefix}/search`, searchRoutes);
    app.use(`${prefix}/settings`, settingsRoutes);
};

registerRoutes('/api');
registerRoutes(''); // Fallback for direct calls

// 404 handler with detailed logging
app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip for diagnostic route
    if (req.url === '/api/debug-routes' || req.url === '/api/debug-env') return next();
    next();
});

// Diagnostic endpoint to see all registered routes (Admin or Development only)
app.get('/api/debug-routes', (req: Request, res: Response) => {
    const routes: any[] = [];

    // Help identify the router and prefixes
    const printRoutes = (prefix: string, stack: any[]) => {
        stack.forEach((layer: any) => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                routes.push(`[${methods}] ${prefix}${layer.route.path}`);
            } else if (layer.name === 'router') {
                const newPrefix = prefix + layer.regexp.source
                    .replace('\\/?(?=\\/|$)', '')
                    .replace('^\\/', '')
                    .replace(/\\\//g, '/')
                    .replace('\\', '');
                printRoutes(newPrefix, layer.handle.stack);
            }
        });
    };

    printRoutes('', app._router.stack);

    res.json({
        message: 'Happy Hopz API Route Diagnostic',
        env: process.env.NODE_ENV,
        port: PORT,
        count: routes.length,
        routes: routes.sort()
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`🔴 SERVER ERROR [${req.method}] ${req.url}:`, err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler with detailed logging
app.use((req: Request, res: Response) => {
    console.warn(`⚠️ 404 - Route not found: [${req.method}] ${req.url} (Origin: ${req.headers.origin})`);
    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 Happy Hopz Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);

    try {
        const count = await prisma.product.count();
        console.log(`📦 DATABASE VERIFIED: Total products = ${count}`);

        const envs = ['SUPABASE_DATABASE_URL', 'PROD_DATABASE_URL', 'DATABASE_URL'];
        envs.forEach(key => {
            const secret = process.env[key];
            if (secret && typeof secret === 'string' && secret.startsWith('postgresql')) {
                try {
                    const url = new URL(secret);
                    console.log(`📡 [${key}] matches host: ${url.hostname}`);
                } catch (e) {
                    console.log(`📡 [${key}] is present but URL format is slightly off, skipping detail log.`);
                }
            }
        });
    } catch (error) {
        console.error('❌ Database connection failed at startup:', error);
    }
});
