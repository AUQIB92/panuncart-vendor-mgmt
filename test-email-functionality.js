/**
 * Test Supabase Email Functionality
 * This tests if the email confirmation system is working
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

// Test email address
const TEST_EMAIL = `test.${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'password123';

async function testEmailFunctionality() {
  console.log('📧 Testing Supabase Email Functionality\n');
  
  try {
    console.log('1. Attempting to register test user...');
    console.log(`   Email: ${TEST_EMAIL}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
        data: {
          role: 'vendor',
          business_name: 'Test Business',
          contact_name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      
      // Common error messages and solutions
      if (error.message.includes('Email rate limit exceeded')) {
        console.log('   💡 This means emails are being sent but rate limited');
        console.log('   💡 Try again in a few minutes');
      } else if (error.message.includes('Email provider misconfigured')) {
        console.log('   💡 Email provider needs to be configured in Supabase dashboard');
      }
      
      return false;
    }
    
    console.log('✅ Registration successful');
    console.log('   User ID:', data.user?.id);
    console.log('   Confirmation sent:', data.user?.confirmation_sent_at ? 'Yes' : 'No');
    
    if (data.user?.confirmation_sent_at) {
      console.log('\n✅ EMAIL CONFIRMATION SENT SUCCESSFULLY!');
      console.log('   Check your email inbox for the confirmation message');
      console.log('   The email should contain a confirmation link');
      console.log('   Link format: ' + process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL + '?token_hash=...');
    } else {
      console.log('\n⚠️  No confirmation email sent');
      console.log('   This usually means email is not enabled in Supabase settings');
    }
    
    // Clean up test user
    if (data.user?.id) {
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('\n🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.log('\n⚠️  Could not clean up test user:', cleanupError.message);
      }
    }
    
    return data.user?.confirmation_sent_at ? true : false;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function checkSupabaseSettings() {
  console.log('\n📋 Supabase Dashboard Checklist:');
  console.log('📍 URL: https://supabase.com/dashboard/project/lfxflgsollvkykpiijtl/auth/settings');
  console.log('');
  console.log('✅ MUST HAVE THESE ENABLED:');
  console.log('   [ ] Enable email signup');
  console.log('   [ ] Enable email confirmations');
  console.log('   [ ] Site URL set to: ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  console.log('   [ ] Additional Redirect URLs include: ' + (process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 'http://localhost:3000/auth/confirm'));
  console.log('');
  console.log('📧 EMAIL TEMPLATES:');
  console.log('   [ ] Confirmation email template exists');
  console.log('   [ ] Template contains {{ .ConfirmationURL }} variable');
  console.log('');
  console.log('🔌 SMTP SETTINGS (Optional but recommended):');
  console.log('   [ ] Using custom SMTP provider (SendGrid, AWS SES, etc.)');
  console.log('   [ ] SMTP credentials configured correctly');
}

// Run tests
async function runAll() {
  console.log('🧪 EMAIL FUNCTIONALITY TEST');
  console.log('============================\n');
  
  const emailWorking = await testEmailFunctionality();
  await checkSupabaseSettings();
  
  console.log('\n' + '='.repeat(40));
  if (emailWorking) {
    console.log('🎉 EMAIL SYSTEM IS WORKING!');
    console.log('   Users should receive confirmation emails');
  } else {
    console.log('❌ EMAIL SYSTEM NEEDS CONFIGURATION');
    console.log('   Check the Supabase dashboard settings above');
  }
  console.log('='.repeat(40));
}

runAll();
