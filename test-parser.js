const luaParser = require('./luaParser');
const fs = require('fs');
const path = require('path');

// Test with one file
const testFile = path.join(__dirname, 'lua_files', 'csgo_730.lua');
if (fs.existsSync(testFile)) {
  console.log('Testing single file parsing...');
  const gameData = luaParser.parseLuaFile(testFile);
  console.log('Parsed data:', gameData);
} else {
  console.log('Test file not found');
}

// Test with all files (limited)
console.log('\nTesting all files (first 10)...');
const allFiles = luaParser.getAllLuaFiles().slice(0, 10);
console.log(`Found ${allFiles.length} files to test`);

allFiles.forEach(file => {
  const filePath = path.join(__dirname, 'lua_files', file);
  const gameData = luaParser.parseLuaFile(filePath);
  if (gameData && gameData.appId && gameData.name) {
    console.log(`✓ ${file}: ${gameData.name} (${gameData.appId})`);
  } else {
    console.log(`✗ ${file}: Failed to parse`);
  }
});