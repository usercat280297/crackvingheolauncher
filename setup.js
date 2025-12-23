#!/usr/bin/env node
/**
 * Setup script for MongoDB and demo account
 * Run: node setup.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/game-launcher';

async function setup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create demo account
    const demoUser = await User.findOne({ email: 'demo@example.com' });
    
    if (demoUser) {
      console.log('⚠️  Demo account already exists');
    } else {
      const newUser = new User({
        username: 'demo',
        email: 'demo@example.com',
        password: 'demo123456',
        isVerified: true,
        preferences: {
          theme: 'dark',
          language: 'vi',
          autoUpdate: true,
          notificationsEnabled: true
        }
      });

      await newUser.save();
      console.log('✅ Demo account created');
      console.log('   Email: demo@example.com');
      console.log('   Password: demo123456');
    }

    // Create test users
    const testUsers = [
      { username: 'player1', email: 'player1@example.com', password: 'password123' },
      { username: 'gamer', email: 'gamer@example.com', password: 'password123' },
      { username: 'hardcore', email: 'hardcore@example.com', password: 'password123' }
    ];

    for (const userData of testUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created test account: ${userData.username}`);
      }
    }

    console.log('✅ Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup error:', err.message);
    process.exit(1);
  }
}

setup();
