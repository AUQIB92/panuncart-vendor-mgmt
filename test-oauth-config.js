/**
 * Test the updated Shopify OAuth configuration
 */

require('dotenv').config({ path: '.env.local' });

console.log('🛍️  SHOPIFY OAUTH CONFIGURATION TEST');
console.log('====================================\n');

console.log('🔧 Environment Variables:');
console.log('========================');

console.log('SHOPIFY_STORE_DOMAIN:', process.env.SHOPIFY_STORE_DOMAIN || '❌ NOT SET');
console.log('SHOPIFY_CLIENT_ID:', process.env.SHOPIFY_CLIENT_ID ? '✅ SET' : '❌ NOT SET');
console.log('SHOPIFY_CLIENT_SECRET:', process.env.SHOPIFY_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('SHOPIFY_SCOPES:', process.env.SHOPIFY_SCOPES || '❌ NOT SET');
console.log('SHOPIFY_REDIRECT_URI:', process.env.SHOPIFY_REDIRECT_URI || '❌ NOT SET');

console.log('\n📋 OAuth Flow URLs:');
console.log('==================');

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';

console.log('Install URL:');
console.log(`http://localhost:3000/api/shopify/install?shop=${storeDomain}`);

console.log('\nCallback URL:');
console.log(process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/api/shopify/callback');

console.log('\n🔧 Next Steps:');
console.log('=============');

if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
  console.log('❌ Missing OAuth credentials');
  console.log('1. Go to Shopify Dev Dashboard');
  console.log('2. Get your Client ID and Client Secret');
  console.log('3. Update .env.local with actual values:');
  console.log('   SHOPIFY_CLIENT_ID="your_actual_client_id"');
  console.log('   SHOPIFY_CLIENT_SECRET="your_actual_client_secret"');
} else {
  console.log('✅ OAuth credentials configured');
  console.log('1. Visit the install URL above');
  console.log('2. Authorize your app in Shopify');
  console.log('3. Tokens will be stored locally');
  console.log('4. Product approvals should work');
}

console.log('\nThis configuration uses the cleaner .env format you requested.');
