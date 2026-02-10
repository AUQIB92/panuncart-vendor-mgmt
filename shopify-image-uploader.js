/**
 * Shopify Image Upload Utility
 * Uploads images to Shopify CDN first, then associates them with products
 */

require('dotenv').config({ path: '.env.local' });

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

/**
 * Upload image to Shopify CDN via GraphQL
 */
async function uploadImageToShopify(imageUrl, altText = '') {
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
      fileSize: '100000', // Approximate size
      httpMethod: 'POST'
    }]
  };
  
  try {
    // Step 1: Get staging URL
    const graphqlResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
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
    stagedTarget.parameters.forEach(param => {
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
    console.log('❌ Image upload failed:', error.message);
    return null;
  }
}

/**
 * Create product with uploaded images
 */
async function createProductWithImages(productData) {
  console.log('🛍️  Creating product with images...');
  
  // First upload all images
  const imageNodes = [];
  
  if (productData.images && Array.isArray(productData.images)) {
    for (const imageUrl of productData.images) {
      try {
        // Validate URL first
        new URL(imageUrl);
        
        const resourceUrl = await uploadImageToShopify(imageUrl, productData.title);
        if (resourceUrl) {
          imageNodes.push({
            originalSrc: resourceUrl,
            altText: productData.title || 'Product Image'
          });
        }
      } catch (e) {
        console.log(`⚠️  Skipping invalid image URL: ${imageUrl}`);
      }
    }
  }
  
  // GraphQL mutation to create product with images
  const mutation = `
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          images(first: 10) {
            edges {
              node {
                id
                url
              }
            }
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
    input: {
      title: productData.title,
      descriptionHtml: productData.description || '',
      vendor: productData.vendor || 'PanunCart Vendor',
      productType: productData.category || '',
      tags: productData.tags || [],
      variants: [{
        price: productData.price.toString(),
        compareAtPrice: productData.compare_at_price?.toString(),
        sku: productData.sku,
        barcode: productData.barcode,
        inventoryQuantity: productData.inventory_quantity || 0,
        weight: productData.weight,
        weightUnit: productData.weight_unit || 'KG'
      }],
      images: imageNodes
    }
  };
  
  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );
    
    const data = await response.json();
    
    if (data.errors) {
      console.log('❌ GraphQL Errors:', data.errors);
      return { success: false, error: data.errors.map(e => e.message).join(', ') };
    }
    
    if (data.data.productCreate.userErrors.length > 0) {
      const errors = data.data.productCreate.userErrors;
      console.log('❌ User Errors:', errors);
      return { success: false, error: errors.map(e => `${e.field}: ${e.message}`).join(', ') };
    }
    
    const product = data.data.productCreate.product;
    console.log('✅ Product created successfully!');
    console.log('Product ID:', product.id);
    console.log('Images uploaded:', product.images.edges.length);
    
    return {
      success: true,
      shopify_product_id: product.id.replace('gid://shopify/Product/', ''),
      images_count: product.images.edges.length
    };
    
  } catch (error) {
    console.log('❌ Product creation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test the image upload functionality
 */
async function testImageUpload() {
  console.log('🧪 TESTING SHOPIFY IMAGE UPLOAD');
  console.log('==============================\n');
  
  // Test with a valid image URL
  const testData = {
    title: "Test Product with Uploaded Images",
    description: "This product has images properly uploaded to Shopify CDN",
    price: 29.99,
    sku: `IMG-TEST-${Date.now()}`,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format"
    ],
    category: "Test Category",
    tags: ["test", "image-upload"]
  };
  
  const result = await createProductWithImages(testData);
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Image upload working correctly');
    console.log(`Product ID: ${result.shopify_product_id}`);
    console.log(`Images uploaded: ${result.images_count}`);
  } else {
    console.log('\n❌ FAILED:', result.error);
  }
}

// Export functions for use in other modules
module.exports = {
  uploadImageToShopify,
  createProductWithImages
};

// Run test if called directly
if (require.main === module) {
  testImageUpload();
}
