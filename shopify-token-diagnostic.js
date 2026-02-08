/**
 * Shopify Token Diagnostic Tool
 * Helps troubleshoot token generation and installation issues
 */

require('dotenv').config({ path: '.env.local' });

async function diagnoseShopifyToken() {
  console.log('🔍 SHOPIFY TOKEN DIAGNOSTIC');
  console.log('===========================\n');
  
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('📋 CURRENT CONFIGURATION:');
  console.log('Store Domain:', storeDomain);
  console.log('Access Token:', accessToken ? `${accessToken.substring(0, 15)}...` : 'NOT SET');
  console.log('Token Length:', accessToken?.length || 0);
  console.log('');
  
  // Test different API endpoints
  console.log('🧪 TESTING DIFFERENT APPROACHES:\n');
  
  // Test 1: Basic shop endpoint
  console.log('1️⃣ Testing basic shop endpoint...');
  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2024-10/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('❌ Still getting 401 - token issue confirmed');
    } else if (response.status === 200) {
      console.log('✅ Token is working!');
      const data = await response.json();
      console.log('Shop:', data.shop?.name);
    }
  } catch (error) {
    console.log('Network error:', error.message);
  }
  
  // Test 2: Try different API versions
  console.log('\n2️⃣ Testing different API versions...');
  const versions = ['2024-10', '2024-07', '2024-04', '2024-01'];
  
  for (const version of versions) {
    try {
      const response = await fetch(`https://${storeDomain}/admin/api/${version}/shop.json`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${version}: ${response.status}`);
      if (response.status === 200) {
        console.log(`✅ ${version} works!`);
      }
    } catch (error) {
      console.log(`${version}: Error - ${error.message}`);
    }
  }
  
  // Test 3: Check if it's a private app vs custom app
  console.log('\n3️⃣ Diagnostic Questions:');
  console.log('❓ Did you create this as a "Private app" or "Custom app"?');
  console.log('❓ Did you click "Install app" after generating the token?');
  console.log('❓ Are all required permissions granted (read/write products)?');
  console.log('❓ Did you copy the token BEFORE closing the modal?');
  
  await showTroubleshootingSteps();
}

async function showTroubleshootingSteps() {
  console.log('\n🔧 TROUBLESHOOTING STEPS:');
  console.log('========================');
  
  console.log('\n✅ VERIFICATION CHECKLIST:');
  console.log('1. Go to: https://panuncart-x-bbm.myshopify.com/admin/apps/private');
  console.log('2. Find your app and click "Manage"');
  console.log('3. Go to "API credentials" tab');
  console.log('4. Click "Reveal token once"');
  console.log('5. COPY the token (make sure to get all characters)');
  console.log('6. Click "Install app" if not already installed');
  console.log('7. Verify permissions include: read_products, write_products');
  
  console.log('\n⚠️ COMMON MISTAKES:');
  console.log('• Copying only part of the token');
  console.log('• Not clicking "Install app" after generating');
  console.log('• Using wrong store domain');
  console.log('• Missing required API permissions');
  console.log('• Token expired or revoked');
  
  console.log('\n🔄 ALTERNATIVE APPROACH:');
  console.log('1. Delete the current private app');
  console.log('2. Create a NEW private app');
  console.log('3. Grant ALL required permissions');
  console.log('4. Install the app');
  console.log('5. Copy the NEW token immediately');
  console.log('6. Update .env.local with new token');
  
  console.log('\n📋 DEBUG COMMANDS:');
  console.log('Test with curl:');
  console.log('curl -X GET https://panuncart-x-bbm.myshopify.com/admin/api/2024-10/shop.json \\');
  console.log('  -H "X-Shopify-Access-Token: YOUR_TOKEN_HERE"');
  
  console.log('\nIf curl works but Node.js doesn\'t:');
  console.log('• Check for special characters in token');
  console.log('• Verify .env.local encoding (UTF-8)');
  console.log('• Try wrapping token in quotes in .env file');
}

// Run diagnostic
diagnoseShopifyToken();
