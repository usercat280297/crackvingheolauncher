#!/usr/bin/env node

/**
 * Simple Denuvo List Test
 * Directly tests DenuvoDetectionService without API
 */

const denuvoService = require('./services/DenuvoDetectionService');

console.log('\n🔍 TESTING DENUVO VERIFIED LIST\n');
console.log('═'.repeat(70));

const verified = denuvoService.getVerifiedDenuvoList();

const testGames = [
  { id: 2358720, name: 'Black Myth: Wukong', expected: true },
  { id: 2054790, name: "Dragon's Dogma 2", expected: true },
  { id: 2246340, name: 'Monster Hunter Wilds', expected: true },
  { id: 1364780, name: 'Street Fighter 6', expected: true },
  { id: 2515020, name: 'Final Fantasy XVI', expected: true },
  { id: 1245620, name: 'Elden Ring', expected: false },
  { id: 1174180, name: 'Red Dead Redemption 2', expected: false },
  { id: 271590, name: 'Grand Theft Auto V', expected: false },
  { id: 10090, name: 'Call of Duty 4', expected: false },
  { id: 730, name: 'Counter-Strike 2', expected: false },
];

let correct = 0;
let incorrect = 0;

console.log('\nVERIFIED GAMES IN LIST:', verified.critical.length);
console.log('\nTESTING:\n');

testGames.forEach(game => {
  const found = verified.critical.includes(game.id);
  const isCorrect = found === game.expected;

  if (isCorrect) {
    correct++;
    console.log(`✅ ${game.name} (${game.id})`);
    console.log(`   Expected: ${game.expected} → Found: ${found}`);
  } else {
    incorrect++;
    console.log(`❌ ${game.name} (${game.id})`);
    console.log(`   Expected: ${game.expected} → Found: ${found}`);
  }
});

console.log('\n' + '═'.repeat(70));
console.log(`\n📊 RESULTS: ${correct}/10 correct, ${incorrect}/10 wrong`);
console.log(`✅ Accuracy: ${(correct/10*100).toFixed(1)}%\n`);

if (incorrect === 0) {
  console.log('🎉 PERFECT! All tests passed!\n');
} else {
  console.log(`⚠️  ${incorrect} tests failed - need fixes\n`);
}
