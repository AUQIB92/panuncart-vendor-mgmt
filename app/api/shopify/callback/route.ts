/**
 * Shopify OAuth Callback Route
 * Exchanges authorization code for access token and stores locally
 */

import { NextRequest, NextResponse } from 'next/server';
import { storeShopifyToken } from '@/lib/shopify-oauth';

export async function GET(request: NextRequest) {
  // Validate required environment variables
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Missing required Shopify OAuth environment variables' }, 
      { status: 500 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  console.log('🛍️  Shopify OAuth Callback received:', { shop, code: !!code, state });
  
  // Validate required parameters
  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code: code,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Shopify token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ Shopify OAuth successful!');
    console.log('Access Token:', accessToken.substring(0, 20) + '...');
    
    // Store the access token locally
    const stored = await storeShopifyToken(shop, accessToken);
    
    if (!stored) {
      console.error('Failed to store Shopify token locally');
    }
    
    // Return success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: green; font-size: 24px; margin-bottom: 20px; }
            .token { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
            .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="success">✅ Shopify App Installed Successfully!</div>
          <p>Your app has been authorized to access <strong>${shop}</strong></p>
          
          <div class="info">
            <strong>Token Stored Locally</strong><br/>
            The access token is now stored in your application's memory.<br/>
            You can now approve products and they will be published to Shopify.
          </div>
          
          <div class="token">
            <strong>Access Token (First 20 chars):</strong><br/>
            ${accessToken.substring(0, 20)}...
          </div>
          
          <p>You can now close this window and use your app.</p>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}
