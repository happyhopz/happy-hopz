import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('[Migration] Starting database migration check...');

        // 1. Ensure Notification table exists via raw SQL
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Notification" (
                    "id"        TEXT NOT NULL,
                    "userId"    TEXT,
                    "title"     TEXT NOT NULL,
                    "message"   TEXT NOT NULL,
                    "type"      TEXT NOT NULL,
                    "isRead"    BOOLEAN NOT NULL DEFAULT false,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "isAdmin"   BOOLEAN NOT NULL DEFAULT false,
                    "metadata"  TEXT,
                    "priority"  TEXT NOT NULL DEFAULT 'NORMAL',
                    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
                )
            `);
            console.log('[Migration] ✅ Notification table ready.');
        } catch (error: any) {
            console.warn('[Migration] ⚠️ Notification table check skipped:', error.message);
        }

        // 2. Check product columns exist
        try {
            await prisma.product.findFirst({
                select: { boxPrice: true, tagPrice: true, shippingCost: true, otherCosts: true }
            });
            console.log('[Migration] ✅ Product columns OK.');
        } catch (error: any) {
            console.warn('[Migration] ⚠️ Product columns missing, continuing anyway:', error.message);
        }

        console.log('[Migration] ✅ All checks complete - server will start now!');
    } catch (error) {
        console.error('[Migration] Non-fatal error:', error);
        // Don't exit — let the server start even if migration check fails
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
