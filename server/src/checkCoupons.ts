import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const coupons = await prisma.coupon.findMany();
    console.log('Current Coupons count:', coupons.length);
    console.log(JSON.stringify(coupons, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
