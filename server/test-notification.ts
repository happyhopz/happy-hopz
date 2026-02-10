require('dotenv').config();
const { NotificationService } = require('./src/services/notificationService');

async function testNotificationEmail() {
    console.log('🧪 Testing NotificationService Email Integration...');

    // 1. Test Security Event (Should trigger email)
    console.log('\n--- Test 1: Security Event ---');
    await NotificationService.notifySecurityEvent(
        'Test Security Alert',
        'This is a test security alert to verify email triggers.',
        'test-user-id',
        { ip: '127.0.0.1', device: 'Test Runner' }
    );

    // 2. Test Order Notification (Should trigger generic email for now)
    console.log('\n--- Test 2: Order Notification ---');
    await NotificationService.notifyNewOrder(
        'order-test-999',
        'Test Customer',
        1500.50
    );

    console.log('\n✅ Test execution completed. Check server console for "Email sent" logs.');
}

testNotificationEmail().catch(err => console.error('❌ Test failed:', err));
