import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = getDatabase()

    // Check if setup is completed
    const setupStatus = db
      .prepare(`
      SELECT value FROM system_config WHERE key = 'setup_completed'
    `)
      .get() as { value: string } | undefined

    const isSetup = setupStatus?.value === "true"

    return NextResponse.json({ isSetup })
  } catch (error) {
    // If database doesn't exist or has errors, setup is not completed
    return NextResponse.json({ isSetup: false })
  }
}
