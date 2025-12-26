const STEAMGRIDDB_API_KEY = '6949533daea9444b0e8f2dfe121a0c30';
const BASE_URL = 'https://cdn2.steamgriddb.com';

class SteamGridDBService {
  static getGridImage(appId) {
    if (!appId) return null;
    return `${BASE_URL}/steam/${appId}/600x900.png`;
  }

  static getHeroImage(appId) {
    if (!appId) return null;
    return `${BASE_URL}/steam/${appId}/hero.png`;
  }

  static getLogoImage(appId) {
    if (!appId) return null;
    return `${BASE_URL}/steam/${appId}/logo.png`;
  }

  static getIconImage(appId) {
    if (!appId) return null;
    return `${BASE_URL}/steam/${appId}/icon.png`;
  }
}

export default SteamGridDBService;
