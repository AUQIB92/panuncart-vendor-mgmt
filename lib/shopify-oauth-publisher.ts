/**
 * Shopify OAuth-enabled Product Publisher with Auto-Refresh
 * Uses OAuth tokens with automatic refresh capability
 */

import { makeShopifyAPICall, getFreshShopifyToken } from "./shopify-token-manager";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_API_VERSION = "2024-10";

/**
 * Upload image to Shopify CDN via GraphQL
 */
async function uploadImageToShopify(imageUrl: string, altText: string = ''): Promise<string | null> {
  console.log(`📤 Uploading image to Shopify CDN: ${imageUrl}`);
  
  const query = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: [{
      resource: 'IMAGE',
      filename: `product-image-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: '100000',
      httpMethod: 'POST'
    }]
  };
  
  try {
    // Get fresh access token directly
    const accessToken = await getFreshShopifyToken();
    
    if (!accessToken) {
      console.log('❌ No access token available for GraphQL');
      return null;
    }
    
    // Step 1: Get staging URL
    const graphqlResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );
    
    const graphqlData = await graphqlResponse.json();
    
    if (graphqlData.errors) {
      console.log('❌ GraphQL Error:', graphqlData.errors);
      return null;
    }
    
    const stagedTarget = graphqlData.data.stagedUploadsCreate.stagedTargets[0];
    
    if (!stagedTarget) {
      console.log('❌ No staging target received');
      return null;
    }
    
    console.log('✅ Got staging URL');
    
    // Step 2: Download image and upload to staging URL
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Convert to FormData for multipart upload
    const formData = new FormData();
    
    // Add all required parameters
    stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
      formData.append(param.name, param.value);
    });
    
    // Add the image file
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'image.jpg');
    
    // Upload to staging URL
    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      console.log('❌ Staging upload failed:', uploadResponse.status);
      return null;
    }
    
    console.log('✅ Image uploaded to staging area');
    console.log('📦 Resource URL:', stagedTarget.resourceUrl);
    
    return stagedTarget.resourceUrl;
    
  } catch (error) {
    console.log('❌ Image upload failed:', error);
    return null;
  }
}

interface ShopifyProductInput {
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  variants?: {
    price: string;
    compare_at_price?: string | null;
    sku?: string;
    barcode?: string;
    inventory_quantity?: number;
    weight?: number;
    weight_unit?: string;
  }[];
  images?: { src: string }[];
  status?: "active" | "draft";
}

interface ShopifyProductResponse {
  product: {
    id: number;
    title: string;
    variants: { id: number }[];
  };
}

function getAdminApiUrl(endpoint: string) {
  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}.json`;
}

export async function createShopifyProduct(product: {
  title: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  sku?: string | null;
  barcode?: string | null;
  inventory_quantity?: number;
  category?: string | null;
  tags?: string[] | null;
  images?: string[] | null;
  weight?: number | null;
  weight_unit?: string | null;
  vendor_name?: string;
}): Promise<{ success: boolean; shopify_product_id?: string; shopify_variant_id?: string; error?: string }> {
  console.log('🚀 Creating Shopify product (Auto-Refresh):', {
    title: product.title,
    price: product.price,
    store_domain: SHOPIFY_STORE_DOMAIN,
  });

  // First upload all images to Shopify CDN
  const imageNodes: { src: string }[] = [];
  
  if (product.images && Array.isArray(product.images)) {
    for (const imageUrl of product.images) {
      try {
        // Validate URL first - skip blob URLs and invalid URLs
        const url = new URL(imageUrl);
        
        // Skip blob URLs and localhost URLs that aren't accessible to Shopify
        // Allow Shopify CDN URLs (they start with https://cdn.shopify.com/)
        if ((url.protocol === 'blob:' || 
            url.protocol === 'data:' ||
            (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) &&
            !url.hostname.includes('shopify.com')) {
          console.log(`⚠️  Skipping local/blob/data URL: ${imageUrl}`);
          console.log('   Note: For Shopify integration, upload images to Shopify CDN');
          continue;
        }
        
        const resourceUrl = await uploadImageToShopify(imageUrl, product.title);
        if (resourceUrl) {
          imageNodes.push({ src: resourceUrl });
        }
      } catch (e) {
        console.warn(`Invalid image URL skipped: ${imageUrl}`);
      }
    }
  }
  
  console.log(`✅ Processed ${imageNodes.length} valid images`);
  
  const shopifyProduct: ShopifyProductInput = {
    title: product.title,
    body_html: product.description || "",
    vendor: product.vendor_name || "PanunCart Vendor",
    product_type: product.category || "",
    tags: product.tags?.join(", ") || "",
    status: "active",
    variants: [
      {
        price: product.price.toFixed(2),
        compare_at_price: product.compare_at_price ? product.compare_at_price.toFixed(2) : null,
        sku: product.sku || undefined,
        barcode: product.barcode || undefined,
        inventory_quantity: product.inventory_quantity || 0,
        weight: product.weight || undefined,
        weight_unit: product.weight_unit || "kg",
      },
    ],
    images: imageNodes,
  };

  try {
    console.log('🛍️  Making Shopify API request with auto-refresh...');
    
    const response = await makeShopifyAPICall('products.json', {
      method: "POST",
      body: JSON.stringify({ product: shopifyProduct }),
    });

    console.log('🛍️  Shopify API response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ Shopify API error:", response.status, errorBody);
      
      return { 
        success: false, 
        error: `Shopify API error: ${response.status} - ${errorBody}` 
      };
    }

    const data: ShopifyProductResponse = await response.json();
    console.log('✅ Shopify API success:', data);

    return {
      success: true,
      shopify_product_id: String(data.product.id),
      shopify_variant_id: data.product.variants?.[0] ? String(data.product.variants[0].id) : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Shopify API exception:", message);
    return { success: false, error: message };
  }
}

export async function testShopifyConnection(): Promise<{ success: boolean; message: string }> {
  console.log('🧪 Testing Shopify OAuth connection with auto-refresh...');
  
  try {
    // Get fresh token automatically
    const token = await getFreshShopifyToken();
    
    if (!token) {
      return { 
        success: false, 
        message: "Unable to obtain Shopify access token. Please re-authorize the app." 
      };
    }

    const response = await makeShopifyAPICall('shop.json', {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Shopify OAuth connection successful");
      console.log("Shop:", data.shop?.name);
      return { success: true, message: "Connected to Shopify API via OAuth with auto-refresh" };
    } else {
      const errorBody = await response.text();
      console.error("❌ Shopify OAuth connection failed:", response.status, errorBody);
      return { success: false, message: `Shopify API error: ${response.status}` };
    }
  } catch (error) {
    console.error("❌ Shopify OAuth test failed:", error);
    return { success: false, message: (error as Error).message };
  }
}
