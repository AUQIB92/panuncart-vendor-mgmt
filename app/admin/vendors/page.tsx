import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorList } from "@/components/admin/vendor-list"

export default async function AdminVendorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Revert to RPC function for reliable admin access
  const { data: vendors } = await supabase.rpc("admin_get_vendors")

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Manage Vendors</h1>
        <p className="mt-1 text-muted-foreground">
          Review, approve, or reject vendor registrations
        </p>
      </div>
      <VendorList vendors={vendors || []} />
    </div>
  )
}
