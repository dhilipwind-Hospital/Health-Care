# Currency Standardization - INR (₹) Only

## Current Issues Found

The application currently uses mixed currency symbols:
- **Dollar ($)** in billing, pharmacy, and some dashboards
- **USD** in subscription management and super admin
- **₹ (Rupee)** in some billing components

## Standardization Plan

All currency across the application will use **Indian Rupee (₹)** symbol.

---

## Files to Update

### Frontend - Billing Module
1. **`/frontend/src/pages/billing/BillingManagement.tsx`**
   - Line 337-338: Change `$${price}` to `₹${price}`
   - Line 686: Change `DollarOutlined` to rupee icon or keep with ₹ prefix

2. **`/frontend/src/pages/billing/BillingQueue.tsx`**
   - Already using ₹ - ✅ Correct

3. **`/frontend/src/pages/billing/BillingEnhanced.tsx`**
   - Review and update all currency displays

### Frontend - Pharmacy Module
4. **`/frontend/src/pages/pharmacy/MedicineList.tsx`**
   - Line 141-142: Change `$${Number(...)}` to `₹${Number(...)}`

5. **`/frontend/src/pages/pharmacy/InventoryEnhanced.tsx`**
   - Line 1045-1046: Change `$${viewMedicine...}` to `₹${viewMedicine...}`

6. **`/frontend/src/pages/pharmacy/PurchaseOrders.tsx`**
   - Line 405: Change `$${Number(...)}` to `₹${Number(...)}`

### Frontend - Dashboard
7. **`/frontend/src/pages/Dashboard.tsx`**
   - Line 483: Change `suffix="USD"` to `suffix="INR"` or remove
   - Line 480: Keep `DollarOutlined` or replace with custom rupee icon

8. **`/frontend/src/pages/SuperAdminDashboard.tsx`**
   - Line 164: Change `currency: 'USD'` to `currency: 'INR'`
   - Line 329: Change `currency: 'USD'` to `currency: 'INR'`
   - Line 332: Replace `DollarOutlined` with rupee representation

### Frontend - SaaS Module
9. **`/frontend/src/pages/saas/OrganizationsManagement.tsx`**
   - Line 314: Change `suffix="USD"` to `suffix="INR"`
   - Line 313: Keep or replace `DollarOutlined`

10. **`/frontend/src/pages/saas/SubscriptionManagement.tsx`**
    - Line 412: Change `suffix="USD"` to `suffix="INR"`
    - Line 411: Keep or replace `DollarOutlined`

### Backend - Organization Routes
11. **`/backend/src/routes/organization.routes.ts`**
    - Line 95: Change `currency: 'USD'` to `currency: 'INR'`
    - Line 112: Change `currency: 'USD'` to `currency: 'INR'`
    - Line 135: Change `currency: 'USD'` to `currency: 'INR'`
    - Update all plan prices to INR (multiply by ~83 for conversion)

### Backend - Seed Scripts
12. **All seed scripts** (`seed-*.ts`)
    - Update any hardcoded prices to INR
    - Change currency references from USD to INR

---

## Implementation Strategy

### Phase 1: Frontend Display (Immediate)
- Replace all `$` with `₹` in render functions
- Change all `USD` to `INR` in suffix/labels
- Update `DollarOutlined` icon usage (keep icon, change context)

### Phase 2: Backend Data (Next)
- Update organization settings default currency
- Update subscription plan prices to INR
- Modify seed scripts for INR pricing

### Phase 3: Database (If needed)
- Add currency field to relevant tables
- Default to INR for all new records
- Migration script for existing data

---

## Standard Formatting

### Display Format
```typescript
// Correct format for INR
const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

// For large amounts with commas (Indian numbering)
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};
```

### Example Outputs
- Small: `₹450.00`
- Medium: `₹12,500.00`
- Large: `₹1,25,000.00` (Indian lakh system)

---

## Testing Checklist

- [ ] Billing invoices show ₹
- [ ] Pharmacy prices show ₹
- [ ] Dashboard revenue shows ₹
- [ ] Appointment fees show ₹
- [ ] Lab test prices show ₹
- [ ] Subscription plans show ₹
- [ ] All reports show ₹
- [ ] No $ or USD anywhere in UI

---

## Notes

- The `DollarOutlined` icon from Ant Design can still be used as a generic "money" icon
- Consider creating a custom `RupeeOutlined` icon component for better branding
- All backend APIs should accept/return amounts in INR
- Frontend should never do currency conversion

---

**Status**: In Progress
**Priority**: High
**Assigned**: Development Team
