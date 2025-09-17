import { type NextRequest, NextResponse } from "next/server"
import { DatabaseOperations } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

const db = new DatabaseOperations()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const call = db.getCallLogById(id)
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    // Get contact information
    const contact = call.contact_id ? db.getContactById(call.contact_id) : null

    return NextResponse.json({
      call: {
        ...call,
        contact,
      },
    })
  } catch (error) {
    console.error("Error fetching call:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
