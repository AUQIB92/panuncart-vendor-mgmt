import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, Clock, CheckCircle2, XCircle, Plus, ArrowRight } from "lucide-react"
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

export const revalidate = 0 // Disable caching, always fetch fresh data

export default async function VendorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Use SECURITY DEFINER functions to bypass RLS
  const { data: vendorRows } = await supabase.rpc("get_my_vendor")
  const vendor = vendorRows?.[0] || null
  const vendorStatus = vendor?.status || "pending"

  const { data: products } = await supabase.rpc("get_my_products")

  const allProducts = products || []
  const totalProducts = allProducts.length
  const pendingProducts = allProducts.filter((p) => p.status === "pending").length
  const approvedProducts = allProducts.filter((p) => p.status === "approved" || p.status === "published").length
  const rejectedProducts = allProducts.filter((p) => p.status === "rejected").length

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "text-primary" },
    { label: "Pending Review", value: pendingProducts, icon: Clock, color: "text-warning" },
    { label: "Approved", value: approvedProducts, icon: CheckCircle2, color: "text-success" },
    { label: "Rejected", value: rejectedProducts, icon: XCircle, color: "text-destructive" },
  ]

  const recentProducts = allProducts.slice(0, 5)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome, {vendor?.contact_name || "Vendor"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {vendorStatus === "approved"
              ? "Your account is approved. Start adding products!"
              : vendorStatus === "pending"
                ? "Your account is pending admin approval."
                : vendorStatus === "rejected"
                  ? "Your account has been rejected. Please contact admin."
                  : "Your account is suspended. Please contact admin."}
          </p>
        </div>
        {vendorStatus === "approved" && (
          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        )}
      </div>

      {vendorStatus !== "approved" && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50 p-5 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-400">
                {vendorStatus === "pending"
                  ? "Account Pending Approval"
                  : vendorStatus === "rejected"
                    ? "Account Rejected"
                    : "Account Suspended"}
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
                {vendorStatus === "pending"
                  ? "Your vendor account is awaiting admin approval. Once approved, you will be able to add and manage products. This typically takes 1-2 business days."
                  : "Please contact the PanunCart admin team for more information about your account status."}
              </p>
            </div>
          </div>
        </div>
      )}

      {vendorStatus === "approved" && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Recent Products</CardTitle>
              {totalProducts > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vendor/products">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-4 text-lg font-medium text-foreground">No products yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Start by adding your first product</p>
                  <Button asChild className="mt-4">
                    <Link href="/vendor/products/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Product
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/vendor/products/${product.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{product.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          INR {Number(product.price).toFixed(2)} | SKU: {product.sku || "N/A"}
                        </p>
                      </div>
                      <Badge variant={statusConfig[product.status]?.variant || "secondary"}>
                        {statusConfig[product.status]?.label || product.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
