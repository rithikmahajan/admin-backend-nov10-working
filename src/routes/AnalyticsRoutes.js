const express = require('express');
const router = express.Router();

// Google Analytics controller
const {
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
} = require('../controllers/analyticsController/AnalyticsController');

// Authentication middleware
const { isAuthenticated } = require('../middleware/authMiddleware');

// Real-time Analytics Endpoints (no auth required for real-time data)
router.get('/realtime', getRealTimeAnalytics);

// Audience Analytics Endpoints
router.get('/audience', isAuthenticated, getAudienceAnalytics);
router.get('/audience/users-by-date', isAuthenticated, getUsersByDate);
router.get('/audience/sessions', isAuthenticated, getSessionData);

// Acquisition Analytics Endpoints
router.get('/acquisition', isAuthenticated, getAcquisitionAnalytics);
router.get('/acquisition/sources', isAuthenticated, getTrafficSources);
router.get('/acquisition/campaigns', isAuthenticated, getCampaignData);

// Behavior Analytics Endpoints
router.get('/behavior', isAuthenticated, getBehaviorAnalytics);
router.get('/behavior/pages', isAuthenticated, getPageAnalytics);
router.get('/behavior/events', isAuthenticated, getEventAnalytics);

// Conversion Analytics Endpoints (E-commerce)
router.get('/conversions', isAuthenticated, getConversionAnalytics);

// Demographics Analytics Endpoints
router.get('/demographics', isAuthenticated, getDemographicsAnalytics);

// Technology Analytics Endpoints (Devices, Browsers, OS)
router.get('/technology', isAuthenticated, getTechnologyAnalytics);

// Events Analytics Endpoints (redirect to behavior/events for backward compatibility)
router.get('/events', isAuthenticated, getEventAnalytics);

module.exports = router;
