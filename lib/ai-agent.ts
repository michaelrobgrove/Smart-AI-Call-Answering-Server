import { notificationManager } from "./notification-manager"
import db from "./db"

export interface ConversationContext {
  callId: string
  phoneNumber: string
  callerName?: string
  callerCompany?: string
  reasonForCall?: string
  leadQualified: boolean
  spamDetected: boolean
  transferRequested: boolean
  conversationHistory: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: string
  }>
  extractedInfo: {
    name?: string
    company?: string
    phone?: string
    reason?: string
  }
}

export class AIPhoneAgent {
  private context: ConversationContext
  private knowledgeBase: Array<{ category: string; question: string; answer: string }>
  private systemPrompt: string

  constructor(callId: string, phoneNumber: string) {
    this.context = {
      callId,
      phoneNumber,
      leadQualified: false,
      spamDetected: false,
      transferRequested: false,
      conversationHistory: [],
      extractedInfo: {},
    }

    // Load knowledge base and system settings
    this.knowledgeBase = db.getKnowledgeBase()
    this.systemPrompt = db.getSetting("ai_system_prompt") || this.getDefaultSystemPrompt()
  }

  private getDefaultSystemPrompt(): string {
    return `You are a professional AI phone assistant for a business. Your primary goals are:

1. LEAD QUALIFICATION: Gather the caller's name, company, phone number, and reason for calling
2. ANSWER QUESTIONS: Use the knowledge base to provide helpful information
3. FILTER SPAM: Identify and handle spam/junk calls appropriately
4. TRANSFER CALLS: Route calls to humans when needed

CONVERSATION GUIDELINES:
- Be conversational, helpful, and professional
- Maintain context throughout the call
- Ask follow-up questions to gather complete lead information
- If you can't answer a question, offer to transfer to a human
- For pricing inquiries, always transfer to a human
- Keep responses concise but friendly

SPAM DETECTION:
- Look for robocalls, telemarketing, surveys, or irrelevant calls
- If spam is detected, politely end the call and route to voicemail

LEAD QUALIFICATION CRITERIA:
- Must have: Name, company (if business call), reason for calling
- Should have: Phone number confirmation
- Mark as qualified when you have sufficient information for follow-up

Remember: You represent the business professionally. Always be helpful and courteous.`
  }

  async processMessage(userMessage: string): Promise<{
    response: string
    shouldTransfer: boolean
    callComplete: boolean
    leadQualified: boolean
    spamDetected: boolean
  }> {
    // Add user message to conversation history
    this.context.conversationHistory.push({
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    })

    // Check for spam patterns
    if (this.detectSpam(userMessage)) {
      this.context.spamDetected = true
      const response = "Thank you for calling. I'll direct you to our voicemail system. Have a great day!"

      this.context.conversationHistory.push({
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      })

      notificationManager.notifySpamDetected(
        this.context.phoneNumber,
        "Automated spam patterns detected in conversation",
      )

      return {
        response,
        shouldTransfer: false,
        callComplete: true,
        leadQualified: false,
        spamDetected: true,
      }
    }

    // Extract information from the message
    this.extractInformation(userMessage)

    // Check if this is a transfer request
    if (this.shouldTransferCall(userMessage)) {
      this.context.transferRequested = true
      const response =
        "I'd be happy to connect you with one of our specialists. Please hold while I transfer your call."

      this.context.conversationHistory.push({
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      })

      return {
        response,
        shouldTransfer: true,
        callComplete: true,
        leadQualified: this.context.leadQualified,
        spamDetected: false,
      }
    }

    // Generate AI response
    const response = await this.generateResponse(userMessage)

    // Add AI response to conversation history
    this.context.conversationHistory.push({
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    })

    // Update lead qualification status
    const wasQualified = this.context.leadQualified
    this.updateLeadQualification()

    if (!wasQualified && this.context.leadQualified) {
      const leadScore = this.calculateLeadScore()
      notificationManager.notifyLeadQualified(this.context.phoneNumber, leadScore)
    }

    return {
      response,
      shouldTransfer: false,
      callComplete: false,
      leadQualified: this.context.leadQualified,
      spamDetected: false,
    }
  }

  private detectSpam(message: string): boolean {
    const spamPatterns = [
      /\b(survey|poll|questionnaire)\b/i,
      /\b(telemarketing|marketing|promotion)\b/i,
      /\b(robocall|automated|recording)\b/i,
      /\b(warranty|extended warranty)\b/i,
      /\b(credit card|debt|loan)\b/i,
      /\b(insurance|medicare|health plan)\b/i,
      /\b(solar|energy|utility)\b/i,
      /\b(vacation|timeshare|cruise)\b/i,
      /press \d+ to/i,
      /this is not a sales call/i,
      /do not hang up/i,
      /final notice/i,
    ]

    return spamPatterns.some((pattern) => pattern.test(message))
  }

  private shouldTransferCall(message: string): boolean {
    const transferPatterns = [
      /\b(speak to|talk to|connect me|transfer me)\b.*\b(human|person|representative|agent|manager|someone)\b/i,
      /\b(pricing|price|cost|quote|estimate)\b/i,
      /\b(technical support|tech support|help with)\b/i,
      /\b(complaint|problem|issue|trouble)\b/i,
      /\b(billing|payment|invoice|account)\b/i,
      /\b(cancel|refund|return)\b/i,
    ]

    return transferPatterns.some((pattern) => pattern.test(message)) || this.context.transferRequested
  }

  private extractInformation(message: string): void {
    // Extract name patterns
    const namePatterns = [
      /my name is ([A-Za-z\s]+)/i,
      /this is ([A-Za-z\s]+)/i,
      /I'm ([A-Za-z\s]+)/i,
      /I am ([A-Za-z\s]+)/i,
    ]

    for (const pattern of namePatterns) {
      const match = message.match(pattern)
      if (match && !this.context.extractedInfo.name) {
        this.context.extractedInfo.name = match[1].trim()
        this.context.callerName = match[1].trim()
        break
      }
    }

    // Extract company patterns
    const companyPatterns = [
      /from ([A-Za-z\s&.,]+(?:Inc|LLC|Corp|Company|Co|Ltd))/i,
      /with ([A-Za-z\s&.,]+(?:Inc|LLC|Corp|Company|Co|Ltd))/i,
      /at ([A-Za-z\s&.,]+(?:Inc|LLC|Corp|Company|Co|Ltd))/i,
      /work for ([A-Za-z\s&.,]+)/i,
      /represent ([A-Za-z\s&.,]+)/i,
    ]

    for (const pattern of companyPatterns) {
      const match = message.match(pattern)
      if (match && !this.context.extractedInfo.company) {
        this.context.extractedInfo.company = match[1].trim()
        this.context.callerCompany = match[1].trim()
        break
      }
    }

    // Extract phone number patterns
    const phonePatterns = [/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/, /($$\d{3}$$\s?\d{3}[-.\s]?\d{4})/]

    for (const pattern of phonePatterns) {
      const match = message.match(pattern)
      if (match && !this.context.extractedInfo.phone) {
        this.context.extractedInfo.phone = match[1].trim()
        break
      }
    }

    // Extract reason for calling
    const reasonPatterns = [
      /calling about ([^.!?]+)/i,
      /interested in ([^.!?]+)/i,
      /need help with ([^.!?]+)/i,
      /looking for ([^.!?]+)/i,
      /want to ([^.!?]+)/i,
    ]

    for (const pattern of reasonPatterns) {
      const match = message.match(pattern)
      if (match && !this.context.extractedInfo.reason) {
        this.context.extractedInfo.reason = match[1].trim()
        this.context.reasonForCall = match[1].trim()
        break
      }
    }
  }

  private updateLeadQualification(): void {
    const hasName = !!(this.context.extractedInfo.name || this.context.callerName)
    const hasReason = !!(this.context.extractedInfo.reason || this.context.reasonForCall)
    const hasPhone = !!(this.context.extractedInfo.phone || this.context.phoneNumber)

    // Lead is qualified if we have name, reason, and phone
    this.context.leadQualified = hasName && hasReason && hasPhone
  }

  private async generateResponse(userMessage: string): Promise<string> {
    try {
      // Check if the message matches any knowledge base entries
      const knowledgeResponse = this.searchKnowledgeBase(userMessage)
      if (knowledgeResponse) {
        return this.personalizeResponse(knowledgeResponse)
      }

      // Generate contextual response based on conversation state
      return this.generateContextualResponse(userMessage)
    } catch (error) {
      console.error("Error generating AI response:", error)
      return "I apologize, but I'm having trouble processing your request right now. Let me connect you with one of our team members who can assist you better."
    }
  }

  private searchKnowledgeBase(message: string): string | null {
    const messageLower = message.toLowerCase()

    // Find the best matching knowledge base entry
    let bestMatch: { score: number; answer: string } | null = null

    for (const entry of this.knowledgeBase) {
      const questionLower = entry.question.toLowerCase()
      const score = this.calculateSimilarity(messageLower, questionLower)

      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { score, answer: entry.answer }
      }
    }

    return bestMatch?.answer || null
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)

    let matches = 0
    for (const word1 of words1) {
      if (word1.length > 2 && words2.some((word2) => word2.includes(word1) || word1.includes(word2))) {
        matches++
      }
    }

    return matches / Math.max(words1.length, words2.length)
  }

  private personalizeResponse(response: string): string {
    // Add personalization if we have caller information
    if (this.context.callerName && !response.includes(this.context.callerName)) {
      return `${response} Is there anything else I can help you with today, ${this.context.callerName}?`
    }
    return response
  }

  private generateContextualResponse(userMessage: string): string {
    const hasName = !!(this.context.extractedInfo.name || this.context.callerName)
    const hasCompany = !!(this.context.extractedInfo.company || this.context.callerCompany)
    const hasReason = !!(this.context.extractedInfo.reason || this.context.reasonForCall)

    // If we don't have basic information, ask for it
    if (!hasName) {
      return "Thank you for calling! I'd be happy to help you today. May I start by getting your name?"
    }

    if (!hasReason) {
      return `Thank you, ${this.context.callerName || this.context.extractedInfo.name}. What can I help you with today?`
    }

    if (!hasCompany && this.isBusinessInquiry(userMessage)) {
      return "And what company are you with?"
    }

    // If we have all information, provide a helpful response
    if (this.context.leadQualified) {
      return `Thank you for that information, ${this.context.callerName}. I have all the details I need. Let me connect you with one of our specialists who can help you with ${this.context.reasonForCall}. Please hold for just a moment.`
    }

    // Default helpful response
    return "I understand. Let me see how I can best assist you with that. Can you tell me a bit more about what you're looking for?"
  }

  private isBusinessInquiry(message: string): boolean {
    const businessKeywords = [
      "business",
      "company",
      "service",
      "solution",
      "enterprise",
      "commercial",
      "corporate",
      "organization",
      "firm",
    ]

    return businessKeywords.some((keyword) => message.toLowerCase().includes(keyword))
  }

  getConversationSummary(): string {
    const summary = []

    if (this.context.callerName) {
      summary.push(`Caller: ${this.context.callerName}`)
    }

    if (this.context.callerCompany) {
      summary.push(`Company: ${this.context.callerCompany}`)
    }

    if (this.context.reasonForCall) {
      summary.push(`Reason: ${this.context.reasonForCall}`)
    }

    if (this.context.leadQualified) {
      summary.push("Status: Qualified lead")
    } else if (this.context.spamDetected) {
      summary.push("Status: Spam call blocked")
    } else if (this.context.transferRequested) {
      summary.push("Status: Transferred to human")
    }

    return summary.join(" | ")
  }

  getConversationTranscript(): string {
    return this.context.conversationHistory.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n")
  }

  getContext(): ConversationContext {
    return { ...this.context }
  }

  // Check if business is open
  isBusinessOpen(): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.

    const startHour = Number.parseInt(db.getSetting("business_hours_start") || "9")
    const endHour = Number.parseInt(db.getSetting("business_hours_end") || "18")
    const businessDays = (db.getSetting("business_days") || "monday,tuesday,wednesday,thursday,friday")
      .split(",")
      .map((day) => day.trim().toLowerCase())

    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const currentDayName = dayNames[currentDay]

    const isBusinessDay = businessDays.includes(currentDayName)
    const isBusinessHour = currentHour >= startHour && currentHour < endHour

    return isBusinessDay && isBusinessHour
  }

  // Generate after-hours message
  getAfterHoursMessage(): string {
    const businessHours = db.getSetting("business_hours_start") || "9:00 AM"
    const businessEnd = db.getSetting("business_hours_end") || "6:00 PM"

    return `Thank you for calling! Our office is currently closed. Our business hours are Monday through Friday, ${businessHours} to ${businessEnd}. Please leave a message and we'll get back to you as soon as possible, or you can call back during business hours.`
  }

  private calculateLeadScore(): number {
    let score = 0

    // Base score for having contact info
    if (this.context.extractedInfo.name || this.context.callerName) score += 25
    if (this.context.extractedInfo.company || this.context.callerCompany) score += 25
    if (this.context.extractedInfo.phone || this.context.phoneNumber) score += 20
    if (this.context.extractedInfo.reason || this.context.reasonForCall) score += 30

    return Math.min(score, 100)
  }
}
