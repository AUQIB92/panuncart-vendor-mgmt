/**
 * Shopify Image CDN Upload API Route
 * Handles uploading images to Shopify's CDN via GraphQL staged uploads
 */

import { NextResponse } from 'next/server';
import { getFreshShopifyToken, makeShopifyAPICall } from '@/lib/shopify-token-manager';

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading image to Shopify CDN: ${imageFile.name}`);
    
    // Get fresh access token
    const accessToken = await getFreshShopifyToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unable to get Shopify access token' },
        { status: 401 }
      );
    }

    // Step 1: Get staging URL from Shopify GraphQL
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
        filename: imageFile.name,
        mimeType: imageFile.type,
        fileSize: imageFile.size.toString(),
        httpMethod: 'POST'
      }]
    };

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
      console.error('GraphQL Error:', graphqlData.errors);
      return NextResponse.json(
        { success: false, error: 'GraphQL request failed' },
        { status: 500 }
      );
    }

    const stagedTarget = graphqlData.data.stagedUploadsCreate.stagedTargets[0];

    if (!stagedTarget) {
      return NextResponse.json(
        { success: false, error: 'No staging target received' },
        { status: 500 }
      );
    }

    console.log('✅ Got staging URL');

    // Step 2: Upload image to staging area
    const arrayBuffer = await imageFile.arrayBuffer();
    
    const formDataUpload = new FormData();
    
    // Add all required parameters
    stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
      formDataUpload.append(param.name, param.value);
    });
    
    // Add the image file
    const blob = new Blob([arrayBuffer], { type: imageFile.type });
    formDataUpload.append('file', blob, imageFile.name);

    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formDataUpload,
    });

    if (!uploadResponse.ok) {
      console.error('Staging upload failed:', uploadResponse.status);
      return NextResponse.json(
        { success: false, error: 'Failed to upload to staging area' },
        { status: 500 }
      );
    }

    console.log('✅ Image uploaded to Shopify CDN');
    console.log('📦 Resource URL:', stagedTarget.resourceUrl);

    return NextResponse.json({
      success: true,
      cdnUrl: stagedTarget.resourceUrl,
      message: 'Image successfully uploaded to Shopify CDN'
    });

  } catch (error: any) {
    console.error('❌ Image upload failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
