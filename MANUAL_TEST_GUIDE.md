# MANUAL PRODUCT SUBMISSION FLOW TEST

## 🎯 Objective
Test if multiple images are properly sent for approval by creating a product through the UI and tracing the complete flow.

## 📋 Prerequisites
1. Development server should be running (`npm run dev`)
2. You should have admin access or vendor access
3. Supabase database should be accessible

## 🔧 STEP-BY-STEP TESTING

### Step 1: Prepare Test Data
Create 3 test images using Unsplash URLs:
```
Image 1: https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format
Image 2: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format  
Image 3: https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format
```

### Step 2: Login as Vendor
1. Go to `http://localhost:3000/auth/login`
2. Login with vendor credentials
3. Make sure vendor account is APPROVED

### Step 3: Create Product with Multiple Images
1. Navigate to `http://localhost:3000/vendor/products/new`
2. Fill in basic product information:
   - Title: "Multi-Image Test Product"
   - Description: "Testing multiple image upload flow"
   - Price: "99.99"
   - Category: "Electronics"
   - Tags: "test,multiple,images"

3. **Upload Multiple Images**:
   - Scroll to the "Images" section
   - Use the bulk image uploader
   - Add ALL 3 test images from above URLs
   - Wait for all images to upload successfully
   - You should see 3 image previews

4. **Submit for Review** (NOT "Save as Draft"):
   - Click "Submit for Review" button
   - This triggers the `submit_product_for_review` RPC function

### Step 4: Monitor Database Storage
Check what gets stored in the database:

```sql
-- Run this query in Supabase SQL editor after submission
SELECT 
    id,
    title,
    status,
    images,
    created_at
FROM products 
WHERE title = 'Multi-Image Test Product'
ORDER BY created_at DESC
LIMIT 1;
```

Expected result: `images` column should contain array with 3 URLs

### Step 5: Admin Approval Process
1. Login as admin
2. Go to `http://localhost:3000/admin/products`
3. Find your test product in "Pending" tab
4. Click "Approve & Push to Shopify"
5. **Monitor Server Logs** for DEBUG output:
   ```
   🔍 DEBUG: imageNodes array:
   🔍 DEBUG: Returning uploaded_image_urls:
   🔍 DEBUG: Checking uploaded_image_urls:
   ✅ DEBUG: Updating database with X image URLs
   ```

### Step 6: Final Database Verification
After approval, check the database again:

```sql
-- Check final state after approval
SELECT 
    id,
    title,
    status,
    images,
    shopify_product_id,
    updated_at
FROM products 
WHERE title = 'Multi-Image Test Product'
ORDER BY updated_at DESC
LIMIT 1;
```

Expected result: 
- `status` should be "published" 
- `images` should contain clean Shopify CDN URLs (not staging URLs)
- `shopify_product_id` should be populated

## 📊 What to Look For

### ✅ SUCCESS INDICATORS:
- Product form shows 3 image previews before submission
- Database `images` column shows array with 3 URLs after submission
- Server logs show processing of 3 images during approval
- Final database shows clean CDN URLs (no staging/blob URLs)
- Shopify product created with all 3 images

### 🔴 FAILURE INDICATORS:
- Only 1 image stored in database
- Mixed URL types (staging + blob + CDN)
- Server logs show only 1 image being processed
- Approval fails or only processes first image

## 🐛 Common Issues to Watch For

1. **Frontend Truncation**: Bulk uploader only sending first URL
2. **Backend Filtering**: RPC function filtering out URLs
3. **Database Overwrite**: Approval process overwriting with partial data
4. **URL Validation**: Invalid URLs being filtered out prematurely

## 📝 Documentation During Test

Please note down:
1. Number of images shown in product form before submission
2. Database `images` array content after submission
3. Server log DEBUG output during approval
4. Final database state after approval
5. Any error messages encountered

This will help us pinpoint exactly where in the flow the issue occurs.