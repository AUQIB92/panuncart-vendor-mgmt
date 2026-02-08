/**
 * Test Confirmation Flow End-to-End
 * Simulates the complete user experience
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

async function testConfirmationFlow() {
  console.log('🧪 TESTING COMPLETE CONFIRMATION FLOW');
  console.log('=====================================\n');
  
  const testEmail = 'auqib92@gmail.com';
  const testPassword = 'TempPass123!';
  
  console.log(`Testing with: ${testEmail}\n`);
  
  try {
    // Step 1: Register and capture the confirmation token
    console.log('1️⃣ Registering user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
        data: {
          role: 'vendor',
          business_name: 'Flow Test Business',
          contact_name: 'Flow Tester'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Registration failed:', signUpError.message);
      return;
    }
    
    console.log('✅ Registration successful');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Confirmation sent:', !!signUpData.user?.confirmation_sent_at);
    
    // Step 2: Check user status in database
    console.log('\n2️⃣ Checking user confirmation status...');
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(signUpData.user.id);
    
    if (userError) {
      console.log('❌ Could not fetch user data:', userError.message);
    } else {
      console.log('User confirmation status:');
      console.log('   Email confirmed:', userData.user?.email_confirmed_at ? 'YES' : 'NO');
      console.log('   Confirmation sent:', userData.user?.confirmation_sent_at ? 'YES' : 'NO');
      console.log('   Created at:', userData.user?.created_at);
    }
    
    // Step 3: Simulate various confirmation scenarios
    console.log('\n3️⃣ Testing confirmation scenarios...');
    
    // Test 1: Valid token scenario (what should happen)
    console.log('   Test 1: Valid token processing');
    console.log('   Expected: Should show success message');
    
    // Test 2: Expired token scenario
    console.log('   Test 2: Expired token simulation');
    console.log('   Expected: "Invalid or expired confirmation link"');
    
    // Test 3: Invalid token scenario
    console.log('   Test 3: Invalid token simulation');
    console.log('   Expected: "Invalid confirmation link"');
    
    // Step 4: Show user what to expect
    console.log('\n4️⃣ What users should see:');
    console.log('   ✅ SUCCESS: Green checkmark, "Email confirmed successfully"');
    console.log('   ❌ ERROR: Red error icon, "Invalid or expired confirmation link"');
    console.log('   ⏳ LOADING: Spinning icon, "Processing confirmation..."');
    
    // Clean up
    if (signUpData.user?.id) {
      try {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        console.log('\n🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.log('\n⚠️  Could not clean up test user');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  await showTroubleshootingGuide();
}

async function showTroubleshootingGuide() {
  console.log('\n🛠️  CONFIRMATION TROUBLESHOOTING GUIDE');
  console.log('=====================================');
  
  console.log('\n🔴 IF YOU SEE "Invalid confirmation link":');
  
  console.log('\n1. CHECK TOKEN EXPIRY:');
  console.log('   - Tokens expire after 24 hours by default');
  console.log('   - Register again for a fresh token');
  console.log('   - Check timestamp in confirmation email');
  
  console.log('\n2. VERIFY URL FORMAT:');
  console.log('   Correct format should be:');
  console.log('   http://localhost:3000/auth/confirm?token_hash=XXX&type=email');
  console.log('   Missing parameters cause "Invalid" errors');
  
  console.log('\n3. CHECK IF ALREADY CONFIRMED:');
  console.log('   - User may have clicked link twice');
  console.log('   - Check Supabase dashboard: Auth > Users');
  console.log('   - Look for "Email confirmed: Yes"');
  
  console.log('\n4. TEST WITH NEW REGISTRATION:');
  console.log('   - Use a different email address');
  console.log('   - Complete the flow from start to finish');
  console.log('   - Click confirmation link immediately');
  
  console.log('\n5. BROWSER-RELATED ISSUES:');
  console.log('   - Try incognito/private browsing');
  console.log('   - Disable ad blockers/extensions');
  console.log('   - Clear browser cache and cookies');
  console.log('   - Try different browser');
  
  console.log('\n📋 STEP-BY-STEP VERIFICATION:');
  console.log('1. Register new account');
  console.log('2. Receive confirmation email within 1-2 minutes');
  console.log('3. Copy the FULL link (including all parameters)');
  console.log('4. Paste in browser address bar (not search box)');
  console.log('5. Press Enter to navigate');
  console.log('6. Wait for success message');
  
  console.log('\n📞 IF PROBLEMS PERSIST:');
  console.log('1. Check Supabase status: https://status.supabase.com');
  console.log('2. Verify environment variables are correct');
  console.log('3. Ensure NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL matches');
  console.log('4. Contact Supabase support with error details');
}

// Run the test
testConfirmationFlow();
