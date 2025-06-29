"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"

export function ElegantAuthCard() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("signin")

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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="elegant-auth-container"
    >
      <div className="elegant-auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{activeTab === "signin" ? "Sign In" : "Sign Up"}</h2>
          <p className="auth-subtitle">Welcome to the future of language learning</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="auth-tabs">
          <TabsList className="auth-tabs-list">
            <TabsTrigger value="signin" className="auth-tab">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="auth-tab">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="auth-tab-content">
            <form onSubmit={handleSignIn} className="auth-form">
              <div className="input-group">
                <Label htmlFor="signin-email" className="input-label">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="elegant-input"
                />
              </div>

              <div className="input-group">
                <Label htmlFor="signin-password" className="input-label">
                  Password
                </Label>
                <div className="password-input-wrapper">
                  <Input
                    id="signin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="elegant-input password-input"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <a href="#" className="forgot-link">
                  Forgot Password?
                </a>
              </div>

              <Button type="submit" className="elegant-button primary" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="auth-tab-content">
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="input-group">
                <Label htmlFor="signup-name" className="input-label">
                  Full Name
                </Label>
                <Input
                  id="signup-name"
                  name="displayName"
                  placeholder="Enter your full name"
                  required
                  className="elegant-input"
                />
              </div>

              <div className="input-group">
                <Label htmlFor="signup-email" className="input-label">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="elegant-input"
                />
              </div>

              <div className="input-group">
                <Label htmlFor="signup-password" className="input-label">
                  Password
                </Label>
                <div className="password-input-wrapper">
                  <Input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
                    className="elegant-input password-input"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="elegant-button primary" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="social-auth">
          <div className="social-divider">
            <span className="social-divider-text">Or continue with</span>
          </div>

          <div className="social-buttons">
            <button onClick={handleGoogleSignIn} disabled={isLoading} className="social-button google">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button className="social-button apple" disabled>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                />
              </svg>
              Apple
            </button>

            <button className="social-button twitter" disabled>
              <svg className="social-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
              Twitter
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p className="terms-text">
            By continuing, you agree to our{" "}
            <a href="#" className="terms-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="terms-link">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
