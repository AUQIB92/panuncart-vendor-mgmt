/**
 * Debug Image Array Flow
 * Traces how image URLs flow from frontend to database
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugImageFlow() {
  console.log('🔍 DEBUGGING IMAGE ARRAY FLOW');
  console.log('==============================\n');
  
  try {
    // 1. Check a recent product with multiple images to see what's stored
    console.log('1️⃣ Checking recent multi-image products...\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, images, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (productsError) {
      console.log('❌ Failed to fetch products:', productsError.message);
      return;
    }
    
    // Find a product with multiple images
    const multiImageProduct = products.find(p => 
      p.images && Array.isArray(p.images) && p.images.length > 1
    );
    
    if (multiImageProduct) {
      console.log(`Found product with multiple images: ${multiImageProduct.title}`);
      console.log(`ID: ${multiImageProduct.id}`);
      console.log(`Status: ${multiImageProduct.status}`);
      console.log(`Image count: ${multiImageProduct.images.length}`);
      console.log('Stored URLs:');
      multiImageProduct.images.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
      });
      console.log('');
    } else {
      console.log('No products with multiple images found in recent records\n');
    }
    
    // 2. Check the product creation flow by examining the code paths
    console.log('2️⃣ Analyzing code flow...\n');
    
    console.log('FRONTEND FLOW:');
    console.log('1. bulk-image-uploader.tsx handles file selection');
    console.log('2. uploadImageToShopifyCDN() uploads each image to Shopify');
    console.log('3. handleImagesChange() should pass ALL valid URLs as array');
    console.log('4. Product form collects imageUrls array');
    console.log('5. onSubmit passes imageUrls to backend\n');
    
    console.log('BACKEND FLOW:');
    console.log('1. API route receives product data with images array');
    console.log('2. createShopifyProduct() processes ALL images in the array');
    console.log('3. uploadImageToShopify() called for each image');
    console.log('4. imageNodes array built with ALL CDN URLs');
    console.log('5. Shopify API called with complete images array');
    console.log('6. Database should be updated with ALL URLs\n');
    
    // 3. Let's simulate the flow with test data
    console.log('3️⃣ Simulating image processing flow...\n');
    
    // Test data - simulate what frontend should send
    const testImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format"
    ];
    
    console.log(`Testing with ${testImages.length} sample images:`);
    testImages.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
    });
    
    // Simulate frontend filtering
    const frontendFiltered = testImages.filter(url => 
      url.startsWith('https://') &&
      (url.includes('shopify.com') || url.includes('unsplash.com') || url.includes('storage.googleapis.com'))
    );
    
    console.log(`\nFrontend would filter to ${frontendFiltered.length} valid URLs:`);
    frontendFiltered.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
    });
    
    // Simulate backend processing
    console.log(`\nBackend would process all ${frontendFiltered.length} URLs and upload to Shopify`);
    console.log('Resulting CDN URLs array would contain ALL processed images');
    
    console.log('\n📋 POTENTIAL ISSUES:');
    console.log('• Frontend might be sending only first URL somehow');
    console.log('• Backend processing might stop after first image');
    console.log('• Database update might truncate the array');
    console.log('• Approval workflow might overwrite with partial data');
    
    console.log('\n🔧 DEBUGGING NEXT STEPS:');
    console.log('1. Add console.log in bulk-image-uploader to see what URLs it sends');
    console.log('2. Add console.log in product form to see collected imageUrls');
    console.log('3. Add console.log in API route to see received images array');
    console.log('4. Add console.log in createShopifyProduct to see imageNodes built');
    console.log('5. Add console.log in approval route to see final database update');
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugImageFlow();