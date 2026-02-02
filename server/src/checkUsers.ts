import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

check().finally(() => prisma.$disconnect());
