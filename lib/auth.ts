import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { DatabaseOperations, isDatabaseInitialized } from "./database"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

function getDbOperations(): DatabaseOperations | null {
  if (!isDatabaseInitialized()) {
    return null
  }
  return new DatabaseOperations()
}

export interface AuthUser {
  id: number
  username: string
  email?: string
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const db = getDbOperations()

  if (!db) {
    throw new Error("Database not initialized")
  }

  const user = db.getAdminUser(username)

  if (!user) {
    return null
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    return null
  }

  // Update last login
  db.updateLastLogin(user.id)

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}

export async function verifyAuth(request: NextRequest): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "No valid authorization header" }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const user = verifyToken(token)

    if (!user) {
      return { success: false, error: "Invalid or expired token" }
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: "Authentication failed" }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Export verifyAuth function for API route authentication
