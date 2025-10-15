// Load environment configuration (includes dotenv setup)
const config = require('./src/config/environment');

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
const analyticsRoutes = require("./src/routes/AnalyticsRoutes"); // Handles Google Analytics routes
const settingsRoutes = require("./src/routes/SettingsRoutes"); // Handles settings management routes
const bannerRoutes = require("./src/routes/BannerRoutes"); // Handles banner management routes
const joinUsRoutes = require("./src/routes/JoinUsRoutes"); // Handles join us post management routes
const itemMediaRoutes = require("./src/routes/ItemMediaRoutes"); // Handles item media upload routes
const faqRoutes = require("./src/routes/FaqRoutes"); // Handles FAQ management routes
const configRoutes = require("./src/routes/ConfigRoutes"); // Handles configuration endpoints (e.g., Razorpay key)
const morgan = require("morgan");

const app = express();
// Initialize the Express application

// Apply middleware
app.use(morgan('dev')); // Use Morgan for HTTP request logging

// Validate environment configuration
config.validate();

// Configure CORS using environment config
app.use(cors(config.cors)); // Enable CORS for all routes to allow cross-origin requests
app.use(express.json({ limit: '10mb' })); // Parse incoming JSON requests with increased size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data with extended option for complex objects

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
app.use("/api/razorpay", razorpayRoutes); // Payment processing routes using Razorpay
app.use("/api/userProfile", userProfileRoutes); // User profile management routes
app.use("/api/config", configRoutes); // Configuration endpoints (Razorpay key, environment info)

// Contabo S3 public access configuration routes
const ContaboRoutes = require("./src/routes/ContaboRoutes");
app.use("/api/contabo", ContaboRoutes); // Contabo S3 configuration and testing

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
app.use("/api/cart-abandonment", cartAbandonmentRoutes); // Mount cart abandonment recovery routes
app.use("/api/analytics", analyticsRoutes); // Mount Google Analytics routes
app.use("/api/settings", settingsRoutes); // Mount settings management routes
app.use("/api/banners", bannerRoutes); // Mount banner management routes
app.use("/api/joinus", joinUsRoutes); // Mount join us post management routes
app.use("/api/item-media", itemMediaRoutes); // Mount item media upload routes
app.use("/api/faqs", faqRoutes); // Mount FAQ management routes

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

// Start the server using environment configuration
app.listen(config.server.port, config.server.host, () => {
    console.log(`🚀 Yoraa Backend Server LIVE on http://${config.server.host}:${config.server.port}`);
    console.log(`🌐 Environment: ${config.server.environment}`);
    console.log(`🔗 API Base URL: ${config.api.baseUrl}`);
    console.log(`� Database: ${config.database.uri.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB'}`);
    console.log(`✅ All APIs Ready: Shiprocket + Authentication + E-commerce`);
    console.log(`🔐 Auth Modes: Guest Users + Authenticated Users`);
});