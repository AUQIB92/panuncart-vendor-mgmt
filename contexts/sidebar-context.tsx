"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobile: boolean
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse on mobile devices
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
    } else {
      setIsCollapsed(false)
    }
  }, [isMobile])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}