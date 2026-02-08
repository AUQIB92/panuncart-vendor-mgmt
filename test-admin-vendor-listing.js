/**
 * Test Admin Vendor Listing
 * Verifies approved vendors appear in admin portal
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

async function testAdminVendorListing() {
  console.log('🔍 TESTING ADMIN VENDOR LISTING');
  console.log('================================\n');
  
  try {
    // Test 1: Get all vendors (should include approved ones)
    console.log('1️⃣ Testing admin_get_vendors function...');
    const { data: allVendors, error: allError } = await supabase.rpc('admin_get_vendors');
    
    if (allError) {
      console.log('❌ admin_get_vendors failed:', allError.message);
      if (allError.message.includes('column v.description does not exist')) {
        console.log('   ⚠️  Function needs to be updated to match schema');
      }
    } else {
      console.log('✅ admin_get_vendors succeeded');
      console.log('   Total vendors found:', allVendors?.length || 0);
      
      if (allVendors && allVendors.length > 0) {
        console.log('\n📋 All vendors:');
        allVendors.forEach(vendor => {
          console.log(`   - ${vendor.business_name} (${vendor.email})`);
          console.log(`     Status: ${vendor.status}`);
          console.log(`     Created: ${vendor.created_at}`);
        });
      }
    }
    
    // Test 2: Get only approved vendors
    console.log('\n2️⃣ Checking approved vendors specifically...');
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('business_name, email, status, created_at')
      .eq('status', 'approved');
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Found approved vendors:', vendors.length);
      
      if (vendors.length > 0) {
        console.log('\n📋 Approved vendors:');
        vendors.forEach(vendor => {
          console.log(`   - ${vendor.business_name} (${vendor.email})`);
          console.log(`     Approved on: ${vendor.created_at}`);
        });
      } else {
        console.log('   No approved vendors found');
      }
    }
    
    // Test 3: Get vendors by status distribution
    console.log('\n3️⃣ Checking vendor status distribution...');
    const { data: allVendorsDirect, error: directError } = await supabase
      .from('vendors')
      .select('business_name, email, status');
    
    if (directError) {
      console.log('❌ Direct query failed:', directError.message);
    } else {
      console.log('✅ Total vendors in database:', allVendorsDirect.length);
      
      const statusCounts = {};
      allVendorsDirect.forEach(vendor => {
        statusCounts[vendor.status] = (statusCounts[vendor.status] || 0) + 1;
      });
      
      console.log('\n📊 Status Distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
    
    // Test 4: Check admin dashboard component
    console.log('\n4️⃣ Checking admin vendor list component...');
    const adminComponentPath = 'components/admin/vendor-list.tsx';
    const fs = require('fs');
    const path = require('path');
    
    const componentExists = fs.existsSync(path.join(__dirname, 'components', 'admin', 'vendor-list.tsx'));
    console.log('Vendor list component exists:', componentExists ? '✅ YES' : '❌ NO');
    
    if (componentExists) {
      console.log('   Component should display vendors from admin_get_vendors() RPC');
      console.log('   Make sure the RPC function returns correct data structure');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  await showAdminPortalVerification();
}

async function showAdminPortalVerification() {
  console.log('\n📋 ADMIN PORTAL VERIFICATION');
  console.log('============================');
  
  console.log('\n✅ WHAT SHOULD APPEAR IN ADMIN PORTAL:');
  console.log('1. Approved vendors should be listed in the vendors section');
  console.log('2. Each vendor should show: business name, email, status, approval date');
  console.log('3. Actions: View details, suspend, reactivate (for approved vendors)');
  
  console.log('\n🔧 TROUBLESHOOTING STEPS:');
  console.log('1. Check if admin_get_vendors() RPC function works correctly');
  console.log('2. Verify the function returns vendors with status = "approved"');
  console.log('3. Check admin dashboard component renders the data properly');
  console.log('4. Look for JavaScript errors in browser console');
  console.log('5. Verify network requests in browser dev tools');
  
  console.log('\n🌐 BROWSER DEBUGGING:');
  console.log('1. Open admin portal in browser');
  console.log('2. Press F12 to open developer tools');
  console.log('3. Go to Network tab');
  console.log('4. Reload the vendors page');
  console.log('5. Look for requests to Supabase API');
  console.log('6. Check response data contains approved vendors');
  
  console.log('\nIf approved vendors still dont appear:');
  console.log('1. Verify database actually has approved vendors');
  console.log('2. Check admin_get_vendors() function definition');
  console.log('3. Ensure admin dashboard calls the correct RPC function');
  console.log('4. Look for frontend rendering issues');
}

// Run the test
testAdminVendorListing();
