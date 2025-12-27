const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Popular Denuvo games list (from mostPopular.js)
const POPULAR_DENUVO_GAMES = [
  'Anno 1800', 'Assassin\'s Creed Mirage', 'Assassin\'s Creed Shadows', 
  'Avatar: Frontiers of Pandora', 'EA Sports FC24', 'EA Sports FC25',
  'EA Sports FC26', 'FINAL FANTASY VII REBIRTH', 'Hogwarts Legacy',
  'Black Myth: Wukong', 'Dragon\'s Dogma 2', 'Street Fighter 6',
  'Sonic Racing: Crossworlds', 'Star Wars Outlaws', 'Need for Speed Unbound'
];

// Get featured games - Use most-popular logic with Denuvo priority
router.get('/featured', async (req, res) => {
  try {
    // Use same logic as most-popular to get top games
    const featuredGames = await Game.aggregate([
      {
        $addFields: {
          // Check if game is in Denuvo list
          isDenuvo: {
            $cond: [
              {
                $regexMatch: {
                  input: { $toLower: '$title' },
                  regex: new RegExp(POPULAR_DENUVO_GAMES.join('|'), 'i')
                }
              },
              10,
              0
            ]
          },
          // Popularity score
          popularityScore: {
            $add: [
              { $cond: [{ $gte: ['$playcount', 500000] }, 10, 0] },
              { $cond: [{ $gte: ['$metacritic.score', 85] }, 5, 0] },
              { $cond: [{ $gte: ['$playcount', 100000] }, 3, 0] }
            ]
          }
        }
      },
      {
        $match: {
          title: { $nin: ['Unknown Game', 'Unknown'] },
          'metacritic.score': { $gte: 70 }
        }
      },
      {
        $sort: {
          isDenuvo: -1,
          popularityScore: -1,
          'metacritic.score': -1,
          playcount: -1
        }
      },
      {
        $limit: 10
      },
      {
        $project: {
          appId: 1,
          id: '$appId',
          title: 1,
          headerImage: 1,
          backgroundImage: 1,
          'images.cover': 1,
          'images.hero': 1,
          description: 1,
          developers: 1,
          'metacritic.score': 1,
          playcount: 1,
          isDenuvo: 1
        }
      }
    ]);

    const transformed = featuredGames.map(game => ({
      id: game.appId || game.id,
      title: game.title,
      cover: game.images?.cover || game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
      hero: game.images?.hero || game.backgroundImage,
      developer: game.developers?.[0] || 'Unknown',
      rating: game.metacritic?.score || null, // Don't show 0, show null
      description: game.description || `Experience ${game.title}, a premium gaming experience.`,
      size: '50 GB'
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching featured games:', error.message);
    
    // Fallback to popular game IDs
    const fallbackIds = [1091500, 292030, 1174180, 1245620, 1593500, 1151640, 2358720];
    const fallback = fallbackIds.map(id => ({
      id,
      title: 'Popular Game',
      cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
      hero: `https://cdn2.steamgriddb.com/steam/${id}/hero.png`,
      description: 'Popular on Steam',
      rating: null, // Don't show 0
      developer: 'Steam',
      size: '50 GB'
    }));

    res.json(fallback);
  }
});

module.exports = router;
