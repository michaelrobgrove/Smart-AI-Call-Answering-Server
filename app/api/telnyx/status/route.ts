import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient } from "@/lib/telnyx-client"
import { callSessionManager } from "@/lib/call-session-manager"
import { verifyToken } from "@/lib/auth"

const telnyx = new TelnyxClient()

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active call sessions
    const activeSessions = callSessionManager.getActiveSessions()

    // Check Telnyx connection status
    let telnyxStatus = "disconnected"
    try {
      // Try to make a simple API call to check connectivity
      await telnyx.getCallInfo("test") // This will fail but tells us if API key works
    } catch (error: any) {
      if (error.message.includes("404")) {
        telnyxStatus = "connected" // 404 means API key works, call just doesn't exist
      } else if (error.message.includes("401")) {
        telnyxStatus = "unauthorized"
      } else {
        telnyxStatus = "error"
      }
    }

    return NextResponse.json({
      telnyx: {
        status: telnyxStatus,
        configured: !!process.env.TELNYX_API_KEY,
      },
      activeCalls: activeSessions.length,
      sessions: activeSessions.map((session) => ({
        callControlId: session.callControlId,
        phoneNumber: session.phoneNumber,
        startTime: session.startTime,
        duration: Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000),
        lastActivity: session.lastActivity,
      })),
    })
  } catch (error) {
    console.error("Error getting Telnyx status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
