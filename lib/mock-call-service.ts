import { analyzeConversationWithAI } from '@/lib/conversation-analysis';

export interface MockCallData {
  callId: string
  status: "initiating" | "ringing" | "connected" | "ended"
  startTime?: Date
  duration: number
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

// Define the interface for the mock service methods
interface IMockCallService {
  initiateCall(scenario: any, language: string, difficulty: string): Promise<{ callId: string; status: string; message: string }>;
  getCallStatus(callId: string): Promise<{ status: string; transcript?: string }>;
  endCall(callId: string): Promise<{ success: boolean; message: string }>;
  getCallAnalysis(callId: string): Promise<MockCallData>;
  updateDemoTranscript(callId: string, text: string): Promise<boolean>;
  cleanup(): void;
}

// Implement the class with the interface
class MockCallService implements IMockCallService {
  private calls: Map<string, MockCallData> = new Map()
  private callTimers: Map<string, NodeJS.Timeout> = new Map()
  private demoTranscript: Map<string, string> = new Map()

  generateCallId(): string {
    return `mock_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  initiateCall(
    scenario: any,
    language: string,
    difficulty: string,
  ): Promise<{ callId: string; status: string; message: string }> {
    return new Promise((resolve) => {
      const callId = this.generateCallId()

      // Store a blank transcript initially - we'll build it via demo voice
      const mockCall: MockCallData & { scenario?: any, language?: string, difficulty?: string } = {
        callId,
        status: "initiating",
        duration: 0,
        transcript: "",
        // Store scenario, language and difficulty for later analysis
        scenario: scenario,
        language: language,
        difficulty: difficulty,
        analysis: this.generateMockAnalysis(difficulty),
        suggestions: this.generateMockSuggestions(difficulty),
        strengths: this.generateMockStrengths(),
        weaknesses: this.generateMockWeaknesses(difficulty),
      }

      this.calls.set(callId, mockCall)

      // Simulate call progression
      setTimeout(() => {
        const call = this.calls.get(callId)
        if (call) {
          call.status = "ringing"
          this.calls.set(callId, call)
        }
      }, 1000)

      setTimeout(() => {
        const call = this.calls.get(callId)
        if (call) {
          call.status = "connected"
          call.startTime = new Date()
          this.calls.set(callId, call)
          this.startCallTimer(callId)
        }
      }, 3000)

      resolve({
        callId,
        status: "initiated",
        message: "Mock call initiated successfully",
      })
    })
  }

  getCallStatus(callId: string): Promise<{ status: string; transcript?: string }> {
    return new Promise((resolve) => {
      const call = this.calls.get(callId)
      if (!call) {
        resolve({ status: "not_found" })
        return
      }

      resolve({
        status: call.status,
        transcript: call.status === "ended" ? call.transcript : undefined,
      })
    })
  }

  endCall(callId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const call = this.calls.get(callId)
      if (!call) {
        resolve({ success: false, message: "Call not found" })
        return
      }

      call.status = "ended"
      this.calls.set(callId, call)

      // Clear timer
      const timer = this.callTimers.get(callId)
      if (timer) {
        clearInterval(timer)
        this.callTimers.delete(callId)
      }

      resolve({ success: true, message: "Call ended successfully" })
    })
  }

  getCallAnalysis(callId: string): Promise<MockCallData> {
    return new Promise(async (resolve, reject) => {
      try {
        const call = this.calls.get(callId)
        if (!call) {
          throw new Error("Call not found")
        }
        
        // Only run AI analysis if we have a transcript
        if (call.transcript && call.transcript.length > 0) {
          console.log("Running AI analysis on transcript for call", callId);
          
          // Get the scenario from the call if available (we stored it during initiation)
          const scenario = (call as any).scenario || {};
          const language = (call as any).language || "English";
          const difficulty = (call as any).difficulty || "Intermediate";
          
          // Use real AI analysis instead of mock data
          const aiAnalysis = await analyzeConversationWithAI(
            call.transcript, 
            language, 
            difficulty,
            scenario
          );
          
          // Update the call with AI analysis
          call.analysis = {
            fluency: aiAnalysis.fluency,
            confidence: aiAnalysis.confidence,
            grammar: aiAnalysis.grammar,
            vocabulary: aiAnalysis.vocabulary,
            pronunciation: aiAnalysis.pronunciation,
            overallScore: aiAnalysis.overallScore,
          };
          call.suggestions = aiAnalysis.suggestions;
          call.strengths = aiAnalysis.strengths;
          call.weaknesses = aiAnalysis.weaknesses;
          
          // Add additional fields if available
          if (aiAnalysis.detailedFeedback) call.detailedFeedback = aiAnalysis.detailedFeedback;
          if (aiAnalysis.improvementAreas) call.improvementAreas = aiAnalysis.improvementAreas;
          if (aiAnalysis.nextSteps) call.nextSteps = aiAnalysis.nextSteps;
          
          // Save the updated call
          this.calls.set(callId, call);
        }

        resolve(call)
      } catch (error) {
        console.error("Error getting call analysis:", error);
        
        // Still return the call even if analysis fails
        const call = this.calls.get(callId);
        if (call) {
          resolve(call);
        } else {
          reject(error);
        }
      }
    })
  }

  private startCallTimer(callId: string) {
    const timer = setInterval(() => {
      const call = this.calls.get(callId)
      if (call && call.startTime) {
        call.duration = Math.floor((new Date().getTime() - call.startTime.getTime()) / 1000)
        this.calls.set(callId, call)

        // Auto-end call after 5 minutes for demo
        if (call.duration >= 300) {
          this.endCall(callId)
        }
      }
    }, 1000)

    this.callTimers.set(callId, timer)
  }
  
  /**
   * Update the transcript for a call from the interactive demo
   * This allows the demo voice interface to update the transcript in real-time
   */
  updateDemoTranscript(callId: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      const call = this.calls.get(callId)
      if (!call) {
        console.error(`Call ${callId} not found when updating transcript`);
        resolve(false)
        return
      }
      
      // Append to the existing transcript with line breaks
      let currentTranscript = this.demoTranscript.get(callId) || ""
      currentTranscript += (currentTranscript ? "\n" : "") + text
      
      // Store in our transcript map
      this.demoTranscript.set(callId, currentTranscript)
      
      // Update the call transcript as well
      call.transcript = currentTranscript
      
      // Log the transcript so far (helpful for debugging transcription issues)
      console.log(`Updated transcript for call ${callId}, length: ${currentTranscript.length} chars`);
      
      this.calls.set(callId, call)
      
      resolve(true)
    })
  }

  private generateMockTranscript(scenario: any, language: string): string {
    const transcripts = {
      "job-interview": `AI: Hello! Thank you for coming in today. Can you tell me a bit about yourself?
User: Hi, thank you for having me. I'm a software developer with 5 years of experience in web development.
AI: That's great! What programming languages are you most comfortable with?
User: I primarily work with JavaScript, React, and Node.js. I also have experience with Python and databases.
AI: Excellent. Can you describe a challenging project you've worked on recently?
User: Sure, I recently built a real-time chat application that handles thousands of concurrent users...`,

      "travel-hotel": `AI: Welcome to Grand Hotel! How can I help you today?
User: Hi, I have a reservation under the name Smith.
AI: Let me check that for you. Yes, I see your reservation for a deluxe room for 3 nights.
User: Great! Could you tell me about the hotel amenities?
AI: Of course! We have a fitness center, spa, restaurant, and free WiFi throughout the hotel...`,

      "casual-conversation": `AI: Hey! How's your weekend going?
User: It's been pretty good! I went hiking yesterday and tried a new restaurant.
AI: That sounds fun! Where did you go hiking?
User: I went to the local nature trail. The weather was perfect for it.
AI: Nice! And how was the restaurant? What kind of food did they serve?
User: It was a Thai restaurant. The pad thai was amazing, and the service was excellent...`,
    }

    const scenarioKey = scenario.id || "casual-conversation"
    return transcripts[scenarioKey as keyof typeof transcripts] || transcripts["casual-conversation"]
  }

  private generateMockAnalysis(difficulty: string) {
    const baseScores = {
      Beginner: { min: 60, max: 75 },
      Intermediate: { min: 70, max: 85 },
      Advanced: { min: 80, max: 95 },
    }

    const range = baseScores[difficulty as keyof typeof baseScores] || baseScores["Intermediate"]

    return {
      fluency: this.randomInRange(range.min, range.max),
      confidence: this.randomInRange(range.min, range.max),
      grammar: this.randomInRange(range.min + 5, range.max + 5),
      vocabulary: this.randomInRange(range.min, range.max),
      pronunciation: this.randomInRange(range.min - 5, range.max),
      overallScore: this.randomInRange(range.min, range.max),
    }
  }

  private generateMockSuggestions(difficulty: string): string[] {
    const suggestions = {
      Beginner: [
        "Practice speaking more slowly and clearly",
        "Focus on basic vocabulary expansion",
        "Work on pronunciation of common words",
        "Try to speak in complete sentences",
      ],
      Intermediate: [
        "Work on reducing hesitations and filler words",
        "Practice more complex sentence structures",
        "Expand vocabulary in professional contexts",
        "Focus on natural conversation flow",
      ],
      Advanced: [
        "Refine pronunciation of advanced vocabulary",
        "Practice idiomatic expressions",
        "Work on cultural nuances in communication",
        "Focus on persuasive speaking techniques",
      ],
    }

    const levelSuggestions = suggestions[difficulty as keyof typeof suggestions] || suggestions["Intermediate"]
    return levelSuggestions.slice(0, Math.floor(Math.random() * 3) + 2)
  }

  private generateMockStrengths(): string[] {
    const strengths = [
      "Clear pronunciation",
      "Good grammar structure",
      "Natural conversation flow",
      "Appropriate vocabulary usage",
      "Confident delivery",
      "Good listening skills",
      "Effective communication",
      "Professional tone",
    ]

    return strengths.slice(0, Math.floor(Math.random() * 3) + 2)
  }

  private generateMockWeaknesses(difficulty: string): string[] {
    const weaknesses = {
      Beginner: [
        "Some hesitation in responses",
        "Limited vocabulary range",
        "Occasional grammar errors",
        "Could speak more confidently",
      ],
      Intermediate: [
        "Minor pronunciation issues",
        "Could improve fluency",
        "Some filler words used",
        "Occasional complex grammar errors",
      ],
      Advanced: [
        "Very minor accent issues",
        "Could use more advanced vocabulary",
        "Slight hesitation with complex topics",
        "Minor intonation improvements needed",
      ],
    }

    const levelWeaknesses = weaknesses[difficulty as keyof typeof weaknesses] || weaknesses["Intermediate"]
    return levelWeaknesses.slice(0, Math.floor(Math.random() * 2) + 1)
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Cleanup method
  cleanup() {
    this.callTimers.forEach((timer) => clearInterval(timer))
    this.callTimers.clear()
    this.calls.clear()
  }
}

// Export a singleton instance with the interface type
export const mockCallService: IMockCallService = new MockCallService();
