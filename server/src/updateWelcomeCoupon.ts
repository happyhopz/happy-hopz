import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Delete old WELCOME10 if it exists or just update it
    // To be clean, we'll rename it
    const oldCoupon = await prisma.coupon.findUnique({
        where: { code: 'WELCOME10' }
    });

    if (oldCoupon) {
        await prisma.coupon.update({
            where: { id: oldCoupon.id },
            data: {
                code: 'WELCOME5',
                discountValue: 5
            }
        });
        console.log('✅ Renamed WELCOME10 to WELCOME5 with 5% discount');
    } else {
        // Create new if not found
        await prisma.coupon.upsert({
            where: { code: 'WELCOME5' },
            update: {
                discountValue: 5,
                isActive: true,
                firstTimeOnly: true
            },
            create: {
                code: 'WELCOME5',
                discountValue: 5,
                discountType: 'PERCENTAGE',
                isActive: true,
                firstTimeOnly: true
            }
        });
        console.log('✅ Created/Updated WELCOME5 with 5% discount');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
