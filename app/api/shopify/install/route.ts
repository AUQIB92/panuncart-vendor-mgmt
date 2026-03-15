/**
 * Shopify OAuth Routes
 * Implements the complete OAuth flow for Shopify app authentication
 */

import { NextRequest, NextResponse } from 'next/server';

function resolveRedirectUri(request: NextRequest): string {
  const requestCallbackUrl = new URL('/api/shopify/callback', request.url);
  const configuredRedirect = process.env.SHOPIFY_REDIRECT_URI?.replace(/^"(.*)"$/, '$1');

  if (!configuredRedirect) {
    return requestCallbackUrl.toString();
  }

  try {
    const configuredUrl = new URL(configuredRedirect);
    const requestUrl = new URL(request.url);
    const requestIsLocal =
      requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
    const configuredIsLocal =
      configuredUrl.hostname === 'localhost' || configuredUrl.hostname === '127.0.0.1';

    if (!requestIsLocal && configuredIsLocal) {
      return requestCallbackUrl.toString();
    }

    return configuredUrl.toString();
  } catch {
    return requestCallbackUrl.toString();
  }
}

export async function GET(request: NextRequest) {
  const redirectUri = resolveRedirectUri(request);

  // Validate required environment variables
  if (!process.env.SHOPIFY_CLIENT_ID || 
      !process.env.SHOPIFY_CLIENT_SECRET || 
      !process.env.SHOPIFY_SCOPES) {
    return NextResponse.json(
      { error: 'Missing required Shopify OAuth environment variables' }, 
      { status: 500 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }
  
  // Validate shop domain format
  if (!shop.endsWith('.myshopify.com')) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
  }
  
  // Generate random state for security
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const state = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  const installUrl = 
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_CLIENT_ID}` +
    `&scope=${process.env.SHOPIFY_SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;
  
  console.log('🛍️  Shopify OAuth Install URL:', installUrl);
  
  // Redirect to Shopify authorization
  return NextResponse.redirect(installUrl);
}
