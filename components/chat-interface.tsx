"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Mic, MicOff, MessageCircle, BarChart3 } from "lucide-react"
import { omnidimensionAPI } from "@/lib/omnidimension"
import { groqAnalyticsAPI, type ConversationAnalytics } from "@/lib/groq"
import { SpaceBackground } from "@/components/space-background"
import { EnhancedCard } from "@/components/enhanced-card"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  analysis?: any
}

interface ChatInterfaceProps {
  scenario: any
  onSessionComplete: () => void
  onBack: () => void
}

export function ChatInterface({ scenario, onSessionComplete, onBack }: ChatInterfaceProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [sessionStartTime] = useState(new Date())
  const [isRecording, setIsRecording] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<ConversationAnalytics | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeSession()
    scrollToBottom()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initializeSession = async () => {
    if (!user) return

    try {
      const sessionDoc = await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        scenario: scenario,
        language: scenario.language,
        difficulty: scenario.difficulty,
        createdAt: new Date(),
        status: "active",
        messages: [],
        transcript: "",
      })

      setSessionId(sessionDoc.id)

      // Add initial AI message
      const initialMessage: Message = {
        id: "1",
        role: "assistant",
        content: getInitialMessage(),
        timestamp: new Date(),
      }

      setMessages([initialMessage])
    } catch (error) {
      console.error("Error initializing session:", error)
      toast({
        title: "Session Error",
        description: "Failed to initialize practice session",
        variant: "destructive",
      })
    }
  }

  const getInitialMessage = () => {
    const greetings = {
      English: "Hello! I'm ready to help you practice. Let's begin with this scenario.",
      Spanish: "¡Hola! Estoy listo para ayudarte a practicar. Comencemos con este escenario.",
      French: "Bonjour! Je suis prêt à vous aider à pratiquer. Commençons par ce scénario.",
      German: "Hallo! Ich bin bereit, Ihnen beim Üben zu helfen. Beginnen wir mit diesem Szenario.",
      Mandarin: "你好！我准备好帮助你练习了。让我们从这个场景开始。",
    }

    const greeting = greetings[scenario.language as keyof typeof greetings] || greetings["English"]
    return `${greeting}\n\n${scenario.context}`
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await omnidimensionAPI.sendMessage({
        message: input.trim(),
        language: scenario.language,
        scenario: scenario.context,
        userId: user.uid,
        sessionId: sessionId,
        context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        analysis: response.analysis,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update session in Firestore with new messages
      if (sessionId) {
        const sessionRef = doc(db, "sessions", sessionId)
        const updatedMessages = [...messages, userMessage, assistantMessage]
        const transcript = updatedMessages.map((m) => `${m.role}: ${m.content}`).join("\n")

        await updateDoc(sessionRef, {
          messages: updatedMessages,
          transcript: transcript,
          lastActivity: new Date(),
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!sessionId || !user) return

    setIsAnalyzing(true)

    try {
      const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)
      const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n")

      // Generate analytics using Groq API
      const analytics = await groqAnalyticsAPI.analyzeConversation(
        transcript,
        scenario.context,
        scenario.language,
        scenario.difficulty,
      )

      // Generate session summary
      const sessionSummary = await groqAnalyticsAPI.generateSessionSummary(analytics, sessionDuration, scenario.title)

      // Update session in Firestore
      const sessionRef = doc(db, "sessions", sessionId)
      await updateDoc(sessionRef, {
        status: "completed",
        duration: sessionDuration,
        completedAt: new Date(),
        finalAnalysis: analytics,
        sessionSummary: sessionSummary,
        transcript: transcript,
      })

      // Store detailed analytics in separate collection
      await addDoc(collection(db, "analytics"), {
        userId: user.uid,
        sessionId: sessionId,
        analytics: analytics,
        createdAt: new Date(),
        scenario: scenario,
        language: scenario.language,
        difficulty: scenario.difficulty,
      })

      setCurrentAnalysis(analytics)

      toast({
        title: "Session Complete",
        description: sessionSummary,
      })

      // Show analytics for a moment before completing
      setShowAnalysis(true)
      setTimeout(() => {
        onSessionComplete()
      }, 3000)
    } catch (error) {
      console.error("Error ending session:", error)
      toast({
        title: "Session Error",
        description: "Failed to save session data",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen relative">
      <SpaceBackground intensity={0.2} />

      {/* Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-white">{scenario.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                  {scenario.language}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white">
                  {scenario.difficulty}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analysis
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={isAnalyzing}
              className="bg-red-500/80 hover:bg-red-500"
            >
              {isAnalyzing ? "Analyzing..." : "End Session"}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto p-4 flex gap-6">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <EnhancedCard variant="glass" className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <MessageCircle className="h-5 w-5 mr-2 text-orange-400" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg backdrop-blur-md ${
                          message.role === "user"
                            ? "bg-orange-500/80 text-white"
                            : "bg-white/10 text-white border border-white/20"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex space-x-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-md"
                  disabled={isLoading}
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRecording(!isRecording)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
        </div>

        {/* Analysis Panel */}
        <AnimatePresence>
          {showAnalysis && currentAnalysis && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
              className="w-80"
            >
              <EnhancedCard variant="glass">
                <CardHeader>
                  <CardTitle className="text-white">Real-time Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1 text-white">
                      <span>Fluency</span>
                      <span>{currentAnalysis.fluency}%</span>
                    </div>
                    <Progress value={currentAnalysis.fluency} className="bg-white/20" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1 text-white">
                      <span>Confidence</span>
                      <span>{currentAnalysis.confidence}%</span>
                    </div>
                    <Progress value={currentAnalysis.confidence} className="bg-white/20" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1 text-white">
                      <span>Grammar</span>
                      <span>{currentAnalysis.grammar}%</span>
                    </div>
                    <Progress value={currentAnalysis.grammar} className="bg-white/20" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1 text-white">
                      <span>Vocabulary</span>
                      <span>{currentAnalysis.vocabulary}%</span>
                    </div>
                    <Progress value={currentAnalysis.vocabulary} className="bg-white/20" />
                  </div>

                  {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-white">Suggestions</h4>
                      <ul className="text-sm space-y-1">
                        {currentAnalysis.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-white/70">
                            • {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </EnhancedCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
