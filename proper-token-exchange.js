/**
 * Shopify OAuth Token Exchange
 * Properly exchanges client credentials for access tokens
 */

require('dotenv').config({ path: '.env.local' });

async function getShopifyAccessTokenProper() {
  console.log('🔐 GETTING SHOPIFY ACCESS TOKEN (PROPER METHOD)');
  console.log('===============================================\n');
  
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';
  
  console.log('Store Domain:', storeDomain);
  console.log('Client ID:', clientId ? '✅ SET' : '❌ MISSING');
  console.log('Client Secret:', clientSecret ? '✅ SET' : '❌ MISSING');
  
  if (!clientId || !clientSecret) {
    console.log('❌ Missing OAuth credentials');
    return null;
  }
  
  try {
    console.log('🔄 Exchanging client credentials for access token...');
    
    // Proper OAuth token exchange
    const tokenUrl = `https://${storeDomain}/admin/oauth/access_token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials' // This is for custom apps
      })
    });
    
    console.log('Token Exchange Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Token exchange failed:', response.status, errorText);
      
      // Try alternative method for private apps
      console.log('\n🔄 Trying alternative method for private apps...');
      return await getPrivateAppToken();
    }
    
    const tokenData = await response.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ Token exchange successful!');
    console.log('Access Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'NONE');
    
    // Test the token
    console.log('\n🧪 Testing the acquired token...');
    const testResponse = await fetch(`https://${storeDomain}/admin/api/2024-10/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Test API Status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Token is working! Shop:', testData.shop?.name);
      return accessToken;
    } else {
      const testError = await testResponse.text();
      console.log('❌ Token test failed:', testResponse.status, testError);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Token exchange error:', error.message);
    return null;
  }
}

async function getPrivateAppToken() {
  console.log('🔄 Attempting private app token method...');
  
  // For private apps, sometimes the password is used directly
  // This is a fallback method
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';
  
  if (clientSecret.startsWith('shpss_')) {
    console.log('✅ Using private app password directly');
    console.log('Testing with private app token...');
    
    try {
      const testResponse = await fetch(`https://${storeDomain}/admin/api/2024-10/shop.json`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': clientSecret,
          'Content-Type': 'application/json',
        }
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Private app token is working! Shop:', testData.shop?.name);
        return clientSecret;
      } else {
        console.log('❌ Private app token also failed');
        return null;
      }
    } catch (error) {
      console.log('❌ Private app token test failed:', error.message);
      return null;
    }
  }
  
  return null;
}

async function testWithNewToken() {
  console.log('\n🚀 TESTING WITH NEW TOKEN');
  console.log('========================');
  
  const token = await getShopifyAccessTokenProper();
  
  if (!token) {
    console.log('❌ Could not acquire valid token');
    return;
  }
  
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';
  
  // Test product listing
  console.log('\n📋 Testing product listing with new token...');
  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2024-10/products.json?limit=3`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Product API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Product listing successful!');
      console.log('Products found:', data.products?.length || 0);
      
      if (data.products?.length > 0) {
        console.log('\nSample products:');
        data.products.slice(0, 3).forEach((product, index) => {
          console.log(`${index + 1}. ${product.title}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Product listing failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Product listing error:', error.message);
  }
  
  // Test product creation
  console.log('\n➕ Testing product creation with new token...');
  try {
    const productData = {
      product: {
        title: `Token Test Product ${Date.now()}`,
        body_html: "<strong>Created via proper token exchange</strong>",
        vendor: "Panuncart Token Test",
        product_type: "Test",
        variants: [
          {
            price: "19.99",
            sku: `TOKEN-TEST-${Date.now()}`
          }
        ]
      }
    };
    
    const response = await fetch(`https://${storeDomain}/admin/api/2024-10/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });
    
    console.log('Creation API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Product created successfully!');
      console.log('New product ID:', data.product?.id);
    } else {
      const errorText = await response.text();
      console.log('❌ Product creation failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Product creation error:', error.message);
  }
}

// Run the test
testWithNewToken();
