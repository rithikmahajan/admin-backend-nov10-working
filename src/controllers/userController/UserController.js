const User = require("../../models/User");
const UserProfile = require("../../models/UserProfile");
const mongoose = require("mongoose");

// ✅ Get the logged-in user's details
exports.getById = async (req, res) => {
    try {
        const id = req.user._id;
        console.log("Fetching user by ID:", id);

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log("Invalid ObjectId format:", id);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Get user first, then check if it exists
        const user = await User.findById(id);
        
        if (!user) {
            console.log("User not found with ID:", id);
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert to plain object and remove sensitive data
        const result = user.toObject();
        delete result.password;

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: 'Error getting your details, please try again later' });
    }
};

// ✅ Update a user's data by ID (protected - users can only update their own data unless admin)
exports.updateById = async (req, res) => {
    try {
        const { id } = req.params;
        const requestingUserId = req.user._id.toString();

        console.log("📝 Update request for user:", id, "by:", requestingUserId);

        // Security check: users can only update their own profile unless they're admin
        if (requestingUserId !== id && !req.user.isAdmin) {
            console.log("❌ Unauthorized update attempt");
            return res.status(403).json({ 
                message: 'You can only update your own profile',
                success: false 
            });
        }

        // Update user with new data and return the updated object
        const updated = await User.findByIdAndUpdate(id, req.body, { 
            new: true,
            runValidators: true // Ensure mongoose validation runs
        });
        
        if (!updated) {
            console.log("User not found for update with ID:", id);
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert to plain object and remove sensitive data
        const result = updated.toObject();
        delete result.password;

        console.log("✅ User updated successfully:", result._id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Error updating user details, please try again later' });
    }
};

// ✅ Get all users with their profiles (excluding passwords)
exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all user profiles and populate the related user info
        const users = await UserProfile.find({}, { password: 0 }).populate('user'); // Adjust field names if needed

        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users, please try again later" });
    }
};

// ✅ Get user's location preference for currency display
exports.getLocationPreference = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Try to get from user's addresses first
        const Address = require("../../models/Address");
        const addresses = await Address.find({ userId }).sort({ isDefault: -1 });
        
        if (addresses.length > 0) {
            const defaultAddress = addresses[0];
            const country = defaultAddress.country?.toLowerCase().trim();
            const isIndia = ['india', 'in'].includes(country);
            
            return res.json({
                success: true,
                data: {
                    countryCode: isIndia ? 'IN' : 'US',
                    currency: isIndia ? 'INR' : 'USD',
                    lastUpdated: defaultAddress.updatedAt,
                    source: 'address'
                }
            });
        }
        
        // Check if user has stored preference
        const user = await User.findById(userId);
        if (user && user.preferredCountry && user.preferredCurrency) {
            return res.json({
                success: true,
                data: {
                    countryCode: user.preferredCountry,
                    currency: user.preferredCurrency,
                    lastUpdated: user.locationUpdatedAt || user.updatedAt,
                    source: 'preference'
                }
            });
        }
        
        // Default to India if no address or preference
        res.json({
            success: true,
            data: {
                countryCode: 'IN',
                currency: 'INR',
                lastUpdated: new Date(),
                source: 'default'
            }
        });
    } catch (error) {
        console.error('Error getting public location preference:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get location preference',
            message: error.message 
        });
    }
};

// ✅ Update user's FCM token for push notifications
exports.updateFcmToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fcmToken, platform } = req.body;
        
        console.log(`📱 FCM Token Update Request - User: ${userId}, Platform: ${platform}`);
        
        // Validate FCM token
        if (!fcmToken) {
            console.log('❌ Missing FCM token');
            return res.status(400).json({ 
                success: false, 
                message: 'FCM token is required' 
            });
        }
        
        // Validate platform (optional but recommended)
        const validPlatforms = ['android', 'ios', 'web'];
        const userPlatform = platform && validPlatforms.includes(platform.toLowerCase()) 
            ? platform.toLowerCase() 
            : 'android'; // Default to android if not specified
        
        // Update user's FCM token and platform
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                fcmToken: fcmToken,
                platform: userPlatform,
                lastLoginAt: new Date() // Update last login time
            },
            { new: true, runValidators: true }
        );
        
        if (!user) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        console.log(`✅ FCM token updated successfully for user ${user._id} on ${userPlatform}`);
        
        res.json({
            success: true,
            message: 'FCM token updated successfully',
            data: {
                userId: user._id,
                fcmToken: user.fcmToken,
                platform: user.platform,
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error updating FCM token:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating FCM token', 
            error: error.message 
        });
    }
};

// ✅ Set user's location preference for currency display (works for both authenticated and guest users)
exports.setLocationPreference = async (req, res) => {
    try {
        const userId = req.user?._id; // Optional - user may not be authenticated
        const { countryCode, currency } = req.body;
        
        console.log(`🌍 Location preference request - User: ${userId ? 'authenticated' : 'guest'}, Country: ${countryCode}, Currency: ${currency}`);
        
        // Validate input
        if (!countryCode || !currency) {
            console.log('❌ Missing required fields:', { countryCode: !!countryCode, currency: !!currency });
            return res.status(400).json({
                success: false,
                error: 'countryCode and currency are required',
                received: { countryCode: countryCode || 'missing', currency: currency || 'missing' }
            });
        }
        
        // Validate currency values - expanded to support international markets
        const validCurrencies = [
            'INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'AED', 'SAR', 
            'JPY', 'CNY', 'HKD', 'THB', 'MYR', 'KRW', 'CHF', 'SEK', 'NOK', 
            'DKK', 'PLN', 'CZK', 'HUF', 'BGN', 'RON', 'HRK', 'RUB', 'BRL',
            'MXN', 'CLP', 'COP', 'PEN', 'UYU', 'ZAR', 'EGP', 'MAD', 'TND',
            'NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZMW', 'BWP', 'MUR', 'SCR'
        ];
        
        const validCountries = [
            // Major markets
            'IN', 'US', 'GB', 'CA', 'AU', 'SG', 'AE', 'SA', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE',
            // European markets  
            'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'BG', 'RO', 'HR', 'GR', 'PT',
            // Asian markets
            'JP', 'CN', 'HK', 'TH', 'MY', 'KR', 'ID', 'PH', 'VN', 'BD', 'PK', 'LK', 'MM', 'KH',
            // Middle East & Africa
            'EG', 'MA', 'TN', 'NG', 'GH', 'KE', 'UG', 'TZ', 'ZM', 'BW', 'MU', 'SC', 'ZA', 'IL',
            // Americas
            'BR', 'MX', 'CL', 'CO', 'PE', 'UY', 'AR', 'EC', 'BO', 'PY', 'CR', 'PA', 'GT', 'HN'
        ];
        
        // Validate input format (basic validation for country/currency codes)
        if (typeof countryCode !== 'string' || countryCode.length !== 2 || 
            typeof currency !== 'string' || currency.length !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Invalid format: countryCode must be 2 characters, currency must be 3 characters'
            });
        }
        
        // Convert to uppercase for consistency
        const normalizedCountryCode = countryCode.toUpperCase();
        const normalizedCurrency = currency.toUpperCase();
        
        if (!validCurrencies.includes(normalizedCurrency) || !validCountries.includes(normalizedCountryCode)) {
            console.log(`❌ Unsupported combination: ${normalizedCountryCode}/${normalizedCurrency}`);
            return res.status(400).json({
                success: false,
                error: `Unsupported location: ${normalizedCountryCode} or currency: ${normalizedCurrency}. Please contact support for expansion.`,
                supportedCurrencies: validCurrencies.slice(0, 10), // Show first 10 as examples
                supportedCountries: validCountries.slice(0, 10)    // Show first 10 as examples
            });
        }
        
        // If user is authenticated, update their preference in database
        if (userId) {
            try {
                await User.findByIdAndUpdate(userId, {
                    preferredCountry: normalizedCountryCode,
                    preferredCurrency: normalizedCurrency,
                    locationUpdatedAt: new Date()
                });
            } catch (dbError) {
                console.log('Database update failed for authenticated user:', dbError.message);
                // Continue - we'll still return success for guest users
            }
        }
        
        // Return success for both authenticated and guest users
        console.log(`✅ Location preference updated: ${normalizedCountryCode}/${normalizedCurrency} for ${userId ? 'authenticated' : 'guest'} user`);
        res.json({
            success: true,
            message: 'Location preference updated successfully',
            data: {
                countryCode: normalizedCountryCode,
                currency: normalizedCurrency,
                userType: userId ? 'authenticated' : 'guest',
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error setting location preference:', error);
        // CRITICAL: Always return JSON, never HTML error page
        res.status(500).json({ 
            success: false, 
            error: 'Failed to set location preference',
            message: error.message 
        });
    }
};

// ✅ Get default location preference for public/unauthenticated users
exports.getPublicLocationPreference = async (req, res) => {
    try {
        const { country, location } = req.query;
        
        // Determine location from query params or default to India
        let userCountry = country || location || 'India';
        
        // Normalize country names
        const countryMappings = {
            'india': 'IN',
            'in': 'IN',
            'usa': 'US',
            'us': 'US',
            'united states': 'US',
            'uk': 'GB',
            'united kingdom': 'GB',
            'canada': 'CA',
            'australia': 'AU'
        };
        
        const normalizedCountry = countryMappings[userCountry.toLowerCase()] || 'IN';
        const currency = normalizedCountry === 'IN' ? 'INR' : 'USD';
        
        res.json({
            success: true,
            data: {
                countryCode: normalizedCountry,
                currency: currency,
                lastUpdated: new Date(),
                source: 'public_default'
            }
        });
    } catch (error) {
        console.error('Error getting public location preference:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get location preference',
            message: error.message 
        });
    }
};
