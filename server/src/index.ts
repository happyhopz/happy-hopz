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
import { PrismaClient } from '@prisma/client';

const app: Express = express();
const prisma = new PrismaClient();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// Request logging for debug
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${req.method}] ${req.url}`);
    }
    next();
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:5173',
        process.env.CLIENT_URL || 'http://localhost:8081'
    ],
    credentials: true
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Happy Hopz API is running!' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
    console.log(`🚀 Happy Hopz Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);

    try {
        const count = await prisma.product.count();
        console.log(`📦 Database connection verified. Total products: ${count}`);
        const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
        if (dbUrl) {
            console.log(`🔗 DB Host: ${new URL(dbUrl).hostname}`);
        }
    } catch (error) {
        console.error('❌ Database connection failed at startup:', error);
    }
});
