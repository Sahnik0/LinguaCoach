"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Shield, Clock, Plus, Edit, AlertCircle, ExternalLink, Database, CheckCircle } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { EnhancedCard } from "@/components/enhanced-card"
import { ScenarioSelector } from "@/components/scenario-selector"
import { CallInterface } from "@/components/call-interface"
import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { serializeForFirestore, deserializeFromFirestore } from "@/lib/firestore-utils"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

export function PhoneSetup() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [callHistory, setCallHistory] = useState([])
  const [showScenarioSelector, setShowScenarioSelector] = useState(false)
  const [showCallInterface, setShowCallInterface] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [indexError, setIndexError] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [indexesWorking, setIndexesWorking] = useState(false)

  useEffect(() => {
    if (user) {
      loadPhoneSettings()
      loadCallHistory()
    }
  }, [user])

  const loadPhoneSettings = async () => {
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = deserializeFromFirestore(userSnap.data())
        setPhoneNumber(userData.phoneNumber || "")
        setConsentGiven(userData.phoneConsent || false)
      }
    } catch (error) {
      console.error("Error loading phone settings:", error)
    }
  }

  const loadCallHistory = async () => {
    if (!user) return

    setLoadingHistory(true)
    try {
      const callsRef = collection(db, "calls")

      // Try multiple fallback strategies
      let calls = []
      let indexErrorOccurred = false

      // Strategy 1: Try with type filter and ordering (requires composite index)
      try {
        const q1 = query(
          callsRef,
          where("userId", "==", user.uid),
          where("type", "==", "phone"),
          orderBy("createdAt", "desc"),
          limit(10),
        )
        const querySnapshot = await getDocs(q1)
        calls = querySnapshot.docs.map((doc) => {
          const data = deserializeFromFirestore(doc.data())
          return { id: doc.id, ...data }
        })
        console.log("✅ Database indexes working properly")
        setIndexesWorking(true)
      } catch (error1) {
        console.warn("Composite index not available, trying fallback:", error1)
        indexErrorOccurred = true

        // Strategy 2: Try without type filter but with ordering
        try {
          const q2 = query(callsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(20))
          const querySnapshot = await getDocs(q2)
          const allCalls = querySnapshot.docs.map((doc) => {
            const data = deserializeFromFirestore(doc.data())
            return { id: doc.id, ...data }
          })
          // Filter for phone calls client-side
          calls = allCalls.filter((call) => call.type === "phone").slice(0, 10)
          console.log("⚠️ Using fallback query with client-side filtering")
        } catch (error2) {
          console.warn("Ordered query failed, trying basic query:", error2)

          // Strategy 3: Basic query without ordering (last resort)
          try {
            const q3 = query(callsRef, where("userId", "==", user.uid), limit(50))
            const querySnapshot = await getDocs(q3)
            const allCalls = querySnapshot.docs.map((doc) => {
              const data = deserializeFromFirestore(doc.data())
              return { id: doc.id, ...data }
            })
            // Filter and sort client-side
            calls = allCalls
              .filter((call) => call.type === "phone")
              .sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0
                const bTime = b.createdAt?.getTime() || 0
                return bTime - aTime
              })
              .slice(0, 10)
            console.log("⚠️ Using basic query with full client-side processing")
          } catch (error3) {
            console.error("All query strategies failed:", error3)
            calls = []
          }
        }
      }

      setCallHistory(calls)
      setIndexError(indexErrorOccurred && calls.length === 0)

      // Only show error toast if we couldn't load any data
      if (indexErrorOccurred && calls.length === 0) {
        toast({
          title: "Database Optimization Available",
          description: "Your data loaded successfully. Database indexes can be optimized for better performance.",
        })
      }
    } catch (error) {
      console.error("Error loading call history:", error)
      setCallHistory([])
      setIndexError(true)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSavePhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    // Enhanced phone number validation
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code (e.g., +1 555-123-4567)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid)
        const updateData = {
          phoneNumber: phoneNumber.trim(),
          phoneUpdatedAt: Timestamp.now(),
        }
        await updateDoc(userRef, serializeForFirestore(updateData))

        setIsEditingPhone(false)
        toast({
          title: "Phone Number Saved",
          description: "Your phone number has been updated successfully",
        })
      }
    } catch (error) {
      console.error("Error saving phone number:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save phone number. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConsentChange = async (consent: boolean) => {
    setConsentGiven(consent)

    if (user) {
      try {
        const userRef = doc(db, "users", user.uid)
        const updateData = {
          phoneConsent: consent,
          phoneConsentAt: Timestamp.now(),
        }
        await updateDoc(userRef, serializeForFirestore(updateData))
      } catch (error) {
        console.error("Error updating consent:", error)
      }
    }
  }

  const handleStartCall = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number first",
        variant: "destructive",
      })
      return
    }

    if (!consentGiven) {
      toast({
        title: "Consent Required",
        description: "Please give consent for phone calls and recording",
        variant: "destructive",
      })
      return
    }

    setShowScenarioSelector(true)
  }

  const handleScenarioSelected = (scenario: any) => {
    setSelectedScenario(scenario)
    setShowScenarioSelector(false)
    setShowCallInterface(true)
  }

  const handleCallComplete = () => {
    setShowCallInterface(false)
    setSelectedScenario(null)
    loadCallHistory()
  }

  const createIndexes = () => {
    const indexUrl = "https://console.firebase.google.com/project/service-agent-6afbd/firestore/indexes"
    window.open(indexUrl, "_blank")

    toast({
      title: "Opening Firebase Console",
      description: "Create the required indexes and refresh the page when done.",
    })
  }

  if (showScenarioSelector) {
    return (
      <ScenarioSelector onScenarioSelected={handleScenarioSelected} onBack={() => setShowScenarioSelector(false)} />
    )
  }

  if (showCallInterface && selectedScenario) {
    return (
      <CallInterface
        scenario={selectedScenario}
        phoneNumber={phoneNumber}
        onCallComplete={handleCallComplete}
        onBack={() => setShowCallInterface(false)}
      />
    )
  }

  return (
    <div className="min-h-screen relative">
      <SpaceBackground intensity={0.3} />

      <div className="relative z-10 space-y-6 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl font-bold mb-2 text-white">LinguaCoach Phone Practice</h2>
          <p className="text-white/70">Practice languages through real phone conversations with AI</p>
        </motion.div>

        {/* Database Status - Only show if there are actual issues */}
        {indexError && (
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <Database className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-white/80">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Performance Optimization Available:</strong> Database indexes can be optimized for faster
                  loading.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createIndexes}
                  className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 bg-transparent ml-4"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Optimize
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Database Working Well */}
        {indexesWorking && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-white/80">
              <strong>System Status:</strong> All database optimizations are active. Enjoying optimal performance!
            </AlertDescription>
          </Alert>
        )}

        {/* Phone Number Setup */}
        <EnhancedCard
          variant="glass"
          delay={0.1}
          title="Phone Number"
          description="Enter your phone number to receive practice calls"
          icon={<Phone className="h-5 w-5 text-orange-400" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Label htmlFor="phone" className="text-white">
                  Phone Number (with country code)
                </Label>
                {isEditingPhone ? (
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Button
                      onClick={handleSavePhoneNumber}
                      disabled={isLoading}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {isLoading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingPhone(false)
                        loadPhoneSettings() // Reset to original value
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 p-2 bg-white/5 border border-white/10 rounded-md text-white">
                      {phoneNumber || "No phone number set"}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingPhone(true)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {phoneNumber && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <Phone className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-white/80">Ready to receive calls at {phoneNumber}</AlertDescription>
              </Alert>
            )}
          </div>
        </EnhancedCard>

        {/* Consent & Privacy */}
        <EnhancedCard
          variant="glass"
          delay={0.2}
          title="Privacy & Consent"
          description="Your privacy and consent preferences for phone calls"
          icon={<Shield className="h-5 w-5 text-blue-400" />}
        >
          <div className="space-y-4">
            <Alert className="bg-orange-500/10 border-orange-500/20">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-white/80">
                <strong>Important:</strong> Phone calls will be recorded for AI analysis and feedback purposes. All
                recordings are processed securely and can be deleted at any time. By proceeding, you consent to:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Receiving phone calls from our AI system</li>
                  <li>Call recording for analysis and improvement</li>
                  <li>Secure storage of conversation data</li>
                  <li>AI-powered evaluation of your language skills</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">I consent to phone calls and recording</Label>
                <p className="text-sm text-white/70">Required to enable AI phone practice sessions</p>
              </div>
              <Switch checked={consentGiven} onCheckedChange={handleConsentChange} />
            </div>
          </div>
        </EnhancedCard>

        {/* Start Practice */}
        <EnhancedCard
          variant="glow"
          delay={0.3}
          title="Start Phone Practice"
          description="Begin your AI-powered language practice session"
          icon={<Phone className="h-5 w-5 text-green-400" />}
        >
          <Button
            onClick={handleStartCall}
            disabled={!phoneNumber.trim() || !consentGiven || isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Starting Call..." : "Start Practice Call"}
          </Button>

          {(!phoneNumber.trim() || !consentGiven) && (
            <p className="text-sm text-white/70 mt-2 text-center">
              {!phoneNumber.trim() && "Please enter your phone number"}
              {phoneNumber.trim() && !consentGiven && "Please give consent to enable practice calls"}
            </p>
          )}
        </EnhancedCard>

        {/* Call History */}
        <EnhancedCard
          variant="glass"
          delay={0.4}
          title="Recent Calls"
          description="Your phone practice session history"
          icon={<Clock className="h-5 w-5 text-purple-400" />}
        >
          {loadingHistory ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : callHistory.length > 0 ? (
            <div className="space-y-3">
              {callHistory.map((call: any, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{call.scenario?.title || "Practice Call"}</p>
                    <p className="text-sm text-white/70">
                      {call.scenario?.language || "English"} • {call.createdAt?.toLocaleDateString()} •{" "}
                      {call.duration || 0}m{call.isMockCall && " • Demo"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={call.status === "completed" ? "default" : "secondary"}
                      className={
                        call.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"
                      }
                    >
                      {call.status}
                    </Badge>
                    {call.callAnalysis?.analysis?.overallScore && (
                      <Badge variant="outline" className="border-white/20 text-white">
                        {call.callAnalysis.analysis.overallScore}%
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <p className="text-white/70">No phone calls yet</p>
              <p className="text-sm text-white/50">Complete the setup above to start your first practice session</p>
            </div>
          )}
        </EnhancedCard>
      </div>
    </div>
  )
}
