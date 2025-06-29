const OMNIDIMENSION_API_KEY = process.env.OMNIDIMENSION_API_KEY || ""
const OMNIDIMENSION_BASE_URL = process.env.OMNIDIMENSION_BASE_URL || "https://api.omnidimension.ai/v1"

export interface CallRequest {
  phoneNumber: string
  language: string
  scenario: string
  difficulty: string
  userId: string
  sessionId: string
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
}

export class OmnidimensionAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = OMNIDIMENSION_API_KEY
    this.baseUrl = OMNIDIMENSION_BASE_URL
  }

  async initiateCall(request: CallRequest): Promise<CallResponse> {
    try {
      console.log("Initiating real phone call to:", request.phoneNumber)

      const response = await fetch(`${this.baseUrl}/calls/initiate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: request.phoneNumber,
          language: request.language,
          scenario: request.scenario,
          difficulty: request.difficulty,
          user_id: request.userId,
          session_id: request.sessionId,
          instructions: this.buildCallInstructions(request.scenario, request.language, request.difficulty),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Call initiation failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Call initiated successfully:", data)

      return {
        callId: data.call_id || `call_${Date.now()}`,
        status: data.status || "initiated",
        message: data.message || "Call initiated successfully",
        estimatedDuration: data.estimated_duration || 5,
      }
    } catch (error) {
      console.error("Omnidimension call initiation error:", error)
      throw error // Re-throw to handle in UI
    }
  }

  async getCallStatus(callId: string): Promise<{ status: string; transcript?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        status: data.status || "in_progress",
        transcript: data.transcript,
      }
    } catch (error) {
      console.error("Call status check error:", error)
      throw error
    }
  }

  async getCallAnalysis(callId: string): Promise<CallAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/analysis`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        callId: callId,
        transcript: data.transcript || "",
        analysis: {
          fluency: data.analysis?.fluency || 0,
          confidence: data.analysis?.confidence || 0,
          grammar: data.analysis?.grammar || 0,
          vocabulary: data.analysis?.vocabulary || 0,
          pronunciation: data.analysis?.pronunciation || 0,
          overallScore: data.analysis?.overall_score || 0,
        },
        suggestions: data.suggestions || [],
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
      }
    } catch (error) {
      console.error("Call analysis error:", error)
      throw error
    }
  }

  async endCall(callId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`End call failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message: data.message || "Call ended successfully",
      }
    } catch (error) {
      console.error("End call error:", error)
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
}

export const omnidimensionAPI = new OmnidimensionAPI()
