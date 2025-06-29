/**
 * AI conversation analysis service for mock calls
 */

import { groqAnalyticsAPI } from '@/lib/groq';

interface AnalysisResult {
  fluency: number;
  confidence: number;
  grammar: number;
  vocabulary: number;
  pronunciation: number;
  overallScore: number;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  detailedFeedback?: string;
  improvementAreas?: string[];
  nextSteps?: string[];
}

/**
 * Analyze conversation transcript with AI
 */
export async function analyzeConversationWithAI(
  transcript: string,
  language: string, 
  difficulty: string,
  scenario: any
): Promise<AnalysisResult> {
  try {
    console.log("Analyzing transcript with AI:", transcript.substring(0, 100) + "...");
    
    // If transcript is empty or too short, return basic analysis
    if (!transcript || transcript.length < 20) {
      console.warn("Transcript too short for proper analysis");
      return getFallbackAnalysis(difficulty);
    }
    
    // Try to use Groq API for real AI analysis
    try {
      const scenarioContext = scenario?.context || scenario?.title || "Conversation practice";
      const analysis = await groqAnalyticsAPI.analyzeConversation(
        transcript,
        scenarioContext,
        language,
        difficulty
      );
      
      console.log("AI analysis completed successfully");
      
      return {
        fluency: analysis.fluency,
        confidence: analysis.confidence,
        grammar: analysis.grammar,
        vocabulary: analysis.vocabulary,
        pronunciation: analysis.pronunciation,
        overallScore: analysis.overallScore,
        suggestions: analysis.suggestions,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        detailedFeedback: analysis.detailedFeedback,
        improvementAreas: analysis.improvementAreas,
        nextSteps: analysis.nextSteps,
      };
    } catch (groqError) {
      console.error("Error using Groq for analysis:", groqError);
      
      // If Groq fails, try to use a local OpenAI-compatible endpoint if configured
      const localAIEndpoint = process.env.NEXT_PUBLIC_LOCAL_AI_ENDPOINT;
      if (localAIEndpoint) {
        return await analyzeWithLocalAI(transcript, language, difficulty, scenario);
      } else {
        throw new Error("No fallback AI service available");
      }
    }
  } catch (error) {
    console.error("Analysis failed:", error);
    return getFallbackAnalysis(difficulty);
  }
}

/**
 * Analyze using a local AI endpoint (Ollama, LM Studio, etc.)
 */
async function analyzeWithLocalAI(
  transcript: string,
  language: string,
  difficulty: string,
  scenario: any
): Promise<AnalysisResult> {
  const scenarioContext = scenario?.context || scenario?.title || "Conversation practice";
  const endpoint = process.env.NEXT_PUBLIC_LOCAL_AI_ENDPOINT;
  
  if (!endpoint) {
    throw new Error("Local AI endpoint not configured");
  }
  
  try {
    console.log("Attempting analysis with local AI endpoint");
    
    const prompt = `
You are an expert language tutor analyzing a conversation. Please analyze this ${language} conversation practice session.

Scenario: ${scenarioContext}
User Level: ${difficulty}
Language: ${language}

Transcript:
${transcript}

Provide analysis in valid JSON format with the following structure:
{
  "fluency": 85, // 0-100 score
  "confidence": 75, // 0-100 score
  "grammar": 80, // 0-100 score
  "vocabulary": 70, // 0-100 score
  "pronunciation": 75, // 0-100 score
  "overallScore": 77, // 0-100 score
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}
`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3", // default model name, endpoint may override
        messages: [
          { role: "system", content: "You are an expert language tutor that analyzes conversations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`Local AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    
    // Validate and provide defaults for missing fields
    return {
      fluency: ensureValidScore(result.fluency),
      confidence: ensureValidScore(result.confidence),
      grammar: ensureValidScore(result.grammar),
      vocabulary: ensureValidScore(result.vocabulary),
      pronunciation: ensureValidScore(result.pronunciation),
      overallScore: ensureValidScore(result.overallScore),
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    };
  } catch (error) {
    console.error("Local AI analysis failed:", error);
    throw error;
  }
}

/**
 * Get fallback analysis when AI analysis fails
 */
function getFallbackAnalysis(difficulty: string): AnalysisResult {
  const baseScores = {
    "Beginner": { min: 65, max: 75 },
    "Intermediate": { min: 75, max: 85 },
    "Advanced": { min: 85, max: 95 }
  };
  
  const range = baseScores[difficulty as keyof typeof baseScores] || baseScores["Intermediate"];
  
  return {
    fluency: randomScoreInRange(range.min, range.max),
    confidence: randomScoreInRange(range.min, range.max),
    grammar: randomScoreInRange(range.min, range.max),
    vocabulary: randomScoreInRange(range.min, range.max),
    pronunciation: randomScoreInRange(range.min, range.max),
    overallScore: randomScoreInRange(range.min, range.max),
    suggestions: [
      "Continue practicing regularly to build confidence",
      "Focus on speaking in complete sentences",
      "Try to expand your vocabulary in this topic"
    ],
    strengths: [
      "Good effort in maintaining the conversation",
      "Basic communication skills demonstrated"
    ],
    weaknesses: [
      "Need more practice with this topic",
      "Work on fluency and natural speech patterns"
    ],
    detailedFeedback: "This is a fallback analysis as AI analysis was unavailable. Continue practicing!"
  };
}

/**
 * Generate a random score within a range
 */
function randomScoreInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Ensure score is valid (0-100)
 */
function ensureValidScore(score: any): number {
  const parsedScore = parseInt(score);
  if (isNaN(parsedScore)) return 75;
  return Math.min(100, Math.max(0, parsedScore));
}
