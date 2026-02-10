require('dotenv').config();
const { sendAdminOrderNotification } = require('./src/utils/email');

async function testEmail() {
    console.log('Testing email configuration...');
    const mockOrder = {
        id: 'test-order-id-12345',
        total: 999,
        subtotal: 900,
        tax: 99,
        shipping: 0,
        paymentStatus: 'COMPLETED',
        items: [
            { name: 'Test Product', price: 900, quantity: 1, size: 'M', color: 'Red' }
        ],
        address: {
            name: 'Test Customer',
            line1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456',
            phone: '9876543210'
        },
        user: {
            email: 'test@example.com'
        }
    };

    try {
        await sendAdminOrderNotification(mockOrder);
        console.log('Test email sequence completed.');
    } catch (error) {
        console.error('Test email failed:', error);
    }
}

testEmail();
