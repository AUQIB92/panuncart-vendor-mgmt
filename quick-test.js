/**
 * Quick Function Test - Tests the most critical functions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Running Quick Function Tests...\n');

async function runQuickTest() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ FAIL: Missing Supabase credentials');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test 1: Database connection
  try {
    const { data, error } = await supabase.from('vendors').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('✅ Database connection: OK');
  } catch (error) {
    console.log('❌ Database connection:', error.message);
    return false;
  }
  
  // Test 2: Required RPC functions
  try {
    // Test if we can call admin_get_vendors (this will fail if function doesn't exist)
    const { data, error } = await supabase.rpc('admin_get_vendors');
    
    if (error && error.message.includes('function')) {
      console.log('❌ RPC functions: Functions not found');
      console.log('   💡 Run scripts/005_complete_setup.sql');
      return false;
    }
    
    console.log('✅ RPC functions: admin_get_vendors callable');
    
    // Also test admin_get_products
    const { error: prodError } = await supabase.rpc('admin_get_products');
    if (prodError && prodError.message.includes('function')) {
      console.log('❌ RPC functions: admin_get_products missing');
      console.log('   💡 Run scripts/005_complete_setup.sql');
      return false;
    }
    
    console.log('✅ RPC functions: admin_get_products callable');
    
  } catch (error) {
    if (error.message.includes('function') || error.message.includes('Undefined function')) {
      console.log('❌ RPC functions: Required functions not created');
      console.log('   💡 Run scripts/005_complete_setup.sql in Supabase SQL editor');
      return false;
    }
    console.log('❌ RPC functions check failed:', error.message);
    return false;
  }
  
  // Test 3: Shopify configuration
  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (shopifyDomain && shopifyToken) {
    console.log('✅ Shopify configuration: Present');
  } else {
    console.log('⚠️  Shopify configuration: Missing (optional for basic tests)');
  }
  
  // Test 4: Auth redirect URL
  const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
  if (redirectUrl) {
    console.log('✅ Email redirect URL: Configured');
  } else {
    console.log('❌ Email redirect URL: Missing');
    return false;
  }
  
  console.log('\n🎉 All critical functions working!');
  return true;
}

runQuickTest().then(success => {
  process.exit(success ? 0 : 1);
});
