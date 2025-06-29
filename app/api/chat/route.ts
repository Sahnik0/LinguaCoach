import { type NextRequest, NextResponse } from "next/server"
import { omnidimensionAPI } from "@/lib/omnidimension"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, language, scenario, userId, sessionId, context } = body

    if (!message || !language || !scenario || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const response = await omnidimensionAPI.sendMessage({
      message,
      language,
      scenario,
      userId,
      sessionId: sessionId || "default",
      context,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
