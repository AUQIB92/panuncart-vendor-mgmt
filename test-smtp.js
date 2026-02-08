/**
 * Test SMTP Configuration
 * Run this after setting up SMTP in Supabase dashboard
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

async function testSmtpConfiguration() {
  console.log('📧 Testing SMTP Configuration\n');
  
  // Test with your actual email
  const testEmail = 'auqib92@gmail.com'; // Change this to your email
  const testPassword = 'temp123'; // Temporary password for testing
  
  console.log(`Testing with email: ${testEmail}`);
  
  try {
    console.log('\n1. Attempting registration...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
        data: {
          role: 'vendor',
          business_name: 'SMTP Test Business',
          contact_name: 'SMTP Tester'
        }
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      
      if (error.message.includes('rate limit')) {
        console.log('   ⚠️  Rate limited - wait a few minutes and try again');
      } else if (error.message.includes('Email provider')) {
        console.log('   ❌ SMTP not configured properly in Supabase dashboard');
        console.log('   💡 Check your SMTP settings');
      }
      return false;
    }
    
    console.log('✅ Registration initiated successfully');
    console.log('   User ID:', data.user?.id);
    console.log('   Confirmation timestamp:', data.user?.confirmation_sent_at);
    
    if (data.user?.confirmation_sent_at) {
      console.log('\n✅ CONFIRMATION EMAIL SENT!');
      console.log('   Check your inbox for the confirmation email');
      console.log('   Subject should be: "Confirm Your Signup"');
      console.log('   From: noreply@panuncart.com (or your configured sender)');
    } else {
      console.log('\n⚠️  No confirmation sent - likely SMTP issue');
    }
    
    // Clean up
    if (data.user?.id) {
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('\n🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.log('\n⚠️  Could not clean up test user');
      }
    }
    
    return !!data.user?.confirmation_sent_at;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function showNextSteps() {
  console.log('\n📋 NEXT STEPS AFTER SMTP SETUP:');
  console.log('1. Check your email inbox (and spam folder)');
  console.log('2. Click the confirmation link in the email');
  console.log('3. You should be redirected to your confirmation page');
  console.log('4. After confirmation, try logging in');
  console.log('');
  console.log('🔧 TROUBLESHOOTING:');
  console.log('- If no email arrives, check Supabase SMTP settings');
  console.log('- Verify SMTP credentials are correct');
  console.log('- Check if your domain requires SPF/DKIM records');
  console.log('- Try with a different email provider if issues persist');
}

// Run the test
async function runTest() {
  console.log('🧪 SMTP CONFIGURATION TEST');
  console.log('===========================\n');
  
  const success = await testSmtpConfiguration();
  await showNextSteps();
  
  console.log('\n' + '='.repeat(40));
  if (success) {
    console.log('🎉 SMTP IS WORKING CORRECTLY!');
    console.log('   Your custom email setup is successful');
  } else {
    console.log('❌ SMTP CONFIGURATION ISSUE');
    console.log('   Review your Supabase SMTP settings');
  }
  console.log('='.repeat(40));
}

runTest();
