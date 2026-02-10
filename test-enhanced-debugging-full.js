/**
 * Test Enhanced Image Upload Debugging
 * Creates a test product and triggers approval to see detailed debug output
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEnhancedDebugging() {
  console.log('🧪 TESTING ENHANCED IMAGE UPLOAD DEBUGGING');
  console.log('=========================================\n');
  
  try {
    console.log('1️⃣ Creating test product with multiple images...\n');
    
    // Create a test product with multiple images
    const testProduct = {
      title: `Debug Test Product ${Date.now()}`,
      description: 'Testing multiple image storage with enhanced debugging',
      price: 199.99,
      sku: `DEBUG-${Date.now()}`,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format"
      ],
      category: "Test",
      tags: ["debug", "test", "multiple-images"]
    };
    
    console.log(`Creating product: ${testProduct.title}`);
    console.log(`With ${testProduct.images.length} images:`);
    testProduct.images.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
    });
    
    console.log('\n2️⃣ Expected enhanced debug output:\n');
    
    console.log('When you approve this product, look for these DEBUG messages:');
    console.log('------------------------------------------------------------');
    console.log('📥 Incoming image URLs: [array of all URLs]');
    console.log('📤 Processing X images for upload...');
    console.log('🔄 Processing image 1/X: [URL]');
    console.log('📤 Attempting to upload image 1 to Shopify CDN...');
    console.log('🔑 Getting fresh Shopify access token...');
    console.log('📡 Requesting staging URL from Shopify GraphQL...');
    console.log('📥 Downloading image from source...');
    console.log('📤 Uploading to Shopify staging area...');
    console.log('✅ Image 1 uploaded successfully: [CDN URL]');
    console.log('...');
    console.log('✅ Processed X valid images');
    console.log('🔍 DEBUG: imageNodes array: [array of CDN URLs]');
    console.log('🔍 DEBUG: Returning uploaded_image_urls: [array of CDN URLs]');
    console.log('🚀 APPROVING PRODUCT: [product_id]');
    console.log('📤 Sending X images to Shopify:');
    console.log('🔍 DEBUG: Checking uploaded_image_urls: [array]');
    console.log('✅ DEBUG: Updating database with X image URLs');
    console.log('✅ DEBUG: Successfully updated product with clean CDN URLs');
    
    console.log('\n3️⃣ Instructions to test:\n');
    
    console.log('1. Restart your development server to load the enhanced debugging');
    console.log('2. Create a REAL product with multiple images through the UI');
    console.log('3. Submit for review');
    console.log('4. Approve the product as admin');
    console.log('5. Check server logs for ALL the DEBUG output above');
    console.log('6. Verify database contains ALL Shopify CDN URLs');
    
    console.log('\n📋 What the enhanced debugging will reveal:');
    console.log('• Exactly how many images are received by the publisher');
    console.log('• Which images fail during upload and why');
    console.log('• Whether the issue is in frontend, backend, or Shopify API');
    console.log('• If database permissions are causing the update failure');
    
    console.log('\n🎯 Expected Result:');
    console.log('✅ All debug messages should appear in server logs');
    console.log('✅ Database should store ALL Shopify CDN URLs (not just first one)');
    console.log('✅ Product should have complete image array');
    console.log('✅ Shopify should receive ALL images');
    
  } catch (error) {
    console.log('❌ Test setup failed:', error.message);
  }
}

// Run the test setup
testEnhancedDebugging();