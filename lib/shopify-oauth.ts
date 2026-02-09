/**
 * Shopify OAuth Token Manager
 * Stores and retrieves Shopify access tokens locally
 */

// Local storage for Shopify tokens (in-memory for demo, use file system in production)
let localTokenStorage: { [shopDomain: string]: { access_token: string; expires_at: string } } = {};

// Get store domain from environment
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';

// In production, you'd save to a file like:
// const TOKEN_FILE_PATH = './shopify-tokens.json';

export async function getShopifyAccessToken(shopDomain: string): Promise<string | null> {
  try {
    // Check if we have a stored token for this shop
    const storedToken = localTokenStorage[shopDomain];
    
    if (!storedToken) {
      console.log('No stored token found for shop:', shopDomain);
      return null;
    }
    
    // Check if token is expired
    const expiresAt = new Date(storedToken.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      console.log('Stored token is expired');
      // Remove expired token
      delete localTokenStorage[shopDomain];
      return null;
    }
    
    console.log('✅ Using stored Shopify token for:', shopDomain);
    return storedToken.access_token;
    
  } catch (error) {
    console.error('Error retrieving Shopify token:', error);
    return null;
  }
}

export async function storeShopifyToken(shopDomain: string, accessToken: string) {
  try {
    // Store the token locally with 30-day expiration
    localTokenStorage[shopDomain] = {
      access_token: accessToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    
    console.log('✅ Shopify token stored locally for:', shopDomain);
    console.log('Token preview:', accessToken.substring(0, 20) + '...');
    
    // In production, you'd save to file:
    // await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(localTokenStorage, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error storing Shopify token:', error);
    return false;
  }
}

// Utility function to clear expired tokens
export function cleanupExpiredTokens() {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [shopDomain, tokenData] of Object.entries(localTokenStorage)) {
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < now) {
      delete localTokenStorage[shopDomain];
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired tokens`);
  }
  
  return cleanedCount;
}

// Utility function to list all stored tokens (for debugging)
export function listStoredTokens() {
  console.log('\n📦 Stored Shopify Tokens:');
  console.log('=========================');
  
  if (Object.keys(localTokenStorage).length === 0) {
    console.log('No tokens stored');
    return;
  }
  
  for (const [shopDomain, tokenData] of Object.entries(localTokenStorage)) {
    const expiresAt = new Date(tokenData.expires_at);
    const isExpired = expiresAt < new Date();
    console.log(`${shopDomain}:`);
    console.log(`  Token: ${tokenData.access_token.substring(0, 20)}...`);
    console.log(`  Expires: ${expiresAt.toLocaleString()} ${isExpired ? '(EXPIRED)' : ''}`);
    console.log('');
  }
}
