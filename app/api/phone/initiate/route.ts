import { type NextRequest, NextResponse } from "next/server"
import { omnidimensionAPI } from "@/lib/omnidimension"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneNumber, scenario, language, userId } = body

    if (!phoneNumber || !scenario || !language || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const response = await omnidimensionAPI.initiatePhoneCall(phoneNumber, scenario, language)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Phone initiation API error:", error)
    return NextResponse.json({ error: "Failed to initiate phone call" }, { status: 500 })
  }
}
