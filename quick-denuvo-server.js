#!/usr/bin/env node

/**
 * Quick API Test Server
 * Lightweight server for testing Denuvo API
 */

const express = require('express');
const denuvoRouter = require('./routes/denuvo');
const DenuvoDetectionService = require('./services/DenuvoDetectionService');

const app = express();
app.use(express.json());

// Mount only Denuvo routes for quick testing
app.use('/api/denuvo', denuvoRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'denuvo-test-server' });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Quick Denuvo Test Server running on port ${PORT}`);
  console.log('\n📋 Available endpoints:');
  console.log(`   GET  /api/denuvo/check/:appId`);
  console.log(`   POST /api/denuvo/batch`);
  console.log(`   GET  /api/denuvo/list`);
  console.log(`   GET  /api/denuvo/stats`);
  console.log(`\n🧪 Ready to test!\n`);
  
  // Show verified list
  const verified = DenuvoDetectionService.getVerifiedDenuvoList();
  console.log(`📊 Verified Denuvo games: ${verified.critical.length}\n`);
});
