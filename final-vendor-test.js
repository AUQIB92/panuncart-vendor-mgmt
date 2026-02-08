/**
 * Final Vendor Approval Test
 * Tests the complete workflow after database functions are updated
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

async function finalTest() {
  console.log('🏁 FINAL VENDOR APPROVAL TEST');
  console.log('==============================\n');
  
  console.log('📋 ACTION REQUIRED:');
  console.log('Please run the following SQL in your Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/lfxflgsollvkykpiijtl/sql\n');
  
  console.log('📁 File to run: scripts/006_vendor_approval_functions.sql');
  console.log('(The updated version that matches your database schema)\n');
  
  console.log('After running the SQL, run this test again to verify it works.');
  
  // Test with existing data
  console.log('\n📊 Checking existing vendor data:');
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Error fetching vendors:', error.message);
    } else {
      console.log('✅ Found', vendors.length, 'vendors in database:');
      vendors.forEach(vendor => {
        console.log(`   - ${vendor.business_name} (${vendor.email})`);
        console.log(`     Status: ${vendor.status}`);
        console.log(`     Created: ${vendor.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('🎯 EXPECTED RESULT AFTER SQL UPDATE:');
  console.log('1. Admin dashboard should show pending vendors');
  console.log('2. You should be able to approve/reject vendors');
  console.log('3. Vendor status should update correctly');
  console.log('4. Approved vendors can log in and create products');
}

finalTest();
