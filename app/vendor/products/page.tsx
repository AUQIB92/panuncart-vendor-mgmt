import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, Plus, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending: { label: "Pending Review", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  published: { label: "Published", variant: "default" },
}

export default async function VendorProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Use SECURITY DEFINER functions to bypass RLS
  const { data: vendorRows } = await supabase.rpc("get_my_vendor")
  const vendor = vendorRows?.[0] || null

  if (vendor?.status !== "approved") {
    redirect("/vendor")
  }

  const { data: products } = await supabase.rpc("get_my_products")

  const allProducts = products || []

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Products</h1>
          <p className="mt-1 text-muted-foreground">
            {allProducts.length} {allProducts.length === 1 ? "product" : "products"} listed
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {allProducts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-foreground">No products yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first product to get started
            </p>
            <Button asChild className="mt-6">
              <Link href="/vendor/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allProducts.map((product) => (
            <Link key={product.id} href={`/vendor/products/${product.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">{product.title}</CardTitle>
                    <Badge variant={statusConfig[product.status]?.variant || "secondary"} className="shrink-0">
                      {statusConfig[product.status]?.label || product.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {product.description || "No description"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                      INR {Number(product.price).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Qty: {product.inventory_quantity}
                    </span>
                  </div>
                  {product.category && (
                    <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {product.category}
                    </span>
                  )}
                  {product.admin_notes && product.status === "rejected" && (
                    <p className="mt-3 rounded-md bg-destructive/5 p-2 text-xs text-destructive">
                      Admin: {product.admin_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
