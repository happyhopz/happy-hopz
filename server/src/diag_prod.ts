import axios from 'axios';

const PRODUCTION_API = 'https://happy-hopz.onrender.com/api';

async function runDiagnostics() {
    console.log('🚀 Starting Production API Health Check...');

    const tests = [
        { name: 'Root API Health', url: `${PRODUCTION_API}/products` },
        { name: 'Admin Stats Authorization', url: `${PRODUCTION_API}/admin/stats` },
        { name: 'Search Endpoint', url: `${PRODUCTION_API}/search?q=sneakers` },
        { name: 'Inventory Bulk Endpoint Check', url: `${PRODUCTION_API}/admin/inventory/bulk-stock`, method: 'PUT' },
    ];

    for (const test of tests) {
        try {
            const startTime = Date.now();
            const config = { method: test.method || 'GET' };
            const response = await axios(test.url, config);
            const duration = Date.now() - startTime;
            console.log(`✅ ${test.name}: SUCCESS [${response.status}] in ${duration}ms`);
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log(`✅ ${test.name}: SECURE [${error.response.status}] (Auth Protected)`);
            } else {
                console.log(`❌ ${test.name}: FAILED [${error.response?.status || 'ERR_CONN'}]`);
            }
        }
    }
}

runDiagnostics();
