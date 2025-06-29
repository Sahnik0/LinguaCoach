"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Phone, PhoneOff, Volume2, VolumeX, BarChart3, AlertTriangle, Wifi, WifiOff, Mic, Volume } from "lucide-react"
import { omnidimensionAPI, type CallAnalysis } from "@/lib/omnidimension"
import { groqAnalyticsAPI } from "@/lib/groq"
import { mockCallService } from "@/lib/mock-call-service"
import { DemoVoice } from "@/components/demo-voice"
import { SpaceBackground } from "@/components/space-background"
import { EnhancedCard } from "@/components/enhanced-card"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore"
import { serializeForFirestore } from "@/lib/firestore-utils"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface CallInterfaceProps {
  scenario: any
  phoneNumber: string
  onCallComplete: () => void
  onBack: () => void
}

type CallStatus = "initiating" | "ringing" | "connected" | "ended" | "error"

export function CallInterface({ scenario, phoneNumber, onCallComplete, onBack }: CallInterfaceProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [callStatus, setCallStatus] = useState<CallStatus>("initiating")
  const [callId, setCallId] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [callAnalysis, setCallAnalysis] = useState<CallAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isUsingMockService, setIsUsingMockService] = useState(false)
  const [apiConnectionFailed, setApiConnectionFailed] = useState(false)
  const [isCallConnected, setIsCallConnected] = useState(false)
  const [demoTranscript, setDemoTranscript] = useState<string[]>([])
  const [showDemoInterface, setShowDemoInterface] = useState(false)
  const callStartTime = useRef<Date | null>(null)
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Helper function to check if we should stop polling based on current state
  // This helps avoid stale closure issues and type checking problems
  const shouldStopStatusChecks = () => {
    return callStatus === "ended" || isAnalyzing;
  }

  // Completely rewritten timer implementation to ensure it doesn't get stuck
  useEffect(() => {
    console.log("Call status changed to:", callStatus, "isCallConnected:", isCallConnected);
    
    // Only start timer when call is first connected and not already running
    if (callStatus === "connected" && !isCallConnected) {
      console.log("Call newly connected - initializing timer");
      
      // Set connection state first
      setIsCallConnected(true);
      
      // Clear any existing timer to prevent duplicates
      if (durationInterval.current) {
        console.log("Clearing existing timer interval");
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Set the call start time and initial duration
      callStartTime.current = new Date();
      setCallDuration(0);
      console.log("Call start time set to:", callStartTime.current);
      
      // Start a completely new timer with reliable interval
      console.log("Starting new timer interval");
      const newInterval = setInterval(() => {
        if (callStartTime.current) {
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - callStartTime.current.getTime()) / 1000);
          // Use a callback to ensure we're working with the latest state
          setCallDuration(prevDuration => {
            // Only update if the new duration is greater to prevent flickering
            if (elapsedSeconds > prevDuration) {
              console.log("Timer tick - elapsed seconds:", elapsedSeconds);
              return elapsedSeconds;
            }
            return prevDuration;
          });
        }
      }, 1000);
      
      // Store the new interval
      durationInterval.current = newInterval;
    }
    
    // Handle call ending - clean up interval and freeze duration
    if ((callStatus === "ended" || callStatus === "error") && isCallConnected) {
      console.log("Call ended/error - cleaning up timer");
      
      // Calculate final duration
      let finalDuration = callDuration;
      if (callStartTime.current) {
        finalDuration = Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000);
        console.log("Final call duration:", finalDuration);
      }
      
      // Clear interval first
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Reset connection state
      setIsCallConnected(false);
      
      // Set final duration and reset start time
      setCallDuration(finalDuration);
      callStartTime.current = null;
    }
    
    // Also stop timer if we're in analysis phase (fallback)
    if (isAnalyzing && durationInterval.current) {
      console.log("Analysis phase - ensuring timer is stopped");
      clearInterval(durationInterval.current);
      durationInterval.current = null;
      
      // Reset connection state to be safe
      setIsCallConnected(false);
    }
    
    // Cleanup on unmount or dependency changes
    return () => {
      if (durationInterval.current) {
        console.log("Effect cleanup - clearing interval");
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    };
  }, [callStatus, isAnalyzing])

  useEffect(() => {
    // Reset all state on component mount
    setCallDuration(0);
    setIsCallConnected(false);
    callStartTime.current = null;
    
    // Clear any existing intervals (defensive)
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
    
    // Start the call process
    initiateCall();
    
    // Clean up on unmount
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
      if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);
    }
  }, [])

  const initiateCall = async () => {
    if (!user) return

    try {
      setErrorMessage("")
      setApiConnectionFailed(false)

      // Create session in Firestore first
      const callData = {
        userId: user.uid,
        scenario: {
          id: scenario.id || "custom",
          title: scenario.title || "Practice Call",
          description: scenario.description || "",
          context: scenario.context || "",
          language: scenario.language || "English",
          difficulty: scenario.difficulty || "Intermediate",
        },
        phoneNumber: phoneNumber,
        createdAt: Timestamp.now(),
        status: "initiating",
        type: "phone",
      }

      const sessionDoc = await addDoc(collection(db, "calls"), serializeForFirestore(callData))
      setSessionId(sessionDoc.id)

      // Try real API first, fallback to mock service
      try {
        console.log("Attempting real phone call via Voice API...")
        
        // Ensure phone number is properly formatted with country code
        const cleanedPhoneNumber = phoneNumber.replace(/[\s\-()]/g, '')
        console.log(`Formatted phone number before API call: ${cleanedPhoneNumber}`)
        
        const callResponse = await omnidimensionAPI.initiateCall({
          phoneNumber: cleanedPhoneNumber, // Send the cleaned phone number
          language: scenario.language,
          scenario: scenario.context,
          difficulty: scenario.difficulty,
          userId: user.uid,
          sessionId: sessionDoc.id,
        })

        setCallId(callResponse.callId)
        setCallStatus("ringing")
        setIsUsingMockService(false)

        toast({
          title: "Real Call Initiated",
          description: `Calling ${phoneNumber}... Please answer your phone to begin the practice session.`,
        })

        startStatusChecking(callResponse.callId)
      } catch (apiError) {
        console.error("Real API failed, falling back to mock service:", apiError)
        setApiConnectionFailed(true)

        // Provide better error messaging based on the error type
        let fallbackReason = "Voice API service unavailable"
        if (apiError instanceof Error) {
          if (apiError.message.includes('unreachable') || apiError.message.includes('ERR_NAME_NOT_RESOLVED')) {
            fallbackReason = "Voice service not configured or unreachable"
          } else if (apiError.message.includes('timed out')) {
            fallbackReason = "Voice service not responding"
          } else if (apiError.message.includes('not available')) {
            fallbackReason = "Voice service configuration missing"
          }
        }

        console.log(`Fallback reason: ${fallbackReason}`)

        // Fallback to mock service
        const mockResponse = await mockCallService.initiateCall(scenario, scenario.language, scenario.difficulty)

        setCallId(mockResponse.callId)
        setCallStatus("ringing")
        setIsUsingMockService(true)

        toast({
          title: "Demo Mode Active",
          description: `${fallbackReason}. Using simulation mode for demonstration. This shows how the real system works.`,
          variant: "destructive",
        })

        startMockStatusChecking(mockResponse.callId)
      }
    } catch (error) {
      console.error("Error initiating call:", error)
      setCallStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to initiate call")

      toast({
        title: "Call Failed",
        description: "Failed to initiate call. Please check your setup and try again.",
        variant: "destructive",
      })
    }
  }

  const startStatusChecking = (callId: string) => {
    // Create a local variable to track if we've already handled the connection to prevent duplicate toasts
    let hasConnected = false;
    
    statusCheckInterval.current = setInterval(async () => {
      try {
        // Skip status checks if call has ended or we're analyzing
        if (callStatus === "ended" || isAnalyzing) {
          console.log("Call already ended or analyzing, skipping status check");
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
            statusCheckInterval.current = null;
          }
          return;
        }
        
        const status = await omnidimensionAPI.getCallStatus(callId)
        console.log("Real call status check:", status);

        // Only process connection state change once to prevent notification spamming
        if (status.status === "connected" && callStatus !== "connected" && !hasConnected) {
          console.log("Real call connecting - setting status to connected")
          
          // Mark as connected locally to prevent duplicate handling
          hasConnected = true;
          
          // Update session status first
          if (sessionId) {
            try {
              const sessionRef = doc(db, "calls", sessionId)
              await updateDoc(sessionRef, {
                status: "connected",
                connectedAt: Timestamp.now(),
                isRealCall: true,
              })
            } catch (updateError) {
              console.error("Error updating session status:", updateError)
            }
          }
          
          // Then update the call status - this triggers the timer
          setCallStatus("connected")

          // Show toast only once when connecting
          toast({
            title: "Call Connected",
            description: "Great! You're now connected. Start practicing your conversation skills.",
            duration: 4000, // Show for 4 seconds
          })
          
          // Stop frequent status checks once connected, switch to less frequent checks
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
            statusCheckInterval.current = setInterval(async () => {
              try {
                // Use our helper function to check if we should stop
                if (shouldStopStatusChecks()) {
                  if (statusCheckInterval.current) {
                    clearInterval(statusCheckInterval.current);
                    statusCheckInterval.current = null;
                  }
                  return;
                }
                
                const status = await omnidimensionAPI.getCallStatus(callId);
                if (status.status === "ended" || status.status === "completed") {
                  handleCallEnd();
                }
              } catch (error) {
                console.error("Status check error:", error);
              }
            }, 10000); // Check less frequently (every 10 seconds) after connection
          }
        } else if (status.status === "ended" || status.status === "completed") {
          handleCallEnd()
        } else if (status.status === "failed" || status.status === "error") {
          setCallStatus("error")
          setErrorMessage("Call failed or was rejected")
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current)
          }
        }
      } catch (error) {
        console.error("Status check error:", error)
        // Don't immediately fail on status check errors, API might be temporarily unavailable
      }
    }, 3000)
  }

  const startMockStatusChecking = (callId: string) => {
    // Create a local variable to track if we've already handled the connection to prevent duplicate toasts
    let hasConnected = false;
    
    statusCheckInterval.current = setInterval(async () => {
      try {
        // Skip status checks if call has ended or we're analyzing
        if (callStatus === "ended" || isAnalyzing) {
          console.log("Call already ended or analyzing, skipping mock status check");
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
            statusCheckInterval.current = null;
          }
          return;
        }
        
        const status = await mockCallService.getCallStatus(callId)
        console.log("Mock call status check:", status);

        // Only process connection state change once to prevent notification spamming
        if (status.status === "connected" && callStatus !== "connected" && !hasConnected) {
          console.log("Mock call connecting - setting status to connected")
          
          // Mark as connected locally to prevent duplicate handling
          hasConnected = true;
          
          // Update session status first
          if (sessionId) {
            try {
              const sessionRef = doc(db, "calls", sessionId)
              await updateDoc(sessionRef, {
                status: "connected",
                connectedAt: Timestamp.now(),
                isRealCall: false,
                isMockCall: true,
              })
            } catch (updateError) {
              console.error("Error updating session status:", updateError)
            }
          }
          
          // Then update the call status - this triggers the timer
          setCallStatus("connected")

          // Show toast only once when connecting
          toast({
            title: "Demo Call Connected",
            description: "Demo mode active. This simulates a real conversation experience.",
            duration: 4000, // Show for 4 seconds
          })
          
          // Stop frequent status checks once connected, switch to less frequent checks
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
            statusCheckInterval.current = setInterval(async () => {
              try {
                // Use our helper function to check if we should stop
                if (shouldStopStatusChecks()) {
                  if (statusCheckInterval.current) {
                    clearInterval(statusCheckInterval.current);
                    statusCheckInterval.current = null;
                  }
                  return;
                }
                
                const status = await mockCallService.getCallStatus(callId);
                if (status.status === "ended") {
                  handleCallEnd();
                }
              } catch (error) {
                console.error("Mock status check error:", error);
              }
            }, 5000); // Check less frequently (every 5 seconds) for mock calls
          }
        } else if (status.status === "ended") {
          handleCallEnd()
        }
      } catch (error) {
        console.error("Mock status check error:", error)
      }
    }, 2000)
  }

  const handleEndCall = async () => {
    if (callId) {
      try {
        if (isUsingMockService) {
          await mockCallService.endCall(callId)
        } else {
          await omnidimensionAPI.endCall(callId)
        }
        handleCallEnd()
      } catch (error) {
        console.error("Error ending call:", error)
        // Still proceed to end call locally
        handleCallEnd()
      }
    }
  }

  const handleCallEnd = async () => {
    // Prevent duplicate endings
    if (callStatus === "ended" || isAnalyzing) {
      console.log("Call already ended or analyzing, ignoring duplicate end request");
      return;
    }
    
    // Disable demo voice interface if active
    if (showDemoInterface) {
      setShowDemoInterface(false);
    }
    
    console.log("Ending call - current duration:", callDuration);
    
    // Calculate final duration explicitly to ensure accuracy
    let finalDuration = callDuration;
    if (callStartTime.current) {
      finalDuration = Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000);
      console.log("Calculated final duration:", finalDuration);
      
      // Ensure it's at least the current value to prevent going backwards
      finalDuration = Math.max(finalDuration, callDuration);
    }
    
    // Clear all intervals immediately to prevent further updates
    if (durationInterval.current) {
      console.log("Clearing duration interval");
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    
    if (statusCheckInterval.current) {
      console.log("Clearing status check interval");
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
    
    // Reset call connection state
    setIsCallConnected(false);
    
    // Important: Preserve the final timestamp before nulling it out
    callStartTime.current = null;
    
    // Freeze the duration at its final value before changing other state
    console.log("Setting final call duration to:", finalDuration);
    setCallDuration(finalDuration);
    
    // Set call status to ended after clearing intervals to prevent race conditions
    setCallStatus("ended");
    
    // Transition to analysis phase
    console.log("Starting call analysis...");
    setIsAnalyzing(true);

    try {
      let analysis: CallAnalysis

      if (isUsingMockService) {
        // Get mock analysis
        const mockAnalysis = await mockCallService.getCallAnalysis(callId)
        analysis = {
          callId: callId,
          transcript: mockAnalysis.transcript,
          analysis: mockAnalysis.analysis,
          suggestions: mockAnalysis.suggestions,
          strengths: mockAnalysis.strengths,
          weaknesses: mockAnalysis.weaknesses,
        }
      } else {
        // Get real analysis
        analysis = await omnidimensionAPI.getCallAnalysis(callId)
      }

      setCallAnalysis(analysis)

      // Generate enhanced analytics using Groq
      let groqAnalytics
      try {
        groqAnalytics = await groqAnalyticsAPI.analyzeConversation(
          analysis.transcript,
          scenario.context,
          scenario.language,
          scenario.difficulty,
        )

        toast({
          title: "Analysis Complete",
          description: "Your conversation has been analyzed. Check the detailed feedback!",
        })
      } catch (groqError) {
        console.error("Groq analytics error:", groqError)
        // Use basic analytics if Groq fails
        groqAnalytics = {
          fluency: analysis.analysis.fluency,
          confidence: analysis.analysis.confidence,
          grammar: analysis.analysis.grammar,
          vocabulary: analysis.analysis.vocabulary,
          pronunciation: analysis.analysis.pronunciation,
          overallScore: analysis.analysis.overallScore,
          detailedFeedback: isUsingMockService
            ? "Demo analysis completed successfully. In real mode, you'd get detailed AI feedback."
            : "Analysis completed successfully. Great job on your practice session!",
          suggestions: analysis.suggestions,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          hesitations: [],
          improvementAreas: [],
          nextSteps: [],
        }
      }

      // Update session in Firestore
      if (sessionId) {
        try {
          const updateData = {
            status: "completed",
            duration: callDuration,
            completedAt: Timestamp.now(),
            transcript: analysis.transcript || "",
            callAnalysis: {
              callId: analysis.callId,
              transcript: analysis.transcript || "",
              analysis: analysis.analysis,
              suggestions: analysis.suggestions || [],
              strengths: analysis.strengths || [],
              weaknesses: analysis.weaknesses || [],
            },
            groqAnalysis: groqAnalytics,
            isRealCall: !isUsingMockService,
            isMockCall: isUsingMockService,
          }

          const sessionRef = doc(db, "calls", sessionId)
          await updateDoc(sessionRef, serializeForFirestore(updateData))

          // Store detailed analytics
          const analyticsData = {
            userId: user?.uid || "unknown",
            sessionId: sessionId,
            callId: callId,
            createdAt: Timestamp.now(),
            scenario: {
              id: scenario.id || "custom",
              title: scenario.title || "Practice Call",
              language: scenario.language || "English",
              difficulty: scenario.difficulty || "Intermediate",
            },
            type: "phone",
            isRealCall: !isUsingMockService,
            isMockCall: isUsingMockService,
            analytics: {
              ...analysis.analysis,
              ...groqAnalytics,
            },
          }

          await addDoc(collection(db, "analytics"), serializeForFirestore(analyticsData))
        } catch (firestoreError) {
          console.error("Error saving to Firestore:", firestoreError)
          // Continue anyway - the call was successful
        }
      }

      setShowAnalysis(true)

      const callTypeText = isUsingMockService ? "demo" : "practice"
      toast({
        title: "Call Complete",
        description: `Excellent ${callTypeText} session! You spoke for ${Math.floor(callDuration / 60)} minutes and ${callDuration % 60} seconds.`,
      })
    } catch (error) {
      console.error("Error processing call end:", error)
      toast({
        title: "Analysis Error",
        description: "Call completed but analysis failed. The call data has been saved.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatDuration = (seconds: number) => {
    // Extra guard against invalid inputs - ensure we have a positive integer
    if (isNaN(seconds) || seconds === undefined || seconds === null) {
      console.warn("Invalid duration value:", seconds);
      seconds = 0;
    }
    
    // Force conversion to number and ensure positive
    seconds = Math.max(0, Math.floor(Number(seconds)));
    
    // Format as mm:ss
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  // Handle transcript updates from the DemoVoice component
  const handleDemoTranscriptUpdate = (text: string) => {
    setDemoTranscript(prev => [...prev, text]);
    
    // Also update the transcript in the mock call service for analysis later
    if (callId && isUsingMockService) {
      mockCallService.updateDemoTranscript(callId, text).catch(error => {
        console.error("Error updating demo transcript:", error);
      });
    }
    
    // Auto-scroll the transcript after a brief delay to ensure the DOM has updated
    setTimeout(() => {
      const anchor = document.getElementById('demo-transcript-end');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
  
  // Activate demo interface when in mock service mode and connected
  useEffect(() => {
    if (isUsingMockService && callStatus === "connected") {
      setShowDemoInterface(true);
    } else {
      setShowDemoInterface(false);
    }
  }, [isUsingMockService, callStatus]);



  const getStatusColor = () => {
    switch (callStatus) {
      case "initiating":
        return "bg-yellow-500"
      case "ringing":
        return "bg-blue-500"
      case "connected":
        return "bg-green-500"
      case "ended":
        return "bg-gray-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    const prefix = isUsingMockService ? "Demo: " : ""
    switch (callStatus) {
      case "initiating":
        return `${prefix}Initiating call...`
      case "ringing":
        return isUsingMockService ? `${prefix}Simulating call to ${phoneNumber}...` : `Calling ${phoneNumber}...`
      case "connected":
        return `${prefix}Connected - Practice in progress`
      case "ended":
        return `${prefix}Call ended`
      case "error":
        return "Call failed"
      default:
        return "Unknown status"
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
                <Badge variant="outline" className="border-blue-500/20 text-blue-300">
                  {phoneNumber}
                </Badge>
                {isUsingMockService && (
                  <Badge variant="outline" className="border-yellow-500/20 text-yellow-300">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Demo Mode
                  </Badge>
                )}
                {!isUsingMockService && !apiConnectionFailed && (
                  <Badge variant="outline" className="border-green-500/20 text-green-300">
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showAnalysis && (
              <Button
                variant="outline"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analysis
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto p-4">
        {/* API Connection Warning */}
        {apiConnectionFailed && (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/20">
            <WifiOff className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-white/80">
              <strong>Demo Mode:</strong> OmniDimension voice service unavailable (API key not configured or service unreachable). 
              This demonstration shows how the system works with simulated calls and AI analysis. 
              To enable real calls, get an API key from <a href="https://www.omnidim.io/" target="_blank" className="underline">OmniDimension</a> and add it to your environment variables.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {callStatus === "error" && errorMessage && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-white/80">
              <strong>Call Failed:</strong> {errorMessage}. Please check your phone number and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-6 justify-center">
          {/* Call Interface */}
          <div className="max-w-md w-full">
            <EnhancedCard variant="glass" className="text-center">
              <div className="p-8">
                {/* Call Status Indicator */}
                <motion.div
                  className="relative mx-auto mb-6"
                  animate={{
                    scale: callStatus === "ringing" ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: callStatus === "ringing" ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center relative overflow-hidden">
                    <Phone className="h-12 w-12 text-white" />

                    {/* Pulse animation for ringing */}
                    {callStatus === "ringing" && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-white/30"
                        animate={{
                          scale: [1, 1.5, 2],
                          opacity: [0.7, 0.3, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </div>

                  {/* Status indicator */}
                  <div
                    className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${getStatusColor()} border-4 border-white flex items-center justify-center`}
                  >
                    {callStatus === "connected" && <div className="w-3 h-3 bg-white rounded-full animate-pulse" />}
                  </div>
                </motion.div>

                {/* Status Text */}
                <h2 className="text-2xl font-bold text-white mb-2">{getStatusText()}</h2>

                {/* Duration - show for both connected and ended calls */}
                {(callStatus === "connected" || callStatus === "ended") && (
                  <p className="text-lg text-white/70 mb-6" data-testid="call-duration">
                    {formatDuration(callDuration || 0)}
                  </p>
                )}

                {/* Scenario Description */}
                <p className="text-white/70 mb-6 text-sm">{scenario.context}</p>

                {/* Demo Voice Interface - only show when using mock service and connected */}
                {showDemoInterface && (
                  <div className="mb-6 p-4 border border-white/10 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-white">
                          <Mic className="h-4 w-4 mr-2 text-green-400" /> Voice Input
                        </span>
                        <span className="flex items-center text-white">
                          <Volume className="h-4 w-4 mr-2 text-blue-400" /> Voice Output
                        </span>
                      </div>
                      
                      <a 
                        href="/DEMO_VOICE_USAGE.md" 
                        target="_blank"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Help & Troubleshooting
                      </a>
                    </div>
                    
                    <DemoVoice 
                      isActive={showDemoInterface} 
                      scenario={scenario}
                      language={scenario.language || 'English'}
                      onTranscriptUpdate={handleDemoTranscriptUpdate}
                    />
                    
                    <div className="mt-4 p-2 border border-white/10 bg-white/5 rounded text-xs text-white/80">
                      <p className="mb-1"><strong>Tips:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Allow microphone permissions when prompted</li>
                        <li>Speak naturally when the green "Listening" indicator is active</li>
                        <li>Wait for the assistant to finish speaking before responding</li>
                        <li>Speak clearly and at a moderate pace</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Instructions for different states */}
                {callStatus === "ringing" && !isUsingMockService && (
                  <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
                    <Phone className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-white/80">
                      Your phone should be ringing now. Please answer to begin your practice session.
                    </AlertDescription>
                  </Alert>
                )}

                {callStatus === "ringing" && isUsingMockService && (
                  <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/20">
                    <WifiOff className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-white/80">
                      Demo mode: Simulating call connection. This will automatically connect in a few seconds.
                    </AlertDescription>
                  </Alert>
                )}

                {callStatus === "connected" && (
                  <Alert className="mb-6 bg-green-500/10 border-green-500/20">
                    <Phone className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-white/80">
                      {isUsingMockService
                        ? "Demo mode active. This simulates a real conversation experience."
                        : "Great! You're connected. Practice your conversation skills with the AI coach."}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Demo conversation transcript */}
                {showDemoInterface && demoTranscript.length > 0 && (
                  <div className="mt-4 mb-6 max-h-60 overflow-y-auto border border-white/10 rounded-lg p-3 bg-black/20">
                    <h3 className="flex justify-between items-center text-white text-sm font-medium mb-2">
                      <span>Conversation Transcript</span>
                      <span className="text-xs text-white/50">{demoTranscript.length} messages</span>
                    </h3>
                    <div className="space-y-3 text-sm">
                      {demoTranscript.map((text, index) => {
                        const isUser = text.startsWith("User:");
                        const isSystem = text.startsWith("System:");
                        
                        let messageClass = "";
                        if (isUser) {
                          messageClass = "bg-green-900/20 border border-green-500/20 text-green-100";
                        } else if (isSystem) {
                          messageClass = "bg-yellow-900/20 border border-yellow-500/20 text-yellow-100";
                        } else {
                          messageClass = "bg-blue-900/20 border border-blue-500/20 text-blue-100";
                        }
                        
                        return (
                          <div 
                            key={index}
                            className={`p-2 rounded-md text-xs ${messageClass}`}
                          >
                            {text}
                          </div>
                        );
                      })}
                      
                      {/* Auto-scroll anchor */}
                      <div id="demo-transcript-end" />
                    </div>
                  </div>
                )}

                {/* Call Controls */}
                <div className="flex justify-center space-x-4">
                  {callStatus === "connected" && (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsMuted(!isMuted)}
                        className="border-white/20 text-white hover:bg-white/10 rounded-full w-14 h-14"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                      </Button>

                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleEndCall}
                        className="bg-red-500 hover:bg-red-600 rounded-full w-14 h-14"
                        title="End Call"
                      >
                        <PhoneOff className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {callStatus === "ended" && (
                    <Button
                      onClick={onCallComplete}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      View Results
                    </Button>
                  )}

                  {callStatus === "error" && (
                    <Button
                      onClick={initiateCall}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      Try Again
                    </Button>
                  )}
                </div>

                {/* Loading indicator for analysis */}
                {isAnalyzing && (
                  <div className="mt-6">
                    <div className="flex items-center justify-center space-x-2 text-white/70">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing your performance with AI...</span>
                    </div>
                  </div>
                )}
              </div>
            </EnhancedCard>
          </div>

          {/* Analysis Panel */}
          <AnimatePresence>
            {showAnalysis && callAnalysis && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.3 }}
                className="w-80"
              >
                <EnhancedCard variant="glass">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      AI Analysis Results {isUsingMockService && "(Demo)"}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1 text-white">
                          <span>Overall Score</span>
                          <span>{callAnalysis.analysis.overallScore}%</span>
                        </div>
                        <Progress value={callAnalysis.analysis.overallScore} className="bg-white/20" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1 text-white">
                          <span>Fluency</span>
                          <span>{callAnalysis.analysis.fluency}%</span>
                        </div>
                        <Progress value={callAnalysis.analysis.fluency} className="bg-white/20" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1 text-white">
                          <span>Confidence</span>
                          <span>{callAnalysis.analysis.confidence}%</span>
                        </div>
                        <Progress value={callAnalysis.analysis.confidence} className="bg-white/20" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1 text-white">
                          <span>Grammar</span>
                          <span>{callAnalysis.analysis.grammar}%</span>
                        </div>
                        <Progress value={callAnalysis.analysis.grammar} className="bg-white/20" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1 text-white">
                          <span>Pronunciation</span>
                          <span>{callAnalysis.analysis.pronunciation}%</span>
                        </div>
                        <Progress value={callAnalysis.analysis.pronunciation} className="bg-white/20" />
                      </div>

                      {callAnalysis.strengths.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-white">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {callAnalysis.strengths.map((strength, index) => (
                              <li key={index} className="text-green-400">
                                ✓ {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {callAnalysis.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-white">AI Suggestions</h4>
                          <ul className="text-sm space-y-1">
                            {callAnalysis.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-orange-400">
                                • {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Display detailed feedback if available */}
                      {callAnalysis.detailedFeedback && (
                        <div>
                          <h4 className="font-medium mb-2 text-white">Detailed Feedback</h4>
                          <p className="text-sm text-white/80 italic border-l-2 border-orange-500/50 pl-3 py-1">
                            {callAnalysis.detailedFeedback}
                          </p>
                        </div>
                      )}
                      
                      {/* Display improvement areas if available */}
                      {callAnalysis.improvementAreas && callAnalysis.improvementAreas.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-white">Focus Areas</h4>
                          <div className="flex flex-wrap gap-2">
                            {callAnalysis.improvementAreas.map((area, index) => (
                              <span key={index} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Display next steps if available */}
                      {callAnalysis.nextSteps && callAnalysis.nextSteps.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-white">Next Steps</h4>
                          <ul className="text-sm space-y-1">
                            {callAnalysis.nextSteps.map((step, index) => (
                              <li key={index} className="text-blue-400">
                                ▶ {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </EnhancedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
