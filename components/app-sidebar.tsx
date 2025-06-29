"use client"

import type * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Phone,
  BarChart3,
  History,
  Settings,
  User,
  LogOut,
  ChevronUp,
  Zap,
  Target,
  Globe,
  BookOpen,
} from "lucide-react"

const navigationItems = [
  {
    title: "Phone Practice",
    icon: Phone,
    value: "practice",
    description: "Start new phone conversation practice",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    value: "analytics",
    description: "View your progress and insights",
  },
  {
    title: "Call History",
    icon: History,
    value: "history",
    description: "Review past phone sessions",
  },
  {
    title: "Settings",
    icon: Settings,
    value: "settings",
    description: "Account and preferences",
  },
]

const quickActions = [
  {
    title: "Quick Call",
    icon: Zap,
    action: "quick-practice",
    description: "Start instant phone practice",
  },
  {
    title: "Daily Goal",
    icon: Target,
    action: "daily-goal",
    description: "Track daily progress",
  },
  {
    title: "Languages",
    icon: Globe,
    action: "languages",
    description: "Manage practice languages",
  },
  {
    title: "Scenarios",
    icon: BookOpen,
    action: "scenarios",
    description: "Browse practice scenarios",
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string
  onTabChange: (tab: string) => void
  onQuickAction?: (action: string) => void
}

export function AppSidebar({ activeTab, onTabChange, onQuickAction, ...props }: AppSidebarProps) {
  const { user, logout } = useAuth()

  return (
    <Sidebar collapsible="icon" className="bg-black/40 backdrop-blur-md border-white/10" {...props}>
      <SidebarHeader>
        <div
          className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => (window.location.href = "/")}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <Phone className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">LinguaCoach</span>
            <span className="truncate text-xs text-white/70">AI Phone Coach</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    tooltip={item.description}
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    className="group/menu-button text-white hover:bg-white/10 data-[active=true]:bg-orange-500/20 data-[active=true]:text-orange-400"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((action) => (
                <SidebarMenuItem key={action.action}>
                  <SidebarMenuButton
                    tooltip={action.description}
                    onClick={() => onQuickAction?.(action.action)}
                    className="group/menu-button hover:bg-white/10 text-white"
                  >
                    <action.icon className="size-4" />
                    <span>{action.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-white/10 data-[state=open]:text-white text-white"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-white">{user?.displayName || "User"}</span>
                    <span className="truncate text-xs text-white/70">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-black/80 border-white/20 backdrop-blur-md"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => onTabChange("settings")} className="text-white hover:bg-white/10">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-white hover:bg-white/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
