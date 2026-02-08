"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Store, LayoutDashboard, Package, Plus, LogOut, User as UserIcon, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

const navItems = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard, requiresApproval: false },
  { href: "/vendor/products", label: "My Products", icon: Package, requiresApproval: true },
  { href: "/vendor/products/new", label: "Add Product", icon: Plus, requiresApproval: true },
  { href: "/vendor/profile", label: "Profile", icon: UserIcon, requiresApproval: false },
]

export function VendorSidebar({ user, vendorStatus }: { user: User; vendorStatus: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isApproved = vendorStatus === "approved"

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Store className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold text-sidebar-foreground">PanunCart</span>
          <span className="text-xs text-sidebar-foreground/60">Vendor Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {!isApproved && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {vendorStatus === "pending"
                ? "Account pending approval. Product features will unlock once approved."
                : vendorStatus === "rejected"
                  ? "Account was rejected. Contact admin for more info."
                  : "Account suspended. Contact admin for assistance."}
            </p>
          </div>
        )}
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/vendor" && pathname.startsWith(item.href))
            const isDisabled = item.requiresApproval && !isApproved
            return (
              <li key={item.href}>
                {isDisabled ? (
                  <span
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/30"
                    title="Available after admin approval"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            {user.user_metadata?.contact_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "V"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.user_metadata?.business_name || "Vendor"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
