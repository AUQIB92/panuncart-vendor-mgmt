/**
 * Shopify Admin API integration
 * Uses the REST Admin API to create products on your Shopify store
 *
 * Required environment variables:
 * - SHOPIFY_STORE_DOMAIN: e.g., "your-store.myshopify.com"
 * - SHOPIFY_ADMIN_ACCESS_TOKEN: Admin API access token from your Shopify app
 */

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN
const SHOPIFY_API_VERSION = "2024-10"

interface ShopifyProductInput {
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  tags?: string
  variants?: {
    price: string
    compare_at_price?: string | null
    sku?: string
    barcode?: string
    inventory_quantity?: number
    weight?: number
    weight_unit?: string
  }[]
  images?: { src: string }[]
  status?: "active" | "draft"
}

interface ShopifyProductResponse {
  product: {
    id: number
    title: string
    variants: { id: number }[]
  }
}

function getAdminApiUrl(endpoint: string) {
  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}.json`
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": SHOPIFY_ADMIN_ACCESS_TOKEN!,
  }
}

export async function createShopifyProduct(product: {
  title: string
  description?: string | null
  price: number
  compare_at_price?: number | null
  sku?: string | null
  barcode?: string | null
  inventory_quantity?: number
  category?: string | null
  tags?: string[] | null
  images?: string[] | null
  weight?: number | null
  weight_unit?: string | null
  vendor_name?: string
}): Promise<{ success: boolean; shopify_product_id?: string; shopify_variant_id?: string; error?: string }> {
  console.log('Creating Shopify product:', {
    title: product.title,
    price: product.price,
    store_domain: SHOPIFY_STORE_DOMAIN,
    has_token: !!SHOPIFY_ADMIN_ACCESS_TOKEN
  })
  
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
    console.error('Missing Shopify credentials:', {
      domain: SHOPIFY_STORE_DOMAIN,
      token_present: !!SHOPIFY_ADMIN_ACCESS_TOKEN
    })
    return { success: false, error: "Shopify credentials not configured" }
  }

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
    images: product.images?.filter(Boolean).map((url) => ({ src: url })) || [],
  }

  try {
    console.log('Making Shopify API request to:', getAdminApiUrl("products"))
    const response = await fetch(getAdminApiUrl("products"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ product: shopifyProduct }),
    })

    console.log('Shopify API response status:', response.status)
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Shopify API error:", response.status, errorBody)
      return { success: false, error: `Shopify API error: ${response.status} - ${errorBody}` }
    }

    const data: ShopifyProductResponse = await response.json()
    console.log('Shopify API success:', data)

    return {
      success: true,
      shopify_product_id: String(data.product.id),
      shopify_variant_id: data.product.variants?.[0] ? String(data.product.variants[0].id) : undefined,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Shopify API exception:", message)
    return { success: false, error: message }
  }
}

export async function deleteShopifyProduct(shopifyProductId: string): Promise<{ success: boolean; error?: string }> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return { success: false, error: "Shopify credentials not configured" }
  }

  try {
    const response = await fetch(getAdminApiUrl(`products/${shopifyProductId}`), {
      method: "DELETE",
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return { success: false, error: `Shopify API error: ${response.status} - ${errorBody}` }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return { success: false, error: message }
  }
}
