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

        // 2. Ensure isHidden column exists on Coupon table
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false
            `);
            console.log('[Migration] ✅ Coupon.isHidden column ready.');
        } catch (error: any) {
            console.warn('[Migration] ⚠️ Coupon.isHidden check skipped:', error.message);
        }

        // 3. Check product columns exist
        try {
            await prisma.product.findFirst({
                select: { boxPrice: true, tagPrice: true, shippingCost: true, otherCosts: true }
            });
            console.log('[Migration] ✅ Product columns OK.');
        } catch (error: any) {
            console.warn('[Migration] ⚠️ Product columns missing, continuing anyway:', error.message);
        }

        // 4. One-time backfill: create notifications for all past events since Feb 2025
        try {
            const existingCount = await (prisma as any).notification.count();
            if (existingCount === 0) {
                console.log('[Migration] 📦 Backfilling historical notifications...');
                const since = new Date('2025-02-01T00:00:00.000Z');
                const { v4: uuidv4 } = await import('crypto').then(m => ({ v4: () => m.randomUUID() }));

                // Backfill orders
                const orders = await prisma.order.findMany({
                    where: { createdAt: { gte: since } },
                    orderBy: { createdAt: 'asc' },
                    include: { user: { select: { name: true, email: true } } }
                });
                for (const order of orders) {
                    await (prisma as any).notification.create({
                        data: {
                            id: uuidv4(),
                            title: 'New Order Placed 🛍️',
                            message: `Order #${order.id.slice(0, 8)} placed by ${order.user?.name || order.user?.email || order.guestEmail || 'Guest'} for ₹${order.total}`,
                            type: 'ORDER',
                            isAdmin: true,
                            isRead: true,
                            priority: 'NORMAL',
                            createdAt: order.createdAt,
                            metadata: JSON.stringify({ orderId: order.id })
                        }
                    });
                }
                console.log(`[Migration] ✅ Backfilled ${orders.length} order notifications.`);

                // Backfill user signups
                const users = await prisma.user.findMany({
                    where: { createdAt: { gte: since }, role: 'USER' },
                    orderBy: { createdAt: 'asc' }
                });
                for (const user of users) {
                    await (prisma as any).notification.create({
                        data: {
                            id: uuidv4(),
                            title: 'New User Signup! 🎉',
                            message: `${user.name || user.email} joined Happy Hopz.`,
                            type: 'SECURITY',
                            isAdmin: true,
                            isRead: true,
                            priority: 'NORMAL',
                            createdAt: user.createdAt,
                            metadata: JSON.stringify({ userId: user.id, email: user.email })
                        }
                    });
                }
                console.log(`[Migration] ✅ Backfilled ${users.length} signup notifications.`);

                // Backfill contact queries
                const contacts = await (prisma as any).contact?.findMany({
                    where: { createdAt: { gte: since } },
                    orderBy: { createdAt: 'asc' }
                }).catch(() => []);
                for (const contact of (contacts || [])) {
                    await (prisma as any).notification.create({
                        data: {
                            id: uuidv4(),
                            title: 'New Support Query 📩',
                            message: `${contact.name || contact.email} sent a query: "${String(contact.message || '').slice(0, 60)}..."`,
                            type: 'SYSTEM',
                            isAdmin: true,
                            isRead: true,
                            priority: 'NORMAL',
                            createdAt: contact.createdAt,
                            metadata: JSON.stringify({ contactId: contact.id, email: contact.email })
                        }
                    });
                }
                console.log(`[Migration] ✅ Backfilled ${(contacts || []).length} contact notifications.`);
            } else {
                console.log(`[Migration] ⏭️ Backfill skipped — ${existingCount} notifications already exist.`);
            }
        } catch (error: any) {
            console.warn('[Migration] ⚠️ Backfill skipped (non-fatal):', error.message);
        }

        console.log('[Migration] ✅ All checks complete - server will start now!');
    } catch (error) {
        console.error('[Migration] Non-fatal error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
