# Vendor & Admin Flow Testing Guide

## Overview
This document describes the complete testing process for the vendor registration, approval, and product listing flow with Shopify integration.

## Prerequisites
1. Supabase project with database schema set up
2. Shopify store with Admin API access
3. Environment variables configured in `.env.local`

## Complete Flow Testing Steps

### 1. Vendor Registration Flow

**Step 1.1: Register as Vendor**
- Navigate to `/auth/register`
- Fill in all required fields:
  - Email: `vendor@test.com`
  - Password: `password123`
  - Business Name: `Test Vendor Co.`
  - Contact Name: `John Doe`
  - Phone: `+91 98765 43210`
  - GST Number: `22AAAAA0000A1Z5`
  - Address details
- Submit registration

**Expected Result:**
- Redirected to `/auth/register-success`
- Vendor record created in database with `status: 'pending'`
- Email verification sent (if configured)

**Verification Query:**
```sql
SELECT id, business_name, contact_name, email, status, created_at 
FROM vendors 
WHERE email = 'vendor@test.com';
```

### 2. Admin Vendor Approval Flow

**Step 2.1: Login as Admin**
- Navigate to `/auth/admin-login`
- Login with admin credentials

**Step 2.2: View Pending Vendors**
- Navigate to `/admin/vendors`
- Should see the registered vendor in "Pending" tab

**Step 2.3: Approve Vendor**
- Click "Approve" button for the pending vendor
- Confirm approval

**Expected Result:**
- Vendor status changes to `approved`
- Vendor receives notification (if email configured)
- Vendor can now access vendor dashboard

**Verification Query:**
```sql
SELECT id, business_name, status, updated_at 
FROM vendors 
WHERE email = 'vendor@test.com';
```

### 3. Vendor Product Creation Flow

**Step 3.1: Login as Approved Vendor**
- Navigate to `/auth/login`
- Login with vendor credentials

**Step 3.2: Access Vendor Dashboard**
- Should be redirected to `/vendor` (not `/vendor/products` yet)
- Dashboard shows "Account Pending Approval" message if not approved

**Step 3.3: Create Product (After Approval)**
- Once approved, navigate to `/vendor/products/new`
- Fill in product details:
  - Title: `Test Product`
  - Description: `This is a test product`
  - Price: `999.99`
  - Compare at Price: `1299.99`
  - SKU: `TEST-001`
  - Inventory: `50`
  - Category: `Electronics`
  - Tags: `test, electronics`
  - Weight: `1.5 kg`
  - Images: `[image URLs]`

**Step 3.4: Save as Draft vs Submit for Review**
- Option 1: Save as Draft (status remains `draft`)
- Option 2: Submit for Review (status becomes `pending`)

**Expected Result:**
- Product created in database
- Status reflects save/submit action
- Appears in vendor's product list

**Verification Query:**
```sql
SELECT id, title, status, vendor_id, created_at 
FROM products 
WHERE vendor_id = (SELECT id FROM vendors WHERE email = 'vendor@test.com');
```

### 4. Admin Product Approval Flow

**Step 4.1: View Pending Products**
- As admin, navigate to `/admin/products`
- Should see pending products in "Pending" tab

**Step 4.2: Approve Product**
- Click "Approve & Push to Shopify" button
- System attempts to push to Shopify

**Expected Results:**
1. **Success Case:**
   - Product status changes to `published`
   - `shopify_product_id` and `shopify_variant_id` populated
   - Product appears in Shopify admin

2. **Failure Case:**
   - Product status changes to `approved`
   - Admin notes show Shopify error
   - Can retry later

**Verification Queries:**
```sql
-- Check product status and Shopify IDs
SELECT id, title, status, shopify_product_id, shopify_variant_id, admin_notes
FROM products 
WHERE id = '[product-id]';

-- Check all published products
SELECT COUNT(*) as published_count
FROM products 
WHERE status = 'published';
```

### 5. Shopify Integration Verification

**Step 5.1: Check Shopify Admin**
- Login to Shopify admin panel
- Navigate to Products section
- Verify the approved product appears
- Check product details match what was submitted

**Step 5.2: Verify Product Data**
- Title, description, prices should match
- SKU and inventory should be correct
- Images should be uploaded
- Categories/tags should be applied

### 6. End-to-End Success Scenario

**Complete Flow Test:**
1. ✅ Vendor registers successfully
2. ✅ Admin approves vendor account
3. ✅ Vendor creates product and submits for review
4. ✅ Admin approves product
5. ✅ Product appears in Shopify store
6. ✅ All statuses updated correctly in database

## Troubleshooting Common Issues

### Issue 1: Vendor can't see products for approval
**Solution:**
- Verify RPC functions exist: `admin_get_products()`
- Check database permissions
- Ensure admin user has correct role metadata

### Issue 2: Product not appearing on Shopify
**Possible Causes:**
- Invalid Shopify credentials in `.env.local`
- Network connectivity issues
- Shopify API rate limits
- Invalid product data format

**Debug Steps:**
1. Check server logs for Shopify API errors
2. Verify environment variables:
   ```
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_access_token
   ```
3. Test Shopify API connectivity manually

### Issue 3: Database functions not working
**Solution:**
- Run `scripts/005_complete_setup.sql` in Supabase SQL editor
- Verify functions exist:
  ```sql
  SELECT proname FROM pg_proc WHERE proname LIKE 'admin_%' OR proname LIKE 'get_my_%';
  ```

## Automated Testing Commands

While there's no automated test framework yet, you can manually verify:

```bash
# 1. Check database setup
psql -d your_database -c "SELECT proname FROM pg_proc WHERE proname LIKE 'admin_%';"

# 2. Check environment variables
echo $NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
echo $SHOPIFY_ACCESS_TOKEN

# 3. Run development server
npm run dev

# 4. Check logs for errors
# Look for Shopify API calls and database queries
```

## Manual Test Checklist

- [ ] Vendor registration works
- [ ] Vendor appears in admin pending list
- [ ] Admin can approve vendor
- [ ] Approved vendor can login
- [ ] Vendor can create products
- [ ] Products appear in admin pending list
- [ ] Admin can approve products
- [ ] Products appear in Shopify
- [ ] All status transitions work correctly
- [ ] Error handling works for failed Shopify pushes

## Next Steps

1. Run through the complete manual test flow above
2. Verify all steps work as expected
3. Check database for correct status transitions
4. Confirm Shopify integration is working
5. Document any issues found and their resolutions
