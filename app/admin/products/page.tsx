import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductReviewList } from "@/components/admin/product-review-list"

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Revert to RPC function for reliable admin access
  const { data: products } = await supabase.rpc("admin_get_products")

  // Map RPC result to match ProductReviewList interface
  const mappedProducts = (products || []).map((p: Record<string, unknown>) => ({
    ...p,
    vendors: {
      business_name: p.vendor_business_name as string || "Unknown",
      contact_name: "",
      status: "approved",
    },
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Product Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Approve products to push them to your Shopify store, or reject with feedback
        </p>
      </div>
      <ProductReviewList products={mappedProducts} />
    </div>
  )
}
