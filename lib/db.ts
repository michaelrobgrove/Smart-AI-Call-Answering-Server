// lib/db.ts

import { getDatabase, DatabaseOperations } from "./database"

// This is the corrected way to get the database instance
const db: DatabaseOperations = getDatabase()

export default db
