/**
 * Verify Product Submission Status Flow
 * Checks if vendors are properly submitting products for review
 */

require('dotenv').config({ path: '.env.local' });

async function verifyProductSubmissionStatus() {
  console.log('📋 VERIFYING PRODUCT SUBMISSION STATUS FLOW');
  console.log('===========================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  // Use service role key for full database access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('1️⃣ Checking all products and their statuses...');
  try {
    const { data: allProducts, error } = await supabase
      .from('products')
      .select(`
        id, 
        title, 
        status, 
        vendor_id, 
        created_at,
        vendors(business_name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
      return;
    }
    
    console.log(`✅ Found ${allProducts.length} total products\n`);
    
    // Group by status
    const statusGroups = {};
    allProducts.forEach(product => {
      const status = product.status || 'unknown';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(product);
    });
    
    console.log('📊 Product Status Distribution:');
    Object.entries(statusGroups).forEach(([status, products]) => {
      console.log(`   ${status.toUpperCase()}: ${products.length} products`);
      products.slice(0, 3).forEach(product => {
        console.log(`     • ${product.title} (by ${product.vendors?.business_name || 'Unknown'})`);
      });
      if (products.length > 3) {
        console.log(`     ... and ${products.length - 3} more`);
      }
      console.log('');
    });
    
    console.log('2️⃣ Detailed analysis of draft products...');
    const draftProducts = statusGroups.draft || [];
    if (draftProducts.length > 0) {
      console.log(`⚠️  Found ${draftProducts.length} draft products:`);
      draftProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Vendor: ${product.vendors?.business_name || 'Unknown'} (${product.vendor_id})`);
        console.log(`      Created: ${product.created_at}`);
        console.log(`      ID: ${product.id}`);
        console.log('');
      });
      
      console.log('💡 These products are saved as drafts and will NOT appear in admin pending approvals.');
      console.log('💡 Vendors need to click "Submit for Review" instead of "Save as Draft"\n');
    }
    
    console.log('3️⃣ Checking pending products...');
    const pendingProducts = statusGroups.pending || [];
    if (pendingProducts.length > 0) {
      console.log(`✅ Found ${pendingProducts.length} pending products for admin approval:`);
      pendingProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      Vendor: ${product.vendors?.business_name || 'Unknown'}`);
        console.log(`      Submitted: ${product.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No pending products found for admin approval\n');
    }
    
    console.log('4️⃣ Checking approved vendors who might have draft products...');
    const { data: approvedVendors } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('status', 'approved');
    
    if (approvedVendors && approvedVendors.length > 0) {
      console.log(`✅ Found ${approvedVendors.length} approved vendors:`);
      
      for (const vendor of approvedVendors) {
        const vendorDraftProducts = draftProducts.filter(p => p.vendor_id === vendor.id);
        const vendorPendingProducts = pendingProducts.filter(p => p.vendor_id === vendor.id);
        
        console.log(`\n   ${vendor.business_name}:`);
        console.log(`     Draft products: ${vendorDraftProducts.length}`);
        console.log(`     Pending products: ${vendorPendingProducts.length}`);
        
        if (vendorDraftProducts.length > 0) {
          console.log('     Draft products:');
          vendorDraftProducts.forEach(p => {
            console.log(`       - ${p.title}`);
          });
        }
      }
    }
    
    console.log('\n🔧 SOLUTIONS:');
    console.log('✅ If vendors have draft products but no pending products:');
    console.log('   1. Instruct vendors to click "Submit for Review" instead of "Save as Draft"');
    console.log('   2. Consider adding clearer UI guidance on the difference');
    console.log('   3. Optionally, add a feature to convert drafts to pending\n');
    
    console.log('✅ If no products exist at all:');
    console.log('   1. Verify vendors are actually creating products');
    console.log('   2. Check if vendor accounts are approved');
    console.log('   3. Verify the product creation form is working\n');
    
    console.log('✅ To test the flow:');
    console.log('   1. Login as an approved vendor');
    console.log('   2. Go to /vendor/products/new');
    console.log('   3. Fill in product details');
    console.log('   4. CLICK "Submit for Review" (NOT "Save as Draft")');
    console.log('   5. Check admin dashboard - product should appear in pending tab\n');
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyProductSubmissionStatus();
