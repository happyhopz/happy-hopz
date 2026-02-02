import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const orders = await prisma.order.findMany({
        include: {
            items: true,
            user: true
        }
    });
    console.log('Total orders:', orders.length);
    orders.forEach(o => console.log(`- Order #${o.id} by ${o.user.email} - Status: ${o.status}`));
}

check().finally(() => prisma.$disconnect());
