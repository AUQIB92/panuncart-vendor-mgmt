"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/vendor/product-form"

export default function NewProductPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  /* ---------------- CHECK VENDOR STATUS ---------------- */
  useEffect(() => {
    async function checkVendorStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: vendorRows } = await supabase.rpc("get_my_vendor")
      const vendor = vendorRows?.[0] || null

      if (vendor?.status !== "approved") {
        toast.error(
          "Your vendor account must be approved before you can add products."
        )
        router.push("/vendor")
      }
    }

    checkVendorStatus()
  }, [supabase, router])

  /* ---------------- SUBMIT HANDLER ---------------- */
  async function handleSubmit(
    formData: Record<string, unknown>,
    submitForReview: boolean
  ) {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be logged in")
      setLoading(false)
      return
    }

    /* ---------------- PRICE VALIDATION ---------------- */
    const price = Number(formData.price)
    const compareAtPrice = formData.compare_at_price
      ? Number(formData.compare_at_price)
      : null

    if (price > 99_999_999.99) {
      toast.error("Price cannot exceed ₹99,999,999.99")
      setLoading(false)
      return
    }

    if (compareAtPrice && compareAtPrice > 99_999_999.99) {
      toast.error("Compare at price cannot exceed ₹99,999,999.99")
      setLoading(false)
      return
    }

    /* ---------------- DOUBLE CHECK VENDOR ---------------- */
    const { data: vendorRows } = await supabase.rpc("get_my_vendor")
    if (vendorRows?.[0]?.status !== "approved") {
      toast.error(
        "Your vendor account must be approved before you can add products."
      )
      setLoading(false)
      router.push("/vendor")
      return
    }

    /* ---------------- CRITICAL FIX ---------------- */
    const images = Array.isArray(formData.images)
      ? (formData.images as string[]).filter(Boolean)
      : []

    console.log("🧪 IMAGES SAVED TO DB:", images)

    /* ---------------- INSERT PRODUCT ---------------- */
    const { error } = await supabase.from("products").insert({
      vendor_id: user.id,
      title: formData.title as string,
      description: (formData.description as string) || null,
      price,
      compare_at_price: compareAtPrice,
      sku: (formData.sku as string) || null,
      barcode: (formData.barcode as string) || null,
      inventory_quantity: Number(formData.inventory_quantity) || 0,
      category: (formData.category as string) || null,
      tags: formData.tags
        ? (formData.tags as string)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      weight: formData.weight ? Number(formData.weight) : null,
      weight_unit: (formData.weight_unit as string) || "kg",

      // ✅ THIS WAS THE BUG — NOW FIXED
      images,

      status: submitForReview ? "pending" : "draft",
    })

    if (error) {
      console.error("❌ Product submission error:", error)

      if (
        error.message.includes("numeric field overflow") ||
        error.message.includes("out of range") ||
        error.message.includes("too big")
      ) {
        toast.error(
          "Price values are too large. Maximum allowed is ₹99,999,999.99"
        )
      } else {
        toast.error(error.message)
      }

      setLoading(false)
      return
    }

    toast.success(
      submitForReview
        ? "Product submitted for review!"
        : "Product saved as draft!"
    )

    router.push("/vendor/products")
  }

  /* ---------------- UI ---------------- */
  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/vendor/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <h1 className="font-display text-2xl font-bold">
          Add New Product
        </h1>
        <p className="mt-1 text-muted-foreground">
          Fill in the details and submit for admin approval
        </p>
      </div>

      <ProductForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
