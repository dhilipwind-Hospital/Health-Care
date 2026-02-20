const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Admin credentials
const ADMIN_EMAIL = 'dhilipwind+010@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';

let authToken = '';

async function login() {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    // Handle different token response formats
    authToken = res.data.accessToken || res.data.token || res.data.data?.token;
    console.log('✅ Logged in as Admin');
    console.log('   Token received:', authToken ? 'Yes' : 'No');
    if (res.data) {
      console.log('   Response keys:', Object.keys(res.data).join(', '));
    }
    return !!authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

// Sample Medicines Data
const medicines = [
  {
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brandName: 'Calpol',
    manufacturer: 'GSK Pharmaceuticals',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    strength: '500mg',
    unitPrice: 0.50,
    sellingPrice: 1.00,
    batchNumber: 'BATCH-2024-001',
    manufactureDate: '2024-01-15',
    expiryDate: '2026-01-15',
    currentStock: 500,
    reorderLevel: 100
  },
  {
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    manufacturer: 'Pfizer Inc',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    strength: '250mg',
    unitPrice: 1.20,
    sellingPrice: 2.50,
    batchNumber: 'BATCH-2024-002',
    manufactureDate: '2024-02-01',
    expiryDate: '2025-08-01',
    currentStock: 200,
    reorderLevel: 50
  },
  {
    name: 'Metformin 500mg',
    genericName: 'Metformin HCL',
    brandName: 'Glucophage',
    manufacturer: 'Merck & Co',
    category: 'Antidiabetic',
    dosageForm: 'Tablet',
    strength: '500mg',
    unitPrice: 0.80,
    sellingPrice: 1.50,
    batchNumber: 'BATCH-2024-003',
    manufactureDate: '2024-03-10',
    expiryDate: '2026-03-10',
    currentStock: 300,
    reorderLevel: 75
  },
  {
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    brandName: 'Norvasc',
    manufacturer: 'Pfizer Inc',
    category: 'Antihypertensive',
    dosageForm: 'Tablet',
    strength: '5mg',
    unitPrice: 0.60,
    sellingPrice: 1.20,
    batchNumber: 'BATCH-2024-004',
    manufactureDate: '2024-01-20',
    expiryDate: '2026-01-20',
    currentStock: 400,
    reorderLevel: 80
  },
  {
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    manufacturer: 'AstraZeneca',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    strength: '20mg',
    unitPrice: 1.00,
    sellingPrice: 2.00,
    batchNumber: 'BATCH-2024-005',
    manufactureDate: '2024-02-15',
    expiryDate: '2025-02-15',
    currentStock: 150,
    reorderLevel: 40
  },
  {
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine HCL',
    brandName: 'Zyrtec',
    manufacturer: 'Johnson & Johnson',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    strength: '10mg',
    unitPrice: 0.40,
    sellingPrice: 0.80,
    batchNumber: 'BATCH-2024-006',
    manufactureDate: '2024-04-01',
    expiryDate: '2026-04-01',
    currentStock: 600,
    reorderLevel: 100
  },
  {
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    manufacturer: 'Wyeth Pharmaceuticals',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    strength: '400mg',
    unitPrice: 0.70,
    sellingPrice: 1.40,
    batchNumber: 'BATCH-2024-007',
    manufactureDate: '2024-03-20',
    expiryDate: '2026-03-20',
    currentStock: 350,
    reorderLevel: 70
  },
  {
    name: 'Atorvastatin 10mg',
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    manufacturer: 'Pfizer Inc',
    category: 'Statin',
    dosageForm: 'Tablet',
    strength: '10mg',
    unitPrice: 1.50,
    sellingPrice: 3.00,
    batchNumber: 'BATCH-2024-008',
    manufactureDate: '2024-02-28',
    expiryDate: '2026-02-28',
    currentStock: 250,
    reorderLevel: 50
  },
  {
    name: 'Salbutamol Inhaler',
    genericName: 'Salbutamol',
    brandName: 'Ventolin',
    manufacturer: 'GSK Pharmaceuticals',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    strength: '100mcg/dose',
    unitPrice: 5.00,
    sellingPrice: 10.00,
    batchNumber: 'BATCH-2024-009',
    manufactureDate: '2024-01-10',
    expiryDate: '2025-07-10',
    currentStock: 80,
    reorderLevel: 20
  },
  {
    name: 'Vitamin D3 1000IU',
    genericName: 'Cholecalciferol',
    brandName: 'D-Rise',
    manufacturer: 'USV Limited',
    category: 'Vitamin',
    dosageForm: 'Tablet',
    strength: '1000IU',
    unitPrice: 0.30,
    sellingPrice: 0.60,
    batchNumber: 'BATCH-2024-010',
    manufactureDate: '2024-05-01',
    expiryDate: '2026-05-01',
    currentStock: 800,
    reorderLevel: 150
  }
];

// Sample Suppliers Data
const suppliers = [
  {
    name: 'MedSupply Distributors',
    contactPerson: 'John Smith',
    email: 'john@medsupply.com',
    phone: '+1-555-0101',
    address: '123 Pharma Street, Medical District, NY 10001',
    isActive: true
  },
  {
    name: 'PharmaCare Wholesale',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@pharmacare.com',
    phone: '+1-555-0102',
    address: '456 Health Avenue, Wellness City, CA 90210',
    isActive: true
  },
  {
    name: 'Global Meds Inc',
    contactPerson: 'Michael Brown',
    email: 'michael@globalmeds.com',
    phone: '+1-555-0103',
    address: '789 Medicine Road, Healthcare Town, TX 75001',
    isActive: true
  },
  {
    name: 'HealthFirst Supplies',
    contactPerson: 'Emily Davis',
    email: 'emily@healthfirst.com',
    phone: '+1-555-0104',
    address: '321 Wellness Blvd, Cure City, FL 33101',
    isActive: true
  }
];

async function addMedicines() {
  console.log('\n📦 Adding Medicines...');
  const addedMedicines = [];
  
  for (const medicine of medicines) {
    try {
      // Convert date strings to Date objects for validation
      const payload = {
        ...medicine,
        manufactureDate: new Date(medicine.manufactureDate),
        expiryDate: new Date(medicine.expiryDate)
      };
      const res = await axios.post(`${API_BASE}/pharmacy/medicines`, payload, { headers: getHeaders() });
      console.log(`  ✅ Added: ${medicine.name}`);
      addedMedicines.push(res.data.medicine || res.data);
    } catch (error) {
      console.error(`  ❌ Failed to add ${medicine.name}:`, error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        const firstError = error.response.data.errors[0];
        if (firstError?.constraints) {
          console.error('     Issue:', Object.values(firstError.constraints)[0]);
        }
      }
    }
  }
  
  return addedMedicines;
}

async function addSuppliers() {
  console.log('\n🏢 Adding Suppliers...');
  const addedSuppliers = [];
  
  for (const supplier of suppliers) {
    try {
      const res = await axios.post(`${API_BASE}/suppliers`, supplier, { headers: getHeaders() });
      console.log(`  ✅ Added: ${supplier.name}`);
      addedSuppliers.push(res.data.supplier || res.data);
    } catch (error) {
      console.error(`  ❌ Failed to add ${supplier.name}:`, error.response?.data?.message || error.message);
    }
  }
  
  return addedSuppliers;
}

async function generateAlerts() {
  console.log('\n🔔 Generating Stock Alerts...');
  try {
    const res = await axios.post(`${API_BASE}/inventory/alerts/generate`, {}, { headers: getHeaders() });
    console.log(`  ✅ Generated ${res.data.alertsCreated || 0} alerts`);
  } catch (error) {
    console.error('  ❌ Failed to generate alerts:', error.response?.data?.message || error.message);
  }
}

async function getMedicines() {
  try {
    const res = await axios.get(`${API_BASE}/pharmacy/medicines?limit=100`, { headers: getHeaders() });
    return res.data.medicines || res.data.data || res.data || [];
  } catch (error) {
    console.error('Error fetching medicines:', error.response?.data?.message || error.message);
    return [];
  }
}

async function getSuppliers() {
  try {
    const res = await axios.get(`${API_BASE}/suppliers`, { headers: getHeaders() });
    return res.data.data || res.data || [];
  } catch (error) {
    console.error('Error fetching suppliers:', error.response?.data?.message || error.message);
    return [];
  }
}

async function createPurchaseOrders(medicines, suppliers) {
  console.log('\n📋 Creating Purchase Orders...');
  
  if (medicines.length === 0 || suppliers.length === 0) {
    console.log('  ⚠️ Need medicines and suppliers to create purchase orders');
    return [];
  }
  
  const orders = [
    {
      supplierId: suppliers[0]?.id,
      items: [
        { medicineId: medicines[0]?.id, medicineName: medicines[0]?.name, quantity: 100, unitPrice: medicines[0]?.unitPrice || 0.50 },
        { medicineId: medicines[1]?.id, medicineName: medicines[1]?.name, quantity: 50, unitPrice: medicines[1]?.unitPrice || 1.20 }
      ],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Regular stock replenishment order'
    },
    {
      supplierId: suppliers[1]?.id,
      items: [
        { medicineId: medicines[2]?.id, medicineName: medicines[2]?.name, quantity: 75, unitPrice: medicines[2]?.unitPrice || 0.80 },
        { medicineId: medicines[3]?.id, medicineName: medicines[3]?.name, quantity: 100, unitPrice: medicines[3]?.unitPrice || 0.60 }
      ],
      expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Monthly diabetes and hypertension medication order'
    },
    {
      supplierId: suppliers[2]?.id,
      items: [
        { medicineId: medicines[4]?.id, medicineName: medicines[4]?.name, quantity: 60, unitPrice: medicines[4]?.unitPrice || 1.00 },
        { medicineId: medicines[5]?.id, medicineName: medicines[5]?.name, quantity: 200, unitPrice: medicines[5]?.unitPrice || 0.40 }
      ],
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Urgent order for GI and allergy medications'
    }
  ];
  
  const createdOrders = [];
  for (const order of orders) {
    // Filter out items with undefined medicineId
    order.items = order.items.filter(item => item.medicineId);
    if (order.items.length === 0 || !order.supplierId) continue;
    
    try {
      const res = await axios.post(`${API_BASE}/purchase-orders`, order, { headers: getHeaders() });
      console.log(`  ✅ Created order for supplier: ${suppliers.find(s => s.id === order.supplierId)?.name || 'Unknown'}`);
      createdOrders.push(res.data.data || res.data);
    } catch (error) {
      console.error(`  ❌ Failed to create order:`, error.response?.data?.message || error.message);
    }
  }
  
  return createdOrders;
}

async function recordStockMovements(medicines) {
  console.log('\n📊 Recording Stock Movements...');
  
  if (medicines.length === 0) {
    console.log('  ⚠️ Need medicines to record stock movements');
    return;
  }
  
  const movements = [
    { medicineId: medicines[0]?.id, movementType: 'purchase', quantity: 200, notes: 'Initial stock purchase', referenceNumber: 'PO-2024-001' },
    { medicineId: medicines[1]?.id, movementType: 'purchase', quantity: 100, notes: 'Restocking antibiotics', referenceNumber: 'PO-2024-002' },
    { medicineId: medicines[0]?.id, movementType: 'sale', quantity: 50, notes: 'Dispensed to patients', referenceNumber: 'RX-2024-001' },
    { medicineId: medicines[2]?.id, movementType: 'purchase', quantity: 150, notes: 'Diabetes medication restock', referenceNumber: 'PO-2024-003' },
    { medicineId: medicines[3]?.id, movementType: 'sale', quantity: 30, notes: 'Dispensed for hypertension', referenceNumber: 'RX-2024-002' },
    { medicineId: medicines[4]?.id, movementType: 'adjustment', quantity: 145, notes: 'Inventory count adjustment', referenceNumber: 'ADJ-2024-001' },
    { medicineId: medicines[5]?.id, movementType: 'purchase', quantity: 300, notes: 'Bulk antihistamine order', referenceNumber: 'PO-2024-004' },
    { medicineId: medicines[6]?.id, movementType: 'sale', quantity: 25, notes: 'Pain medication dispensed', referenceNumber: 'RX-2024-003' }
  ];
  
  let successCount = 0;
  for (const movement of movements) {
    if (!movement.medicineId) continue;
    
    try {
      await axios.post(`${API_BASE}/inventory/movements`, movement, { headers: getHeaders() });
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to record movement:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`  ✅ Recorded ${successCount} stock movements`);
}

async function main() {
  console.log('🚀 Starting Sample Data Creation...\n');
  console.log('=' .repeat(50));
  
  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Add medicines
  const addedMedicines = await addMedicines();
  
  // Add suppliers
  const addedSuppliers = await addSuppliers();
  
  // Get existing medicines and suppliers from DB
  const existingMedicines = await getMedicines();
  const existingSuppliers = await getSuppliers();
  
  // Create purchase orders
  const createdOrders = await createPurchaseOrders(existingMedicines, existingSuppliers);
  
  // Record stock movements
  await recordStockMovements(existingMedicines);
  
  // Generate alerts
  await generateAlerts();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ SAMPLE DATA CREATION COMPLETE!\n');
  
  console.log('📊 Summary:');
  console.log(`   - Medicines added: ${addedMedicines.length}`);
  console.log(`   - Suppliers added: ${addedSuppliers.length}`);
  console.log(`   - Purchase Orders created: ${createdOrders.length}`);
  console.log(`   - Stock Movements recorded: 8`);
  
  console.log('📊 Summary:');
  console.log(`   - Medicines added: ${addedMedicines.length}`);
  console.log(`   - Suppliers added: ${addedSuppliers.length}`);
  
  console.log('\n📋 Medicines Added:');
  medicines.forEach((m, i) => {
    console.log(`   ${i+1}. ${m.name} (${m.category}) - Stock: ${m.currentStock}`);
  });
  
  console.log('\n🏢 Suppliers Added:');
  suppliers.forEach((s, i) => {
    console.log(`   ${i+1}. ${s.name} - Contact: ${s.contactPerson}`);
  });
  
  console.log('\n🔗 You can now:');
  console.log('   1. Login as Admin to view/manage all data');
  console.log('   2. Login as Pharmacist to see the medicines');
  console.log('   3. Create Purchase Orders using the suppliers');
  console.log('   4. View Inventory Reports (Expiry, Reorder, Stock Movements)');
}

main().catch(console.error);
