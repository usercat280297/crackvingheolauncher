const STEAM_API_KEY = 'C8389A6AE249466D0A5234DC9D2D23C6';
const MONGODB_API_URL = 'http://localhost:3000/api';

class GameService {
  // Fetch games from MongoDB
  async fetchGamesFromMongoDB() {
    try {
      const response = await fetch(`${MONGODB_API_URL}/games`);
      if (!response.ok) throw new Error('Failed to fetch from MongoDB');
      return await response.json();
    } catch (error) {
      console.error('MongoDB fetch error:', error);
      return [];
    }
  }

  // Fetch Steam game details
  async fetchSteamGameDetails(appId) {
    try {
      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&key=${STEAM_API_KEY}`);
      const data = await response.json();
      
      if (data[appId]?.success) {
        const gameData = data[appId].data;
        return {
          id: appId,
          title: gameData.name,
          description: gameData.short_description || gameData.detailed_description?.replace(/<[^>]*>/g, ''),
          cover: gameData.header_image,
          screenshots: gameData.screenshots?.map(s => s.path_full) || [],
          developer: gameData.developers?.[0] || 'Unknown',
          publisher: gameData.publishers?.[0] || 'Unknown',
          releaseDate: gameData.release_date?.date || 'TBA',
          genres: gameData.genres?.map(g => g.description).join(', ') || 'Unknown',
          price: gameData.price_overview?.final_formatted || 'Free',
          originalPrice: gameData.price_overview?.initial_formatted,
          discount: gameData.price_overview?.discount_percent || 0,
          rating: Math.floor(Math.random() * 20 + 80) + '%', // Mock rating
          size: Math.floor(Math.random() * 50 + 10) + ' GB', // Mock size
          systemRequirements: {
            minimum: gameData.pc_requirements?.minimum || 'Not specified',
            recommended: gameData.pc_requirements?.recommended || 'Not specified'
          },
          featured: Math.random() > 0.8,
          onSale: gameData.price_overview?.discount_percent > 0
        };
      }
      return null;
    } catch (error) {
      console.error('Steam API error:', error);
      return null;
    }
  }

  // Get popular Steam games
  async fetchPopularSteamGames() {
    const popularAppIds = [
      1091500, // Cyberpunk 2077
      292030,  // The Witcher 3
      1174180, // Red Dead Redemption 2
      271590,  // GTA V
      1245620, // Elden Ring
      570,     // Dota 2
      730,     // CS:GO
      440,     // Team Fortress 2
      1172470, // Apex Legends
      1085660  // Destiny 2
    ];

    const games = [];
    for (const appId of popularAppIds) {
      const game = await this.fetchSteamGameDetails(appId);
      if (game) games.push(game);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return games;
  }

  // Combined fetch - MongoDB first, then Steam
  async fetchAllGames() {
    try {
      // Try MongoDB first
      let games = await this.fetchGamesFromMongoDB();
      
      // If MongoDB is empty or fails, fetch from Steam
      if (games.length === 0) {
        console.log('Fetching from Steam API...');
        games = await this.fetchPopularSteamGames();
      }

      return games;
    } catch (error) {
      console.error('Error fetching games:', error);
      return this.getMockGames(); // Fallback to mock data
    }
  }

  // Mock data fallback
  getMockGames() {
    return [
      {
        id: 1,
        title: "Cyberpunk 2077",
        description: "An open-world, action-adventure RPG set in the dark future of Night City.",
        cover: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
        developer: "CD PROJEKT RED",
        publisher: "CD PROJEKT RED",
        releaseDate: "2020-12-10",
        genres: "RPG, Action",
        rating: "86%",
        size: "70 GB",
        featured: true,
        onSale: true,
        discount: 50,
        originalPrice: "$59.99",
        salePrice: "$29.99"
      },
      {
        id: 2,
        title: "The Witcher 3: Wild Hunt",
        description: "The most awarded game of a generation, now enhanced for the next!",
        cover: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
        developer: "CD PROJEKT RED",
        publisher: "CD PROJEKT RED",
        releaseDate: "2015-05-18",
        genres: "RPG, Adventure",
        rating: "93%",
        size: "50 GB",
        featured: true,
        onSale: true,
        discount: 75,
        originalPrice: "$39.99",
        salePrice: "$9.99"
      }
    ];
  }
}

export default new GameService();