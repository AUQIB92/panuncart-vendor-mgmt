"use client"

import { useState, useCallback } from "react"
import { Upload, X, Image, FileImage, AlertCircle } from "lucide-react"
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
  error?: string
}

interface BulkImageUploaderProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  existingImages?: string[]
}

export function BulkImageUploader({ 
  onImagesChange, 
  maxImages = 10,
  existingImages = [] 
}: BulkImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(() => 
    existingImages.map((url, index) => ({
      id: `existing-${index}`,
      url,
      name: `Existing Image ${index + 1}`,
      size: 0,
      status: "success"
    }))
  )
  const [isDragging, setIsDragging] = useState(false)

  // Upload image to Shopify CDN immediately when selected
  const uploadImageToShopifyCDN = useCallback(async (file: File): Promise<string> => {
    // Show uploading state
    console.log(`📤 Uploading ${file.name} to Shopify CDN...`);
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/shopify/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }
    
    console.log(`✅ ${file.name} uploaded to Shopify CDN: ${data.cdnUrl}`);
    return data.cdnUrl;
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const totalImages = images.length + newFiles.length

    if (totalImages > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`)
      return
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Only JPG, PNG, WEBP, and GIF are allowed.`)
      return
    }

    // Validate file sizes (5MB max per image)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const largeFiles = newFiles.filter(file => file.size > maxSize)
    
    if (largeFiles.length > 0) {
      toast.error(`Files too large: ${largeFiles.map(f => f.name).join(', ')}. Maximum size is 5MB per image.`)
      return
    }

    // Add files to state and start uploading
    const newImages: UploadedImage[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      name: file.name,
      size: file.size,
      status: "uploading"
    }))

    setImages(prev => [...prev, ...newImages])

    // Upload each file to Shopify CDN
    for (const image of newImages) {
      try {
        const cdnUrl = await uploadImageToShopifyCDN(image.file!)
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, url: cdnUrl, status: "success" }
            : img
        ))
      } catch (error) {
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, status: "error", error: "Upload failed" }
            : img
        ))
        toast.error(`Failed to upload ${image.name}`)
      }
    }

    // Update parent component with image URLs
    const allUrls = [...images.filter(img => img.status === "success").map(img => img.url), ...newImages.map(img => img.url)]
    onImagesChange(allUrls)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id)
    if (imageToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    const updatedImages = images.filter(img => img.id !== id)
    setImages(updatedImages)
    
    const urls = updatedImages.filter(img => img.status === "success").map(img => img.url)
    onImagesChange(urls)
    
    toast.success("Image removed")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Images</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Upload up to {maxImages} images. Drag & drop or click to select files.
        </p>
      </div>

      {/* Upload Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <label 
            htmlFor="image-upload" 
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Drop images here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports JPG, PNG, WEBP, GIF (Max 5MB each)
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3">
            Selected Images ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden relative group">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  {image.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                        <span className="text-xs">Uploading...</span>
                      </div>
                    </div>
                  )}
                  
                  {image.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={image.name}>
                    {image.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.size)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Image className="h-4 w-4" />
          Image Guidelines
        </h4>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Use high-quality images (minimum 800x800 pixels recommended)</li>
          <li>Show the product from multiple angles if possible</li>
          <li>Use a clean, white or neutral background</li>
          <li>Include lifestyle shots showing the product in use</li>
          <li>The first image will be used as the main product image</li>
        </ul>
      </div>
    </div>
  )
}