const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Simple debug test
async function debugAuth() {
    const timestamp = Date.now();
    const testUser = {
        email: `debug_${timestamp}@test.com`,
        password: '123456',
        username: `debug_${timestamp}`
    };

    console.log('🔧 Testing auth with simple data...');
    console.log('User data:', testUser);

    try {
        // Register
        console.log('\n1. Registering user...');
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
        console.log('✅ Register success:', registerResponse.data);

        // Login
        console.log('\n2. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login success:', loginResponse.data);

        const token = loginResponse.data.accessToken;
        console.log('🔑 Token:', token);

        // Test protected route
        console.log('\n3. Testing protected route...');
        const protectedResponse = await axios.get(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Protected route success:', protectedResponse.data);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

debugAuth();
