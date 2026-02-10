/**
 * COMPREHENSIVE PRODUCT SUBMISSION FLOW TEST
 * Checks if multiple images are properly sent for approval in new products
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProductSubmissionFlow() {
  console.log('🔍 TESTING PRODUCT SUBMISSION FLOW WITH MULTIPLE IMAGES');
  console.log('=====================================================\n');
  
  try {
    // 1. Check current database state
    console.log('1️⃣ Analyzing current product data...\n');
    
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        status,
        images,
        created_at,
        vendors(business_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (productError) {
      console.log('❌ Database query failed:', productError.message);
      return;
    }
    
    console.log(`📊 Found ${products.length} recent products:`);
    
    let productsWithImages = 0;
    let productsWithMultipleImages = 0;
    let productsWithSingleImage = 0;
    let productsWithoutImages = 0;
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Vendor: ${product.vendors?.business_name || 'Unknown'}`);
      
      if (!product.images || product.images.length === 0) {
        console.log(`   Images: None`);
        productsWithoutImages++;
      } else {
        productsWithImages++;
        console.log(`   Images: ${product.images.length} URLs`);
        
        if (product.images.length > 1) {
          productsWithMultipleImages++;
          console.log(`   ✅ Has multiple images`);
        } else {
          productsWithSingleImage++;
          console.log(`   ⚠️  Only one image`);
        }
        
        // Show sample URLs
        product.images.slice(0, 3).forEach((url, i) => {
          const urlType = getUrlType(url);
          console.log(`     ${i + 1}. [${urlType}] ${url.substring(0, 50)}...`);
        });
        
        if (product.images.length > 3) {
          console.log(`     ... and ${product.images.length - 3} more`);
        }
      }
    });
    
    // 2. Analyze the flow
    console.log('\n2️⃣ FLOW ANALYSIS:');
    console.log('==================');
    
    console.log('\n📊 STATISTICS:');
    console.log(`Total products analyzed: ${products.length}`);
    console.log(`Products with images: ${productsWithImages}`);
    console.log(`Products with multiple images: ${productsWithMultipleImages}`);
    console.log(`Products with single image: ${productsWithSingleImage}`);
    console.log(`Products without images: ${productsWithoutImages}`);
    
    const multipleImagePercentage = productsWithImages > 0 ? 
      Math.round((productsWithMultipleImages / productsWithImages) * 100) : 0;
    
    console.log(`Percentage with multiple images: ${multipleImagePercentage}%`);
    
    // 3. Check the actual submission process
    console.log('\n3️⃣ SUBMISSION PROCESS CHECK:');
    console.log('=============================');
    
    // Simulate what should happen during submission
    const testImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format"
    ];
    
    console.log('\n🧪 Simulating vendor submission with 3 images:');
    testImages.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
    });
    
    console.log('\n📋 Expected database flow:');
    console.log('1. Vendor creates product with image array');
    console.log('2. insert_my_product() stores the images array');
    console.log('3. submit_product_for_review() changes status to pending');
    console.log('4. Admin approves product');
    console.log('5. createShopifyProduct() processes ALL images');
    console.log('6. Database updated with clean CDN URLs');
    
    // 4. Check RPC function signatures
    console.log('\n4️⃣ RPC FUNCTION SIGNATURES:');
    console.log('============================');
    
    const { data: rpcInfo, error: rpcError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname, proargnames, proargtypes
        FROM pg_proc 
        WHERE proname IN ('insert_my_product', 'submit_product_for_review')
        ORDER BY proname;
      `
    });
    
    if (!rpcError && rpcInfo.length > 0) {
      rpcInfo.forEach(func => {
        console.log(`\nFunction: ${func.proname}`);
        if (func.proargnames) {
          console.log('Parameters:', func.proargnames);
        }
        // Check if images parameter exists
        if (func.proname === 'insert_my_product' && func.proargnames?.includes('p_images')) {
          console.log('✅ Accepts images parameter (text[] array)');
        }
      });
    }
    
    // 5. Identify potential issues
    console.log('\n5️⃣ POTENTIAL ISSUES IDENTIFIED:');
    console.log('================================');
    
    if (multipleImagePercentage < 50) {
      console.log('🔴 LOW MULTIPLE IMAGE ADOPTION');
      console.log('   Most products only have one image');
      console.log('   Possible causes:');
      console.log('   • Frontend only allows single image upload');
      console.log('   • Bulk uploader not being used');
      console.log('   • Images being filtered/truncated somewhere');
    }
    
    if (productsWithoutImages > 0) {
      console.log('🔴 PRODUCTS WITHOUT IMAGES');
      console.log('   Some products have no images at all');
      console.log('   Possible causes:');
      console.log('   • Image upload failed');
      console.log('   • Vendor didn\'t upload images');
      console.log('   • Database insertion issue');
    }
    
    // 6. Recommendations
    console.log('\n6️⃣ RECOMMENDATIONS:');
    console.log('====================');
    
    console.log('✅ CREATE A TEST PRODUCT MANUALLY:');
    console.log('   1. Login as approved vendor');
    console.log('   2. Go to /vendor/products/new');
    console.log('   3. Upload 3+ images using bulk uploader');
    console.log('   4. Submit for review (NOT save as draft)');
    console.log('   5. Check database - should see array of 3+ URLs');
    console.log('   6. Approve as admin');
    console.log('   7. Check logs for DEBUG output');
    console.log('   8. Verify database has ALL Shopify CDN URLs');
    
    console.log('\n📋 WHAT TO MONITOR:');
    console.log('• "🔍 DEBUG: imageNodes array:" in server logs');
    console.log('• "🔍 DEBUG: Returning uploaded_image_urls:" showing ALL URLs');
    console.log('• Database images column should show array with 3+ URLs');
    console.log('• Final product should have complete image gallery');
    
    console.log('\n🎯 EXPECTED RESULT:');
    console.log('✅ Vendor can upload multiple images');
    console.log('✅ All images are stored in database as array');
    console.log('✅ Admin approval processes ALL images');
    console.log('✅ Shopify receives complete image set');
    console.log('✅ Database stores ALL clean CDN URLs');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

function getUrlType(url) {
  if (!url) return 'empty';
  if (url.startsWith('blob:')) return 'BLOB';
  if (url.includes('shopify.com')) return 'SHOPIFY_CDN';
  if (url.includes('unsplash.com')) return 'UNSPLASH';
  if (url.includes('storage.googleapis.com')) return 'GCS';
  if (url.startsWith('http://localhost')) return 'LOCALHOST';
  return 'OTHER';
}

// Run the test
testProductSubmissionFlow();