/**
 * Check Available RPC Functions
 * Lists all RPC functions available in the database
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

async function checkRpcFunctions() {
  console.log('🔍 CHECKING AVAILABLE RPC FUNCTIONS');
  console.log('====================================\n');
  
  // Test the functions we expect to exist
  const functionsToTest = [
    'admin_get_vendors',
    'admin_get_vendors_pending_approval',
    'admin_approve_vendor',
    'admin_reject_vendor',
    'admin_get_products'
  ];
  
  for (const funcName of functionsToTest) {
    console.log(`Testing ${funcName}...`);
    
    try {
      // Test with dummy parameters where needed
      let result;
      if (funcName === 'admin_approve_vendor' || funcName === 'admin_reject_vendor') {
        // Skip these for now as they require valid UUIDs
        console.log('   ⏭️  Skipped (requires parameters)');
        continue;
      } else {
        result = await supabase.rpc(funcName);
      }
      
      if (result.error) {
        console.log('   ❌ Error:', result.error.message);
        console.log('      Code:', result.error.code);
      } else {
        console.log('   ✅ Success');
        if (result.data) {
          console.log('      Data type:', Array.isArray(result.data) ? 'Array' : typeof result.data);
          if (Array.isArray(result.data) && result.data.length > 0) {
            console.log('      Sample item keys:', Object.keys(result.data[0]));
          }
        }
      }
    } catch (error) {
      console.log('   💥 Exception:', error.message);
    }
    
    console.log('');
  }
  
  // Also test direct database access
  console.log('Testing direct database access...\n');
  
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('❌ Direct DB access failed:', error.message);
    } else {
      console.log('✅ Direct DB access successful');
      console.log('   Found', data.length, 'vendors');
      if (data.length > 0) {
        console.log('   Sample vendor:', data[0].business_name, `(${data[0].status})`);
      }
    }
  } catch (error) {
    console.log('💥 Direct DB exception:', error.message);
  }
}

checkRpcFunctions();
