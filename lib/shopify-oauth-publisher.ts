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
  console.log(`📝 Alt text: ${altText}`);
  
  // Validate URL first
  try {
    new URL(imageUrl);
    console.log('✅ URL validation passed');
  } catch (e) {
    console.log(`❌ Invalid URL format: ${imageUrl}`);
    return null;
  }
  
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
      filename: `product-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
      mimeType: 'image/jpeg',
      fileSize: '2000000', // 2MB estimate
      httpMethod: 'POST'
    }]
  };
  
  try {
    console.log('🔑 Getting fresh Shopify access token...');
    // Get fresh access token directly
    const accessToken = await getFreshShopifyToken();
    
    if (!accessToken) {
      console.log('❌ No access token available for GraphQL');
      return null;
    }
    
    console.log('✅ Got access token, proceeding with GraphQL request');
    
    // Step 1: Get staging URL
    console.log('📡 Requesting staging URL from Shopify GraphQL...');
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
    
    console.log(`📡 GraphQL response status: ${graphqlResponse.status}`);
    
    const graphqlData = await graphqlResponse.json();
    
    if (graphqlData.errors) {
      console.log('❌ GraphQL Error:', JSON.stringify(graphqlData.errors, null, 2));
      return null;
    }
    
    if (graphqlData.data.stagedUploadsCreate.userErrors.length > 0) {
      const errors = graphqlData.data.stagedUploadsCreate.userErrors;
      console.log('❌ GraphQL User Errors:', errors);
      return null;
    }
    
    const stagedTarget = graphqlData.data.stagedUploadsCreate.stagedTargets[0];
    
    if (!stagedTarget) {
      console.log('❌ No staging target received');
      return null;
    }
    
    console.log('✅ Got staging URL successfully');
    console.log('📦 Staging URL:', stagedTarget.url);
    console.log('🔗 Resource URL:', stagedTarget.resourceUrl);
    
    // Step 2: Download image and upload to staging URL
    console.log('📥 Downloading image from source...');
    const imageResponse = await fetch(imageUrl);
    
    console.log(`📥 Image download response status: ${imageResponse.status}`);
    
    if (!imageResponse.ok) {
      console.log(`❌ Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      return null;
    }
    
    const contentType = imageResponse.headers.get('content-type');
    console.log(`📥 Content-Type: ${contentType}`);
    
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log(`✅ Image downloaded (${imageBuffer.byteLength} bytes)`);
    
    // Convert to FormData for multipart upload
    const formData = new FormData();
    
    // Add all required parameters
    stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
      formData.append(param.name, param.value);
    });
    
    // Add the image file
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'image.jpg');
    
    console.log('📤 Uploading to Shopify staging area...');
    
    // Upload to staging URL
    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData,
    });
    
    console.log(`📤 Staging upload response status: ${uploadResponse.status}`);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log('❌ Staging upload failed:', uploadResponse.status, errorText);
      return null;
    }
    
    console.log('✅ Image uploaded to staging area successfully');
    console.log('📦 Final Resource URL:', stagedTarget.resourceUrl);
    
    return stagedTarget.resourceUrl;
    
  } catch (error: any) {
    console.log('❌ Image upload failed:', error.message);
    console.log('Stack:', error.stack);
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
  // Optional: product ID for database updates
  product_id?: string;
}): Promise<{ success: boolean; shopify_product_id?: string; shopify_variant_id?: string; uploaded_image_urls?: string[]; error?: string }> {
  console.log('🚀 Creating Shopify product (Auto-Refresh):', {
    title: product.title,
    price: product.price,
    store_domain: SHOPIFY_STORE_DOMAIN,
  });

  // First upload all images to Shopify CDN
  const imageNodes: { src: string }[] = [];
  
  if (product.images && Array.isArray(product.images)) {
    console.log(`📤 Processing ${product.images.length} images for upload...`);
    
    // Log all incoming image URLs for debugging
    console.log('📥 Incoming image URLs:', product.images);
    
    // Process images sequentially to avoid rate limiting
    for (let i = 0; i < product.images.length; i++) {
      const imageUrl = product.images[i];
      try {
        console.log(`🔄 Processing image ${i + 1}/${product.images.length}: ${imageUrl}`);
        
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
        
        console.log(`📤 Attempting to upload image ${i + 1} to Shopify CDN...`);
        const resourceUrl = await uploadImageToShopify(imageUrl, `${product.title} - Image ${i + 1}`);
        
        if (resourceUrl) {
          imageNodes.push({ src: resourceUrl });
          console.log(`✅ Image ${i + 1} uploaded successfully: ${resourceUrl}`);
        } else {
          console.log(`❌ Failed to upload image ${i + 1}: ${imageUrl}`);
          console.log('   This image will not be included in the final product');
        }
      } catch (e) {
        console.warn(`❌ Invalid image URL skipped: ${imageUrl}`, e);
      }
    }
  } else {
    console.log('⚠️  No images array provided or images is not an array');
    if (product.images) {
      console.log('   Images type:', typeof product.images);
      console.log('   Images value:', product.images);
    }
  }
  
  console.log(`✅ Processed ${imageNodes.length} valid images`);
  console.log('🔍 DEBUG: imageNodes array:', imageNodes);
  console.log('🔍 DEBUG: Returning uploaded_image_urls:', imageNodes.map(node => node.src));
  
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
      // Return the clean CDN URLs that were actually uploaded
      uploaded_image_urls: imageNodes.map(node => node.src)
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
