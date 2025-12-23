const express = require('express');
const axios = require('axios');
const fs = require('fs');

const router = express.Router();
const cacheFile = './gameNamesCache.json';
let cache = {};

// Load cache
if (fs.existsSync(cacheFile)) {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
}

// Get game name by appID
router.get('/:appId', async (req, res) => {
    const { appId } = req.params;
    
    // Check cache
    if (cache[appId]) {
        return res.json({ appId, name: cache[appId] });
    }
    
    // Fetch from Steam
    try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const data = response.data[appId];
        
        if (data && data.success && data.data) {
            const name = data.data.name;
            cache[appId] = name;
            fs.writeFileSync(cacheFile, JSON.stringify(cache));
            return res.json({ appId, name });
        }
        
        res.status(404).json({ error: 'Game not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
