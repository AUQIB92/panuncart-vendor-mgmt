/**
 * Shopify OAuth and Product Listing Test
 * Tests the complete flow from OAuth to product retrieval
 */

require('dotenv').config({ path: '.env.local' });

async function testShopifyIntegration() {
  console.log('🛍️  SHOPIFY OAUTH & PRODUCT LISTING TEST');
  console.log('=======================================\n');
  
  // Check configuration
  console.log('🔧 Configuration Check:');
  console.log('======================');
  
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
  
  console.log('Store Domain:', storeDomain);
  console.log('Client ID Present:', !!clientId);
  console.log('Client Secret Present:', !!clientSecret);
  console.log('Redirect URI:', redirectUri || 'Not set');
  
  if (!clientId || !clientSecret) {
    console.log('\n❌ Missing OAuth credentials');
    console.log('Please add your actual Shopify Client ID and Client Secret to .env.local');
    return;
  }
  
  console.log('\n✅ Configuration looks good');
  
  // Test 1: OAuth Install URL Generation
  console.log('\n1️⃣ OAuth Install URL:');
  console.log('====================');
  
  const installUrl = 
    `https://${storeDomain}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=read_products,write_products` +
    `&redirect_uri=${redirectUri || 'http://localhost:3000/api/shopify/callback'}` +
    `&state=test123`;
  
  console.log('Install URL:');
  console.log(installUrl);
  
  // Test 2: Check if we already have a stored token
  console.log('\n2️⃣ Checking for existing token:');
  console.log('==============================');
  
  const { getShopifyAccessToken } = require('./lib/shopify-oauth.ts');
  
  try {
    const existingToken = await getShopifyAccessToken(storeDomain);
    
    if (existingToken) {
      console.log('✅ Found existing token!');
      console.log('Token preview:', existingToken.substring(0, 20) + '...');
      
      // Test 3: List products with existing token
      console.log('\n3️⃣ Testing product listing:');
      console.log('==========================');
      
      try {
        const response = await fetch(`https://${storeDomain}/admin/api/2024-10/products.json`, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': existingToken,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Product API Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Successfully retrieved products!');
          console.log('Product count:', data.products?.length || 0);
          
          if (data.products?.length > 0) {
            console.log('\nSample products:');
            data.products.slice(0, 3).forEach((product, index) => {
              console.log(`${index + 1}. ${product.title} - ${product.status}`);
            });
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Product listing failed:', response.status, errorText);
          
          if (response.status === 401) {
            console.log('Token may be expired. You may need to re-authenticate.');
          }
        }
        
      } catch (error) {
        console.log('❌ Product listing error:', error.message);
      }
      
    } else {
      console.log('❌ No existing token found');
      console.log('You need to complete the OAuth flow first.');
      console.log('\n🔧 Steps to get a token:');
      console.log('1. Visit the install URL above');
      console.log('2. Authorize the app in Shopify');
      console.log('3. Complete the OAuth callback');
      console.log('4. Token will be stored locally');
    }
    
  } catch (error) {
    console.log('❌ Token check failed:', error.message);
  }
  
  // Test 4: Show available utilities
  console.log('\n4️⃣ Available Utilities:');
  console.log('======================');
  
  console.log('To check stored tokens:');
  console.log('import { listStoredTokens } from "@/lib/shopify-oauth"');
  console.log('listStoredTokens();');
  
  console.log('\nTo clean up expired tokens:');
  console.log('import { cleanupExpiredTokens } from "@/lib/shopify-oauth"');
  console.log('cleanupExpiredTokens();');
  
  console.log('\nTo test Shopify connection:');
  console.log('import { testShopifyConnection } from "@/lib/shopify-oauth-publisher"');
  console.log('await testShopifyConnection();');
  
  await showNextSteps();
}

async function showNextSteps() {
  console.log('\n📋 NEXT STEPS:');
  console.log('=============');
  
  console.log('\nIf you have a valid token:');
  console.log('✅ Product listing should work');
  console.log('✅ Product publishing should work');
  console.log('✅ No more 401 errors');
  
  console.log('\nIf you need to get a token:');
  console.log('1. Visit the OAuth install URL');
  console.log('2. Authorize your app');
  console.log('3. Complete the callback process');
  console.log('4. Test again');
  
  console.log('\nThe OAuth implementation is ready and should resolve your authentication issues!');
}

// Run the test
testShopifyIntegration();
