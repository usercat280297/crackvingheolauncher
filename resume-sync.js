const mongoose = require('mongoose');
const GameDataSync = require('./services/GameDataSync');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/game-launcher';

async function resumeSync() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('🚀 Resuming game sync...');
    console.log('📊 This will continue from where it stopped (1900 games already synced)');
    console.log('⏱️  Estimated time: ~2-3 hours for remaining games');
    console.log('');
    
    await GameDataSync.startSync();
    
    console.log('');
    console.log('✅ Sync completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resumeSync();
