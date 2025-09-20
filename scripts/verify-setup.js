const fs = require('fs')
const path = require('path')

function verifySetup() {
  console.log('🔍 Verifying AI Phone Agent setup...\n')
  
  const issues = []
  
  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1))
  if (majorVersion < 18) {
    issues.push(`❌ Node.js version ${nodeVersion} is too old. Please upgrade to Node.js 18+`)
  } else {
    console.log(`✅ Node.js version ${nodeVersion}`)
  }
  
  // Check data directory
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    issues.push('❌ Data directory missing - run "npm run setup" first')
  } else {
    console.log('✅ Data directory exists')
  }
  
  // Check database file with correct path
  const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'database.db')
  if (!fs.existsSync(dbPath)) {
    issues.push('❌ Database file missing - run "npm run setup" first')
  } else {
    console.log('✅ Database file exists')
  }
  
  // Check package.json dependencies
  const packagePath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  
  const requiredDeps = [
    'next', 'react', 'better-sqlite3', 'bcryptjs', 'jsonwebtoken'
  ]
  
  let missingDeps = 0
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      issues.push(`❌ Missing dependency: ${dep}`)
      missingDeps++
    }
  }
  
  if (missingDeps === 0) {
    console.log('✅ All required dependencies present')
  }
  
  // Check node_modules
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    issues.push('❌ Node modules not installed - run "npm install --legacy-peer-deps"')
  } else {
    console.log('✅ Node modules installed')
  }

  // Check critical files exist
  const criticalFiles = [
    'scripts/01-create-tables.sql',
    'scripts/02-seed-data.sql',
    'lib/database.ts',
    'app/api/setup/route.ts'
  ]

  for (const file of criticalFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      issues.push(`❌ Missing critical file: ${file}`)
    }
  }

  if (criticalFiles.every(file => fs.existsSync(path.join(process.cwd(), file)))) {
    console.log('✅ All critical files present')
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  if (issues.length === 0) {
    console.log('🎉 Setup verification passed! You can run "npm run dev"')
    return true
  } else {
    console.log('⚠️  Setup verification failed. Please fix these issues:')
    issues.forEach(issue => console.log(issue))
    console.log('\n📖 See README.md for troubleshooting guide')
    return false
  }
}

// Don't exit process in verify script, just return status
const success = verifySetup()
if (!success) {
  console.log('\n🔧 Quick fixes:')
  console.log('1. Install dependencies: npm install --legacy-peer-deps')  
  console.log('2. Run setup: npm run setup')
  console.log('3. Try again: npm run verify')
}
