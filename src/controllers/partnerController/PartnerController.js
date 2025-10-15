const Partner = require('../../models/Partner');
const { ApiResponse } = require('../../utils/ApiResponse');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Utility function to generate unique partner ID
const generatePartnerId = async (name) => {
  try {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let partnerId = `${baseId}_${Date.now()}`;
    
    // Ensure uniqueness
    let existingPartner = await Partner.findByPartnerId(partnerId);
    let counter = 1;
    
    while (existingPartner) {
      partnerId = `${baseId}_${Date.now()}_${counter}`;
      existingPartner = await Partner.findByPartnerId(partnerId);
      counter++;
    }
    
    return partnerId;
  } catch (error) {
    throw new Error('Failed to generate partner ID');
  }
};

// Create new partner
exports.createPartner = async (req, res) => {
  try {
    const { name, password, confirmPassword, email, phone, businessInfo } = req.body;
    
    // Validation
    if (!name || !password || !confirmPassword) {
      return res.status(400).json(
        ApiResponse(null, "Name, password and confirm password are required", false, 400)
      );
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json(
        ApiResponse(null, "Passwords do not match", false, 400)
      );
    }
    
    if (password.length < 6) {
      return res.status(400).json(
        ApiResponse(null, "Password must be at least 6 characters long", false, 400)
      );
    }
    
    // Generate unique partner ID
    const partnerId = await generatePartnerId(name);
    
    // Check if email already exists (if provided)
    if (email) {
      const existingPartnerWithEmail = await Partner.findOne({ 
        email: email.toLowerCase(),
        isDeleted: false 
      });
      if (existingPartnerWithEmail) {
        return res.status(400).json(
          ApiResponse(null, "Email already exists", false, 400)
        );
      }
    }
    
    // Create partner
    const partnerData = {
      name: name.trim(),
      partnerId,
      password,
      email: email ? email.toLowerCase() : undefined,
      phone: phone || undefined,
      businessInfo: businessInfo || {},
      createdBy: req.user._id
    };
    
    const partner = new Partner(partnerData);
    await partner.save();
    
    // Remove password from response
    const responseData = partner.toJSON();
    
    res.status(201).json(
      ApiResponse(
        { 
          partner: responseData,
          partnerId: partnerId 
        }, 
        "Partner created successfully", 
        true, 
        201
      )
    );
    
  } catch (error) {
    console.error("Error creating partner:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json(
        ApiResponse(null, validationErrors.join(', '), false, 400)
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json(
        ApiResponse(null, `${field} already exists`, false, 400)
      );
    }
    
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Get all partners
exports.getAllPartners = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Build filter query
    const filterQuery = { isDeleted: false };
    
    if (status && ['active', 'blocked', 'pending'].includes(status)) {
      filterQuery.status = status;
    }
    
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partnerId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const [partners, totalCount] = await Promise.all([
      Partner.find(filterQuery)
        .select('-password')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Partner.countDocuments(filterQuery)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.status(200).json(
      ApiResponse(
        {
          partners,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        },
        "Partners fetched successfully",
        true,
        200
      )
    );
    
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Get partner by ID
exports.getPartnerById = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    const partner = await Partner.findOne({ 
      $or: [
        { _id: partnerId },
        { partnerId: partnerId }
      ],
      isDeleted: false 
    })
    .select('-password')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
    
    if (!partner) {
      return res.status(404).json(
        ApiResponse(null, "Partner not found", false, 404)
      );
    }
    
    res.status(200).json(
      ApiResponse(partner, "Partner fetched successfully", true, 200)
    );
    
  } catch (error) {
    console.error("Error fetching partner:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Update partner
exports.updatePartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { name, email, phone, status, permissions, businessInfo } = req.body;
    
    const partner = await Partner.findOne({ 
      $or: [
        { _id: partnerId },
        { partnerId: partnerId }
      ],
      isDeleted: false 
    });
    
    if (!partner) {
      return res.status(404).json(
        ApiResponse(null, "Partner not found", false, 404)
      );
    }
    
    // Update fields
    if (name) partner.name = name.trim();
    if (email !== undefined) partner.email = email ? email.toLowerCase() : null;
    if (phone !== undefined) partner.phone = phone || null;
    if (status && ['active', 'blocked', 'pending'].includes(status)) {
      partner.status = status;
    }
    if (permissions) partner.permissions = { ...partner.permissions, ...permissions };
    if (businessInfo) partner.businessInfo = { ...partner.businessInfo, ...businessInfo };
    
    partner.updatedBy = req.user._id;
    
    await partner.save();
    
    res.status(200).json(
      ApiResponse(partner, "Partner updated successfully", true, 200)
    );
    
  } catch (error) {
    console.error("Error updating partner:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json(
        ApiResponse(null, validationErrors.join(', '), false, 400)
      );
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json(
        ApiResponse(null, `${field} already exists`, false, 400)
      );
    }
    
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Update partner password
exports.updatePartnerPassword = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { newPassword, confirmPassword } = req.body;
    
    if (!newPassword || !confirmPassword) {
      return res.status(400).json(
        ApiResponse(null, "New password and confirm password are required", false, 400)
      );
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json(
        ApiResponse(null, "Passwords do not match", false, 400)
      );
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json(
        ApiResponse(null, "Password must be at least 6 characters long", false, 400)
      );
    }
    
    const partner = await Partner.findOne({ 
      $or: [
        { _id: partnerId },
        { partnerId: partnerId }
      ],
      isDeleted: false 
    });
    
    if (!partner) {
      return res.status(404).json(
        ApiResponse(null, "Partner not found", false, 404)
      );
    }
    
    partner.password = newPassword;
    partner.updatedBy = req.user._id;
    await partner.save();
    
    res.status(200).json(
      ApiResponse(null, "Password updated successfully", true, 200)
    );
    
  } catch (error) {
    console.error("Error updating partner password:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Block/Unblock partner
exports.togglePartnerStatus = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { action, reason } = req.body; // action: 'block' or 'unblock'
    
    if (!action || !['block', 'unblock'].includes(action)) {
      return res.status(400).json(
        ApiResponse(null, "Invalid action. Use 'block' or 'unblock'", false, 400)
      );
    }
    
    const partner = await Partner.findOne({ 
      $or: [
        { _id: partnerId },
        { partnerId: partnerId }
      ],
      isDeleted: false 
    });
    
    if (!partner) {
      return res.status(404).json(
        ApiResponse(null, "Partner not found", false, 404)
      );
    }
    
    partner.status = action === 'block' ? 'blocked' : 'active';
    partner.updatedBy = req.user._id;
    
    await partner.save();
    
    const message = action === 'block' ? "Partner blocked successfully" : "Partner unblocked successfully";
    
    res.status(200).json(
      ApiResponse(partner, message, true, 200)
    );
    
  } catch (error) {
    console.error("Error toggling partner status:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Delete partner (soft delete)
exports.deletePartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    const partner = await Partner.findOne({ 
      $or: [
        { _id: partnerId },
        { partnerId: partnerId }
      ],
      isDeleted: false 
    });
    
    if (!partner) {
      return res.status(404).json(
        ApiResponse(null, "Partner not found", false, 404)
      );
    }
    
    await partner.softDelete(req.user._id);
    
    res.status(200).json(
      ApiResponse(null, "Partner deleted successfully", true, 200)
    );
    
  } catch (error) {
    console.error("Error deleting partner:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Partner login
exports.partnerLogin = async (req, res) => {
  try {
    const { partnerId, password } = req.body;
    
    if (!partnerId || !password) {
      return res.status(400).json(
        ApiResponse(null, "Partner ID and password are required", false, 400)
      );
    }
    
    const partner = await Partner.findByPartnerId(partnerId);
    
    if (!partner || partner.isDeleted) {
      return res.status(401).json(
        ApiResponse(null, "Invalid credentials", false, 401)
      );
    }
    
    // Check if account is locked
    if (partner.isLocked) {
      return res.status(423).json(
        ApiResponse(null, "Account is locked due to too many failed login attempts", false, 423)
      );
    }
    
    // Check if partner is blocked
    if (partner.status === 'blocked') {
      return res.status(403).json(
        ApiResponse(null, "Account is blocked", false, 403)
      );
    }
    
    // Verify password
    const isPasswordValid = await partner.comparePassword(password);
    
    if (!isPasswordValid) {
      await partner.incLoginAttempts();
      return res.status(401).json(
        ApiResponse(null, "Invalid credentials", false, 401)
      );
    }
    
    // Reset login attempts on successful login
    if (partner.loginAttempts > 0) {
      await partner.resetLoginAttempts();
    }
    
    // Update last login
    partner.lastLogin = new Date();
    await partner.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: partner._id, 
        partnerId: partner.partnerId, 
        role: 'partner' 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE_TIME || '24h' }
    );
    
    // Remove password from response
    const responseData = partner.toJSON();
    
    res.status(200).json(
      ApiResponse(
        {
          partner: responseData,
          token,
          expiresIn: '24h'
        },
        "Login successful",
        true,
        200
      )
    );
    
  } catch (error) {
    console.error("Error in partner login:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};

// Get partner statistics
exports.getPartnerStatistics = async (req, res) => {
  try {
    const stats = await Partner.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPartners: { $sum: 1 },
          activePartners: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          blockedPartners: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
          },
          pendingPartners: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          avgAcceptanceRate: { $avg: '$statistics.acceptanceRate' },
          avgCompletionRate: { $avg: '$statistics.completionRate' },
          totalOrdersAssigned: { $sum: '$statistics.totalOrdersAssigned' },
          totalOrdersAccepted: { $sum: '$statistics.totalOrdersAccepted' },
          totalOrdersCompleted: { $sum: '$statistics.totalOrdersCompleted' }
        }
      }
    ]);
    
    const statistics = stats[0] || {
      totalPartners: 0,
      activePartners: 0,
      blockedPartners: 0,
      pendingPartners: 0,
      avgAcceptanceRate: 0,
      avgCompletionRate: 0,
      totalOrdersAssigned: 0,
      totalOrdersAccepted: 0,
      totalOrdersCompleted: 0
    };
    
    res.status(200).json(
      ApiResponse(statistics, "Partner statistics fetched successfully", true, 200)
    );
    
  } catch (error) {
    console.error("Error fetching partner statistics:", error);
    res.status(500).json(
      ApiResponse(null, "Internal server error", false, 500, error.message)
    );
  }
};
