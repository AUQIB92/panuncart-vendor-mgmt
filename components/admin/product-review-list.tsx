"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  ShoppingBag,
  ExternalLink,
  Eye,
  Send,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Product {
  id: string
  title: string
  description: string | null
  price: number
  compare_at_price: number | null
  sku: string | null
  barcode: string | null
  inventory_quantity: number
  category: string | null
  tags: string[] | null
  images: string[] | null
  weight: number | null
  weight_unit: string | null
  status: string
  admin_notes: string | null
  shopify_product_id: string | null
  created_at: string
  vendors: { business_name: string; contact_name: string; status: string } | null
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending: { label: "Pending Review", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  published: { label: "On Shopify", variant: "default" },
}

export function ProductReviewList({ products }: { products: Product[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rejectProduct, setRejectProduct] = useState<Product | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")
  const router = useRouter()

  async function handleApprove(productId: string) {
    setLoading(productId)
    try {
      const res = await fetch("/api/admin/products/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, action: "approve" }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Product approved and published to Shopify!")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to approve product")
      }
    } catch {
      toast.error("Network error. Please try again.")
    }
    setLoading(null)
  }

  async function handleReject() {
    if (!rejectProduct) return
    setLoading(rejectProduct.id)
    try {
      const res = await fetch("/api/admin/products/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: rejectProduct.id,
          action: "reject",
          admin_notes: rejectNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Product rejected with feedback")
        setRejectProduct(null)
        setRejectNotes("")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to reject product")
      }
    } catch {
      toast.error("Network error. Please try again.")
    }
    setLoading(null)
  }

  const pendingProducts = products.filter((p) => p.status === "pending")
  const publishedProducts = products.filter((p) => p.status === "published")
  const rejectedProducts = products.filter((p) => p.status === "rejected")
  const allOther = products.filter((p) => p.status === "draft" || p.status === "approved")

  function ProductCard({ product }: { product: Product }) {
    const status = statusConfig[product.status] || statusConfig.draft
    const isPublished = product.status === "published"

    return (
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {product.vendors?.business_name || "Unknown vendor"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-semibold text-foreground">
                  INR {Number(product.price).toFixed(2)}
                </span>
                {product.compare_at_price && (
                  <span className="text-muted-foreground line-through">
                    INR {Number(product.compare_at_price).toFixed(2)}
                  </span>
                )}
                <span className="text-muted-foreground">Qty: {product.inventory_quantity}</span>
                {product.sku && <span className="text-muted-foreground">SKU: {product.sku}</span>}
                {product.category && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {product.category}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
              )}
              {product.admin_notes && (
                <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  <strong>Admin notes:</strong> {product.admin_notes}
                </p>
              )}
              {isPublished && product.shopify_product_id && (
                <p className="mt-2 flex items-center gap-1 text-xs text-success">
                  <ShoppingBag className="h-3 w-3" />
                  Shopify Product ID: {product.shopify_product_id}
                </p>
              )}
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => setSelectedProduct(product)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Details
            </Button>

            {product.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(product.id)}
                  disabled={loading === product.id}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {loading === product.id ? "Publishing..." : "Approve & Push to Shopify"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setRejectProduct(product)
                    setRejectNotes("")
                  }}
                  disabled={loading === product.id}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}

            {isPublished && product.shopify_product_id && (
              <a
                href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "panuncart.myshopify.com"}/admin/products/${product.shopify_product_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Shopify
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingProducts.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            On Shopify ({publishedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedProducts.length})
          </TabsTrigger>
          {allOther.length > 0 && (
            <TabsTrigger value="other" className="gap-2">
              <FileText className="h-4 w-4" />
              Other ({allOther.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending">
          {pendingProducts.length === 0 ? (
            <EmptyState message="No products pending review" />
          ) : (
            <div className="flex flex-col gap-4">
              {pendingProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published">
          {publishedProducts.length === 0 ? (
            <EmptyState message="No products published on Shopify yet" />
          ) : (
            <div className="flex flex-col gap-4">
              {publishedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedProducts.length === 0 ? (
            <EmptyState message="No rejected products" />
          ) : (
            <div className="flex flex-col gap-4">
              {rejectedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </TabsContent>

        {allOther.length > 0 && (
          <TabsContent value="other">
            <div className="flex flex-col gap-4">
              {allOther.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription>
                  by {selectedProduct.vendors?.business_name || "Unknown"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2 text-sm">
                {selectedProduct.description && (
                  <div>
                    <p className="font-medium text-muted-foreground">Description</p>
                    <p className="mt-1 text-foreground">{selectedProduct.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-medium text-muted-foreground">Price</p>
                    <p className="text-foreground">INR {Number(selectedProduct.price).toFixed(2)}</p>
                  </div>
                  {selectedProduct.compare_at_price && (
                    <div>
                      <p className="font-medium text-muted-foreground">Compare at Price</p>
                      <p className="text-foreground">INR {Number(selectedProduct.compare_at_price).toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-muted-foreground">Inventory</p>
                    <p className="text-foreground">{selectedProduct.inventory_quantity} units</p>
                  </div>
                  {selectedProduct.sku && (
                    <div>
                      <p className="font-medium text-muted-foreground">SKU</p>
                      <p className="text-foreground">{selectedProduct.sku}</p>
                    </div>
                  )}
                  {selectedProduct.category && (
                    <div>
                      <p className="font-medium text-muted-foreground">Category</p>
                      <p className="text-foreground">{selectedProduct.category}</p>
                    </div>
                  )}
                  {selectedProduct.weight && (
                    <div>
                      <p className="font-medium text-muted-foreground">Weight</p>
                      <p className="text-foreground">{selectedProduct.weight} {selectedProduct.weight_unit}</p>
                    </div>
                  )}
                </div>
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedProduct.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div>
                    <p className="font-medium text-muted-foreground">Images</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedProduct.images.map((url, i) => (
                        <a
                          key={`img-${i}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Image {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectProduct} onOpenChange={() => setRejectProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reject Product</DialogTitle>
            <DialogDescription>
              Provide feedback to the vendor explaining why their product was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="reject-notes">Admin Notes / Feedback</Label>
            <Textarea
              id="reject-notes"
              placeholder="e.g., Images are low quality. Please provide better product photos..."
              rows={4}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setRejectProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading === rejectProduct?.id}
            >
              {loading === rejectProduct?.id ? "Rejecting..." : "Reject Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
