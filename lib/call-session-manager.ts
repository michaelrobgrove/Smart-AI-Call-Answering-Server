import { AIPhoneAgent } from "./ai-agent"
import { TelnyxClient } from "./telnyx-client"
import { DatabaseOperations } from "./database"

const db = new DatabaseOperations()

export interface CallSession {
  callControlId: string
  callSessionId: string
  phoneNumber: string
  agent: AIPhoneAgent
  startTime: Date
  transcriptionBuffer: string
  isActive: boolean
  lastActivity: Date
}

export class CallSessionManager {
  private sessions = new Map<string, CallSession>()
  private telnyx = new TelnyxClient()

  // Create a new call session
  async createSession(callControlId: string, callSessionId: string, phoneNumber: string): Promise<CallSession> {
    const agent = new AIPhoneAgent(callSessionId, phoneNumber)

    const session: CallSession = {
      callControlId,
      callSessionId,
      phoneNumber,
      agent,
      startTime: new Date(),
      transcriptionBuffer: "",
      isActive: true,
      lastActivity: new Date(),
    }

    this.sessions.set(callControlId, session)

    // Start transcription
    try {
      await this.telnyx.startTranscription(callControlId)
    } catch (error) {
      console.error("Failed to start transcription:", error)
    }

    return session
  }

  // Get session by call control ID
  getSession(callControlId: string): CallSession | undefined {
    return this.sessions.get(callControlId)
  }

  // Process transcription and generate AI response
  async processTranscription(callControlId: string, transcript: string, isFinal: boolean): Promise<void> {
    const session = this.sessions.get(callControlId)
    if (!session || !session.isActive) {
      return
    }

    session.lastActivity = new Date()

    // Add to transcription buffer
    session.transcriptionBuffer += transcript + " "

    // Only process final transcriptions to avoid partial responses
    if (!isFinal) {
      return
    }

    try {
      // Process the message with AI agent
      const result = await session.agent.processMessage(session.transcriptionBuffer.trim())

      // Speak the AI response
      if (result.response) {
        await this.telnyx.speakText(callControlId, result.response)
      }

      // Handle call completion scenarios
      if (result.callComplete) {
        if (result.spamDetected) {
          // End call for spam
          await this.telnyx.hangupCall(callControlId)
        } else if (result.shouldTransfer) {
          // Transfer to human
          await this.transferToHuman(callControlId)
        } else {
          // Normal call completion
          await this.telnyx.hangupCall(callControlId)
        }

        await this.endSession(callControlId)
      }

      // Clear transcription buffer after processing
      session.transcriptionBuffer = ""
    } catch (error) {
      console.error("Error processing transcription:", error)

      // Fallback response
      await this.telnyx.speakText(
        callControlId,
        "I apologize, but I'm having trouble processing your request. Let me connect you with one of our team members.",
      )

      await this.transferToHuman(callControlId)
      await this.endSession(callControlId)
    }
  }

  // Transfer call to human agent
  private async transferToHuman(callControlId: string): Promise<void> {
    const transferEndpoint = db.getSetting("transfer_sip_endpoint")

    if (!transferEndpoint) {
      console.error("No transfer endpoint configured")
      await this.telnyx.speakText(
        callControlId,
        "I apologize, but I'm unable to transfer your call at this time. Please call back later or leave a voicemail.",
      )
      await this.telnyx.sendToVoicemail(callControlId)
      return
    }

    try {
      await this.telnyx.speakText(callControlId, "Please hold while I transfer your call.")
      await this.telnyx.transferCall(callControlId, transferEndpoint)
    } catch (error) {
      console.error("Failed to transfer call:", error)
      await this.telnyx.speakText(
        callControlId,
        "I'm sorry, but I'm unable to complete the transfer. Let me take a message for you.",
      )
      await this.telnyx.sendToVoicemail(callControlId)
    }
  }

  // Handle call start
  async handleCallStart(callControlId: string, callSessionId: string, phoneNumber: string): Promise<void> {
    try {
      // Answer the call
      await this.telnyx.answerCall(callControlId)

      // Create session
      const session = await this.createSession(callControlId, callSessionId, phoneNumber)

      // Check if business is open
      if (!session.agent.isBusinessOpen()) {
        const afterHoursMessage = session.agent.getAfterHoursMessage()
        await this.telnyx.speakText(callControlId, afterHoursMessage)
        await this.telnyx.sendToVoicemail(callControlId)
        return
      }

      // Start conversation with greeting
      const greeting = "Hello! Thank you for calling. How can I help you today?"
      await this.telnyx.speakText(callControlId, greeting)
    } catch (error) {
      console.error("Error handling call start:", error)
      await this.telnyx.hangupCall(callControlId)
    }
  }

  // Handle call end
  async handleCallEnd(callControlId: string): Promise<void> {
    await this.endSession(callControlId)
  }

  // End a call session
  private async endSession(callControlId: string): Promise<void> {
    const session = this.sessions.get(callControlId)
    if (!session) {
      return
    }

    session.isActive = false

    try {
      // Stop transcription
      await this.telnyx.stopTranscription(callControlId)

      // Save call log to database
      const context = session.agent.getContext()
      const duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000)

      // Create or get contact
      let contact = db.getContactByPhone(session.phoneNumber)
      if (!contact && context.callerName) {
        contact = db.createContact({
          name: context.callerName,
          company: context.callerCompany,
          phone_number: session.phoneNumber,
          is_spam: context.spamDetected,
        })
      }

      // Create call log
      db.createCallLog({
        contact_id: contact?.id,
        call_id: session.callSessionId,
        phone_number: session.phoneNumber,
        direction: "inbound",
        status: context.spamDetected ? "spam" : context.transferRequested ? "transferred" : "answered",
        duration,
        transcript: session.agent.getConversationTranscript(),
        summary: session.agent.getConversationSummary(),
        lead_qualified: context.leadQualified,
        caller_name: context.callerName,
        caller_company: context.callerCompany,
        reason_for_call: context.reasonForCall,
        transferred_to_human: context.transferRequested,
        started_at: session.startTime.toISOString(),
        ended_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error ending session:", error)
    } finally {
      // Remove session from memory
      this.sessions.delete(callControlId)
    }
  }

  // Clean up inactive sessions (run periodically)
  cleanupInactiveSessions(): void {
    const now = new Date()
    const maxInactiveTime = 30 * 60 * 1000 // 30 minutes

    for (const [callControlId, session] of this.sessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > maxInactiveTime) {
        console.log(`Cleaning up inactive session: ${callControlId}`)
        this.endSession(callControlId)
      }
    }
  }

  // Get all active sessions
  getActiveSessions(): CallSession[] {
    return Array.from(this.sessions.values()).filter((session) => session.isActive)
  }
}

// Global session manager instance
export const callSessionManager = new CallSessionManager()

// Clean up inactive sessions every 5 minutes
setInterval(
  () => {
    callSessionManager.cleanupInactiveSessions()
  },
  5 * 60 * 1000,
)
