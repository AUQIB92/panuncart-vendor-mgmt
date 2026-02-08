import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Phone, Mail, FileText, Calendar } from "lucide-react"

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending Approval", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  suspended: { label: "Suspended", variant: "destructive" },
}

export default async function VendorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Use SECURITY DEFINER function to bypass RLS
  const { data: vendorRows } = await supabase.rpc("get_my_vendor")
  const vendor = vendorRows?.[0] || null

  if (!vendor) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Vendor profile not found.</p>
      </div>
    )
  }

  const statusInfo = statusStyles[vendor.status] || statusStyles.pending

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Vendor Profile</h1>
          <p className="mt-1 text-muted-foreground">Your business details and account status</p>
        </div>
        <Badge variant={statusInfo.variant} className="h-7 px-3 text-sm">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium text-foreground">{vendor.business_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium text-foreground">{vendor.contact_name}</p>
            </div>
            {vendor.gst_number && (
              <div>
                <p className="text-sm text-muted-foreground">GST Number</p>
                <p className="font-medium text-foreground">{vendor.gst_number}</p>
              </div>
            )}
            {vendor.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-foreground">{vendor.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{vendor.email}</p>
              </div>
            </div>
            {vendor.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{vendor.phone}</p>
                </div>
              </div>
            )}
            {(vendor.address || vendor.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-foreground">
                    {[vendor.address, vendor.city, vendor.state, vendor.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <Badge variant={statusInfo.variant} className="mt-1">
                  {statusInfo.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered On</p>
                <p className="font-medium text-foreground">
                  {new Date(vendor.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium text-foreground">
                  {new Date(vendor.updated_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
