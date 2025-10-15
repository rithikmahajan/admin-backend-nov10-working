// Request throttling middleware to prevent excessive API calls
const REQUEST_THROTTLE_DURATION = 30 * 1000; // 30 seconds
const requestTimestamps = new Map();

export const requestThrottleMiddleware = (store) => (next) => (action) => {
  // Only throttle specific async thunks
  const throttledActions = [
    'categories/fetchCategories',
    'categories/fetchSubCategories',
  ];

  if (action.type && throttledActions.some(type => action.type.startsWith(type))) {
    const actionType = action.type.split('/')[0] + '/' + action.type.split('/')[1];
    const now = Date.now();
    const lastRequest = requestTimestamps.get(actionType);

    // Check if request is being throttled
    if (lastRequest && (now - lastRequest) < REQUEST_THROTTLE_DURATION) {
      const remainingTime = Math.ceil((REQUEST_THROTTLE_DURATION - (now - lastRequest)) / 1000);
      console.log(`🚫 Throttling ${actionType} - ${remainingTime}s remaining`);
      
      // Return a resolved promise with cached data to prevent errors
      if (action.type.endsWith('/pending')) {
        return Promise.resolve({
          type: action.type.replace('/pending', '/fulfilled'),
          payload: store.getState().categories?.categories || []
        });
      }
      return Promise.resolve(action);
    }

    // Update timestamp for new requests
    if (action.type.endsWith('/pending')) {
      requestTimestamps.set(actionType, now);
    }
  }

  return next(action);
};
