import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const role = user.user_metadata?.role
  if (role === "admin") {
    redirect("/admin")
  }

  // Use SECURITY DEFINER function to bypass RLS
  const { data: vendorRows } = await supabase.rpc("get_my_vendor")
  const vendor = vendorRows?.[0] || null
  const vendorStatus = vendor?.status || "pending"

  return (
    <div className="flex min-h-screen">
      <VendorSidebar user={user} vendorStatus={vendorStatus} />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
