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
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: -2 }}
      transition={{ 
        duration: 0.6, 
        ease: "easeOut"
      }}
      className="elegant-auth-container"
      style={{
        transform: 'rotate(-2deg)',
        transition: 'all 0.3s ease',
        width: '100%',
        maxWidth: '600px'
      }}
    >
      <motion.div 
        className="elegant-auth-card"
        whileHover={{ 
          rotate: 0,
          scale: 1.02,
          boxShadow: "20px 20px 0 rgba(0,0,0,0.1)"
        }}
        whileTap={{
          scale: 0.98
        }}
        transition={{ duration: 0.3 }}
        style={{
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '15px 15px 32px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          padding: '20px',
          borderRadius: '16px'
        }}
      >
        {/* Animated Banner */}
        <motion.div 
          className="auth-banner"
          style={{
            position: 'absolute',
            top: '3px',
            right: '-95px',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))',
            color: '#fff',
            padding: '10px',
            width: '350px',
            textAlign: 'center',
            transform: 'rotate(45deg)',
            fontWeight: 'bold',
            fontSize: '16px',
            letterSpacing: '2px',
            overflow: 'hidden',
            transition: 'background 0.5s ease',
            backdropFilter: 'blur(10px)',
            borderRadius: '4px'
          }}
          whileHover={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.6), rgba(239,68,68,0.8))'
          }}
        >
          <motion.span
            className="banner-text"
            style={{
              display: 'inline-block',
              position: 'absolute',
              left: '13%',
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'all 0.5s ease'
            }}
            whileHover={{
              opacity: 0,
              y: -20
            }}
          >
            {activeTab === "signin" ? "SIGN IN" : "SIGN UP"}
          </motion.span>
          <motion.span
            className="banner-text-hover"
            style={{
              display: 'inline-block',
              position: 'absolute',
              left: '13%',
              top: '50%',
              transform: 'translateY(60%)',
              opacity: 0,
              transition: 'all 0.5s ease'
            }}
            whileHover={{
              opacity: 1,
              y: -10
            }}
          >
            JOIN US
          </motion.span>
        </motion.div>

        <motion.div 
          className="auth-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="auth-title" style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#000',
            textTransform: 'uppercase',
            marginBottom: '8px',
            display: 'block',
            borderBottom: '2px solid rgba(0,0,0,0.6)',
            width: '70%'
          }}>
            {activeTab === "signin" ? "Sign In" : "Sign Up"}
          </h2>
          <p className="auth-subtitle" style={{
            fontSize: '14px',
            lineHeight: '1.4',
            color: '#333',
            marginBottom: '15px',
            paddingBottom: '8px'
          }}>
            Welcome to the future of language learning
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="auth-tabs">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <TabsList className="auth-tabs-list" style={{
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(15px)',
                borderRadius: '12px'
              }}>
                <TabsTrigger value="signin" className="auth-tab" style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: activeTab === 'signin' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'signin' ? '#fff' : '#000',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '8px'
                }}>
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="auth-tab" style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: activeTab === 'signup' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'signup' ? '#fff' : '#000',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '8px'
                }}>
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="signin" className="auth-tab-content">
              <motion.form 
                onSubmit={handleSignIn} 
                className="auth-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <motion.div 
                  className="input-group"
                  whileFocus={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="signin-email" className="input-label" style={{
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}>
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="elegant-input"
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '8px',
                      color: '#000',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </motion.div>

                <motion.div 
                  className="input-group"
                  whileFocus={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="signin-password" className="input-label" style={{
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}>
                    Password
                  </Label>
                  <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      className="elegant-input password-input"
                      style={{
                        padding: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '8px',
                        color: '#000',
                        transition: 'all 0.3s ease',
                        paddingRight: '50px'
                      }}
                    />
                    <motion.button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="password-toggle"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ 
                        scale: 0.9,
                        rotate: [0, -10, 10, -10, 0]
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div 
                  className="forgot-password"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <a href="#" className="forgot-link" style={{
                    color: '#000',
                    textDecoration: 'underline',
                    fontWeight: 'bold'
                  }}>
                    Forgot Password?
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="elegant-button primary"
                    whileHover={{ 
                      background: 'rgba(255,255,255,0.2)',
                      color: '#000',
                      y: -5,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    whileTap={{
                      y: 0,
                      boxShadow: 'none',
                      scale: [1, 0.95, 1.05, 0.95, 1]
                    }}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))',
                      backdropFilter: 'blur(20px)',
                      color: '#fff',
                      padding: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '8px'
                    }}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </motion.button>
                </motion.div>
              </motion.form>
            </TabsContent>

            <TabsContent value="signup" className="auth-tab-content">
              <motion.form 
                onSubmit={handleSignUp} 
                className="auth-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <motion.div 
                  className="input-group"
                  whileFocus={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="signup-name" className="input-label" style={{
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}>
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="displayName"
                    placeholder="Enter your full name"
                    required
                    className="elegant-input"
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '8px',
                      color: '#000',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </motion.div>

                <motion.div 
                  className="input-group"
                  whileFocus={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="signup-email" className="input-label" style={{
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}>
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="elegant-input"
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '8px',
                      color: '#000',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </motion.div>

                <motion.div 
                  className="input-group"
                  whileFocus={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="signup-password" className="input-label" style={{
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '14px'
                  }}>
                    Password
                  </Label>
                  <div className="password-input-wrapper" style={{ position: 'relative' }}>
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                      className="elegant-input password-input"
                      style={{
                        padding: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '8px',
                        color: '#000',
                        transition: 'all 0.3s ease',
                        paddingRight: '50px'
                      }}
                    />
                    <motion.button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="password-toggle"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ 
                        scale: 0.9,
                        rotate: [0, -10, 10, -10, 0]
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="elegant-button primary"
                    whileHover={{ 
                      background: 'rgba(255,255,255,0.2)',
                      color: '#000',
                      y: -5,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    whileTap={{
                      y: 0,
                      boxShadow: 'none',
                      scale: [1, 0.95, 1.05, 0.95, 1]
                    }}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))',
                      backdropFilter: 'blur(20px)',
                      color: '#fff',
                      padding: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '8px'
                    }}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </motion.button>
                </motion.div>
              </motion.form>
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div 
          className="social-auth"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="social-divider" style={{
            textAlign: 'center',
            margin: '15px 0',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: '8px'
          }}>
            <span className="social-divider-text" style={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '12px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>Or continue with</span>
          </div>

          <div className="social-buttons" style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <motion.button 
              onClick={handleGoogleSignIn} 
              disabled={isLoading} 
              className="social-button google"
              whileHover={{ 
                scale: 1.05,
                y: -5,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}
              whileTap={{ 
                scale: 0.95,
                y: 0,
                boxShadow: 'none'
              }}
              style={{
                flex: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(15px)',
                color: '#000',
                padding: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px'
              }}
            >
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
            </motion.button>

            <motion.button 
              className="social-button apple" 
              disabled
              style={{
                flex: 1,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(15px)',
                color: '#6b7280',
                padding: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'not-allowed',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px',
                opacity: 0.5
              }}
            >
              <svg className="social-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                />
              </svg>
              Apple
            </motion.button>

            <motion.button 
              className="social-button twitter" 
              disabled
              style={{
                flex: 1,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(15px)',
                color: '#6b7280',
                padding: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'not-allowed',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px',
                opacity: 0.5
              }}
            >
              <svg className="social-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
              Twitter
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="terms-text" style={{
            fontSize: '10px',
            color: '#666',
            textAlign: 'center',
            marginTop: '15px'
          }}>
            By continuing, you agree to our{" "}
            <a href="#" className="terms-link" style={{
              color: '#000',
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="terms-link" style={{
              color: '#000',
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}>
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
