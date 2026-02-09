/**
 * Shopify Token Manager with Auto-Refresh
 * Automatically handles token expiration and renewal using proper OAuth exchange
 */

import { getShopifyAccessToken, storeShopifyToken } from './shopify-oauth';

// Shopify OAuth constants
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';

/**
 * Gets a fresh Shopify access token using proper OAuth exchange
 * Uses existing token if valid, otherwise refreshes via client credentials
 */
export async function getFreshShopifyToken(): Promise<string> {
  console.log('🔄 Getting fresh Shopify token (proper OAuth method)...');
  
  // First, try to get existing token
  let accessToken = await getShopifyAccessToken(SHOPIFY_STORE_DOMAIN);
  
  if (accessToken) {
    // Test if token is still valid
    const isValid = await testTokenValidity(accessToken);
    
    if (isValid) {
      console.log('✅ Using existing valid token');
      return accessToken;
    } else {
      console.log('❌ Existing token expired, getting new one via OAuth exchange');
    }
  }
  
  // If no valid token, get a new one through proper OAuth exchange
  accessToken = await exchangeForAccessToken();
  
  if (accessToken) {
    // Store the new token
    await storeShopifyToken(SHOPIFY_STORE_DOMAIN, accessToken);
    console.log('✅ New token acquired and stored via OAuth exchange');
    return accessToken;
  }
  
  throw new Error('Unable to obtain valid Shopify access token via OAuth exchange');
}

/**
 * Exchanges client credentials for access token
 * This is the proper OAuth method for custom apps
 */
async function exchangeForAccessToken(): Promise<string> {
  try {
    console.log('🔄 Exchanging client credentials for access token...');
    
    const tokenUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Token exchange failed:', response.status, errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }
    
    const tokenData = await response.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ OAuth token exchange successful!');
    return accessToken;
    
  } catch (error) {
    console.error('❌ OAuth token exchange error:', error);
    throw error;
  }
}

/**
 * Tests if a token is still valid by making a simple API call
 */
async function testTokenValidity(token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.log('Token validity test failed:', error);
    return false;
  }
}

/**
 * Wrapper function for Shopify API calls with automatic token handling
 */
export async function makeShopifyAPICall(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get fresh token
  const accessToken = await getFreshShopifyToken();
  
  // Make API call with token
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  // Handle token expiration during the call
  if (response.status === 401) {
    console.log('❌ Token expired during API call, retrying...');
    
    // Get new token and retry once
    const newToken = await getFreshShopifyToken();
    
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': newToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return retryResponse;
  }
  
  return response;
}

/**
 * List products with automatic token handling
 */
export async function listShopifyProducts(limit: number = 10) {
  try {
    console.log(`📋 Listing up to ${limit} products from Shopify...`);
    
    const response = await makeShopifyAPICall(`products.json?limit=${limit}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list products: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Retrieved ${data.products?.length || 0} products`);
    
    return {
      success: true,
      products: data.products || [],
      count: data.products?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Product listing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      count: 0
    };
  }
}

/**
 * Create product with automatic token handling
 */
export async function createShopifyProduct(productData: any) {
  try {
    console.log('➕ Creating product in Shopify...');
    
    const response = await makeShopifyAPICall('products.json', {
      method: 'POST',
      body: JSON.stringify({ product: productData })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create product: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Product created successfully');
    
    return {
      success: true,
      product: data.product
    };
    
  } catch (error) {
    console.error('❌ Product creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
