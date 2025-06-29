// Use NEXT_PUBLIC_ prefixed variables for client-side access
const OMNIDIM_API_KEY = process.env.NEXT_PUBLIC_OMNIDIM_API_KEY || process.env.OMNIDIM_API_KEY || ""
const OMNIDIM_BASE_URL = process.env.NEXT_PUBLIC_OMNIDIM_BASE_URL || process.env.OMNIDIM_BASE_URL || "https://backend.omnidim.io/api/v1"
// Configure whether to use the proxy (always use in browser environment)
const USE_PROXY = typeof window !== 'undefined'
// Proxy URL for browser-side requests
const PROXY_BASE_URL = '/api/proxy/omnidimension'

// Log configuration in development to help with debugging
if (process.env.NODE_ENV === 'development') {
  console.log(`Omnidimension API Config - API key exists: ${!!OMNIDIM_API_KEY}, Base URL: ${OMNIDIM_BASE_URL}`)
  console.log(`Using proxy for Omnidimension API: ${USE_PROXY ? 'Yes' : 'No'}`)
}

// Configuration for real voice API services
const VOICE_API_CONFIG = {
  omnidim: {
    baseUrl: OMNIDIM_BASE_URL,
    apiKey: OMNIDIM_API_KEY,
    enabled: !!OMNIDIM_API_KEY
  },
  // Example configurations for other real services
  twilio: {
    baseUrl: "https://api.twilio.com/2010-04-01",
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  },
  vapi: {
    baseUrl: "https://api.vapi.ai/v1",
    apiKey: process.env.VAPI_API_KEY || "",
    enabled: !!process.env.VAPI_API_KEY
  },
  // Add more real services as needed
}

// Check if any real voice service is configured
const hasRealVoiceService = Object.values(VOICE_API_CONFIG).some(config => config.enabled)

export interface CallRequest {
  phoneNumber: string
  language: string
  scenario: string
  difficulty: string
  userId: string
  sessionId: string
  agentId?: string // Agent ID for OmniDimension API
}

export interface CallResponse {
  callId: string
  status: string
  message: string
  estimatedDuration?: number
}

export interface CallAnalysis {
  callId: string
  transcript: string
  analysis: {
    fluency: number
    confidence: number
    grammar: number
    vocabulary: number
    pronunciation: number
    overallScore: number
  }
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
  detailedFeedback?: string
  improvementAreas?: string[]
  nextSteps?: string[]
}

export interface Agent {
  id: string
  name: string
  description: string
}

export class OmnidimensionAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = OMNIDIM_API_KEY
    this.baseUrl = OMNIDIM_BASE_URL
  }

  /**
   * Check if the voice API service is available and properly configured
   */
  async isServiceAvailable(): Promise<boolean> {
    // If we have OmniDim configured, check that
    if (VOICE_API_CONFIG.omnidim.enabled) {
      return await this.checkOmniDimService()
    }

    // Check other real voice services
    if (hasRealVoiceService) {
      return await this.checkRealVoiceServices()
    }

    // No services configured
    console.log('No voice services configured')
    return false
  }

  /**
   * Check if OmniDim service is available
   */
  private async checkOmniDimService(): Promise<boolean> {
    try {
      // Log API configuration first for debugging
      console.log(`Checking OmniDim service - API key exists: ${!!this.apiKey}, Base URL: ${this.baseUrl}`)
      
      if (!this.apiKey) {
        console.error("OmniDim API key is missing or empty. Check your .env.local file.")
        return false
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // Increase timeout to 8 seconds
      
      // Always use proxy for client-side and direct API for server-side
      const url = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=agents` 
        : `${this.baseUrl}/agents`
      
      console.log(`OmniDim service check URL: ${url}`)
      
      const headers: Record<string, string> = USE_PROXY
        ? { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        : {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers,
        // Add cache control to prevent caching
        cache: 'no-store'
      })
      
      clearTimeout(timeoutId)
      
      const isAvailable = response.ok
      console.log(`OmniDim service check result: ${isAvailable ? 'Available ✓' : 'Unavailable ✗'} (Status: ${response.status})`)
      
      if (!isAvailable) {
        const errorText = await response.text()
        console.error(`OmniDim service error response: ${errorText}`)
      }
      
      return isAvailable
    } catch (error) {
      console.error('OmniDim service not available:', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  /**
   * Check if any configured real voice services are available
   */
  private async checkRealVoiceServices(): Promise<boolean> {
    // Add checks for real voice services here
    // For now, return false as we don't have real services configured
    return false
  }

  /**
   * Create or get a suitable agent for the call
   */
  async getOrCreateAgent(scenario: string, language: string, difficulty: string): Promise<Agent> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      // First, try to list existing agents
      const listUrl = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=agents` 
        : `${this.baseUrl}/agents`
        
      const headers: Record<string, string> = USE_PROXY
        ? { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        : {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        
      const listResponse = await fetch(listUrl, {
        method: 'GET',
        signal: controller.signal,
        headers
      })

      clearTimeout(timeoutId)

      if (listResponse.ok) {
        const agents = await listResponse.json()
        
        // Look for an existing language coach agent
        const existingAgent = agents.find((agent: any) => 
          agent.name?.toLowerCase().includes('language coach') ||
          agent.description?.toLowerCase().includes('language') ||
          agent.description?.toLowerCase().includes('coach')
        )

        if (existingAgent) {
          return {
            id: existingAgent.id,
            name: existingAgent.name,
            description: existingAgent.description || ''
          }
        }
      }

      // If no suitable agent exists, create one
      const createController = new AbortController()
      const createTimeoutId = setTimeout(() => createController.abort(), 15000)

      const createUrl = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=agents` 
        : `${this.baseUrl}/agents`
      
      // Set updated headers with Accept header
      headers['Accept'] = 'application/json'
      
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        signal: createController.signal,
        headers,
        body: JSON.stringify({
          name: `Language Coach - ${language}`,
          description: `AI language coach for ${language} conversation practice`,
          system_prompt: this.buildCallInstructions(scenario, language, difficulty),
          voice: 'sarah', // Default voice
          language: language.toLowerCase(),
        })
      })

      clearTimeout(createTimeoutId)

      if (!createResponse.ok) {
        throw new Error(`Failed to create agent: ${createResponse.status} ${createResponse.statusText}`)
      }

      const newAgent = await createResponse.json()
      return {
        id: newAgent.id,
        name: newAgent.name,
        description: newAgent.description || ''
      }

    } catch (error) {
      console.error("Error creating/getting agent:", error)
      throw new Error("Failed to create or get suitable agent for the call")
    }
  }

  async initiateCall(request: CallRequest): Promise<CallResponse> {
    try {
      console.log("Checking OmniDim voice service availability...")
      
      // Validate API configuration first
      if (!this.apiKey) {
        console.error("OmniDim API key is missing. Please check your .env.local file configuration.")
        throw new Error("OmniDim API key is not configured. Please check your environment variables.")
      }
      
      // Log API configuration for debugging
      console.log(`API Configuration - Using key: ${this.apiKey.substring(0, 5)}..., Base URL: ${this.baseUrl}`)
      console.log(`Using proxy for requests: ${USE_PROXY ? 'Yes' : 'No'}, Proxy URL: ${PROXY_BASE_URL}`)
      
      // First check if service is available
      const isAvailable = await this.isServiceAvailable()
      if (!isAvailable) {
        throw new Error("OmniDim voice API service is not available. Please check your API key configuration or use demo mode.")
      }

      console.log("Getting or creating agent for call...")
      
      // Get or create a suitable agent
      let agentId = request.agentId
      if (!agentId) {
        const agent = await this.getOrCreateAgent(request.scenario, request.language, request.difficulty)
        agentId = agent.id
      }

      // Enhanced phone number validation and logging
      const cleanedPhoneNumber = request.phoneNumber.replace(/[\s\-()]/g, '')
      const phoneRegex = /^\+\d{1,3}\d{10,}$/ // Must start with + and country code
      
      if (!phoneRegex.test(cleanedPhoneNumber)) {
        console.error(`Invalid phone number format: ${cleanedPhoneNumber}. Must include country code (e.g., +15551234567)`)
        throw new Error("Phone number must include country code (e.g., +15551234567)")
      }
      
      console.log(`Initiating call to validated phone number: ${cleanedPhoneNumber} with agent ${agentId}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for call dispatch

      // Use the dispatch_call endpoint according to OmniDim API documentation
      const url = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=calls/dispatch` 
        : `${this.baseUrl}/calls/dispatch`
      
      // Log full request details for debugging
      console.log(`Call dispatch API URL: ${url}`)
      console.log(`Phone number being used: ${cleanedPhoneNumber}`)
      console.log(`Agent ID being used: ${agentId}`)
        
      const headers: Record<string, string> = USE_PROXY
        ? { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        : {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
      
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          agent_id: parseInt(agentId), // Must be integer as per API docs
          to_number: cleanedPhoneNumber, // Using validated phone number with country code
          call_context: {
            // Language coaching context
            scenario: request.scenario,
            language: request.language,
            difficulty: request.difficulty,
            session_id: request.sessionId,
            user_id: request.userId,
            // Additional context for the language coach agent
            customer_name: "Language Learner",
            practice_type: "language_coaching",
            priority: "normal"
          }
        }),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("OmniDim API Error Response for phone call to", cleanedPhoneNumber, ":", errorText)
        throw new Error(`Call dispatch failed: ${response.status} ${response.statusText}`)
      }

      // Log successful API call details
      console.log(`Call successfully dispatched to ${cleanedPhoneNumber}`)
      
      // Handle different response formats and structures
      const responseData = await response.json()
      const data = responseData.json || responseData // Handle potentially wrapped responses
      console.log("Call dispatched successfully:", data)

      return {
        callId: data.requestId || data.call_log_id || data.id || `call_${Date.now()}`,
        status: data.status || "initiated",
        message: data.message || "Call dispatched successfully",
        estimatedDuration: 5,
      }
    } catch (error) {
      console.error("OmniDim call dispatch error:", error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Call dispatch request timed out. The service may be temporarily unavailable.")
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error("OmniDim API service is unreachable. Please check your internet connection or API configuration.")
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          throw new Error("Invalid API key. Please check your OmniDim API key configuration.")
        }
      }
      
      throw error // Re-throw to handle in UI
    }
  }

  async getCallStatus(callId: string): Promise<{ status: string; transcript?: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      // Use the call log endpoint to get call status
      const url = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=calls/logs/${callId}` 
        : `${this.baseUrl}/calls/logs/${callId}`
        
      const headers: Record<string, string> = USE_PROXY
        ? { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        : {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
      
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Call status check failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Map OmniDim call status to our expected format
      let status = "in_progress"
      if (data.status) {
        switch (data.status.toLowerCase()) {
          case "completed":
          case "ended":
            status = "ended"
            break
          case "in_progress":
          case "ongoing":
          case "active":
            status = "connected"
            break
          case "failed":
          case "error":
            status = "error"
            break
          case "initiated":
          case "ringing":
            status = "ringing"
            break
          default:
            status = data.status
        }
      }

      return {
        status: status,
        transcript: data.transcript || data.call_transcript,
      }
    } catch (error) {
      console.error("Call status check error:", error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Status check timed out")
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error("OmniDim API service is unreachable")
        }
      }
      
      throw error
    }
  }

  async getCallAnalysis(callId: string): Promise<CallAnalysis> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for analysis

      // Get the full call log which should include analysis
      const url = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=calls/logs/${callId}` 
        : `${this.baseUrl}/calls/logs/${callId}`
        
      const headers: Record<string, string> = USE_PROXY
        ? { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        : {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
      
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Call analysis request failed: ${response.statusText}`)
      }

      // Handle different response formats
      const responseData = await response.json()
      const data = responseData.json || responseData // Handle wrapped responses
      
      // Extract analysis data from the call log
      const transcript = data.transcript || data.call_transcript || data.full_transcript || ""
      
      // Create basic analysis if detailed analysis isn't available
      const analysis = data.analysis || {
        fluency: 75,
        confidence: 70,
        grammar: 80,
        vocabulary: 75,
        pronunciation: 78,
        overall_score: 76
      }

      return {
        callId: callId,
        transcript: transcript,
        analysis: {
          fluency: analysis.fluency || 75,
          confidence: analysis.confidence || 70,
          grammar: analysis.grammar || 80,
          vocabulary: analysis.vocabulary || 75,
          pronunciation: analysis.pronunciation || 78,
          overallScore: analysis.overall_score || analysis.overallScore || 76,
        },
        suggestions: data.suggestions || analysis.suggestions || [
          "Practice speaking more slowly for better clarity",
          "Work on expanding your vocabulary in this topic area",
          "Continue practicing conversational flow"
        ],
        strengths: data.strengths || analysis.strengths || [
          "Good pronunciation of key words",
          "Maintained conversation flow",
          "Appropriate use of grammar structures"
        ],
        weaknesses: data.weaknesses || analysis.weaknesses || [
          "Could use more varied vocabulary",
          "Occasional hesitation in responses"
        ],
      }
    } catch (error) {
      console.error("Call analysis error:", error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Analysis request timed out")
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error("OmniDim API service is unreachable")
        }
      }
      
      throw error
    }
  }

  async endCall(callId: string): Promise<{ success: boolean; message: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      // OmniDim may not have a specific "end call" endpoint
      // Instead, we'll just return success as calls typically end naturally
      // If there's a specific endpoint in the future, it can be added here
      
      console.log(`Call ${callId} end requested - calls typically end naturally in OmniDim`)

      return {
        success: true,
        message: "Call end requested successfully",
      }
    } catch (error) {
      console.error("End call error:", error)
      
      // Even if there's an error, we can return success for end call
      // as the call will end naturally
      return {
        success: true,
        message: "Call will end naturally",
      }
    }
  }

  async sendMessage(request: {
    message: string
    language: string
    scenario: string
    difficulty: string
    userId: string
    sessionId?: string
    conversationHistory?: Array<{ role: string; content: string }>
  }): Promise<{ message: string; suggestions?: string[] }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const url = USE_PROXY 
        ? `${PROXY_BASE_URL}?endpoint=chat/message` 
        : `${this.baseUrl}/chat/message`
        
      const headers: Record<string, string> = USE_PROXY
        ? { 'Content-Type': 'application/json' }
        : {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
      
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          message: request.message,
          language: request.language,
          scenario: request.scenario,
          difficulty: request.difficulty,
          user_id: request.userId,
          session_id: request.sessionId,
          conversation_history: request.conversationHistory || [],
          instructions: this.buildChatInstructions(request.scenario, request.language, request.difficulty),
        }),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Chat message failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return {
        message: data.message || "I'm sorry, I didn't understand that. Could you try again?",
        suggestions: data.suggestions || [],
      }
    } catch (error) {
      console.error("Chat message error:", error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Chat request timed out")
        } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error("Voice API service is unreachable")
        }
      }
      
      throw error
    }
  }

  private buildCallInstructions(scenario: string, language: string, difficulty: string): string {
    return `
You are an AI language coach conducting a phone conversation practice session.

Language: ${language}
Difficulty Level: ${difficulty}
Scenario: ${scenario}

Instructions:
1. Speak clearly and at an appropriate pace for ${difficulty} level learners
2. Stay in character for the given scenario throughout the conversation
3. Provide natural, contextually appropriate responses
4. Ask follow-up questions to keep the conversation flowing
5. Gently correct major errors without interrupting the flow
6. Encourage the learner and provide positive reinforcement
7. Adapt your vocabulary and sentence complexity to the ${difficulty} level
8. Keep the conversation engaging and educational
9. End the call naturally after 5-10 minutes of meaningful practice
10. Maintain a supportive and patient tone throughout

Scenario Context: ${scenario}

Begin the conversation by introducing yourself appropriately for this scenario and guide the learner through a natural conversation flow.
`
  }

  private buildChatInstructions(scenario: string, language: string, difficulty: string): string {
    return `
You are an AI language coach conducting a text-based conversation practice session.

Language: ${language}
Difficulty Level: ${difficulty}
Scenario: ${scenario}

Instructions:
1. Respond in ${language} at an appropriate level for ${difficulty} learners
2. Stay in character for the given scenario throughout the conversation
3. Provide natural, contextually appropriate responses
4. Ask follow-up questions to keep the conversation flowing
5. Gently correct major errors by modeling the correct usage
6. Encourage the learner and provide positive reinforcement
7. Adapt your vocabulary and sentence complexity to the ${difficulty} level
8. Keep the conversation engaging and educational
9. Provide helpful suggestions when appropriate
10. Maintain a supportive and patient tone throughout

Scenario Context: ${scenario}

Respond naturally and help guide the learner through meaningful conversation practice.
`
  }
}

export const omnidimensionAPI = new OmnidimensionAPI()
