import { makeShopifyAPICall, ShopifyTokenError } from "@/lib/shopify-token-manager"

const SHOPIFY_ORDER_FIELDS = [
  "id",
  "name",
  "created_at",
  "currency",
  "financial_status",
  "fulfillment_status",
  "email",
  "current_total_price",
  "current_subtotal_price",
  "line_items",
  "customer",
].join(",")

const PENDING_PAYMENT_STATUSES = new Set(["pending", "authorized", "partially_paid"])

interface ShopifyOrderCustomer {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

interface ShopifyLineItem {
  id: number
  product_id?: number | null
  variant_id?: number | null
  title?: string | null
  quantity?: number | null
  price?: string | null
  total_discount?: string | null
}

interface ShopifyOrderResponse {
  id: number
  name: string
  created_at: string
  currency?: string | null
  financial_status?: string | null
  fulfillment_status?: string | null
  email?: string | null
  customer?: ShopifyOrderCustomer | null
  line_items?: ShopifyLineItem[] | null
}

interface ShopifyOrdersApiResponse {
  orders?: ShopifyOrderResponse[]
}

export type VendorProductMapping = {
  localProductId: string
  title: string
  shopifyProductId: string | null
  shopifyVariantId: string | null
}

export type VendorShopifyOrder = {
  id: string
  name: string
  createdAt: string
  currency: string
  customerName: string
  customerEmail: string | null
  financialStatus: string
  fulfillmentStatus: string
  vendorItemCount: number
  vendorGrossAmount: number
  vendorDiscountAmount: number
  vendorNetAmount: number
  matchedProducts: string[]
}

function buildCustomerName(order: ShopifyOrderResponse) {
  const firstName = order.customer?.first_name?.trim()
  const lastName = order.customer?.last_name?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()

  return fullName || "Customer"
}

function normalizeStatus(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

function getMatchingIds(productMappings: VendorProductMapping[]) {
  const productIds = new Set(
    productMappings
      .map((product) => product.shopifyProductId)
      .filter((value): value is string => Boolean(value))
  )

  const variantIds = new Set(
    productMappings
      .map((product) => product.shopifyVariantId)
      .filter((value): value is string => Boolean(value))
  )

  return { productIds, variantIds }
}

function getMatchedLineItems(order: ShopifyOrderResponse, productIds: Set<string>, variantIds: Set<string>) {
  return (order.line_items || []).filter((lineItem) => {
    const productId = lineItem.product_id ? String(lineItem.product_id) : null
    const variantId = lineItem.variant_id ? String(lineItem.variant_id) : null

    return (productId && productIds.has(productId)) || (variantId && variantIds.has(variantId))
  })
}

function summarizeLineItems(matchedLineItems: ShopifyLineItem[]) {
  const vendorItemCount = matchedLineItems.reduce((sum, lineItem) => sum + Number(lineItem.quantity || 0), 0)
  const vendorGrossAmount = matchedLineItems.reduce(
    (sum, lineItem) => sum + Number(lineItem.price || 0) * Number(lineItem.quantity || 0),
    0
  )
  const vendorDiscountAmount = matchedLineItems.reduce(
    (sum, lineItem) => sum + Number(lineItem.total_discount || 0),
    0
  )
  const vendorNetAmount = Math.max(0, vendorGrossAmount - vendorDiscountAmount)
  const matchedProducts = Array.from(
    new Set(matchedLineItems.map((lineItem) => lineItem.title?.trim()).filter((title): title is string => Boolean(title)))
  )

  return {
    vendorItemCount,
    vendorGrossAmount,
    vendorDiscountAmount,
    vendorNetAmount,
    matchedProducts,
  }
}

function toVendorShopifyOrder(order: ShopifyOrderResponse, matchedLineItems: ShopifyLineItem[]): VendorShopifyOrder {
  const summary = summarizeLineItems(matchedLineItems)

  return {
    id: String(order.id),
    name: order.name,
    createdAt: order.created_at,
    currency: order.currency || "INR",
    customerName: buildCustomerName(order),
    customerEmail: order.email || order.customer?.email || null,
    financialStatus: normalizeStatus(order.financial_status, "pending"),
    fulfillmentStatus: normalizeStatus(order.fulfillment_status, "unfulfilled"),
    vendorItemCount: summary.vendorItemCount,
    vendorGrossAmount: summary.vendorGrossAmount,
    vendorDiscountAmount: summary.vendorDiscountAmount,
    vendorNetAmount: summary.vendorNetAmount,
    matchedProducts: summary.matchedProducts,
  }
}

export async function getVendorShopifyOrders(
  productMappings: VendorProductMapping[],
  limit: number = 100
): Promise<VendorShopifyOrder[]> {
  if (productMappings.length === 0) {
    return []
  }

  const { productIds, variantIds } = getMatchingIds(productMappings)

  if (productIds.size === 0 && variantIds.size === 0) {
    return []
  }

  const params = new URLSearchParams({
    status: "any",
    limit: String(limit),
    fields: SHOPIFY_ORDER_FIELDS,
  })

  const response = await makeShopifyAPICall(`orders.json?${params.toString()}`, {
    method: "GET",
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to fetch Shopify orders: ${response.status} - ${errorBody}`)
  }

  const payload = (await response.json()) as ShopifyOrdersApiResponse
  const orders = payload.orders || []

  return orders
    .map((order) => {
      const matchedLineItems = getMatchedLineItems(order, productIds, variantIds)

      if (matchedLineItems.length === 0) {
        return null
      }

      return toVendorShopifyOrder(order, matchedLineItems)
    })
    .filter((order): order is VendorShopifyOrder => Boolean(order))
}

export function getPendingVendorPayments(orders: VendorShopifyOrder[]) {
  return orders.filter((order) => PENDING_PAYMENT_STATUSES.has(order.financialStatus))
}

export function isShopifyConnectionError(error: unknown): error is ShopifyTokenError {
  return error instanceof ShopifyTokenError
}
