import { DatabaseOperations } from "./database"

const db = new DatabaseOperations()

export interface TelnyxCallEvent {
  event_type: string
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  from: string
  to: string
  direction: "incoming" | "outgoing"
  state: string
  created_at: string
}

export interface TelnyxTranscriptionEvent {
  event_type: string
  call_control_id: string
  transcript: string
  confidence: number
  is_final: boolean
  created_at: string
}

export class TelnyxClient {
  private apiKey: string
  private baseUrl = "https://api.telnyx.com/v2"

  constructor() {
    this.apiKey = process.env.TELNYX_API_KEY || ""
    if (!this.apiKey) {
      console.warn("TELNYX_API_KEY not found in environment variables")
    }
  }

  private async makeRequest(endpoint: string, method = "GET", body?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Telnyx API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  // Answer an incoming call
  async answerCall(callControlId: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/answer`, "POST")
  }

  // Hang up a call
  async hangupCall(callControlId: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/hangup`, "POST")
  }

  // Start transcription for a call
  async startTranscription(callControlId: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/transcription_start`, "POST", {
      transcription_engine: "A",
      transcription_language: "en",
      transcription_tracks: "inbound_track",
    })
  }

  // Stop transcription for a call
  async stopTranscription(callControlId: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/transcription_stop`, "POST")
  }

  // Speak text using text-to-speech
  async speakText(callControlId: string, text: string, voice = "female"): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/speak`, "POST", {
      payload: text,
      voice,
      language: "en-US",
    })
  }

  // Transfer call to another number
  async transferCall(callControlId: string, to: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/transfer`, "POST", {
      to,
    })
  }

  // Bridge call to another call leg
  async bridgeCall(callControlId: string, otherCallControlId: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/bridge`, "POST", {
      call_control_id: otherCallControlId,
    })
  }

  // Play audio file
  async playAudio(callControlId: string, audioUrl: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/playback_start`, "POST", {
      audio_url: audioUrl,
    })
  }

  // Stop audio playback
  async stopAudio(callControlId: string): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/playback_stop`, "POST")
  }

  // Gather DTMF input
  async gatherInput(
    callControlId: string,
    options: {
      minimum_digits?: number
      maximum_digits?: number
      timeout_millis?: number
      terminating_digit?: string
    } = {},
  ): Promise<void> {
    await this.makeRequest(`/calls/${callControlId}/actions/gather_using_speak`, "POST", {
      payload: "Please enter your selection followed by the pound key.",
      voice: "female",
      language: "en-US",
      minimum_digits: options.minimum_digits || 1,
      maximum_digits: options.maximum_digits || 10,
      timeout_millis: options.timeout_millis || 10000,
      terminating_digit: options.terminating_digit || "#",
    })
  }

  // Send call to voicemail
  async sendToVoicemail(callControlId: string): Promise<void> {
    const voicemailMessage = db.getSetting("voicemail_message") || this.getDefaultVoicemailMessage()

    await this.speakText(callControlId, voicemailMessage)

    // Start recording for voicemail
    await this.makeRequest(`/calls/${callControlId}/actions/record_start`, "POST", {
      format: "mp3",
      channels: "single",
      play_beep: true,
    })
  }

  private getDefaultVoicemailMessage(): string {
    return "Thank you for calling. Please leave a detailed message after the beep, and we'll get back to you as soon as possible."
  }

  // Get call information
  async getCallInfo(callControlId: string): Promise<any> {
    return this.makeRequest(`/calls/${callControlId}`)
  }

  // Create outbound call
  async createCall(to: string, from: string, connectionId: string): Promise<any> {
    return this.makeRequest("/calls", "POST", {
      to,
      from,
      connection_id: connectionId,
    })
  }

  // Validate webhook signature
  validateWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    if (!process.env.TELNYX_WEBHOOK_SECRET) {
      console.warn("TELNYX_WEBHOOK_SECRET not configured")
      return true // Skip validation if secret not configured
    }

    try {
      const crypto = require("crypto")
      const expectedSignature = crypto
        .createHmac("sha256", process.env.TELNYX_WEBHOOK_SECRET)
        .update(timestamp + payload)
        .digest("hex")

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    } catch (error) {
      console.error("Error validating webhook signature:", error)
      return false
    }
  }
}
