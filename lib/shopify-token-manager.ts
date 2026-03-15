/**
 * Shopify Token Manager
 * Uses the offline OAuth token saved via /api/shopify/callback.
 */

import { getShopifyAccessToken } from './shopify-oauth';

const SHOPIFY_STORE_DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  'panuncart-x-bbm.myshopify.com';

export class ShopifyTokenError extends Error {
  code: 'SHOPIFY_CONFIG_ERROR' | 'SHOPIFY_OAUTH_REQUIRED' | 'SHOPIFY_TOKEN_INVALID';
  installUrl?: string;

  constructor(
    message: string,
    code: 'SHOPIFY_CONFIG_ERROR' | 'SHOPIFY_OAUTH_REQUIRED' | 'SHOPIFY_TOKEN_INVALID',
    installUrl?: string
  ) {
    super(message);
    this.name = 'ShopifyTokenError';
    this.code = code;
    this.installUrl = installUrl;
  }
}

export function getShopifyInstallUrl(shopDomain: string = SHOPIFY_STORE_DOMAIN): string | null {
  if (!shopDomain) {
    return null;
  }

  return `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;
}

/**
 * Gets an access token for Shopify Admin API calls.
 */
export async function getFreshShopifyToken(): Promise<string> {
  if (!SHOPIFY_STORE_DOMAIN) {
    throw new ShopifyTokenError(
      'SHOPIFY_STORE_DOMAIN is not configured.',
      'SHOPIFY_CONFIG_ERROR'
    );
  }

  const accessToken = await getShopifyAccessToken(SHOPIFY_STORE_DOMAIN);
  const installUrl = getShopifyInstallUrl(SHOPIFY_STORE_DOMAIN) || undefined;

  if (!accessToken) {
    throw new ShopifyTokenError(
      'No Shopify access token found. Authorize the Shopify app first, then retry.',
      'SHOPIFY_OAUTH_REQUIRED',
      installUrl
    );
  }

  const isValid = await testTokenValidity(accessToken);
  if (!isValid) {
    throw new ShopifyTokenError(
      'Stored Shopify token is invalid. Re-authorize the Shopify app to generate a fresh offline token.',
      'SHOPIFY_TOKEN_INVALID',
      installUrl
    );
  }

  return accessToken;
}

/**
 * Tests if a token is still valid by making a simple API call.
 */
async function testTokenValidity(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/shop.json`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wrapper function for Shopify API calls with token handling.
 */
export async function makeShopifyAPICall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getFreshShopifyToken();
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function listShopifyProducts(limit: number = 10) {
  try {
    const response = await makeShopifyAPICall(`products.json?limit=${limit}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list products: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      products: data.products || [],
      count: data.products?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
      count: 0,
    };
  }
}

export async function createShopifyProduct(productData: unknown) {
  try {
    const response = await makeShopifyAPICall('products.json', {
      method: 'POST',
      body: JSON.stringify({ product: productData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create product: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      product: data.product,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
