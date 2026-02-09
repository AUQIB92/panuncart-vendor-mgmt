/**
 * Shopify OAuth Routes
 * Implements the complete OAuth flow for Shopify app authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// OAuth constants
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES;
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI;
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'panuncart-x-bbm.myshopify.com';

// Validate required environment variables
if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET || !SHOPIFY_SCOPES || !SHOPIFY_REDIRECT_URI) {
  throw new Error('Missing required Shopify OAuth environment variables');
}

// Install route - Step 3
export async function GET(request: NextRequest) {
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
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state temporarily (in production, use session storage)
  // For demo purposes, we'll pass it in the URL
  
  const installUrl = 
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_CLIENT_ID}` +
    `&scope=${SHOPIFY_SCOPES}` +
    `&redirect_uri=${SHOPIFY_REDIRECT_URI}` +
    `&state=${state}`;
  
  console.log('🛍️  Shopify OAuth Install URL:', installUrl);
  
  // Redirect to Shopify authorization
  return NextResponse.redirect(installUrl);
}
