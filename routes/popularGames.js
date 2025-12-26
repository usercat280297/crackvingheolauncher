const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

/**
 * 🎮 Popular Games Route - Denuvo + Trending Games
 * 
 * Features:
 * - Denuvo games prioritized
 * - Trending games (high playcount)
 * - Proper caching strategy
 * - Badge system (⚡ Denuvo, 🔥 Trending, ⭐ Highly Rated)
 */

// Popular Denuvo games list
const DENUVO_GAMES = [
  'Cyberpunk 2077', 'Elden Ring', 'Starfield', 'Call of Duty',
  "Dragon's Dogma 2", 'Forspoken', 'Final Fantasy XVI', 'Resident Evil Village',
  'Hitman 3', 'Spider-Man', 'God of War', 'Hogwarts Legacy',
  'Microsoft Flight Simulator', 'Star Wars Outlaws', 'Avatar', 'Tekken 8',
  'Street Fighter 6', 'Monster Hunter World', 'Devil May Cry 5',
  "Assassin's Creed Valhalla", 'Watch Dogs Legion', 'Far Cry 6', 'Dying Light 2',
  'S.T.A.L.K.E.R. 2', 'Dragon Age: Inquisition', 'Tomb Raider', 'Deus Ex',
  'Kingdom Come: Deliverance', 'MotoGP 24', 'The Evil Within', 'ANNO 1800'
];

/**
 * GET /api/popular-games
 * Lấy tất cả game nổi tiếng (Denuvo + Trending)
 * Sort: Denuvo → Rating → Playcount
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Aggregate pipeline
    const games = await Game.aggregate([
      {
        $addFields: {
          // Check if game is Denuvo
          isDenuvo: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: DENUVO_GAMES,
                    as: 'denuvoGame',
                    cond: {
                      $regexMatch: {
                        input: { $toLower: '$title' },
                        regex: { $toLower: '$$denuvoGame' }
                      }
                    }
                  }
                }
              },
              0
            ]
          },
          // Calculate popularity score
          popularityScore: {
            $add: [
              { $cond: [{ $gte: ['$playcount', 500000] }, 10, 0] },
              { $cond: [{ $gte: ['$playcount', 100000] }, 5, 0] },
              { $cond: [{ $gte: ['$metacritic.score', 85] }, 5, 0] },
              { $cond: [{ $gte: ['$metacritic.score', 75] }, 3, 0] },
              { $cond: [{ $gte: ['$releaseDate', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()] }, 2, 0] }
            ]
          },
          // Determine badge
          badge: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: DENUVO_GAMES,
                        as: 'denuvoGame',
                        cond: {
                          $regexMatch: {
                            input: { $toLower: '$title' },
                            regex: { $toLower: '$$denuvoGame' }
                          }
                        }
                      }
                    }
                  },
                  0
                ]
              },
              '⚡ Denuvo',
              {
                $cond: [
                  { $gte: ['$playcount', 100000] },
                  '🔥 Trending',
                  {
                    $cond: [
                      { $gte: ['$metacritic.score', 85] },
                      '⭐ Highly Rated',
                      null
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $match: {
          title: { $nin: ['Unknown Game', 'Unknown'] },
          'metacritic.score': { $gte: 50 },
          playcount: { $gte: 10000 }
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
        $facet: {
          metadata: [
            { $count: 'total' }
          ],
          games: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
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
                popularityScore: 1,
                badge: 1
              }
            }
          ]
        }
      }
    ]);

    const total = games[0]?.metadata[0]?.total || 0;
    const gamesList = games[0]?.games || [];

    // Transform response
    const transformed = gamesList.map(game => ({
      id: game.appId,
      appId: game.appId,
      title: game.title,
      cover: game.images?.cover || game.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`,
      hero: game.images?.hero || game.backgroundImage,
      developers: game.developers || [],
      publishers: game.publishers || [],
      genres: game.genres || [],
      rating: game.metacritic?.score || 0,
      ratingUrl: game.metacritic?.url,
      playcount: game.playcount || 0,
      isDenuvo: game.isDenuvo,
      badge: game.badge,
      releaseDate: game.releaseDate,
      price: game.price || 'Free'
    }));

    res.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching popular games:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/popular-games/denuvo
 * Only Denuvo games
 */
router.get('/denuvo', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const denuvoGames = await Game.aggregate([
      {
        $addFields: {
          isDenuvo: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: DENUVO_GAMES,
                    as: 'denuvoGame',
                    cond: {
                      $regexMatch: {
                        input: { $toLower: '$title' },
                        regex: { $toLower: '$$denuvoGame' }
                      }
                    }
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $match: {
          isDenuvo: true,
          title: { $nin: ['Unknown Game', 'Unknown'] }
        }
      },
      {
        $sort: { 'metacritic.score': -1, playcount: -1 }
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
          'metacritic.score': 1,
          playcount: 1
        }
      }
    ]);

    const transformed = denuvoGames.map(game => ({
      id: game.appId,
      title: game.title,
      cover: game.images?.cover || game.headerImage,
      hero: game.images?.hero || game.backgroundImage,
      rating: game.metacritic?.score || 0,
      playcount: game.playcount,
      badge: '⚡ Denuvo',
      developers: game.developers
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('❌ Error fetching Denuvo games:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/popular-games/trending
 * Trending games by playcount
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
      hero: game.images?.hero || game.backgroundImage,
      rating: game.metacritic?.score || 0,
      playcount: game.playcount,
      badge: '🔥 Trending',
      developers: game.developers
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('❌ Error fetching trending games:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/popular-games/top-rated
 * Top rated games by metacritic score
 */
router.get('/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topRatedGames = await Game.find({
      title: { $nin: ['Unknown Game', 'Unknown'] },
      'metacritic.score': { $gte: 80 }
    })
    .sort({ 'metacritic.score': -1, playcount: -1 })
    .limit(limit)
    .select('appId title headerImage backgroundImage images developers metacritic.score playcount')
    .lean();

    const transformed = topRatedGames.map(game => ({
      id: game.appId,
      title: game.title,
      cover: game.images?.cover || game.headerImage,
      hero: game.images?.hero || game.backgroundImage,
      rating: game.metacritic?.score || 0,
      playcount: game.playcount,
      badge: '⭐ Highly Rated',
      developers: game.developers
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('❌ Error fetching top rated games:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/popular-games/featured
 * Featured games for homepage carousel
 */
router.get('/featured', async (req, res) => {
  try {
    const featuredGames = await Game.aggregate([
      {
        $addFields: {
          isDenuvo: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: DENUVO_GAMES,
                    as: 'denuvoGame',
                    cond: {
                      $regexMatch: {
                        input: { $toLower: '$title' },
                        regex: { $toLower: '$$denuvoGame' }
                      }
                    }
                  }
                }
              },
              0
            ]
          },
          popularityScore: {
            $add: [
              { $cond: [{ $gte: ['$playcount', 500000] }, 10, 0] },
              { $cond: [{ $gte: ['$metacritic.score', 85] }, 5, 0] }
            ]
          }
        }
      },
      {
        $match: {
          title: { $nin: ['Unknown Game', 'Unknown'] },
          'metacritic.score': { $gte: 75 }
        }
      },
      {
        $sort: { isDenuvo: -1, popularityScore: -1, 'metacritic.score': -1 }
      },
      {
        $limit: 8
      },
      {
        $project: {
          appId: 1,
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
      id: game.appId,
      title: game.title,
      cover: game.images?.cover || game.headerImage,
      hero: game.images?.hero || game.backgroundImage,
      developer: game.developers?.[0] || 'Unknown',
      rating: game.metacritic?.score || 0,
      description: game.description || `Experience ${game.title}, a premium gaming experience.`,
      size: '50 GB'
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('❌ Error fetching featured games:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
