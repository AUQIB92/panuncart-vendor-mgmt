/**
 * Clean Invalid Product Image Data
 * Remove products with invalid image URLs
 */

require('dotenv').config({ path: '.env.local' });

async function cleanInvalidImages() {
  console.log('🧹 CLEANING INVALID PRODUCT IMAGE DATA');
  console.log('=====================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get all products with their images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, images, status')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Failed to fetch products:', error.message);
      return;
    }
    
    console.log(`📊 Checking ${products.length} products for invalid images...\n`);
    
    let cleanedCount = 0;
    
    for (const product of products) {
      if (product.images && Array.isArray(product.images)) {
        const invalidUrls = product.images.filter(url => {
          try {
            new URL(url);
            return false;
          } catch (e) {
            return true;
          }
        });
        
        if (invalidUrls.length > 0) {
          console.log(`🔧 Cleaning product: ${product.title}`);
          console.log(`   Invalid URLs: ${invalidUrls.join(', ')}`);
          
          // Update the product to remove invalid URLs
          const validImages = product.images.filter(url => {
            try {
              new URL(url);
              return true;
            } catch (e) {
              return false;
            }
          });
          
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: validImages.length > 0 ? validImages : null })
            .eq('id', product.id);
          
          if (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}`);
          } else {
            console.log(`   ✅ Cleaned successfully`);
            cleanedCount++;
          }
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete! Cleaned ${cleanedCount} products.`);
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: verifiedProducts } = await supabase
      .from('products')
      .select('id, title, images')
      .order('created_at', { ascending: false })
      .limit(5);
    
    verifiedProducts.forEach(product => {
      if (product.images && Array.isArray(product.images)) {
        const hasInvalid = product.images.some(url => {
          try {
            new URL(url);
            return false;
          } catch (e) {
            return true;
          }
        });
        
        if (hasInvalid) {
          console.log(`⚠️  Still has invalid URLs: ${product.title}`);
        }
      }
    });
    
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
  }
}

// Run the cleanup
cleanInvalidImages();
