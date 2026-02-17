"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Store, LayoutDashboard, Package, Plus, LogOut, User as UserIcon, ShieldAlert, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"
import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSidebar } from "@/contexts/sidebar-context"

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
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar()
  const [currentNavIndex, setCurrentNavIndex] = useState(0)

  // Set initial index based on current path
  useEffect(() => {
    const currentIndex = navItems.findIndex(item => 
      pathname === item.href || (item.href !== "/vendor" && pathname.startsWith(item.href))
    )
    if (currentIndex !== -1) {
      setCurrentNavIndex(currentIndex)
    }
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const nextNav = () => {
    setCurrentNavIndex((prev) => (prev + 1) % navItems.length)
  }

  const prevNav = () => {
    setCurrentNavIndex((prev) => (prev - 1 + navItems.length) % navItems.length)
  }

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 lg:static lg:z-auto",
          isCollapsed 
            ? "w-16 lg:w-16" 
            : "w-64 lg:w-64",
          isMobile && isCollapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-5 lg:px-5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary transition-all duration-300 hover:bg-sidebar-primary/90 hover:scale-105">
            <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
            <img 
              src="/icon.jpeg" 
              alt="PanunCart Icon" 
              className="h-5 w-5 object-contain transition-transform duration-300 hover:scale-110 rounded-md"
            />
            <div className="absolute -inset-1 rounded-lg bg-sidebar-primary/20 blur-sm opacity-0 transition-opacity duration-300 hover:opacity-70"></div>
          </div>
          
          {/* Always show icon, conditionally show text */}
          <div className={cn(
            "flex flex-col overflow-hidden transition-all duration-300",
            isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            <span className="font-display text-sm font-bold text-sidebar-foreground truncate">PanunCart</span>
            <span className="text-xs text-sidebar-foreground/60 truncate">Vendor Portal</span>
          </div>
          
          {/* Collapse/Expand Button */}
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1 rounded-md hover:bg-sidebar-accent/20 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-sidebar-foreground" />
            ) : (
              <X className="h-5 w-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        {!isMobile ? (
          <nav className="flex-1 px-3 py-4">
            {!isApproved && !isCollapsed && (
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
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-not-allowed",
                          isCollapsed ? "justify-center" : "",
                          "text-sidebar-foreground/30"
                        )}
                        title="Available after admin approval"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          isCollapsed ? "justify-center" : ""
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : (
          /* Mobile Carousel Navigation */
          <nav className="flex-1 px-3 py-4">
            {!isApproved && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {vendorStatus === "pending"
                    ? "Pending approval"
                    : vendorStatus === "rejected"
                      ? "Account rejected"
                      : "Account suspended"}
                </p>
              </div>
            )}
            
            <div className="relative">
              <div className="overflow-hidden rounded-lg bg-sidebar-accent/10 p-2 mb-4">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentNavIndex * 100}%)` }}
                >
                  {navItems.map((item, i) => {
                    const isActive = pathname === item.href || (item.href !== "/vendor" && pathname.startsWith(item.href))
                    const isDisabled = item.requiresApproval && !isApproved
                    
                    if (isDisabled) {
                      return (
                        <div key={item.href} className="w-full flex-shrink-0 px-1">
                          <div
                            className="flex flex-col items-center justify-center gap-2 rounded-lg p-3 text-center bg-sidebar-foreground/5 cursor-not-allowed"
                            title="Available after admin approval"
                          >
                            <item.icon className="h-6 w-6 text-sidebar-foreground/30" />
                            <span className="text-xs font-medium text-sidebar-foreground/30 truncate">{item.label}</span>
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={item.href} className="w-full flex-shrink-0 px-1">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 rounded-lg p-3 text-center transition-all",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon className="h-6 w-6" />
                          <span className="text-xs font-medium truncate">{item.label}</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Mobile Navigation Indicators */}
              <div className="flex justify-center gap-1 mb-4">
                {navItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentNavIndex(i)}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      i === currentNavIndex 
                        ? 'bg-sidebar-accent w-4' 
                        : 'bg-sidebar-foreground/30 hover:bg-sidebar-foreground/50'
                    }`}
                    aria-label={`Go to ${navItems[i].label}`}
                  />
                ))}
              </div>
              
              {/* Mobile Navigation Arrows */}
              <div className="flex justify-between px-2">
                <button
                  onClick={prevNav}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent/20 hover:bg-sidebar-accent/40 transition-colors"
                  aria-label="Previous navigation item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                
                <button
                  onClick={nextNav}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent/20 hover:bg-sidebar-accent/40 transition-colors"
                  aria-label="Next navigation item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* User Profile Section */}
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
              {user.user_metadata?.contact_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "V"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.user_metadata?.business_name || "Vendor"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
