/**
 * Debug Shopify API Credentials
 * Tests Shopify API connection and validates credentials
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugShopifyCredentials() {
  console.log('🛍️  DEBUGGING SHOPIFY API CREDENTIALS');
  console.log('====================================\n');
  
  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  
  const shopifyStore = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const shopifyApiKey = process.env.SHOPIFY_API_KEY;
  const shopifyApiSecret = process.env.SHOPIFY_API_SECRET;
  
  console.log('Shopify Store Domain:', shopifyStore || '❌ NOT SET');
  console.log('Access Token Length:', shopifyToken ? `${shopifyToken.substring(0, 10)}...` : '❌ NOT SET');
  console.log('API Key:', shopifyApiKey ? '✅ SET' : '❌ NOT SET');
  console.log('API Secret:', shopifyApiSecret ? '✅ SET' : '❌ NOT SET');
  
  if (!shopifyStore || !shopifyToken) {
    console.log('\n❌ CRITICAL: Missing required Shopify credentials');
    console.log('   You need both NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN');
    return;
  }
  
  // Test 1: Basic Shopify API connection
  console.log('\n2️⃣ Testing Shopify API connection...');
  
  const shopifyUrl = `https://${shopifyStore}/admin/api/2024-10/products.json`;
  console.log('Testing URL:', shopifyUrl);
  
  try {
    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response Status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ 401 Unauthorized - Invalid credentials');
      console.log('   Possible causes:');
      console.log('   1. Wrong access token');
      console.log('   2. Expired access token');
      console.log('   3. Token doesn\'t have correct permissions');
      console.log('   4. Wrong store domain');
      
      await showCredentialFixSteps();
      
    } else if (response.status === 200) {
      console.log('✅ 200 OK - Shopify credentials are valid!');
      const data = await response.json();
      console.log('Products found:', data.products?.length || 0);
      
    } else {
      console.log('⚠️  Unexpected status:', response.status);
      const text = await response.text();
      console.log('Response body:', text.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  // Test 2: Check if we can get shop info
  console.log('\n3️⃣ Testing shop info endpoint...');
  
  const shopInfoUrl = `https://${shopifyStore}/admin/api/2024-10/shop.json`;
  
  try {
    const response = await fetch(shopInfoUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Shop Info Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Shop connected successfully');
      console.log('Shop Name:', data.shop?.name);
      console.log('Shop Domain:', data.shop?.domain);
    }
    
  } catch (error) {
    console.log('❌ Shop info request failed:', error.message);
  }
  
  await showShopifySetupGuide();
}

async function showCredentialFixSteps() {
  console.log('\n🔧 HOW TO FIX SHOPIFY CREDENTIALS');
  console.log('=================================');
  
  console.log('\n1. GENERATE NEW ACCESS TOKEN:');
  console.log('   Go to: https://panuncart-x-bbm.myshopify.com/admin/apps/private');
  console.log('   Create a new private app or regenerate existing one');
  console.log('   Make sure to grant these permissions:');
  console.log('   - Read and write products');
  console.log('   - Read and write inventory');
  console.log('   - Read and write orders (optional)');
  
  console.log('\n2. CHECK STORE DOMAIN:');
  console.log('   Your store domain should be: panuncart-x-bbm.myshopify.com');
  console.log('   Make sure it matches exactly in your .env file');
  
  console.log('\n3. VERIFY ENVIRONMENT VARIABLES:');
  console.log('   In .env.local file, you should have:');
  console.log('   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=panuncart-x-bbm.myshopify.com');
  console.log('   SHOPIFY_ACCESS_TOKEN=your_actual_access_token_here');
  
  console.log('\n4. TEST WITH A SIMPLE REQUEST:');
  console.log('   Use curl to test your credentials:');
  console.log('   curl -X GET https://panuncart-x-bbm.myshopify.com/admin/api/2024-10/shop.json \\');
  console.log('        -H "X-Shopify-Access-Token: YOUR_TOKEN_HERE"');
}

async function showShopifySetupGuide() {
  console.log('\n📋 SHOPIFY SETUP CHECKLIST');
  console.log('==========================');
  
  console.log('\n✅ REQUIRED CREDENTIALS:');
  console.log('☐ NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN (e.g., your-store.myshopify.com)');
  console.log('☐ SHOPIFY_ACCESS_TOKEN (Private App password)');
  
  console.log('\n✅ API PERMISSIONS NEEDED:');
  console.log('☐ Read products');
  console.log('☐ Write products');
  console.log('☐ Read inventory');
  console.log('☐ Write inventory');
  
  console.log('\n✅ TESTING STEPS:');
  console.log('1. Verify credentials work with curl');
  console.log('2. Test in your application');
  console.log('3. Check Shopify admin for API access logs');
  console.log('4. Ensure no IP restrictions on private app');
  
  console.log('\nIf you continue to get 401 errors:');
  console.log('1. Regenerate the access token');
  console.log('2. Double-check the store domain spelling');
  console.log('3. Verify the token has not expired');
  console.log('4. Contact Shopify support if issues persist');
}

// Run the debug
debugShopifyCredentials();
