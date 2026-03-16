"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"

interface DashboardShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
}

export function DashboardShell({
  sidebar,
  children,
  contentClassName,
}: DashboardShellProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex min-h-screen bg-muted/30">
      {sidebar}
      <div
        aria-hidden="true"
        className={cn(
          "hidden shrink-0 transition-[width] duration-300 lg:block",
          isCollapsed ? "w-16" : "w-64"
        )}
      />
      <main className="app-shell-scroll h-screen min-w-0 flex-1 overflow-y-auto">
        <div className={cn("mx-auto px-4 py-6 sm:px-6 lg:px-8", contentClassName)}>
          {children}
        </div>
      </main>
    </div>
  )
}
