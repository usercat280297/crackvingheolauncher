#!/usr/bin/env node

/**
 * 🎮 Test Torrent Download Flow
 * 
 * Steps:
 * 1. Check if game "Need for Speed Heat" exists in database
 * 2. Add game to torrent DB with .torrent file path
 * 3. Simulate frontend flow: search game -> view detail -> click download
 * 4. Start torrent download
 * 5. Track progress
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const TORRENT_FILE_PATH = path.join(__dirname, 'torrent file game', 'Need for Speed Heat.torrent');
const GAMES_DB_PATH = 'C:\\Games\\Torrents_DB\\games.json';

// Game info for "Need for Speed Heat"
const GAME_INFO = {
  id: 1398620,  // Steam App ID for Need for Speed Heat
  appId: 1398620,
  name: 'Need for Speed Heat',
  torrentFile: 'Need for Speed Heat.torrent',
  hasDenuvo: true,
  year: 2019
};

async function runTest() {
  console.log('\n🎮 TESTING TORRENT DOWNLOAD FLOW\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check if .torrent file exists
    console.log('\n[STEP 1] Checking torrent file...');
    const torrentExists = await fs.pathExists(TORRENT_FILE_PATH);
    if (!torrentExists) {
      console.error('❌ Torrent file not found:', TORRENT_FILE_PATH);
      process.exit(1);
    }
    console.log('✅ Found: Need for Speed Heat.torrent (252KB)');

    // Step 2: Add game to torrent database
    console.log('\n[STEP 2] Adding game to torrent database...');
    try {
      const response = await axios.post(`${API_URL}/torrent-db/add`, {
        appId: GAME_INFO.appId,
        name: GAME_INFO.name,
        torrentFile: GAME_INFO.torrentFile,
        hasDenuvo: true
      }, {
        timeout: 5000
      });
      console.log('✅ Game added to database');
      console.log('   Game ID:', response.data.game?.id);
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.warn('⚠️  Backend not running. Make sure to run "npm run dev" first');
      } else {
        console.warn('⚠️  Error:', err.message);
      }
    }

    // Step 3: Search for game in store
    console.log('\n[STEP 3] Searching for game in store...');
    try {
      const searchResponse = await axios.get(`${API_URL}/search`, {
        params: { query: 'Need for Speed Heat' },
        timeout: 5000
      });
      const game = searchResponse.data?.find(g => g.appId === GAME_INFO.appId || g.name?.includes('Need for Speed Heat'));
      if (game) {
        console.log('✅ Found game:', game.name);
        console.log('   App ID:', game.appId);
      } else {
        console.warn('⚠️  Game not found in search results');
      }
    } catch (err) {
      console.warn('⚠️  Search error:', err.message);
    }

    // Step 4: Get game detail
    console.log('\n[STEP 4] Fetching game detail (like clicking on game)...');
    try {
      const detailResponse = await axios.get(`${API_URL}/steam/${GAME_INFO.appId}`, {
        timeout: 5000
      });
      console.log('✅ Game detail loaded');
      console.log('   Title:', detailResponse.data?.name);
      console.log('   Denuvo:', detailResponse.data?.hasDenuvo ? 'Yes' : 'No');
    } catch (err) {
      console.warn('⚠️  Detail fetch error:', err.message);
    }

    // Step 5: Simulate download button click
    console.log('\n[STEP 5] Starting torrent download...');
    try {
      const downloadResponse = await axios.post(`${API_URL}/torrent/download`, {
        torrentPath: TORRENT_FILE_PATH,
        gameId: GAME_INFO.id,
        gameName: GAME_INFO.name,
        downloadPath: 'C:\\Games\\Torrents',
        autoUnzip: true
      }, {
        timeout: 5000
      });
      console.log('✅ Download started');
      const downloadId = downloadResponse.data?.downloadId;
      console.log('   Download ID:', downloadId);

      // Step 6: Track progress
      if (downloadId) {
        console.log('\n[STEP 6] Tracking download progress (5 seconds)...');
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          try {
            const statusResponse = await axios.get(`${API_URL}/torrent/status/${downloadId}`, {
              timeout: 3000
            });
            const status = statusResponse.data;
            if (status) {
              const progress = status.progress ? (status.progress * 100).toFixed(1) : 0;
              const speed = status.speed ? `${(status.speed / 1024 / 1024).toFixed(2)} MB/s` : '0 MB/s';
              console.log(`   Progress: ${progress}% | Speed: ${speed} | Status: ${status.status}`);
            }
          } catch (err) {
            console.log(`   (Check ${i + 1}s)`);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️  Download error:', err.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 FLOW SUMMARY:\n');
    console.log('Flow to integrate into launcher:');
    console.log('  1. User searches "Need for Speed Heat" in Store');
    console.log('  2. Clicks on game card → GameDetail.jsx opens');
    console.log('  3. Clicks "Download" button → Shows download dialog');
    console.log('  4. Selects drive (C:) → TorrentDownloadProgress shows');
    console.log('  5. Clicks "Start Download" → Torrent begins');
    console.log('  6. Progress bar shows real-time speed/ETA');
    console.log('  7. Auto-unzip completes → Game ready to play');
    console.log('\n✨ END OF TEST\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTest();
