import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('[Migration] Starting database migration...');

        // Test if new columns exist by trying to query them
        try {
            await prisma.product.findFirst({
                select: {
                    boxPrice: true,
                    tagPrice: true,
                    shippingCost: true,
                    otherCosts: true
                }
            });
            console.log('[Migration] ✅ All new columns exist. No migration needed.');
        } catch (error: any) {
            console.log('[Migration] ⚠️ New columns missing. Running migration...');
            console.log('[Migration] Error:', error.message);
            console.log('[Migration] Please run: npx prisma db push --accept-data-loss');
            process.exit(1);
        }

        console.log('[Migration] Migration check complete!');
    } catch (error) {
        console.error('[Migration] Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
