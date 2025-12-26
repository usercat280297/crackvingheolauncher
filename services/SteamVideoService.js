const axios = require('axios');

class SteamVideoService {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  }

  async fetchGameVideos(appId) {
    const cacheKey = `videos_${appId}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`,
        { timeout: 10000 }
      );

      const data = response.data[appId];
      
      if (!data?.success || !data?.data?.movies) {
        return [];
      }

      const videos = data.data.movies.map(movie => {
        // Steam mới dùng DASH/HLS streaming
        const videoUrl = movie.mp4?.max || movie.mp4?.['480'] || 
                        movie.webm?.max || movie.webm?.['480'] ||
                        movie.hls_h264 || movie.dash_h264;
        
        return {
          id: movie.id,
          name: movie.name,
          thumbnail: movie.thumbnail,
          videoUrl: videoUrl,
          // Legacy MP4/WebM (older games)
          mp4: movie.mp4 || {},
          webm: movie.webm || {},
          // Modern streaming formats
          hls: movie.hls_h264,
          dash_h264: movie.dash_h264,
          dash_av1: movie.dash_av1,
          highlight: movie.highlight || false
        };
      });

      // Cache result
      this.cache.set(cacheKey, {
        data: videos,
        timestamp: Date.now()
      });

      return videos;
    } catch (error) {
      console.error(`Error fetching videos for ${appId}:`, error.message);
      return [];
    }
  }

  // Get only the main trailer (highlight video)
  async getMainTrailer(appId) {
    const videos = await this.fetchGameVideos(appId);
    return videos.find(v => v.highlight) || videos[0] || null;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = new SteamVideoService();
