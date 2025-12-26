const axios = require('axios');

async function debugSteamVideo() {
  const appId = 1938090; // Call of Duty
  
  console.log(`Fetching raw data for appId: ${appId}\n`);
  
  const response = await axios.get(
    `https://store.steampowered.com/api/appdetails?appids=${appId}`
  );
  
  const data = response.data[appId];
  
  if (data?.success && data?.data?.movies) {
    console.log('First movie raw data:\n');
    console.log(JSON.stringify(data.data.movies[0], null, 2));
  } else {
    console.log('No movies found');
  }
}

debugSteamVideo().catch(console.error);
