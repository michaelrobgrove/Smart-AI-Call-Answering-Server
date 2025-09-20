// app/api/knowledge/[id]/route.ts

import { NextResponse } from "next/server"
import db from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// This defines the structure of the params object
interface RouteParams {
  id: string
}

// Correct signature for GET handler
export async function GET(request: Request, { params }: { params: RouteParams }) {
  const token = request.headers.get("Authorization")
  if (!verifyAuth(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = Number.parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const item = db.getKnowledge(id)
  if (!item) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  return NextResponse.json(item)
}

// Correct signature for DELETE handler
export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  const token = request.headers.get("Authorization")
  if (!verifyAuth(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = Number.parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  db.deleteKnowledge(id)
  return NextResponse.json({ success: true })
}
