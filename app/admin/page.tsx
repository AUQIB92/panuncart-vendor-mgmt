import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Package, Clock, CheckCircle2, ShoppingBag, ArrowRight, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Use SECURITY DEFINER functions to bypass RLS for admin
  const { data: vendors } = await supabase.rpc("admin_get_vendors")
  const { data: products } = await supabase.rpc("admin_get_products")

  const allVendors = (vendors as Array<Record<string, unknown>>) || []
  const allProducts = (products as Array<Record<string, unknown>>) || []

  const vendorStats = {
    total: allVendors.length,
    pending: allVendors.filter((v) => v.status === "pending").length,
    approved: allVendors.filter((v) => v.status === "approved").length,
  }

  const productStats = {
    total: allProducts.length,
    pending: allProducts.filter((p) => p.status === "pending").length,
    approved: allProducts.filter((p) => p.status === "approved").length,
    published: allProducts.filter((p) => p.status === "published").length,
  }

  const stats = [
    { label: "Total Vendors", value: vendorStats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Vendors", value: vendorStats.pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Pending Products", value: productStats.pending, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Published on Shopify", value: productStats.published, icon: ShoppingBag, color: "text-success", bg: "bg-success/10" },
  ]

  const pendingVendors = allVendors.filter((v) => v.status === "pending").slice(0, 5)
  const pendingProducts = allProducts.filter((p) => p.status === "pending").slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage vendors and approve products for your Shopify store
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Pending Vendor Approvals
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/vendors">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingVendors.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success/40" />
                <p className="mt-3 text-sm text-muted-foreground">No pending vendor approvals</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingVendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    href="/admin/vendors"
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{vendor.business_name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {vendor.contact_name} | {vendor.email}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Package className="h-5 w-5 text-primary" />
              Pending Product Reviews
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingProducts.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success/40" />
                <p className="mt-3 text-sm text-muted-foreground">No pending product reviews</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingProducts.map((product) => (
                  <Link
                    key={product.id}
                    href="/admin/products"
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        by {(product as Record<string, unknown>).vendor_business_name as string || "Unknown"} | INR{" "}
                        {Number(product.price as number).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
