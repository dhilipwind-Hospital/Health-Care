import { test, expect } from '@playwright/test';

/**
 * Multi-Location Management Test
 * 
 * Verifies that an Organization Admin can successfully create 
 * and manage multiple hospital locations/branches.
 */

test.describe('Multi-Location Management', () => {

    test('should create multiple locations successfully', async ({ page }) => {
        // 1. Login as Admin
        await page.goto('http://localhost:3000/login');
        await page.fill('input[id="email"]', 'admin@ayphen.com');
        await page.fill('input[id="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await expect(page).toHaveURL('http://localhost:3000/');
        console.log('✅ Logged in successfully');

        // 2. Navigate to Locations Management
        // Click on Administration -> Locations (matching SaaSLayout structure)
        await page.click('text=Settings'); // Or 'Administration' depending on sidebar state
        await page.click('text=Locations');

        await expect(page).toHaveURL(/.*locations/);
        console.log('✅ Navigated to Locations Management');

        // 3. Create First Location (Kishanganj)
        await page.click('button:has-text("Add Location")');

        await page.fill('input[id="name"]', 'Kishanganj Medical Center');
        await page.fill('input[id="code"]', 'KISH01');
        await page.fill('textarea[id="address"]', '123 NH-31, Kishanganj, Bihar');
        await page.fill('input[id="city"]', 'Kishanganj');
        await page.fill('input[id="state"]', 'Bihar');
        await page.fill('input[id="phone"]', '+91 6456123456');

        await page.click('button:has-text("Create")');

        // Verify Toast Message
        await expect(page.locator('text=Location created successfully')).toBeVisible();
        console.log('✅ First location created');

        // 4. Create Second Location (Purnia)
        await page.click('button:has-text("Add Location")');

        await page.fill('input[id="name"]', 'Purnia Branch');
        await page.fill('input[id="code"]', 'PURN02');
        await page.fill('textarea[id="address"]', 'Line Bazar, Purnia, Bihar');
        await page.fill('input[id="city"]', 'Purnia');
        await page.fill('input[id="state"]', 'Bihar');

        await page.click('button:has-text("Create")');

        await expect(page.locator('text=Location created successfully')).toBeVisible();
        console.log('✅ Second location created');

        // 5. Final Verification in Table
        await expect(page.locator('text=Kishanganj Medical Center')).toBeVisible();
        await expect(page.locator('text=Purnia Branch')).toBeVisible();

        // Check if codes are present
        await expect(page.locator('text=KISH01')).toBeVisible();
        await expect(page.locator('text=PURN02')).toBeVisible();

        console.log('✨ SUCCESS: Multiple locations verified successfully!');
    });
});
