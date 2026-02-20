
import axios from 'axios';

const PORTS = [5000, 5001, 3000, 4000, 8080];
const EMAIL = 'admin@apollo.demo';
const PASSWORD = 'Password@123';

async function probe() {
    console.log('🚀 Probing API for Multi-Location Data...');

    for (const port of PORTS) {
        const baseUrl = `http://localhost:${port}/api`;
        console.log(`\nTesting ${baseUrl}...`);

        try {
            // 1. Login
            const loginRes = await axios.post(`${baseUrl}/auth/login`, {
                email: EMAIL,
                password: PASSWORD
            });

            console.log(`✅ [${port}] Login Success! Status: ${loginRes.status}`);
            const availableLocations = loginRes.data.user?.availableLocations || loginRes.data.availableLocations;

            if (availableLocations) {
                console.log('📦 AVAILABLE LOCATIONS FOUND:');
                console.log(JSON.stringify(availableLocations, null, 2));
            } else {
                console.log('❌ availableLocations NOT found in login response.');
                console.log('Response Keys:', Object.keys(loginRes.data));
                if (loginRes.data.user) console.log('User Keys:', Object.keys(loginRes.data.user));
            }

            // 2. Me
            const token = loginRes.data.accessToken;
            if (token) {
                try {
                    const meRes = await axios.get(`${baseUrl}/users/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log(`✅ [${port}] /users/me Success!`);
                    const meLocs = meRes.data.availableLocations;
                    if (meLocs) {
                        console.log('📦 /users/me LOCATIONS FOUND:', meLocs.length);
                        console.log(JSON.stringify(meLocs, null, 2));
                    } else {
                        console.log('❌ /users/me did NOT return availableLocations.');
                        console.log('Keys:', Object.keys(meRes.data));
                    }
                } catch (meError: any) {
                    console.log(`⚠️ /users/me failed: ${meError.message}`);
                }
            }

            // If we succeed once, stop.
            return;
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`Checking port ${port}: Connection Refused.`);
            } else {
                console.log(`❌ Error on port ${port}:`, error.message);
                if (error.response) {
                    console.log('Status:', error.response.status);
                    console.log('Data:', error.response.data);
                }
            }
        }
    }

    console.log('\n❌ Could not connect to any standard backend port.');
}

probe();
