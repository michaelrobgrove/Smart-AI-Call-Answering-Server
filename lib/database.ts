import Database from "better-sqlite3"
import { readFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"

// Database connection singleton
let dbInstance: Database.Database | null = null
let dbOperations: DatabaseOperations | null = null;


// Use consistent database path from environment or default
const dbPath = process.env.DATABASE_PATH || join(process.cwd(), "data", "database.db")

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbDir = dirname(dbPath)

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    console.log(`Database path: ${dbPath}`) // Debug log

    dbInstance = new Database(dbPath)
    dbInstance.pragma("journal_mode = WAL")
    dbInstance.pragma("foreign_keys = ON")
  }
  return dbInstance
}

// Check if database is initialized
export function isDatabaseInitialized(): boolean {
  try {
    const database = getDatabase()
    const result = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users'").get()
    return !!result
  } catch (error) {
    console.error("Database initialization check failed:", error)
    return false
  }
}

// Initialize database with schema
export function initializeDatabase() {
  const database = getDatabase()

  // Prevent re-initialization
  if (isDatabaseInitialized()) {
    console.log("Database is already initialized.")
    return true
  }

  try {
    const createTablesPath = join(process.cwd(), "scripts", "01-create-tables.sql")
    if (!existsSync(createTablesPath)) {
      console.error("SQL schema file not found. Please ensure 'scripts/01-create-tables.sql' exists.")
      return false
    }
    const createTablesSQL = readFileSync(createTablesPath, "utf8")
    database.exec(createTablesSQL)

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

// Database models and types
export interface Contact {
  id: number
  name?: string
  company?: string
  phone_number: string
  email?: string
  is_spam: boolean
  created_at: string
  updated_at: string
}

export interface CallLog {
  id: number
  contact_id?: number
  call_id: string
  phone_number: string
  direction: "inbound" | "outbound"
  status: "answered" | "missed" | "transferred" | "spam" | "voicemail" | "in-progress"
  duration: number
  transcript?: string
  summary?: string
  lead_qualified: boolean
  caller_name?: string
  caller_company?: string
  reason_for_call?: string
  transferred_to_human: boolean
  started_at: string
  ended_at?: string
  created_at: string
}

export interface KnowledgeBase {
  id: number
  category: string
  question: string
  answer: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  id: number
  setting_key: string
  setting_value: string
  description?: string
  updated_at: string
}

export interface AdminUser {
  id: number
  full_name: string;
  username: string
  password_hash: string
  email?: string
  is_active: boolean
  last_login?: string
  created_at: string
}

// Database operations
export class DatabaseOperations {
  private db: Database.Database

  constructor() {
    this.db = getDatabase()
  }

  // Contact operations
  createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Contact {
    const stmt = this.db.prepare(`
      INSERT INTO contacts (name, company, phone_number, email, is_spam)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(contact.name, contact.company, contact.phone_number, contact.email, contact.is_spam ? 1 : 0)
    return this.getContactById(result.lastInsertRowid as number)!
  }

  getContactById(id: number): Contact | null {
    const stmt = this.db.prepare("SELECT * FROM contacts WHERE id = ?")
    return stmt.get(id) as Contact | null
  }

  getContactByPhone(phone: string): Contact | null {
    const stmt = this.db.prepare("SELECT * FROM contacts WHERE phone_number = ?")
    return stmt.get(phone) as Contact | null
  }

    updateContact(id: number, updates: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    if (fields.length === 0) return;

    const stmt = this.db.prepare(`UPDATE contacts SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values, id);
  }


  // Call log operations
  createCallLog(callLog: Omit<CallLog, "id" | "created_at">): CallLog {
    const stmt = this.db.prepare(`
      INSERT INTO call_logs (
        contact_id, call_id, phone_number, direction, status, duration,
        transcript, summary, lead_qualified, caller_name, caller_company,
        reason_for_call, transferred_to_human, started_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      callLog.contact_id,
      callLog.call_id,
      callLog.phone_number,
      callLog.direction,
      callLog.status,
      callLog.duration,
      callLog.transcript,
      callLog.summary,
      callLog.lead_qualified ? 1: 0,
      callLog.caller_name,
      callLog.caller_company,
      callLog.reason_for_call,
      callLog.transferred_to_human ? 1 : 0,
      callLog.started_at,
      callLog.ended_at,
    )

    return this.getCallLogById(result.lastInsertRowid as number)!
  }

    updateCallLog(id: number, updates: Partial<Omit<CallLog, 'id' | 'created_at' | 'call_id'>>): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    if (fields.length === 0) return;

    const stmt = this.db.prepare(`UPDATE call_logs SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
  }

  getCallLogById(id: number): CallLog | null {
    const stmt = this.db.prepare("SELECT * FROM call_logs WHERE id = ?")
    return stmt.get(id) as CallLog | null
  }

  getCallLogByTelnyxId(callId: string): CallLog | null {
      const stmt = this.db.prepare("SELECT * FROM call_logs WHERE call_id = ?");
      return stmt.get(callId) as CallLog | null;
  }


  getCallLogs(filters: { status?: string, phone?: string, limit?: number }): CallLog[] {
    let query = "SELECT * FROM call_logs";
    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
        conditions.push("status = ?");
        params.push(filters.status);
    }
    if (filters.phone) {
        conditions.push("phone_number LIKE ?");
        params.push(`%${filters.phone}%`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY started_at DESC";

    if (filters.limit) {
        query += " LIMIT ?";
        params.push(filters.limit);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as CallLog[];
}


  // Knowledge base operations
  getKnowledgeBase(): KnowledgeBase[] {
    const stmt = this.db.prepare("SELECT * FROM knowledge_base ORDER BY id DESC")
    return stmt.all() as KnowledgeBase[]
  }

  getKnowledge(id: number) {
    return this.db.prepare("SELECT * FROM knowledge_base WHERE id = ?").get(id)
  }

  addKnowledge(question: string, answer: string): KnowledgeBase {
    const stmt = this.db.prepare(`
      INSERT INTO knowledge_base (question, answer, is_active, category)
      VALUES (?, ?, 1, 'General')
    `)
    const result = stmt.run(question, answer)
    return this.getKnowledge(result.lastInsertRowid as number)!
  }

  deleteKnowledge(id: number): void {
    const stmt = this.db.prepare("DELETE FROM knowledge_base WHERE id = ?")
    stmt.run(id)
  }

  // System settings operations
  getSetting(key: string): string | null {
    const stmt = this.db.prepare("SELECT setting_value FROM system_settings WHERE setting_key = ?")
    const result = stmt.get(key) as { setting_value: string } | null
    return result?.setting_value || null
  }

  setSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
    `)
    stmt.run(key, value)
  }

  getAllSettings(): SystemSetting[] {
    const stmt = this.db.prepare("SELECT * FROM system_settings ORDER BY setting_key")
    return stmt.all() as SystemSetting[]
  }

  // Admin user operations
  createAdminUser(user: Omit<AdminUser, 'id' | 'is_active' | 'last_login' | 'created_at'>) {
    const stmt = this.db.prepare(
      "INSERT INTO admin_users (full_name, username, password_hash, email) VALUES (?, ?, ?, ?)"
    );
    return stmt.run(user.full_name, user.username, user.password_hash, user.email);
  }

  getAdminUser(username: string): AdminUser | null {
    const stmt = this.db.prepare("SELECT * FROM admin_users WHERE username = ? AND is_active = 1")
    return stmt.get(username) as AdminUser | null
  }

  updateLastLogin(userId: number): void {
    const stmt = this.db.prepare("UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")
    stmt.run(userId)
  }
}

export function getDbOperations(): DatabaseOperations {
  if (!dbOperations) {
    dbOperations = new DatabaseOperations();
  }
  return dbOperations;
}
