const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_BASE_URL = "https://api.groq.com/openai/v1"

export interface ConversationAnalytics {
  fluency: number
  confidence: number
  grammar: number
  vocabulary: number
  pronunciation: number
  hesitations: string[]
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
  overallScore: number
  detailedFeedback: string
  improvementAreas: string[]
  nextSteps: string[]
}

export class GroqAnalyticsAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = GROQ_API_KEY
    this.baseUrl = GROQ_BASE_URL
  }

  async analyzeConversation(
    transcript: string,
    scenario: string,
    language: string,
    userLevel: string,
  ): Promise<ConversationAnalytics> {
    try {
      const prompt = this.buildAnalysisPrompt(transcript, scenario, language, userLevel)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert language learning coach and conversation analyst. Analyze conversations and provide detailed, constructive feedback to help learners improve their language skills. Always respond with valid JSON only.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Groq API error response:", errorText)
        throw new Error(`Groq API request failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0]?.message?.content

      if (!analysisText) {
        throw new Error("No analysis content received from Groq API")
      }

      return this.parseAnalysisResponse(analysisText)
    } catch (error) {
      console.error("Groq Analytics API error:", error)
      // Return fallback analytics
      return this.getFallbackAnalytics()
    }
  }

  private buildAnalysisPrompt(transcript: string, scenario: string, language: string, userLevel: string): string {
    return `
Analyze this ${language} conversation practice session and provide detailed feedback in JSON format.

**Scenario Context:** ${scenario}
**User Level:** ${userLevel}
**Language:** ${language}

**Conversation Transcript:**
${transcript}

Provide analysis in this exact JSON structure:
{
  "fluency": 85,
  "confidence": 78,
  "grammar": 82,
  "vocabulary": 80,
  "pronunciation": 75,
  "hesitations": ["occasional pauses", "some filler words"],
  "suggestions": ["practice speaking more naturally", "expand vocabulary"],
  "strengths": ["good grammar structure", "clear communication"],
  "weaknesses": ["could speak more fluently"],
  "overallScore": 80,
  "detailedFeedback": "Comprehensive feedback paragraph here",
  "improvementAreas": ["fluency", "pronunciation"],
  "nextSteps": ["practice daily", "focus on pronunciation"]
}

Focus on:
1. Natural flow and rhythm of speech (fluency: 0-100)
2. Grammar accuracy and complexity (grammar: 0-100)
3. Vocabulary range and appropriateness (vocabulary: 0-100)
4. Confidence in expression (confidence: 0-100)
5. Pronunciation clarity (pronunciation: 0-100)
6. Overall performance (overallScore: 0-100)

Provide constructive, encouraging feedback that helps the learner progress.
`
  }

  private parseAnalysisResponse(analysisText: string): ConversationAnalytics {
    try {
      const parsed = JSON.parse(analysisText)
      return {
        fluency: Math.min(100, Math.max(0, parsed.fluency || 75)),
        confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
        grammar: Math.min(100, Math.max(0, parsed.grammar || 80)),
        vocabulary: Math.min(100, Math.max(0, parsed.vocabulary || 75)),
        pronunciation: Math.min(100, Math.max(0, parsed.pronunciation || 70)),
        hesitations: Array.isArray(parsed.hesitations) ? parsed.hesitations : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        overallScore: Math.min(100, Math.max(0, parsed.overallScore || 74)),
        detailedFeedback: parsed.detailedFeedback || "Good conversation practice session.",
        improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      }
    } catch (error) {
      console.error("Error parsing Groq analysis response:", error)
      return this.getFallbackAnalytics()
    }
  }

  private getFallbackAnalytics(): ConversationAnalytics {
    return {
      fluency: 75,
      confidence: 70,
      grammar: 80,
      vocabulary: 75,
      pronunciation: 70,
      hesitations: ["Some pauses while thinking", "Occasional filler words"],
      suggestions: [
        "Practice speaking more naturally",
        "Expand vocabulary in this topic area",
        "Work on pronunciation of specific sounds",
      ],
      strengths: ["Good grammar structure", "Clear communication intent", "Appropriate vocabulary usage"],
      weaknesses: ["Could speak more fluently", "Some hesitation in responses"],
      overallScore: 74,
      detailedFeedback:
        "You demonstrated good understanding of the scenario and communicated effectively. Focus on building confidence to reduce hesitations and practice speaking more naturally.",
      improvementAreas: ["Fluency", "Confidence", "Pronunciation"],
      nextSteps: ["Practice daily conversations", "Record yourself speaking", "Focus on pronunciation exercises"],
    }
  }

  async generateSessionSummary(
    analytics: ConversationAnalytics,
    sessionDuration: number,
    scenario: string,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a language learning coach. Create encouraging, personalized session summaries.",
            },
            {
              role: "user",
              content: `Create a motivating session summary for a ${sessionDuration}-minute ${scenario} practice session with these results: Overall Score: ${analytics.overallScore}%, Strengths: ${analytics.strengths.join(", ")}, Areas to improve: ${analytics.improvementAreas.join(", ")}. Keep it positive and encouraging, max 100 words.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      })

      if (!response.ok) {
        throw new Error(`Session summary request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return (
        data.choices[0]?.message?.content ||
        `Great ${sessionDuration}-minute practice session! You scored ${analytics.overallScore}% overall. Keep up the excellent work!`
      )
    } catch (error) {
      console.error("Error generating session summary:", error)
      return `Excellent ${sessionDuration}-minute practice session! You scored ${analytics.overallScore}% overall. Keep practicing to improve further!`
    }
  }
}

export const groqAnalyticsAPI = new GroqAnalyticsAPI()
