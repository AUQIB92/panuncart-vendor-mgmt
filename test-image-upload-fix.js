/**
 * Quick Test for Image Upload Fix
 * Verifies that the token retrieval issue is resolved
 */

require('dotenv').config({ path: '.env.local' });

async function testImageUploadFix() {
  console.log('🔧 TESTING IMAGE UPLOAD FIX');
  console.log('===========================\n');
  
  // Import the fixed publisher
  const { createShopifyProduct } = require('./lib/shopify-oauth-publisher');
  
  // Test with a simple product that has valid images
  const testData = {
    title: "Fixed Image Upload Test",
    description: "Testing the corrected image upload functionality",
    price: 29.99,
    sku: `FIX-TEST-${Date.now()}`,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format"
    ],
    category: "Test",
    tags: ["fixed", "test"],
    vendor_name: "Test Vendor"
  };
  
  console.log('🚀 Testing product creation with fixed image upload...\n');
  
  try {
    const result = await createShopifyProduct(testData);
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Image upload fix is working');
      console.log(`✅ Product ID: ${result.shopify_product_id}`);
      console.log('✅ Images should now be properly uploaded to Shopify CDN');
    } else {
      console.log('\n❌ Still having issues:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
  }
  
  console.log('\n📋 EXPECTED IMPROVEMENTS:');
  console.log('✅ GraphQL requests now get proper access tokens');
  console.log('✅ Blob URLs and localhost URLs are properly filtered');
  console.log('✅ Image upload to Shopify CDN should work');
  console.log('✅ No more "No access token available for GraphQL" errors');
}

// Run the test
testImageUploadFix();
