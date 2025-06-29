"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PhoneSetup } from "@/components/phone-setup"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { SessionHistory } from "@/components/session-history"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SpaceBackground } from "@/components/space-background"
import { EnhancedCard } from "@/components/enhanced-card"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"

interface UserStats {
  totalCalls: number
  totalMinutes: number
  averageScore: number
  currentStreak: number
  bestStreak: number
  improvementRate: number
}

interface CallData {
  id: string
  createdAt: Date
  status?: string
  duration?: number
  scenario?: any
  [key: string]: any
}

export function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("practice")
  const [userStats, setUserStats] = useState<UserStats>({
    totalCalls: 0,
    totalMinutes: 0,
    averageScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    improvementRate: 0,
  })
  const [recentCalls, setRecentCalls] = useState<CallData[]>([])

  useEffect(() => {
    if (user) {
      loadUserStats()
      loadRecentCalls()
    }
  }, [user])

  const loadUserStats = async () => {
    if (!user) return

    try {
      // Load calls data to calculate stats
      const callsRef = collection(db, "calls")
      const q = query(callsRef, where("userId", "==", user.uid), where("status", "==", "completed"))
      const querySnapshot = await getDocs(q)

      const calls = querySnapshot.docs.map((doc) => doc.data())

      const totalCalls = calls.length
      const totalMinutes = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
      const scores = calls
        .filter((call) => call.callAnalysis?.analysis?.overallScore)
        .map((call) => call.callAnalysis.analysis.overallScore)
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

      setUserStats({
        totalCalls,
        totalMinutes,
        averageScore,
        currentStreak: 3, // Mock data
        bestStreak: 7, // Mock data
        improvementRate: 12, // Mock data
      })
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  const loadRecentCalls = async () => {
    if (!user) return

    try {
      const callsRef = collection(db, "calls")
      const q = query(callsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5))
      const querySnapshot = await getDocs(q)
      const calls = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        const safeDate = (timestamp: any) => {
          if (!timestamp) return new Date()
          if (timestamp.toDate) return timestamp.toDate()
          if (timestamp.getTime) return timestamp
          if (timestamp.seconds) return new Date(timestamp.seconds * 1000)
          return new Date(timestamp)
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt: safeDate(data.createdAt),
        } as CallData
      })
      setRecentCalls(calls)
    } catch (error) {
      console.error("Error loading recent calls:", error)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "quick-practice":
        setActiveTab("practice")
        break
      case "daily-goal":
        setActiveTab("analytics")
        break
      case "languages":
        setActiveTab("settings")
        break
      case "scenarios":
        setActiveTab("practice")
        break
    }
  }

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "practice":
        return "Phone Practice"
      case "analytics":
        return "Analytics"
      case "history":
        return "Call History"
      case "settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  return (
    <div className="min-h-screen relative">
      <SpaceBackground intensity={0.3} />

      <div className="relative z-10">
        <SidebarProvider>
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} onQuickAction={handleQuickAction} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4 bg-black/20 backdrop-blur-md">
              <SidebarTrigger className="-ml-1 text-white" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-white/20" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-white">{getBreadcrumbTitle()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center space-x-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  Pro
                </Badge>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min p-6">
                {activeTab === "practice" && <PhoneSetup />}
                {activeTab === "analytics" && <AnalyticsDashboard />}
                {activeTab === "history" && <SessionHistory />}
                {activeTab === "settings" && (
                  <EnhancedCard variant="glass" title="Settings" description="Manage your account and preferences">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-white">Account Information</h4>
                        <p className="text-sm text-white/70">Email: {user?.email}</p>
                        <p className="text-sm text-white/70">Name: {user?.displayName}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-white">Preferences</h4>
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          Edit Preferences
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-white">Data & Privacy</h4>
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          Download Data
                        </Button>
                      </div>
                    </div>
                  </EnhancedCard>
                )}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
