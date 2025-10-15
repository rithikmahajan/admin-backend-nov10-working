// Config Routes - Expose configuration values to frontend
const express = require("express");
const router = express.Router();

/**
 * @route   GET /api/config/razorpay
 * @desc    Get Razorpay public key for frontend
 * @access  Public (only key ID is safe to expose, NOT the secret)
 */
router.get("/razorpay", (req, res) => {
  try {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    
    if (!razorpayKeyId) {
      console.error("❌ RAZORPAY_KEY_ID not configured in environment");
      return res.status(500).json({ 
        error: "Razorpay configuration missing" 
      });
    }

    // Determine if using test or live key
    const isTestMode = razorpayKeyId.startsWith('rzp_test_');
    const isLiveMode = razorpayKeyId.startsWith('rzp_live_');

    console.log(`🔑 Razorpay Key Request: ${isTestMode ? 'TEST MODE' : isLiveMode ? 'LIVE MODE' : 'UNKNOWN MODE'}`);

    res.json({
      keyId: razorpayKeyId,
      mode: isTestMode ? 'test' : isLiveMode ? 'live' : 'unknown',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error("Error fetching Razorpay config:", error);
    res.status(500).json({ 
      error: "Failed to fetch Razorpay configuration" 
    });
  }
});

/**
 * @route   GET /api/config/environment
 * @desc    Get environment information (for debugging)
 * @access  Public (non-sensitive info only)
 */
router.get("/environment", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    apiUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
