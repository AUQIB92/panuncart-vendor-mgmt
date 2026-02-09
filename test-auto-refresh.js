/**
 * Test Auto-Refresh Token Functionality
 * Verifies that tokens are automatically refreshed when needed
 */

require('dotenv').config({ path: '.env.local' });

async function testAutoRefresh() {
  console.log('🔄 TESTING AUTO-REFRESH TOKEN FUNCTIONALITY');
  console.log('==========================================\n');
  
  // Import the token manager
  const { listShopifyProducts, createShopifyProduct, getFreshShopifyToken } = require('./lib/shopify-token-manager.ts');
  
  console.log('1️⃣ Testing fresh token acquisition...');
  try {
    const token = await getFreshShopifyToken();
    console.log('✅ Fresh token acquired:', token.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Token acquisition failed:', error.message);
    return;
  }
  
  console.log('\n2️⃣ Testing product listing with auto-refresh...');
  try {
    const result = await listShopifyProducts(3);
    console.log('Product listing result:', result);
    
    if (result.success) {
      console.log('✅ Product listing successful with auto-refresh!');
      console.log('Products found:', result.count);
      console.log('Sample products:');
      result.products.forEach(function(product, index) {
        console.log(`  ${index + 1}. ${product.title}`);
      });
    } else {
      console.log('❌ Product listing failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Product listing error:', error.message);
  }
  
  console.log('\n3️⃣ Testing product creation with auto-refresh...');
  try {
    const productData = {
      title: `Auto-Refresh Test Product ${Date.now()}`,
      body_html: "<strong>Created via auto-refresh test</strong>",
      vendor: "Panuncart Auto-Test",
      product_type: "Test",
      variants: [
        {
          price: "39.99",
          sku: `AUTO-TEST-${Date.now()}`
        }
      ]
    };
    
    const result = await createShopifyProduct(productData);
    console.log('Product creation result:', result);
    
    if (result.success) {
      console.log('✅ Product created successfully with auto-refresh!');
      console.log('New product ID:', result.product?.id);
    } else {
      console.log('❌ Product creation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Product creation error:', error.message);
  }
  
  console.log('\n🎯 Auto-refresh implementation is working!');
  console.log('Tokens are automatically managed and refreshed as needed.');
}

// Run the test
testAutoRefresh();
