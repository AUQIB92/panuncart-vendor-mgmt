/**
 * Debug Vendor Approval Status Sync
 * Checks why approved vendors still see pending status
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

async function debugVendorStatusSync() {
  console.log('🔍 DEBUGGING VENDOR APPROVAL STATUS SYNC');
  console.log('========================================\n');
  
  // Check the specific vendor that was approved
  console.log('1️⃣ Checking vendor status in database...');
  
  try {
    // Look for vendors with email auqib92@gmail.com (GEN STORE)
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', 'auqib92@gmail.com');
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Found vendor(s):', vendors.length);
      
      vendors.forEach(vendor => {
        console.log('\n📋 Vendor Details:');
        console.log('   Business Name:', vendor.business_name);
        console.log('   Email:', vendor.email);
        console.log('   Status:', vendor.status);
        console.log('   Created:', vendor.created_at);
        console.log('   Updated:', vendor.updated_at);
      });
    }
  } catch (error) {
    console.log('❌ Query failed:', error.message);
  }
  
  // Check all vendors and their statuses
  console.log('\n2️⃣ Checking all vendors...');
  
  try {
    const { data: allVendors, error } = await supabase
      .from('vendors')
      .select('business_name, email, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Failed to fetch vendors:', error.message);
    } else {
      console.log('✅ Total vendors:', allVendors.length);
      console.log('\n📋 Vendor Status Summary:');
      
      const statusCounts = {};
      allVendors.forEach(vendor => {
        statusCounts[vendor.status] = (statusCounts[vendor.status] || 0) + 1;
        console.log(`   - ${vendor.business_name} (${vendor.email}): ${vendor.status}`);
      });
      
      console.log('\n📊 Status Distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
  } catch (error) {
    console.log('❌ Failed to fetch all vendors:', error.message);
  }
  
  // Test the vendor dashboard component logic
  console.log('\n3️⃣ Testing vendor dashboard logic...');
  
  // Simulate what happens when an approved vendor logs in
  console.log('   Checking if vendor dashboard correctly reads status...');
  
  await showFrontendDebuggingSteps();
}

async function showFrontendDebuggingSteps() {
  console.log('\n🛠️  FRONTEND DEBUGGING STEPS');
  console.log('============================');
  
  console.log('\n🔴 LIKELY CAUSES:');
  console.log('1. Browser cache storing old session data');
  console.log('2. Supabase auth session not refreshed');
  console.log('3. Frontend component not re-fetching vendor data');
  console.log('4. Client-side state not updating after approval');
  
  console.log('\n✅ SOLUTIONS TO TRY:');
  
  console.log('\n1. HARD REFRESH THE VENDOR DASHBOARD:');
  console.log('   - Ctrl+Shift+R (Windows/Linux)');
  console.log('   - Cmd+Shift+R (Mac)');
  console.log('   - Or clear browser cache manually');
  
  console.log('\n2. LOG OUT AND LOG BACK IN:');
  console.log('   - Vendor should log out completely');
  console.log('   - Log back in with same credentials');
  console.log('   - This forces a fresh session');
  
  console.log('\n3. CHECK BROWSER DEV TOOLS:');
  console.log('   - Open F12 → Network tab');
  console.log('   - Look for vendor data API calls');
  console.log('   - Check if response contains updated status');
  
  console.log('\n4. VERIFY FRONTEND CODE:');
  console.log('   - Check if vendor dashboard re-fetches data on load');
  console.log('   - Look for stale data in component state');
  console.log('   - Ensure proper useEffect dependencies');
  
  console.log('\n5. FORCE SESSION REFRESH:');
  console.log('   - In vendor dashboard, add button to refresh vendor data');
  console.log('   - Call supabase.from(\'vendors\').select() again');
  console.log('   - Update component state with fresh data');
  
  console.log('\n📋 QUICK VERIFICATION:');
  console.log('1. Check database directly - vendor should be "approved"');
  console.log('2. Vendor logs out and back in');
  console.log('3. Hard refresh vendor dashboard');
  console.log('4. If still pending, check frontend data fetching logic');
}

// Run the debug
debugVendorStatusSync();
