const fs = require('fs');
const path = require('path');

console.log('🔍 Testing all route files...\n');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  console.log(`Testing: ${file}`);
  
  try {
    // Clear require cache
    delete require.cache[require.resolve(filePath)];
    
    const router = require(filePath);
    
    // Check if it's a function (Express Router)
    if (typeof router === 'function') {
      console.log(`✅ ${file} - OK (exports function)`);
    } else if (typeof router === 'object' && router !== null) {
      console.log(`❌ ${file} - ERROR (exports object, not router)`);
      console.log(`   Type: ${typeof router}`);
      console.log(`   Constructor: ${router.constructor?.name}`);
      console.log(`   Keys: ${Object.keys(router)}`);
    } else {
      console.log(`⚠️  ${file} - UNKNOWN (exports ${typeof router})`);
    }
  } catch (error) {
    console.log(`💥 ${file} - FAILED TO LOAD`);
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('Test completed!');