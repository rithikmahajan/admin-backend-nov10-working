/**
 * Request Manager - Prevents duplicate API calls and network loops
 */

class RequestManager {
  constructor() {
    this.activeRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Execute a request with deduplication
   * @param {string} key - Unique identifier for the request
   * @param {Function} requestFunction - Function that returns a Promise
   * @param {boolean} useCache - Whether to use cached result
   * @returns {Promise}
   */
  async execute(key, requestFunction, useCache = true) {
    // Check cache first
    if (useCache && this.cache.has(key)) {
      const cacheEntry = this.cache.get(key);
      const now = Date.now();
      
      if (now - cacheEntry.timestamp < this.cacheTimeout) {
        console.log(`🔄 Using cached result for: ${key}`);
        return cacheEntry.data;
      } else {
        // Cache expired, remove it
        this.cache.delete(key);
      }
    }

    // Check if request is already in progress
    if (this.activeRequests.has(key)) {
      console.log(`⏳ Waiting for existing request: ${key}`);
      return await this.activeRequests.get(key);
    }

    // Execute new request
    console.log(`🔍 Executing fresh request: ${key}`);
    const requestPromise = requestFunction()
      .then(result => {
        // Cache successful results
        if (useCache && result) {
          this.cache.set(key, {
            data: result,
            timestamp: Date.now()
          });
        }
        return result;
      })
      .finally(() => {
        // Remove from active requests when done
        this.activeRequests.delete(key);
      });

    this.activeRequests.set(key, requestPromise);
    return await requestPromise;
  }

  /**
   * Clear cache for a specific key or all cache
   * @param {string} key - Optional key to clear, if not provided clears all
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cleared cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      cachedKeys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const requestManager = new RequestManager();

// Export utility function for easy use
export const dedupedRequest = (key, requestFunction, useCache = true) => {
  return requestManager.execute(key, requestFunction, useCache);
};

// Export function to clear cache
export const clearRequestCache = (key = null) => {
  return requestManager.clearCache(key);
};
