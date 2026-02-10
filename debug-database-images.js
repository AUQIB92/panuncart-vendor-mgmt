/**
 * Debug Database Image Storage
 * Check exactly what image URLs are being stored in the database
 */

require('dotenv').config({ path: '.env.local' });

async function debugDatabaseImageStorage() {
  console.log('🔍 DEBUGGING DATABASE IMAGE STORAGE');
  console.log('====================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Get recent products ordered by creation date
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, images, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Failed to fetch products:', error.message);
      return;
    }
    
    console.log(`📊 Analyzing ${products.length} most recent products:\n`);
    
    for (const [index, product] of products.entries()) {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`);
      
      if (product.images && Array.isArray(product.images)) {
        console.log(`   📷 Images (${product.images.length} total):`);
        
        product.images.forEach((url, imgIndex) => {
          const urlObj = new URL(url);
          const isBlob = url.startsWith('blob:');
          const isData = url.startsWith('data:');
          const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
          const isShopifyCDN = urlObj.hostname.includes('shopify.com');
          
          let statusIcon = '❓';
          let statusText = 'Unknown';
          
          if (isBlob) {
            statusIcon = '🔴';
            statusText = 'Blob URL (Temporary)';
          } else if (isData) {
            statusIcon = '🔴';
            statusText = 'Data URL (Inline)';
          } else if (isLocalhost) {
            statusIcon = '🔴';
            statusText = 'Localhost URL (Inaccessible)';
          } else if (isShopifyCDN) {
            statusIcon = '🟢';
            statusText = 'Shopify CDN URL (Valid)';
          } else {
            statusIcon = '🟡';
            statusText = 'External URL (May be invalid)';
          }
          
          console.log(`     ${statusIcon} ${imgIndex + 1}. ${statusText}`);
          console.log(`        ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
        });
        
        // Count different types
        const blobCount = product.images.filter(url => url.startsWith('blob:')).length;
        const dataCount = product.images.filter(url => url.startsWith('data:')).length;
        const localhostCount = product.images.filter(url => {
          try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
          } catch {
            return false;
          }
        }).length;
        const shopifyCDNCount = product.images.filter(url => {
          try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('shopify.com');
          } catch {
            return false;
          }
        }).length;
        
        console.log(`   📊 Summary:`);
        console.log(`      Shopify CDN URLs: ${shopifyCDNCount}`);
        console.log(`      Blob URLs: ${blobCount}`);
        console.log(`      Data URLs: ${dataCount}`);
        console.log(`      Localhost URLs: ${localhostCount}`);
        console.log(`      Other URLs: ${product.images.length - blobCount - dataCount - localhostCount - shopifyCDNCount}`);
        
        if (shopifyCDNCount === product.images.length) {
          console.log(`   ✅ ALL IMAGES ARE VALID SHOPIFY CDN URLs`);
        } else if (shopifyCDNCount > 0) {
          console.log(`   ⚠️  MIXED URL TYPES - ${shopifyCDNCount} valid, ${product.images.length - shopifyCDNCount} invalid`);
        } else {
          console.log(`   ❌ NO VALID SHOPIFY CDN URLs FOUND`);
        }
        
      } else {
        console.log(`   📷 No images stored`);
      }
      
      console.log('');
    }
    
    // Overall statistics
    console.log('📈 OVERALL STATISTICS:');
    const totalProducts = products.length;
    const productsWithImages = products.filter(p => p.images && p.images.length > 0).length;
    const productsWithAllValidImages = products.filter(p => {
      if (!p.images || p.images.length === 0) return false;
      return p.images.every(url => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.includes('shopify.com');
        } catch {
          return false;
        }
      });
    }).length;
    
    console.log(`Total products analyzed: ${totalProducts}`);
    console.log(`Products with images: ${productsWithImages}`);
    console.log(`Products with all valid Shopify CDN images: ${productsWithAllValidImages}`);
    console.log(`Success rate: ${totalProducts > 0 ? Math.round((productsWithAllValidImages / totalProducts) * 100) : 0}%`);
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Run the debug
if (require.main === module) {
  debugDatabaseImageStorage()
    .then(() => {
      console.log('\n' + '='.repeat(50));
      console.log('🔍 DATABASE IMAGE ANALYSIS COMPLETE');
      console.log('='.repeat(50));
      process.exit(0);
    })
    .catch(error => {
      console.log('\n💥 DEBUG CRASHED:', error.message);
      process.exit(1);
    });
}

module.exports = { debugDatabaseImageStorage };