import { type NextRequest, NextResponse } from "next/server"
import { DatabaseOperations } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

const db = new DatabaseOperations()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const updates = await request.json()

    // Remove fields that shouldn't be updated directly
    delete updates.id
    delete updates.created_at
    delete updates.updated_at

    db.updateKnowledgeEntry(id, updates)

    const updatedEntry = db.getKnowledgeEntryById(id)
    return NextResponse.json({ entry: updatedEntry })
  } catch (error) {
    console.error("Error updating knowledge entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    db.deleteKnowledgeEntry(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting knowledge entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
