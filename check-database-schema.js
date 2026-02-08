/**
 * Check Database Schema
 * Verifies the current structure of vendors and profiles tables
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

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING DATABASE SCHEMA');
  console.log('===========================\n');
  
  try {
    // Check profiles table structure
    console.log('1️⃣ Checking profiles table...');
    const { data: profilesSample, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table exists');
      console.log('   Sample row:', profilesSample?.[0] || 'No data');
      
      // Get column names
      if (profilesSample && profilesSample.length > 0) {
        console.log('   Columns:', Object.keys(profilesSample[0]));
      }
    }
    
    // Check vendors table structure
    console.log('\n2️⃣ Checking vendors table...');
    const { data: vendorsSample, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .limit(1);
    
    if (vendorsError) {
      console.log('❌ Vendors table error:', vendorsError.message);
      console.log('   This might indicate the table doesn\'t exist');
    } else {
      console.log('✅ Vendors table exists');
      console.log('   Sample row:', vendorsSample?.[0] || 'No data');
      
      if (vendorsSample && vendorsSample.length > 0) {
        console.log('   Columns:', Object.keys(vendorsSample[0]));
      }
    }
    
    // Check current vendor data
    console.log('\n3️⃣ Checking vendor data...');
    const { data: vendors, error: vendorListError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor');
    
    if (vendorListError) {
      console.log('❌ Error fetching vendors:', vendorListError.message);
    } else {
      console.log('✅ Found vendors in profiles table:', vendors?.length || 0);
      
      if (vendors && vendors.length > 0) {
        console.log('\n📋 Vendor data sample:');
        vendors.slice(0, 2).forEach(vendor => {
          console.log(`   - ${vendor.business_name || 'No business name'} (${vendor.email})`);
          console.log(`     Role: ${vendor.role}`);
          console.log(`     Approved: ${vendor.approved ? 'Yes' : 'No'}`);
          console.log(`     Created: ${vendor.created_at}`);
        });
      }
    }
    
    // Test the specific RPC function that's failing
    console.log('\n4️⃣ Testing specific RPC function...');
    try {
      const { data, error } = await supabase.rpc('admin_get_vendors_pending_approval');
      if (error) {
        console.log('❌ RPC Error Details:');
        console.log('   Message:', error.message);
        console.log('   Code:', error.code);
        console.log('   Hint:', error.hint);
      } else {
        console.log('✅ RPC function works!');
        console.log('   Data:', data);
      }
    } catch (rpcError) {
      console.log('❌ RPC Exception:', rpcError.message);
    }
    
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  }
  
  await showSchemaFixOptions();
}

async function showSchemaFixOptions() {
  console.log('\n🛠️  SCHEMA ISSUE DETECTED');
  console.log('========================');
  
  console.log('\nThe SQL functions expect a "vendors" table with columns like:');
  console.log('- id, business_name, contact_name, email, phone');
  console.log('- gst_number, business_address, city, state, pincode');
  console.log('- description, logo_url, status, created_at, updated_at');
  
  console.log('\nBut your data seems to be in a "profiles" table with different structure.');
  
  console.log('\n🔧 OPTIONS TO FIX:');
  console.log('1. Update the SQL functions to match your profiles table structure');
  console.log('2. Create a vendors table that mirrors your profiles data');
  console.log('3. Modify the admin dashboard to use profiles table directly');
  
  console.log('\n📋 RECOMMENDED SOLUTION:');
  console.log('Update the vendor approval functions to work with your existing profiles table.');
  console.log('The profiles table seems to have the vendor data you need.');
}

// Run the schema check
checkDatabaseSchema();
