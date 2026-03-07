import axios from 'axios';

const TEST_EMAIL = `test_${Math.random().toString(36).slice(2)}@example.com`;

async function testSubscription() {
    try {
        console.log(`📡 Testing subscription for: ${TEST_EMAIL}`);
        const response = await axios.post('http://localhost:5001/api/marketing/subscribe', {
            email: TEST_EMAIL,
            source: 'POPUP'
        });
        console.log('✅ Subscription Response:', response.data);
    } catch (error: any) {
        console.error('❌ Subscription Failed:', error.response?.data || error.message);
    }
}

testSubscription();
