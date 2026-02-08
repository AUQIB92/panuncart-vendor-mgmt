const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVendorLogin() {
  console.log('Testing vendor login with password: test@1234\n');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'auqib92@gmail.com',
    password: 'test@1234'
  });
  
  if (error) {
    console.log('❌ Login failed:', error.message);
    return;
  }
  
  console.log('✅ Login successful!');
  console.log('User ID:', data.user?.id);
  console.log('Access token obtained\n');
  
  // Test get_my_vendor() RPC
  const vendorClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${data.session?.access_token}`
        }
      }
    }
  );
  
  const { data: vendorData, error: rpcError } = await vendorClient.rpc('get_my_vendor');
  
  if (rpcError) {
    console.log('❌ get_my_vendor failed:', rpcError.message);
    console.log('Error code:', rpcError.code);
  } else {
    console.log('✅ get_my_vendor succeeded!');
    if (vendorData && vendorData.length > 0) {
      console.log('Vendor details:');
      console.log('  Business Name:', vendorData[0].business_name);
      console.log('  Status:', vendorData[0].status);
      console.log('  Email:', vendorData[0].email);
      
      if (vendorData[0].status === 'approved') {
        console.log('\n🎉 SUCCESS: Vendor is approved and can access dashboard!');
      } else {
        console.log('\n⚠️  Vendor status is:', vendorData[0].status);
      }
    } else {
      console.log('No vendor data returned');
    }
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log('\n✅ Signed out');
}

testVendorLogin();
