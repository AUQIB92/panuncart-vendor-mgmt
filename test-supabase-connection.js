/**
 * Test Supabase Connection
 * Diagnoses network and connectivity issues with Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📡 TESTING SUPABASE CONNECTION');
console.log('==============================\n');

console.log('🔧 Connection Details:');
console.log('URL:', supabaseUrl);
console.log('Project ID:', supabaseUrl?.split('.')[0]?.split('//')[1]);
console.log('');

async function testConnection() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    console.log('Check your .env.local file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('1️⃣ Testing basic connection...');
    
    // Simple health check
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('vendors')
      .select('count()', { count: 'exact' })
      .limit(1);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('   Error code:', error.code);
      analyzeError(error);
    } else {
      console.log('✅ Connection successful!');
      console.log('   Response time:', duration, 'ms');
      console.log('   Database accessible');
    }
    
  } catch (error) {
    console.log('💥 Network error:', error.message);
    if (error.cause) {
      console.log('   Cause:', error.cause.message);
      console.log('   Code:', error.cause.code);
    }
    analyzeNetworkError(error);
  }
  
  await showTroubleshootingSteps();
}

function analyzeError(error) {
  console.log('\n🔍 Error Analysis:');
  
  if (error.message.includes('ECONNRESET')) {
    console.log('🔴 CONNECTION RESET');
    console.log('   Cause: Network interruption or Supabase service issue');
    console.log('   Solution: Check internet connection and Supabase status');
    
  } else if (error.message.includes('timeout')) {
    console.log('🔴 TIMEOUT ERROR');
    console.log('   Cause: Slow network or overloaded Supabase instance');
    console.log('   Solution: Check network speed and retry');
    
  } else if (error.code === 'PGRST301') {
    console.log('🔴 TABLE NOT FOUND');
    console.log('   Cause: Table doesn\'t exist or wrong permissions');
    console.log('   Solution: Verify table name and RLS policies');
    
  } else {
    console.log('🔴 OTHER ERROR');
    console.log('   Message:', error.message);
    console.log('   Code:', error.code);
  }
}

function analyzeNetworkError(error) {
  console.log('\n🌐 Network Issue Analysis:');
  
  if (error.cause?.code === 'ECONNRESET') {
    console.log('🔴 ECONNRESET - Connection Reset');
    console.log('   Common causes:');
    console.log('   - Unstable internet connection');
    console.log('   - Firewall blocking the connection');
    console.log('   - Supabase service temporary outage');
    console.log('   - VPN/proxy interference');
  }
}

async function showTroubleshootingSteps() {
  console.log('\n🛠️  TROUBLESHOOTING STEPS');
  console.log('========================');
  
  console.log('\n1. CHECK SUPABASE STATUS:');
  console.log('   Visit: https://status.supabase.com');
  console.log('   Look for any ongoing incidents');
  
  console.log('\n2. VERIFY NETWORK CONNECTION:');
  console.log('   - Test internet speed');
  console.log('   - Try accessing other websites');
  console.log('   - Restart your router if needed');
  
  console.log('\n3. CHECK FIREWALL/ANTIVIRUS:');
  console.log('   - Temporarily disable firewall');
  console.log('   - Add exception for localhost:3000');
  console.log('   - Check if any security software blocks connections');
  
  console.log('\n4. TRY DIFFERENT NETWORK:');
  console.log('   - Switch to mobile hotspot');
  console.log('   - Use different WiFi network');
  console.log('   - Try from different location');
  
  console.log('\n5. SUPABASE-SPECIFIC CHECKS:');
  console.log('   - Verify project URL is correct');
  console.log('   - Check API keys in .env.local');
  console.log('   - Ensure project is not paused/suspended');
  
  console.log('\n6. DEVELOPMENT ENVIRONMENT:');
  console.log('   - Restart Next.js development server');
  console.log('   - Clear browser cache and cookies');
  console.log('   - Try incognito/private browsing mode');
  console.log('   - Disable browser extensions temporarily');
  
  console.log('\n7. TEMPORARY WORKAROUNDS:');
  console.log('   - Wait 5-10 minutes and try again');
  console.log('   - Try during off-peak hours');
  console.log('   - Use Supabase CLI locally if available');
  
  console.log('\nIf issues persist, contact Supabase support with:');
  console.log('- Error messages and timestamps');
  console.log('- Your project ID');
  console.log('- Network environment details');
}

// Run the test
testConnection();
