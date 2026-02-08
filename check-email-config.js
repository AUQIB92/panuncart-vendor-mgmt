/**
 * Check Supabase Email Configuration
 * Run this to verify email settings in your Supabase project
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmailConfig() {
  console.log('📧 Checking Supabase Email Configuration...\n');
  
  try {
    // Test sending a test email (this will fail if email not configured)
    console.log('1️⃣ Testing email configuration...');
    
    // Note: This is a placeholder - Supabase doesn't have a direct API to check email settings
    // You need to check this in your Supabase dashboard
    
    console.log('   ℹ️  Please check the following in your Supabase Dashboard:');
    console.log('   📍 Go to: https://supabase.com/dashboard/project/lfxflgsollvkykpiijtl/auth/settings');
    console.log('   ✅ Ensure "Enable email signup" is turned ON');
    console.log('   ✅ Check "Email Templates" section for confirmation email');
    console.log('   ✅ Verify SMTP settings if using custom email provider\n');
    
    // Check environment variables
    console.log('2️⃣ Checking environment variables...');
    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (redirectUrl) {
      console.log(`   ✅ NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: ${redirectUrl}`);
    } else {
      console.log('   ❌ NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL not set');
    }
    
    if (appUrl) {
      console.log(`   ✅ NEXT_PUBLIC_APP_URL: ${appUrl}`);
    } else {
      console.log('   ❌ NEXT_PUBLIC_APP_URL not set');
    }
    
    console.log('\n3️⃣ Manual Testing Steps:');
    console.log('   a. Register a new vendor account');
    console.log('   b. Check your email inbox (and spam folder)');
    console.log('   c. Click the confirmation link');
    console.log('   d. You should be redirected to /auth/confirm');
    console.log('   e. After confirmation, you can sign in\n');
    
    console.log('🔧 If emails are not being sent:');
    console.log('   1. Check Supabase Auth settings in dashboard');
    console.log('   2. Verify your domain is not blocked by email providers');
    console.log('   3. Check if you\'re using Supabase\'s default email service or custom SMTP');
    console.log('   4. For production, consider using a custom SMTP provider\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEmailConfig();
