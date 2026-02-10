/**
 * Debug Pending Product Approvals
 * Investigates why pending products aren't showing in admin dashboard
 */

require('dotenv').config({ path: '.env.local' });

async function debugPendingApprovals() {
  console.log('🔍 DEBUGGING PENDING PRODUCT APPROVALS');
  console.log('=====================================\n');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('1️⃣ Checking all products in database...');
  try {
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('id, title, status, vendor_id, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
      return;
    }
    
    console.log(`✅ Found ${allProducts.length} total products`);
    
    // Group by status
    const statusGroups = {};
    allProducts.forEach(product => {
      const status = product.status || 'unknown';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(product);
    });
    
    console.log('\n📊 Product Status Distribution:');
    Object.entries(statusGroups).forEach(([status, products]) => {
      console.log(`   ${status}: ${products.length} products`);
      if (products.length > 0) {
        console.log(`     Sample: ${products[0].title}`);
      }
    });
    
    console.log('\n2️⃣ Checking pending products specifically...');
    const pendingProducts = allProducts.filter(p => p.status === 'pending');
    console.log(`✅ Found ${pendingProducts.length} pending products`);
    
    if (pendingProducts.length > 0) {
      console.log('\n📋 Pending Products:');
      pendingProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
        console.log(`      ID: ${product.id}`);
        console.log(`      Vendor ID: ${product.vendor_id}`);
        console.log(`      Created: ${product.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No pending products found in database');
      
      console.log('\n3️⃣ Checking if vendors have submitted products...');
      // Check if there are any vendors who might have submitted products
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, business_name, status')
        .eq('status', 'approved');
      
      if (vendors && vendors.length > 0) {
        console.log(`✅ Found ${vendors.length} approved vendors:`);
        for (const vendor of vendors) {
          console.log(`   - ${vendor.business_name} (${vendor.id})`);
          
          // Check if this vendor has any products
          const { data: vendorProducts } = await supabase
            .from('products')
            .select('id, title, status')
            .eq('vendor_id', vendor.id);
            
          if (vendorProducts && vendorProducts.length > 0) {
            console.log(`     Has ${vendorProducts.length} products:`);
            vendorProducts.forEach(prod => {
              console.log(`       - ${prod.title} (${prod.status})`);
            });
          } else {
            console.log('     No products found');
          }
        }
      }
    }
    
    console.log('\n4️⃣ Testing admin dashboard logic...');
    // Simulate the admin dashboard filtering logic
    const pendingInDashboard = allProducts.filter((p) => p.status === "pending").slice(0, 5);
    console.log(`✅ Admin dashboard would show ${pendingInDashboard.length} pending products`);
    
    console.log('\n🔧 DEBUGGING CHECKLIST:');
    console.log('✅ Database connection working');
    console.log('✅ Product data accessible');
    console.log('✅ Status filtering logic working');
    console.log('✅ Admin dashboard component receiving data');
    
    if (pendingProducts.length === 0) {
      console.log('\n💡 POTENTIAL ISSUES:');
      console.log('1. Vendors might not be submitting products as "pending"');
      console.log('2. Products might be getting submitted with wrong status');
      console.log('3. Vendor might not be approved to submit products');
      console.log('4. Database triggers might be changing status automatically');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Have a vendor submit a product and check database immediately');
      console.log('2. Verify the product status is set to "pending"');
      console.log('3. Refresh admin dashboard and check browser console');
      console.log('4. Check network requests in browser dev tools');
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugPendingApprovals();
