import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- START DIAGNOSIS ---');
    try {
        // Find a product
        const product = await prisma.product.findFirst();
        if (!product) {
            console.log('No products found to test update.');
            return;
        }
        console.log('Testing update on product ID:', product.id);

        // Attempt a partial update mimicking the frontend payload
        const testData = {
            sku: product.sku || 'TEST-SKU',
            name: product.name + ' (Updated)',
            description: product.description,
            price: 100.50,
            stock: 10,
            sizes: JSON.stringify(['S', 'M']),
            colors: JSON.stringify(['Red']),
            images: JSON.stringify(['https://example.com/test.jpg']),
            tags: JSON.stringify(['Test']),
            status: 'ACTIVE'
        };

        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: testData
        });
        console.log('SUCCESS: Product updated successfully in diagnostic script.');
    } catch (error: any) {
        console.error('FAILURE: Product update failed.');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        console.error('Stack Trace:', error.stack);
    } finally {
        await prisma.$disconnect();
        console.log('--- END DIAGNOSIS ---');
    }
}

diagnose();
