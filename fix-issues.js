/**
 * Fix Common Issues Detected by Tests
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIssues() {
  console.log('🔧 Fixing detected issues...\n');
  
  // Issue 1: Check if business_address column exists
  console.log('1. Checking database schema...');
  try {
    const { data, error } = await supabase.from('vendors').select('business_address').limit(1);
    if (error && error.message.includes('column')) {
      console.log('   ❌ business_address column missing');
      console.log('   💡 Run this SQL in Supabase:');
      console.log('   ALTER TABLE vendors ADD COLUMN business_address TEXT;');
    } else {
      console.log('   ✅ business_address column exists');
    }
  } catch (error) {
    console.log('   ❌ Schema check failed:', error.message);
  }
  
  // Issue 2: Test Shopify credentials
  console.log('\n2. Testing Shopify credentials...');
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (domain && token) {
    try {
      const response = await fetch(`https://${domain}/admin/api/2024-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token
        }
      });
      
      if (response.ok) {
        console.log('   ✅ Shopify credentials working');
      } else if (response.status === 401) {
        console.log('   ❌ Shopify 401 Unauthorized');
        console.log('   💡 Check if SHOPIFY_ACCESS_TOKEN is correct');
        console.log('   💡 Verify token has Admin API permissions');
      } else {
        console.log(`   ❌ Shopify API error: ${response.status}`);
      }
    } catch (error) {
      console.log('   ❌ Shopify connection failed:', error.message);
    }
  }
  
  // Issue 3: Check for required RPC functions
  console.log('\n3. Checking RPC functions...');
  const requiredFunctions = [
    'admin_get_vendors',
    'admin_get_products',
    'get_my_vendor',
    'get_my_products'
  ];
  
  for (const func of requiredFunctions) {
    try {
      const { error } = await supabase.rpc(func);
      // We expect an auth error or empty result, not a "function not found" error
      if (error && error.message.includes('function')) {
        console.log(`   ❌ ${func}: Function not found`);
      } else {
        console.log(`   ✅ ${func}: Function exists`);
      }
    } catch (error) {
      if (error.message.includes('function')) {
        console.log(`   ❌ ${func}: Function not found`);
      } else {
        console.log(`   ✅ ${func}: Function exists`);
      }
    }
  }
  
  console.log('\n📋 RECOMMENDED ACTIONS:');
  console.log('1. Run scripts/005_complete_setup.sql in Supabase SQL editor');
  console.log('2. If business_address column missing, run:');
  console.log('   ALTER TABLE vendors ADD COLUMN business_address TEXT;');
  console.log('3. Verify Shopify access token is correct and has Admin API permissions');
  console.log('4. For vendor login issues, create test account manually first');
}

fixIssues();
