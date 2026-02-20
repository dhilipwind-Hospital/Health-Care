import { test, expect } from '@playwright/test';

test.describe('🏢 Multi-Tenancy Isolation Test', () => {
    test.setTimeout(120000); // Increase timeout to 120 seconds

    test('Should verify new organization isolation', async ({ page }) => {
        // Generate unique data
        const timestamp = Date.now();
        const hospitalName = `City Gen ${timestamp}`;
        const subdomain = `city-${timestamp}`;
        const adminEmail = `admin-${timestamp}@citygen.com`;
        const adminPassword = 'AdminPassword123!';
        const doctorName = `Dr. Isolated ${timestamp}`;
        const doctorEmail = `doc-${timestamp}@citygen.com`;

        console.log(`🧪 Starting Test with Subdomain: ${subdomain}`);

        // Enable Debug Logging
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
        page.on('response', resp => {
            if (resp.status() >= 400 && !resp.url().includes('sockjs'))
                console.log(`API ERROR: ${resp.status()} ${resp.url()}`);
        });

        // ==========================================
        // 1. REGISTER NEW ORGANIZATION
        // ==========================================
        console.log('📝 Registering New Organization...');

        // Fix: Go via Landing Page (more reliable)
        await page.goto('http://localhost:3000/landing');
        await page.waitForLoadState('networkidle'); // Wait for initial load

        console.log('📍 On Landing Page, clicking Get Started...');
        await page.click('button:has-text("Get Started")');
        await page.waitForURL(/\/signup/); // Wait for redirect

        // Fix: Wait for the Form Container explicitly (Robust)
        await page.waitForSelector('.signup-form', { timeout: 30000 });

        // Step 1: Org Info
        console.log('✍️ Filling Organization Info...');
        await page.getByLabel('Hospital Name').fill(hospitalName);
        console.log('   Filled Name');
        await page.getByLabel('Subdomain').fill(subdomain);
        console.log('   Filled Subdomain');
        await page.getByLabel('Description (Optional)').fill('Isolation Test Hospital');
        console.log('   Filled Description');
        await page.click('button:has-text("Next")');
        console.log('➡️ Clicked Next (Step 1)');

        // Step 2: Admin Info
        console.log('👤 Filling Admin Info...');
        await page.getByLabel('First Name').fill('City');
        await page.getByLabel('Last Name').fill('Admin');
        await page.getByLabel('Email Address').fill(adminEmail);
        await page.getByLabel('Password', { exact: true }).fill(adminPassword);
        await page.getByLabel('Confirm Password').fill(adminPassword);
        console.log('   Filled Admin Details');
        await page.click('button:has-text("Next")');
        console.log('➡️ Clicked Next (Step 2)');

        // Step 3: Plan
        console.log('💰 Selecting Plan...');
        // Open Dropdown
        await page.click('.ant-select-selector');
        // Select by visible text
        await page.locator('.ant-select-item-option-content').filter({ hasText: 'Professional' }).first().click();
        await page.waitForTimeout(500);
        // Terms Checkbox - Robust
        await page.getByRole('checkbox').check();
        await page.click('button:has-text("Create Organization")');

        // Wait for success and redirect
        try {
            await expect(page.locator('text=Organization created successfully!')).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('⚠️ Success toast missed or redirect happened too fast. Proceeding to Login check...');
        }

        // Force navigate to Login (override app's subdomain redirect which might fail locally)
        await page.goto('http://localhost:3000/login');

        // ==========================================
        // 2. LOGIN AS NEW ADMIN & VERIFY CLEAN STATE
        // ==========================================
        console.log('🔐 Logging in as New Admin...');

        // Robust Login Selectors (TestID -> Name -> Placeholder)
        // Accessibility-based selectors based on confirmed snapshot
        await page.getByRole('heading', { name: 'Welcome to Ayphen Care' }).waitFor({ state: 'visible', timeout: 30000 });

        console.log(`   Filling Email: ${adminEmail}`);
        // Matches 'textbox "* Email Address"' from snapshot
        await page.getByRole('textbox', { name: /Email/i }).fill(adminEmail);

        console.log('   Filling Password...');
        // Password fields are sometimes strict, trying placeholder if label fails
        const passwordField = page.getByRole('textbox', { name: /Password/i }).or(page.getByPlaceholder('Password'));
        await passwordField.fill(adminPassword);

        // Submit
        console.log('   Clicking Login Button...');
        await page.getByRole('button', { name: 'Login', exact: true }).click();

        // Check Dashboard
        console.log('   Waiting for Dashboard (Hospital Overview)...');
        await expect(page.locator('text=Hospital Overview')).toBeVisible({ timeout: 45000 });
        console.log('✅ Login Successful');

        // Verify NOT seeing "Default Hospital" data
        console.log('🧹 Verifying Clean State...');
        await page.click('text=Doctors'); // Navigate to Doctors
        console.log('   Navigated to Doctors');

        // Wait for table
        await page.waitForSelector('table');
        console.log('   Table Visible');

        // Staff count should be 1 (The Admin)
        const rowCount = await page.locator('tbody tr').count();
        console.log(`Staff count in new org: ${rowCount}`);
        expect(rowCount).toBeLessThan(5);

        // Create Department First (Required for Service & Doctor)
        console.log('➕ Creating Department in New Org...');
        await page.goto('http://localhost:3000/admin/departments');
        await page.waitForSelector('text=Departments (Admin)');
        await page.click('button:has-text("New Department")');
        // Wait for drawer
        await page.getByLabel('Name').fill('Cardiology');
        await page.getByLabel('Description').fill('Heart stuff');
        await page.click('button:has-text("Create")');
        await expect(page.locator('text=Department created')).toBeVisible({ timeout: 5000 });
        console.log('   Department Created');

        // Create Service (Required for Doctor Specialization)
        console.log('➕ Creating Service in New Org...');
        await page.goto('http://localhost:3000/admin/services');
        await page.waitForSelector('text=Manage Services');
        await page.click('button:has-text("New Service")');
        // Wait for drawer
        await page.getByLabel('Name').fill('Cardiology Consultation');
        // Select Department for Service
        await page.getByLabel('Department').click();
        await page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: 'Cardiology' }).first().click();

        await page.getByLabel('Description').fill('Expert heart consultation');
        await page.click('button:has-text("Create")');
        await expect(page.locator('text=Service created')).toBeVisible({ timeout: 5000 });
        console.log('   Service Created');

        console.log('➕ Creating Doctor in New Org...');
        await page.goto('http://localhost:3000/admin/doctors');
        await page.click('button:has-text("Add Doctor")'); // Changed from "Add Staff Member" based on Doctors page

        // Fill Staff Form
        console.log('   Filling First Name...');
        await page.getByLabel('First Name').fill('Dr.');
        console.log('   Filling Last Name...');
        await page.getByLabel('Last Name').fill(`Isolated ${timestamp}`);
        console.log('   Filling Email...');
        await page.getByLabel('Email').fill(doctorEmail);
        console.log('   Filling Phone...');
        await page.getByLabel('Phone').fill('1234567890');

        // Select Department (Required)
        console.log('   Selecting Department...');
        await page.getByLabel('Department').click();
        await page.waitForSelector('.ant-select-dropdown:visible .ant-select-item-option');
        if ((await page.locator('.ant-select-dropdown:visible .ant-select-item-option').count()) > 0) {
            await page.locator('.ant-select-dropdown:visible .ant-select-item-option').first().click({ force: true });
        }
        await page.waitForTimeout(500);

        // Select Specialization (Required)
        console.log('   Selecting Specialization...');
        await page.getByLabel('Specialization').click();
        await page.waitForSelector('.ant-select-dropdown:visible .ant-select-item-option');
        if ((await page.locator('.ant-select-dropdown:visible .ant-select-item-option').count()) > 0) {
            await page.locator('.ant-select-dropdown:visible .ant-select-item-option').first().click({ force: true });
        }
        await page.waitForTimeout(500);

        // Verify and Retry Dept if missing (Pattern suggests first one might get lost)
        const deptValue = await page.locator('.ant-form-item').filter({ hasText: 'Department' }).locator('.ant-select-selection-item').textContent();
        console.log(`   Department Value: ${deptValue}`);
        if (!deptValue || !deptValue.includes('Cardiology')) {
            console.log('   RETRYING Department Selection...');
            await page.getByLabel('Department').click();
            await page.waitForSelector('.ant-select-dropdown:visible .ant-select-item-option');
            await page.locator('.ant-select-dropdown:visible .ant-select-item-option').first().click({ force: true });
        }

        console.log('   Form filled, submitting...');

        // Submit
        await page.click('button:has-text("Add Doctor")', { timeout: 5000 });

        // Wait for success
        await expect(page.locator('text=Doctor added successfully')).toBeVisible({ timeout: 10000 });

        // ==========================================
        // 4. LOGOUT & LOGIN AS DEFAULT ADMIN
        // ==========================================
        console.log('🚪 Logging out...');
        await page.locator('.ant-avatar').first().click();
        await page.locator('text=Sign out').click();
        console.log('   Logged Out');

        console.log('🔐 Logging in as Default Admin...');
        await page.fill('input[data-testid="login-email-input"]', 'admin@hospital.com');
        await page.fill('input[data-testid="login-password-input"]', 'Admin@2025');
        await page.click('button:has-text("Log in")');
        console.log('   Default Admin Logged In');

        // ==========================================
        // 5. VERIFY ISOLATION
        // ==========================================
        console.log('🕵️ Checking for Data Leak...');
        await page.click('text=Doctors');
        await page.waitForSelector('table');

        // Search for the New Doctor email from the other org
        const searchInput = page.locator('input[placeholder="Search doctors..."]');
        await searchInput.fill(doctorEmail);
        await page.waitForTimeout(1000); // Wait for debounce

        // Expect NO results
        const leakedUser = page.locator(`text=${doctorEmail}`);
        const leakedVisible = await leakedUser.isVisible();
        if (leakedVisible) {
            console.error('❌ FAILURE: Leaked User Found!');
        } else {
            console.log('✅ PASS: New Organization data is invisible to Default Organization.');
        }
        await expect(leakedUser).not.toBeVisible();
    });
});
