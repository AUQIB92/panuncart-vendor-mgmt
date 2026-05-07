import { createClient } from "@/lib/supabase/server"
import { getShopifyInstallUrl } from "@/lib/shopify-token-manager"
import {
  getPendingVendorPayments,
  getVendorShopifyOrders,
  isShopifyConnectionError,
  type VendorProductMapping,
} from "@/lib/shopify-orders"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PrintInvoiceButton } from "@/components/vendor/print-invoice-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

const PANUNCART_BILL_TO = {
  company: "PanunCart",
  department: "Accounts Payable",
  note: "Vendor settlement against pending Shopify-backed payments",
}

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

function formatVendorAddress(vendor: Record<string, unknown> | null) {
  if (!vendor) {
    return ["Vendor details unavailable"]
  }

  return [
    vendor.business_name ? String(vendor.business_name) : null,
    vendor.contact_name ? String(vendor.contact_name) : null,
    vendor.email ? String(vendor.email) : null,
    vendor.phone ? `Phone: ${String(vendor.phone)}` : null,
    vendor.gst_number ? `GST: ${String(vendor.gst_number)}` : null,
    [
      vendor.business_address ? String(vendor.business_address) : null,
      vendor.city ? String(vendor.city) : null,
      vendor.state ? String(vendor.state) : null,
      vendor.pincode ? String(vendor.pincode) : null,
    ]
      .filter(Boolean)
      .join(", ") || null,
  ].filter((line): line is string => Boolean(line))
}

function buildInvoiceNumber(vendorName: string | null | undefined) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const vendorPart = String(vendorName || "vendor")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()

  return `PAN-${vendorPart || "VENDOR"}-${datePart}`
}

export default async function PendingPaymentInvoicePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: vendorRows } = await supabase.rpc("get_my_vendor")
  const vendor = (vendorRows?.[0] as Record<string, unknown> | null) || null

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

  let shopifyErrorMessage: string | null = null
  let installUrl: string | null = null
  let pendingPayments = [] as ReturnType<typeof getPendingVendorPayments>

  try {
    const orders = await getVendorShopifyOrders(productMappings)
    pendingPayments = getPendingVendorPayments(orders)
  } catch (error) {
    if (isShopifyConnectionError(error)) {
      shopifyErrorMessage = error.message
      installUrl = error.installUrl || getShopifyInstallUrl() || null
    } else {
      shopifyErrorMessage = error instanceof Error ? error.message : "Unable to load pending payments."
    }
  }

  if (!shopifyErrorMessage && pendingPayments.length === 0) {
    notFound()
  }

  const totalDue = pendingPayments.reduce((sum, order) => sum + order.vendorNetAmount, 0)
  const invoiceDate = formatDate(new Date().toISOString())
  const invoiceNumber = buildInvoiceNumber(vendor?.business_name ? String(vendor.business_name) : null)
  const vendorAddress = formatVendorAddress(vendor)

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="w-fit">
          <Link href="/vendor/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <PrintInvoiceButton />
      </div>

      {shopifyErrorMessage ? (
        <Card className="border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300">Settlement invoice could not be generated</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">{shopifyErrorMessage}</p>
              {installUrl && (
                <Button asChild size="sm" variant="outline" className="mt-4 border-amber-500/40 bg-transparent">
                  <Link href={installUrl}>Reconnect Shopify</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border bg-card p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-col gap-6 border-b pb-6 print:pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Pending Payment Invoice
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
                {vendor?.business_name ? String(vendor.business_name) : "Vendor"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                This invoice is raised by the vendor to PanunCart for settlement of currently pending Shopify-backed payments.
              </p>
            </div>
            <div className="space-y-2 text-sm sm:text-right">
              <div>
                <p className="text-muted-foreground">Invoice Number</p>
                <p className="font-semibold text-foreground">{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Invoice Date</p>
                <p className="font-semibold text-foreground">{invoiceDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Due</p>
                <p className="font-semibold text-foreground">{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b py-6 print:py-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Invoice From</p>
              <div className="mt-3 space-y-1 text-sm text-foreground">
                {vendorAddress.map((line) => (
                  <p key={`from-${line}`}>{line}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Invoice To</p>
              <div className="mt-3 space-y-1 text-sm text-foreground">
                <p>{PANUNCART_BILL_TO.company}</p>
                <p>{PANUNCART_BILL_TO.department}</p>
                <p>{PANUNCART_BILL_TO.note}</p>
              </div>
            </div>
          </div>

          <div className="py-6 print:py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendor Items</TableHead>
                  <TableHead className="text-right">Amount Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{order.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.matchedProducts.slice(0, 2).join(", ") || "Vendor items"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.financialStatus.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>{order.vendorItemCount}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatCurrency(order.vendorNetAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-6 border-t pt-6 print:pt-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl text-sm text-muted-foreground">
              <p>
                Basis: pending settlement amount derived from Shopify orders that contain this vendor&apos;s published products and are still pending, authorized, or partially paid.
              </p>
              <p className="mt-2">
                This invoice is intended for PanunCart settlement processing, not for the end customer.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">Pending Orders</span>
                <span className="font-medium text-foreground">{pendingPayments.length}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Invoice Total</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(totalDue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
