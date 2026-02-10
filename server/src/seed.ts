import { PrismaClient } from '@prisma/client';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';



async function main() {
    console.log('🌱 Seeding database...');
    if (process.env.DATABASE_URL) {
        console.log(`🔗 Connecting to: ${new URL(process.env.DATABASE_URL).hostname}`);
        console.log(`📡 Database Name: ${new URL(process.env.DATABASE_URL).pathname}`);
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('gudduhopz@22', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'happyhopz308@gmail.com' },
        update: {
            password: await bcrypt.hash('gudduhopz@22', 10),
            role: 'ADMIN'
        },
        create: {
            email: 'happyhopz308@gmail.com',
            password: adminPassword,
            name: 'Happy Hopz Admin',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    console.log('🎉 Seeding completed!');
    console.log('\n📝 Admin login credentials:');
    console.log('Email: happyhopz308@gmail.com');
    console.log('Password: gudduhopz@22');
    console.log('\n💡 You can now create your own products through the admin panel!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
