const express = require('express');
const QuickGameSearch = require('../quickGameSearch');

const router = express.Router();
const gameSearch = new QuickGameSearch();

// Search games
router.get('/search', async (req, res) => {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 1) {
        return res.json({ query: q, results: [], suggestions: [] });
    }
    
    try {
        const results = await gameSearch.search(q, parseInt(limit));
        const suggestions = await gameSearch.getSuggestions(q, 5);
        
        res.json({
            query: q,
            count: results.length,
            results: results.map(game => ({
                appId: game.appId,
                name: game.name,
                file: game.file,
                matchType: game.matchType,
                score: Math.round(game.score * 100)
            })),
            suggestions: suggestions.filter(s => s.name.toLowerCase() !== q.toLowerCase())
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get search suggestions only
router.get('/suggestions', async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.trim().length < 1) {
        return res.json({ suggestions: [] });
    }
    
    try {
        const suggestions = await gameSearch.getSuggestions(q, 8);
        res.json({ suggestions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get search stats
router.get('/stats', (req, res) => {
    res.json({
        totalGamesCached: gameSearch.gameNames.size,
        totalAppIds: gameSearch.appIds.length,
        coverage: `${(gameSearch.gameNames.size / gameSearch.appIds.length * 100).toFixed(1)}%`
    });
});

// Build cache endpoint (can be called from frontend)
router.post('/build-cache', async (req, res) => {
    try {
        res.json({ 
            message: 'Cache build started in background',
            currentCached: gameSearch.gameNames.size,
            totalAppIds: gameSearch.appIds.length
        });
        
        // Run in background without waiting
        gameSearch.rebuildCacheFromAppIds().catch(error => {
            console.error('Background cache build error:', error);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reload cache (useful for frontend after building)
router.get('/reload-cache', (req, res) => {
    try {
        gameSearch.loadCache();
        res.json({ 
            message: 'Cache reloaded',
            totalGamesCached: gameSearch.gameNames.size,
            totalAppIds: gameSearch.appIds.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;