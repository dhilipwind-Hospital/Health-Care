
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';
const CREDENTIALS = {
    email: 'patient@example.com',
    password: 'password123'
};

async function verify() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
        const token = loginRes.data.accessToken || loginRes.data.token || loginRes.data.data?.token;
        const user = (loginRes.data.user || loginRes.data.data?.user) as any;

        if (!token || !user) {
            console.error('Login failed - no token or user received');
            console.log('Response:', JSON.stringify(loginRes.data, null, 2));
            return;
        }

        console.log(`   ✅ Logged in as ${user.firstName} ${user.lastName} (${user.id})`);

        const headers = { Authorization: `Bearer ${token}` };
        const patientId = user.id;

        console.log('\n2. Testing /inpatient/admissions?patientId=...');
        try {
            const admRes = await axios.get(`${BASE_URL}/inpatient/admissions`, {
                params: { patientId },
                headers
            });
            const admissions = admRes.data?.data || admRes.data?.admissions || admRes.data || [];
            console.log(`   Found ${Array.isArray(admissions) ? admissions.length : 0} Admissions`);
        } catch (e: any) {
            console.log(`   ❌ Admissions Error: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        }

        console.log('\n3. Testing /lab/orders?patientId=...');
        try {
            const labRes = await axios.get(`${BASE_URL}/lab/orders`, {
                params: { patientId },
                headers
            });
            const labs = labRes.data?.data || labRes.data?.orders || labRes.data || [];
            console.log(`   Found ${Array.isArray(labs) ? labs.length : 0} Lab Orders`);
            if (Array.isArray(labs) && labs.length > 0 && labs[0].items) {
                console.log(`   First order has ${labs[0].items.length} items`);
            }
        } catch (e: any) {
            console.log(`   ❌ Lab Orders Error: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        }

        console.log('\n4. Testing /pharmacy/prescriptions?patientId=...');
        try {
            const rxRes = await axios.get(`${BASE_URL}/pharmacy/prescriptions`, {
                params: { patientId },
                headers
            });
            const prescriptions = rxRes.data?.data || rxRes.data?.prescriptions || rxRes.data || [];
            console.log(`   Found ${Array.isArray(prescriptions) ? prescriptions.length : 0} Prescriptions`);
            if (Array.isArray(prescriptions) && prescriptions.length > 0 && prescriptions[0].items) {
                console.log(`   First prescription has ${prescriptions[0].items.length} items`);
            }
        } catch (e: any) {
            console.log(`   ❌ Prescriptions Error: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        }

        console.log('\n5. Testing /patients/:id/procedures...');
        try {
            const procRes = await axios.get(`${BASE_URL}/patients/${patientId}/procedures`, { headers });
            const procedures = procRes.data?.data || procRes.data || [];
            console.log(`   Found ${Array.isArray(procedures) ? procedures.length : 0} Procedures`);
        } catch (e: any) {
            console.log(`   ❌ Procedures Error: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        }

        console.log('\n6. Testing /patients/:id/documents...');
        try {
            const docRes = await axios.get(`${BASE_URL}/patients/${patientId}/documents`, { headers });
            const docs = docRes.data?.data || docRes.data || [];
            console.log(`   Found ${Array.isArray(docs) ? docs.length : 0} Documents`);
        } catch (e: any) {
            console.log(`   ❌ Documents Error: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        }

        console.log('\n7. Testing /patients/:id/notes...');
        try {
            const noteRes = await axios.get(`${BASE_URL}/patients/${patientId}/notes`, { headers });
            const notes = noteRes.data?.data || noteRes.data || [];
            console.log(`   Found ${Array.isArray(notes) ? notes.length : 0} Notes`);
        } catch (e: any) {
            console.log(`   ❌ Notes Error: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        }

        console.log('\n✅ Verification Complete!');

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

verify();
