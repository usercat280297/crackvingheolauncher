const axios = require('axios');
const AchievementProgress = require('../models/AchievementProgress');

class SteamAchievementService {
  constructor() {
    this.apiKey = process.env.STEAM_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour
  }

  /**
   * Get game achievements schema from Steam
   */
  async getGameAchievements(appId) {
    const cacheKey = `achievements_${appId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await axios.get(
        `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/`,
        {
          params: {
            key: this.apiKey,
            appid: appId
          },
          timeout: 10000
        }
      );

      const achievements = response.data?.game?.availableGameStats?.achievements || [];
      
      const formatted = achievements.map(ach => ({
        name: ach.name,
        displayName: ach.displayName,
        description: ach.description || ach.displayName,
        icon: ach.icon,
        iconGray: ach.icongray,
        hidden: ach.hidden === 1,
        achieved: false,
        unlockTime: null
      }));

      this.cache.set(cacheKey, {
        data: formatted,
        timestamp: Date.now()
      });

      return formatted;
    } catch (error) {
      console.error(`Failed to fetch achievements for ${appId}:`, error.message);
      return [];
    }
  }

  /**
   * Get global achievement percentages
   */
  async getAchievementPercentages(appId) {
    try {
      const response = await axios.get(
        `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/`,
        {
          params: { gameid: appId },
          timeout: 10000
        }
      );

      const percentages = {};
      response.data?.achievementpercentages?.achievements?.forEach(ach => {
        percentages[ach.name] = ach.percent;
      });

      return percentages;
    } catch (error) {
      console.error(`Failed to fetch achievement percentages for ${appId}:`, error.message);
      return {};
    }
  }

  /**
   * Get user's achievement progress from database
   */
  async getUserProgressFromDB(appId, userId) {
    try {
      const progress = await AchievementProgress.findOne({ userId, appId });
      if (!progress) return {};
      
      const progressMap = {};
      progress.achievements.forEach(ach => {
        progressMap[ach.name] = {
          achieved: ach.achieved,
          unlockTime: ach.unlockTime
        };
      });
      return progressMap;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {};
    }
  }

  /**
   * Save user's achievement progress to database
   */
  async saveUserProgress(appId, userId, achievements, stats) {
    try {
      const achievementData = achievements
        .filter(a => a.achieved)
        .map(a => ({
          name: a.name,
          achieved: true,
          unlockTime: a.unlockTime || new Date()
        }));

      await AchievementProgress.findOneAndUpdate(
        { userId, appId },
        {
          achievements: achievementData,
          stats,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
      
      return true;
    } catch (error) {
      console.error('Error saving user progress:', error);
      return false;
    }
  }

  /**
   * Get user's achievement progress (simulated for now)
   */
  getUserProgress(appId, userId = 'demo') {
    // Simulate user progress (in real app, this would come from database)
    const progress = JSON.parse(localStorage.getItem(`achievements_${appId}_${userId}`) || '{}');
    return progress;
  }

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(appId, achievementName, userId = 'demo') {
    try {
      // Get current progress
      const progress = await AchievementProgress.findOne({ userId, appId });
      
      if (!progress) {
        // Create new progress
        await AchievementProgress.create({
          userId,
          appId,
          achievements: [{
            name: achievementName,
            achieved: true,
            unlockTime: new Date()
          }],
          stats: { total: 0, unlocked: 1, progress: 0 }
        });
      } else {
        // Update existing
        const existingAch = progress.achievements.find(a => a.name === achievementName);
        if (!existingAch) {
          progress.achievements.push({
            name: achievementName,
            achieved: true,
            unlockTime: new Date()
          });
        } else {
          existingAch.achieved = true;
          existingAch.unlockTime = new Date();
        }
        progress.lastUpdated = new Date();
        await progress.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }

  /**
   * Get achievements with user progress from database
   */
  async getAchievementsWithProgress(appId, userId = 'demo') {
    const [achievements, percentages, userProgress] = await Promise.all([
      this.getGameAchievements(appId),
      this.getAchievementPercentages(appId),
      this.getUserProgressFromDB(appId, userId)
    ]);

    const achievementsWithProgress = achievements.map(ach => ({
      ...ach,
      achieved: userProgress[ach.name]?.achieved || false,
      unlockTime: userProgress[ach.name]?.unlockTime || null,
      percentage: percentages[ach.name] || 0
    }));

    const totalAchievements = achievementsWithProgress.length;
    const unlockedCount = achievementsWithProgress.filter(a => a.achieved).length;
    const progress = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

    const stats = {
      total: totalAchievements,
      unlocked: unlockedCount,
      locked: totalAchievements - unlockedCount,
      progress: progress
    };

    // Save stats to database
    if (totalAchievements > 0) {
      await this.saveUserProgress(appId, userId, achievementsWithProgress, stats);
    }

    return {
      achievements: achievementsWithProgress,
      stats
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SteamAchievementService();
