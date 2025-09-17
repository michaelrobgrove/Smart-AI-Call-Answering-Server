import { type NextRequest, NextResponse } from "next/server"
import { DatabaseOperations } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

const db = new DatabaseOperations()

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")
    const phone = searchParams.get("phone")

    let calls = db.getRecentCallLogs(limit)

    // Apply filters
    if (status && status !== "all") {
      calls = calls.filter((call) => call.status === status)
    }

    if (phone) {
      calls = calls.filter((call) => call.phone_number.includes(phone))
    }

    // Get contact information for each call
    const callsWithContacts = calls.map((call) => {
      const contact = call.contact_id ? db.getContactById(call.contact_id) : null
      return {
        ...call,
        contact,
      }
    })

    return NextResponse.json({ calls: callsWithContacts })
  } catch (error) {
    console.error("Error fetching calls:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const callData = await request.json()

    // Create or get contact
    let contact = db.getContactByPhone(callData.phone_number)
    if (!contact && callData.caller_name) {
      contact = db.createContact({
        name: callData.caller_name,
        company: callData.caller_company,
        phone_number: callData.phone_number,
        is_spam: callData.status === "spam",
      })
    }

    // Create call log
    const callLog = db.createCallLog({
      contact_id: contact?.id,
      call_id: callData.call_id,
      phone_number: callData.phone_number,
      direction: callData.direction || "inbound",
      status: callData.status,
      duration: callData.duration || 0,
      transcript: callData.transcript,
      summary: callData.summary,
      lead_qualified: callData.lead_qualified || false,
      caller_name: callData.caller_name,
      caller_company: callData.caller_company,
      reason_for_call: callData.reason_for_call,
      transferred_to_human: callData.transferred_to_human || false,
      started_at: callData.started_at,
      ended_at: callData.ended_at,
    })

    return NextResponse.json({ call: callLog }, { status: 201 })
  } catch (error) {
    console.error("Error creating call log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
