/**
 * Deep Debug Vendor Login Issue
 * Comprehensive test to identify why approved vendor still sees pending status
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

async function deepDebugVendorLogin() {
  console.log('🔍 DEEP DEBUG: VENDOR LOGIN ISSUE');
  console.log('===================================\n');
  
  // Step 1: Verify the specific vendor in database
  console.log('1️⃣ Checking vendor in database...');
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', 'auqib92@gmail.com');
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
      return;
    }
    
    if (vendors.length === 0) {
      console.log('❌ No vendor found with email auqib92@gmail.com');
      return;
    }
    
    const vendor = vendors[0];
    console.log('✅ Vendor found:');
    console.log('   ID:', vendor.id);
    console.log('   Business Name:', vendor.business_name);
    console.log('   Email:', vendor.email);
    console.log('   Status:', vendor.status);
    console.log('   Created:', vendor.created_at);
    console.log('   Updated:', vendor.updated_at);
    
    // Step 2: Test the RPC function that vendor dashboard uses
    console.log('\n2️⃣ Testing get_my_vendor() RPC function...');
    try {
      // We need to simulate the vendor's auth session
      // First, let's sign in as the vendor to get their session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'auqib92@gmail.com',
        password: 'VendorPass123!' // You'll need to use the actual password
      });
      
      if (signInError) {
        console.log('❌ Could not sign in as vendor:', signInError.message);
        console.log('   This might be the issue - incorrect credentials');
        return;
      }
      
      console.log('✅ Signed in as vendor');
      console.log('   User ID:', signInData.user?.id);
      
      // Now test the RPC function with vendor's session
      const vendorSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${signInData.session?.access_token}`
          }
        }
      });
      
      const { data: vendorData, error: rpcError } = await vendorSupabase.rpc('get_my_vendor');
      
      if (rpcError) {
        console.log('❌ get_my_vendor() failed:', rpcError.message);
      } else {
        console.log('✅ get_my_vendor() succeeded:');
        console.log('   Data returned:', vendorData);
        if (vendorData && vendorData.length > 0) {
          console.log('   Status from RPC:', vendorData[0].status);
        }
      }
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out vendor session');
      
    } catch (error) {
      console.log('❌ RPC test failed:', error.message);
    }
    
    // Step 3: Check if there are multiple vendor records
    console.log('\n3️⃣ Checking for duplicate vendor records...');
    const { data: allVendors, error: allError } = await supabase
      .from('vendors')
      .select('id, business_name, email, status');
    
    if (allError) {
      console.log('❌ Could not fetch all vendors:', allError.message);
    } else {
      console.log('✅ Total vendor records:', allVendors.length);
      allVendors.forEach(v => {
        console.log(`   - ${v.business_name} (${v.email}): ${v.status}`);
      });
    }
    
    // Step 4: Verify the vendor's auth user record
    console.log('\n4️⃣ Checking auth user record...');
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail('auqib92@gmail.com');
      
      if (userError) {
        console.log('❌ Could not fetch user data:', userError.message);
      } else {
        console.log('✅ User record found:');
        console.log('   User ID:', userData.user?.id);
        console.log('   Email confirmed:', userData.user?.email_confirmed_at ? 'Yes' : 'No');
        console.log('   Created at:', userData.user?.created_at);
      }
    } catch (error) {
      console.log('❌ User record check failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Debug process failed:', error.message);
  }
  
  await showComprehensiveTroubleshooting();
}

async function showComprehensiveTroubleshooting() {
  console.log('\n🛠️  COMPREHENSIVE TROUBLESHOOTING');
  console.log('=================================');
  
  console.log('\n🔴 POSSIBLE CAUSES:');
  console.log('1. Wrong password - vendor using incorrect credentials');
  console.log('2. Session caching - browser storing old session data');
  console.log('3. Auth/user mismatch - vendor record not linked to auth user');
  console.log('4. RLS policies - vendor can\'t access their own record');
  console.log('5. Multiple accounts - vendor registered twice');
  console.log('6. Frontend cache - Next.js caching stale data');
  
  console.log('\n✅ VERIFICATION STEPS:');
  console.log('1. Confirm vendor is using correct email/password');
  console.log('2. Have vendor clear browser cache and cookies');
  console.log('3. Try logging in with incognito/private browsing');
  console.log('4. Check if vendor can access other parts of the app');
  console.log('5. Verify vendor record exists in both auth.users and public.vendors');
  
  console.log('\n🔧 TECHNICAL DEBUGGING:');
  console.log('1. Check browser Network tab for failed API requests');
  console.log('2. Look for 401/403 errors in console');
  console.log('3. Verify get_my_vendor() RPC function works with vendor\'s token');
  console.log('4. Check Supabase auth logs in dashboard');
  console.log('5. Test with a completely new vendor account');
  
  console.log('\n📋 IMMEDIATE ACTIONS:');
  console.log('1. Have vendor reset their password');
  console.log('2. Create a new test vendor account');
  console.log('3. Check if the issue affects all vendors or just this one');
  console.log('4. Verify the vendor record ID matches auth user ID');
  console.log('5. Test vendor login with different browsers');
  
  console.log('\nIf none of these work, the issue might be:');
  console.log('- Corrupted auth session');
  console.log('- Database inconsistency');
  console.log('- RLS policy configuration issue');
  console.log('- Frontend routing problem');
}

// Run the deep debug
deepDebugVendorLogin();
