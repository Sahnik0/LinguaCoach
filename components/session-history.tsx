"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { MessageCircle, Phone, Download, Search, Calendar, Clock, BarChart3 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"

export function SessionHistory() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLanguage, setFilterLanguage] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    if (!user) return

    try {
      const sessionsRef = collection(db, "sessions")
      const q = query(sessionsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50))

      const querySnapshot = await getDocs(q)
      const sessionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))

      setSessions(sessionsData)
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      !searchTerm ||
      session.scenario?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.language?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLanguage = filterLanguage === "all" || session.language === filterLanguage
    const matchesType =
      filterType === "all" ||
      (filterType === "chat" && session.type !== "phone") ||
      (filterType === "phone" && session.type === "phone")

    return matchesSearch && matchesLanguage && matchesType
  })

  const getSessionIcon = (session: any) => {
    return session.type === "phone" ? Phone : MessageCircle
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const downloadSessionReport = (session: any) => {
    // Generate and download session report
    const report = {
      sessionId: session.id,
      date: session.createdAt?.toISOString(),
      scenario: session.scenario,
      language: session.language,
      duration: session.duration,
      analysis: session.finalAnalysis,
      messages: session.messages,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `session-report-${session.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Session History</h2>
        <p className="text-muted-foreground">Review your past practice sessions and track your progress</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session: any) => {
            const SessionIcon = getSessionIcon(session)
            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <SessionIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold truncate">{session.scenario?.title || "Practice Session"}</h3>
                          <Badge variant="secondary">{session.language}</Badge>
                          <Badge variant="outline">{session.difficulty}</Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {session.createdAt?.toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {session.duration || 0}m
                          </div>
                        </div>

                        {session.finalAnalysis && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={session.finalAnalysis.confidence || 0} className="flex-1" />
                                <span
                                  className={`text-sm font-medium ${getConfidenceColor(session.finalAnalysis.confidence || 0)}`}
                                >
                                  {session.finalAnalysis.confidence || 0}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Fluency</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={session.finalAnalysis.fluency || 0} className="flex-1" />
                                <span className="text-sm font-medium">{session.finalAnalysis.fluency || 0}%</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Grammar</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={session.finalAnalysis.grammar || 0} className="flex-1" />
                                <span className="text-sm font-medium">{session.finalAnalysis.grammar || 0}%</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Vocabulary</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={session.finalAnalysis.vocabulary || 0} className="flex-1" />
                                <span className="text-sm font-medium">{session.finalAnalysis.vocabulary || 0}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadSessionReport(session)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterLanguage !== "all" || filterType !== "all"
                  ? "Try adjusting your search filters"
                  : "Start your first practice session to see it here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>
                {selectedSession.scenario?.title} • {selectedSession.createdAt?.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSession.finalAnalysis && (
                <div>
                  <h4 className="font-medium mb-3">Performance Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                      <Progress value={selectedSession.finalAnalysis.confidence || 0} />
                      <p className="text-xs text-right mt-1">{selectedSession.finalAnalysis.confidence || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Fluency</p>
                      <Progress value={selectedSession.finalAnalysis.fluency || 0} />
                      <p className="text-xs text-right mt-1">{selectedSession.finalAnalysis.fluency || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Grammar</p>
                      <Progress value={selectedSession.finalAnalysis.grammar || 0} />
                      <p className="text-xs text-right mt-1">{selectedSession.finalAnalysis.grammar || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Vocabulary</p>
                      <Progress value={selectedSession.finalAnalysis.vocabulary || 0} />
                      <p className="text-xs text-right mt-1">{selectedSession.finalAnalysis.vocabulary || 0}%</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSession.finalAnalysis?.suggestions && (
                <div>
                  <h4 className="font-medium mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {selectedSession.finalAnalysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
                <Button onClick={() => downloadSessionReport(selectedSession)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
