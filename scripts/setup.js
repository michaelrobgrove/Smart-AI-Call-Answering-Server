const Database = require("better-sqlite3")
const fs = require("fs")
const path = require("path")
const bcrypt = require("bcryptjs")

async function setupDatabase() {
  console.log("🚀 Setting up AI Phone Agent database...")

  try {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Initialize database
    const db = new Database(path.join(dbDir, "ai-phone-agent.db"))

    // Read and execute SQL scripts
    const createTablesSQL = fs.readFileSync(path.join(process.cwd(), "scripts/01-create-tables.sql"), "utf8")
    const seedDataSQL = fs.readFileSync(path.join(process.cwd(), "scripts/02-seed-data.sql"), "utf8")

    // Execute table creation
    console.log("📊 Creating database tables...")
    db.exec(createTablesSQL)

    // Execute seed data
    console.log("🌱 Seeding initial data...")
    db.exec(seedDataSQL)

    // Create default admin user
    console.log("👤 Creating default admin user...")
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const insertAdmin = db.prepare(`
      INSERT OR REPLACE INTO admin_users (username, email, password_hash, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `)

    insertAdmin.run("admin", "admin@example.com", hashedPassword)

    db.close()

    console.log("✅ Database setup complete!")
    console.log("📝 Default admin credentials:")
    console.log("   Username: admin")
    console.log("   Password: admin123")
    console.log("")
    console.log("🚀 You can now run: npm run dev")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
