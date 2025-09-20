const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'database.db');
const envPath = path.join(process.cwd(), '.env');

console.log('🚀 Resetting AI Phone Agent...');

// Delete the database file
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Deleted database file.');
} else {
  console.log(' DB file not found, skipping.');
}

// Delete the .env file
if (fs.existsSync(envPath)) {
  fs.unlinkSync(envPath);
  console.log('🗑️  Deleted .env configuration file.');
} else {
  console.log(' .env file not found, skipping.');
}

console.log('\n✅ System reset complete!');
console.log('🚀 You can now run "npm run dev" to start the setup process again.');
