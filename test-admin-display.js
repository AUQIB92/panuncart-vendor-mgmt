/**
 * Test Admin Vendors Page Display
 * Verifies approved vendors count and pending products display
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminDisplay() {
  console.log('🔍 TESTING ADMIN VENDORS PAGE DISPLAY');
  console.log('=====================================\n');
  
  try {
    // Test 1: Check vendor counts by status
    console.log('1️⃣ Checking vendor status counts...');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('status');
    
    if (vendorError) {
      console.log('❌ Failed to fetch vendors:', vendorError.message);
    } else {
      console.log('✅ Total vendors:', vendors.length);
      
      const statusCounts = {};
      vendors.forEach(vendor => {
        statusCounts[vendor.status] = (statusCounts[vendor.status] || 0) + 1;
      });
      
      console.log('\n📊 Vendor Status Distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      console.log('\nExpected in admin panel:');
      console.log('   Approved tab count: ', statusCounts['approved'] || 0);
      console.log('   Pending tab count: ', statusCounts['pending'] || 0);
      console.log('   Rejected tab count: ', (statusCounts['rejected'] || 0) + (statusCounts['suspended'] || 0));
    }
    
    // Test 2: Check pending products
    console.log('\n2️⃣ Checking pending products...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('status, vendor_id')
      .eq('status', 'pending');
    
    if (productError) {
      console.log('❌ Failed to fetch products:', productError.message);
    } else {
      console.log('✅ Pending products:', products.length);
      
      if (products.length > 0) {
        console.log('\n📋 Pending products by vendor:');
        const vendorProductCount = {};
        products.forEach(product => {
          vendorProductCount[product.vendor_id] = (vendorProductCount[product.vendor_id] || 0) + 1;
        });
        
        // Get vendor names
        for (const [vendorId, count] of Object.entries(vendorProductCount)) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('business_name')
            .eq('id', vendorId)
            .single();
          
          console.log(`   ${vendor?.business_name || vendorId}: ${count} pending products`);
        }
      }
    }
    
    // Test 3: Check admin_get_products function
    console.log('\n3️⃣ Testing admin_get_products() RPC...');
    const { data: adminProducts, error: adminError } = await supabase.rpc('admin_get_products');
    
    if (adminError) {
      console.log('❌ admin_get_products failed:', adminError.message);
    } else {
      console.log('✅ admin_get_products succeeded');
      console.log('   Total products returned:', adminProducts?.length || 0);
      
      const pendingProducts = adminProducts?.filter(p => p.status === 'pending') || [];
      console.log('   Pending products:', pendingProducts.length);
      
      if (pendingProducts.length > 0) {
        console.log('\n📋 Pending products:');
        pendingProducts.slice(0, 3).forEach(product => {
          console.log(`   - ${product.title} (${product.vendor_business_name})`);
        });
      }
    }
    
    // Test 4: Check what the admin page should display
    console.log('\n4️⃣ Admin Page Expected Display:');
    console.log('   Vendors Tab - Approved: ', statusCounts?.['approved'] || 0);
    console.log('   Vendors Tab - Pending: ', statusCounts?.['pending'] || 0);
    console.log('   Products Tab - Pending for approval: ', products?.length || 0);
    
    // Test 5: Check if vendor has products
    console.log('\n5️⃣ Checking if approved vendor has products...');
    const { data: approvedVendors } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('status', 'approved');
    
    if (approvedVendors && approvedVendors.length > 0) {
      for (const vendor of approvedVendors) {
        const { data: vendorProducts } = await supabase
          .from('products')
          .select('id, title, status')
          .eq('vendor_id', vendor.id);
        
        console.log(`   ${vendor.business_name}: ${vendorProducts?.length || 0} products`);
        
        if (vendorProducts && vendorProducts.length > 0) {
          const statusCounts = {};
          vendorProducts.forEach(p => {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
          });
          
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  await showAdminPageVerification();
}

async function showAdminPageVerification() {
  console.log('\n📋 ADMIN PAGE VERIFICATION');
  console.log('==========================');
  
  console.log('\n✅ EXPECTED ADMIN DASHBOARD BEHAVIOR:');
  console.log('1. Vendors tab should show:');
  console.log('   - Approved: 1 (GEN STORE)');
  console.log('   - Pending: 0');
  console.log('   - Rejected: 0');
  
  console.log('\n2. Products tab should show:');
  console.log('   - Pending products for approval: [count depends on vendor activity]');
  console.log('   - Approved products: [count of approved products]');
  
  console.log('\n🔧 TROUBLESHOOTING ADMIN PAGE:');
  console.log('1. Refresh the admin page (Ctrl+R)');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Verify network requests in Dev Tools');
  console.log('4. Ensure admin_get_vendors() and admin_get_products() RPC functions work');
  console.log('5. Check if data is being filtered correctly in frontend');
  
  console.log('\n🌐 BROWSER DEBUGGING:');
  console.log('1. Open http://localhost:3000/admin/vendors');
  console.log('2. Press F12 → Console tab');
  console.log('3. Look for any error messages');
  console.log('4. Go to Network tab and refresh');
  console.log('5. Check if API requests return correct data');
  
  console.log('\nIf counts are still wrong:');
  console.log('1. Verify database has correct vendor statuses');
  console.log('2. Check admin component filtering logic');
  console.log('3. Ensure RPC functions return expected data structure');
  console.log('4. Look for frontend state management issues');
}

// Run the test
testAdminDisplay();
