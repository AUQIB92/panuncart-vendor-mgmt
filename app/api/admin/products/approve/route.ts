import { createClient } from "@/lib/supabase/server"
import { createShopifyProduct } from "@/lib/shopify-oauth-publisher"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, action, admin_notes } = body

    if (!product_id || !action) {
      return NextResponse.json({ error: "Missing product_id or action" }, { status: 400 })
    }

    // Use RPC to fetch the product (bypasses RLS)
    const { data: products } = await supabase.rpc("admin_get_products")
    const product = (products as Array<Record<string, unknown>>)?.find(
      (p) => p.id === product_id
    )

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (action === "approve") {
      // Push to Shopify
      const shopifyResult = await createShopifyProduct({
        title: product.title as string,
        description: product.description as string | null,
        price: Number(product.price),
        compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
        sku: product.sku as string | null,
        barcode: product.barcode as string | null,
        inventory_quantity: product.inventory_quantity as number,
        category: product.category as string | null,
        tags: product.tags as string[] | null,
        images: product.images as string[] | null,
        weight: product.weight ? Number(product.weight) : null,
        weight_unit: product.weight_unit as string | null,
        vendor_name: product.vendor_business_name as string || "Unknown",
      })

      if (!shopifyResult.success) {
        // Even if Shopify fails, still approve the product in DB
        await supabase.rpc("admin_update_product_status", {
          product_id,
          new_status: "approved",
          notes: admin_notes || `Approved but Shopify push failed: ${shopifyResult.error}`,
        })
        return NextResponse.json({
          success: true,
          message: `Product approved but Shopify push failed: ${shopifyResult.error}. You can retry later.`,
        })
      }

      // Update product with Shopify IDs using RPC
      await supabase.rpc("admin_set_shopify_ids", {
        product_id,
        s_product_id: shopifyResult.shopify_product_id || "",
        s_variant_id: shopifyResult.shopify_variant_id || "",
      })

      return NextResponse.json({
        success: true,
        message: "Product approved and published to Shopify",
        shopify_product_id: shopifyResult.shopify_product_id,
      })
    }

    if (action === "reject") {
      await supabase.rpc("admin_update_product_status", {
        product_id,
        new_status: "rejected",
        notes: admin_notes || "Product did not meet our quality standards",
      })

      return NextResponse.json({ success: true, message: "Product rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
