const Points = require("../../models/Points");
const User = require("../../models/User");
const PointsSystemConfig = require("../../models/PointsSystemConfig");
const mongoose = require("mongoose");

// ✅ Get current authenticated user's points information (Frontend API)
exports.getCurrentUserPoints = async (req, res) => {
    try {
        const userId = req.user._id; // Extract userId from authenticated token
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
                error: "Token missing or invalid"
            });
        }

        // Get or create user points record
        const points = await Points.getOrCreateUserPoints(userId);
        
        if (!points) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                error: "No user found with provided token"
            });
        }

        res.status(200).json({
            success: true,
            message: "User points retrieved successfully",
            data: {
                points: points.balance || 0,
                userId: userId.toString(),
                lastUpdated: points.updatedAt || new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error fetching current user points:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ Redeem points for current authenticated user (Frontend API)
exports.redeemCurrentUserPoints = async (req, res) => {
    try {
        const userId = req.user._id; // Extract userId from authenticated token
        const { points: pointsToRedeem, orderId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
                error: "Token missing or invalid"
            });
        }

        // Validate input
        if (!pointsToRedeem || typeof pointsToRedeem !== 'number' || pointsToRedeem <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid points amount",
                error: "Points must be a positive number"
            });
        }

        // Get user points record
        const userPoints = await Points.getOrCreateUserPoints(userId);
        
        if (!userPoints) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                error: "No user found with provided token"
            });
        }

        // Check if user has sufficient points
        if (userPoints.balance < pointsToRedeem) {
            return res.status(400).json({
                success: false,
                message: "Insufficient points",
                error: `User has ${userPoints.balance} points but tried to redeem ${pointsToRedeem}`
            });
        }

        // Calculate discount (1 point = $0.10)
        const discountAmount = pointsToRedeem * 0.10;

        // Process redemption
        await userPoints.redeemPoints(pointsToRedeem, "Order discount redemption");

        // Generate transaction ID
        const transactionId = `txn_${Date.now()}_${userId.toString().slice(-6)}`;

        res.status(200).json({
            success: true,
            message: "Points redeemed successfully",
            data: {
                redeemedPoints: pointsToRedeem,
                remainingPoints: userPoints.balance - pointsToRedeem,
                discountAmount: discountAmount,
                orderId: orderId || null,
                transactionId: transactionId
            }
        });
    } catch (error) {
        console.error("Error redeeming user points:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ Get points system configuration
exports.getSystemConfig = async (req, res) => {
    try {
        const config = await PointsSystemConfig.getConfig();
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error("Error fetching points system config:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system configuration'
        });
    }
};

// ✅ Update points system configuration
exports.updateSystemConfig = async (req, res) => {
    try {
        const config = await PointsSystemConfig.getConfig();
        
        // Update configuration with provided data
        Object.assign(config, req.body);
        await config.save();

        res.status(200).json({
            success: true,
            message: 'System configuration updated successfully',
            data: config
        });
    } catch (error) {
        console.error("Error updating points system config:", error);
        res.status(500).json({
            success: false,
            message: 'Error updating system configuration'
        });
    }
};

// ✅ Get all users with their points information (Firebase + MongoDB integration)
exports.getAllUsersWithPoints = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        // Import Firebase admin here to avoid circular dependencies
        const admin = require("../../config/firebase-admin");

        // Fetch Firebase users
        console.log("🔍 Fetching Firebase users for points management...");
        const firebaseUsers = await admin.auth().listUsers();
        console.log(`✅ Found ${firebaseUsers.users.length} Firebase users`);

        // Build search query for Firebase users
        let filteredFirebaseUsers = firebaseUsers.users;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredFirebaseUsers = firebaseUsers.users.filter(user => 
                (user.displayName && user.displayName.toLowerCase().includes(searchLower)) ||
                (user.email && user.email.toLowerCase().includes(searchLower)) ||
                (user.phoneNumber && user.phoneNumber.includes(search))
            );
        }

        // Apply pagination to Firebase users
        const paginatedFirebaseUsers = filteredFirebaseUsers
            .slice(skip, skip + parseInt(limit));

        // Get MongoDB users that have firebaseUid matching Firebase users
        const firebaseUids = paginatedFirebaseUsers.map(user => user.uid);
        const mongoUsers = await User.find({ 
            firebaseUid: { $in: firebaseUids } 
        }).select('firebaseUid name email phNo');

        // Create a map for quick lookup
        const mongoUserMap = {};
        mongoUsers.forEach(user => {
            mongoUserMap[user.firebaseUid] = user;
        });

        // Get points data for all users
        const userIds = mongoUsers.map(user => user._id);
        const pointsData = await Points.find({ 
            userId: { $in: userIds }, 
            isActive: true 
        });

        // Create points map for quick lookup
        const pointsMap = {};
        pointsData.forEach(points => {
            pointsMap[points.userId.toString()] = points;
        });

        // Combine Firebase users with MongoDB data and points
        const users = paginatedFirebaseUsers.map(firebaseUser => {
            const mongoUser = mongoUserMap[firebaseUser.uid];
            const points = mongoUser ? pointsMap[mongoUser._id.toString()] : null;

            return {
                _id: mongoUser?._id || null,
                firebaseUid: firebaseUser.uid,
                name: firebaseUser.displayName || mongoUser?.name || 'Unknown User',
                email: firebaseUser.email || mongoUser?.email || '',
                phoneNumber: firebaseUser.phoneNumber || mongoUser?.phNo || '',
                emailVerified: firebaseUser.emailVerified,
                disabled: firebaseUser.disabled,
                metadata: {
                    creationTime: firebaseUser.metadata.creationTime,
                    lastSignInTime: firebaseUser.metadata.lastSignInTime,
                },
                pointsInfo: points ? {
                    totalPointsAlloted: points.totalPointsAlloted,
                    totalPointsRedeemed: points.totalPointsRedeemed,
                    balance: points.balance,
                    isActive: points.isActive
                } : {
                    totalPointsAlloted: 0,
                    totalPointsRedeemed: 0,
                    balance: 0,
                    isActive: true
                },
                // Add source info
                source: 'firebase',
                hasMongoAccount: !!mongoUser,
                hasPointsRecord: !!points
            };
        });

        // Calculate pagination info based on Firebase users
        const totalUsers = filteredFirebaseUsers.length;

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers,
                    hasNext: skip + parseInt(limit) < totalUsers,
                    hasPrev: page > 1
                },
                metadata: {
                    totalFirebaseUsers: firebaseUsers.users.length,
                    filteredCount: filteredFirebaseUsers.length,
                    usersWithMongoAccounts: users.filter(u => u.hasMongoAccount).length,
                    usersWithPoints: users.filter(u => u.hasPointsRecord).length
                }
            }
        });
    } catch (error) {
        console.error("Error fetching users with points:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users data',
            details: error.message
        });
    }
};

// ✅ Get user points by user ID
exports.getUserPoints = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const points = await Points.getOrCreateUserPoints(userId);
        
        res.status(200).json({
            success: true,
            data: points
        });
    } catch (error) {
        console.error("Error fetching user points:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user points'
        });
    }
};

// ✅ Allocate points to user (supports both MongoDB userId and Firebase UID)
exports.allocatePoints = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description, generationBasis = 'admin_allocation' } = req.body;

        // Validate input
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'User ID and valid amount are required'
            });
        }

        let mongoUserId = userId;
        let user = null;

        // Check if it's a MongoDB ObjectId or Firebase UID
        if (mongoose.Types.ObjectId.isValid(userId)) {
            // It's a MongoDB ObjectId
            user = await User.findById(userId);
            mongoUserId = userId;
        } else {
            // It might be a Firebase UID, try to find corresponding MongoDB user
            user = await User.findOne({ firebaseUid: userId });
            if (user) {
                mongoUserId = user._id;
            } else {
                // Create a MongoDB user record for the Firebase user
                const admin = require("../../config/firebase-admin");
                try {
                    const firebaseUser = await admin.auth().getUser(userId);
                    user = new User({
                        firebaseUid: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Firebase User',
                        email: firebaseUser.email || '',
                        phNo: firebaseUser.phoneNumber || '',
                        isVerified: firebaseUser.emailVerified
                    });
                    await user.save();
                    mongoUserId = user._id;
                    console.log(`✅ Created MongoDB user record for Firebase UID: ${userId}`);
                } catch (firebaseError) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found in Firebase or MongoDB'
                    });
                }
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get or create points record
        const points = await Points.getOrCreateUserPoints(mongoUserId);
        
        // Add points
        await points.addPoints(
            parseInt(amount), 
            description || `Admin allocated ${amount} points`, 
            generationBasis
        );

        res.status(200).json({
            success: true,
            message: 'Points allocated successfully',
            data: points,
            userInfo: {
                mongoUserId: mongoUserId,
                firebaseUid: user.firebaseUid,
                userName: user.name
            }
        });
    } catch (error) {
        console.error("Error allocating points:", error);
        res.status(500).json({
            success: false,
            message: 'Error allocating points'
        });
    }
};

// ✅ Redeem points from user
exports.redeemPoints = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description } = req.body;

        // Validate input
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'User ID and valid amount are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Get points record
        const points = await Points.findOne({ userId, isActive: true });
        if (!points) {
            return res.status(404).json({
                success: false,
                message: 'User points record not found'
            });
        }

        // Check if system is enabled
        const config = await PointsSystemConfig.getConfig();
        if (!config.isEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Points system is currently disabled'
            });
        }

        // Redeem points
        await points.redeemPoints(
            parseInt(amount),
            description || `Redeemed ${amount} points`
        );

        res.status(200).json({
            success: true,
            message: 'Points redeemed successfully',
            data: points
        });
    } catch (error) {
        console.error("Error redeeming points:", error);
        
        if (error.message === 'Insufficient points balance') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error redeeming points'
        });
    }
};

// ✅ Update user points data
exports.updateUserPoints = async (req, res) => {
    try {
        const { userId } = req.params;
        const { totalPointsAlloted, totalPointsRedeemed, adjustmentDescription } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Get points record
        const points = await Points.getOrCreateUserPoints(userId);
        
        // Calculate differences for transaction logging
        const allotedDiff = totalPointsAlloted - points.totalPointsAlloted;
        const redeemedDiff = totalPointsRedeemed - points.totalPointsRedeemed;

        // Update points
        points.totalPointsAlloted = parseInt(totalPointsAlloted) || 0;
        points.totalPointsRedeemed = parseInt(totalPointsRedeemed) || 0;
        points.balance = points.totalPointsAlloted - points.totalPointsRedeemed;

        // Log adjustment transactions
        if (allotedDiff !== 0) {
            points.transactions.push({
                type: allotedDiff > 0 ? 'credit' : 'debit',
                amount: Math.abs(allotedDiff),
                description: adjustmentDescription || `Admin adjustment: ${allotedDiff > 0 ? 'added' : 'removed'} ${Math.abs(allotedDiff)} points`,
                generationBasis: 'admin_allocation'
            });
        }

        if (redeemedDiff !== 0) {
            points.transactions.push({
                type: 'debit',
                amount: Math.abs(redeemedDiff),
                description: adjustmentDescription || `Admin adjustment: modified redeemed points by ${redeemedDiff}`,
                generationBasis: 'redemption'
            });
        }

        await points.save();

        res.status(200).json({
            success: true,
            message: 'User points updated successfully',
            data: points
        });
    } catch (error) {
        console.error("Error updating user points:", error);
        res.status(500).json({
            success: false,
            message: 'Error updating user points'
        });
    }
};

// ✅ Get user points transaction history
exports.getUserPointsHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const points = await Points.findOne({ userId, isActive: true });
        if (!points) {
            return res.status(404).json({
                success: false,
                message: 'User points record not found'
            });
        }

        // Paginate transactions
        const transactions = points.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice((page - 1) * limit, page * limit);

        const totalTransactions = points.transactions.length;

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pointsSummary: {
                    totalPointsAlloted: points.totalPointsAlloted,
                    totalPointsRedeemed: points.totalPointsRedeemed,
                    balance: points.balance
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalTransactions / limit),
                    totalTransactions,
                    hasNext: page * limit < totalTransactions,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error("Error fetching user points history:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching points history'
        });
    }
};

// ✅ Delete user points record (supports both MongoDB userId and Firebase UID)
exports.deleteUserPoints = async (req, res) => {
    try {
        const { userId } = req.params;

        let mongoUserId = userId;

        // Check if it's a MongoDB ObjectId or Firebase UID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            // It might be a Firebase UID, try to find corresponding MongoDB user
            const user = await User.findOne({ firebaseUid: userId });
            if (user) {
                mongoUserId = user._id;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
        }

        // Soft delete by setting isActive to false
        const points = await Points.findOneAndUpdate(
            { userId: mongoUserId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!points) {
            return res.status(404).json({
                success: false,
                message: 'User points record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User points record deleted successfully',
            data: {
                deletedPointsId: points._id,
                userId: mongoUserId
            }
        });
    } catch (error) {
        console.error("Error deleting user points:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user points record'
        });
    }
};

// ✅ Get points summary statistics
exports.getPointsSummary = async (req, res) => {
    try {
        const summary = await Points.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalUsersWithPoints: { $sum: 1 },
                    totalPointsAllocated: { $sum: '$totalPointsAlloted' },
                    totalPointsRedeemed: { $sum: '$totalPointsRedeemed' },
                    totalPointsBalance: { $sum: '$balance' }
                }
            }
        ]);

        const config = await PointsSystemConfig.getConfig();

        res.status(200).json({
            success: true,
            data: {
                summary: summary[0] || {
                    totalUsersWithPoints: 0,
                    totalPointsAllocated: 0,
                    totalPointsRedeemed: 0,
                    totalPointsBalance: 0
                },
                systemConfig: {
                    isEnabled: config.isEnabled,
                    pointsPerRupee: config.pointsPerRupee
                }
            }
        });
    } catch (error) {
        console.error("Error fetching points summary:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching points summary'
        });
    }
};
