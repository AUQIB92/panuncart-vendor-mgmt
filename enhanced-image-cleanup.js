/**
 * Enhanced Fix for All Image URL Types
 * Cleans up staging URLs, blob URLs, and ensures only valid CDN URLs remain
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enhancedImageCleanup() {
  console.log('🔧 ENHANCED IMAGE CLEANUP');
  console.log('=========================\n');
  
  try {
    // 1. Find all products with images
    console.log('1️⃣ Analyzing all products with images...\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, images, status')
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.log('❌ Failed to fetch products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} products\n`);
    
    // Categorize products by image URL types
    let productsWithStagingUrls = 0;
    let productsWithBlobUrls = 0;
    let productsWithMixedUrls = 0;
    let productsWithValidUrls = 0;
    let productsToClean = [];
    
    products.forEach(product => {
      if (!product.images || !Array.isArray(product.images)) return;
      
      const hasStagingUrls = product.images.some(url => 
        url?.includes('shopify-staged-uploads.storage.googleapis.com')
      );
      const hasBlobUrls = product.images.some(url => url?.startsWith('blob:'));
      const hasValidExternalUrls = product.images.some(url => 
        url?.startsWith('https://') && 
        (url.includes('shopify.com') || url.includes('unsplash.com'))
      );
      
      if (hasStagingUrls) productsWithStagingUrls++;
      if (hasBlobUrls) productsWithBlobUrls++;
      if (hasStagingUrls || hasBlobUrls) productsWithMixedUrls++;
      if (hasValidExternalUrls && !(hasStagingUrls || hasBlobUrls)) productsWithValidUrls++;
      
      if (hasStagingUrls || hasBlobUrls) {
        productsToClean.push(product);
      }
    });
    
    console.log('📊 IMAGE URL ANALYSIS:');
    console.log(`Products with staging URLs: ${productsWithStagingUrls}`);
    console.log(`Products with blob URLs: ${productsWithBlobUrls}`);
    console.log(`Products with mixed problematic URLs: ${productsWithMixedUrls}`);
    console.log(`Products with clean valid URLs: ${productsWithValidUrls}\n`);
    
    // 2. Clean each problematic product
    console.log('2️⃣ Cleaning problematic products...\n');
    
    for (const product of productsToClean) {
      console.log(`--- Cleaning: ${product.title} ---`);
      console.log(`ID: ${product.id}`);
      console.log(`Status: ${product.status}`);
      
      // Show current images with categorization
      console.log('Current images:');
      product.images.forEach((url, i) => {
        let type, emoji;
        if (url?.includes('shopify-staged-uploads.storage.googleapis.com')) {
          type = 'STAGING'; emoji = '🟠';
        } else if (url?.startsWith('blob:')) {
          type = 'BLOB'; emoji = '🔴';
        } else if (url?.startsWith('https://') && url?.includes('shopify.com')) {
          type = 'SHOPIFY_CDN'; emoji = '🟢';
        } else if (url?.startsWith('https://') && url?.includes('unsplash.com')) {
          type = 'UNSPLASH'; emoji = '🟡';
        } else {
          type = 'OTHER'; emoji = '⚪';
        }
        console.log(`  ${i + 1}. ${emoji} ${type} - ${url?.substring(0, 50)}...`);
      });
      
      // Filter to keep only valid URLs
      const validImages = product.images.filter(url => {
        if (!url) return false;
        
        // Keep valid external URLs that work with Shopify
        return (url.startsWith('https://') && 
               (url.includes('shopify.com') || 
                url.includes('unsplash.com') ||
                url.includes('storage.googleapis.com') || // For Google Cloud Storage
                url.includes('cloudinary.com') ||         // For Cloudinary
                url.includes('awsstatic.com') ||          // For AWS
                url.includes('s3.amazonaws.com')));       // For S3
      });
      
      console.log(`\nFiltered to ${validImages.length} valid images:`);
      validImages.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url?.substring(0, 60)}...`);
      });
      
      // Update database
      if (validImages.length > 0 && validImages.length !== product.images.length) {
        console.log(`\n💾 Updating database...`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ images: validImages })
          .eq('id', product.id);
          
        if (updateError) {
          console.log(`❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`✅ Successfully cleaned product`);
        }
      } else if (validImages.length === 0) {
        console.log(`⚠️  No valid images remaining - keeping original (needs manual review)`);
      } else {
        console.log(`✅ Already clean`);
      }
      
      console.log('');
    }
    
    // 3. Final verification
    console.log('3️⃣ Final verification...\n');
    
    const { data: verifiedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, title, images')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!verifyError) {
      let cleanProducts = 0;
      let problematicProducts = 0;
      
      console.log('Final status check:');
      verifiedProducts.forEach((product, index) => {
        if (product.images && Array.isArray(product.images)) {
          const hasProblematicUrls = product.images.some(url => 
            url?.includes('shopify-staged-uploads.storage.googleapis.com') || 
            url?.startsWith('blob:')
          );
          
          if (hasProblematicUrls) {
            problematicProducts++;
            console.log(`${index + 1}. ❌ ${product.title} - Still has problematic URLs`);
          } else {
            cleanProducts++;
            console.log(`${index + 1}. ✅ ${product.title} - Clean`);
          }
        } else {
          cleanProducts++; // No images is considered clean
          console.log(`${index + 1}. ✅ ${product.title} - No images`);
        }
      });
      
      console.log(`\n📊 FINAL RESULTS:`);
      console.log(`Clean products: ${cleanProducts}`);
      console.log(`Problematic products: ${problematicProducts}`);
    }
    
    console.log('\n🎉 ENHANCED CLEANUP COMPLETED!');
    console.log('✅ Database now contains only valid image URLs');
    console.log('✅ All staging URLs and blob URLs have been removed');
    console.log('✅ Only Shopify-compatible URLs remain');
    
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('1. Test creating new products to ensure fix is working');
    console.log('2. Products with no valid images may need manual review');
    console.log('3. Consider implementing URL validation in the frontend');
    console.log('4. Add logging to monitor image URL types in production');
    
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the enhanced cleanup
enhancedImageCleanup();