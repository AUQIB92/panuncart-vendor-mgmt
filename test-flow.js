/**
 * Manual Test Script for Vendor/Admin Flow
 * Run this script to verify the complete workflow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const TEST_VENDOR = {
  email: 'test-vendor-' + Date.now() + '@example.com',
  password: 'password123',
  business_name: 'Test Vendor Business',
  contact_name: 'Test Vendor',
  phone: '+91 98765 43210',
  gst_number: '22AAAAA0000A1Z5',
  business_address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  pincode: '110001',
  description: 'Test vendor for flow verification'
};

const TEST_PRODUCT = {
  title: 'Test Product ' + Date.now(),
  description: 'This is a test product for integration testing',
  price: 999.99,
  compare_at_price: 1299.99,
  sku: 'TEST-' + Date.now(),
  barcode: '1234567890123',
  inventory_quantity: 50,
  category: 'Electronics',
  tags: ['test', 'electronics', 'gadget'],
  weight: 1.5,
  weight_unit: 'kg',
  images: ['https://example.com/image1.jpg']
};

async function runTests() {
  console.log('🧪 Starting Vendor/Admin Flow Tests...\n');

  try {
    // Test 1: Check if required RPC functions exist
    console.log('1️⃣ Checking RPC functions...');
    const { data: functions, error: funcError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN (
          'admin_get_vendors',
          'admin_get_products',
          'admin_update_vendor_status',
          'admin_update_product_status',
          'get_my_vendor',
          'get_my_products',
          'submit_product_for_review'
        )
        ORDER BY proname;
      `
    });

    if (funcError) {
      console.log('   ⚠️  Could not verify functions (may need to run scripts/005_complete_setup.sql)');
    } else {
      const functionNames = functions.map(f => f.proname);
      const requiredFunctions = [
        'admin_get_vendors',
        'admin_get_products',
        'admin_update_vendor_status',
        'admin_update_product_status',
        'get_my_vendor',
        'get_my_products',
        'submit_product_for_review'
      ];
      
      const missing = requiredFunctions.filter(f => !functionNames.includes(f));
      if (missing.length > 0) {
        console.log(`   ❌ Missing functions: ${missing.join(', ')}`);
        console.log('   💡 Run scripts/005_complete_setup.sql in your Supabase SQL editor');
        return;
      } else {
        console.log('   ✅ All required RPC functions exist');
      }
    }

    // Test 2: Check Shopify configuration
    console.log('\n2️⃣ Checking Shopify configuration...');
    const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopifyDomain || !shopifyToken) {
      console.log('   ❌ Shopify credentials missing in .env.local');
      console.log('   Required variables:');
      console.log('   - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');
      console.log('   - SHOPIFY_ACCESS_TOKEN');
      return;
    } else {
      console.log('   ✅ Shopify credentials configured');
      console.log(`   🏪 Store: ${shopifyDomain}`);
    }

    // Test 3: Database connectivity
    console.log('\n3️⃣ Testing database connectivity...');
    const { data, error } = await supabase.from('vendors').select('count', { count: 'exact' });
    if (error) {
      console.log('   ❌ Database connection failed:', error.message);
      return;
    } else {
      console.log('   ✅ Database connected successfully');
    }

    console.log('\n✅ All basic checks passed!');
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Register a vendor at /auth/register');
    console.log('2. Login as admin and approve the vendor');
    console.log('3. Login as the approved vendor');
    console.log('4. Create a product and submit for review');
    console.log('5. Login as admin and approve the product');
    console.log('6. Check if product appears in Shopify');

    console.log('\n📖 See VENDOR_FLOW_TESTING.md for detailed testing instructions');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
runTests();
