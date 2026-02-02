import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users in DB:');
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));

        const admin = await prisma.user.findUnique({
            where: { email: 'happyhopz308@gmail.com' }
        });

        if (admin) {
            console.log('\nAdmin found!');
            console.log('Role:', admin.role);
        } else {
            console.log('\nAdmin NOT found!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
