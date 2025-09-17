import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient } from "@/lib/telnyx-client"
import { verifyToken } from "@/lib/auth"

const telnyx = new TelnyxClient()

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { to, from, connectionId } = await request.json()

    if (!to || !from || !connectionId) {
      return NextResponse.json({ error: "Missing required parameters: to, from, connectionId" }, { status: 400 })
    }

    // Create outbound test call
    const result = await telnyx.createCall(to, from, connectionId)

    return NextResponse.json({
      success: true,
      callControlId: result.data.call_control_id,
      callSessionId: result.data.call_session_id,
    })
  } catch (error: any) {
    console.error("Error creating test call:", error)
    return NextResponse.json({ error: error.message || "Failed to create test call" }, { status: 500 })
  }
}
