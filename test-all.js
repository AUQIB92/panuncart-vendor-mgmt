/**
 * Comprehensive Test Suite for PanunCart Vendor Management
 * Tests all major functions: database, auth, admin, vendor, Shopify
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test configuration
const TEST_CONFIG = {
  vendor: {
    email: 'auqib92@gmail.com',
    password: 'password123',
    business_name: 'Test Vendor Co.',
    contact_name: 'Auqib Vendor'
  },
  admin: {
    email: 'auqib.cse@gmail.com',
    password: 'adminpass123'
  },
  product: {
    title: `Test Product ${Date.now()}`,
    price: 999.99,
    sku: `TEST-${Date.now()}`
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logResult(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  testResults.tests.push({ name: testName, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testDatabaseConnectivity() {
  console.log('\n=== DATABASE CONNECTIVITY TESTS ===');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('vendors').select('count', { count: 'exact' });
    logResult('Database Connection', !error, error ? error.message : 'Connected successfully');
    
    // Test RPC function existence
    const { data: functions, error: funcError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN (
          'admin_get_vendors',
          'admin_get_products',
          'admin_update_vendor_status',
          'admin_update_product_status',
          'get_my_vendor',
          'get_my_products',
          'submit_product_for_review'
        )
      `
    });
    
    if (funcError) {
      logResult('RPC Functions Check', false, 'Cannot query functions - run scripts/005_complete_setup.sql');
    } else {
      const functionNames = functions.map(f => f.proname);
      const required = [
        'admin_get_vendors',
        'admin_get_products',
        'admin_update_vendor_status',
        'admin_update_product_status',
        'get_my_vendor',
        'get_my_products',
        'submit_product_for_review'
      ];
      
      const missing = required.filter(f => !functionNames.includes(f));
      logResult('RPC Functions', missing.length === 0, 
        missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All functions present');
    }
    
  } catch (error) {
    logResult('Database Connectivity', false, error.message);
  }
}

async function testAuthentication() {
  console.log('\n=== AUTHENTICATION TESTS ===');
  
  try {
    // Test vendor registration
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_CONFIG.vendor.email,
      password: TEST_CONFIG.vendor.password,
      options: {
        data: {
          role: 'vendor',
          business_name: TEST_CONFIG.vendor.business_name,
          contact_name: TEST_CONFIG.vendor.contact_name
        }
      }
    });
    
    logResult('Vendor Registration', !signUpError, 
      signUpError ? signUpError.message : `Registered: ${TEST_CONFIG.vendor.email}`);
    
    // Store user ID for cleanup
    const userId = signUpData?.user?.id;
    
    // Test login
    await supabase.auth.signOut(); // Logout first
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.vendor.email,
      password: TEST_CONFIG.vendor.password
    });
    
    logResult('Vendor Login', !signInError, 
      signInError ? signInError.message : 'Login successful');
    
    // Cleanup - delete test user
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
      console.log('   🧹 Cleaned up test user');
    }
    
  } catch (error) {
    logResult('Authentication', false, error.message);
  }
}

async function testAdminFunctions() {
  console.log('\n=== ADMIN FUNCTION TESTS ===');
  
  try {
    // Test getting vendors
    const { data: vendors, error: vendorError } = await supabase.rpc('admin_get_vendors');
    logResult('Get All Vendors', !vendorError, 
      vendorError ? vendorError.message : `Found ${vendors?.length || 0} vendors`);
    
    // Test getting products
    const { data: products, error: productError } = await supabase.rpc('admin_get_products');
    logResult('Get All Products', !productError, 
      productError ? productError.message : `Found ${products?.length || 0} products`);
    
    // Test vendor stats
    const { data: vendorStats, error: statsError } = await supabase.rpc('admin_get_vendor_stats');
    logResult('Get Vendor Stats', !statsError, 
      statsError ? statsError.message : 'Stats retrieved');
    
    // Test product stats
    const { data: productStats, error: prodStatsError } = await supabase.rpc('admin_get_product_stats');
    logResult('Get Product Stats', !prodStatsError, 
      prodStatsError ? prodStatsError.message : 'Product stats retrieved');
      
  } catch (error) {
    logResult('Admin Functions', false, error.message);
  }
}

async function testVendorFunctions() {
  console.log('\n=== VENDOR FUNCTION TESTS ===');
  
  try {
    // This would require a real vendor account to test
    // For now, we'll just check if the functions exist
    
    const { data: functions, error } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN (
          'get_my_vendor',
          'get_my_products',
          'get_my_product',
          'insert_my_product',
          'update_my_product',
          'submit_product_for_review',
          'delete_my_draft_product'
        )
      `
    });
    
    if (error) {
      logResult('Vendor Functions Check', false, 'Cannot query functions');
    } else {
      const functionNames = functions.map(f => f.proname);
      const required = [
        'get_my_vendor',
        'get_my_products',
        'get_my_product',
        'insert_my_product',
        'update_my_product',
        'submit_product_for_review',
        'delete_my_draft_product'
      ];
      
      const missing = required.filter(f => !functionNames.includes(f));
      logResult('Vendor Functions', missing.length === 0, 
        missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All vendor functions present');
    }
    
  } catch (error) {
    logResult('Vendor Functions', false, error.message);
  }
}

async function testShopifyIntegration() {
  console.log('\n=== SHOPIFY INTEGRATION TESTS ===');
  
  // Check environment variables
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  logResult('Shopify Credentials', !!(domain && token), 
    domain && token ? 'Credentials present' : 'Missing credentials');
  
  if (domain && token) {
    try {
      // Test Shopify API connection
      const response = await fetch(`https://${domain}/admin/api/2024-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        }
      });
      
      logResult('Shopify API Connection', response.ok, 
        response.ok ? 'Connected successfully' : `Status: ${response.status}`);
        
    } catch (error) {
      logResult('Shopify Connection', false, error.message);
    }
  }
}

async function testEnvironmentVariables() {
  console.log('\n=== ENVIRONMENT VARIABLES TEST ===');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
    'SHOPIFY_ACCESS_TOKEN',
    'NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const present = !!process.env[varName];
    logResult(`ENV: ${varName}`, present, present ? '✓ Present' : '✗ Missing');
    if (!present) allPresent = false;
  });
  
  logResult('All Environment Variables', allPresent, 
    allPresent ? 'All required variables present' : 'Some variables missing');
}

async function runAllTests() {
  console.log('🧪 PANUNCART COMPREHENSIVE TEST SUITE');
  console.log('=====================================\n');
  
  // Run all test suites
  await testEnvironmentVariables();
  await testDatabaseConnectivity();
  await testAuthentication();
  await testAdminFunctions();
  await testVendorFunctions();
  await testShopifyIntegration();
  
  // Print summary
  console.log('\n=====================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\n🔧 FAILED TESTS:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
  }
  
  console.log('\n✨ Test suite completed!');
  
  // Exit with error code if any tests failed
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
