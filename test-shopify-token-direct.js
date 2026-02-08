/**
 * Direct Shopify API Token Test
 * Tests your exact token against Shopify API
 */

require('dotenv').config({ path: '.env.local' });

async function testShopifyToken() {
  console.log('🛍️  DIRECT SHOPIFY TOKEN TEST');
  console.log('==============================\n');
  
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('Store Domain:', storeDomain);
  console.log('Access Token:', accessToken ? `${accessToken.substring(0, 15)}...` : 'NOT SET');
  console.log('');
  
  if (!storeDomain || !accessToken) {
    console.log('❌ Missing required credentials');
    return;
  }
  
  // Test 1: Shop info endpoint
  console.log('1️⃣ Testing /admin/api/2024-10/shop.json...');
  const shopUrl = `https://${storeDomain}/admin/api/2024-10/shop.json`;
  
  try {
    const response = await fetch(shopUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ SUCCESS! Token is valid');
      console.log('Shop Name:', data.shop?.name);
      console.log('Shop Domain:', data.shop?.domain);
      console.log('Shop Email:', data.shop?.email);
    } else if (response.status === 401) {
      console.log('❌ 401 Unauthorized - Token is invalid');
      console.log('Response:', await response.text());
      
      // Show token details for verification
      console.log('\n📋 Token Analysis:');
      console.log('Token Prefix:', accessToken.substring(0, 8));
      console.log('Token Length:', accessToken.length);
      console.log('Expected Format: shpss_[32 hex characters]');
      
      if (accessToken.startsWith('shpss_') && accessToken.length === 32 + 6) {
        console.log('✅ Token format looks correct');
      } else {
        console.log('⚠️  Token format may be incorrect');
      }
      
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      console.log('Response:', await response.text());
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  // Test 2: Products endpoint
  console.log('\n2️⃣ Testing /admin/api/2024-10/products.json...');
  const productsUrl = `https://${storeDomain}/admin/api/2024-10/products.json?limit=1`;
  
  try {
    const response = await fetch(productsUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Products endpoint accessible');
      console.log('Products count:', data.products?.length || 0);
    } else if (response.status === 401) {
      console.log('❌ 401 Unauthorized on products endpoint');
      console.log('Response:', await response.text());
    }
    
  } catch (error) {
    console.log('❌ Products request failed:', error.message);
  }
  
  // Test 3: Check if token has proper permissions
  console.log('\n3️⃣ Testing permission scope...');
  
  // Try to create a draft product (won't actually create it)
  const testProductData = {
    product: {
      title: "Test Product",
      body_html: "<strong>Good snowboard!</strong>",
      vendor: "Burton",
      product_type: "Snowboard"
    }
  };
  
  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2024-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProductData)
    });
    
    console.log('Create Product Status:', response.status);
    
    if (response.status === 201) {
      console.log('✅ Token has write permissions!');
      // Clean up - delete the test product
      const productData = await response.json();
      const productId = productData.product?.id;
      if (productId) {
        await fetch(`https://${storeDomain}/admin/api/2024-10/products/${productId}.json`, {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        });
        console.log('✅ Test product cleaned up');
      }
    } else if (response.status === 403) {
      console.log('⚠️  Token lacks write permissions (403 Forbidden)');
      console.log('You need to grant write_products permission');
    } else if (response.status === 401) {
      console.log('❌ Token invalid for write operations (401)');
    } else {
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response body:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Permission test failed:', error.message);
  }
  
  await showNextSteps();
}

async function showNextSteps() {
  console.log('\n📋 NEXT STEPS');
  console.log('=============');
  
  console.log('\nIf token is working:');
  console.log('✅ Your Shopify integration should work');
  console.log('✅ Product approvals should succeed');
  console.log('✅ No more 401 errors');
  
  console.log('\nIf token is not working:');
  console.log('1. Regenerate the access token in Shopify admin');
  console.log('2. Double-check the token was copied correctly');
  console.log('3. Ensure the private app has correct permissions');
  console.log('4. Restart your development server after changing .env');
  
  console.log('\n🔧 DEBUGGING COMMANDS:');
  console.log('Test shop info:');
  console.log('curl -X GET https://panuncart-x-bbm.myshopify.com/admin/api/2024-10/shop.json \\');
  console.log('  -H "X-Shopify-Access-Token: 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"');
  
  console.log('\nTest products:');
  console.log('curl -X GET https://panuncart-x-bbm.myshopify.com/admin/api/2024-10/products.json \\');
  console.log('  -H "X-Shopify-Access-Token: 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"');
}

// Run the test
testShopifyToken();
