#!/usr/bin/env node

/**
 * ============================================
 * DENUVO SYSTEM VERIFICATION SCRIPT
 * Verify all components are properly installed
 * ============================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, name) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? colors.green : colors.red;
  log(`  ${status} ${name}`, color);
  return exists;
}

function checkEnvVar(varName, description) {
  const exists = process.env[varName];
  const status = exists ? '✅' : '❌';
  const color = exists ? colors.green : colors.red;
  const value = exists ? `(${exists.substring(0, 10)}...)` : '(missing)';
  log(`  ${status} ${description} ${value}`, color);
  return exists;
}

async function verifyServices() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('DENUVO SYSTEM VERIFICATION', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  // Check 1: Files exist
  log('📁 File Structure Check', colors.blue);
  let filesOk = true;
  filesOk &= checkFile('services/DenuvoDetectionService.js', 'DenuvoDetectionService');
  filesOk &= checkFile('services/EnhancedSteamGridDBService.js', 'EnhancedSteamGridDBService');
  filesOk &= checkFile('routes/denuvo.js', 'Denuvo Routes');
  filesOk &= checkFile('components/EnhancedCarousel.jsx', 'EnhancedCarousel Component');
  filesOk &= checkFile('components/DenuvoIndicator.jsx', 'DenuvoIndicator Component');

  // Check 2: Environment variables
  log('\n🔐 Environment Variables Check', colors.blue);
  let envOk = true;
  envOk &= checkEnvVar('STEAMGRIDDB_API_KEY', 'SteamGridDB API Key');

  // Optional
  checkEnvVar('STEAM_API_KEY', 'Steam API Key (optional)');
  checkEnvVar('MONGODB_URI', 'MongoDB URI (optional)');

  // Check 3: Dependencies
  log('\n📦 Dependencies Check', colors.blue);
  let depsOk = true;
  
  try {
    require('axios');
    log('  ✅ axios', colors.green);
  } catch (e) {
    log('  ❌ axios (missing)', colors.red);
    depsOk = false;
  }

  try {
    require('dotenv');
    log('  ✅ dotenv', colors.green);
  } catch (e) {
    log('  ❌ dotenv (missing)', colors.red);
    depsOk = false;
  }

  try {
    require('express');
    log('  ✅ express', colors.green);
  } catch (e) {
    log('  ❌ express (missing)', colors.red);
    depsOk = false;
  }

  // Check 4: Server configuration
  log('\n⚙️  Server Configuration Check', colors.blue);
  const serverFile = fs.readFileSync('server.js', 'utf8');
  
  const hasDenuvoImport = serverFile.includes("require('./routes/denuvo')");
  const hasDenuvoRoute = serverFile.includes("app.use('/api/denuvo'");
  
  log(`  ${hasDenuvoImport ? '✅' : '❌'} Denuvo route imported in server.js`, 
    hasDenuvoImport ? colors.green : colors.red);
  log(`  ${hasDenuvoRoute ? '✅' : '❌'} Denuvo route registered in server.js`, 
    hasDenuvoRoute ? colors.green : colors.red);

  // Check 5: Cache files
  log('\n💾 Cache Files Check', colors.blue);
  const hasDenuvoCache = fs.existsSync('denuvo_cache.json');
  const hasSteamGridDBCache = fs.existsSync('steamgriddb_cache.json');
  
  log(`  ${hasDenuvoCache ? '✅' : '⏳'} denuvo_cache.json ${hasDenuvoCache ? '(found)' : '(will be created on first run)'}`,
    hasDenuvoCache ? colors.green : colors.yellow);
  log(`  ${hasSteamGridDBCache ? '✅' : '⏳'} steamgriddb_cache.json ${hasSteamGridDBCache ? '(found)' : '(will be created on first run)'}`,
    hasSteamGridDBCache ? colors.green : colors.yellow);

  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('VERIFICATION SUMMARY', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  const issues = [];
  
  if (!filesOk) issues.push('❌ Some files are missing');
  if (!envOk && process.env.STEAMGRIDDB_API_KEY) issues.push('❌ Missing environment variables');
  if (!depsOk) issues.push('❌ Some dependencies are not installed');
  if (!hasDenuvoImport || !hasDenuvoRoute) issues.push('❌ Server not configured for denuvo routes');

  if (issues.length === 0) {
    log('✅ All checks passed! System is ready for testing.', colors.green);
    
    log('\n📋 Next Steps:', colors.blue);
    log('1. Start the server: npm start', colors.reset);
    log('2. Run tests: node test-denuvo.js', colors.reset);
    log('3. Test API endpoint: curl http://localhost:3000/api/denuvo/check/2358720', colors.reset);
    
  } else {
    log('⚠️  Issues found:', colors.yellow);
    issues.forEach(issue => log(`   ${issue}`, colors.red));
    
    log('\n🔧 To fix:', colors.blue);
    if (!envOk && !process.env.STEAMGRIDDB_API_KEY) {
      log('1. Get STEAMGRIDDB_API_KEY from: https://www.steamgriddb.com/profile/preferences/api', colors.yellow);
      log('2. Add to .env: STEAMGRIDDB_API_KEY=your_key_here', colors.yellow);
    }
    if (!depsOk) {
      log('1. Install dependencies: npm install', colors.yellow);
    }
  }

  log('\n');

  return issues.length === 0;
}

async function testServices() {
  log('🧪 Quick Service Test', colors.blue);
  
  try {
    const DenuvoService = require('./services/DenuvoDetectionService');
    
    // Test Black Myth: Wukong (known denuvo game)
    const status = await DenuvoService.getFullDenuvoStatus(2358720);
    
    if (status.hasDenuvo) {
      log('✅ Denuvo Detection Service working!', colors.green);
      log(`   Black Myth Wukong detected as: ${status.hasDenuvo ? 'DENUVO' : 'NO DENUVO'}`, colors.reset);
    } else {
      log('⚠️  Warning: Black Myth Wukong should be detected as denuvo', colors.yellow);
    }

  } catch (error) {
    log(`❌ Service test failed: ${error.message}`, colors.red);
  }
}

// Main execution
async function main() {
  const systemOk = await verifyServices();
  
  if (systemOk) {
    log('\n⏳ Testing services...\n', colors.cyan);
    await testServices();
  }

  process.exit(systemOk ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`\nFatal error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { verifyServices, testServices };
