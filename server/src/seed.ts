import { PrismaClient } from '@prisma/client';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';



async function main() {
    console.log('🌱 Seeding database...');
    if (process.env.DATABASE_URL) {
        console.log(`🔗 Connecting to: ${new URL(process.env.DATABASE_URL).hostname}`);
        console.log(`📡 Database Name: ${new URL(process.env.DATABASE_URL).pathname}`);
    }

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'happyhopz308@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'gudduhopz@22';

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Happy Hopz Admin',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    console.log('🎉 Seeding completed!');
    console.log('\n📝 Admin login credentials:');
    console.log('Email:', adminEmail);
    console.log('Password: [Set via ADMIN_PASSWORD env variable]');
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
