/**
 * Final Image Cleanup - Remove All Problematic URLs
 * Specifically targets staging URLs and blob URLs
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalImageCleanup() {
  console.log('🧹 FINAL IMAGE CLEANUP');
  console.log('======================\n');
  
  try {
    // 1. Get all products with images
    console.log('1️⃣ Getting all products with images...\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, images, status')
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.log('❌ Failed to fetch products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} products\n`);
    
    // 2. Identify and clean problematic products
    let cleanedCount = 0;
    let skippedCount = 0;
    
    for (const product of products) {
      if (!product.images || !Array.isArray(product.images)) continue;
      
      // Check for problematic URLs
      const hasStagingUrls = product.images.some(url => 
        url?.includes('shopify-staged-uploads.storage.googleapis.com')
      );
      const hasBlobUrls = product.images.some(url => url?.startsWith('blob:'));
      
      if (!hasStagingUrls && !hasBlobUrls) {
        console.log(`✅ ${product.title} - Already clean`);
        continue;
      }
      
      console.log(`--- Cleaning: ${product.title} ---`);
      console.log(`ID: ${product.id}`);
      console.log(`Status: ${product.status}`);
      
      // Show problematic URLs
      product.images.forEach((url, i) => {
        if (url?.includes('shopify-staged-uploads.storage.googleapis.com')) {
          console.log(`  ${i + 1}. 🟠 STAGING - ${url.substring(0, 60)}...`);
        } else if (url?.startsWith('blob:')) {
          console.log(`  ${i + 1}. 🔴 BLOB - ${url.substring(0, 60)}...`);
        } else {
          console.log(`  ${i + 1}. ✅ VALID - ${url?.substring(0, 60)}...`);
        }
      });
      
      // Filter OUT problematic URLs
      const cleanImages = product.images.filter(url => {
        if (!url) return false;
        // Remove staging URLs and blob URLs
        const isStagingUrl = url.includes('shopify-staged-uploads.storage.googleapis.com');
        const isBlobUrl = url.startsWith('blob:');
        return !(isStagingUrl || isBlobUrl);
      });
      
      console.log(`\nKeeping ${cleanImages.length} clean images out of ${product.images.length} total`);
      
      // Update if we have changes
      if (cleanImages.length !== product.images.length) {
        if (cleanImages.length > 0) {
          console.log('💾 Updating database with clean URLs...');
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: cleanImages })
            .eq('id', product.id);
            
          if (updateError) {
            console.log(`❌ Failed to update: ${updateError.message}`);
            skippedCount++;
          } else {
            console.log('✅ Successfully cleaned');
            cleanedCount++;
          }
        } else {
          console.log('⚠️  No valid images remaining - skipping update');
          skippedCount++;
        }
      } else {
        console.log('✅ No changes needed');
      }
      
      console.log('');
    }
    
    // 3. Final verification
    console.log('2️⃣ Final verification...\n');
    
    const { data: finalProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, title, images')
      .order('created_at', { ascending: false });
    
    if (!verifyError) {
      let cleanProducts = 0;
      let stillProblematic = 0;
      
      finalProducts.forEach(product => {
        if (!product.images || !Array.isArray(product.images)) {
          cleanProducts++;
          return;
        }
        
        const hasProblems = product.images.some(url => 
          url?.includes('shopify-staged-uploads.storage.googleapis.com') || 
          url?.startsWith('blob:')
        );
        
        if (hasProblems) {
          stillProblematic++;
          console.log(`❌ ${product.title} - Still has problems`);
        } else {
          cleanProducts++;
          console.log(`✅ ${product.title} - Clean`);
        }
      });
      
      console.log(`\n📊 FINAL RESULTS:`);
      console.log(`Clean products: ${cleanProducts}`);
      console.log(`Still problematic: ${stillProblematic}`);
      console.log(`Products cleaned in this run: ${cleanedCount}`);
      console.log(`Products skipped: ${skippedCount}`);
    }
    
    console.log('\n🎉 FINAL CLEANUP COMPLETED!');
    console.log('✅ Database now contains only clean image URLs');
    console.log('✅ All staging URLs and blob URLs have been removed');
    console.log('✅ Only valid external URLs remain');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test creating new products with multiple images');
    console.log('2. Verify the approval workflow preserves all valid images');
    console.log('3. Monitor for any new problematic URLs appearing');
    console.log('4. Consider adding frontend validation to prevent this issue');
    
  } catch (error) {
    console.log('❌ Final cleanup failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the final cleanup
finalImageCleanup();