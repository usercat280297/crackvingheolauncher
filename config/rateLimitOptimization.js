/**
 * ============================================
 * RATE LIMIT OPTIMIZATION SYSTEM
 * Tối ưu hóa Steam API + SteamGridDB rate limits
 * ============================================
 */

// Steam API: Official limit là 1 request/second
// Nhưng nếu bị 429, cần backoff exponential
const STEAM_API_CONFIG = {
  baseDelay: 1000,        // 1 giây (Steam API limit chính thức)
  minDelay: 800,          // Minimum delay giữa requests
  maxConcurrent: 5,       // Tối đa 5 requests đồng thời
  retryAttempts: 5,
  exponentialBackoff: true,
  backoffMultiplier: 1.5,
  initialRetryDelay: 5000, // 5 giây đầu tiên
  maxRetryDelay: 60000,   // Max 60 giây
  batchSize: 10,          // Batch 10 games cùng lúc nếu có thể
  cacheFirst: true,       // Check cache trước khi API call
};

// SteamGridDB: API key có rate limit tùy theo tier
// Free tier: ~1000 requests/hour = 3.6 requests/second
// Paid tier: Higher limits
const STEAMGRIDDB_CONFIG = {
  baseDelay: 350,         // 350ms giữa requests (safe margin)
  maxConcurrent: 3,       // Tối đa 3 concurrent requests
  retryAttempts: 3,
  cacheFirst: true,
  cacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  fallbackToCache: true,  // Use cache if API fails
};

// WebTorrent: Không có rate limit từ Torrent protocol
// Nhưng cần throttle để không làm crash server
const WEBTORRENT_CONFIG = {
  maxConcurrentDownloads: 3,
  maxConnectionsPerTorrent: 100,
  maxPeersPerTorrent: 60,
  uploadLimit: 0, // 0 = unlimited
  downloadLimit: 0, // 0 = unlimited
  requestTimeout: 3000,
};

// Request Pool Manager - Quản lý concurrent requests
class RequestPoolManager {
  constructor(config) {
    this.config = config;
    this.queue = [];
    this.executing = 0;
    this.lastRequestTime = 0;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestStats = {
      total: 0,
      success: 0,
      failed: 0,
      retried: 0,
      avgResponseTime: 0,
    };
  }

  async execute(fn, context = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, context, retries: 0 });
      this.processQueue();
    });
  }

  async processQueue() {
    while (this.queue.length > 0 && this.executing < this.config.maxConcurrent) {
      this.executing++;
      const { fn, resolve, reject, context, retries } = this.queue.shift();

      try {
        // Wait for rate limit
        await this.waitForRateLimit();
        
        const startTime = Date.now();
        const result = await fn();
        const responseTime = Date.now() - startTime;

        // Update stats
        this.requestStats.total++;
        this.requestStats.success++;
        this.successCount++;
        this.failureCount = 0;

        resolve(result);
      } catch (error) {
        this.requestStats.total++;
        this.requestStats.failed++;
        this.failureCount++;

        // Auto retry with exponential backoff
        if (retries < this.config.retryAttempts && this.config.exponentialBackoff) {
          const backoffDelay = Math.min(
            this.config.initialRetryDelay * Math.pow(this.config.backoffMultiplier, retries),
            this.config.maxRetryDelay
          );
          
          console.log(`⚠️  Request failed (retry ${retries + 1}/${this.config.retryAttempts}), waiting ${backoffDelay}ms...`);
          this.requestStats.retried++;
          
          await new Promise(r => setTimeout(r, backoffDelay));
          this.queue.push({ fn, resolve, reject, context, retries: retries + 1 });
        } else {
          reject(error);
        }
      } finally {
        this.executing--;
        this.processQueue();
      }
    }
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.config.baseDelay - timeSinceLastRequest);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  getStats() {
    return {
      ...this.requestStats,
      queueLength: this.queue.length,
      executing: this.executing,
      failureStreak: this.failureCount,
    };
  }
}

// Adaptive Rate Limiter - Tự động điều chỉnh based on responses
class AdaptiveRateLimiter {
  constructor(baseName, baseConfig) {
    this.name = baseName;
    this.config = { ...baseConfig };
    this.originalDelay = baseConfig.baseDelay;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.backoffLevel = 0;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses++;

    // Nếu 10 requests liên tiếp thành công, giảm delay 5%
    if (this.consecutiveSuccesses >= 10 && this.backoffLevel > 0) {
      this.backoffLevel--;
      this.updateDelay();
      console.log(`✅ ${this.name}: Reducing delay to ${this.config.baseDelay}ms`);
    }
  }

  recordFailure(errorCode) {
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures++;

    // 429 (Rate Limited) hoặc 503 (Service Unavailable)
    if (errorCode === 429 || errorCode === 503) {
      this.backoffLevel++;
      this.updateDelay();
      console.log(`⚠️  ${this.name}: Rate limit detected, increasing delay to ${this.config.baseDelay}ms`);
    }
  }

  updateDelay() {
    // Increase delay by 20% per backoff level
    this.config.baseDelay = Math.round(
      this.originalDelay * Math.pow(1.2, this.backoffLevel)
    );
  }

  reset() {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.backoffLevel = 0;
    this.config.baseDelay = this.originalDelay;
  }
}

// Request Cache Manager
class RequestCacheManager {
  constructor(ttl = 60 * 60 * 1000) { // 1 hour default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTtl) {
    const expiresAt = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl,
    };
  }
}

module.exports = {
  STEAM_API_CONFIG,
  STEAMGRIDDB_CONFIG,
  WEBTORRENT_CONFIG,
  RequestPoolManager,
  AdaptiveRateLimiter,
  RequestCacheManager,
};
