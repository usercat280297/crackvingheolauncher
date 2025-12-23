const express = require('express');
const router = express.Router();
const luaParser = require('../luaParser');

// Cache cho search results
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// Preload games data
let gamesData = [];
let gameIndex = new Map();

const initializeSearchData = async () => {
  try {
    const games = await luaParser.parseAllGames();
    gamesData = Array.isArray(games) ? games : [];
    gameIndex.clear();
    
    // Tạo index cho search nhanh
    gamesData.forEach(game => {
      const gameName = game.title || game.name || '';
      const searchTerms = [
        gameName.toLowerCase(),
        game.developer?.toLowerCase(),
        game.publisher?.toLowerCase(),
        game.genres?.toLowerCase(),
        game.description?.toLowerCase()
      ].filter(Boolean).join(' ');
      
      gameIndex.set(game.id, {
        ...game,
        name: gameName,
        title: gameName,
        searchTerms,
        keywords: searchTerms.split(/\s+/).filter(word => word.length > 2)
      });
    });
    
    console.log(`Search index initialized with ${gamesData.length} games`);
  } catch (error) {
    console.error('Error initializing search data:', error);
  }
};

// Initialize on startup
initializeSearchData();

// Refresh search data endpoint
router.get('/refresh', async (req, res) => {
  await initializeSearchData();
  searchCache.clear();
  res.json({ message: `Search index refreshed with ${gamesData.length} games` });
});

// Main search endpoint
router.get('/search', (req, res) => {
  const { q, limit = 20 } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.json({ results: [], suggestions: [] });
  }
  
  const query = q.trim().toLowerCase();
  const cacheKey = `${query}_${limit}`;
  
  // Check cache
  if (searchCache.has(cacheKey)) {
    const cached = searchCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }
  }
  
  try {
    const results = performSearch(query, parseInt(limit));
    const suggestions = generateSuggestions(query, results);
    
    const response = { results, suggestions };
    searchCache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    res.json(response);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', results: [], suggestions: [] });
  }
});

// Instant search endpoint (for autocomplete)
router.get('/instant', (req, res) => {
  const { q, limit = 5 } = req.query;
  
  if (!q || q.trim().length < 1) {
    return res.json([]);
  }
  
  const query = q.trim().toLowerCase();
  const results = [];
  
  for (const [id, game] of gameIndex) {
    if (results.length >= limit) break;
    
    const gameName = game.title || game.name || '';
    if (gameName.toLowerCase().startsWith(query)) {
      results.push({
        appId: id,
        name: gameName,
        type: 'game'
      });
    }
  }
  
  res.json(results);
});

function performSearch(query, limit) {
  const results = [];
  const queryWords = query.split(/\s+/).filter(word => word.length > 0);
  
  for (const [id, game] of gameIndex) {
    const score = calculateRelevanceScore(game, query, queryWords);
    
    if (score.total > 20) {
      results.push({
        appId: id,
        name: game.title || game.name,
        score: Math.round(score.total),
        matchType: score.type,
        file: game.file || `${game.title || game.name}.lua`,
        developer: game.developer,
        genres: game.genres
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function calculateRelevanceScore(game, query, queryWords) {
  const title = (game.title || game.name || '').toLowerCase();
  const searchTerms = game.searchTerms || '';
  
  let score = 0;
  let matchType = 'fuzzy';
  
  if (title === query) {
    score = 100;
    matchType = 'exact';
  }
  else if (title.startsWith(query)) {
    score = 95;
    matchType = 'prefix';
  }
  else if (title.includes(query)) {
    score = 85;
    matchType = 'contains';
  }
  else if (queryWords.length > 1) {
    let wordMatches = 0;
    let consecutiveMatches = 0;
    
    queryWords.forEach(word => {
      if (word.length > 1 && title.includes(word)) {
        wordMatches++;
      }
    });
    
    const titleWords = title.split(/\s+/);
    for (let i = 0; i < titleWords.length - queryWords.length + 1; i++) {
      let matches = 0;
      for (let j = 0; j < queryWords.length; j++) {
        if (titleWords[i + j]?.includes(queryWords[j])) matches++;
      }
      if (matches > consecutiveMatches) consecutiveMatches = matches;
    }
    
    if (consecutiveMatches === queryWords.length) {
      score = 75;
      matchType = 'phrase';
    } else if (wordMatches === queryWords.length) {
      score = 60;
      matchType = 'keyword';
    } else if (wordMatches > 0) {
      score = (wordMatches / queryWords.length) * 40;
      matchType = 'partial';
    }
  }
  
  return { total: score, type: matchType };
}

function generateSuggestions(query, results) {
  const suggestions = [];
  const seen = new Set();
  
  // Add top results as suggestions if they're close matches
  results.slice(0, 5).forEach(result => {
    if (result.score >= 60 && !seen.has(result.name.toLowerCase())) {
      suggestions.push({
        name: result.name,
        score: result.score,
        matchType: result.matchType
      });
      seen.add(result.name.toLowerCase());
    }
  });
  
  // Add developer-based suggestions
  const developers = new Set();
  for (const [id, game] of gameIndex) {
    if (suggestions.length >= 8) break;
    
    if (game.developer?.toLowerCase().includes(query) && 
        !seen.has(game.developer.toLowerCase())) {
      developers.add(game.developer);
      if (developers.size <= 2) {
        suggestions.push({
          name: `Games by ${game.developer}`,
          score: 70,
          matchType: 'developer'
        });
        seen.add(game.developer.toLowerCase());
      }
    }
  }
  
  return suggestions.slice(0, 6);
}

module.exports = router;