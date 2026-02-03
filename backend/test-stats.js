// Quick test script to check if the stats endpoint is working
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';

async function testStatsEndpoint() {
    try {
        console.log('Testing /api/users/stats endpoint...');
        console.log('Note: This requires a valid auth token.');
        console.log('If you get 401, that\'s expected - the endpoint exists.');
        console.log('If you get 404, the route is not registered.\n');

        const response = await axios.get(`${BACKEND_URL}/api/users/stats`, {
            headers: {
                'Authorization': 'Bearer test-token'
            },
            validateStatus: () => true // Don't throw on any status
        });

        console.log('Status:', response.status);
        console.log('Response:', response.data);

        if (response.status === 401) {
            console.log('\n✅ Endpoint exists (401 Unauthorized is expected without valid token)');
        } else if (response.status === 404) {
            console.log('\n❌ Endpoint not found - backend may need restart');
        } else if (response.status === 200) {
            console.log('\n✅ Endpoint working!');
        } else {
            console.log(`\n⚠️  Unexpected status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n❌ Backend server is not running on port 5000');
        }
    }
}

testStatsEndpoint();
