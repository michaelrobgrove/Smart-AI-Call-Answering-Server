import { type NextRequest, NextResponse } from "next/server"
import { AIPhoneAgent } from "@/lib/ai-agent"
import { DatabaseOperations } from "@/lib/database"

const db = new DatabaseOperations()

// Store active conversations in memory (in production, use Redis or similar)
const activeConversations = new Map<string, AIPhoneAgent>()

export async function POST(request: NextRequest) {
  try {
    const { callId, phoneNumber, message, action } = await request.json()

    if (!callId || !phoneNumber) {
      return NextResponse.json({ error: "Call ID and phone number are required" }, { status: 400 })
    }

    // Get or create AI agent for this conversation
    let agent = activeConversations.get(callId)
    if (!agent) {
      agent = new AIPhoneAgent(callId, phoneNumber)
      activeConversations.set(callId, agent)
    }

    // Handle different actions
    if (action === "start") {
      // Check if business is open
      if (!agent.isBusinessOpen()) {
        const afterHoursMessage = agent.getAfterHoursMessage()
        return NextResponse.json({
          response: afterHoursMessage,
          shouldTransfer: false,
          callComplete: true,
          leadQualified: false,
          spamDetected: false,
          routeToVoicemail: true,
        })
      }

      // Start conversation
      const greeting = "Hello! Thank you for calling. How can I help you today?"
      return NextResponse.json({
        response: greeting,
        shouldTransfer: false,
        callComplete: false,
        leadQualified: false,
        spamDetected: false,
      })
    }

    if (action === "message" && message) {
      // Process the message
      const result = await agent.processMessage(message)

      // If call is complete, save to database
      if (result.callComplete) {
        const context = agent.getContext()

        // Create or get contact
        let contact = db.getContactByPhone(phoneNumber)
        if (!contact && context.callerName) {
          contact = db.createContact({
            name: context.callerName,
            company: context.callerCompany,
            phone_number: phoneNumber,
            is_spam: result.spamDetected,
          })
        }

        // Create call log
        db.createCallLog({
          contact_id: contact?.id,
          call_id: callId,
          phone_number: phoneNumber,
          direction: "inbound",
          status: result.spamDetected ? "spam" : result.shouldTransfer ? "transferred" : "answered",
          duration: 0, // Will be updated by telephony system
          transcript: agent.getConversationTranscript(),
          summary: agent.getConversationSummary(),
          lead_qualified: result.leadQualified,
          caller_name: context.callerName,
          caller_company: context.callerCompany,
          reason_for_call: context.reasonForCall,
          transferred_to_human: result.shouldTransfer,
          started_at: new Date().toISOString(),
        })

        // Clean up conversation from memory
        activeConversations.delete(callId)
      }

      return NextResponse.json(result)
    }

    if (action === "end") {
      // Clean up conversation
      activeConversations.delete(callId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in AI chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
