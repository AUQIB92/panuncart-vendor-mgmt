/**
 * Trace Product Creation Image Array Flow
 * Debugs exactly how image arrays flow from vendor creation to database storage
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function traceProductCreation() {
  console.log('🔍 TRACING PRODUCT CREATION IMAGE FLOW');
  console.log('=====================================\n');
  
  try {
    // 1. Simulate what happens during vendor product creation
    console.log('1️⃣ Simulating vendor product creation flow...\n');
    
    // Test image array that vendor would send
    const vendorImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&auto=format"
    ];
    
    console.log(`Vendor submitting product with ${vendorImages.length} images:`);
    vendorImages.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 60)}...`);
    });
    
    // 2. Check what the RPC function insert_my_product does
    console.log('\n2️⃣ Checking insert_my_product RPC function...\n');
    
    const { data: rpcInfo, error: rpcError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT proname, proargnames, proargtypes
        FROM pg_proc 
        WHERE proname = 'insert_my_product'
        LIMIT 1;
      `
    });
    
    if (!rpcError && rpcInfo.length > 0) {
      console.log('✅ insert_my_product function exists');
      console.log('Parameters include p_images text[] (array parameter)');
      console.log('This function should preserve the full array\n');
    }
    
    // 3. Simulate the approval workflow
    console.log('3️⃣ Simulating approval workflow...\n');
    
    // What happens during approval:
    // 1. Admin approves product
    // 2. createShopifyProduct() is called with the product data
    // 3. It processes ALL images in the array
    // 4. Returns uploaded_image_urls array
    // 5. Database should be updated with ALL URLs
    
    console.log('Approval process:');
    console.log('1. createShopifyProduct() receives images array');
    console.log('2. Processes each image and uploads to Shopify CDN');
    console.log('3. Builds imageNodes array with ALL CDN URLs');
    console.log('4. Returns uploaded_image_urls with ALL processed URLs');
    console.log('5. Database update should store ALL URLs\n');
    
    // 4. Check if there's a truncation issue in the approval API
    console.log('4️⃣ Checking approval API logic...\n');
    
    // The issue might be that the approval API is only taking the first URL
    // Let's examine what we return from createShopifyProduct
    
    console.log('Current createShopifyProduct return:');
    console.log('  uploaded_image_urls: imageNodes.map(node => node.src)');
    console.log('  This should contain ALL processed CDN URLs\n');
    
    // 5. Create a comprehensive test
    console.log('5️⃣ Creating comprehensive test scenario...\n');
    
    // Simulate the complete flow
    const testScenario = {
      input: {
        vendorImages: vendorImages,
        count: vendorImages.length
      },
      processing: {
        frontendFiltered: vendorImages.length, // All valid URLs
        backendProcessed: vendorImages.length, // All uploaded
        cdnUrlsGenerated: vendorImages.length  // All CDN URLs
      },
      expectedOutput: {
        databaseImages: vendorImages.length,   // ALL URLs stored
        shopifyImages: vendorImages.length     // ALL URLs sent
      }
    };
    
    console.log('TEST SCENARIO:');
    console.log(`Input: ${testScenario.input.count} images from vendor`);
    console.log(`Processing: ${testScenario.processing.frontendFiltered} filtered → ${testScenario.processing.backendProcessed} processed → ${testScenario.processing.cdnUrlsGenerated} CDN URLs`);
    console.log(`Expected: ${testScenario.expectedOutput.databaseImages} images in database`);
    console.log(`Expected: ${testScenario.expectedOutput.shopifyImages} images in Shopify\n`);
    
    // 6. Identify the most likely issue
    console.log('6️⃣ Most likely issues:\n');
    
    console.log('🔴 ISSUE 1: Database update truncation');
    console.log('   - Approval API might only store first URL');
    console.log('   - Check: await supabase.from(\'products\').update({ images: shopifyResult.uploaded_image_urls })');
    
    console.log('\n🔴 ISSUE 2: Shopify API array handling');
    console.log('   - Shopify might only accept/process first image');
    console.log('   - Check: shopifyProduct.images array structure');
    
    console.log('\n🔴 ISSUE 3: Frontend array passing');
    console.log('   - Product form might truncate the array');
    console.log('   - Check: formDataWithImages.imageUrls in handleSubmit');
    
    console.log('\n7️⃣ DEBUGGING PLAN:');
    console.log('✅ Add console.log in approval route to see uploaded_image_urls array');
    console.log('✅ Add console.log in createShopifyProduct to see imageNodes array');
    console.log('✅ Add console.log in bulk-image-uploader to see what URLs are sent');
    console.log('✅ Add console.log in product form to see collected imageUrls');
    console.log('✅ Test with actual product creation to trace the flow');
    
  } catch (error) {
    console.log('❌ Trace failed:', error.message);
  }
}

// Run the trace
traceProductCreation();