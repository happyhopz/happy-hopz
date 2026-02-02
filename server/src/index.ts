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
import { PrismaClient } from '@prisma/client';

const app: Express = express();
const prisma = new PrismaClient();

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
            'https://happy-hopz.vercel.app',
            process.env.CLIENT_URL
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl) or matching origins
        if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
};

registerRoutes('/api');
registerRoutes(''); // Fallback for direct calls

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
            if (process.env[key]) {
                try {
                    const url = new URL(process.env[key] as string);
                    console.log(`📡 [${key}] matches host: ${url.hostname}`);
                } catch (e) {
                    console.log(`📡 [${key}] exists but is not a valid URL`);
                }
            }
        });
    } catch (error) {
        console.error('❌ Database connection failed at startup:', error);
    }
});
