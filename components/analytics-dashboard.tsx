"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Target, Clock, Phone } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { deserializeFromFirestore } from "@/lib/firestore-utils"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AnalyticsDashboard() {
  const { user } = useAuth()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState([])
  const [languageData, setLanguageData] = useState([])
  const [scenarioData, setScenarioData] = useState([])

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user])

  const loadAnalyticsData = async () => {
    if (!user) return

    try {
      const callsRef = collection(db, "calls")
      const q = query(
        callsRef,
        where("userId", "==", user.uid),
        where("status", "==", "completed"),
        orderBy("createdAt", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const callsData = querySnapshot.docs.map((doc) => {
        const data = deserializeFromFirestore(doc.data())
        return {
          id: doc.id,
          ...data,
        }
      })

      setCalls(callsData)
      processAnalyticsData(callsData)
    } catch (error) {
      console.error("Error loading analytics data:", error)
      // Set empty data on error
      setCalls([])
      setProgressData([])
      setLanguageData([])
      setScenarioData([])
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (callsData: any[]) => {
    // Process progress over time
    const progressByDate = callsData.reduce((acc, call) => {
      const date = call.createdAt?.toDateString()
      if (!acc[date]) {
        acc[date] = {
          date,
          fluency: [],
          confidence: [],
          grammar: [],
          vocabulary: [],
          pronunciation: [],
          overallScore: [],
        }
      }

      const analysis = call.callAnalysis?.analysis || call.groqAnalysis
      if (analysis) {
        acc[date].fluency.push(analysis.fluency || 0)
        acc[date].confidence.push(analysis.confidence || 0)
        acc[date].grammar.push(analysis.grammar || 0)
        acc[date].vocabulary.push(analysis.vocabulary || 0)
        acc[date].pronunciation.push(analysis.pronunciation || 0)
        acc[date].overallScore.push(analysis.overallScore || 0)
      }

      return acc
    }, {})

    const progressChart = Object.values(progressByDate)
      .map((day: any) => ({
        date: day.date,
        fluency: day.fluency.reduce((a: number, b: number) => a + b, 0) / day.fluency.length || 0,
        confidence: day.confidence.reduce((a: number, b: number) => a + b, 0) / day.confidence.length || 0,
        grammar: day.grammar.reduce((a: number, b: number) => a + b, 0) / day.grammar.length || 0,
        vocabulary: day.vocabulary.reduce((a: number, b: number) => a + b, 0) / day.vocabulary.length || 0,
        pronunciation: day.pronunciation.reduce((a: number, b: number) => a + b, 0) / day.pronunciation.length || 0,
        overallScore: day.overallScore.reduce((a: number, b: number) => a + b, 0) / day.overallScore.length || 0,
      }))
      .slice(0, 10)
      .reverse()

    setProgressData(progressChart)

    // Process language distribution
    const languageCount = callsData.reduce((acc, call) => {
      const language = call.scenario?.language || "English"
      acc[language] = (acc[language] || 0) + 1
      return acc
    }, {})

    const languageChart = Object.entries(languageCount).map(([language, count]) => ({
      language,
      count,
    }))

    setLanguageData(languageChart)

    // Process scenario distribution
    const scenarioCount = callsData.reduce((acc, call) => {
      const title = call.scenario?.title || "Unknown"
      acc[title] = (acc[title] || 0) + 1
      return acc
    }, {})

    const scenarioChart = Object.entries(scenarioCount).map(([scenario, count]) => ({
      scenario,
      count,
    }))

    setScenarioData(scenarioChart)
  }

  const calculateStats = () => {
    if (calls.length === 0)
      return {
        totalCalls: 0,
        totalMinutes: 0,
        averageConfidence: 0,
        averageFluency: 0,
        averageOverallScore: 0,
        improvementRate: 0,
      }

    const totalCalls = calls.length
    const totalMinutes = calls.reduce((sum, call) => sum + (call.duration || 0), 0)

    const analysisData = calls
      .filter((call) => call.callAnalysis?.analysis || call.groqAnalysis)
      .map((call) => call.callAnalysis?.analysis || call.groqAnalysis)

    const averageConfidence =
      analysisData.length > 0
        ? analysisData.reduce((sum, analysis) => sum + (analysis.confidence || 0), 0) / analysisData.length
        : 0

    const averageFluency =
      analysisData.length > 0
        ? analysisData.reduce((sum, analysis) => sum + (analysis.fluency || 0), 0) / analysisData.length
        : 0

    const averageOverallScore =
      analysisData.length > 0
        ? analysisData.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / analysisData.length
        : 0

    // Calculate improvement rate (comparing first 5 calls to last 5)
    const recentCalls = calls.slice(0, 5)
    const oldCalls = calls.slice(-5)

    const recentAvg =
      recentCalls.length > 0
        ? recentCalls.reduce((sum, call) => {
            const analysis = call.callAnalysis?.analysis || call.groqAnalysis
            return sum + (analysis?.overallScore || 0)
          }, 0) / recentCalls.length
        : 0

    const oldAvg =
      oldCalls.length > 0
        ? oldCalls.reduce((sum, call) => {
            const analysis = call.callAnalysis?.analysis || call.groqAnalysis
            return sum + (analysis?.overallScore || 0)
          }, 0) / oldCalls.length
        : 0

    const improvementRate = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0

    return {
      totalCalls,
      totalMinutes,
      averageConfidence: Math.round(averageConfidence),
      averageFluency: Math.round(averageFluency),
      averageOverallScore: Math.round(averageOverallScore),
      improvementRate: Math.round(improvementRate),
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200/20 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200/20 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCalls}</div>
            <p className="text-xs text-white/70">Phone practice sessions completed</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Practice Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalMinutes}m</div>
            <p className="text-xs text-white/70">Total practice time</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg Score</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.averageOverallScore}%</div>
            <Progress value={stats.averageOverallScore} className="mt-2 bg-white/20" />
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Improvement</CardTitle>
            {stats.improvementRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.improvementRate >= 0 ? "+" : ""}
              {stats.improvementRate}%
            </div>
            <p className="text-xs text-white/70">vs previous calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="progress" className="text-white data-[state=active]:bg-orange-500/20">
            Progress Over Time
          </TabsTrigger>
          <TabsTrigger value="languages" className="text-white data-[state=active]:bg-orange-500/20">
            Languages
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="text-white data-[state=active]:bg-orange-500/20">
            Scenarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Progress Over Time</CardTitle>
              <CardDescription className="text-white/70">Your improvement across different skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  <Line type="monotone" dataKey="fluency" stroke="#8884d8" name="Fluency" />
                  <Line type="monotone" dataKey="confidence" stroke="#82ca9d" name="Confidence" />
                  <Line type="monotone" dataKey="grammar" stroke="#ffc658" name="Grammar" />
                  <Line type="monotone" dataKey="vocabulary" stroke="#ff7300" name="Vocabulary" />
                  <Line type="monotone" dataKey="pronunciation" stroke="#ff6b6b" name="Pronunciation" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Language Practice Distribution</CardTitle>
              <CardDescription className="text-white/70">Languages you've practiced</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ language, percent }) => `${language} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Scenario Practice</CardTitle>
              <CardDescription className="text-white/70">Most practiced scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="scenario" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Strengths & Weaknesses</CardTitle>
            <CardDescription className="text-white/70">Based on your recent calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1 text-white">
                <span>Fluency</span>
                <span>{stats.averageFluency}%</span>
              </div>
              <Progress value={stats.averageFluency} className="bg-white/20" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 text-white">
                <span>Confidence</span>
                <span>{stats.averageConfidence}%</span>
              </div>
              <Progress value={stats.averageConfidence} className="bg-white/20" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 text-white">
                <span>Overall Score</span>
                <span>{stats.averageOverallScore}%</span>
              </div>
              <Progress value={stats.averageOverallScore} className="bg-white/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recommendations</CardTitle>
            <CardDescription className="text-white/70">Personalized suggestions for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                  Focus
                </Badge>
                <p className="text-sm text-white/80">Practice more phone conversations to improve fluency</p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  Tip
                </Badge>
                <p className="text-sm text-white/80">Try different scenarios to build confidence</p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Goal
                </Badge>
                <p className="text-sm text-white/80">Aim for 3 practice calls this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
