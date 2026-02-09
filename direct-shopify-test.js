/**
 * Direct Shopify OAuth Test
 * Tests OAuth flow and product listing without module imports
 */

require('dotenv').config({ path: '.env.local' });

async function directShopifyTest() {
  console.log('🛍️  DIRECT SHOPIFY OAUTH TEST');
  console.log('============================\n');
  
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';
  
  console.log('Store:', storeDomain);
  console.log('Client ID:', clientId ? '✅ SET' : '❌ MISSING');
  console.log('Client Secret:', clientSecret ? '✅ SET' : '❌ MISSING');
  
  if (!clientId || !clientSecret) {
    console.log('\n❌ Missing OAuth credentials');
    return;
  }
  
  // Test OAuth install URL
  console.log('\n🔗 OAuth Install URL:');
  console.log('====================');
  
  const installUrl = 
    `https://${storeDomain}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=read_products,write_products` +
    `&redirect_uri=http://localhost:3000/api/shopify/callback` +
    `&state=test123`;
  
  console.log(installUrl);
  
  // Test if we can make a basic API call (will fail without token)
  console.log('\n📡 Testing API Access:');
  console.log('=====================');
  
  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2024-10/shop.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Shop API Status (without token):', response.status);
    
    if (response.status === 401) {
      console.log('❌ Expected 401 - no token provided');
      console.log('✅ This confirms the OAuth flow is needed');
    }
    
  } catch (error) {
    console.log('Network error:', error.message);
  }
  
  console.log('\n📋 To get a working token:');
  console.log('=========================');
  console.log('1. Visit the OAuth install URL above');
  console.log('2. Authorize your app in Shopify');
  console.log('3. Complete the OAuth callback process');
  console.log('4. Token will be stored for API access');
  
  console.log('\nOnce you have a token, product listing and publishing will work!');
}

directShopifyTest();
