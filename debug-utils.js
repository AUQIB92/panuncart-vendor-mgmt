/**
 * Debug Utilities for Vendor Management System
 * Helper functions to inspect database state and troubleshoot issues
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

async function listVendors() {
  console.log('\n🏪 VENDORS LIST');
  console.log('================');
  
  const { data, error } = await supabase.rpc('admin_get_vendors');
  
  if (error) {
    console.error('Error fetching vendors:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No vendors found');
    return;
  }
  
  data.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor.business_name}`);
    console.log(`   ID: ${vendor.id}`);
    console.log(`   Contact: ${vendor.contact_name}`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Status: ${vendor.status}`);
    console.log(`   Created: ${new Date(vendor.created_at).toLocaleString()}`);
    console.log('   ---');
  });
}

async function listProducts() {
  console.log('\n📦 PRODUCTS LIST');
  console.log('================');
  
  const { data, error } = await supabase.rpc('admin_get_products');
  
  if (error) {
    console.error('Error fetching products:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No products found');
    return;
  }
  
  const statusCounts = {};
  data.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  console.log('Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  console.log('\nAll Products:');
  data.forEach((product, index) => {
    console.log(`${index + 1}. ${product.title}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Vendor: ${product.vendor_business_name}`);
    console.log(`   Status: ${product.status}`);
    console.log(`   Price: ₹${Number(product.price).toFixed(2)}`);
    console.log(`   Shopify ID: ${product.shopify_product_id || 'Not published'}`);
    if (product.admin_notes) {
      console.log(`   Admin Notes: ${product.admin_notes}`);
    }
    console.log('   ---');
  });
}

async function checkRpcFunctions() {
  console.log('\n⚙️  RPC FUNCTIONS');
  console.log('=================');
  
  const requiredFunctions = [
    'admin_get_vendors',
    'admin_get_products',
    'admin_update_vendor_status',
    'admin_update_product_status',
    'admin_set_shopify_ids',
    'get_my_vendor',
    'get_my_products',
    'submit_product_for_review'
  ];
  
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT proname 
      FROM pg_proc 
      WHERE proname = ANY('{${requiredFunctions.join(',')}}')
      ORDER BY proname;
    `
  });
  
  if (error) {
    console.log('Could not query functions:', error.message);
    return;
  }
  
  const existing = data.map(f => f.proname);
  const missing = requiredFunctions.filter(f => !existing.includes(f));
  
  console.log('Existing functions:');
  existing.forEach(func => console.log(`  ✅ ${func}`));
  
  if (missing.length > 0) {
    console.log('\nMissing functions:');
    missing.forEach(func => console.log(`  ❌ ${func}`));
    console.log('\n💡 Run scripts/005_complete_setup.sql to create missing functions');
  }
}

async function checkEnvVars() {
  console.log('\n🔧 ENVIRONMENT VARIABLES');
  console.log('========================');
  
  const vars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
    'SHOPIFY_ACCESS_TOKEN'
  ];
  
  vars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      const displayValue = varName.includes('KEY') || varName.includes('TOKEN') 
        ? value.substring(0, 10) + '...' 
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  });
}

async function testShopifyConnection() {
  console.log('\n🛍️  SHOPIFY CONNECTION TEST');
  console.log('===========================');
  
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!domain || !token) {
    console.log('❌ Shopify credentials not configured');
    return;
  }
  
  console.log(`Store: ${domain}`);
  
  try {
    const response = await fetch(`https://${domain}/admin/api/2024-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Shopify API connection successful');
      const data = await response.json();
      console.log(`Shop: ${data.shop.name}`);
    } else {
      console.log(`❌ Shopify API error: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  console.log('🔍 PanunCart Debug Utility');
  console.log('=========================');
  
  switch (command) {
    case 'vendors':
      await listVendors();
      break;
    case 'products':
      await listProducts();
      break;
    case 'functions':
      await checkRpcFunctions();
      break;
    case 'env':
      await checkEnvVars();
      break;
    case 'shopify':
      await testShopifyConnection();
      break;
    case 'all':
    default:
      await checkEnvVars();
      await checkRpcFunctions();
      await listVendors();
      await listProducts();
      await testShopifyConnection();
      break;
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);
