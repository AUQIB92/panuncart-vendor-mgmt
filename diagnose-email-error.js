/**
 * Diagnose Email Confirmation Errors
 * Identifies the exact cause of email sending failures
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

async function diagnoseEmailError() {
  console.log('🔍 DIAGNOSING EMAIL CONFIRMATION ERROR');
  console.log('=====================================\n');
  
  // Test with a real email address
  const testEmail = 'auqib92@gmail.com';
  const testPassword = 'TempPass123!';
  
  console.log(`Testing with email: ${testEmail}\n`);
  
  try {
    console.log('1️⃣ Attempting user registration...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
        data: {
          role: 'vendor',
          business_name: 'Error Diagnosis Test',
          contact_name: 'Tester'
        }
      }
    });
    
    console.log('Registration result:');
    console.log('  Data:', JSON.stringify(data, null, 2));
    console.log('  Error:', error);
    
    if (error) {
      console.log('\n❌ REGISTRATION FAILED');
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error status:', error.status);
      
      // Analyze specific error types
      analyzeError(error);
      
    } else {
      console.log('\n✅ REGISTRATION SUCCESSFUL');
      console.log('User ID:', data.user?.id);
      console.log('Confirmation sent at:', data.user?.confirmation_sent_at);
      
      if (data.user?.confirmation_sent_at) {
        console.log('\n✅ EMAIL WAS SENT SUCCESSFULLY!');
        console.log('Check your inbox for the confirmation email.');
      } else {
        console.log('\n⚠️  NO CONFIRMATION EMAIL SENT');
        console.log('This indicates an email configuration issue.');
      }
      
      // Clean up test user
      if (data.user?.id) {
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
          console.log('\n🧹 Test user cleaned up');
        } catch (cleanupError) {
          console.log('\n⚠️  Could not clean up test user');
        }
      }
    }
    
  } catch (exception) {
    console.log('\n💥 UNEXPECTED ERROR:', exception.message);
    console.log('Stack trace:', exception.stack);
  }
  
  await showDetailedTroubleshooting();
}

function analyzeError(error) {
  console.log('\n🔍 ERROR ANALYSIS:');
  
  if (error.message.includes('Email rate limit exceeded')) {
    console.log('🔴 RATE LIMIT ERROR');
    console.log('   Cause: Too many emails sent recently');
    console.log('   Solution: Wait 1-2 minutes and try again');
    console.log('   Prevention: Implement rate limiting in your app');
    
  } else if (error.message.includes('Email provider misconfigured')) {
    console.log('🔴 SMTP CONFIGURATION ERROR');
    console.log('   Cause: SMTP settings are incorrect or missing');
    console.log('   Solution: Check Supabase SMTP configuration');
    console.log('   Check: Authentication > Settings in Supabase dashboard');
    
  } else if (error.message.includes('Email address is invalid')) {
    console.log('🔴 INVALID EMAIL ADDRESS');
    console.log('   Cause: Email domain may be blocked or format is wrong');
    console.log('   Solution: Try with a different email provider');
    console.log('   Test: Use gmail.com or outlook.com addresses');
    
  } else if (error.message.includes('User already registered')) {
    console.log('🔴 USER ALREADY EXISTS');
    console.log('   Cause: Email is already registered in the system');
    console.log('   Solution: Use a different email or reset password');
    
  } else if (error.status === 422) {
    console.log('🔴 VALIDATION ERROR');
    console.log('   Cause: Email format or other validation failed');
    console.log('   Solution: Check email format and try again');
    
  } else if (error.status === 500) {
    console.log('🔴 SERVER ERROR');
    console.log('   Cause: Internal Supabase error');
    console.log('   Solution: Try again later or contact Supabase support');
    
  } else {
    console.log('🔴 UNKNOWN ERROR TYPE');
    console.log('   Message:', error.message);
    console.log('   Code:', error.code);
    console.log('   Status:', error.status);
  }
}

async function showDetailedTroubleshooting() {
  console.log('\n🛠️  DETAILED TROUBLESHOOTING GUIDE');
  console.log('==================================');
  
  console.log('\n📋 CHECKLIST:');
  console.log('1. SUPABASE AUTH SETTINGS');
  console.log('   ☐ Go to: https://supabase.com/dashboard/project/lfxflgsollvkykpiijtl/auth/settings');
  console.log('   ☐ "Enable email signup" is ON');
  console.log('   ☐ "Enable email confirmations" is ON');
  console.log('   ☐ Site URL is set correctly');
  console.log('   ☐ Redirect URLs include your confirmation endpoint');
  
  console.log('\n2. SMTP CONFIGURATION (if using custom SMTP)');
  console.log('   ☐ "Enable Custom SMTP" is toggled ON');
  console.log('   ☐ SMTP host is correct (smtp.gmail.com, smtp.sendgrid.net, etc.)');
  console.log('   ☐ Port is correct (usually 587)');
  console.log('   ☐ Username is correct');
  console.log('   ☐ Password/API Key is correct');
  console.log('   ☐ Encryption is set to STARTTLS');
  
  console.log('\n3. EMAIL TEMPLATE');
  console.log('   ☐ Confirmation email template exists');
  console.log('   ☐ Template contains {{ .ConfirmationURL }} variable');
  console.log('   ☐ Sender email is properly configured');
  
  console.log('\n4. NETWORK & DOMAIN ISSUES');
  console.log('   ☐ Check spam/junk folders');
  console.log('   ☐ Verify SPF and DKIM records if using custom domain');
  console.log('   ☐ Test with different email providers (Gmail, Outlook)');
  console.log('   ☐ Check if email domain is blacklisted');
  
  console.log('\n5. QUICK FIXES TO TRY');
  console.log('   🔧 Disable and re-enable email confirmations');
  console.log('   🔧 Reset SMTP settings and re-enter credentials');
  console.log('   🔧 Test with Supabase default email (turn off custom SMTP)');
  console.log('   🔧 Try a different email address');
  console.log('   🔧 Check Supabase status page for service issues');
  
  console.log('\n📞 SUPPORT RESOURCES:');
  console.log('   🌐 Supabase Status: https://status.supabase.com');
  console.log('   📚 Docs: https://supabase.com/docs/guides/auth/auth-email');
  console.log('   💬 Discord: https://discord.supabase.com');
}

// Run diagnosis
diagnoseEmailError();
