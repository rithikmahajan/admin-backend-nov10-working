# FAQ Loading Error - Fix Guide

## Problem
The mobile app is showing:
- "Failed to load FAQs from server. Showing cached content."
- "FAQ Loading Error - Unable to load FAQs from server. Showing default content."
- Random garbage text in FAQ list (rrrrr, gggggg, etc.) - likely from default/cached data

## Root Causes

### 1. **Server Connection Issue**
- The mobile app is trying to connect to the wrong server URL
- Local development: Should use `http://localhost:8001/api/faqs`
- Production: Should use your production URL

### 2. **No Server Response**
- Backend server not running
- Network connectivity issues
- CORS or firewall blocking requests

### 3. **Mobile App Caching**
- App is showing stale cached data when server is unreachable
- Default/fallback FAQ data contains test/garbage text

## Backend Fix (Already Implemented ✅)

The backend `/api/faqs` endpoint is working correctly and returns:

```json
{
  "success": true,
  "message": "FAQs retrieved successfully",
  "data": {
    "faqs": [...],
    "pagination": {...}
  },
  "faqs": [...] // Mobile app compatibility
}
```

## Mobile App Fixes Required

### Fix 1: Update API Base URL

**For Local Development (Metro/Expo):**
```javascript
// In your API config file
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8001/api'  // For iOS simulator
  // ? 'http://10.0.2.2:8001/api'  // For Android emulator
  : 'https://your-production-url.com/api';
```

**For TestFlight/Production:**
```javascript
const API_BASE_URL = 'https://your-production-url.com/api';
```

### Fix 2: Clear Cached FAQ Data

Add a function to clear cached FAQs:

```javascript
// In your FAQ store/context
export const clearCachedFaqs = async () => {
  try {
    await AsyncStorage.removeItem('@faqs_cache');
    await AsyncStorage.removeItem('@faqs_last_updated');
    console.log('FAQ cache cleared');
  } catch (error) {
    console.error('Error clearing FAQ cache:', error);
  }
};
```

### Fix 3: Improve Error Handling

```javascript
// In your FAQ API call
export const fetchFaqs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/faqs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.faqs) {
      // Save to cache
      await AsyncStorage.setItem('@faqs_cache', JSON.stringify(data.faqs));
      await AsyncStorage.setItem('@faqs_last_updated', new Date().toISOString());
      return data.faqs;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    
    // Try to load from cache
    try {
      const cachedFaqs = await AsyncStorage.getItem('@faqs_cache');
      if (cachedFaqs) {
        console.log('Loading FAQs from cache');
        return JSON.parse(cachedFaqs);
      }
    } catch (cacheError) {
      console.error('Error loading cached FAQs:', cacheError);
    }
    
    // Return empty array instead of default/garbage data
    return [];
  }
};
```

### Fix 4: Remove Default/Garbage FAQ Data

**Find and remove any hardcoded FAQ data like:**
```javascript
// ❌ REMOVE THIS
const DEFAULT_FAQS = [
  { question: 'rrrrfhfvfhvfhvfhvfhvf', answer: '...' },
  { question: 'rrrrrr. rrr', answer: '...' },
  { question: 'ggggggggggg', answer: '...' },
  // etc.
];
```

**Replace with:**
```javascript
// ✅ USE THIS
const DEFAULT_FAQS = []; // Empty array or remove entirely
```

## Testing Steps

### 1. Test Backend Endpoint
```bash
# Make sure server is running
npm start

# Test the endpoint
curl http://localhost:8001/api/faqs
```

### 2. Add Sample FAQ Data (If Database is Empty)
Use the admin panel or run this test script to add FAQs.

### 3. Clear Mobile App Cache
```javascript
// Add a button in development mode
<Button onPress={clearCachedFaqs} title="Clear FAQ Cache (Dev)" />
```

### 4. Rebuild the App
```bash
# For React Native
cd mobile-app
npx react-native start --reset-cache

# For Expo
expo start -c
```

### 5. Verify Network Requests
- Use React Native Debugger or Flipper
- Check network tab to see if FAQ requests are being made
- Verify the correct URL is being called

## Quick Fix Commands

### Backend (Start Server)
```bash
cd /Users/rithikmahajan/Desktop/oct-7-backend-admin-main
npm start
```

### Mobile App (Clear Cache & Restart)
```bash
cd your-mobile-app-directory
npx react-native start --reset-cache
# or
expo start -c
```

## Production Deployment

When deploying to production:

1. **Update API URL in mobile app config**
   ```javascript
   const API_BASE_URL = 'https://your-production-url.com/api';
   ```

2. **Test the FAQ endpoint is accessible**
   ```bash
   curl https://your-production-url.com/api/faqs
   ```

3. **Rebuild the app with production config**

4. **Submit to App Store/Play Store**

## Expected Response Format

The `/api/faqs` endpoint returns:

```json
{
  "success": true,
  "message": "FAQs retrieved successfully",
  "data": {
    "faqs": [
      {
        "_id": "...",
        "title": "WHAT DO I NEED TO KNOW BEFORE SIGNING UP TO THE YORAA MEMBERSHIP?",
        "detail": "All your purchases in store and online are rewarded with points...",
        "category": "membership",
        "isActive": true,
        "priority": 1,
        "question": "WHAT DO I NEED TO KNOW BEFORE SIGNING UP TO THE YORAA MEMBERSHIP?",
        "answer": "All your purchases in store and online are rewarded with points...",
        "order": 1
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "faqs": [...]
}
```

## Support

If the issue persists:

1. Check backend logs for errors
2. Check mobile app logs/console for network errors
3. Verify the server is accessible from the device/emulator
4. Check CORS settings if cross-origin
5. Ensure the database has FAQ data

## Related Files

- Backend Controller: `src/controllers/FaqController.js`
- Backend Routes: `src/routes/FaqRoutes.js`
- Backend Model: `src/models/FAQ.js`
- Server Entry: `index.js` (mounted at `/api/faqs`)
