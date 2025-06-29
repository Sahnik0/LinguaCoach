"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onQuickAction?: (action: string) => void
}

export function MobileNav({ activeTab, onTabChange, onQuickAction }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setOpen(false)
  }

  const handleQuickAction = (action: string) => {
    onQuickAction?.(action)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <AppSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onQuickAction={handleQuickAction}
          className="border-0"
        />
      </SheetContent>
    </Sheet>
  )
}
