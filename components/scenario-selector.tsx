"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Briefcase, Plane, Coffee, GraduationCap, Heart, ShoppingCart, Plus, Sparkles } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"
import { EnhancedCard } from "@/components/enhanced-card"
import { motion } from "framer-motion"

const PRESET_SCENARIOS = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice common interview questions and professional communication",
    icon: Briefcase,
    category: "Professional",
    difficulty: "Intermediate",
    context:
      "You are in a job interview for a software developer position. The interviewer will ask about your experience, skills, and motivation.",
  },
  {
    id: "travel-hotel",
    title: "Hotel Check-in",
    description: "Learn to communicate at hotels, restaurants, and tourist spots",
    icon: Plane,
    category: "Travel",
    difficulty: "Beginner",
    context: "You are checking into a hotel. Practice asking about amenities, room service, and local recommendations.",
  },
  {
    id: "casual-conversation",
    title: "Casual Conversation",
    description: "Everyday conversations with friends and acquaintances",
    icon: Coffee,
    category: "Social",
    difficulty: "Beginner",
    context:
      "You are having a casual conversation with a friend at a coffee shop. Discuss your weekend plans, hobbies, and current events.",
  },
  {
    id: "academic-presentation",
    title: "Academic Presentation",
    description: "Present ideas clearly in academic or professional settings",
    icon: GraduationCap,
    category: "Academic",
    difficulty: "Advanced",
    context:
      "You are presenting your research project to a panel of professors. Explain your methodology, findings, and conclusions.",
  },
  {
    id: "medical-appointment",
    title: "Medical Appointment",
    description: "Communicate symptoms and understand medical advice",
    icon: Heart,
    category: "Healthcare",
    difficulty: "Intermediate",
    context:
      "You are visiting a doctor for a routine check-up. Describe any symptoms and ask questions about your health.",
  },
  {
    id: "shopping-negotiation",
    title: "Shopping & Negotiation",
    description: "Practice bargaining and making purchases",
    icon: ShoppingCart,
    category: "Commerce",
    difficulty: "Intermediate",
    context: "You are shopping at a local market. Practice asking about prices, negotiating, and making purchases.",
  },
]

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Mandarin",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Dutch",
  "Swedish",
]

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"]

const ENVIRONMENT_TEMPLATES = [
  {
    id: "business-meeting",
    title: "Business Meeting",
    description: "Professional meeting environment",
    template:
      "You are in a business meeting discussing quarterly results. The atmosphere is professional and formal. Other participants include your manager and team members.",
  },
  {
    id: "restaurant",
    title: "Restaurant",
    description: "Dining and ordering food",
    template:
      "You are at a restaurant with friends. The waiter will take your order and you'll discuss the menu, dietary preferences, and make conversation.",
  },
  {
    id: "airport",
    title: "Airport",
    description: "Travel and transportation",
    template:
      "You are at an airport dealing with check-in, security, and flight information. Practice asking for directions and handling travel situations.",
  },
  {
    id: "university",
    title: "University Campus",
    description: "Academic environment",
    template:
      "You are on a university campus talking to professors, classmates, or administrative staff about courses, assignments, and campus life.",
  },
  {
    id: "hospital",
    title: "Hospital/Clinic",
    description: "Medical environment",
    template:
      "You are in a medical setting speaking with healthcare professionals about symptoms, treatments, and health concerns.",
  },
  {
    id: "bank",
    title: "Bank",
    description: "Financial services",
    template: "You are at a bank discussing account services, loans, or financial planning with a bank representative.",
  },
]

interface ScenarioSelectorProps {
  onScenarioSelected: (scenario: any) => void
  onBack: () => void
}

export function ScenarioSelector({ onScenarioSelected, onBack }: ScenarioSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("English")
  const [selectedDifficulty, setSelectedDifficulty] = useState("Intermediate")
  const [activeTab, setActiveTab] = useState("presets")

  // Custom scenario fields
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customContext, setCustomContext] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [customRole, setCustomRole] = useState("")
  const [customSetting, setCustomSetting] = useState("")
  const [customObjectives, setCustomObjectives] = useState("")

  const handlePresetSelect = (scenario: any) => {
    onScenarioSelected({
      ...scenario,
      language: selectedLanguage,
      difficulty: selectedDifficulty,
      isCustom: false,
    })
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id)
    setCustomTitle(template.title)
    setCustomDescription(template.description)
    setCustomContext(template.template)
    setCustomSetting(template.title)
  }

  const buildCustomScenario = () => {
    let context = customContext

    if (!context && selectedTemplate) {
      const template = ENVIRONMENT_TEMPLATES.find((t) => t.id === selectedTemplate)
      context = template?.template || ""
    }

    if (!context) {
      // Build context from individual fields
      const parts = []
      if (customRole) parts.push(`You are ${customRole}`)
      if (customSetting) parts.push(`in ${customSetting}`)
      if (customObjectives) parts.push(`Your objectives: ${customObjectives}`)
      context = parts.join(". ") + "."
    }

    return {
      id: "custom",
      title: customTitle || "Custom Practice",
      description: customDescription || "Custom practice scenario",
      context: context,
      language: selectedLanguage,
      difficulty: selectedDifficulty,
      isCustom: true,
      customFields: {
        role: customRole,
        setting: customSetting,
        objectives: customObjectives,
      },
    }
  }

  const handleCustomSubmit = () => {
    const scenario = buildCustomScenario()

    if (!scenario.context.trim()) {
      return
    }

    onScenarioSelected(scenario)
  }

  const isCustomValid = () => {
    return (customTitle.trim() && customContext.trim()) || (customRole.trim() && customSetting.trim())
  }

  return (
    <div className="min-h-screen relative">
      <SpaceBackground intensity={0.3} />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={onBack} className="mb-4 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold mb-2 text-white">Choose Your Practice Scenario</h1>
          <p className="text-white/70">Select a language and scenario to begin your practice session</p>
        </motion.div>

        {/* Language and Difficulty Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <EnhancedCard
            variant="glass"
            delay={0.1}
            title="Language"
            description="Choose the language you want to practice"
          >
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white backdrop-blur-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/80 border-white/20 backdrop-blur-md">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang} className="text-white hover:bg-white/10">
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EnhancedCard>

          <EnhancedCard
            variant="glass"
            delay={0.2}
            title="Difficulty Level"
            description="Select your current proficiency level"
          >
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white backdrop-blur-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/80 border-white/20 backdrop-blur-md">
                {DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level} className="text-white hover:bg-white/10">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EnhancedCard>
        </div>

        {/* Scenario Selection Tabs */}
        <EnhancedCard variant="glass" delay={0.3}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
              <TabsTrigger value="presets" className="text-white data-[state=active]:bg-orange-500/20">
                <Briefcase className="h-4 w-4 mr-2" />
                Preset Scenarios
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-white data-[state=active]:bg-orange-500/20">
                <Sparkles className="h-4 w-4 mr-2" />
                Environment Templates
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-white data-[state=active]:bg-orange-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Custom Environment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PRESET_SCENARIOS.map((scenario, index) => {
                  const IconComponent = scenario.icon
                  return (
                    <EnhancedCard
                      key={scenario.id}
                      variant="glass"
                      delay={0.1 + index * 0.05}
                      onClick={() => handlePresetSelect(scenario)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <IconComponent className="h-8 w-8 text-orange-400" />
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-white/10 text-white">
                              {scenario.category}
                            </Badge>
                            <Badge
                              variant={
                                scenario.difficulty === "Beginner"
                                  ? "default"
                                  : scenario.difficulty === "Intermediate"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={
                                scenario.difficulty === "Beginner"
                                  ? "bg-green-500/20 text-green-400"
                                  : scenario.difficulty === "Intermediate"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }
                            >
                              {scenario.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-white">{scenario.title}</CardTitle>
                        <CardDescription className="text-white/70">{scenario.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                          Start Practice
                        </Button>
                      </CardContent>
                    </EnhancedCard>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Choose an Environment Template</h3>
                  <p className="text-white/70 mb-6">
                    Select a pre-built environment and customize it for your practice needs
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ENVIRONMENT_TEMPLATES.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/20 hover:border-white/40 bg-white/5"
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h4 className="font-medium text-white mb-2">{template.title}</h4>
                      <p className="text-sm text-white/70 mb-3">{template.description}</p>
                      <p className="text-xs text-white/50">{template.template.substring(0, 100)}...</p>
                    </motion.div>
                  ))}
                </div>

                {selectedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 border-t border-white/20 pt-6"
                  >
                    <h4 className="text-lg font-medium text-white">Customize Your Environment</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="custom-title" className="text-white">
                          Scenario Title
                        </Label>
                        <Input
                          id="custom-title"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="e.g., Business Presentation"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="custom-description" className="text-white">
                          Short Description
                        </Label>
                        <Input
                          id="custom-description"
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder="Brief description of the scenario"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="template-context" className="text-white">
                        Scenario Context
                      </Label>
                      <Textarea
                        id="template-context"
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        rows={4}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <Button
                      onClick={handleCustomSubmit}
                      disabled={!isCustomValid()}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      Start Custom Practice
                    </Button>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Create Your Custom Environment</h3>
                  <p className="text-white/70 mb-6">
                    Build a completely custom practice scenario tailored to your specific needs
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-title-full" className="text-white">
                        Scenario Title *
                      </Label>
                      <Input
                        id="custom-title-full"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g., Tech Startup Pitch Meeting"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-role" className="text-white">
                        Your Role
                      </Label>
                      <Input
                        id="custom-role"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g., a startup founder, a job candidate, a tourist"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-setting" className="text-white">
                        Setting/Location
                      </Label>
                      <Input
                        id="custom-setting"
                        value={customSetting}
                        onChange={(e) => setCustomSetting(e.target.value)}
                        placeholder="e.g., a conference room, a coffee shop, an airport"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-objectives" className="text-white">
                        Objectives/Goals
                      </Label>
                      <Textarea
                        id="custom-objectives"
                        value={customObjectives}
                        onChange={(e) => setCustomObjectives(e.target.value)}
                        placeholder="What do you want to achieve in this conversation?"
                        rows={3}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-description-full" className="text-white">
                        Description
                      </Label>
                      <Input
                        id="custom-description-full"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Brief description of your scenario"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-context-full" className="text-white">
                        Full Scenario Context *
                      </Label>
                      <Textarea
                        id="custom-context-full"
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        placeholder="Describe the complete scenario, including your role, the setting, who you're talking to, and what you want to accomplish. Be as detailed as possible for the best AI coaching experience."
                        rows={8}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="font-medium text-blue-400 mb-2">💡 Tips for Great Custom Scenarios</h4>
                      <ul className="text-sm text-white/70 space-y-1">
                        <li>• Be specific about the context and your role</li>
                        <li>• Include details about who you're speaking with</li>
                        <li>• Mention any specific vocabulary or topics to focus on</li>
                        <li>• Describe the tone (formal, casual, professional, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCustomSubmit}
                  disabled={!isCustomValid()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Custom Practice
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </EnhancedCard>
      </div>
    </div>
  )
}
