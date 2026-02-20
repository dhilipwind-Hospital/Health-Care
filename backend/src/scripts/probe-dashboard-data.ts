
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';
const EMAIL = 'admin@apollo.demo';
const PASSWORD = 'Password@123';

async function probe() {
    try {
        console.log('🚀 Probing Dashboard Data...');

        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const { accessToken, availableLocations, user } = loginRes.data;
        console.log(`✅ Login Success. User Org: ${user.organizationId}. Available Locs: ${availableLocations?.length}`);

        // Check Default Location Stats
        await checkStats(accessToken, 'Default (Chennai)');

        // 2. Switch to Delhi
        const delhi = availableLocations.find((l: any) => l.city === 'Delhi' || l.subdomain.includes('del'));
        if (delhi) {
            console.log(`\n🔄 Switching to Delhi (${delhi.id})...`);
            const switchRes = await axios.post(`${API_URL}/auth/switch-org`,
                { targetOrganizationId: delhi.id },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const delhiToken = switchRes.data.accessToken;
            console.log(`✅ Switch Success. New Token: ${delhiToken.substring(0, 10)}...`);

            await checkStats(delhiToken, 'Delhi');
        } else {
            console.log('❌ Delhi location not found in availableLocations');
        }

    } catch (error: any) {
        console.error('❌ Probe Failed:', error.response?.data || error.message);
    }
}

async function checkStats(token: string, label: string) {
    try {
        const headers = { Authorization: `Bearer ${token}` };

        // Check Patients (Filtered)
        const usersRes = await axios.get(`${API_URL}/users?role=patient&limit=1`, { headers });
        const patientData = usersRes.data;
        // Inspect structure
        const totalPatients = patientData?.pagination?.total ?? patientData?.meta?.total ?? patientData?.total ?? 'NOT FOUND';
        console.log(`[${label}] Total Patients (Role=Patient): ${totalPatients}`);
        if (totalPatients === 'NOT FOUND') console.log('Response Structure:', JSON.stringify(patientData, null, 2).substring(0, 500));

        // Check ALL Users
        const allUsersRes = await axios.get(`${API_URL}/users?limit=1`, { headers });
        const allCount = allUsersRes.data?.pagination?.total ?? allUsersRes.data?.total ?? 'NOT FOUND';
        console.log(`[${label}] Total Users (All): ${allCount}`);


        // Check Appointments
        const apptRes = await axios.get(`${API_URL}/appointments/admin?limit=10`, { headers });
        const apptData = apptRes.data;
        const totalAppts = apptData?.meta?.total ?? apptData?.pagination?.total ?? 'NOT FOUND';
        console.log(`[${label}] Total Appointments: ${totalAppts}`);

        // Check "Today's" logic?
        const appts = apptData.data || [];
        const today = new Date().toISOString().split('T')[0];
        const todayCount = appts.filter((a: any) => a.startTime.startsWith(today)).length;
        console.log(`[${label}] Appointments (in fetched batch): ${appts.length}`);

    } catch (e: any) {
        console.error(`[${label}] Check Failed:`, e.response?.data || e.message);
    }
}

probe();
