import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { getDatabase } from "@/lib/database"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const setupData = await request.json()

    // Initialize database
    const db = getDatabase()

    // Create admin user
    const hashedPassword = await hash(setupData.adminPassword, 12)

    db.prepare(`
      INSERT OR REPLACE INTO users (username, password, email, name, role, is_active)
      VALUES (?, ?, ?, ?, 'admin', 1)
    `).run(setupData.adminUsername, hashedPassword, setupData.adminEmail, setupData.adminName)

    // Store company configuration
    const companyConfig = {
      name: setupData.companyName,
      description: setupData.companyDescription,
      businessHours: setupData.businessHours,
      contactPhone: setupData.contactPhone,
      contactEmail: setupData.contactEmail,
    }

    db.prepare(`
      INSERT OR REPLACE INTO system_config (key, value)
      VALUES ('company_info', ?)
    `).run(JSON.stringify(companyConfig))

    // Store AI configuration
    const aiConfig = {
      systemPrompt: setupData.systemPrompt
        .replace(/\{COMPANY_NAME\}/g, setupData.companyName)
        .replace(/\{COMPANY_DESCRIPTION\}/g, setupData.companyDescription)
        .replace(/\{BUSINESS_HOURS\}/g, setupData.businessHours)
        .replace(/\{CONTACT_PHONE\}/g, setupData.contactPhone)
        .replace(/\{CONTACT_EMAIL\}/g, setupData.contactEmail),
      model: setupData.aiModel,
      maxTokens: setupData.maxTokens,
      temperature: setupData.temperature,
    }

    db.prepare(`
      INSERT OR REPLACE INTO system_config (key, value)
      VALUES ('ai_config', ?)
    `).run(JSON.stringify(aiConfig))

    // Store feature configuration
    const featureConfig = {
      enableSpamDetection: setupData.enableSpamDetection,
      enableCallRecording: setupData.enableCallRecording,
      enableTranscription: setupData.enableTranscription,
      enableNotifications: setupData.enableNotifications,
    }

    db.prepare(`
      INSERT OR REPLACE INTO system_config (key, value)
      VALUES ('features', ?)
    `).run(JSON.stringify(featureConfig))

    // Create .env file with API keys
    const envContent = `# AI Phone Agent Configuration
# Generated during setup - DO NOT EDIT MANUALLY

# Database
DATABASE_PATH=./data/database.db

# Authentication
JWT_SECRET=${process.env.JWT_SECRET || generateRandomString(64)}

# Telnyx Configuration
TELNYX_API_KEY=${setupData.telnyxApiKey}
TELNYX_WEBHOOK_SECRET=${setupData.telnyxWebhookSecret || ""}

# OpenAI Configuration
OPENAI_API_KEY=${setupData.openaiApiKey}

# Server Configuration
PORT=${process.env.PORT || 3000}
NODE_ENV=production

# Setup Status
SETUP_COMPLETED=true
`

    // Write .env file
    const envPath = path.join(process.cwd(), ".env")
    fs.writeFileSync(envPath, envContent)

    // Mark setup as completed
    db.prepare(`
      INSERT OR REPLACE INTO system_config (key, value)
      VALUES ('setup_completed', 'true')
    `).run()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Setup failed" }, { status: 500 })
  }
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
