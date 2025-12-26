const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// 🎮 Danh sách game nổi tiếng Denuvo (cập nhật từ steam data)
const POPULAR_DENUVO_GAMES = [
  // Cyberpunk/Action RPG
  'Cyberpunk 2077',
  'Elden Ring',
  'Black Myth Wukong',
  
  // Ubisoft Games
  'Anno 1117',
  'Anno 1800',
  'Assassin\'s Creed Mirage',
  'Assassin\'s Creed Shadows',
  'Assassin\'s Creed Valhalla',
  'Avatar: Frontiers of Pandora',
  'Prince of Persia: The Lost Crown',
  'Star Wars Outlaws',
  'Watch Dogs Legion',
  'Far Cry 6',
  
  // EA Sports & Racing
  'EA Sports FC24',
  'EA Sports FC25',
  'EA Sports FC26',
  'EA Sports Madden 26',
  'EA Sports PGA Tour',
  'EA Sports WRC',
  'F1 24',
  'F1 25',
  'Grid Legends',
  'Lost In Random',
  'Need for Speed Unbound',
  'Sonic Racing: Crossworlds',
  
  // Action/Fighting Games
  'Call of Duty',
  'Devil May Cry 5',
  'Dragon\'s Dogma 2',
  'Final Fantasy XVI',
  'Forspoken',
  'God of War',
  'Hitman 3',
  'Hogwarts Legacy',
  'Microsoft Flight Simulator',
  'Monster Hunter World',
  'Resident Evil Village',
  'Spider-Man',
  'Starfield',
  'Street Fighter 6',
  'Tekken 8',
  'Wanba Warriors',
  'Persona 3',
  'Persona 4',
  'Persona 5',
  'SHIN MEGAMI TENSEI',
  'Total War: Pharaoh Dynasties',
  'Total War: Warhammer III',
  'Warhammer 40000',
  'Undisputed',
  'Sniper Elite 5',
  'The First Berserker: Khazan',
  'Digimon Story Cyber Sleuth'
];

// Popular tags/genres (phải có để xuất hiện)
const POPULAR_TAGS = [
  'Action',
  'RPG',
  'Adventure',
  'Shooter',
  'Multiplayer',
  'Indie',
  'Simulation',
  'Strategy'
];

/**
 * GET /api/most-popular
 * Lấy game nổi tiếng + Denuvo lên trên
 * Sort: Denuvo → Playcount → Rating → Release date
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Stage 1: Filter game nổi tiếng theo tiêu chí
    const games = await Game.aggregate([
      {
        $addFields: {
          // Điểm cho game Denuvo
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
          // Điểm cho playcount (nếu có)
          playcountScore: {
            $cond: [
              { $gte: ['$playcount', 100000] },
              5,
              { $cond: [{ $gte: ['$playcount', 50000] }, 3, 1] }
            ]
          },
          // Điểm cho rating
          ratingScore: {
            $cond: [
              { $gte: ['$metacritic.score', 80] },
              5,
              { $cond: [{ $gte: ['$metacritic.score', 70] }, 3, 1] }
            ]
          },
          // Tính tổng score
          totalScore: {
            $add: [
              { $cond: [{ $eq: [{ $toLower: '$title' }, { $toLower: { $arrayElemAt: [POPULAR_DENUVO_GAMES, 0] } }] }, 10, 0] },
              { $cond: [{ $gte: ['$playcount', 100000] }, 5, 0] },
              { $cond: [{ $gte: ['$metacritic.score', 80] }, 5, 0] },
              { $cond: [{ $gte: ['$releaseDate', new Date('2023-01-01').toISOString()] }, 2, 0] }
            ]
          }
        }
      },
      {
        $match: {
          // Loại bỏ unknown games và non-rated
          title: { $nin: ['Unknown Game', 'Unknown'] },
          'metacritic.score': { $gte: 40 }
        }
      },
      {
        $sort: {
          isDenuvo: -1,
          'metacritic.score': -1,
          playcount: -1,
          releaseDate: -1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $project: {
          appId: 1,
          title: 1,
          headerImage: 1,
          backgroundImage: 1,
          'images.cover': 1,
          'images.hero': 1,
          developers: 1,
          publishers: 1,
          genres: 1,
          'metacritic.score': 1,
          'metacritic.url': 1,
          playcount: 1,
          releaseDate: 1,
          price: 1,
          isDenuvo: 1,
          playcountScore: 1,
          ratingScore: 1
        }
      }
    ]);

    // Transform response
    const transformed = games.map(game => {
      const isDenuvo = POPULAR_DENUVO_GAMES.some(name => 
        game.title.toLowerCase().includes(name.toLowerCase())
      );

      return {
        id: game.appId,
        appId: game.appId,
        title: game.title,
        cover: game.images?.cover || game.headerImage || `http://localhost:3000/api/steam/image/${game.appId}/header`,
        hero: game.images?.hero || game.backgroundImage,
        developers: game.developers || [],
        genres: game.genres || [],
        rating: game.metacritic?.score || 0,
        playcount: game.playcount || 0,
        isDenuvo: isDenuvo,
        badge: isDenuvo ? '⚡ Denuvo' : game.playcount > 100000 ? '🔥 Trending' : null,
        releaseDate: game.releaseDate,
        price: game.price
      };
    });

    // Lấy total count
    const total = await Game.countDocuments({
      title: { $nin: ['Unknown Game', 'Unknown'] },
      'metacritic.score': { $gte: 40 }
    });

    res.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching most popular games:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/most-popular/denuvo-only
 * Chỉ lấy game Denuvo
 */
router.get('/denuvo-only', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const denuvoGames = await Game.find({
      title: { 
        $regex: new RegExp(POPULAR_DENUVO_GAMES.join('|'), 'i'),
        $nin: ['Unknown Game', 'Unknown']
      }
    })
    .sort({ 'metacritic.score': -1, playcount: -1 })
    .limit(limit)
    .select('appId title headerImage backgroundImage images developers genres metacritic.score playcount price releaseDate')
    .lean();

    const transformed = denuvoGames.map(game => ({
      id: game.appId,
      title: game.title,
      cover: game.images?.cover || game.headerImage,
      hero: game.images?.hero || game.backgroundImage,
      rating: game.metacritic?.score || 0,
      badge: '⚡ Denuvo'
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('❌ Error fetching Denuvo games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/most-popular/trending
 * Game trending - playcount cao nhất tuần này
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const trendingGames = await Game.find({
      title: { $nin: ['Unknown Game', 'Unknown'] },
      playcount: { $gte: 50000 },
      'metacritic.score': { $gte: 50 }
    })
    .sort({ playcount: -1, releaseDate: -1 })
    .limit(limit)
    .select('appId title headerImage backgroundImage images developers playcount metacritic.score')
    .lean();

    const transformed = trendingGames.map(game => ({
      id: game.appId,
      title: game.title,
      cover: game.images?.cover || game.headerImage,
      playcount: game.playcount,
      badge: '🔥 Trending'
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('❌ Error fetching trending games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
