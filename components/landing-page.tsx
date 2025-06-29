"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { MessageCircle, BarChart3, Phone, Globe, Zap, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThreeHeroSection } from "@/components/three-hero-section"
import { ElegantAuthCard } from "@/components/elegant-auth-card"

export function LandingPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      await signIn(email, password)
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      })
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const displayName = formData.get("displayName") as string

    try {
      await signUp(email, password, displayName)
      toast({
        title: "Account created!",
        description: "Welcome to LinguaCoach. Let's start your language journey.",
      })
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "Please try again with different credentials.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast({
        title: "Welcome!",
        description: "You've successfully signed in with Google.",
      })
    } catch (error) {
      toast({
        title: "Google sign in failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Three.js Hero Section */}
      <ThreeHeroSection />

      {/* Content Overlay */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-black/50 to-black">
        {/* Features Section */}
        <div className="container mx-auto px-4 py-8 -mt-32">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <Card className="glass-effect border-0 animate-slide-up bg-black/20 backdrop-blur-md">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">AI Conversations</CardTitle>
                <CardDescription className="text-gray-300">
                  Practice with advanced AI that adapts to any scenario you describe
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="glass-effect border-0 animate-slide-up bg-black/20 backdrop-blur-md"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Deep Analytics</CardTitle>
                <CardDescription className="text-gray-300">
                  Get detailed feedback on fluency, confidence, grammar, and vocabulary
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="glass-effect border-0 animate-slide-up bg-black/20 backdrop-blur-md"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <Phone className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Phone Practice</CardTitle>
                <CardDescription className="text-gray-300">
                  Take your practice to the next level with real phone conversations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Auth Section */}
          <div className="max-w-md mx-auto">
            <ElegantAuthCard />
          </div>
        </div>
      </div>
    </div>
  )
}
