/**
 * Debug Multiple Image Storage Issue
 * Investigate why only one image URL is stored in database instead of all uploaded images
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMultipleImages() {
  console.log('🔍 DEBUGGING MULTIPLE IMAGE STORAGE ISSUE');
  console.log('========================================\n');
  
  try {
    // 1. Check current products with images
    console.log('1️⃣ Checking products with images in database...\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, images, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (productsError) {
      console.log('❌ Failed to fetch products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} products\n`);
    
    // Analyze image storage patterns
    let productsWithImages = 0;
    let productsWithMultipleImages = 0;
    let productsWithSingleImage = 0;
    let productsWithEmptyImages = 0;
    
    products.forEach((product, index) => {
      console.log(`--- Product ${index + 1}: ${product.title} ---`);
      console.log(`ID: ${product.id}`);
      console.log(`Status: ${product.status}`);
      console.log(`Created: ${product.created_at}`);
      
      if (product.images) {
        productsWithImages++;
        const imageCount = Array.isArray(product.images) ? product.images.length : 0;
        console.log(`Images: ${imageCount} image(s)`);
        
        if (imageCount > 1) {
          productsWithMultipleImages++;
          console.log('✅ Has multiple images');
        } else if (imageCount === 1) {
          productsWithSingleImage++;
          console.log('⚠️  Has only one image');
        }
        
        // Show image URLs
        if (Array.isArray(product.images)) {
          product.images.forEach((url, imgIndex) => {
            console.log(`  Image ${imgIndex + 1}: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
            
            // Check URL type
            if (url.startsWith('https://cdn.shopify.com/')) {
              console.log('    🟢 Shopify CDN URL');
            } else if (url.startsWith('blob:')) {
              console.log('    🔴 Blob URL (local)');
            } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
              console.log('    🔴 Localhost URL');
            } else {
              console.log('    🟡 External URL');
            }
          });
        }
      } else {
        productsWithEmptyImages++;
        console.log('❌ No images array');
      }
      console.log('');
    });
    
    // Summary statistics
    console.log('📊 IMAGE STORAGE ANALYSIS:');
    console.log('==========================');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products with images: ${productsWithImages}`);
    console.log(`Products with multiple images: ${productsWithMultipleImages}`);
    console.log(`Products with single image: ${productsWithSingleImage}`);
    console.log(`Products with empty images: ${productsWithEmptyImages}`);
    
    // Calculate percentages
    if (productsWithImages > 0) {
      const multipleImagePercentage = ((productsWithMultipleImages / productsWithImages) * 100).toFixed(1);
      const singleImagePercentage = ((productsWithSingleImage / productsWithImages) * 100).toFixed(1);
      
      console.log(`\n📈 PERCENTAGES:`);
      console.log(`Multiple images: ${multipleImagePercentage}%`);
      console.log(`Single image: ${singleImagePercentage}%`);
    }
    
    // 2. Check recent product creation flow
    console.log('\n2️⃣ Testing multiple image upload flow...\n');
    
    // Simulate what happens when a product is created with multiple images
    const testImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format"
    ];
    
    console.log(`Testing with ${testImages.length} sample images:`);
    testImages.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
    });
    
    // Check if the publisher handles multiple images correctly
    console.log('\n3️⃣ Verifying publisher image handling...\n');
    
    // Mock the publisher logic to see what gets processed
    const imageNodes = [];
    for (let i = 0; i < testImages.length; i++) {
      const imageUrl = testImages[i];
      try {
        // This mimics the validation in createShopifyProduct
        const url = new URL(imageUrl);
        
        // Check if it would be skipped
        const wouldBeSkipped = (
          url.protocol === 'blob:' || 
          url.protocol === 'data:' ||
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
        ) && !url.hostname.includes('shopify.com');
        
        if (wouldBeSkipped) {
          console.log(`❌ Would skip image ${i + 1}: ${imageUrl.substring(0, 50)}...`);
        } else {
          console.log(`✅ Would process image ${i + 1}: ${imageUrl.substring(0, 50)}...`);
          imageNodes.push({ src: `mock-cdn-url-${i + 1}` }); // Mock CDN URL
        }
      } catch (e) {
        console.log(`❌ Invalid URL ${i + 1}: ${imageUrl}`);
      }
    }
    
    console.log(`\nResult: ${imageNodes.length} images would be sent to Shopify out of ${testImages.length} provided`);
    
    // 4. Check database insertion patterns
    console.log('\n4️⃣ Checking how images are stored in database...\n');
    
    // Look at the product creation RPC function
    const { data: functions, error: funcError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname IN ('insert_my_product', 'update_my_product')
        LIMIT 1;
      `
    });
    
    if (!funcError && functions.length > 0) {
      console.log('✅ Found product insertion functions');
      // We can't easily inspect the function source, but we know the signature
      console.log('Function expects images parameter as text[] array');
    }
    
    // 5. Recommendations
    console.log('\n📋 POTENTIAL ISSUES IDENTIFIED:');
    console.log('================================');
    
    if (productsWithSingleImage > productsWithMultipleImages) {
      console.log('🔴 Most products only have one image stored');
      console.log('   Possible causes:');
      console.log('   • Frontend only sends one image URL despite multiple uploads');
      console.log('   • Database truncates or overwrites image array');
      console.log('   • Publisher only processes one image successfully');
    }
    
    if (productsWithEmptyImages > 0) {
      console.log('🔴 Some products have empty/null images arrays');
      console.log('   Possible causes:');
      console.log('   • Image upload failed completely');
      console.log('   • Validation filtered out all images');
      console.log('   • Database insertion issue');
    }
    
    console.log('\n🔧 RECOMMENDED DEBUGGING STEPS:');
    console.log('1. Check frontend image uploader component');
    console.log('2. Verify onImagesChange callback receives all URLs');
    console.log('3. Monitor database insertion with logging');
    console.log('4. Test product creation with multiple images manually');
    console.log('5. Check if images are being overwritten during approval');
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the debug
debugMultipleImages();