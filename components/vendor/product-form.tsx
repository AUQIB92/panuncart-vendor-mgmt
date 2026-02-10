"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export function ProductForm({
  onSubmit,
  loading,
  initialData,
}: ProductFormProps) {
  /* ---------------- BASIC FORM STATE (NO IMAGES HERE) ---------------- */
  const [form, setForm] = useState({
    title: (initialData?.title as string) || "",
    description: (initialData?.description as string) || "",
    price: (initialData?.price as string) || "",
    compare_at_price: (initialData?.compare_at_price as string) || "",
    sku: (initialData?.sku as string) || "",
    barcode: (initialData?.barcode as string) || "",
    inventory_quantity:
      (initialData?.inventory_quantity as string) || "0",
    category: (initialData?.category as string) || "",
    tags: (initialData?.tags as string) || "",
    weight: (initialData?.weight as string) || "",
    weight_unit: (initialData?.weight_unit as string) || "kg",
  })

  /* ---------------- IMAGE STATE (SINGLE SOURCE OF TRUTH) ---------------- */
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    const images = initialData?.images
    if (Array.isArray(images)) return images as string[]
    if (typeof images === "string" && images.length > 0)
      return images
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean)
    return []
  })

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleImagesChange(urls: string[]) {
    setImageUrls(urls)
  }

  function handleSubmit(submitForReview: boolean) {
    const payload = {
      ...form,
      images: imageUrls, // ✅ CORRECT FIELD FOR BACKEND + SHOPIFY
    }

    onSubmit(payload, submitForReview)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- BASIC INFO ---------------- */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Information
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  updateForm("title", e.target.value)
                }
                placeholder="e.g., Handwoven Pashmina Shawl"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  updateForm("description", e.target.value)
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  updateForm("category", v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  updateForm("tags", e.target.value)
                }
                placeholder="comma separated"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- PRICING ---------------- */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing & Inventory
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputBlock
              label="Price (INR) *"
              value={form.price}
              onChange={(v) => updateForm("price", v)}
            />
            <InputBlock
              label="Compare at Price"
              value={form.compare_at_price}
              onChange={(v) =>
                updateForm("compare_at_price", v)
              }
            />
            <InputBlock
              label="SKU"
              value={form.sku}
              onChange={(v) => updateForm("sku", v)}
            />
            <InputBlock
              label="Barcode"
              value={form.barcode}
              onChange={(v) =>
                updateForm("barcode", v)
              }
            />
            <InputBlock
              label="Inventory Quantity"
              value={form.inventory_quantity}
              onChange={(v) =>
                updateForm("inventory_quantity", v)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------------- SHIPPING ---------------- */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Shipping
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputBlock
              label="Weight"
              value={form.weight}
              onChange={(v) =>
                updateForm("weight", v)
              }
            />
            <Select
              value={form.weight_unit}
              onValueChange={(v) =>
                updateForm("weight_unit", v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">Grams</SelectItem>
                <SelectItem value="kg">Kilograms</SelectItem>
                <SelectItem value="lb">Pounds</SelectItem>
                <SelectItem value="oz">Ounces</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- IMAGES ---------------- */}
      <Card>
        <CardContent className="p-6">
          <BulkImageUploader
            existingImages={imageUrls}
            onImagesChange={handleImagesChange}
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* ---------------- ACTIONS ---------------- */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading || !form.title || !form.price}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Draft
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

/* ---------------- SMALL HELPER ---------------- */
function InputBlock({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
