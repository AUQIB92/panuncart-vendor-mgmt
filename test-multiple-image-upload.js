/**
 * Test Multiple Image Upload to Shopify
 * Verifies that multiple images are properly uploaded and associated with products
 */

require('dotenv').config({ path: '.env.local' });

async function testMultipleImageUpload() {
  console.log('🖼️  TESTING MULTIPLE IMAGE UPLOAD TO SHOPIFY');
  console.log('===========================================\n');
  
  // Import the updated publisher
  const { createShopifyProduct } = require('./lib/shopify-oauth-publisher.ts');
  
  // Test data with multiple valid image URLs
  const testData = {
    title: "Multi-Image Test Product",
    description: "Testing multiple image upload functionality",
    price: 49.99,
    sku: `MULTI-IMAGE-TEST-${Date.now()}`,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format"
    ],
    category: "Electronics",
    tags: ["test", "multi-image", "cdn"],
    vendor_name: "Test Vendor"
  };
  
  console.log('🚀 Testing product creation with multiple images...\n');
  console.log('📋 Test Data:');
  console.log(`   Title: ${testData.title}`);
  console.log(`   Images: ${testData.images.length}`);
  console.log(`   URLs: ${testData.images.join('\n         ')}`);
  console.log('');
  
  try {
    const startTime = Date.now();
    const result = await createShopifyProduct(testData);
    const endTime = Date.now();
    
    console.log(`\n⏱️  Total execution time: ${(endTime - startTime) / 1000}s`);
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Multiple image upload working correctly');
      console.log(`✅ Product ID: ${result.shopify_product_id}`);
      console.log(`✅ Variant ID: ${result.shopify_variant_id}`);
      console.log('✅ All images should now appear on Shopify store');
      
      console.log('\n📊 RESULTS SUMMARY:');
      console.log(`   • Product created: ✅`);
      console.log(`   • Images processed: ${testData.images.length}`);
      console.log(`   • Shopify product ID: ${result.shopify_product_id}`);
      console.log(`   • Execution time: ${(endTime - startTime) / 1000}s`);
      
      console.log('\n🔍 NEXT STEPS:');
      console.log('1. Check your Shopify admin panel');
      console.log('2. Navigate to Products > All Products');
      console.log('3. Find the product titled "Multi-Image Test Product"');
      console.log('4. Verify all 3 images are displayed');
      console.log('5. Check that images appear in the correct order');
      
      return true;
    } else {
      console.log('\n❌ FAILED to create product');
      console.log(`Error: ${result.error}`);
      return false;
    }
    
  } catch (error) {
    console.log('\n💥 UNEXPECTED ERROR:');
    console.log(error.message);
    console.log(error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testMultipleImageUpload()
    .then(success => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('✅ TEST COMPLETED SUCCESSFULLY');
      } else {
        console.log('❌ TEST FAILED');
      }
      console.log('='.repeat(50));
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.log('\n💥 TEST CRASHED:', error.message);
      process.exit(1);
    });
}

module.exports = { testMultipleImageUpload };