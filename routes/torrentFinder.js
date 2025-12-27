const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Search torrents from multiple sources
 */
router.post('/search', async (req, res) => {
  try {
    const { gameName, appId } = req.body;

    if (!gameName) {
      return res.status(400).json({
        success: false,
        error: 'Game name is required'
      });
    }

    console.log(`🔍 Searching torrents for: ${gameName}`);

    // Search from multiple sources
    const results = await Promise.allSettled([
      searchFitGirl(gameName),
      search1337x(gameName),
      // searchPirateBay(gameName), // Thêm nếu cần
    ]);

    const torrents = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(Boolean);

    res.json({
      success: true,
      count: torrents.length,
      results: torrents
    });

  } catch (error) {
    console.error('Torrent search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get torrent file info
 */
router.post('/info', async (req, res) => {
  try {
    const { magnetLink } = req.body;

    if (!magnetLink) {
      return res.status(400).json({
        success: false,
        error: 'Magnet link is required'
      });
    }

    // Parse magnet link
    const info = parseMagnetLink(magnetLink);

    res.json({
      success: true,
      info: info
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download torrent file
 */
router.get('/download/:infoHash', async (req, res) => {
  try {
    const { infoHash } = req.params;

    // TODO: Implement torrent file download
    
    res.json({
      success: true,
      message: 'Not implemented yet'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// Helper Functions
// ========================================

/**
 * Search FitGirl Repacks
 */
async function searchFitGirl(gameName) {
  try {
    const searchUrl = `https://fitgirl-repacks.site/?s=${encodeURIComponent(gameName)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.entry-title').each((i, elem) => {
      if (i >= 5) return; // Limit to 5 results

      const title = $(elem).text().trim();
      const link = $(elem).find('a').attr('href');

      if (title && link) {
        results.push({
          source: 'FitGirl Repacks',
          title: title,
          url: link,
          type: 'repack'
        });
      }
    });

    return results;

  } catch (error) {
    console.error('FitGirl search error:', error.message);
    return [];
  }
}

/**
 * Search 1337x
 */
async function search1337x(gameName) {
  try {
    // Note: 1337x blocks automated requests, may need proxy
    const searchUrl = `https://1337x.to/search/${encodeURIComponent(gameName)}/1/`;
    
    // TODO: Implement with proxy or alternative method
    
    return [];

  } catch (error) {
    console.error('1337x search error:', error.message);
    return [];
  }
}

/**
 * Parse magnet link
 */
function parseMagnetLink(magnetLink) {
  const regex = /magnet:\?xt=urn:btih:([a-zA-Z0-9]+)/;
  const match = magnetLink.match(regex);

  if (!match) {
    throw new Error('Invalid magnet link');
  }

  return {
    infoHash: match[1],
    magnetLink: magnetLink
  };
}

module.exports = router;