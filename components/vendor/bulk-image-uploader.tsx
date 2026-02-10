"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Upload, X, Image, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface UploadedImage {
  id: string
  url: string
  file?: File
  name: string
  size: number
  status: "uploading" | "success" | "error"
}

interface BulkImageUploaderProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  existingImages?: string[]
}

export function BulkImageUploader({
  onImagesChange,
  maxImages = 10,
  existingImages = [],
}: BulkImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(() =>
    existingImages.map((url, i) => ({
      id: `existing-${i}`,
      url,
      name: `Existing ${i + 1}`,
      size: 0,
      status: "success",
    }))
  )

  const prevUrlsRef = useRef<string>("")

  /* ---------------- UPLOAD ---------------- */
  const uploadImageToShopifyCDN = useCallback(async (file: File) => {
    const fd = new FormData()
    fd.append("image", file)

    const res = await fetch("/api/shopify/upload-image", {
      method: "POST",
      body: fd,
    })

    const data = await res.json()
    if (!data.success || !data.cdnUrl) {
      throw new Error(data.error || "Upload failed")
    }

    return data.cdnUrl as string
  }, [])

  /* ---------------- SAFE PARENT SYNC ---------------- */
  useEffect(() => {
    const urls = images
      .filter(
        (img) =>
          img.status === "success" &&
          img.url.startsWith("https://")
      )
      .map((img) => img.url)

    const serialized = JSON.stringify(urls)

    // ✅ Prevent infinite loops & render-time updates
    if (serialized !== prevUrlsRef.current) {
      prevUrlsRef.current = serialized
      onImagesChange(urls)
    }
  }, [images, onImagesChange])

  /* ---------------- FILE SELECT ---------------- */
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()

      setImages((prev) => [
        ...prev,
        {
          id,
          url: URL.createObjectURL(file),
          file,
          name: file.name,
          size: file.size,
          status: "uploading",
        },
      ])

      try {
        const cdnUrl = await uploadImageToShopifyCDN(file)

        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? { ...img, url: cdnUrl, status: "success" }
              : img
          )
        )
      } catch {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, status: "error" } : img
          )
        )
        toast.error(`Upload failed: ${file.name}`)
      }
    }
  }

  /* ---------------- REMOVE ---------------- */
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    toast.success("Image removed")
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4">
      <Label>Product Images</Label>

      <Card className="border-2 border-dashed">
        <CardContent className="p-8 text-center">
          <input
            id="image-upload"
            type="file"
            multiple
            hidden
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="mx-auto mb-2" />
            Click or drag images to upload
          </label>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img) => (
          <Card key={img.id} className="relative overflow-hidden">
            <img
              src={img.url}
              alt={img.name}
              className="aspect-square object-cover"
            />

            {img.status === "uploading" && (
              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs">
                Uploading…
              </div>
            )}

            {img.status === "error" && (
              <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                <AlertCircle className="text-white" />
              </div>
            )}

            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeImage(img.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
