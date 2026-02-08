"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Clock, Building2, Mail, Phone, MapPin, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Vendor {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string | null
  gst_number: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  status: string
  created_at: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  suspended: { label: "Suspended", variant: "destructive" },
}

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const router = useRouter()

  async function updateVendorStatus(vendorId: string, status: string) {
    setLoading(vendorId)
    try {
      const res = await fetch("/api/admin/vendors/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        router.refresh()
      } else {
        toast.error(data.error || "Failed to update vendor")
      }
    } catch {
      toast.error("Network error. Please try again.")
    }
    setLoading(null)
  }

  const pendingVendors = vendors.filter((v) => v.status === "pending")
  const approvedVendors = vendors.filter((v) => v.status === "approved")
  const rejectedVendors = vendors.filter((v) => v.status === "rejected" || v.status === "suspended")

  function VendorCard({ vendor }: { vendor: Vendor }) {
    const status = statusConfig[vendor.status] || statusConfig.pending
    return (
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {vendor.business_name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{vendor.business_name}</h3>
                  <p className="text-sm text-muted-foreground">{vendor.contact_name}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {vendor.email}
                </span>
                {vendor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {vendor.phone}
                  </span>
                )}
                {vendor.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {vendor.city}, {vendor.state}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Registered: {new Date(vendor.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => setSelectedVendor(vendor)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View Details
            </Button>
            {vendor.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateVendorStatus(vendor.id, "approved")}
                  disabled={loading === vendor.id}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {loading === vendor.id ? "..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateVendorStatus(vendor.id, "rejected")}
                  disabled={loading === vendor.id}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
            {vendor.status === "approved" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateVendorStatus(vendor.id, "suspended")}
                disabled={loading === vendor.id}
              >
                Suspend
              </Button>
            )}
            {(vendor.status === "rejected" || vendor.status === "suspended") && (
              <Button
                size="sm"
                onClick={() => updateVendorStatus(vendor.id, "approved")}
                disabled={loading === vendor.id}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Re-approve
              </Button>
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
            Pending ({pendingVendors.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approvedVendors.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedVendors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingVendors.length === 0 ? (
            <EmptyState message="No pending vendor registrations" />
          ) : (
            <div className="flex flex-col gap-4">
              {pendingVendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approvedVendors.length === 0 ? (
            <EmptyState message="No approved vendors yet" />
          ) : (
            <div className="flex flex-col gap-4">
              {approvedVendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedVendors.length === 0 ? (
            <EmptyState message="No rejected vendors" />
          ) : (
            <div className="flex flex-col gap-4">
              {rejectedVendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-lg">
          {selectedVendor && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selectedVendor.business_name}</DialogTitle>
                <DialogDescription>Vendor registration details</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-2">
                <DetailRow icon={Building2} label="Contact Person" value={selectedVendor.contact_name} />
                <DetailRow icon={Mail} label="Email" value={selectedVendor.email} />
                {selectedVendor.phone && <DetailRow icon={Phone} label="Phone" value={selectedVendor.phone} />}
                {selectedVendor.gst_number && <DetailRow icon={Building2} label="GST Number" value={selectedVendor.gst_number} />}
                {selectedVendor.address && (
                  <DetailRow
                    icon={MapPin}
                    label="Address"
                    value={[selectedVendor.address, selectedVendor.city, selectedVendor.state, selectedVendor.pincode].filter(Boolean).join(", ")}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
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
