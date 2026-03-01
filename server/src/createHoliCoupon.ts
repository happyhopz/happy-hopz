import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Creating Holi Coupon ---');

    try {
        const coupon = await prisma.coupon.upsert({
            where: { code: 'HOLI10' },
            update: {
                discountType: 'PERCENTAGE',
                discountValue: 10,
                isActive: true,
                firstTimeOnly: false,
            },
            create: {
                code: 'HOLI10',
                discountType: 'PERCENTAGE',
                discountValue: 10,
                isActive: true,
                firstTimeOnly: false,
            },
        });

        console.log('Coupon created/updated successfully:', coupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
