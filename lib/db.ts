import { DatabaseOperations } from "./database"

// Create and export a singleton database instance
export const db = new DatabaseOperations()

// Export the DatabaseOperations class as well for type usage
export { DatabaseOperations }

export { db as default } from "./database"
