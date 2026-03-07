import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('🧪 Diagnosing NewsletterSubscriber model...');

        // 1. Try to list
        const count = await prisma.newsletterSubscriber.count();
        console.log(`📊 Current subscribers: ${count}`);

        // 2. Try to create a dummy
        const email = `diag_${Date.now()}@test.com`;
        const newUser = await prisma.newsletterSubscriber.create({
            data: {
                email,
                name: 'Diagnostic Tool',
                source: 'POPUP'
            }
        });
        console.log('✅ Successfully created subscriber:', newUser.email);

        // 3. Cleanup
        await prisma.newsletterSubscriber.delete({
            where: { id: newUser.id }
        });
        console.log('🗑️ Cleaned up diagnostic data');

    } catch (error: any) {
        console.error('❌ Diagnostic Failed:');
        console.error(error.message);
        if (error.code) console.error('Error Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
