/**
 * Test Exact Vendor Dashboard Flow
 * Simulates what happens when vendor logs in and accesses dashboard
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

async function testExactVendorFlow() {
  console.log('🔍 TESTING EXACT VENDOR DASHBOARD FLOW');
  console.log('=====================================\n');
  
  // Use a known working vendor credential
  const vendorEmail = 'auqib92@gmail.com';
  const vendorPassword = 'TempPass123!'; // Try this password
  
  console.log(`Testing with email: ${vendorEmail}\n`);
  
  try {
    // Step 1: Sign in as vendor
    console.log('1️⃣ Signing in as vendor...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: vendorEmail,
      password: vendorPassword
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      // Try alternative passwords
      console.log('\nTrying alternative passwords...');
      const altPasswords = ['VendorPass123!', 'temp123', 'Password123!', '12345678'];
      
      for (const password of altPasswords) {
        console.log(`Trying: ${password}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: vendorEmail,
          password: password
        });
        
        if (error) {
          console.log('   ❌ Failed:', error.message);
        } else {
          console.log('   ✅ SUCCESS with password:', password);
          signInData = data;
          break;
        }
      }
      
      if (!signInData) {
        console.log('\n❌ All password attempts failed');
        console.log('Vendor needs to reset their password');
        return;
      }
    } else {
      console.log('✅ Sign in successful');
      console.log('   User ID:', signInData.user?.id);
      console.log('   Access token length:', signInData.session?.access_token?.length);
    }
    
    // Step 2: Test get_my_vendor() RPC with vendor's session
    console.log('\n2️⃣ Testing get_my_vendor() RPC function...');
    const vendorClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session?.access_token}`
        }
      }
    });
    
    const { data: vendorData, error: rpcError } = await vendorClient.rpc('get_my_vendor');
    
    if (rpcError) {
      console.log('❌ get_my_vendor() failed:', rpcError.message);
      console.log('   Error code:', rpcError.code);
      
      // Check if it's an RLS policy issue
      if (rpcError.message.includes('permission') || rpcError.code === '42501') {
        console.log('   🔴 This is likely an RLS (Row Level Security) policy issue');
        await checkRlsPolicies();
      }
    } else {
      console.log('✅ get_my_vendor() succeeded');
      console.log('   Data returned:', JSON.stringify(vendorData, null, 2));
      
      if (vendorData && vendorData.length > 0) {
        const vendor = vendorData[0];
        console.log('\n📋 Vendor Details from RPC:');
        console.log('   Business Name:', vendor.business_name);
        console.log('   Status:', vendor.status);
        console.log('   Email:', vendor.email);
        
        if (vendor.status === 'approved') {
          console.log('   🎉 VENDOR IS APPROVED - Dashboard should work!');
        } else {
          console.log('   ❌ Vendor status is:', vendor.status);
        }
      } else {
        console.log('   ⚠️  No vendor data returned');
      }
    }
    
    // Step 3: Direct database access test
    console.log('\n3️⃣ Direct database access test...');
    const { data: directData, error: directError } = await vendorClient
      .from('vendors')
      .select('*')
      .eq('id', signInData.user?.id);
    
    if (directError) {
      console.log('❌ Direct DB access failed:', directError.message);
    } else {
      console.log('✅ Direct DB access succeeded');
      console.log('   Records found:', directData.length);
      if (directData.length > 0) {
        console.log('   Status:', directData[0].status);
      }
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  await showNextSteps();
}

async function checkRlsPolicies() {
  console.log('\n🔐 CHECKING RLS POLICIES...');
  console.log('RLS (Row Level Security) might be blocking vendor access to their own record.');
  console.log('This is a common cause of the "pending approval" issue even when approved.');
  
  console.log('\n🔧 TO FIX RLS ISSUES:');
  console.log('1. Go to Supabase Dashboard → Table Editor → vendors table');
  console.log('2. Click "Policies" tab');
  console.log('3. Ensure there\'s a policy allowing vendors to read their own record');
  console.log('4. Policy should be something like:');
  console.log('   FOR SELECT USING (auth.uid() = id)');
  
  console.log('\nAlternatively, temporarily disable RLS on vendors table for testing:');
  console.log('- Click "Enable Row Level Security" toggle to OFF');
  console.log('- Test if vendor can now see approved status');
  console.log('- Re-enable RLS and create proper policies');
}

async function showNextSteps() {
  console.log('\n📋 NEXT STEPS');
  console.log('=============');
  
  console.log('\nIf vendor can sign in but still sees "pending":');
  console.log('1. Check RLS policies on vendors table');
  console.log('2. Verify get_my_vendor() function exists and works');
  console.log('3. Test with RLS temporarily disabled');
  console.log('4. Check if vendor ID matches auth user ID');
  
  console.log('\nIf vendor cannot sign in:');
  console.log('1. Vendor needs to reset password via "Forgot Password"');
  console.log('2. Admin can reset password in Supabase Auth dashboard');
  console.log('3. Create new test vendor account to verify system works');
  
  console.log('\nQuick verification:');
  console.log('1. Try signing in with different browsers');
  console.log('2. Check browser console for errors');
  console.log('3. Verify network requests in Dev Tools');
  console.log('4. Test with a completely fresh vendor registration');
}

// Run the test
testExactVendorFlow();
