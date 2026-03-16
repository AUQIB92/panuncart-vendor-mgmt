import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardShell } from "@/components/layout/dashboard-shell"
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
      <DashboardShell
        sidebar={<AdminSidebar user={user} />}
        contentClassName="max-w-7xl"
      >
        {children}
      </DashboardShell>
    </SidebarProvider>
  )
}
