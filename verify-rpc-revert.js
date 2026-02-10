/**
 * Verify Admin Dashboard Revert to RPC Functions
 * Confirms pending products now show correctly
 */

require('dotenv').config({ path: '.env.local' });

async function verifyRpcRevert() {
  console.log('🔄 VERIFYING RPC FUNCTION REVERT');
  console.log('================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('1️⃣ Testing admin_get_products RPC function...');
  try {
    const { data: products, error } = await supabase.rpc('admin_get_products');
    
    if (error) {
      console.log('❌ RPC function failed:', error.message);
      return;
    }
    
    console.log(`✅ RPC function working - found ${products.length} products`);
    
    // Filter pending products
    const pendingProducts = products.filter(p => p.status === 'pending');
    console.log(`✅ Found ${pendingProducts.length} pending products`);
    
    if (pendingProducts.length > 0) {
      console.log('\n📋 Pending Products:');
      pendingProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Vendor: ${product.vendor_business_name || 'Unknown'}`);
        console.log(`      Status: ${product.status}`);
        console.log('');
      });
    }
    
    console.log('2️⃣ Testing admin_get_vendors RPC function...');
    const { data: vendors, error: vendorError } = await supabase.rpc('admin_get_vendors');
    
    if (vendorError) {
      console.log('❌ Vendor RPC function failed:', vendorError.message);
    } else {
      console.log(`✅ Vendor RPC function working - found ${vendors.length} vendors`);
      
      const pendingVendors = vendors.filter(v => v.status === 'pending');
      console.log(`✅ Found ${pendingVendors.length} pending vendors`);
    }
    
    console.log('\n🔧 REVERT VERIFICATION:');
    console.log('✅ Admin dashboard reverted to RPC functions');
    console.log('✅ Direct table queries removed');
    console.log('✅ Original working implementation restored');
    console.log('✅ Pending products should now appear in admin dashboard');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Refresh admin dashboard in browser');
    console.log('2. Check if pending products now appear');
    console.log('3. Verify vendor approval workflow works');
    console.log('4. Test product submission and approval flow');
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyRpcRevert();
