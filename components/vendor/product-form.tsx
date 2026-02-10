"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Save } from "lucide-react"
import { BulkImageUploader } from "@/components/vendor/bulk-image-uploader"

const categories = [
  "Clothing",
  "Accessories",
  "Footwear",
  "Home & Living",
  "Beauty & Personal Care",
  "Food & Beverages",
  "Electronics",
  "Handicrafts",
  "Art & Collectibles",
  "Other",
]

interface ProductFormProps {
  onSubmit: (data: Record<string, unknown>, submitForReview: boolean) => void
  loading: boolean
  initialData?: Record<string, unknown>
}

export function ProductForm({ onSubmit, loading, initialData }: ProductFormProps) {
  const [form, setForm] = useState({
    title: (initialData?.title as string) || "",
    description: (initialData?.description as string) || "",
    price: (initialData?.price as string) || "",
    compare_at_price: (initialData?.compare_at_price as string) || "",
    sku: (initialData?.sku as string) || "",
    barcode: (initialData?.barcode as string) || "",
    inventory_quantity: (initialData?.inventory_quantity as string) || "0",
    category: (initialData?.category as string) || "",
    tags: (initialData?.tags as string) || "",
    images: Array.isArray(initialData?.images) ? (initialData?.images as string[]).join(',') : (initialData?.images as string) || "",
    weight: (initialData?.weight as string) || "",
    weight_unit: (initialData?.weight_unit as string) || "kg",
  })
  
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    const initialImages = initialData?.images
    if (Array.isArray(initialImages)) {
      return initialImages as string[]
    } else if (typeof initialImages === 'string' && initialImages) {
      return initialImages.split(',').map(url => url.trim()).filter(Boolean)
    }
    return []
  })

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleImagesChange(urls: string[]) {
    setImageUrls(urls)
  }

  function handleSubmit(submitForReview: boolean) {
    const formDataWithImages = {
      ...form,
      imageUrls
    }
    onSubmit(formDataWithImages, submitForReview)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Information
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Handwoven Pashmina Shawl"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in detail..."
                rows={4}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="e.g., pashmina, handmade, kashmiri (comma separated)"
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing & Inventory
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price (INR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="99999999.99"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Maximum price: ₹99,999,999.99</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="compare_at_price">Compare at Price (INR)</Label>
              <Input
                id="compare_at_price"
                type="number"
                step="0.01"
                min="0"
                max="99999999.99"
                placeholder="Original price for showing discount"
                value={form.compare_at_price}
                onChange={(e) => updateForm("compare_at_price", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Maximum price: ₹99,999,999.99</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="Stock Keeping Unit"
                value={form.sku}
                onChange={(e) => updateForm("sku", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                placeholder="ISBN, UPC, GTIN, etc."
                value={form.barcode}
                onChange={(e) => updateForm("barcode", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inventory_quantity">Inventory Quantity</Label>
              <Input
                id="inventory_quantity"
                type="number"
                min="0"
                placeholder="0"
                value={form.inventory_quantity}
                onChange={(e) => updateForm("inventory_quantity", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Shipping
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                placeholder="Product weight"
                value={form.weight}
                onChange={(e) => updateForm("weight", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight_unit">Weight Unit</Label>
              <Select value={form.weight_unit} onValueChange={(v) => updateForm("weight_unit", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <BulkImageUploader 
            onImagesChange={handleImagesChange}
            existingImages={imageUrls}
            maxImages={10}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="bg-transparent"
          onClick={() => handleSubmit(false)}
          disabled={loading || !form.title || !form.price}
        >
          <Save className="mr-2 h-4 w-4" />
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading || !form.title || !form.price}
        >
          <Send className="mr-2 h-4 w-4" />
          {loading ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </div>
  )
}
