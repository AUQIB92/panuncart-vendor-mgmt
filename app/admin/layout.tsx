import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider } from "@/contexts/sidebar-context"

export default async function AdminLayout({
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
  if (role !== "admin") {
    redirect("/vendor")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AdminSidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
