// Enhanced error monitoring and debugging utility
class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 50; // Keep last 50 errors
    this.listeners = [];
  }

  logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      stack: error.stack,
      context,
      url: context.url || window.location.href,
      userAgent: navigator.userAgent,
      type: this.categorizeError(error)
    };

    this.errors.unshift(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(errorInfo));

    // Log to console with better formatting
    console.group(`🚨 ${errorInfo.type} Error - ${errorInfo.timestamp}`);
    console.error('Message:', errorInfo.message);
    if (errorInfo.context.url) console.log('URL:', errorInfo.context.url);
    if (errorInfo.context.method) console.log('Method:', errorInfo.context.method);
    if (errorInfo.context.status) console.log('Status:', errorInfo.context.status);
    if (errorInfo.context.data) console.log('Data:', errorInfo.context.data);
    if (errorInfo.stack && !errorInfo.message.includes('timeout')) {
      console.log('Stack:', errorInfo.stack);
    }
    console.groupEnd();
  }

  categorizeError(error) {
    if (error.code === 'ECONNABORTED') return 'TIMEOUT';
    if (error.code === 'ERR_CANCELED') return 'CANCELLED';
    if (error.code === 'ERR_NETWORK') return 'NETWORK';
    if (error.response?.status === 401) return 'AUTH';
    if (error.response?.status === 403) return 'PERMISSION';
    if (error.response?.status === 404) return 'NOT_FOUND';
    if (error.response?.status >= 500) return 'SERVER';
    if (error.response?.status >= 400) return 'CLIENT';
    return 'UNKNOWN';
  }

  getErrorStats() {
    const stats = {};
    this.errors.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1;
    });
    return stats;
  }

  getRecentErrors(count = 10) {
    return this.errors.slice(0, count);
  }

  clearErrors() {
    this.errors = [];
  }

  onError(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  // Debug method to display current status
  debugStatus() {
    console.group('🔍 Error Monitor Status');
    console.log('Total errors:', this.errors.length);
    console.log('Error stats:', this.getErrorStats());
    console.log('Recent errors:', this.getRecentErrors(5));
    console.groupEnd();
  }
}

// Request tracking for duplicate detection
class RequestTracker {
  constructor() {
    this.activeRequests = new Map();
    this.completedRequests = new Map();
    this.maxHistory = 100;
  }

  trackRequest(key, promise) {
    const startTime = Date.now();
    
    // Store active request
    this.activeRequests.set(key, {
      startTime,
      promise
    });

    // Clean up on completion
    const cleanup = (result) => {
      this.activeRequests.delete(key);
      
      // Store in history
      const endTime = Date.now();
      this.completedRequests.set(key, {
        startTime,
        endTime,
        duration: endTime - startTime,
        success: !result.error,
        timestamp: new Date().toISOString()
      });

      // Limit history size
      if (this.completedRequests.size > this.maxHistory) {
        const firstKey = this.completedRequests.keys().next().value;
        this.completedRequests.delete(firstKey);
      }

      return result;
    };

    promise.then(cleanup).catch(cleanup);
    
    return promise;
  }

  isRequestActive(key) {
    return this.activeRequests.has(key);
  }

  getActiveRequest(key) {
    return this.activeRequests.get(key)?.promise;
  }

  getRequestHistory(key) {
    return this.completedRequests.get(key);
  }

  debugRequests() {
    console.group('🔍 Request Tracker Status');
    console.log('Active requests:', Array.from(this.activeRequests.keys()));
    console.log('Recent completed:', Array.from(this.completedRequests.entries()).slice(-10));
    console.groupEnd();
  }
}

// Create singleton instances
export const errorMonitor = new ErrorMonitor();
export const requestTracker = new RequestTracker();

// Enhanced request wrapper with monitoring
export const monitoredRequest = async (key, requestFn, options = {}) => {
  try {
    // Check for duplicate requests
    if (requestTracker.isRequestActive(key)) {
      console.log('⏳ Reusing active request:', key);
      return await requestTracker.getActiveRequest(key);
    }

    console.log('🔄 Starting monitored request:', key);
    
    // Create and track the request
    const promise = requestFn();
    requestTracker.trackRequest(key, promise);
    
    const result = await promise;
    
    console.log('✅ Request completed successfully:', key);
    return result;
    
  } catch (error) {
    errorMonitor.logError(error, {
      requestKey: key,
      url: options.url,
      method: options.method,
      ...options.context
    });
    
    throw error;
  }
};

// Window debugging methods (for browser console)
if (typeof window !== 'undefined') {
  window.debugErrors = () => errorMonitor.debugStatus();
  window.debugRequests = () => requestTracker.debugRequests();
  window.clearErrors = () => errorMonitor.clearErrors();
}
