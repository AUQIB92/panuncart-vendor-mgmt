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

  useEffect(() => {
    async function checkVendorStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      const { data: vendorRows } = await supabase.rpc("get_my_vendor")
      const vendor = vendorRows?.[0] || null
      if (vendor?.status !== "approved") {
        toast.error("Your vendor account must be approved before you can add products.")
        router.push("/vendor")
      }
    }
    checkVendorStatus()
  }, [supabase, router])

  async function handleSubmit(formData: Record<string, unknown>, submitForReview: boolean) {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error("You must be logged in")
      setLoading(false)
      return
    }

    // Double-check vendor approval status before submitting
    const { data: vendorRows } = await supabase.rpc("get_my_vendor")
    if (vendorRows?.[0]?.status !== "approved") {
      toast.error("Your vendor account must be approved before you can add products.")
      setLoading(false)
      router.push("/vendor")
      return
    }

    const { error } = await supabase.from("products").insert({
      vendor_id: user.id,
      title: formData.title as string,
      description: formData.description as string,
      price: Number(formData.price),
      compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
      sku: formData.sku as string,
      barcode: formData.barcode as string,
      inventory_quantity: Number(formData.inventory_quantity) || 0,
      category: formData.category as string,
      tags: formData.tags ? (formData.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      weight: formData.weight ? Number(formData.weight) : null,
      weight_unit: (formData.weight_unit as string) || "kg",
      images: formData.images ? (formData.images as string).split(",").map((u: string) => u.trim()).filter(Boolean) : [],
      status: submitForReview ? "pending" : "draft",
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(submitForReview ? "Product submitted for review!" : "Product saved as draft!")
    router.push("/vendor/products")
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/vendor/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">Add New Product</h1>
        <p className="mt-1 text-muted-foreground">Fill in the details and submit for admin approval</p>
      </div>

      <ProductForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
