const mongoose = require("mongoose");
const InviteFriend = require("../../models/InviteFriend");
const User = require("../../models/User");

// ✅ Get all invite codes with pagination and search
exports.getAllInviteCodes = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { createdBy: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Add status filter if provided
        if (status && ['active', 'inactive', 'expired'].includes(status)) {
            searchQuery.status = status;
        }

        // Get invite codes with user details
        const inviteCodes = await InviteFriend.aggregate([
            { $match: searchQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creatorInfo'
                }
            },
            {
                $addFields: {
                    creatorName: {
                        $ifNull: [
                            { $arrayElemAt: ['$creatorInfo.name', 0] },
                            'Admin'
                        ]
                    }
                }
            },
            {
                $project: {
                    creatorInfo: 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        // Get total count for pagination
        const totalCodes = await InviteFriend.countDocuments(searchQuery);

        res.status(200).json({
            success: true,
            data: {
                inviteCodes,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCodes / limit),
                    totalCodes,
                    hasNext: skip + parseInt(limit) < totalCodes,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error("Error fetching invite codes:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invite codes',
            details: error.message
        });
    }
};

// ✅ Get invite code by ID
exports.getInviteCodeById = async (req, res) => {
    try {
        const { codeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(codeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code ID format'
            });
        }

        const inviteCode = await InviteFriend.findById(codeId)
            .populate('createdBy', 'name email')
            .populate('redeemedBy.userId', 'name email phoneNumber');

        if (!inviteCode) {
            return res.status(404).json({
                success: false,
                message: 'Invite code not found'
            });
        }

        res.status(200).json({
            success: true,
            data: inviteCode
        });
    } catch (error) {
        console.error("Error fetching invite code:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invite code'
        });
    }
};

// ✅ Create new invite code
exports.createInviteCode = async (req, res) => {
    try {
        const {
            code,
            description,
            maxRedemptions = 100,
            discountType = 'percentage',
            discountValue = 10,
            expiryDate,
            isActive = true
        } = req.body;

        // Validate required fields
        if (!code || !description) {
            return res.status(400).json({
                success: false,
                message: 'Code and description are required'
            });
        }

        // Check if code already exists
        const existingCode = await InviteFriend.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: 'Invite code already exists'
            });
        }

        // Create new invite code
        const newInviteCode = new InviteFriend({
            code: code.toUpperCase(),
            description,
            maxRedemptions: parseInt(maxRedemptions),
            discountType,
            discountValue: parseFloat(discountValue),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: isActive ? 'active' : 'inactive',
            createdBy: req.user?._id || null, // Admin user ID if available
            redeemedBy: [],
            redemptionCount: 0
        });

        await newInviteCode.save();

        res.status(201).json({
            success: true,
            message: 'Invite code created successfully',
            data: newInviteCode
        });
    } catch (error) {
        console.error("Error creating invite code:", error);
        res.status(500).json({
            success: false,
            message: 'Error creating invite code',
            details: error.message
        });
    }
};

// ✅ Update invite code
exports.updateInviteCode = async (req, res) => {
    try {
        const { codeId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(codeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code ID format'
            });
        }

        // Check if updating code and if it already exists
        if (updateData.code) {
            const existingCode = await InviteFriend.findOne({ 
                code: updateData.code.toUpperCase(),
                _id: { $ne: codeId }
            });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Invite code already exists'
                });
            }
            updateData.code = updateData.code.toUpperCase();
        }

        // Convert string values to appropriate types
        if (updateData.maxRedemptions) {
            updateData.maxRedemptions = parseInt(updateData.maxRedemptions);
        }
        if (updateData.discountValue) {
            updateData.discountValue = parseFloat(updateData.discountValue);
        }
        if (updateData.expiryDate) {
            updateData.expiryDate = new Date(updateData.expiryDate);
        }

        const updatedCode = await InviteFriend.findByIdAndUpdate(
            codeId,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedCode) {
            return res.status(404).json({
                success: false,
                message: 'Invite code not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Invite code updated successfully',
            data: updatedCode
        });
    } catch (error) {
        console.error("Error updating invite code:", error);
        res.status(500).json({
            success: false,
            message: 'Error updating invite code',
            details: error.message
        });
    }
};

// ✅ Delete invite code
exports.deleteInviteCode = async (req, res) => {
    try {
        const { codeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(codeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code ID format'
            });
        }

        const deletedCode = await InviteFriend.findByIdAndDelete(codeId);

        if (!deletedCode) {
            return res.status(404).json({
                success: false,
                message: 'Invite code not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Invite code deleted successfully',
            data: {
                deletedCodeId: codeId,
                deletedCode: deletedCode.code
            }
        });
    } catch (error) {
        console.error("Error deleting invite code:", error);
        res.status(500).json({
            success: false,
            message: 'Error deleting invite code'
        });
    }
};

// ✅ Toggle invite code status (activate/deactivate)
exports.toggleInviteCodeStatus = async (req, res) => {
    try {
        const { codeId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(codeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid code ID format'
            });
        }

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "active" or "inactive"'
            });
        }

        const updatedCode = await InviteFriend.findByIdAndUpdate(
            codeId,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!updatedCode) {
            return res.status(404).json({
                success: false,
                message: 'Invite code not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Invite code ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedCode
        });
    } catch (error) {
        console.error("Error toggling invite code status:", error);
        res.status(500).json({
            success: false,
            message: 'Error updating invite code status'
        });
    }
};

// ✅ Redeem invite code (for users)
exports.redeemInviteCode = async (req, res) => {
    try {
        const { code } = req.body;
        const { userId } = req.params; // User redeeming the code

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Invite code is required'
            });
        }

        // Find the invite code
        const inviteCode = await InviteFriend.findOne({ code: code.toUpperCase() });

        if (!inviteCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid invite code'
            });
        }

        // Check if code is active
        if (inviteCode.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Invite code is not active'
            });
        }

        // Check if code is expired
        if (inviteCode.expiryDate && new Date() > inviteCode.expiryDate) {
            return res.status(400).json({
                success: false,
                message: 'Invite code has expired'
            });
        }

        // Check if max redemptions reached
        if (inviteCode.redemptionCount >= inviteCode.maxRedemptions) {
            return res.status(400).json({
                success: false,
                message: 'Invite code has reached maximum redemption limit'
            });
        }

        // Check if user already redeemed this code
        const alreadyRedeemed = inviteCode.redeemedBy.some(
            redemption => redemption.userId.toString() === userId
        );

        if (alreadyRedeemed) {
            return res.status(400).json({
                success: false,
                message: 'You have already redeemed this invite code'
            });
        }

        // Add redemption record
        inviteCode.redeemedBy.push({
            userId: userId,
            redeemedAt: new Date()
        });
        inviteCode.redemptionCount += 1;
        inviteCode.updatedAt = new Date();

        await inviteCode.save();

        res.status(200).json({
            success: true,
            message: 'Invite code redeemed successfully',
            data: {
                code: inviteCode.code,
                discountType: inviteCode.discountType,
                discountValue: inviteCode.discountValue,
                description: inviteCode.description
            }
        });
    } catch (error) {
        console.error("Error redeeming invite code:", error);
        res.status(500).json({
            success: false,
            message: 'Error redeeming invite code'
        });
    }
};

// ✅ Get invite code statistics
exports.getInviteCodeStats = async (req, res) => {
    try {
        const stats = await InviteFriend.aggregate([
            {
                $group: {
                    _id: null,
                    totalCodes: { $sum: 1 },
                    activeCodes: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    inactiveCodes: {
                        $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
                    },
                    expiredCodes: {
                        $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                    },
                    totalRedemptions: { $sum: '$redemptionCount' },
                    averageRedemptions: { $avg: '$redemptionCount' }
                }
            }
        ]);

        const result = stats[0] || {
            totalCodes: 0,
            activeCodes: 0,
            inactiveCodes: 0,
            expiredCodes: 0,
            totalRedemptions: 0,
            averageRedemptions: 0
        };

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error fetching invite code stats:", error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
};

// ✅ Generate random invite code
exports.generateInviteCode = async (req, res) => {
    try {
        const { prefix = 'INVITE', length = 6 } = req.query;
        
        // Generate random alphanumeric code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        
        for (let i = 0; i < parseInt(length); i++) {
            randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const generatedCode = `${prefix.toUpperCase()}${randomCode}`;
        
        // Check if code already exists
        const existingCode = await InviteFriend.findOne({ code: generatedCode });
        
        if (existingCode) {
            // If exists, try again with different code
            return exports.generateInviteCode(req, res);
        }
        
        res.status(200).json({
            success: true,
            data: {
                generatedCode
            }
        });
    } catch (error) {
        console.error("Error generating invite code:", error);
        res.status(500).json({
            success: false,
            message: 'Error generating invite code'
        });
    }
};

// ✅ Get invite code by ID
exports.getInviteCodeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const inviteCode = await InviteFriend.findById(id)
            .populate('createdBy', 'name email')
            .populate('redeemedBy.userId', 'name email');
        
        if (!inviteCode) {
            return res.status(404).json({
                success: false,
                message: 'Invite code not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Invite code retrieved successfully',
            data: inviteCode
        });
    } catch (error) {
        console.error('Get invite code by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve invite code',
            error: error.message
        });
    }
};

// ✅ Validate invite code (public)
exports.validateInviteCode = async (req, res) => {
    try {
        const { code } = req.params;
        
        const inviteCode = await InviteFriend.findOne({ code: code.toUpperCase() });
        
        if (!inviteCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid invite code',
                valid: false
            });
        }
        
        const isValid = inviteCode.status === 'active' && 
                       !inviteCode.isExpired && 
                       inviteCode.redemptionCount < inviteCode.maxRedemptions;
        
        res.status(200).json({
            success: true,
            valid: isValid,
            data: {
                code: inviteCode.code,
                description: inviteCode.description,
                discountType: inviteCode.discountType,
                discountValue: inviteCode.discountValue,
                remainingRedemptions: inviteCode.maxRedemptions - inviteCode.redemptionCount,
                expiryDate: inviteCode.expiryDate,
                minOrderValue: inviteCode.minOrderValue,
                terms: inviteCode.terms
            }
        });
    } catch (error) {
        console.error('Validate invite code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate invite code',
            error: error.message
        });
    }
};

// ✅ Get user's redeemed codes
exports.getUserRedeemedCodes = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const redeemedCodes = await InviteFriend.find({
            'redeemedBy.userId': userId
        }).select('code description discountType discountValue redeemedBy');
        
        // Filter to get only this user's redemption data
        const userRedemptions = redeemedCodes.map(code => {
            const userRedemption = code.redeemedBy.find(
                redemption => redemption.userId.toString() === userId.toString()
            );
            
            return {
                code: code.code,
                description: code.description,
                discountType: code.discountType,
                discountValue: code.discountValue,
                redeemedAt: userRedemption.redeemedAt
            };
        });
        
        res.status(200).json({
            success: true,
            message: 'User redeemed codes retrieved successfully',
            data: userRedemptions
        });
    } catch (error) {
        console.error('Get user redeemed codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve redeemed codes',
            error: error.message
        });
    }
};

// ✅ Get detailed stats (admin only)
exports.getDetailedInviteCodeStats = async (req, res) => {
    try {
        const stats = await InviteFriend.aggregate([
            {
                $group: {
                    _id: null,
                    totalCodes: { $sum: 1 },
                    activeCodes: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                        }
                    },
                    inactiveCodes: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
                        }
                    },
                    expiredCodes: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'expired'] }, 1, 0]
                        }
                    },
                    totalRedemptions: { $sum: '$redemptionCount' },
                    totalMaxRedemptions: { $sum: '$maxRedemptions' },
                    averageDiscountValue: { $avg: '$discountValue' }
                }
            }
        ]);
        
        const topPerformingCodes = await InviteFriend.find({})
            .sort({ redemptionCount: -1 })
            .limit(10)
            .select('code description redemptionCount maxRedemptions discountType discountValue');
        
        const recentRedemptions = await InviteFriend.aggregate([
            { $unwind: '$redeemedBy' },
            { $sort: { 'redeemedBy.redeemedAt': -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'redeemedBy.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    code: 1,
                    'redeemedBy.redeemedAt': 1,
                    'user.name': 1,
                    'user.email': 1,
                    discountValue: 1,
                    discountType: 1
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            message: 'Detailed stats retrieved successfully',
            data: {
                overview: stats[0] || {},
                topPerformingCodes,
                recentRedemptions,
                utilizationRate: stats[0] ? ((stats[0].totalRedemptions / stats[0].totalMaxRedemptions) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Get detailed stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve detailed stats',
            error: error.message
        });
    }
};

// ✅ Bulk delete invite codes
exports.bulkDeleteInviteCodes = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid invite code IDs'
            });
        }
        
        const result = await InviteFriend.deleteMany({
            _id: { $in: ids }
        });
        
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} invite codes deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete invite codes',
            error: error.message
        });
    }
};

// ✅ Bulk update status
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid invite code IDs'
            });
        }
        
        if (!['active', 'inactive', 'expired'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Use: active, inactive, or expired'
            });
        }
        
        const result = await InviteFriend.updateMany(
            { _id: { $in: ids } },
            { $set: { status, updatedAt: new Date() } }
        );
        
        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} invite codes updated successfully`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        console.error('Bulk update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update invite code status',
            error: error.message
        });
    }
};

// ✅ Export invite codes to CSV
exports.exportInviteCodes = async (req, res) => {
    try {
        const inviteCodes = await InviteFriend.find({})
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        
        // Create CSV content
        const csvHeader = 'Code,Description,Discount Type,Discount Value,Max Redemptions,Current Redemptions,Status,Expiry Date,Created By,Created At\n';
        
        const csvRows = inviteCodes.map(code => [
            code.code,
            `"${code.description.replace(/"/g, '""')}"`,
            code.discountType,
            code.discountValue,
            code.maxRedemptions,
            code.redemptionCount,
            code.status,
            code.expiryDate ? code.expiryDate.toISOString().split('T')[0] : 'No Expiry',
            code.createdBy ? code.createdBy.name : 'System',
            code.createdAt.toISOString().split('T')[0]
        ].join(','));
        
        const csvContent = csvHeader + csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="invite-codes.csv"');
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Export invite codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export invite codes',
            error: error.message
        });
    }
};

// ✅ Get redemption analytics
exports.getRedemptionAnalytics = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const analytics = await InviteFriend.aggregate([
            {
                $match: {
                    'redeemedBy.redeemedAt': { $gte: startDate }
                }
            },
            { $unwind: '$redeemedBy' },
            {
                $match: {
                    'redeemedBy.redeemedAt': { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$redeemedBy.redeemedAt'
                        }
                    },
                    redemptions: { $sum: 1 },
                    uniqueCodes: { $addToSet: '$code' }
                }
            },
            {
                $project: {
                    date: '$_id',
                    redemptions: 1,
                    uniqueCodesCount: { $size: '$uniqueCodes' }
                }
            },
            { $sort: { date: 1 } }
        ]);
        
        res.status(200).json({
            success: true,
            message: 'Redemption analytics retrieved successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Get redemption analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve redemption analytics',
            error: error.message
        });
    }
};

// ✅ Get performance analytics
exports.getPerformanceAnalytics = async (req, res) => {
    try {
        const performance = await InviteFriend.aggregate([
            {
                $addFields: {
                    utilizationRate: {
                        $cond: [
                            { $eq: ['$maxRedemptions', 0] },
                            0,
                            { $multiply: [{ $divide: ['$redemptionCount', '$maxRedemptions'] }, 100] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$discountType',
                    totalCodes: { $sum: 1 },
                    totalRedemptions: { $sum: '$redemptionCount' },
                    averageUtilization: { $avg: '$utilizationRate' },
                    averageDiscount: { $avg: '$discountValue' }
                }
            }
        ]);
        
        const statusDistribution = await InviteFriend.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const monthlyTrends = await InviteFriend.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    codesCreated: { $sum: 1 },
                    totalRedemptions: { $sum: '$redemptionCount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ]);
        
        res.status(200).json({
            success: true,
            message: 'Performance analytics retrieved successfully',
            data: {
                discountTypePerformance: performance,
                statusDistribution,
                monthlyTrends
            }
        });
    } catch (error) {
        console.error('Get performance analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve performance analytics',
            error: error.message
        });
    }
};

module.exports = exports;
