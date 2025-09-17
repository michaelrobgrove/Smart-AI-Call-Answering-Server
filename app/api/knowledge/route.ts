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

    const knowledge = db.getKnowledgeBase()
    return NextResponse.json({ knowledge })
  } catch (error) {
    console.error("Error fetching knowledge base:", error)
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

    const { category, question, answer, is_active = true } = await request.json()

    if (!category || !question || !answer) {
      return NextResponse.json({ error: "Category, question, and answer are required" }, { status: 400 })
    }

    const entry = db.createKnowledgeEntry({
      category,
      question,
      answer,
      is_active,
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Error creating knowledge entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
