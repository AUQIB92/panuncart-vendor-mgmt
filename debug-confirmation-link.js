/**
 * Debug Confirmation Link Issues
 * Helps diagnose why confirmation links are failing
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

async function debugConfirmationLink() {
  console.log('🔍 DEBUGGING CONFIRMATION LINK ISSUES');
  console.log('====================================\n');
  
  // Test the confirmation flow step by step
  const testEmail = 'auqib92@gmail.com';
  const testPassword = 'TempPass123!';
  
  console.log(`Testing with email: ${testEmail}\n`);
  
  try {
    // Step 1: Register user
    console.log('1️⃣ Registering test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
        data: {
          role: 'vendor',
          business_name: 'Confirmation Debug Test',
          contact_name: 'Debugger'
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Registration failed:', signUpError.message);
      return;
    }
    
    console.log('✅ User registered successfully');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Confirmation sent:', !!signUpData.user?.confirmation_sent_at);
    
    if (!signUpData.user?.confirmation_sent_at) {
      console.log('\n⚠️  No confirmation email was sent');
      console.log('   This explains why confirmation fails');
      return;
    }
    
    // Step 2: Simulate what happens when user clicks confirmation link
    console.log('\n2️⃣ Testing confirmation process...');
    
    // In a real scenario, the user would receive an email with a link like:
    // http://localhost:3000/auth/confirm?token_hash=abc123&type=email&next=%2F
    
    console.log('Expected confirmation link format:');
    console.log(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL + '?token_hash=[TOKEN]&type=email');
    
    // Step 3: Check if the confirmation endpoint exists and works
    console.log('\n3️⃣ Verifying confirmation endpoint...');
    
    // Test the /auth/confirm page by checking if it exists
    const fs = require('fs');
    const path = require('path');
    
    const confirmPagePath = path.join(__dirname, 'app', 'auth', 'confirm', 'page.tsx');
    const confirmExists = fs.existsSync(confirmPagePath);
    
    console.log('Confirmation page exists:', confirmExists ? '✅ YES' : '❌ NO');
    
    if (!confirmExists) {
      console.log('❌ FATAL: Confirmation page is missing!');
      console.log('   Path should be: app/auth/confirm/page.tsx');
      return;
    }
    
    // Step 4: Test token verification (simulated)
    console.log('\n4️⃣ Testing token verification logic...');
    console.log('   The confirmation page should:');
    console.log('   - Extract token_hash from URL params');
    console.log('   - Call supabase.auth.verifyOtp()');
    console.log('   - Handle success/error states properly');
    
    // Clean up test user
    if (signUpData.user?.id) {
      try {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        console.log('\n🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.log('\n⚠️  Could not clean up test user');
      }
    }
    
  } catch (error) {
    console.log('❌ Debug process failed:', error.message);
  }
  
  await showCommonCausesAndSolutions();
}

async function showCommonCausesAndSolutions() {
  console.log('\n🔍 COMMON CAUSES & SOLUTIONS');
  console.log('============================');
  
  console.log('\n🔴 INVALID CONFIRMATION LINK');
  console.log('Possible causes:');
  console.log('1. Token expired (default 24 hours)');
  console.log('2. Malformed URL parameters');
  console.log('3. Wrong redirect URL configured');
  console.log('4. User already confirmed');
  console.log('5. Database connection issues');
  
  console.log('\n✅ VERIFICATION CHECKLIST:');
  console.log('☐ Confirmation page exists at /app/auth/confirm/page.tsx');
  console.log('☐ NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL is correct');
  console.log('☐ Token extraction logic works in confirmation page');
  console.log('☐ supabase.auth.verifyOtp() is called correctly');
  console.log('☐ Error handling displays proper messages');
  
  console.log('\n🔧 DEBUGGING STEPS:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify the confirmation URL format in emails');
  console.log('3. Test with a fresh registration');
  console.log('4. Check Supabase auth logs in dashboard');
  console.log('5. Try different browsers/devices');
  
  console.log('\n📋 SUPABASE DASHBOARD CHECKS:');
  console.log('Go to: Authentication > Users');
  console.log('Check if user shows "Confirmed: No"');
  console.log('Look for any error messages in user details');
  
  console.log('\n⏰ TOKEN EXPIRY:');
  console.log('Default token lifetime: 24 hours');
  console.log('If older than 24 hours, user needs to re-register');
  console.log('Can be configured in Supabase settings');
  
  console.log('\n🌐 NETWORK ISSUES:');
  console.log('Ensure no ad blockers or privacy extensions');
  console.log('interfere with the confirmation process');
  console.log('Test in incognito/private browsing mode');
}

// Run the debugger
debugConfirmationLink();
