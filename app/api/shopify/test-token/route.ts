/**
 * Shopify Token Test API Route
 * Tests OAuth token acquisition and product operations
 */

import { NextResponse } from 'next/server';
import { getShopifyAccessToken, storeShopifyToken } from '@/lib/shopify-oauth';

export async function POST(request: Request) {
  try {
    // Parse request data
    const body = await request.json();
    
    const { 
      SHOPIFY_STORE_DOMAIN, 
      SHOPIFY_CLIENT_ID, 
      SHOPIFY_CLIENT_SECRET 
    } = process.env;

    // Validate environment variables
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: "Missing Server Environment Variables" },
        { status: 500 }
      );
    }

    console.log('🛍️  Shopify Token Test Request');
    console.log('Store Domain:', SHOPIFY_STORE_DOMAIN);
    console.log('Client ID Present:', !!SHOPIFY_CLIENT_ID);

    // ---------------------------------------------------------
    // STEP 1: Check for existing token
    // ---------------------------------------------------------
    let accessToken = await getShopifyAccessToken(SHOPIFY_STORE_DOMAIN);
    
    if (!accessToken) {
      // ---------------------------------------------------------
      // STEP 2: If no token, you need to complete OAuth flow first
      // ---------------------------------------------------------
      console.log('❌ No existing token found');
      
      return NextResponse.json({
        success: false,
        error: "No access token available. Please complete OAuth flow first.",
        oauth_required: true,
        install_url: `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=read_products,write_products&redirect_uri=http://localhost:3000/api/shopify/callback&state=test123`
      }, { status: 401 });
    }

    console.log('✅ Using existing token:', accessToken.substring(0, 20) + '...');

    // ---------------------------------------------------------
    // STEP 3: Test product listing with existing token
    // ---------------------------------------------------------
    console.log('📋 Testing product listing...');
    
    const listUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products.json?limit=5`;
    
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.log('❌ Product listing failed:', listResponse.status, errorText);
      
      // If token is invalid, suggest re-authentication
      if (listResponse.status === 401) {
        return NextResponse.json({
          success: false,
          error: "Invalid or expired token. Please re-authenticate.",
          token_expired: true,
          install_url: `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=read_products,write_products&redirect_uri=http://localhost:3000/api/shopify/callback&state=test123`
        }, { status: 401 });
      }
      
      throw new Error(`Product listing failed: ${listResponse.status} - ${errorText}`);
    }

    const listData = await listResponse.json();
    console.log('✅ Product listing successful');
    console.log('Found', listData.products?.length || 0, 'products');

    // ---------------------------------------------------------
    // STEP 4: Create a test product (optional)
    // ---------------------------------------------------------
    if (body.create_product) {
      console.log('➕ Creating test product...');
      
      const productUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/products.json`;
      
      const productPayload = {
        product: {
          title: body.title || `Test Product ${Date.now()}`,
          body_html: body.description || "<strong>Created via API Test</strong>",
          vendor: "Panuncart Test",
          product_type: "Test",
          variants: [
            {
              price: body.price || "29.99",
              sku: body.sku || `TEST-${Date.now()}`
            }
          ]
        }
      };

      const productResponse = await fetch(productUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productPayload),
      });

      const productData = await productResponse.json();

      if (!productResponse.ok) {
        console.log('❌ Product creation failed:', productData);
        throw new Error(`Product creation failed: ${JSON.stringify(productData)}`);
      }

      console.log('✅ Product created successfully');
      console.log('Product ID:', productData.product?.id);

      return NextResponse.json({ 
        success: true, 
        message: "Token valid and product created",
        products_found: listData.products?.length || 0,
        new_product: productData.product,
        token_preview: accessToken.substring(0, 20) + '...'
      });
    }

    // ---------------------------------------------------------
    // STEP 5: Return success with product list
    // ---------------------------------------------------------
    return NextResponse.json({ 
      success: true, 
      message: "Token valid and products retrieved",
      products_found: listData.products?.length || 0,
      sample_products: listData.products?.slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status
      })) || [],
      token_preview: accessToken.substring(0, 20) + '...'
    });

  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown Error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check token status
export async function GET() {
  try {
    const { SHOPIFY_STORE_DOMAIN } = process.env;
    
    if (!SHOPIFY_STORE_DOMAIN) {
      return NextResponse.json({ error: "Store domain not configured" }, { status: 500 });
    }

    const token = await getShopifyAccessToken(SHOPIFY_STORE_DOMAIN);
    
    return NextResponse.json({
      has_token: !!token,
      token_preview: token ? token.substring(0, 20) + '...' : null,
      store_domain: SHOPIFY_STORE_DOMAIN
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
