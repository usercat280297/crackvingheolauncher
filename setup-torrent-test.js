#!/usr/bin/env node

/**
 * 🎮 Setup Torrent Test Environment
 * Usage: node setup-torrent-test.js
 */

const fs = require('fs-extra');
const path = require('path');

async function setup() {
  console.log('\n========================================');
  console.log('  TORRENT TEST ENVIRONMENT SETUP');
  console.log('========================================\n');

  const folders = [
    'C:\\Games',
    'C:\\Games\\Torrents',
    'C:\\Games\\Installed',
    'C:\\Games\\Torrents_DB'
  ];

  // Step 1: Create folders
  console.log('[STEP 1] Creating folder structure...');
  for (const folder of folders) {
    try {
      await fs.ensureDir(folder);
      console.log('  [OK] ' + folder);
    } catch (err) {
      console.log('  [ERROR] ' + folder + ': ' + err.message);
    }
  }

  // Step 2: Create games.json
  console.log('\n[STEP 2] Setting up games.json...');
  const gamesJsonPath = 'C:\\Games\\Torrents_DB\\games.json';
  
  try {
    const exists = await fs.pathExists(gamesJsonPath);
    if (exists) {
      console.log('  [OK] games.json already exists');
    } else {
      const template = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        games: []
      };
      await fs.writeJSON(gamesJsonPath, template, { spaces: 2 });
      console.log('  [OK] Created games.json');
    }
  } catch (err) {
    console.log('  [ERROR] ' + err.message);
  }

  // Step 3: Check .env
  console.log('\n[STEP 3] Checking .env configuration...');
  const envPath = path.join(__dirname, '.env');
  
  try {
    const envExists = await fs.pathExists(envPath);
    if (envExists) {
      console.log('  [OK] .env file exists');
      const envContent = await fs.readFile(envPath, 'utf8');
      
      if (!envContent.includes('GAMES_PATH')) {
        console.log('  [WARN] Add to .env: GAMES_PATH=C:\\Games');
      } else {
        console.log('  [OK] GAMES_PATH configured');
      }
      
      if (!envContent.includes('TORRENT_DB_PATH')) {
        console.log('  [WARN] Add to .env: TORRENT_DB_PATH=C:\\Games\\Torrents_DB');
      } else {
        console.log('  [OK] TORRENT_DB_PATH configured');
      }
    } else {
      console.log('  [WARN] .env not found at ' + envPath);
    }
  } catch (err) {
    console.log('  [ERROR] ' + err.message);
  }

  // Step 4: Check torrent file
  console.log('\n[STEP 4] Checking torrent file...');
  const torrentPath = path.join(__dirname, 'torrent file game', 'Need for Speed Heat.torrent');
  
  try {
    const stats = await fs.stat(torrentPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log('  [OK] Found: Need for Speed Heat.torrent (' + sizeMB + ' MB)');
  } catch (err) {
    console.log('  [ERROR] Torrent file not found at ' + torrentPath);
  }

  // Step 5: Check dependencies
  console.log('\n[STEP 5] Checking Node dependencies...');
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  try {
    const pkg = await fs.readJSON(packageJsonPath);
    const requiredDeps = ['webtorrent', 'extract-zip', 'axios'];
    
    for (const dep of requiredDeps) {
      if (pkg.dependencies[dep]) {
        console.log('  [OK] ' + dep + ' installed');
      } else {
        console.log('  [WARN] ' + dep + ' not in package.json');
      }
    }
  } catch (err) {
    console.log('  [ERROR] ' + err.message);
  }

  // Display summary
  console.log('\n========================================');
  console.log('  SETUP COMPLETE');
  console.log('========================================\n');
  
  console.log('Next steps to test torrent download:');
  console.log('');
  console.log('  1. Update .env with:');
  console.log('     GAMES_PATH=C:\\Games');
  console.log('     TORRENT_DB_PATH=C:\\Games\\Torrents_DB');
  console.log('');
  console.log('  2. Start backend:');
  console.log('     npm run dev');
  console.log('');
  console.log('  3. In new terminal, run test:');
  console.log('     node test-torrent-flow.js');
  console.log('');
  console.log('  4. Or follow manual test:');
  console.log('     Read: TEST_END_TO_END.md');
  console.log('');
  console.log('Folder locations:');
  console.log('  Torrents: C:\\Games\\Torrents');
  console.log('  Games DB: C:\\Games\\Torrents_DB\\games.json');
  console.log('  Source:   ' + path.join(__dirname, 'torrent file game'));
  console.log('');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
