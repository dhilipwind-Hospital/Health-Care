const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Doctor credentials
const DOCTOR_EMAIL = 'dhilipwind+200@gmail.com';
const DOCTOR_PASSWORD = '0fw20ysdx2giA1!';

// Admin credentials for creating patient
const ADMIN_EMAIL = 'dhilipwind+010@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';

let doctorToken = '';
let adminToken = '';
let doctorId = '';
let doctorOrgSubdomain = '';
let adminOrgSubdomain = '';
let patientId = '';
let appointmentId = '';

async function loginAsDoctor() {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: DOCTOR_EMAIL,
      password: DOCTOR_PASSWORD
    });
    doctorToken = res.data.accessToken || res.data.token;
    doctorId = res.data.user?.id;
    // Get organization subdomain from available locations/branches
    const locations = res.data.availableLocations || res.data.availableBranches || [];
    if (locations.length > 0) {
      doctorOrgSubdomain = locations[0].organization?.subdomain || locations[0].subdomain || '';
    }
    console.log('✅ Logged in as Doctor');
    console.log('   Doctor ID:', doctorId);
    console.log('   Organization:', doctorOrgSubdomain || 'default');
    return true;
  } catch (error) {
    console.error('❌ Doctor login failed:', error.response?.data || error.message);
    return false;
  }
}

async function loginAsAdmin() {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    adminToken = res.data.accessToken || res.data.token;
    // Get organization subdomain from available locations/branches
    const locations = res.data.availableLocations || res.data.availableBranches || [];
    if (locations.length > 0) {
      adminOrgSubdomain = locations[0].organization?.subdomain || locations[0].subdomain || '';
    }
    console.log('✅ Logged in as Admin');
    console.log('   Organization:', adminOrgSubdomain || 'default');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

function getDoctorHeaders() {
  // Use admin's organization if doctor's is 'default' (not found)
  const subdomain = (doctorOrgSubdomain && doctorOrgSubdomain !== 'default') ? doctorOrgSubdomain : adminOrgSubdomain;
  return {
    'Authorization': `Bearer ${doctorToken}`,
    'Content-Type': 'application/json',
    'X-Tenant-Subdomain': subdomain || 'tellme'
  };
}

function getAdminHeaders() {
  return {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
    'X-Tenant-Subdomain': adminOrgSubdomain || 'default'
  };
}

async function getOrCreatePatient() {
  console.log('\n👤 Getting/Creating Test Patient...');
  
  try {
    // First try to get existing patients using the users endpoint with role=patient
    const res = await axios.get(`${API_BASE}/users?role=patient&limit=10`, { headers: getAdminHeaders() });
    const patients = res.data.data || res.data.patients || res.data || [];
    
    if (patients.length > 0) {
      patientId = patients[0].id;
      console.log(`  ✅ Using existing patient: ${patients[0].firstName} ${patients[0].lastName}`);
      return patients[0];
    }
  } catch (error) {
    console.log('  ⚠️ Could not fetch patients, will create new one');
  }
  
  // Create a new patient using the users endpoint
  try {
    const patientData = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith.patient@example.com',
      phone: '+1-555-0150',
      dateOfBirth: '1985-06-15',
      gender: 'male',
      address: '123 Patient Street, Medical City, MC 12345',
      bloodGroup: 'O+',
      role: 'patient'
    };
    
    const res = await axios.post(`${API_BASE}/users`, patientData, { headers: getAdminHeaders() });
    patientId = res.data.data?.id || res.data.user?.id || res.data.id;
    console.log(`  ✅ Created new patient: John Smith`);
    return res.data.data || res.data.user || res.data;
  } catch (error) {
    console.error('  ❌ Failed to create patient:', error.response?.data?.message || error.message);
    return null;
  }
}

async function createAppointment() {
  console.log('\n📅 Creating Appointment...');
  
  if (!patientId || !doctorId) {
    console.log('  ⚠️ Need patient and doctor IDs to create appointment');
    return null;
  }
  
  try {
    // Create appointment for today
    const today = new Date();
    const appointmentDate = today.toISOString().split('T')[0];
    
    const appointmentData = {
      patientId,
      doctorId,
      date: appointmentDate,
      time: '10:00',
      type: 'consultation',
      reason: 'General checkup and medication review',
      status: 'completed',
      notes: 'Patient came for regular checkup'
    };
    
    const res = await axios.post(`${API_BASE}/appointments`, appointmentData, { headers: getAdminHeaders() });
    appointmentId = res.data.data?.id || res.data.appointment?.id || res.data.id;
    console.log(`  ✅ Created appointment: ${appointmentId}`);
    return res.data.data || res.data.appointment || res.data;
  } catch (error) {
    console.error('  ❌ Failed to create appointment:', error.response?.data?.message || error.message);
    
    // Try to get existing appointments
    try {
      const res = await axios.get(`${API_BASE}/appointments?limit=10`, { headers: getAdminHeaders() });
      const appointments = res.data.data || res.data.appointments || res.data || [];
      if (appointments.length > 0) {
        appointmentId = appointments[0].id;
        console.log(`  ✅ Using existing appointment: ${appointmentId}`);
        return appointments[0];
      }
    } catch (e) {
      console.log('  ⚠️ Could not get existing appointments');
    }
    return null;
  }
}

async function getMedicines() {
  try {
    const res = await axios.get(`${API_BASE}/pharmacy/medicines?limit=100`, { headers: getDoctorHeaders() });
    return res.data.medicines || res.data.data || res.data || [];
  } catch (error) {
    console.error('Error fetching medicines:', error.response?.data?.message || error.message);
    return [];
  }
}

async function createPrescription(medicines) {
  console.log('\n💊 Creating Prescription...');
  
  if (!patientId) {
    console.log('  ⚠️ Need patient ID to create prescription');
    return null;
  }
  
  if (medicines.length < 3) {
    console.log('  ⚠️ Need at least 3 medicines to create prescription');
    return null;
  }
  
  try {
    const prescriptionData = {
      patientId,
      appointmentId: appointmentId || undefined,
      diagnosis: 'Hypertension with mild fever and allergic rhinitis',
      notes: 'Patient advised to take rest and drink plenty of fluids. Follow up in 1 week.',
      items: [
        {
          medicineId: medicines[0]?.id,
          medicineName: medicines[0]?.name,
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
          quantity: 10,
          instructions: 'Take after meals'
        },
        {
          medicineId: medicines[3]?.id,
          medicineName: medicines[3]?.name,
          dosage: '5mg',
          frequency: 'Once daily',
          duration: '30 days',
          quantity: 30,
          instructions: 'Take in the morning'
        },
        {
          medicineId: medicines[5]?.id,
          medicineName: medicines[5]?.name,
          dosage: '10mg',
          frequency: 'Once daily at bedtime',
          duration: '7 days',
          quantity: 7,
          instructions: 'Take before sleep'
        }
      ],
      status: 'pending' // pending means sent to pharmacy
    };
    
    const res = await axios.post(`${API_BASE}/prescriptions`, prescriptionData, { headers: getDoctorHeaders() });
    console.log(`  ✅ Created prescription with ${prescriptionData.items.length} medicines`);
    return res.data.data || res.data.prescription || res.data;
  } catch (error) {
    console.error('  ❌ Failed to create prescription:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('     Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    return null;
  }
}

async function createAdditionalPrescriptions(medicines) {
  console.log('\n💊 Creating Additional Prescriptions...');
  
  const prescriptions = [
    {
      diagnosis: 'Type 2 Diabetes Mellitus',
      notes: 'Blood sugar levels elevated. Advised dietary modifications.',
      items: [
        {
          medicineId: medicines[2]?.id,
          medicineName: medicines[2]?.name,
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '30 days',
          quantity: 60,
          instructions: 'Take with meals'
        }
      ]
    },
    {
      diagnosis: 'Acute bronchitis with bacterial infection',
      notes: 'Prescribed antibiotics. Complete the full course.',
      items: [
        {
          medicineId: medicines[1]?.id,
          medicineName: medicines[1]?.name,
          dosage: '250mg',
          frequency: 'Three times daily',
          duration: '7 days',
          quantity: 21,
          instructions: 'Take 1 hour before meals'
        },
        {
          medicineId: medicines[8]?.id,
          medicineName: medicines[8]?.name,
          dosage: '2 puffs',
          frequency: 'As needed',
          duration: '14 days',
          quantity: 1,
          instructions: 'Use when experiencing breathing difficulty'
        }
      ]
    }
  ];
  
  let createdCount = 0;
  for (const rx of prescriptions) {
    try {
      const prescriptionData = {
        patientId,
        appointmentId: appointmentId || undefined,
        diagnosis: rx.diagnosis,
        notes: rx.notes,
        items: rx.items.filter(item => item.medicineId),
        status: 'pending'
      };
      
      if (prescriptionData.items.length === 0) continue;
      
      await axios.post(`${API_BASE}/prescriptions`, prescriptionData, { headers: getDoctorHeaders() });
      createdCount++;
      console.log(`  ✅ Created prescription for: ${rx.diagnosis}`);
    } catch (error) {
      console.error(`  ❌ Failed to create prescription for ${rx.diagnosis}:`, error.response?.data?.message || error.message);
    }
  }
  
  return createdCount;
}

async function main() {
  console.log('🚀 Starting Prescription Flow Data Creation...\n');
  console.log('=' .repeat(50));
  
  // Login as both admin and doctor
  const adminLoggedIn = await loginAsAdmin();
  const doctorLoggedIn = await loginAsDoctor();
  
  if (!adminLoggedIn || !doctorLoggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Get or create patient
  const patient = await getOrCreatePatient();
  
  // Create appointment
  const appointment = await createAppointment();
  
  // Get medicines
  const medicines = await getMedicines();
  console.log(`\n📦 Found ${medicines.length} medicines in inventory`);
  
  if (medicines.length === 0) {
    console.log('\n⚠️ No medicines found. Please add medicines first.');
    return;
  }
  
  // Create prescriptions
  const prescription = await createPrescription(medicines);
  const additionalCount = await createAdditionalPrescriptions(medicines);
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ PRESCRIPTION FLOW DATA CREATION COMPLETE!\n');
  
  console.log('📊 Summary:');
  console.log(`   - Patient: ${patient ? 'Ready' : 'Not created'}`);
  console.log(`   - Appointment: ${appointment ? 'Created' : 'Not created'}`);
  console.log(`   - Prescriptions created: ${(prescription ? 1 : 0) + additionalCount}`);
  
  console.log('\n🔗 Flow to test:');
  console.log('   1. Doctor login → View patients → Create prescription');
  console.log('   2. Pharmacist login → View pending prescriptions');
  console.log('   3. Pharmacist dispenses medicines → Updates stock');
  
  console.log('\n📋 Credentials:');
  console.log('   Doctor: dhilipwind+200@gmail.com / 0fw20ysdx2giA1!');
  console.log('   Pharmacist: dhilipwind+203@gmail.com / 45eqg1khs9sA1!');
}

main().catch(console.error);
