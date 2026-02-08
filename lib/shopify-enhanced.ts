/**
 * Enhanced Shopify API Client
 * With retry logic, better error handling, and fallback mechanisms
 */

const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = "2024-10";

// Validate required environment variables
if (!SHOPIFY_STORE_DOMAIN) {
  throw new Error("NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is not set");
}

if (!SHOPIFY_ADMIN_ACCESS_TOKEN) {
  throw new Error("SHOPIFY_ACCESS_TOKEN is not set");
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

// Enhanced Shopify API Client with retry logic
class EnhancedShopifyClient {
  private baseUrl: string;
  private accessToken: string;
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // ms

  constructor(storeDomain: string, accessToken: string) {
    this.baseUrl = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}`;
    this.accessToken = accessToken;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": this.accessToken,
    };
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}/${endpoint}.json`;
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🛍️  Shopify API Request (Attempt ${attempt}/${this.maxRetries}):`, url);
        
        const response = await fetch(url, {
          ...options,
          headers,
        });

        console.log(`🛍️  Shopify API Response: ${response.status}`);

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
          console.log(`⏱️  Rate limited. Waiting ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        // Handle authentication errors (401)
        if (response.status === 401) {
          throw new Error('Invalid Shopify credentials. Please check your access token.');
        }

        // Handle permission errors (403)
        if (response.status === 403) {
          throw new Error('Insufficient permissions. Check Shopify app permissions.');
        }

        return response;

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Shopify API attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Shopify API request failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  async createProduct(product: ShopifyProductInput): Promise<{
    success: boolean;
    shopify_product_id?: string;
    shopify_variant_id?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest("products", {
        method: "POST",
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Shopify API error:", response.status, errorBody);
        return {
          success: false,
          error: `Shopify API error: ${response.status} - ${errorBody}`,
        };
      }

      const data: ShopifyProductResponse = await response.json();
      console.log("✅ Product created successfully in Shopify");

      return {
        success: true,
        shopify_product_id: String(data.product.id),
        shopify_variant_id: data.product.variants?.[0]
          ? String(data.product.variants[0].id)
          : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Shopify create product failed:", message);
      return { success: false, error: message };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest("shop");
      return response.ok;
    } catch (error) {
      console.log("❌ Shopify health check failed:", (error as Error).message);
      return false;
    }
  }
}

// Create singleton instance
const shopifyClient = new EnhancedShopifyClient(
  SHOPIFY_STORE_DOMAIN,
  SHOPIFY_ADMIN_ACCESS_TOKEN
);

// Main export function
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
}): Promise<{
  success: boolean;
  shopify_product_id?: string;
  shopify_variant_id?: string;
  error?: string;
}> {
  console.log("🚀 Publishing product to Shopify:", {
    title: product.title,
    price: product.price,
    store_domain: SHOPIFY_STORE_DOMAIN,
  });

  // Validate credentials first
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
    console.error("❌ Missing Shopify credentials:", {
      domain: SHOPIFY_STORE_DOMAIN,
      token_present: !!SHOPIFY_ADMIN_ACCESS_TOKEN,
    });
    return { success: false, error: "Shopify credentials not configured" };
  }

  // Check if Shopify is accessible
  const isHealthy = await shopifyClient.healthCheck();
  if (!isHealthy) {
    return {
      success: false,
      error: "Cannot connect to Shopify API. Please check credentials and permissions.",
    };
  }

  // Transform product data to Shopify format
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
        compare_at_price: product.compare_at_price
          ? product.compare_at_price.toFixed(2)
          : null,
        sku: product.sku || undefined,
        barcode: product.barcode || undefined,
        inventory_quantity: product.inventory_quantity || 0,
        weight: product.weight || undefined,
        weight_unit: product.weight_unit || "kg",
      },
    ],
    images: product.images?.filter(Boolean).map((url) => ({ src: url })) || [],
  };

  // Create product using enhanced client
  return await shopifyClient.createProduct(shopifyProduct);
}

// Test function
export async function testShopifyConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  console.log("🧪 Testing Shopify connection...");
  
  try {
    const isHealthy = await shopifyClient.healthCheck();
    
    if (isHealthy) {
      console.log("✅ Shopify connection successful");
      return { success: true, message: "Connected to Shopify API" };
    } else {
      console.log("❌ Shopify connection failed");
      return { success: false, message: "Cannot connect to Shopify API" };
    }
  } catch (error) {
    console.log("❌ Shopify test failed:", (error as Error).message);
    return { success: false, message: (error as Error).message };
  }
}

// Fallback function for manual admin import
export function generateProductCSV(products: any[]): string {
  const headers = [
    "Title",
    "Description",
    "Price",
    "Compare At Price",
    "SKU",
    "Barcode",
    "Inventory Quantity",
    "Category",
    "Tags",
    "Weight",
    "Weight Unit",
    "Vendor"
  ];

  const csvRows = [
    headers.join(","),
    ...products.map(product => [
      `"${product.title}"`,
      `"${product.description || ''}"`,
      product.price,
      product.compare_at_price || '',
      `"${product.sku || ''}"`,
      `"${product.barcode || ''}"`,
      product.inventory_quantity || 0,
      `"${product.category || ''}"`,
      `"${(product.tags || []).join(', ')}"`,
      product.weight || '',
      `"${product.weight_unit || 'kg'}"`,
      `"${product.vendor_name || 'PanunCart Vendor'}"`
    ].join(","))
  ];

  return csvRows.join("\n");
}
