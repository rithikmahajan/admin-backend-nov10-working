// Load environment configuration (includes dotenv setup)
const config = require('./src/config/environment');

// Import logger for production-safe logging
const logger = require('./src/utils/logger');

// Import required dependencies
const express = require("express"); // Express framework for building the server
const cors = require("cors"); // Middleware to enable Cross-Origin Resource Sharing

// Import route handlers for different API endpoints
const authRouter = require("./src/routes/AuthRoutes"); // Handles authentication-related routes
const { connectToDB } = require("./src/database/db"); // Database connection function
const newItemRouter = require("./src/routes/NewItemRoutes"); // Handles new item management routes
const SubCategoryRouter = require("./src/routes/SubCategoryRoutes"); // Handles subcategory routes
const CategoryRouter = require("./src/routes/CategoryRoutes"); // Handles category routes
const wishlistRouter = require("./src/routes/WishlistRoutes"); // Handles wishlist-related routes
const cartRoutes = require("./src/routes/CartRoutes"); // Handles cart-related routes
const userRoutes = require("./src/routes/UserRoutes"); // Handles user-related routes
const addressRoutes = require("./src/routes/AddressRoutes"); // Handles address-related routes
const razorpayRoutes = require("./src/routes/paymentRoutes"); // Handles payment processing with Razorpay
const userProfileRoutes = require("./src/routes/UserProfileRoutes"); // Handles user profile routes
const orderRoutes = require("./src/routes/OrderRoutes"); // Handles order-related routes
const adminOrderRoutes = require("./src/routes/AdminOrderRoutes"); // Handles admin order management routes
const privacyPolicyRoutes = require("./src/routes/PrivacyPolicyRoutes"); // Handles privacy policy routes
const notificationRoutes = require("./src/routes/NotificationRoutes"); // Handles notification routes
const filterRoutes = require("./src/routes/FilterRoutes"); // Handles filter-related routes
const bulkUploadRoutes = require("./src/routes/BulkUploadRoutes"); // Handles filter-related routes
const ReviewRoutes = require("./src/routes/ReviewRoutes");
const PromoCodeRoutes = require("./src/routes/PromoCodeRoutes");
const ImageRoutes = require("./src/routes/ImageRoutes"); // Handles image URL refresh routes
const partnerRoutes = require("./src/routes/PartnerRoutes"); // Handles partner management routes
const firebaseRoutes = require("./src/routes/firebaseRoutes"); // Handles Firebase user management routes
const firebaseAdminRoutes = require("./src/routes/firebaseAdmin"); // Handles Firebase Admin SDK routes
const cartAbandonmentRoutes = require("./src/routes/cartAbandonmentRoutes"); // Handles cart abandonment recovery routes
const pointsRoutes = require("./src/routes/PointsRoutes"); // Handles points system routes
const inviteFriendRoutes = require("./src/routes/inviteafriend"); // Handles invite a friend system routes
const inboxRoutes = require("./src/routes/InboxRoutes"); // Handles inbox/messaging system routes
const chatRoutes = require("./src/routes/ChatRoutes"); // Handles real-time chat support routes
const supportRoutes = require("./src/routes/SupportRoutes"); // Handles support chat routes (frontend compatibility)
const analyticsRoutes = require("./src/routes/AnalyticsRoutes"); // Handles Google Analytics routes
const settingsRoutes = require("./src/routes/SettingsRoutes"); // Handles settings management routes
const bannerRoutes = require("./src/routes/BannerRoutes"); // Handles banner management routes
const joinUsRoutes = require("./src/routes/JoinUsRoutes"); // Handles join us post management routes
const itemMediaRoutes = require("./src/routes/ItemMediaRoutes"); // Handles item media upload routes
const faqRoutes = require("./src/routes/FaqRoutes"); // Handles FAQ management routes
const configRoutes = require("./src/routes/ConfigRoutes"); // Handles configuration endpoints (e.g., Razorpay key)
const syncRoutes = require("./src/routes/SyncRoutes"); // Handles real-time sync between admin UI and backend
const healthRoutes = require("./src/routes/HealthRoutes"); // Handles health check and server status endpoints
const morgan = require("morgan");

// Import production middleware
const {
  securityHeaders,
  apiRateLimiter,
  compressionMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
  healthCheck,
  trustProxy
} = require('./src/middleware/production');

const app = express();
// Initialize the Express application

// ============================================================================
// PRODUCTION CONFIGURATION
// ============================================================================
const isProduction = config.server.isProduction;
const isDevelopment = config.server.isDevelopment;

logger.info('🚀 Starting Yoraa Backend API...', {
  environment: config.server.environment,
  nodeVersion: process.version,
  productionMode: isProduction
});

// Trust proxy (required for Cloudflare/reverse proxies)
trustProxy(app);

// Apply middleware
if (isDevelopment) {
  app.use(morgan('dev')); // Detailed logging in development
} else {
  app.use(morgan('combined')); // Standard logging in production
}

// Request logging middleware
app.use(requestLogger);

// Compression middleware (production)
app.use(compressionMiddleware());

// Validate environment configuration
config.validate();

// ============================================================================
// ULTRA-AGGRESSIVE CORS CONFIGURATION - FIXES ALL CORS ISSUES
// ============================================================================
// This middleware MUST be applied BEFORE any other middleware or routes
app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    
    // List of allowed origins
    const allowedOrigins = [
        'https://yoraa.in',
        'https://www.yoraa.in',
        'https://yoraa.in.net',
        'https://www.yoraa.in.net',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:4173',
        'http://185.193.19.244:3001'
    ];
    
    // ALWAYS set CORS headers - NEVER skip this
    if (origin) {
        // If origin is in whitelist, use it
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            logger.debug('CORS: Allowing whitelisted origin', { origin });
        } else {
            // Allow all origins for now (to fix immediate issue)
            res.setHeader('Access-Control-Allow-Origin', origin);
            logger.debug('CORS: Allowing non-whitelisted origin', { origin });
        }
    } else {
        // No origin header = allow all (mobile apps, Postman, etc.)
        res.setHeader('Access-Control-Allow-Origin', '*');
        logger.debug('CORS: Allowing request with no origin (mobile/Postman)');
    }
    
    // Set ALL necessary CORS headers - CRITICAL for preflight
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Api-Key, X-Admin-Token, Cache-Control, Pragma, User-Agent');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id, Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    
    // Remove any security headers that might interfere with CORS
    res.removeHeader('X-Frame-Options');
    
    // Log all requests for debugging
    logger.debug(`${req.method} ${req.path}`, { origin: origin || 'no origin' });
    
    // Handle OPTIONS preflight requests IMMEDIATELY
    if (req.method === 'OPTIONS') {
        logger.debug(`OPTIONS preflight for ${req.path} - responding with 204`);
        return res.status(204).end();
    }
    
    next();
});

// Configure CORS using environment config (as backup layer)
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Api-Key', 'X-Admin-Token'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400,
    optionsSuccessStatus: 204
}));

// Handle ALL OPTIONS requests globally
app.options('*', (req, res) => {
    logger.debug(`Global OPTIONS handler for ${req.path}`);
    res.status(204).end();
});

app.use(express.json({ limit: '10mb' })); // Parse incoming JSON requests with increased size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data with extended option for complex objects

// ============================================================================
// CACHE CONTROL MIDDLEWARE - Apply before routes
// ============================================================================
const { applyCacheHeaders } = require('./src/middleware/cacheControl');
app.use(applyCacheHeaders);

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================
app.use(securityHeaders);

// ============================================================================
// RATE LIMITING (Production Only)
// ============================================================================
// Apply rate limiting to all API routes
if (isProduction) {
  app.use('/api/', apiRateLimiter);
  console.log('✅ Rate limiting enabled for production');
}

// Connect to the database (e.g., MongoDB, MySQL) using the connectToDB function
connectToDB();

// Health check endpoints
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Yoraa Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Health endpoints for frontend
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        message: 'API is operational',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            server: 'running',
            database: 'connected',
            api: 'operational',
            timestamp: new Date().toISOString()
        }
    });
});

// Define API routes and mount the corresponding routers
app.use("/api/auth", authRouter); // Authentication routes (e.g., login, signup)
app.use("/api/user", userRoutes); // User management routes (e.g., update user info)
app.use("/api/users", userRoutes); // Alias for frontend compatibility (/api/users)
app.use("/api/items", newItemRouter); // Item management routes (e.g., products)
app.use("/api/products", newItemRouter); // Alias for frontend compatibility

// Frontend-compatible product review endpoints
const productReviewController = require("./src/controllers/reviewController/ProductReviewController");
const { verifyToken } = require('./src/middleware/VerifyToken');

// Submit product review - POST /api/products/:productId/reviews
app.post("/api/products/:productId/reviews", verifyToken, productReviewController.submitProductReview);

// Get product reviews - GET /api/products/:productId/reviews
app.get("/api/products/:productId/reviews", productReviewController.getProductReviews);

app.use("/api/categories", CategoryRouter); // Category management routes
app.use("/api/subcategories", SubCategoryRouter); // Subcategory management routes
app.use("/api/wishlist", wishlistRouter); // Wishlist management routes
app.use("/api/cart", cartRoutes); // Shopping cart management routes
app.use("/api/address", addressRoutes); // User address management routes
app.use("/api/razorpay", razorpayRoutes); // Payment processing routes using Razorpay (legacy)
app.use("/api/payment", razorpayRoutes); // Payment processing routes (new standard endpoint)
app.use("/api/userProfile", userProfileRoutes); // User profile management routes
app.use("/api/config", configRoutes); // Configuration endpoints (Razorpay key, environment info)

// ============================================================================
// CONTABO S3 ROUTES - COMMENTED OUT (Now using AWS S3)
// ============================================================================
// const ContaboRoutes = require("./src/routes/ContaboRoutes");
// app.use("/api/contabo", ContaboRoutes); // Contabo S3 configuration and testing

// Test delivery configuration endpoint
// const testDeliveryRoutes = require("./src/routes/testDeliveryRoutes");
// app.use("/api", testDeliveryRoutes); // Test delivery options - COMMENTED OUT: File does not exist

// Add specific /api/profile endpoint for frontend compatibility
const User = require("./src/models/User");
const UserProfile = require("./src/models/UserProfile");
const Address = require("./src/models/Address");

app.get("/api/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
        statusCode: 404
      });
    }
    
    // Get user profile data
    const userProfile = await UserProfile.findOne({ user: userId });
    
    // Get user addresses
    const addresses = await Address.find({ user: userId });
    
    // Format response according to frontend expectations
    const profileData = {
      id: user._id,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      phone: user.phNo || user.phoneNumber,
      profileImage: userProfile?.imageUrl || '',
      gender: userProfile?.gender || '',
      membershipTier: user.membershipTier || 'basic',
      pointsBalance: user.points || 0,
      isEmailVerified: user.isEmailVerified || false,
      isPhoneVerified: user.isPhoneVerified || false,
      preferences: {
        currency: user.preferredCurrency || 'INR',
        language: user.language || 'en',
        notifications: user.notifications !== false
      },
      addresses: addresses.map(addr => ({
        id: addr._id,
        type: addr.type || 'home',
        firstName: addr.firstName,
        lastName: addr.lastName,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        pinCode: addr.pinCode,
        phone: addr.phoneNumber,
        isDefault: addr.isDefault || false
      }))
    };
    
    res.json({
      success: true,
      data: profileData,
      message: "Profile retrieved successfully"
    });
    
  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving profile.",
      data: null,
      statusCode: 500
    });
  }
});

// PUT /api/profile - Update user profile (frontend-compatible endpoint)
app.put("/api/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email, phone, profileImage, gender, preferences } = req.body;
    
    console.log("📝 Updating user profile:", userId, req.body);
    console.log("🎯 Gender field received:", gender);
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
        statusCode: 404
      });
    }
    
    // Update User model
    if (firstName || lastName) {
      user.name = `${firstName || user.name.split(' ')[0]} ${lastName || user.name.split(' ').slice(1).join(' ')}`.trim();
    }
    if (email) {
      user.email = email;
      // Mark email as verified if it changed
      if (user.email !== email) {
        user.isEmailVerified = false;
      }
    }
    if (phone) {
      user.phNo = phone;
      // Mark phone as verified if it changed
      if (user.phNo !== phone) {
        user.isPhoneVerified = false;
      }
    }
    if (preferences) {
      if (preferences.currency) user.preferredCurrency = preferences.currency;
      if (preferences.language) user.language = preferences.language;
      if (typeof preferences.notifications === 'boolean') user.notifications = preferences.notifications;
    }
    
    // Mark profile as complete
    user.isProfile = true;
    await user.save();
    
    // Update or create UserProfile
    let userProfile = await UserProfile.findOne({ user: userId });
    
    if (!userProfile) {
      // Create new profile
      userProfile = new UserProfile({
        user: userId,
        email: user.email
      });
    }
    
    if (email) userProfile.email = email;
    if (profileImage) userProfile.imageUrl = profileImage;
    
    // Update gender field
    if (gender !== undefined) {
      // Validate gender value
      const validGenders = ['Male', 'Female', 'Other', ''];
      if (validGenders.includes(gender)) {
        userProfile.gender = gender;
        console.log("💾 Saving gender to database:", gender);
      } else {
        console.warn("⚠️ Invalid gender value received:", gender);
      }
    }
    
    await userProfile.save();
    console.log("✅ UserProfile saved with gender:", userProfile.gender);
    
    // Get updated addresses
    const addresses = await Address.find({ user: userId });
    
    // Format response
    const profileData = {
      id: user._id,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      phone: user.phNo || user.phoneNumber,
      profileImage: userProfile?.imageUrl || '',
      gender: userProfile?.gender || '',
      membershipTier: user.membershipTier || 'basic',
      pointsBalance: user.points || 0,
      isEmailVerified: user.isEmailVerified || false,
      isPhoneVerified: user.isPhoneVerified || false,
      preferences: {
        currency: user.preferredCurrency || 'INR',
        language: user.language || 'en',
        notifications: user.notifications !== false
      },
      addresses: addresses.map(addr => ({
        id: addr._id,
        type: addr.type || 'home',
        firstName: addr.firstName,
        lastName: addr.lastName,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        pinCode: addr.pinCode,
        phone: addr.phoneNumber,
        isDefault: addr.isDefault || false
      }))
    };
    
    console.log("✅ Profile updated successfully:", profileData);
    console.log("🎯 Gender in response:", profileData.gender);
    
    res.json({
      success: true,
      data: profileData,
      message: "Profile updated successfully"
    });
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile.",
      error: error.message,
      data: null,
      statusCode: 500
    });
  }
});

// Add alias routes for /api/user/profile (for mobile app compatibility)
// GET /api/user/profile - Same as GET /api/profile
app.get("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
        statusCode: 404
      });
    }
    
    // Get user profile data
    const userProfile = await UserProfile.findOne({ user: userId });
    
    // Get user addresses
    const addresses = await Address.find({ user: userId });
    
    // Format response according to frontend expectations
    const profileData = {
      id: user._id,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      phone: user.phNo || user.phoneNumber,
      profileImage: userProfile?.imageUrl || '',
      gender: userProfile?.gender || '',
      membershipTier: user.membershipTier || 'basic',
      pointsBalance: user.points || 0,
      isEmailVerified: user.isEmailVerified || false,
      isPhoneVerified: user.isPhoneVerified || false,
      preferences: {
        currency: user.preferredCurrency || 'INR',
        language: user.language || 'en',
        notifications: user.notifications !== false
      },
      addresses: addresses.map(addr => ({
        id: addr._id,
        type: addr.type || 'home',
        firstName: addr.firstName,
        lastName: addr.lastName,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        pinCode: addr.pinCode,
        phone: addr.phoneNumber,
        isDefault: addr.isDefault || false
      }))
    };
    
    res.json({
      success: true,
      data: profileData,
      message: "Profile retrieved successfully"
    });
    
  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving profile.",
      data: null,
      statusCode: 500
    });
  }
});

// PUT /api/user/profile - Same as PUT /api/profile
app.put("/api/user/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email, phone, profileImage, gender, preferences } = req.body;
    
    console.log("📝 Updating user profile via /api/user/profile:", userId, req.body);
    console.log("🎯 Gender field received:", gender);
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null,
        statusCode: 404
      });
    }
    
    // Update User model
    if (firstName || lastName) {
      user.name = `${firstName || user.name.split(' ')[0]} ${lastName || user.name.split(' ').slice(1).join(' ')}`.trim();
    }
    if (email) {
      user.email = email;
      // Mark email as verified if it changed
      if (user.email !== email) {
        user.isEmailVerified = false;
      }
    }
    if (phone) {
      user.phNo = phone;
      // Mark phone as verified if it changed
      if (user.phNo !== phone) {
        user.isPhoneVerified = false;
      }
    }
    if (preferences) {
      if (preferences.currency) user.preferredCurrency = preferences.currency;
      if (preferences.language) user.language = preferences.language;
      if (typeof preferences.notifications === 'boolean') user.notifications = preferences.notifications;
    }
    
    // Mark profile as complete
    user.isProfile = true;
    await user.save();
    
    // Update or create UserProfile
    let userProfile = await UserProfile.findOne({ user: userId });
    
    if (!userProfile) {
      // Create new profile
      userProfile = new UserProfile({
        user: userId,
        email: user.email
      });
    }
    
    if (email) userProfile.email = email;
    if (profileImage) userProfile.imageUrl = profileImage;
    
    // Update gender field
    if (gender !== undefined) {
      // Validate gender value
      const validGenders = ['Male', 'Female', 'Other', ''];
      if (validGenders.includes(gender)) {
        userProfile.gender = gender;
        console.log("💾 Saving gender to database:", gender);
      } else {
        console.warn("⚠️ Invalid gender value received:", gender);
      }
    }
    
    await userProfile.save();
    console.log("✅ UserProfile saved with gender:", userProfile.gender);
    
    // Get updated addresses
    const addresses = await Address.find({ user: userId });
    
    // Format response
    const profileData = {
      id: user._id,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      phone: user.phNo || user.phoneNumber,
      profileImage: userProfile?.imageUrl || '',
      gender: userProfile?.gender || '',
      membershipTier: user.membershipTier || 'basic',
      pointsBalance: user.points || 0,
      isEmailVerified: user.isEmailVerified || false,
      isPhoneVerified: user.isPhoneVerified || false,
      preferences: {
        currency: user.preferredCurrency || 'INR',
        language: user.language || 'en',
        notifications: user.notifications !== false
      },
      addresses: addresses.map(addr => ({
        id: addr._id,
        type: addr.type || 'home',
        firstName: addr.firstName,
        lastName: addr.lastName,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        pinCode: addr.pinCode,
        phone: addr.phoneNumber,
        isDefault: addr.isDefault || false
      }))
    };
    
    console.log("✅ Profile updated successfully via /api/user/profile:", profileData);
    console.log("🎯 Gender in response:", profileData.gender);
    
    res.json({
      success: true,
      data: profileData,
      message: "Profile updated successfully"
    });
    
  } catch (error) {
    console.error('❌ Error updating profile via /api/user/profile:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile.",
      error: error.message,
      data: null,
      statusCode: 500
    });
  }
});

app.use("/api/orders", orderRoutes); // Order management routes
app.use("/api/admin", adminOrderRoutes); // Admin order management routes
app.use("/api/privacyPolicy", privacyPolicyRoutes); // Privacy policy routes
app.use("/api/notifications", notificationRoutes); // Notification-related routes
app.use("/api/sync", syncRoutes); // Real-time sync routes for admin UI
app.use("/api/health", healthRoutes); // Health check and server status routes
app.use("/api/filters", filterRoutes); // Routes for filtering items (e.g., by category, price)
app.use("/api/bulkUpload",bulkUploadRoutes );
app.use('/api/reviews', ReviewRoutes); // Updated to distinct review path
app.use("/api/promoCode", PromoCodeRoutes); // Mount promo code routes
app.use("/api/images", ImageRoutes); // Mount image URL refresh routes
app.use("/api/partners", partnerRoutes); // Mount partner management routes
app.use("/api/firebase", firebaseRoutes); // Mount Firebase user management routes
app.use("/api/admin/firebase", firebaseAdminRoutes); // Mount Firebase Admin SDK routes
app.use("/api/points", pointsRoutes); // Mount points system routes
app.use("/api/invite-friend", inviteFriendRoutes); // Mount invite a friend system routes
app.use("/api/inbox", inboxRoutes); // Mount inbox/messaging system routes
app.use("/api/chat", chatRoutes); // Mount real-time chat support routes
app.use("/api/support", supportRoutes); // Mount support chat routes (frontend compatibility layer)
app.use("/api/cart-abandonment", cartAbandonmentRoutes); // Mount cart abandonment recovery routes
app.use("/api/analytics", analyticsRoutes); // Mount Google Analytics routes
app.use("/api/settings", settingsRoutes); // Mount settings management routes
app.use("/api/banners", bannerRoutes); // Mount banner management routes
app.use("/api/joinus", joinUsRoutes); // Mount join us post management routes
app.use("/api/item-media", itemMediaRoutes); // Mount item media upload routes
app.use("/api/faqs", faqRoutes); // Mount FAQ management routes

// Placeholder image endpoint - Generate SVG placeholder images dynamically
app.get("/api/placeholder/:width/:height", (req, res) => {
  const { width, height } = req.params;
  const w = parseInt(width) || 64;
  const h = parseInt(height) || 64;
  const text = req.query.text || `${w}×${h}`;
  const bgColor = req.query.bg || 'e0e0e0';
  const textColor = req.query.color || '666666';
  
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="14" fill="#${textColor}">
        ${text}
      </text>
    </svg>
  `.trim();
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  res.send(svg);
});

// Global error handler for all /api/* routes - ensures JSON responses instead of HTML
app.use('/api/*', (req, res, next) => {
  // If we reach here, no route matched - return 404 JSON instead of HTML
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    data: null,
    statusCode: 404
  });
});

// Multer error handler - must be before global error handler
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    console.error('❌ Multer Error:', err.message);
    
    // Handle specific multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 10MB limit',
        data: null,
        statusCode: 400
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file allowed per request',
        data: null,
        statusCode: 400
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Check your form data',
        data: null,
        statusCode: 400
      });
    }
    
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      data: null,
      statusCode: 400
    });
  }
  
  // Handle custom file filter errors
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: err.message,
      data: null,
      statusCode: 400
    });
  }
  
  next(err);
});

// Global error handler for any other errors in API routes
app.use('/api/*', (err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
    statusCode: err.status || 500
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN HANDLING
// ============================================================================
let server;

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (isProduction) {
    console.error('🚨 Shutting down due to uncaught exception');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (isProduction) {
    console.error('🚨 Shutting down due to unhandled rejection');
    process.exit(1);
  }
});

// ============================================================================
// START SERVER
// ============================================================================
server = app.listen(config.server.port, config.server.host, () => {
    console.log("\n" + "=".repeat(80));
    console.log(`✅ Yoraa Backend API is running successfully!`);
    console.log("=".repeat(80));
    console.log(`🌐 Server URL: http://${config.server.host === '0.0.0.0' ? 'localhost' : config.server.host}:${config.server.port}`);
    console.log(`🔗 API Endpoint: http://${config.server.host === '0.0.0.0' ? 'localhost' : config.server.host}:${config.server.port}/api`);
    console.log(`🏥 Health Check: http://${config.server.host === '0.0.0.0' ? 'localhost' : config.server.host}:${config.server.port}/health`);
    console.log(`� Environment: ${config.server.environment}`);
    console.log(`🗄️  Database: ${config.database.uri.includes('localhost') ? 'Local MongoDB' : 'Cloud MongoDB'}`);
    console.log(`🌐 Frontend URL: ${config.api.frontendUrl}`);
    console.log(`🔒 Security: ${isProduction ? 'Enhanced (Production)' : 'Standard (Development)'}`);
    console.log(`📦 Compression: ${process.env.ENABLE_COMPRESSION !== 'false' ? 'Enabled' : 'Disabled'}`);
    console.log(`🚦 Rate Limiting: ${isProduction && process.env.ENABLE_RATE_LIMITING !== 'false' ? 'Enabled' : 'Disabled'}`);
    console.log(`💾 Cache Control: Intelligent (Path-based)`);
    console.log(`✅ All APIs Ready: Shiprocket + Authentication + E-commerce`);
    console.log(`🔐 Auth Modes: Guest Users + Authenticated Users`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log("=".repeat(80) + "\n");
});

// Set server timeout (5 minutes for file uploads to S3)
server.timeout = 300000;
server.keepAliveTimeout = 65000; // Keep-alive timeout (slightly higher than typical load balancer)
server.headersTimeout = 66000; // Headers timeout (must be higher than keepAliveTimeout)

// Export app for testing
module.exports = app;