const ImageCacheManager = require('../services/ImageCacheManager');

(async () => {
  const appIds = [440, 1770860, 3004440]; // TF2 (should exist), and two appIds which previously returned 404

  for (const appId of appIds) {
    try {
      console.log(`\n--- Testing appId: ${appId} ---`);
      const images = await ImageCacheManager.fetchAndCacheImages(appId);
      console.log(`Result for ${appId}:`, images ? `Cached ${images.imageCount} images` : 'No images');
    } catch (err) {
      console.error(`Error for ${appId}:`, err.message);
    }
  }

  process.exit(0);
})();
