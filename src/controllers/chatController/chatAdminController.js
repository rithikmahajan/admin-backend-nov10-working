const mongoose = require('mongoose');
const ChatSession = require('../../models/ChatSession');
const ChatMessage = require('../../models/ChatMessage');
const ChatRating = require('../../models/ChatRating');
const User = require('../../models/User');
const { ApiResponse } = require('../../utils/ApiResponse');

// Helper functions for standardized responses
const successResponse = (res, data, message, statusCode = 200) => {
  return res.status(statusCode).json(ApiResponse(data, message, true, statusCode));
};

const errorResponse = (res, message, statusCode = 500, data = null) => {
  return res.status(statusCode).json(ApiResponse(data, message, false, statusCode));
};

// ---------- ADMIN CHAT CONTROLLERS ----------

/**
 * Get all active chat sessions (admin only)
 * GET /api/chat/admin/active-sessions
 */
const getActiveSessions = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find({ status: 'active' })
      .populate('userInfo.userId', 'name email')
      .populate('assignedAdmin', 'name email')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalSessions = await ChatSession.countDocuments({ status: 'active' });

    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      userInfo: {
        name: session.userInfo.name,
        email: session.userInfo.email,
        isGuest: session.userInfo.isGuest,
      },
      startTime: session.startTime,
      lastMessageAt: session.lastMessageAt,
      messageCount: session.messageCount,
      assignedAdmin: session.assignedAdmin,
      priority: session.priority,
      tags: session.tags,
      isEscalated: session.isEscalated,
      sessionAge: session.sessionAge,
    }));

    return successResponse(res, {
      sessions: formattedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit),
      },
    }, 'Active sessions retrieved successfully');

  } catch (error) {
    console.error('Error retrieving active sessions:', error);
    return errorResponse(res, 'Failed to retrieve active sessions', 500);
  }
};

/**
 * Get all chat sessions with filtering (admin only)
 * GET /api/chat/admin/sessions
 */
const getAllSessions = async (req, res) => {
  try {
    const {
      status,
      assignedAdmin,
      priority,
      tags,
      startDate,
      endDate,
      isGuest,
      page = 1,
      limit = 20,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    
    if (status) filter.status = status;
    if (assignedAdmin) filter.assignedAdmin = assignedAdmin;
    if (priority) filter.priority = priority;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (isGuest !== undefined) filter['userInfo.isGuest'] = isGuest === 'true';
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await ChatSession.find(filter)
      .populate('userInfo.userId', 'name email')
      .populate('assignedAdmin', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalSessions = await ChatSession.countDocuments(filter);

    return successResponse(res, {
      sessions: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit),
      },
      filters: {
        status,
        assignedAdmin,
        priority,
        tags,
        startDate,
        endDate,
        isGuest,
      },
    }, 'Sessions retrieved successfully');

  } catch (error) {
    console.error('Error retrieving sessions:', error);
    return errorResponse(res, 'Failed to retrieve sessions', 500);
  }
};

/**
 * Get specific session details (admin only)
 * GET /api/chat/admin/session/:sessionId
 */
const getAdminSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId })
      .populate('userInfo.userId', 'name email phone')
      .populate('assignedAdmin', 'name email')
      .lean();

    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Get recent messages
    const recentMessages = await ChatMessage.find({ sessionId })
      .populate('senderInfo.userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Get rating if exists
    const rating = await ChatRating.findOne({ sessionId }).lean();

    return successResponse(res, {
      session,
      recentMessages: recentMessages.reverse(), // Show in chronological order
      rating,
    }, 'Session details retrieved successfully');

  } catch (error) {
    console.error('Error retrieving session details:', error);
    return errorResponse(res, 'Failed to retrieve session details', 500);
  }
};

/**
 * Send admin message
 * POST /api/chat/admin/message
 */
const sendAdminMessage = async (req, res) => {
  try {
    const { sessionId, message, messageType = 'text', attachments = [] } = req.body;

    if (!sessionId || !message) {
      return errorResponse(res, 'Session ID and message are required', 400);
    }

    // Find the session
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    if (session.status !== 'active') {
      return errorResponse(res, 'Chat session is not active', 400);
    }

    // Get admin info
    const adminUser = await User.findById(req.user._id);
    if (!adminUser) {
      return errorResponse(res, 'Admin user not found', 404);
    }

    // Assign admin to session if not already assigned
    if (!session.assignedAdmin) {
      await session.assignAdmin(adminUser);
    }

    // Create admin message
    const adminMessage = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      sessionId: sessionId,
      sessionRef: session._id,
      message: message,
      sender: 'admin',
      senderInfo: {
        userId: adminUser._id,
        name: adminUser.name || 'Support Agent',
        email: adminUser.email,
        avatar: adminUser.name ? adminUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SA',
        isGuest: false,
      },
      messageType: messageType,
      attachments: attachments.map(att => ({
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        fileType: att.fileType,
        uploadedAt: new Date(),
      })),
      timestamp: new Date(),
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        platform: 'admin_panel',
      },
    });

    await adminMessage.save();

    return successResponse(res, {
      messageId: adminMessage.messageId,
      status: 'sent',
      timestamp: adminMessage.timestamp,
    }, 'Admin message sent successfully');

  } catch (error) {
    console.error('Error sending admin message:', error);
    return errorResponse(res, 'Failed to send admin message', 500);
  }
};

/**
 * End session as admin
 * POST /api/chat/admin/session/:sessionId/end
 */
const endSessionAsAdmin = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    if (session.status !== 'active') {
      return errorResponse(res, 'Chat session is already ended', 400);
    }

    // End the session
    await session.endSession('admin');

    // Create session end system message
    const endMessage = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      sessionId: sessionId,
      sessionRef: session._id,
      message: `Chat session ended by admin. ${reason ? `Reason: ${reason}` : ''}`,
      sender: 'admin',
      senderInfo: {
        userId: req.user._id,
        name: 'Support Admin',
        email: req.user.email,
        avatar: 'SA',
        isGuest: false,
      },
      messageType: 'system',
      isSystemMessage: true,
      systemMessageType: 'session_end',
      timestamp: new Date(),
    });

    await endMessage.save();

    return successResponse(res, {
      sessionId: session.sessionId,
      status: session.status,
      endTime: session.endTime,
      duration: session.duration,
    }, 'Chat session ended by admin');

  } catch (error) {
    console.error('Error ending session as admin:', error);
    return errorResponse(res, 'Failed to end session', 500);
  }
};

/**
 * Assign session to admin
 * POST /api/chat/admin/session/:sessionId/assign
 */
const assignSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { adminId } = req.body;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    let targetAdmin;
    if (adminId) {
      targetAdmin = await User.findById(adminId);
      if (!targetAdmin || targetAdmin.role !== 'admin') {
        return errorResponse(res, 'Invalid admin user', 400);
      }
    } else {
      // Self-assign
      targetAdmin = await User.findById(req.user._id);
    }

    await session.assignAdmin(targetAdmin);

    // Create assignment system message
    const assignMessage = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      sessionId: sessionId,
      sessionRef: session._id,
      message: `${targetAdmin.name} has joined the chat`,
      sender: 'admin',
      senderInfo: {
        name: 'System',
        email: 'system@yoraa.com',
        avatar: 'SY',
        isGuest: false,
      },
      messageType: 'system',
      isSystemMessage: true,
      systemMessageType: 'admin_joined',
      timestamp: new Date(),
    });

    await assignMessage.save();

    return successResponse(res, {
      sessionId: session.sessionId,
      assignedAdmin: {
        id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
      },
    }, 'Session assigned successfully');

  } catch (error) {
    console.error('Error assigning session:', error);
    return errorResponse(res, 'Failed to assign session', 500);
  }
};

/**
 * Add session tags
 * POST /api/chat/admin/session/:sessionId/tags
 */
const addSessionTags = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return errorResponse(res, 'Tags must be an array', 400);
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Add new tags
    for (const tag of tags) {
      await session.addTag(tag);
    }

    return successResponse(res, {
      sessionId: session.sessionId,
      tags: session.tags,
    }, 'Tags added successfully');

  } catch (error) {
    console.error('Error adding session tags:', error);
    return errorResponse(res, 'Failed to add session tags', 500);
  }
};

/**
 * Escalate session
 * POST /api/chat/admin/session/:sessionId/escalate
 */
const escalateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    await session.escalate(reason);

    // Create escalation system message
    const escalationMessage = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      sessionId: sessionId,
      sessionRef: session._id,
      message: `This chat has been escalated. ${reason ? `Reason: ${reason}` : ''}`,
      sender: 'admin',
      senderInfo: {
        name: 'System',
        email: 'system@yoraa.com',
        avatar: 'SY',
        isGuest: false,
      },
      messageType: 'system',
      isSystemMessage: true,
      systemMessageType: 'escalated',
      timestamp: new Date(),
    });

    await escalationMessage.save();

    return successResponse(res, {
      sessionId: session.sessionId,
      isEscalated: session.isEscalated,
      priority: session.priority,
      escalationReason: session.escalationReason,
    }, 'Session escalated successfully');

  } catch (error) {
    console.error('Error escalating session:', error);
    return errorResponse(res, 'Failed to escalate session', 500);
  }
};

/**
 * Add admin notes
 * POST /api/chat/admin/session/:sessionId/notes
 */
const addAdminNotes = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { note } = req.body;

    if (!note) {
      return errorResponse(res, 'Note is required', 400);
    }

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    session.adminNotes.push({
      note,
      addedBy: req.user._id,
      addedAt: new Date(),
    });

    await session.save();

    return successResponse(res, {
      sessionId: session.sessionId,
      notes: session.adminNotes,
    }, 'Admin note added successfully');

  } catch (error) {
    console.error('Error adding admin note:', error);
    return errorResponse(res, 'Failed to add admin note', 500);
  }
};

/**
 * Get chat analytics (admin only)
 * GET /api/chat/admin/analytics
 */
const getChatAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 30 } = req.query;

    let start = startDate ? new Date(startDate) : new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();

    // Get session analytics
    const sessionAnalytics = await ChatSession.getAnalytics(start, end);

    // Get rating analytics
    const ratingAnalytics = await ChatRating.getAnalytics({ startDate: start, endDate: end });

    // Get message analytics
    const messageStats = await ChatMessage.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get active sessions count
    const activeSessions = await ChatSession.countDocuments({ status: 'active' });

    // Get admin workload
    const adminWorkload = await ChatSession.aggregate([
      {
        $match: {
          assignedAdmin: { $ne: null },
          startTime: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$assignedAdmin',
          sessionCount: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'admin'
        }
      },
      {
        $unwind: '$admin'
      },
      {
        $project: {
          adminName: '$admin.name',
          adminEmail: '$admin.email',
          sessionCount: 1,
          avgDuration: { $round: ['$avgDuration', 2] },
          avgRating: { $round: ['$avgRating', 2] }
        }
      }
    ]);

    return successResponse(res, {
      overview: {
        activeSessions,
        totalSessions: sessionAnalytics.totalSessions,
        completedSessions: sessionAnalytics.completedSessions,
        avgDuration: sessionAnalytics.avgDuration,
        avgRating: sessionAnalytics.avgRating,
        avgMessageCount: sessionAnalytics.avgMessageCount,
      },
      ratings: ratingAnalytics,
      messages: {
        total: messageStats.reduce((sum, stat) => sum + stat.count, 0),
        byType: messageStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
      adminWorkload,
      period: {
        startDate: start,
        endDate: end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      }
    }, 'Chat analytics retrieved successfully');

  } catch (error) {
    console.error('Error retrieving chat analytics:', error);
    return errorResponse(res, 'Failed to retrieve chat analytics', 500);
  }
};

/**
 * Get admin performance metrics (admin only)
 * GET /api/chat/admin/performance/:adminId?
 */
const getAdminPerformance = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { period = 30 } = req.query;

    const targetAdminId = adminId || req.user._id;

    // Validate admin exists
    const admin = await User.findById(targetAdminId);
    if (!admin || admin.role !== 'admin') {
      return errorResponse(res, 'Admin not found', 404);
    }

    // Get performance metrics
    const performance = await ChatRating.getAdminPerformance(targetAdminId, parseInt(period));

    // Get session stats
    const sessionStats = await ChatSession.aggregate([
      {
        $match: {
          assignedAdmin: new mongoose.Types.ObjectId(targetAdminId),
          startTime: { $gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$avgResponseTime' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    return successResponse(res, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
      performance,
      sessions: sessionStats[0] || {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        avgResponseTime: 0,
        totalDuration: 0
      },
      period: parseInt(period)
    }, 'Admin performance retrieved successfully');

  } catch (error) {
    console.error('Error retrieving admin performance:', error);
    return errorResponse(res, 'Failed to retrieve admin performance', 500);
  }
};

/**
 * Get session analytics (admin only)
 * GET /api/chat/admin/session/:sessionId/analytics
 */
const getSessionAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId })
      .populate('assignedAdmin', 'name email')
      .lean();

    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Get message analytics
    const messageAnalytics = await ChatMessage.getAnalytics(sessionId);

    // Get message timeline
    const messageTimeline = await ChatMessage.find({ sessionId })
      .select('sender timestamp messageType')
      .sort({ timestamp: 1 })
      .lean();

    // Calculate response times
    const responseData = [];
    let lastUserMessage = null;

    messageTimeline.forEach(msg => {
      if (msg.sender === 'user') {
        lastUserMessage = msg.timestamp;
      } else if (msg.sender === 'admin' && lastUserMessage) {
        const responseTime = (msg.timestamp - lastUserMessage) / 1000; // in seconds
        responseData.push({
          timestamp: msg.timestamp,
          responseTime: responseTime
        });
        lastUserMessage = null;
      }
    });

    const avgResponseTime = responseData.length > 0 
      ? responseData.reduce((sum, item) => sum + item.responseTime, 0) / responseData.length
      : 0;

    return successResponse(res, {
      session: {
        sessionId: session.sessionId,
        duration: session.duration,
        messageCount: session.messageCount,
        status: session.status,
        rating: session.rating,
        assignedAdmin: session.assignedAdmin,
      },
      messages: messageAnalytics,
      responseTime: {
        average: Math.round(avgResponseTime),
        timeline: responseData,
      },
      timeline: messageTimeline,
    }, 'Session analytics retrieved successfully');

  } catch (error) {
    console.error('Error retrieving session analytics:', error);
    return errorResponse(res, 'Failed to retrieve session analytics', 500);
  }
};

// ---------- UTILITY CONTROLLERS ----------

/**
 * Health check for chat service
 * GET /api/chat/health
 */
const healthCheck = async (req, res) => {
  try {
    // Check database connectivity
    const sessionCount = await ChatSession.countDocuments();
    const messageCount = await ChatMessage.countDocuments();
    const activeSessionCount = await ChatSession.countDocuments({ status: 'active' });

    return successResponse(res, {
      status: 'healthy',
      timestamp: new Date(),
      database: 'connected',
      stats: {
        totalSessions: sessionCount,
        totalMessages: messageCount,
        activeSessions: activeSessionCount,
      }
    }, 'Chat service is healthy');

  } catch (error) {
    console.error('Health check failed:', error);
    return errorResponse(res, 'Chat service health check failed', 500);
  }
};

/**
 * Get chat configuration
 * GET /api/chat/config
 */
const getChatConfig = async (req, res) => {
  try {
    const config = {
      maxMessageLength: 2000,
      maxAttachmentSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      pollingInterval: 2000, // 2 seconds
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ratingScale: { min: 1, max: 5 },
      availableTags: [
        'order_issue',
        'product_inquiry',
        'shipping',
        'payment',
        'return',
        'technical',
        'general',
        'complaint'
      ],
      businessHours: {
        enabled: true,
        timezone: 'Asia/Kolkata',
        schedule: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '10:00', end: '16:00' },
          sunday: { closed: true }
        }
      }
    };

    return successResponse(res, config, 'Chat configuration retrieved successfully');

  } catch (error) {
    console.error('Error retrieving chat config:', error);
    return errorResponse(res, 'Failed to retrieve chat configuration', 500);
  }
};

/**
 * Test endpoint for development
 * GET /api/chat/test
 */
const testEndpoint = async (req, res) => {
  try {
    return successResponse(res, {
      message: 'Chat API is working',
      timestamp: new Date(),
      user: req.user ? req.user._id : 'anonymous',
    }, 'Test successful');

  } catch (error) {
    console.error('Test endpoint error:', error);
    return errorResponse(res, 'Test failed', 500);
  }
};

module.exports = {
  getActiveSessions,
  getAllSessions,
  getAdminSessionDetails,
  sendAdminMessage,
  endSessionAsAdmin,
  assignSession,
  addSessionTags,
  escalateSession,
  addAdminNotes,
  getChatAnalytics,
  getAdminPerformance,
  getSessionAnalytics,
  healthCheck,
  getChatConfig,
  testEndpoint,
};
