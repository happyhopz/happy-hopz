import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const couponCode = 'WELCOME10';

    const existing = await prisma.coupon.findUnique({
        where: { code: couponCode }
    });

    if (existing) {
        await prisma.coupon.update({
            where: { code: couponCode },
            data: { firstTimeOnly: true }
        });
        console.log(`Updated existing coupon ${couponCode} to be first-time only.`);
    } else {
        await prisma.coupon.create({
            data: {
                code: couponCode,
                discountType: 'PERCENTAGE',
                discountValue: 10,
                firstTimeOnly: true,
                isActive: true,
                minOrderValue: 0,
            }
        });
        console.log(`Created new coupon ${couponCode} as first-time only.`);
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
