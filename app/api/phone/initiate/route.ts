import { type NextRequest, NextResponse } from "next/server"
import { omnidimensionAPI } from "@/lib/omnidimension"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneNumber, scenario, language, userId } = body

    if (!phoneNumber || !scenario || !language || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate phone number format (must include country code)
    const phoneRegex = /^\+\d{1,3}\d{10,}$/
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '')
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ 
        error: "Invalid phone number format. Phone number must include country code (e.g., +15551234567)" 
      }, { status: 400 })
    }

    console.log(`API route: Initiating call to validated phone number: ${cleanPhone}`)
    
    const response = await omnidimensionAPI.initiateCall({
      phoneNumber: cleanPhone, // Use clean formatted number
      scenario,
      language,
      userId,
      difficulty: body.difficulty ?? "beginner",
      sessionId: body.sessionId ?? `session_${Date.now()}`
    })
    
    console.log(`API route: Call initiated successfully with response:`, JSON.stringify(response))

    return NextResponse.json(response)
  } catch (error) {
    console.error("Phone initiation API error:", error)
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Failed to initiate phone call"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
