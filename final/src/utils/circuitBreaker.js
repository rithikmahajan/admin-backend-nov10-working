// Emergency circuit breaker to prevent infinite loops
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 20;
const REQUEST_WINDOW_MS = 60000; // 1 minute
let windowStart = Date.now();

export const circuitBreaker = {
  canMakeRequest: () => {
    const now = Date.now();
    
    // Reset window if needed
    if (now - windowStart > REQUEST_WINDOW_MS) {
      requestCount = 0;
      windowStart = now;
    }
    
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      console.error('🚨 CIRCUIT BREAKER ACTIVATED - Too many requests!');
      return false;
    }
    
    requestCount++;
    return true;
  },
  
  reset: () => {
    requestCount = 0;
    windowStart = Date.now();
    console.log('🔄 Circuit breaker reset');
  },
  
  getStats: () => ({
    requestCount,
    windowStart,
    canMakeRequest: requestCount < MAX_REQUESTS_PER_MINUTE
  })
};

// Global emergency stop
window.EMERGENCY_STOP = false;
window.enableEmergencyStop = () => {
  window.EMERGENCY_STOP = true;
  console.log('🛑 EMERGENCY STOP ACTIVATED - All API calls blocked!');
};
window.disableEmergencyStop = () => {
  window.EMERGENCY_STOP = false;
  console.log('✅ Emergency stop disabled - API calls allowed');
};
