import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const logs = await (prisma as any).notificationLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    logs.forEach((log: any) => {
        console.log(`ID: ${log.orderId} | Type: ${log.type} | Status: ${log.status} | Err: ${log.errorMessage}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
