import axios from 'axios';

async function verifyCoupon() {
    const API_URL = 'http://localhost:5000/api/coupons/validate'; // Adjust port if needed

    console.log('--- Verifying Holi Coupon ---');

    try {
        const response = await axios.post(API_URL, {
            code: 'HOLI10',
            cartTotal: 1000
        });

        console.log('Validation Response:', response.data);

        if (response.data.discountAmount === 100) {
            console.log('✅ Verification successful! 10% discount applied.');
        } else {
            console.error('❌ Verification failed. Expected 100 discount, got', response.data.discountAmount);
        }
    } catch (error: any) {
        if (error.response) {
            console.error('❌ Error response:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

verifyCoupon();
