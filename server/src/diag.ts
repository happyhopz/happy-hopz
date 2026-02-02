import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const res = await prisma.$queryRaw`SELECT current_database() as db, current_schema() as schema`;
        console.log('DB_INFO:', JSON.stringify(res));

        const count = await prisma.product.count();
        console.log('PRODUCT_COUNT:', count);

        const products = await prisma.product.findMany({ take: 1 });
        console.log('FIRST_PRODUCT:', JSON.stringify(products));

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
