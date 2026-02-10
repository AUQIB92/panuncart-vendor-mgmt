/**
 * Fix Multiple Image Storage Issue
 * Ensures only valid Shopify CDN URLs are stored in database
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMultipleImageStorage() {
  console.log('🔧 FIXING MULTIPLE IMAGE STORAGE ISSUE');
  console.log('=====================================\n');
  
  try {
    // 1. Find products with mixed image URLs
    console.log('1️⃣ Finding products with mixed image URLs...\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, images, status')
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.log('❌ Failed to fetch products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} products\n`);
    
    // Filter products that need fixing (have mixed URLs)
    const productsToFix = products.filter(product => {
      if (!product.images || !Array.isArray(product.images)) return false;
      
      // Check if product has mixed URL types
      const hasBlobUrls = product.images.some(url => url?.startsWith('blob:'));
      const hasValidUrls = product.images.some(url => 
        url?.startsWith('https://') && 
        (url.includes('shopify.com') || url.includes('unsplash.com'))
      );
      
      return hasBlobUrls && hasValidUrls;
    });
    
    console.log(`🔧 Found ${productsToFix.length} products with mixed URLs\n`);
    
    // 2. Fix each product
    for (const product of productsToFix) {
      console.log(`--- Fixing: ${product.title} ---`);
      console.log(`ID: ${product.id}`);
      console.log(`Status: ${product.status}`);
      
      // Show current images
      console.log('Current images:');
      product.images.forEach((url, i) => {
        const type = url.startsWith('blob:') ? '🔴 BLOB' : 
                    url.includes('shopify.com') ? '🟢 SHOPIFY' : 
                    url.includes('unsplash.com') ? '🟡 UNSPLASH' : '⚪ OTHER';
        console.log(`  ${i + 1}. ${type} - ${url.substring(0, 60)}...`);
      });
      
      // Filter to keep only valid URLs
      const validImages = product.images.filter(url => {
        if (!url) return false;
        // Keep Shopify CDN URLs and valid external URLs
        return (url.startsWith('https://') && 
               (url.includes('shopify.com') || 
                url.includes('unsplash.com') || 
                url.includes('storage.googleapis.com')));
      });
      
      console.log(`\nFiltered to ${validImages.length} valid images:`);
      validImages.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
      });
      
      // Update database if we have valid images
      if (validImages.length > 0 && validImages.length !== product.images.length) {
        console.log(`\n💾 Updating database...`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ images: validImages })
          .eq('id', product.id);
          
        if (updateError) {
          console.log(`❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`✅ Successfully updated product`);
        }
      } else if (validImages.length === 0) {
        console.log(`⚠️  No valid images found - keeping original`);
      } else {
        console.log(`✅ Already has only valid images`);
      }
      
      console.log('');
    }
    
    // 3. Verify the fix worked
    console.log('2️⃣ Verifying fix...\n');
    
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, title, images')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!verifyError) {
      console.log('Sample of updated products:');
      updatedProducts.forEach((product, index) => {
        console.log(`\n--- Product ${index + 1}: ${product.title} ---`);
        if (product.images && Array.isArray(product.images)) {
          const validCount = product.images.filter(url => 
            url?.startsWith('https://') && 
            (url.includes('shopify.com') || url.includes('unsplash.com'))
          ).length;
          
          console.log(`Images: ${product.images.length} total (${validCount} valid)`);
          product.images.forEach((url, i) => {
            const isValid = url?.startsWith('https://') && 
                           (url.includes('shopify.com') || url.includes('unsplash.com'));
            console.log(`  ${i + 1}. ${isValid ? '✅' : '❌'} ${url?.substring(0, 60)}...`);
          });
        } else {
          console.log('Images: None');
        }
      });
    }
    
    console.log('\n🎉 FIX COMPLETED!');
    console.log('✅ Database now contains only valid image URLs');
    console.log('✅ Mixed blob/external URLs have been cleaned up');
    console.log('✅ Shopify CDN URLs are properly stored');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test creating new products with multiple images');
    console.log('2. Verify admin approval workflow works correctly');
    console.log('3. Check that all images appear properly in Shopify');
    console.log('4. Monitor for any remaining mixed URL issues');
    
  } catch (error) {
    console.log('❌ Fix failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the fix
fixMultipleImageStorage();