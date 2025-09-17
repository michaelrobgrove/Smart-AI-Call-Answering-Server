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

    const contactId = Number.parseInt(params.id)
    if (isNaN(contactId)) {
      return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 })
    }

    const contact = db.getContactById(contactId)
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const calls = db.getCallLogsByContact(contactId)

    return NextResponse.json({
      contact,
      calls,
    })
  } catch (error) {
    console.error("Error fetching contact calls:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
