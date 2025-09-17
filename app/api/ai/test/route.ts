import { type NextRequest, NextResponse } from "next/server"
import { AIPhoneAgent } from "@/lib/ai-agent"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Create a test AI agent
    const testCallId = `test-${Date.now()}`
    const testPhoneNumber = "+1234567890"
    const agent = new AIPhoneAgent(testCallId, testPhoneNumber)

    // Process the test message
    const result = await agent.processMessage(message)

    return NextResponse.json({
      ...result,
      context: agent.getContext(),
      transcript: agent.getConversationTranscript(),
      summary: agent.getConversationSummary(),
    })
  } catch (error) {
    console.error("Error in AI test:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
