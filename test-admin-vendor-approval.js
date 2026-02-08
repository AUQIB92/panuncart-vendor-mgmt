/**
 * Test Admin Vendor Approval System
 * Diagnoses why pending vendors aren't appearing in admin dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminVendorApproval() {
  console.log('🔍 TESTING ADMIN VENDOR APPROVAL SYSTEM');
  console.log('=======================================\n');
  
  try {
    // Step 1: Create test vendor accounts
    console.log('1️⃣ Creating test vendor accounts...');
    
    const vendors = [
      {
        email: 'vendor1@test.com',
        password: 'VendorPass123!',
        business_name: 'Test Vendor 1',
        contact_name: 'Vendor One'
      },
      {
        email: 'vendor2@test.com',
        password: 'VendorPass123!',
        business_name: 'Test Vendor 2',
        contact_name: 'Vendor Two'
      }
    ];
    
    const createdVendors = [];
    
    for (const vendor of vendors) {
      const { data, error } = await supabase.auth.signUp({
        email: vendor.email,
        password: vendor.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
          data: {
            role: 'vendor',
            business_name: vendor.business_name,
            contact_name: vendor.contact_name,
            approved: false // Not approved yet
          }
        }
      });
      
      if (error) {
        console.log(`❌ Failed to create ${vendor.business_name}:`, error.message);
      } else {
        console.log(`✅ Created ${vendor.business_name}:`, data.user?.id);
        createdVendors.push({
          ...vendor,
          user_id: data.user?.id,
          created_at: data.user?.created_at
        });
      }
    }
    
    if (createdVendors.length === 0) {
      console.log('\n❌ No vendors created successfully');
      return;
    }
    
    // Step 2: Check admin RPC function
    console.log('\n2️⃣ Testing admin_get_vendors_pending_approval RPC function...');
    
    const { data: pendingVendors, error: rpcError } = await supabase.rpc('admin_get_vendors_pending_approval');
    
    if (rpcError) {
      console.log('❌ RPC function failed:', rpcError.message);
      console.log('   This indicates missing database functions');
      await checkDatabaseFunctions();
      return;
    }
    
    console.log('✅ RPC function executed successfully');
    console.log('   Pending vendors found:', pendingVendors?.length || 0);
    
    if (pendingVendors && pendingVendors.length > 0) {
      console.log('\n📋 Pending vendors:');
      pendingVendors.forEach(vendor => {
        console.log(`   - ${vendor.business_name} (${vendor.email})`);
        console.log(`     Status: ${vendor.approved ? 'Approved' : 'Pending'}`);
        console.log(`     Created: ${vendor.created_at}`);
      });
    }
    
    // Step 3: Check database directly
    console.log('\n3️⃣ Checking database directly...');
    
    const { data: dbVendors, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor');
    
    if (dbError) {
      console.log('❌ Database query failed:', dbError.message);
    } else {
      console.log('✅ Database query successful');
      console.log('   Total vendors in database:', dbVendors?.length || 0);
      
      const pendingDbVendors = dbVendors?.filter(v => !v.approved) || [];
      console.log('   Pending approval in database:', pendingDbVendors.length);
      
      if (pendingDbVendors.length > 0) {
        console.log('\n📋 Database pending vendors:');
        pendingDbVendors.forEach(vendor => {
          console.log(`   - ${vendor.business_name} (${vendor.email})`);
          console.log(`     Approved: ${vendor.approved ? 'Yes' : 'No'}`);
        });
      }
    }
    
    // Step 4: Test admin approval function
    console.log('\n4️⃣ Testing admin approval function...');
    
    if (createdVendors.length > 0) {
      const testVendorId = createdVendors[0].user_id;
      console.log(`   Testing approval for: ${createdVendors[0].business_name}`);
      
      const { data: approveResult, error: approveError } = await supabase.rpc('admin_approve_vendor', {
        vendor_id: testVendorId
      });
      
      if (approveError) {
        console.log('❌ Approval function failed:', approveError.message);
      } else {
        console.log('✅ Approval function executed');
        console.log('   Result:', approveResult);
      }
    }
    
    // Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    for (const vendor of createdVendors) {
      try {
        await supabase.auth.admin.deleteUser(vendor.user_id);
        console.log(`   🧹 Deleted ${vendor.business_name}`);
      } catch (cleanupError) {
        console.log(`   ⚠️  Could not delete ${vendor.business_name}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  await showTroubleshootingGuide();
}

async function checkDatabaseFunctions() {
  console.log('\n🔧 CHECKING DATABASE FUNCTIONS...');
  
  // Check if required RPC functions exist
  const requiredFunctions = [
    'admin_get_vendors_pending_approval',
    'admin_approve_vendor',
    'admin_reject_vendor'
  ];
  
  console.log('Required functions:');
  requiredFunctions.forEach(func => {
    console.log(`   - ${func}`);
  });
  
  console.log('\nIf these functions are missing, run the database setup script:');
  console.log('   pnpm run setup-db');
}

async function showTroubleshootingGuide() {
  console.log('\n🛠️  ADMIN VENDOR APPROVAL TROUBLESHOOTING');
  console.log('========================================');
  
  console.log('\n🔴 COMMON ISSUES:');
  console.log('1. Missing RPC functions in database');
  console.log('2. Incorrect RLS (Row Level Security) policies');
  console.log('3. Vendor accounts not marked as "vendor" role');
  console.log('4. Already approved vendors not showing as pending');
  console.log('5. Database connection issues\n');
  
  console.log('✅ VERIFICATION CHECKLIST:');
  console.log('☐ RPC function admin_get_vendors_pending_approval exists');
  console.log('☐ Vendors have role="vendor" in profiles table');
  console.log('☐ Vendors have approved=false for pending status');
  console.log('☐ RLS policies allow admin access to vendor data');
  console.log('☐ Admin dashboard calls the correct RPC function\n');
  
  console.log('🔧 DEBUGGING STEPS:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify network requests in Dev Tools');
  console.log('3. Test RPC function directly in Supabase SQL editor');
  console.log('4. Check database table structure and data');
  console.log('5. Review admin dashboard component code\n');
  
  console.log('📋 SUPABASE DASHBOARD CHECKS:');
  console.log('Go to: Table Editor > profiles');
  console.log('Filter: role = vendor AND approved = false');
  console.log('Verify data exists and is correctly formatted');
  
  console.log('\nIf no pending vendors appear:');
  console.log('1. Create a new vendor account through registration');
  console.log('2. Verify the account has role="vendor" and approved=false');
  console.log('3. Refresh the admin dashboard');
  console.log('4. Check browser network tab for API calls');
}

// Run the test
testAdminVendorApproval();
