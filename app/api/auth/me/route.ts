import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { isDatabaseInitialized } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseInitialized()) {
      return NextResponse.json(
        {
          error: "Database not initialized",
          needsSetup: true,
        },
        { status: 503 },
      )
    }

    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
