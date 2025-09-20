const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(process.cwd(), 'data', 'database.db');
const dbDir = path.dirname(dbPath);

console.log('🚀 Setting up AI Phone Agent database...');
console.log(`📁 Database path: ${dbPath}`);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Function to execute SQL from a file
const executeSQLFile = (filePath) => {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        db.exec(sql);
    } catch (error) {
        console.error(`Error executing SQL file ${path.basename(filePath)}:`, error);
        process.exit(1); // Exit if schema creation fails
    }
};

// 1. Create tables from schema
console.log('📊 Creating database tables...');
executeSQLFile(path.join(process.cwd(), 'scripts', '01-create-tables.sql'));

// 2. Seed initial data (if any)
console.log('🌱 Seeding initial data...');
const seedDataPath = path.join(process.cwd(), 'scripts', '02-seed-data.sql');
if (fs.existsSync(seedDataPath)) {
    executeSQLFile(seedDataPath);
} else {
    console.log(' (No seed data file found, skipping)');
}

// 3. Create a default admin user if one doesn't exist
console.log('👤 Admin user will be created via the web setup page.');

db.close();
console.log('\n✅ Database setup complete!');
console.log('📝 Default admin credentials:');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('   Email: admin@example.com');
console.log('\n🚀 You can now run: npm run dev');


