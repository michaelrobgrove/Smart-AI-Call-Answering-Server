import { NextResponse } from "next/server"
import { writeFileSync, existsSync } from "fs"
import { join } from "path"
import { initializeDatabase, getDbOperations } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const setupData = await request.json()

    // 1. Initialize the database (creates tables if they don't exist)
    if (!initializeDatabase()) {
      throw new Error("Database initialization failed. Check server logs.")
    }

    const db = getDbOperations()

    // 2. Create the .env file with API keys and app secret
    const envPath = join(process.cwd(), ".env")
    const appSecret = crypto.randomUUID()
    const envContent = `
# System
APP_SECRET="${appSecret}"
DATABASE_PATH="${process.env.DATABASE_PATH || join(process.cwd(), "data", "database.db")}"

# Telnyx API
TELNYX_API_KEY="${setupData.telnyxApiKey}"
TELNYX_WEBHOOK_SECRET="${setupData.telnyxWebhookSecret}"

# AI Provider
AI_PROVIDER="${setupData.aiProvider}"
AI_MODEL="${setupData.aiModel}"
GEMINI_API_KEY="${setupData.geminiApiKey}" # Handles both Gemini and OpenAI
OPENAI_API_KEY="${setupData.geminiApiKey}" # Handles both Gemini and OpenAI

# Setup Complete Flag
SETUP_COMPLETED="true"
`
    writeFileSync(envPath, envContent.trim())

    // 3. Hash the admin password
    const passwordHash = await bcrypt.hash(setupData.adminPassword, 10)

    // 4. Save the admin user to the database
    db.createAdminUser({
      full_name: setupData.adminName,
      username: setupData.adminUsername,
      password_hash: passwordHash,
      email: setupData.adminEmail,
    })

    // 5. Save all other settings to the system_settings table
    db.setSetting("company_name", setupData.companyName)
    db.setSetting("company_description", setupData.companyDescription)
    db.setSetting("contact_phone", setupData.contactPhone)
    db.setSetting("contact_email", setupData.contactEmail)
    db.setSetting("business_hours", setupData.businessHours)
    db.setSetting("ai_system_prompt", setupData.systemPrompt)
    db.setSetting("ai_max_tokens", setupData.maxTokens.toString())
    db.setSetting("ai_temperature", setupData.temperature.toString())
    db.setSetting("feature_spam_detection", setupData.enableSpamDetection ? "true" : "false")
    db.setSetting("feature_call_recording", setupData.enableCallRecording ? "true" : "false")
    db.setSetting("feature_transcription", setupData.enableTranscription ? "true" : "false")
    db.setSetting("feature_notifications", setupData.enableNotifications ? "true" : "false")

    console.log("✅ Setup successful: .env file created and all settings saved to database.")

    return NextResponse.json({ success: true, message: "Setup completed successfully." })
  } catch (error) {
    console.error("❌ SETUP FAILED:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

