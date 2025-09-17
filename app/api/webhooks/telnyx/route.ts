import { type NextRequest, NextResponse } from "next/server"
import { TelnyxClient, type TelnyxCallEvent, type TelnyxTranscriptionEvent } from "@/lib/telnyx-client"
import { callSessionManager } from "@/lib/call-session-manager"
import { notificationManager } from "@/lib/notification-manager"

const telnyx = new TelnyxClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("telnyx-signature-ed25519") || ""
    const timestamp = request.headers.get("telnyx-timestamp") || ""

    // Validate webhook signature
    if (!telnyx.validateWebhookSignature(body, signature, timestamp)) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log("Received Telnyx webhook:", event.event_type, event.call_control_id)

    // Handle different event types
    switch (event.event_type) {
      case "call.initiated":
        await handleCallInitiated(event)
        break

      case "call.answered":
        await handleCallAnswered(event)
        break

      case "call.hangup":
        await handleCallHangup(event)
        break

      case "call.transcription":
        await handleTranscription(event)
        break

      case "call.speak.ended":
        // AI finished speaking, ready for next input
        break

      case "call.playback.ended":
        // Audio playback finished
        break

      case "call.recording.saved":
        await handleRecordingSaved(event)
        break

      case "call.dtmf.received":
        await handleDTMFReceived(event)
        break

      default:
        console.log("Unhandled event type:", event.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing Telnyx webhook:", error)
    notificationManager.notifySystemError("Telnyx webhook processing failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleCallInitiated(event: TelnyxCallEvent) {
  console.log("Call initiated:", event.call_control_id, "from", event.from)

  // Only handle incoming calls
  if (event.direction === "incoming") {
    notificationManager.notifyIncomingCall(event.from, event.call_control_id)
    await callSessionManager.handleCallStart(event.call_control_id, event.call_session_id, event.from)
  }
}

async function handleCallAnswered(event: TelnyxCallEvent) {
  console.log("Call answered:", event.call_control_id)
  // Call is now active and ready for interaction
}

async function handleCallHangup(event: TelnyxCallEvent) {
  console.log("Call ended:", event.call_control_id)

  const session = callSessionManager.getSession(event.call_control_id)
  if (session) {
    const duration = (Date.now() - session.startTime) / 1000
    let outcome = "completed"

    if (session.spamDetected) {
      outcome = "spam blocked"
    } else if (session.transferRequested) {
      outcome = "transferred"
    } else if (session.leadQualified) {
      outcome = "lead qualified"
    }

    notificationManager.notifyCallEnded(session.phoneNumber, duration, outcome)
  }

  await callSessionManager.handleCallEnd(event.call_control_id)
}

async function handleTranscription(event: TelnyxTranscriptionEvent) {
  console.log("Transcription received:", event.call_control_id, event.transcript)

  if (event.transcript && event.transcript.trim()) {
    await callSessionManager.processTranscription(event.call_control_id, event.transcript, event.is_final)
  }
}

async function handleRecordingSaved(event: any) {
  console.log("Recording saved:", event.call_control_id, event.recording_url)

  // TODO: Save recording URL to database for voicemail messages
  // This would be useful for voicemail functionality
}

async function handleDTMFReceived(event: any) {
  console.log("DTMF received:", event.call_control_id, event.digit)

  // TODO: Handle DTMF input for menu navigation
  // This could be used for phone menu systems
}
