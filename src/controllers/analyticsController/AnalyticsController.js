const { google } = require('googleapis');

// Google Analytics configuration
// IMPORTANT: Use numeric property ID, not measurement ID (G-WDLT9BQG8X)
const PROPERTY_ID = '462361715'; // Your GA4 numeric property ID for yoraa.in
const MEASUREMENT_ID = 'G-WDLT9BQG8X'; // Your GA4 measurement ID for reference

// Initialize Google Analytics Data API
const analyticsData = google.analyticsdata('v1beta');

// Authentication setup (you'll need to set up service account credentials)
const auth = new google.auth.GoogleAuth({
  keyFile: './serviceAccountKey.json', // Path to your service account key file
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics'
  ],
});

/**
 * Generate mock data when Google Analytics API is unavailable
 */
const getMockRealTimeData = () => ({
  activeUsers: Math.floor(Math.random() * 100) + 20,
  recentEvents: [
    { event: 'page_view', count: Math.floor(Math.random() * 50) + 10 },
    { event: 'purchase', count: Math.floor(Math.random() * 5) + 1 },
    { event: 'add_to_cart', count: Math.floor(Math.random() * 20) + 5 }
  ],
  lastUpdated: new Date().toISOString(),
  success: true,
  source: 'mock'
});

const getMockAudienceData = () => ({
  totalUsers: Math.floor(Math.random() * 10000) + 5000,
  newUsers: Math.floor(Math.random() * 2000) + 1000,
  pageViews: Math.floor(Math.random() * 50000) + 25000,
  avgSessionDuration: '2m 45s',
  bounceRate: '35.2%',
  topCountry: 'India',
  topDevice: 'mobile',
  success: true,
  source: 'mock'
});

const getMockAcquisitionData = () => ({
  trafficSources: [
    { source: 'google', medium: 'organic', sessions: 3245, users: 2890 },
    { source: 'direct', medium: '(none)', sessions: 1876, users: 1654 },
    { source: 'facebook', medium: 'social', sessions: 987, users: 823 },
    { source: 'instagram', medium: 'social', sessions: 654, users: 567 }
  ],
  totalSessions: 6762,
  success: true,
  source: 'mock'
});

const getMockBehaviorData = () => ({
  topPage: '/products',
  topPageViews: 8934,
  peakHour: '15:00',
  engagementRate: '67%',
  success: true,
  source: 'mock'
});

const getMockConversionData = () => ({
  totalRevenue: 125000.50,
  totalTransactions: 234,
  totalPurchasers: 198,
  conversionRate: '3.47%',
  topProducts: [
    { name: 'Premium T-Shirt', revenue: 15680.25, quantity: 89 },
    { name: 'Classic Jeans', revenue: 12450.00, quantity: 67 },
    { name: 'Summer Dress', revenue: 9876.75, quantity: 45 }
  ],
  success: true,
  source: 'mock'
});

const getMockDemographicsData = () => ({
  ageGroups: [
    { age: '25-34', users: 2345 },
    { age: '18-24', users: 1876 },
    { age: '35-44', users: 1543 },
    { age: '45-54', users: 987 }
  ],
  genderBreakdown: [
    { gender: 'female', users: 3456 },
    { gender: 'male', users: 2987 },
    { gender: 'other', users: 367 }
  ],
  topCountries: [
    { country: 'India', users: 4567 },
    { country: 'United States', users: 1234 },
    { country: 'United Kingdom', users: 876 }
  ],
  totalUsers: 6810,
  success: true,
  source: 'mock'
});

const getMockTechnologyData = () => ({
  devices: [
    { device: 'mobile', users: 4567 },
    { device: 'desktop', users: 2134 },
    { device: 'tablet', users: 876 }
  ],
  browsers: [
    { browser: 'Chrome', users: 5234 },
    { browser: 'Safari', users: 1876 },
    { browser: 'Firefox', users: 543 }
  ],
  operatingSystems: [
    { os: 'Android', users: 3456 },
    { os: 'iOS', users: 2134 },
    { os: 'Windows', users: 1876 }
  ],
  mobilePercentage: '62.4%',
  success: true,
  source: 'mock'
});

const getMockEventsData = () => ([
  { eventName: 'page_view', eventCount: 12456, totalUsers: 3456 },
  { eventName: 'purchase', eventCount: 234, totalUsers: 198 },
  { eventName: 'add_to_cart', eventCount: 1876, totalUsers: 987 },
  { eventName: 'begin_checkout', eventCount: 567, totalUsers: 456 },
  { eventName: 'view_item', eventCount: 8976, totalUsers: 2345 }
]);

/**
 * Helper function to handle API errors and provide mock data fallback
 * @param {Error} error - The caught error
 * @param {Object} res - Express response object
 * @param {Function} getMockDataFn - Function that returns mock data
 * @param {string} dataType - Type of data for logging
 */
const handleApiErrorWithFallback = (error, res, getMockDataFn, dataType) => {
  console.error(`Error fetching ${dataType} analytics:`, error.message);
  
  // Check if it's an API disabled error and provide mock data
  if (error.message?.includes('API has not been used') || 
      error.message?.includes('disabled') || 
      error.message?.includes('PERMISSION_DENIED')) {
    console.log(`Google Analytics API is disabled. Returning mock ${dataType} data...`);
    const mockData = getMockDataFn();
    
    res.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString(),
      warning: 'Using mock data - Google Analytics API is not enabled'
    });
    return true; // Indicates error was handled with fallback
  }
  
  return false; // Indicates error needs to be handled normally
};

/**
 * Get Real-time Analytics Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRealTimeAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    
    // Configure the real-time request
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dimensions: [
        { name: 'country' },
        { name: 'deviceCategory' }
      ],
      metrics: [
        { name: 'activeUsers' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runRealtimeReport(request);
    
    // Process the response data
    const realTimeData = {
      activeUsers: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
      recentEvents: [], // This would need additional API calls to get events
      lastUpdated: new Date().toISOString(),
      success: true,
      source: 'google_analytics'
    };

    res.json({
      success: true,
      data: realTimeData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    
    // Check if it's an API disabled error and provide mock data
    if (error.message?.includes('API has not been used') || error.message?.includes('disabled')) {
      console.log('Google Analytics API is disabled. Returning mock data...');
      const mockData = getMockRealTimeData();
      
      res.json({
        success: true,
        data: mockData,
        timestamp: new Date().toISOString(),
        warning: 'Using mock data - Google Analytics API is not enabled'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time analytics data',
      details: error.message
    });
  }
};

/**
 * Get Audience Analytics Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAudienceAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    // Configure the audience request
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'country' },
        { name: 'deviceCategory' },
        { name: 'operatingSystem' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    // Process the response data
    const audienceData = {
      totalUsers: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
      newUsers: response.data.totals?.[0]?.metricValues?.[1]?.value || 0,
      pageViews: response.data.totals?.[0]?.metricValues?.[2]?.value || 0,
      avgSessionDuration: formatDuration(response.data.totals?.[0]?.metricValues?.[3]?.value || 0),
      bounceRate: `${Math.round((response.data.totals?.[0]?.metricValues?.[4]?.value || 0) * 100)}%`,
      topCountry: response.data.rows?.[0]?.dimensionValues?.[0]?.value || 'Unknown',
      topCountryPercentage: '45%', // This would need additional calculation
      deviceCategories: processDeviceData(response.data.rows || []),
      success: true
    };

    res.json({
      success: true,
      data: audienceData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching audience analytics:', error);
    
    // Check if it's an API disabled error and provide mock data
    if (error.message?.includes('API has not been used') || error.message?.includes('disabled')) {
      console.log('Google Analytics API is disabled. Returning mock audience data...');
      const mockData = getMockAudienceData();
      
      res.json({
        success: true,
        data: mockData,
        timestamp: new Date().toISOString(),
        warning: 'Using mock data - Google Analytics API is not enabled'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audience analytics data',
      details: error.message
    });
  }
};

/**
 * Get Acquisition Analytics Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAcquisitionAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    // Configure the acquisition request
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'firstUserSource' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    // Process the response data
    const acquisitionData = {
      trafficSources: processTrafficSources(response.data.rows || []),
      totalSessions: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
      success: true
    };

    res.json({
      success: true,
      data: acquisitionData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (handleApiErrorWithFallback(error, res, getMockAcquisitionData, 'acquisition')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch acquisition analytics data',
      details: error.message
    });
  }
};

/**
 * Get Behavior Analytics Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBehaviorAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    // Configure the behavior request
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
        { name: 'hour' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    // Process the response data
    const behaviorData = {
      topPage: response.data.rows?.[0]?.dimensionValues?.[0]?.value || '/',
      topPageViews: response.data.rows?.[0]?.metricValues?.[0]?.value || 0,
      peakHour: findPeakHour(response.data.rows || []),
      engagementRate: `${Math.round((response.data.totals?.[0]?.metricValues?.[2]?.value || 0) * 100)}%`,
      success: true
    };

    res.json({
      success: true,
      data: behaviorData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (handleApiErrorWithFallback(error, res, getMockBehaviorData, 'behavior')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch behavior analytics data',
      details: error.message
    });
  }
};

/**
 * Get Users by Date Range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsersByDate = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '7daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'newUsers' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    res.json({
      success: true,
      data: response.data.rows || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching users by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users by date',
      details: error.message
    });
  }
};

/**
 * Get Session Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessionData = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'sessionsPerUser' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    res.json({
      success: true,
      data: {
        totalSessions: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
        avgSessionDuration: formatDuration(response.data.totals?.[0]?.metricValues?.[1]?.value || 0),
        sessionsPerUser: response.data.totals?.[0]?.metricValues?.[2]?.value || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session data',
      details: error.message
    });
  }
};

/**
 * Get Traffic Sources
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 */
const getTrafficSources = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' }
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    res.json({
      success: true,
      data: processTrafficSources(response.data.rows || []),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching traffic sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch traffic sources',
      details: error.message
    });
  }
};

/**
 * Get Campaign Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCampaignData = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionCampaignName' },
        { name: 'sessionSource' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' }
      ],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    res.json({
      success: true,
      data: response.data.rows || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching campaign data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign data',
      details: error.message
    });
  }
};

/**
 * Get Page Analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPageAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20,
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    res.json({
      success: true,
      data: response.data.rows || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching page analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page analytics',
      details: error.message
    });
  }
};

/**
 * Get Event Analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEventAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' }
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 15,
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    res.json({
      success: true,
      data: response.data.rows || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (handleApiErrorWithFallback(error, res, getMockEventsData, 'event')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event analytics',
      details: error.message
    });
  }
};

// Helper Functions

/**
 * Format duration from seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Process device category data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed device categories
 */
function processDeviceData(rows) {
  const deviceMap = {};
  let totalUsers = 0;

  rows.forEach(row => {
    const deviceCategory = row.dimensionValues?.[1]?.value;
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    
    if (deviceCategory && users) {
      deviceMap[deviceCategory] = (deviceMap[deviceCategory] || 0) + users;
      totalUsers += users;
    }
  });

  return Object.entries(deviceMap).map(([category, users]) => ({
    category: category.toLowerCase(),
    users,
    percentage: `${Math.round((users / totalUsers) * 100)}%`
  }));
}

/**
 * Process traffic sources data
 * @param {Array} rows - Analytics API response rows  
 * @returns {Array} - Processed traffic sources
 */
function processTrafficSources(rows) {
  const totalSessions = rows.reduce((sum, row) => 
    sum + parseInt(row.metricValues?.[0]?.value || 0), 0
  );

  return rows.slice(0, 5).map(row => ({
    source: row.dimensionValues?.[0]?.value || 'Unknown',
    medium: row.dimensionValues?.[1]?.value || 'Unknown',
    sessions: parseInt(row.metricValues?.[0]?.value || 0),
    percentage: `${Math.round((parseInt(row.metricValues?.[0]?.value || 0) / totalSessions) * 100)}%`
  }));
}

/**
 * Find peak hour from analytics data
 * @param {Array} rows - Analytics API response rows
 * @returns {string} - Peak hour formatted as "HH:00"
 */
function findPeakHour(rows) {
  const hourData = {};
  
  rows.forEach(row => {
    const hour = row.dimensionValues?.[2]?.value;
    const pageViews = parseInt(row.metricValues?.[0]?.value || 0);
    
    if (hour !== undefined) {
      hourData[hour] = (hourData[hour] || 0) + pageViews;
    }
  });

  const peakHour = Object.entries(hourData)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '12';
    
  return `${peakHour}:00`;
}

/**
 * Get Conversion Analytics Data (E-commerce)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversionAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'transactionId' },
        { name: 'itemName' }
      ],
      metrics: [
        { name: 'purchaseRevenue' },
        { name: 'itemPurchaseQuantity' },
        { name: 'totalPurchasers' },
        { name: 'conversions' }
      ],
      orderBys: [{ metric: { metricName: 'purchaseRevenue' }, desc: true }],
      limit: 20,
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    // Process conversion data
    const conversionData = {
      totalRevenue: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
      totalTransactions: response.data.totals?.[0]?.metricValues?.[3]?.value || 0,
      totalPurchasers: response.data.totals?.[0]?.metricValues?.[2]?.value || 0,
      conversionRate: calculateConversionRate(response.data.totals || []),
      topProducts: processTopProducts(response.data.rows || []),
      success: true
    };

    res.json({
      success: true,
      data: conversionData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (handleApiErrorWithFallback(error, res, getMockConversionData, 'conversion')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversion analytics data',
      details: error.message
    });
  }
};

/**
 * Get Demographics Analytics Data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDemographicsAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'userAgeBracket' },
        { name: 'userGender' },
        { name: 'country' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'sessions' }
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    // Process demographics data
    const demographicsData = {
      ageGroups: processAgeGroups(response.data.rows || []),
      genderBreakdown: processGenderData(response.data.rows || []),
      topCountries: processCountryData(response.data.rows || []),
      totalUsers: response.data.totals?.[0]?.metricValues?.[0]?.value || 0,
      success: true
    };

    res.json({
      success: true,
      data: demographicsData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (handleApiErrorWithFallback(error, res, getMockDemographicsData, 'demographics')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch demographics analytics data',
      details: error.message
    });
  }
};

/**
 * Get Technology Analytics Data (Devices, Browsers, OS)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTechnologyAnalytics = async (req, res) => {
  try {
    const authClient = await auth.getClient();
    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    
    const request = {
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'deviceCategory' },
        { name: 'operatingSystem' },
        { name: 'browser' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' }
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      auth: authClient,
    };

    const response = await analyticsData.properties.runReport(request);
    
    // Process technology data
    const technologyData = {
      devices: processDeviceData(response.data.rows || []),
      browsers: processBrowserData(response.data.rows || []),
      operatingSystems: processOSData(response.data.rows || []),
      mobilePercentage: calculateMobilePercentage(response.data.rows || []),
      success: true
    };

    res.json({
      success: true,
      data: technologyData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (handleApiErrorWithFallback(error, res, getMockTechnologyData, 'technology')) {
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch technology analytics data',
      details: error.message
    });
  }
};

// Additional Helper Functions

/**
 * Calculate conversion rate
 * @param {Array} totals - Analytics API totals array
 * @returns {string} - Formatted conversion rate
 */
function calculateConversionRate(totals) {
  if (!totals.length) return '0%';
  const conversions = parseFloat(totals[0]?.metricValues?.[3]?.value || 0);
  const sessions = parseFloat(totals[0]?.metricValues?.[2]?.value || 1);
  return `${((conversions / sessions) * 100).toFixed(2)}%`;
}

/**
 * Process top products data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed top products
 */
function processTopProducts(rows) {
  return rows.slice(0, 10).map(row => ({
    name: row.dimensionValues?.[1]?.value || 'Unknown Product',
    transactionId: row.dimensionValues?.[0]?.value || 'Unknown',
    revenue: parseFloat(row.metricValues?.[0]?.value || 0),
    quantity: parseInt(row.metricValues?.[1]?.value || 0)
  }));
}

/**
 * Process age groups data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed age groups
 */
function processAgeGroups(rows) {
  const ageMap = new Map();
  rows.forEach(row => {
    const age = row.dimensionValues?.[0]?.value || 'Unknown';
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    ageMap.set(age, (ageMap.get(age) || 0) + users);
  });
  
  return Array.from(ageMap.entries()).map(([age, users]) => ({ age, users }));
}

/**
 * Process gender data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed gender breakdown
 */
function processGenderData(rows) {
  const genderMap = new Map();
  rows.forEach(row => {
    const gender = row.dimensionValues?.[1]?.value || 'Unknown';
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    genderMap.set(gender, (genderMap.get(gender) || 0) + users);
  });
  
  return Array.from(genderMap.entries()).map(([gender, users]) => ({ gender, users }));
}

/**
 * Process country data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed country data
 */
function processCountryData(rows) {
  const countryMap = new Map();
  rows.forEach(row => {
    const country = row.dimensionValues?.[2]?.value || 'Unknown';
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    countryMap.set(country, (countryMap.get(country) || 0) + users);
  });
  
  return Array.from(countryMap.entries())
    .map(([country, users]) => ({ country, users }))
    .slice(0, 10);
}

/**
 * Process browser data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed browser data
 */
function processBrowserData(rows) {
  const browserMap = new Map();
  rows.forEach(row => {
    const browser = row.dimensionValues?.[2]?.value || 'Unknown';
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    browserMap.set(browser, (browserMap.get(browser) || 0) + users);
  });
  
  return Array.from(browserMap.entries())
    .map(([browser, users]) => ({ browser, users }))
    .slice(0, 10);
}

/**
 * Process operating system data
 * @param {Array} rows - Analytics API response rows
 * @returns {Array} - Processed OS data
 */
function processOSData(rows) {
  const osMap = new Map();
  rows.forEach(row => {
    const os = row.dimensionValues?.[1]?.value || 'Unknown';
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    osMap.set(os, (osMap.get(os) || 0) + users);
  });
  
  return Array.from(osMap.entries())
    .map(([os, users]) => ({ os, users }))
    .slice(0, 10);
}

/**
 * Calculate mobile percentage
 * @param {Array} rows - Analytics API response rows
 * @returns {string} - Mobile percentage
 */
function calculateMobilePercentage(rows) {
  let totalUsers = 0;
  let mobileUsers = 0;
  
  rows.forEach(row => {
    const device = row.dimensionValues?.[0]?.value || '';
    const users = parseInt(row.metricValues?.[0]?.value || 0);
    totalUsers += users;
    if (device.toLowerCase().includes('mobile')) {
      mobileUsers += users;
    }
  });
  
  return totalUsers > 0 ? `${((mobileUsers / totalUsers) * 100).toFixed(1)}%` : '0%';
}

module.exports = {
  getRealTimeAnalytics,
  getAudienceAnalytics,
  getAcquisitionAnalytics,  
  getBehaviorAnalytics,
  getUsersByDate,
  getSessionData,
  getTrafficSources,
  getCampaignData,
  getPageAnalytics,
  getEventAnalytics,
  getConversionAnalytics,
  getDemographicsAnalytics,
  getTechnologyAnalytics
};