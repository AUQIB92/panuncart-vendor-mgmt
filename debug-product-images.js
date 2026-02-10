/**
 * Debug Product Image Data
 * Check what image URLs are stored in the database
 */

require('dotenv').config({ path: '.env.local' });

async function debugProductImages() {
  console.log('🔍 DEBUGGING PRODUCT IMAGE DATA');
  console.log('===============================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get all products with their images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, images, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Failed to fetch products:', error.message);
      return;
    }
    
    console.log(`📊 Found ${products.length} products:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`);
      
      if (product.images && Array.isArray(product.images)) {
        console.log(`   Images (${product.images.length}):`);
        product.images.forEach((url, imgIndex) => {
          console.log(`     ${imgIndex + 1}. ${url}`);
          
          // Validate URL
          try {
            new URL(url);
            console.log(`        ✅ Valid URL`);
          } catch (e) {
            console.log(`        ❌ INVALID URL: ${e.message}`);
          }
        });
      } else {
        console.log(`   Images: None or invalid format`);
      }
      console.log('');
    });
    
    // Check for products with invalid image URLs
    const productsWithInvalidUrls = products.filter(product => 
      product.images && 
      Array.isArray(product.images) && 
      product.images.some(url => {
        try {
          new URL(url);
          return false;
        } catch (e) {
          return true;
        }
      })
    );
    
    if (productsWithInvalidUrls.length > 0) {
      console.log('⚠️  PRODUCTS WITH INVALID IMAGE URLS:');
      productsWithInvalidUrls.forEach(product => {
        console.log(`   • ${product.title} (${product.id})`);
      });
    } else {
      console.log('✅ All product image URLs appear to be valid');
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugProductImages();
