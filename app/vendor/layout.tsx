import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"
import { SidebarProvider } from "@/contexts/sidebar-context"

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
    <SidebarProvider>
      <div className="flex min-h-screen">
        <VendorSidebar user={user} vendorStatus={vendorStatus} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
