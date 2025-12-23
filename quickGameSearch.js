const fs = require('fs');
const axios = require('axios');

class QuickGameSearch {
    constructor() {
        this.appIds = [];
        this.gameNames = new Map();
        this.normalizedIndex = new Map(); // For fuzzy matching
        this.cacheFile = './gameNamesCache.json';
        this.luaFolder = './lua_files';
        this.requestCache = new Map(); // Cache in-flight requests to avoid duplicate fetches
        this.failedIds = new Set(); // Track failed fetches to avoid retrying forever
        
        this.loadAppIds();
        this.loadCache();
    }

    loadAppIds() {
        const files = fs.readdirSync(this.luaFolder).filter(f => f.endsWith('.lua'));
        this.appIds = files.map(f => parseInt(f.replace('.lua', ''))).filter(id => !isNaN(id));
        console.log(`📁 Found ${this.appIds.length} games`);
    }

    loadCache() {
        if (fs.existsSync(this.cacheFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                this.gameNames = new Map(Object.entries(data));
                
                // Build normalized index for fuzzy search
                for (const [appId, name] of this.gameNames) {
                    const normalized = this.normalizeText(name);
                    this.normalizedIndex.set(appId, {
                        original: name,
                        normalized: normalized
                    });
                }
                
                console.log(`📚 Loaded ${this.gameNames.size} cached names`);
            } catch (error) {
                console.error('Error loading cache:', error);
                this.gameNames = new Map();
                this.normalizedIndex = new Map();
            }
        } else {
            console.log('⚠️ Game names cache not found - will fetch on-demand');
        }
    }

    saveCache() {
        fs.writeFileSync(this.cacheFile, JSON.stringify(Object.fromEntries(this.gameNames), null, 2));
    }

    // Normalize text for better matching
    normalizeText(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ');
    }

    // Levenshtein distance for fuzzy matching
    levenshteinDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        return matrix[len2][len1];
    }

    // Calculate similarity score (0-1)
    calculateSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLen = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLen);
    }

    async fetchGameName(appId) {
        const appIdStr = appId.toString();
        
        // Already cached
        if (this.gameNames.has(appIdStr)) {
            return this.gameNames.get(appIdStr);
        }

        // Already failed - don't retry
        if (this.failedIds.has(appIdStr)) {
            return null;
        }

        // In-flight request - reuse same promise
        if (this.requestCache.has(appIdStr)) {
            return this.requestCache.get(appIdStr);
        }

        // Make new request
        const promise = (async () => {
            try {
                const response = await axios.get(
                    `https://store.steampowered.com/api/appdetails?appids=${appId}`,
                    { timeout: 10000 }
                );
                
                const data = response.data[appId];
                if (data && data.success && data.data) {
                    const name = data.data.name;
                    this.gameNames.set(appIdStr, name);
                    
                    // Update normalized index
                    const normalized = this.normalizeText(name);
                    this.normalizedIndex.set(appIdStr, {
                        original: name,
                        normalized: normalized
                    });
                    
                    this.saveCache();
                    return name;
                }
                
                this.failedIds.add(appIdStr);
                return null;
            } catch (error) {
                if (error.response?.status !== 429) {
                    // Don't retry on non-rate-limit errors
                    this.failedIds.add(appIdStr);
                }
                throw error;
            }
        })();

        this.requestCache.set(appIdStr, promise);
        
        try {
            const result = await promise;
            this.requestCache.delete(appIdStr);
            return result;
        } catch (error) {
            this.requestCache.delete(appIdStr);
            return null;
        }
    }

    async search(query, limit = 20) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm || searchTerm.length < 1) return [];

        const normalized = this.normalizeText(searchTerm);
        const searchWords = normalized.split(' ').filter(w => w.length > 0);
        
        const results = {
            exact: [],
            prefix: [],
            contains: [],
            wordMatch: [],
            fuzzy: []
        };
        
        // Search in cache
        for (const [appId, data] of this.normalizedIndex) {
            const gameName = data.normalized;
            const originalName = data.original;
            const gameWords = gameName.split(' ');
            
            // Exact match
            if (gameName === normalized) {
                results.exact.push({
                    appId: parseInt(appId),
                    name: originalName,
                    file: `${appId}.lua`,
                    matchType: 'exact',
                    score: 1.0
                });
            }
            // Starts with
            else if (gameName.startsWith(normalized)) {
                results.prefix.push({
                    appId: parseInt(appId),
                    name: originalName,
                    file: `${appId}.lua`,
                    matchType: 'prefix',
                    score: 0.95
                });
            }
            // Contains full query
            else if (gameName.includes(normalized)) {
                results.contains.push({
                    appId: parseInt(appId),
                    name: originalName,
                    file: `${appId}.lua`,
                    matchType: 'contains',
                    score: 0.85
                });
            }
            // Multi-word match - all words present
            else if (searchWords.length > 1) {
                const matchedWords = searchWords.filter(word => 
                    gameWords.some(gw => gw.includes(word) || word.includes(gw))
                );
                
                if (matchedWords.length === searchWords.length) {
                    // All search words found
                    results.wordMatch.push({
                        appId: parseInt(appId),
                        name: originalName,
                        file: `${appId}.lua`,
                        matchType: 'word-match',
                        score: 0.75 + (matchedWords.length / searchWords.length) * 0.1
                    });
                } else if (matchedWords.length > 0) {
                    // Partial word match
                    const partialScore = (matchedWords.length / searchWords.length) * 0.6;
                    if (partialScore >= 0.4) {
                        results.fuzzy.push({
                            appId: parseInt(appId),
                            name: originalName,
                            file: `${appId}.lua`,
                            matchType: 'partial',
                            score: partialScore
                        });
                    }
                }
            }
            // Single word fuzzy match
            else {
                const similarity = this.calculateSimilarity(normalized, gameName);
                if (similarity >= 0.5) {
                    results.fuzzy.push({
                        appId: parseInt(appId),
                        name: originalName,
                        file: `${appId}.lua`,
                        matchType: 'fuzzy',
                        score: similarity
                    });
                }
            }
        }

        // Sort each category
        results.wordMatch.sort((a, b) => b.score - a.score);
        results.fuzzy.sort((a, b) => b.score - a.score);

        // Combine results in priority order
        const combined = [
            ...results.exact,
            ...results.prefix,
            ...results.contains,
            ...results.wordMatch,
            ...results.fuzzy
        ].slice(0, limit);

        return combined;
    }

    async getSuggestions(query, limit = 5) {
        const results = await this.search(query, limit * 3);
        return Array.isArray(results) ? results.slice(0, limit) : [];
    }

    getAllGames() {
        return Array.from(this.gameNames.entries()).map(([appId, name]) => ({
            appId: parseInt(appId),
            name
        }));
    }
}

module.exports = QuickGameSearch;
