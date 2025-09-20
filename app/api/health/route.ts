import { NextResponse } from "next/server"
import { getDatabase, isDatabaseInitialized } from "@/lib/database"

export async function GET() {
  try {
    // Check if database is initialized
    const isDbInitialized = isDatabaseInitialized()
    
    if (!isDbInitialized) {
      return NextResponse.json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database not initialized",
        checks: {
          database: "not_initialized"
        }
      }, { status: 503 })
    }

    // Test database connection
    const db = getDatabase()
    const testQuery = db.prepare("SELECT 1 as test").get()
    
    if (!testQuery) {
      throw new Error("Database query failed")
    }

    // Check if setup is completed
    const setupStatus = db.prepare(`
      SELECT value FROM system_config WHERE key = 'setup_completed'
    `).get() as { value: string } | undefined

    const isSetupComplete = setupStatus?.value === 'true'

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      checks: {
        database: "connected",
        setup: isSetupComplete ? "completed" : "pending"
      }
    })
    
  } catch (error) {
    console.error("Health check failed:", error)
    
    return NextResponse.json({
      status: "unhealthy", 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      checks: {
        database: "error"
      }
    }, { status: 503 })
  }
}
