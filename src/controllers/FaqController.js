const FAQ = require('../models/FAQ');

/**
 * FAQ Controller - Handles all FAQ-related operations
 * Provides comprehensive FAQ management with search, filtering, and CRUD operations
 */

/**
 * Get all FAQs with optional filtering, searching, and pagination
 */
const getAllFaqs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sortBy = 'priority',
      sortOrder = 'asc',
      isActive
    } = req.query;

    // Build query object
    const query = {};
    
    // Filter by active status - default to true for mobile apps
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Only show active FAQs by default
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { detail: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const faqs = await FAQ.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .lean(); // Use lean for better performance

    // Get total count for pagination
    const total = await FAQ.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Transform FAQs to include mobile app compatibility fields
    const transformedFaqs = faqs.map(faq => ({
      _id: faq._id,
      id: faq._id.toString(),
      title: faq.title,
      detail: faq.detail,
      question: faq.title,
      answer: faq.detail,
      category: faq.category,
      isActive: faq.isActive,
      priority: faq.priority,
      order: faq.priority,
      viewCount: faq.viewCount || 0,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
      createdBy: faq.createdBy,
      updatedBy: faq.updatedBy
    }));

    // Set cache headers for mobile apps
    res.set({
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      'Last-Modified': new Date().toUTCString()
    });

    res.json({
      success: true,
      message: 'FAQs retrieved successfully',
      data: {
        faqs: transformedFaqs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      },
      // Direct compatibility for mobile app
      faqs: transformedFaqs
    });
  } catch (error) {
    console.error('❌ Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      faqs: [] // Return empty array for mobile app compatibility
    });
  }
};

/**
 * Get FAQ by ID
 */
const getFaqById = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Increment view count
    await faq.incrementViewCount();

    // Transform FAQ for mobile app compatibility
    const transformedFaq = {
      ...faq.toJSON(),
      id: faq._id,
      question: faq.title,
      answer: faq.detail,
      order: faq.priority
    };

    res.json({
      success: true,
      message: 'FAQ retrieved successfully',
      data: transformedFaq
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error.message
    });
  }
};

/**
 * Create new FAQ
 */
const createFaq = async (req, res) => {
  try {
    const { title, detail, category, isActive, priority } = req.body;

    // Validate required fields
    if (!title || !detail) {
      return res.status(400).json({
        success: false,
        message: 'Title and detail are required'
      });
    }

    // Create new FAQ
    const faqData = {
      title: title.trim(),
      detail: detail.trim(),
      category: category || 'general',
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0
    };

    // Add creator if user is authenticated
    if (req.user) {
      faqData.createdBy = req.user._id;
    }

    const faq = new FAQ(faqData);
    await faq.save();

    // Populate creator info
    await faq.populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ',
      error: error.message
    });
  }
};

/**
 * Update FAQ
 */
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, category, isActive, priority } = req.body;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Update fields
    if (title !== undefined) faq.title = title.trim();
    if (detail !== undefined) faq.detail = detail.trim();
    if (category !== undefined) faq.category = category;
    if (isActive !== undefined) faq.isActive = isActive;
    if (priority !== undefined) faq.priority = priority;

    // Add updater if user is authenticated
    if (req.user) {
      faq.updatedBy = req.user._id;
    }

    await faq.save();

    // Populate user info
    await faq.populate('createdBy', 'username email');
    await faq.populate('updatedBy', 'username email');

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ',
      error: error.message
    });
  }
};

/**
 * Delete FAQ
 */
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await FAQ.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'FAQ deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ',
      error: error.message
    });
  }
};

/**
 * Toggle FAQ active status
 */
const toggleFaqStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    faq.isActive = isActive;
    if (req.user) {
      faq.updatedBy = req.user._id;
    }

    await faq.save();

    res.json({
      success: true,
      message: `FAQ ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: faq
    });
  } catch (error) {
    console.error('Error toggling FAQ status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ status',
      error: error.message
    });
  }
};

/**
 * Get FAQ categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = FAQ.getCategories();
    
    // Get count for each category
    const categoryCounts = await FAQ.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoriesWithCounts = categories.map(category => {
      const countData = categoryCounts.find(item => item._id === category);
      return {
        name: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        count: countData ? countData.count : 0
      };
    });

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories: categoriesWithCounts,
        total: categoryCounts.reduce((sum, item) => sum + item.count, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Search FAQs
 */
const searchFaqs = async (req, res) => {
  try {
    const { q: query, category, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    const searchQuery = {
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { detail: { $regex: query, $options: 'i' } }
      ]
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      searchQuery.category = category;
    }

    const faqs = await FAQ.find(searchQuery)
      .sort({ priority: 1, createdAt: -1 })
      .limit(parseInt(limit));

    // Transform FAQs for mobile app compatibility
    const transformedFaqs = faqs.map(faq => ({
      ...faq.toJSON(),
      id: faq._id,
      question: faq.title,
      answer: faq.detail,
      order: faq.priority
    }));

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        faqs: transformedFaqs,
        query,
        total: transformedFaqs.length
      },
      // Direct compatibility for mobile app
      faqs: transformedFaqs
    });
  } catch (error) {
    console.error('Error searching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search FAQs',
      error: error.message
    });
  }
};

/**
 * Get FAQs by category (Mobile app compatibility)
 */
const getFaqsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    // Build query for active FAQs in the specified category
    const query = { isActive: true };
    if (category && category !== 'all') {
      query.category = category;
    }

    const faqs = await FAQ.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .limit(parseInt(limit));

    // Transform FAQs for mobile app compatibility
    const transformedFaqs = faqs.map(faq => ({
      ...faq.toJSON(),
      id: faq._id,
      question: faq.title,
      answer: faq.detail,
      order: faq.priority
    }));

    res.json({
      success: true,
      message: `FAQs for category '${category}' retrieved successfully`,
      data: {
        faqs: transformedFaqs,
        category,
        total: transformedFaqs.length
      },
      // Direct compatibility for mobile app
      faqs: transformedFaqs
    });
  } catch (error) {
    console.error('Error fetching FAQs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs by category',
      error: error.message
    });
  }
};

/**
 * Get FAQ statistics
 */
const getFaqStats = async (req, res) => {
  try {
    const stats = await FAQ.aggregate([
      {
        $group: {
          _id: null,
          totalFaqs: { $sum: 1 },
          activeFaqs: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveFaqs: { $sum: { $cond: ['$isActive', 0, 1] } },
          totalViews: { $sum: '$viewCount' },
          avgViews: { $avg: '$viewCount' }
        }
      }
    ]);

    const categoryStats = await FAQ.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, views: { $sum: '$viewCount' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        overview: stats[0] || {
          totalFaqs: 0,
          activeFaqs: 0,
          inactiveFaqs: 0,
          totalViews: 0,
          avgViews: 0
        },
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Bulk operations
 */
const bulkDeleteFaqs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FAQ IDs array is required'
      });
    }

    const result = await FAQ.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} FAQs deleted successfully`,
      data: {
        deletedCount: result.deletedCount,
        ids
      }
    });
  } catch (error) {
    console.error('Error bulk deleting FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete FAQs',
      error: error.message
    });
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FAQ IDs array is required'
      });
    }

    const updateData = { isActive };
    if (req.user) {
      updateData.updatedBy = req.user._id;
    }

    const result = await FAQ.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} FAQs ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        ids
      }
    });
  } catch (error) {
    console.error('Error bulk updating FAQ status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update FAQ status',
      error: error.message
    });
  }
};

module.exports = {
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
  getCategories,
  searchFaqs,
  getFaqsByCategory,
  getFaqStats,
  bulkDeleteFaqs,
  bulkUpdateStatus
};
