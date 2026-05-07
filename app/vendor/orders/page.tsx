import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Clock3, FileText, PackageSearch, ShoppingCart, Store, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getPendingVendorPayments,
  getVendorShopifyOrders,
  isShopifyConnectionError,
  type VendorProductMapping,
} from "@/lib/shopify-orders"
import { getShopifyInstallUrl } from "@/lib/shopify-token-manager"

const fulfillmentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unfulfilled: { label: "Unfulfilled", variant: "outline" },
  partial: { label: "Partially Fulfilled", variant: "secondary" },
  fulfilled: { label: "Fulfilled", variant: "default" },
  restocked: { label: "Restocked", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

const financialStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  authorized: { label: "Authorized", variant: "secondary" },
  partially_paid: { label: "Partially Paid", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  partially_refunded: { label: "Partially Refunded", variant: "secondary" },
  refunded: { label: "Refunded", variant: "destructive" },
  voided: { label: "Voided", variant: "destructive" },
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export const revalidate = 0

function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value || 0))
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set"

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return "Invalid date"

  return dateFormatter.format(parsedDate)
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: vendorRows } = await supabase.rpc("get_my_vendor")
  const vendor = vendorRows?.[0] || null

  if (vendor?.status !== "approved") {
    redirect("/vendor")
  }

  const { data: products } = await supabase.rpc("get_my_products")

  const productMappings: VendorProductMapping[] = ((products as Array<Record<string, unknown>> | null) || [])
    .filter((product) => product.shopify_product_id || product.shopify_variant_id)
    .map((product) => ({
      localProductId: String(product.id),
      title: String(product.title || "Product"),
      shopifyProductId: product.shopify_product_id ? String(product.shopify_product_id) : null,
      shopifyVariantId: product.shopify_variant_id ? String(product.shopify_variant_id) : null,
    }))

  let orders = [] as Awaited<ReturnType<typeof getVendorShopifyOrders>>
  let shopifyErrorMessage: string | null = null
  let installUrl: string | null = null

  try {
    orders = await getVendorShopifyOrders(productMappings)
  } catch (error) {
    if (isShopifyConnectionError(error)) {
      shopifyErrorMessage = error.message
      installUrl = error.installUrl || getShopifyInstallUrl() || null
    } else {
      shopifyErrorMessage = error instanceof Error ? error.message : "Unable to load Shopify orders."
    }
  }

  const pendingPayments = getPendingVendorPayments(orders)
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.vendorNetAmount, 0)
  const paidRevenue = orders
    .filter((order) => order.financialStatus === "paid")
    .reduce((sum, order) => sum + order.vendorNetAmount, 0)
  const pendingPaymentAmount = pendingPayments.reduce((sum, order) => sum + order.vendorNetAmount, 0)

  const stats = [
    { label: "Matched Orders", value: totalOrders.toString(), icon: ShoppingCart, helper: "Latest Shopify orders containing your products" },
    { label: "Vendor Sales", value: formatCurrency(totalRevenue), icon: TrendingUp, helper: "Net value for your matched line items" },
    { label: "Pending Payments", value: formatCurrency(pendingPaymentAmount), icon: Clock3, helper: `${pendingPayments.length} orders not fully paid yet` },
    { label: "Paid Orders", value: formatCurrency(paidRevenue), icon: Wallet, helper: "Orders marked paid in Shopify" },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Orders & Payments</h1>
          <p className="mt-1 text-muted-foreground">
            Shopify orders are filtered down to the products published from your vendor catalog, and pending settlements can be invoiced to PanunCart.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {pendingPayments.length > 0 && (
            <Button asChild>
              <Link href="/vendor/orders/invoice/pending">
                <FileText className="mr-2 h-4 w-4" />
                Invoice PanunCart
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/vendor/products">Manage Products</Link>
          </Button>
        </div>
      </div>

      {productMappings.length === 0 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-5">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300">No Shopify-linked products yet</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                This page only shows orders for products that have already been published to Shopify from your vendor catalog.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {shopifyErrorMessage && (
        <Card className="mb-6 border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300">
                Shopify orders could not be loaded
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                {shopifyErrorMessage}
              </p>
              {installUrl && (
                <Button asChild size="sm" variant="outline" className="mt-4 border-amber-500/40 bg-transparent">
                  <Link href={installUrl}>Reconnect Shopify</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/80">{stat.helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Recent Orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest Shopify orders containing one or more of your published products.
              </p>
            </div>
            <Badge variant="outline">{totalOrders} total</Badge>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="py-14 text-center">
                <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">No orders yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once your Shopify store receives orders for your published products, they will appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead className="text-right">Vendor Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{order.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.vendorItemCount} items | {formatDate(order.createdAt)}
                          </p>
                          {order.matchedProducts.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {order.matchedProducts.slice(0, 2).join(", ")}
                              {order.matchedProducts.length > 2 ? ` +${order.matchedProducts.length - 2} more` : ""}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail || "No email"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={financialStatusConfig[order.financialStatus]?.variant || "secondary"}>
                            {financialStatusConfig[order.financialStatus]?.label || formatStatusLabel(order.financialStatus)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Gross {formatCurrency(order.vendorGrossAmount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={fulfillmentStatusConfig[order.fulfillmentStatus]?.variant || "secondary"}>
                          {fulfillmentStatusConfig[order.fulfillmentStatus]?.label || formatStatusLabel(order.fulfillmentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(order.vendorNetAmount)}</p>
                        {order.vendorDiscountAmount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Discounts {formatCurrency(order.vendorDiscountAmount)}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Pending Payments</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Shopify orders where payment is still pending, authorized, or partially paid. Raise one invoice to PanunCart for these settlements.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pendingPayments.length > 0 && (
                <Button asChild size="sm">
                  <Link href="/vendor/orders/invoice/pending">
                    <FileText className="mr-2 h-4 w-4" />
                    Invoice PanunCart
                  </Link>
                </Button>
              )}
              <Badge variant="outline">{formatCurrency(pendingPaymentAmount)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <div className="py-14 text-center">
                <Clock3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">No pending payments</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Orders with unpaid or partially paid Shopify financial status will be listed here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((order) => (
                  <div key={order.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{order.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.customerName} | {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge variant={financialStatusConfig[order.financialStatus]?.variant || "secondary"}>
                        {financialStatusConfig[order.financialStatus]?.label || formatStatusLabel(order.financialStatus)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(order.vendorNetAmount)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.vendorItemCount} items | {order.matchedProducts.slice(0, 2).join(", ") || "Vendor items"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xs text-muted-foreground">
                          Fulfillment: {formatStatusLabel(order.fulfillmentStatus)}
                        </p>
                        <Button asChild size="sm">
                          <Link href="/vendor/orders/invoice/pending">
                            <FileText className="mr-2 h-4 w-4" />
                            Invoice PanunCart
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
