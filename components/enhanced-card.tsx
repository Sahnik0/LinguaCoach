"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EnhancedCardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  icon?: ReactNode
  onClick?: () => void
  delay?: number
  variant?: "default" | "glass" | "gradient" | "glow"
}

export function EnhancedCard({
  children,
  className,
  title,
  description,
  icon,
  onClick,
  delay = 0,
  variant = "default",
}: EnhancedCardProps) {
  const variants = {
    default: "bg-card/80 backdrop-blur-md border-border/50",
    glass: "bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl",
    gradient: "bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20",
    glow: "bg-card/80 backdrop-blur-md border-orange-500/30 shadow-orange-500/20 shadow-lg",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: 1.02,
        y: -8,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-2xl",
          variants[variant],
          "relative overflow-hidden",
          className,
        )}
        onClick={onClick}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={false}
          animate={{
            background: [
              "linear-gradient(45deg, rgba(255,107,107,0) 0%, rgba(255,142,83,0.05) 50%, rgba(255,107,107,0) 100%)",
              "linear-gradient(225deg, rgba(255,107,107,0) 0%, rgba(255,142,83,0.05) 50%, rgba(255,107,107,0) 100%)",
              "linear-gradient(45deg, rgba(255,107,107,0) 0%, rgba(255,142,83,0.05) 50%, rgba(255,107,107,0) 100%)",
            ],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          initial={false}
          animate={{
            background: [
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
            ],
            x: ["-100%", "100%"],
          }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        <CardHeader className="relative z-10">
          {icon && (
            <motion.div className="mb-2" whileHover={{ rotate: 5, scale: 1.1 }} transition={{ duration: 0.2 }}>
              {icon}
            </motion.div>
          )}
          {title && (
            <CardTitle className="text-foreground group-hover:text-orange-400 transition-colors duration-300">
              {title}
            </CardTitle>
          )}
          {description && <CardDescription className="text-muted-foreground">{description}</CardDescription>}
        </CardHeader>

        <CardContent className="relative z-10">{children}</CardContent>

        {/* Corner accent */}
        <motion.div
          className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ clipPath: "polygon(100% 0%, 0% 0%, 100% 100%)" }}
        />
      </Card>
    </motion.div>
  )
}
