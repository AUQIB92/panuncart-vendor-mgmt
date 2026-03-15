import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { createShopifyProduct } from "@/lib/shopify-oauth-publisher"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    /* ---------------- AUTH ---------------- */
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    /* ---------------- BODY ---------------- */
    const body = await request.json()
    const { product_id, action, admin_notes } = body

    if (!product_id || !action) {
      return NextResponse.json(
        { error: "Missing product_id or action" },
        { status: 400 }
      )
    }

    /* ---------------- FETCH PRODUCT (BYPASS RLS) ---------------- */
    const { data: products, error: fetchError } = await supabase.rpc(
      "admin_get_products"
    )

    if (fetchError || !products) {
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      )
    }

    const product = (products as Array<Record<string, unknown>>).find(
      (p) => p.id === product_id
    )

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    /* ---------------- APPROVE FLOW ---------------- */
    if (action === "approve") {
      console.log("🚀 APPROVING PRODUCT:", product_id)

      const images = Array.isArray(product.images)
        ? (product.images as string[])
        : []

      console.log(`📦 Images before Shopify: ${images.length}`)

      /* ---------------- PUSH TO SHOPIFY ---------------- */
      const shopifyResult = await createShopifyProduct({
        title: product.title as string,
        description: (product.description as string) || null,
        price: Number(product.price),
        compare_at_price: product.compare_at_price
          ? Number(product.compare_at_price)
          : null,
        sku: (product.sku as string) || null,
        barcode: (product.barcode as string) || null,
        inventory_quantity: Number(product.inventory_quantity) || 0,
        category: (product.category as string) || null,
        tags: (product.tags as string[]) || null,
        images, // ✅ ALWAYS ARRAY
        weight: product.weight ? Number(product.weight) : null,
        weight_unit: (product.weight_unit as string) || null,
        vendor_name:
          (product.vendor_business_name as string) || "Unknown",
      })

      /* ---------------- UPDATE STATUS EVEN IF SHOPIFY FAILS ---------------- */
      if (!shopifyResult.success) {
        await supabase.rpc("admin_update_product_status", {
          product_id,
          new_status: "approved",
          notes:
            admin_notes ||
            `Approved but Shopify push failed: ${shopifyResult.error}`,
        })

        return NextResponse.json({
          success: true,
          message:
            "Product approved but Shopify push failed. You can retry later.",
          shopify_install_url: shopifyResult.install_url || null,
        })
      }

      /* ---------------- SAVE SHOPIFY IDS ---------------- */
      await supabase.rpc("admin_set_shopify_ids", {
        product_id,
        s_product_id: shopifyResult.shopify_product_id || "",
        s_variant_id: shopifyResult.shopify_variant_id || "",
      })

      /* ---------------- SAFE IMAGE UPDATE ---------------- */
      const uploadedUrls = shopifyResult.uploaded_image_urls

      if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
        console.log(
          `✅ Updating DB with ${uploadedUrls.length} Shopify CDN images`
        )

        const serviceSupabase = createServiceRoleClient()

        const { error } = await serviceSupabase
          .from("products")
          .update({ images: uploadedUrls })
          .eq("id", product_id)

        if (error) {
          console.error(
            "❌ Failed to update product images:",
            error.message
          )
        }
      } else {
        console.log(
          "⚠️ Shopify returned no images — preserving existing images"
        )
      }

      return NextResponse.json({
        success: true,
        message: "Product approved and published to Shopify",
        shopify_product_id: shopifyResult.shopify_product_id,
      })
    }

    /* ---------------- REJECT FLOW ---------------- */
    if (action === "reject") {
      await supabase.rpc("admin_update_product_status", {
        product_id,
        new_status: "rejected",
        notes:
          admin_notes || "Product did not meet our quality standards",
      })

      return NextResponse.json({
        success: true,
        message: "Product rejected",
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (err) {
    console.error("❌ APPROVE API ERROR:", err)
    const message =
      err instanceof Error
        ? err.message
        : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
