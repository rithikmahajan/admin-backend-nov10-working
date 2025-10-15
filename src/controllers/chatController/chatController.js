const ChatSession = require('../../models/ChatSession');
const ChatMessage = require('../../models/ChatMessage');
const ChatRating = require('../../models/ChatRating');
const User = require('../../models/User');
const { ApiResponse } = require('../../utils/ApiResponse');

/**
 * Get appropriate display name based on authentication method
 */
function getUserDisplayName(user, userInfo) {
  // If name is available from Firebase, use it
  if (user.name && user.name !== user.email && user.name !== user.phoneNumber) {
    return user.name;
  }
  
  // If frontend provided name, use it
  if (userInfo?.name && userInfo.name !== userInfo.email && userInfo.name !== userInfo.phone) {
    return userInfo.name;
  }
  
  // Fallback based on auth method
  switch (user.authMethod) {
    case 'phone':
      return user.phoneNumber ? `Phone User (${user.phoneNumber.slice(-4)})` : 'Phone User';
    case 'google':
      return user.email ? `Google User (${user.email})` : 'Google User';
    case 'apple':
      return 'Apple User';
    case 'email':
      return user.email ? `User (${user.email})` : 'Email User';
    default:
      return 'Customer';
  }
}

// Helper functions for standardized responses
const successResponse = (res, data, message, statusCode = 200) => {
  return res.status(statusCode).json(ApiResponse(data, message, true, statusCode));
};

const errorResponse = (res, message, statusCode = 500, data = null) => {
  return res.status(statusCode).json(ApiResponse(data, message, false, statusCode));
};

// ---------- CHAT SESSION CONTROLLERS ----------

/**
 * Create a new chat session
 * POST /api/chat/session
 */
const createChatSession = async (req, res) => {
  try {
    console.log('🚀 Chat session endpoint called');
    console.log('👤 User from token:', {
      uid: req.user?.uid,
      email: req.user?.email,
      name: req.user?.name
    });
    console.log('📨 Request body:', JSON.stringify(req.body, null, 2));

    const { userInfo, sessionContext, startTime, status } = req.body;
    let { sessionId } = req.body;

    // Validate required fields
    if (!sessionId) {
      sessionId = ChatSession.generateSessionId();
      console.log('🆔 Generated new session ID:', sessionId);
    }

    // Check if session already exists
    const existingSession = await ChatSession.findOne({ sessionId });
    if (existingSession) {
      console.log('❌ Session already exists:', sessionId);
      return errorResponse(res, 'Chat session already exists', 400);
    }

    // Verify user is authenticated (required for chat sessions)
    if (!req.user) {
      console.log('❌ No authenticated user found');
      return errorResponse(res, 'Authentication required to start a chat session', 401);
    }

    console.log('📋 Creating chat session for user:', {
      uid: req.user.uid,
      email: req.user.email,
      phone: req.user.phoneNumber,
      authMethod: req.user.authMethod,
      authSource: req.user.authSource
    });

    // Extract authenticated user information based on auth method
    // Override frontend userInfo with secure Firebase token data
    const finalUserInfo = {
      isGuest: false,
      
      // Primary identifiers
      userId: req.user.uid,
      firebaseUid: req.user.uid,
      
      // Authentication method details
      authMethod: req.user.authMethod,
      authSource: req.user.authSource,
      providerId: req.user.providerId,
      
      // User contact details (method-specific handling)
      email: req.user.email || userInfo?.email || null,
      phone: req.user.phoneNumber || userInfo?.phone || null,
      
      // User display info
      name: getUserDisplayName(req.user, userInfo),
      picture: req.user.picture || null,
      
      // Verification status
      emailVerified: req.user.emailVerified || false,
      phoneVerified: req.user.phoneVerified || false,
      
      // Third-party IDs
      googleId: req.user.googleId || null,
      appleId: req.user.appleId || null,
      
      // Database integration
      dbUserId: req.user._id || null,
      isRegisteredUser: req.user.isRegisteredUser,
      hasDbAccount: req.user.hasDbAccount,
      authSource: req.user.authSource || 'firebase'
    };

    console.log('💾 Final user info:', JSON.stringify(finalUserInfo, null, 2));

    // Prepare session data with frontend data where applicable
    const sessionData = {
      sessionId,
      userInfo: finalUserInfo,
      startTime: startTime ? new Date(startTime) : new Date(),
      status: status || 'active',
      sessionContext: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        platform: sessionContext?.platform || 'web',
        source: sessionContext?.source || 'web_app',
      },
      messageCount: 0,
      lastMessageAt: new Date(),
    };

    console.log('💾 About to save session data:', JSON.stringify(sessionData, null, 2));

    // Create new chat session
    const newSession = new ChatSession(sessionData);

    console.log('💾 Saving to database...');
    await newSession.save();
    
    console.log('✅ Chat session saved successfully:', {
      sessionId: newSession.sessionId,
      userId: newSession.userInfo.userId,
      status: newSession.status
    });

    // Create welcome system message
    const welcomeMessage = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      sessionId: sessionId,
      sessionRef: newSession._id,
      message: 'Welcome to Yoraa Support! How can we help you today?',
      sender: 'admin',
      senderInfo: {
        name: 'Yoraa Support',
        email: 'support@yoraa.com',
        avatar: 'YS',
        isGuest: false,
      },
      messageType: 'system',
      isSystemMessage: true,
      systemMessageType: 'session_start',
      timestamp: new Date(),
    });

    console.log('💬 Creating welcome message...');
    await welcomeMessage.save();
    console.log('✅ Welcome message created successfully');

    console.log('✅ Chat session creation completed successfully!');
    
    return successResponse(res, {
      sessionId: newSession.sessionId,
      status: newSession.status,
      createdAt: newSession.createdAt,
      startTime: newSession.startTime,
      userInfo: {
        userId: finalUserInfo.userId,
        firebaseUid: finalUserInfo.firebaseUid,
        email: finalUserInfo.email,
        name: finalUserInfo.name,
        isGuest: finalUserInfo.isGuest,
        authSource: finalUserInfo.authSource
      },
    }, 'Chat session created successfully');

  } catch (error) {
    // Enhanced error logging for debugging
    console.error('💥 CHAT SESSION CREATION ERROR:');
    console.error('- Error message:', error.message);
    console.error('- Error code:', error.code);
    console.error('- Error name:', error.name);
    console.error('- Stack trace:', error.stack);
    
    // MongoDB specific error handling
    if (error.name === 'ValidationError') {
      console.error('- Validation errors:', error.errors);
      return errorResponse(res, `Validation error: ${error.message}`, 400);
    }
    
    if (error.code === 11000) {
      console.error('- Duplicate key error:', error.keyPattern);
      return errorResponse(res, 'Chat session with this ID already exists', 409);
    }
    
    if (error.name === 'MongoNetworkError') {
      console.error('- Database connection error');
      return errorResponse(res, 'Database connection error', 503);
    }
    
    // Return detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment ? 
      `Failed to create chat session: ${error.message}` : 
      'Failed to create chat session';
    
    return errorResponse(res, errorMessage, 500);
  }
};

/**
 * Get chat session details
 * GET /api/chat/session/:sessionId
 */
const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId })
      .populate('assignedAdmin', 'name email')
      .lean();

    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Check if user has access to this session
    if (req.user) {
      const hasAccess = session.userInfo.userId?.toString() === req.user._id.toString() ||
                       req.user.role === 'admin';
      if (!hasAccess) {
        return errorResponse(res, 'Access denied', 403);
      }
    } else if (session.userInfo.isGuest) {
      // For guest users, we might need additional validation
      // This could be enhanced with guest session tokens
    }

    return successResponse(res, session, 'Chat session retrieved successfully');

  } catch (error) {
    console.error('Error retrieving chat session:', error);
    return errorResponse(res, 'Failed to retrieve chat session', 500);
  }
};

/**
 * End a chat session
 * POST /api/chat/session/end
 */
const endChatSession = async (req, res) => {
  try {
    console.log('🛑 Session end endpoint called');
    console.log('👤 User from token:', {
      uid: req.user?.uid,
      email: req.user?.email,
      name: req.user?.name
    });
    console.log('📋 Request body:', req.body);
    
    const { sessionId, rating, feedback, endTime, status } = req.body;

    // Validate required fields
    if (!sessionId) {
      return errorResponse(res, 'Missing required field: sessionId', 400);
    }

    // Verify user is authenticated
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    console.log('🔍 Looking for session:', sessionId);
    console.log('👤 User ID from token:', req.user.uid);

    const session = await ChatSession.findOne({ sessionId });
    console.log('📋 Found session:', session ? 'YES' : 'NO');
    
    if (!session) {
      // Debugging: Check if session exists at all
      console.log('🔍 DEBUG: Checking if session exists for any user...');
      const anySession = await ChatSession.findOne({ sessionId: sessionId });
      console.log('📋 Session exists (any user):', anySession ? 'YES' : 'NO');
      if (anySession) {
        console.log('📋 Session owner info:', {
          userId: anySession.userInfo?.userId,
          firebaseUid: anySession.userInfo?.firebaseUid,
          email: anySession.userInfo?.email
        });
      }
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Verify user owns this session (Firebase UID security check)
    const sessionUserId = session.userInfo.userId || session.userInfo.firebaseUid;
    if (sessionUserId !== req.user.uid) {
      console.log('❌ Session end access denied - session ownership mismatch:', {
        sessionUserId: sessionUserId,
        requestUserId: req.user.uid,
        sessionId: sessionId
      });
      return errorResponse(res, 'Unauthorized to access this chat session', 403);
    }

    if (session.status !== 'active') {
      return errorResponse(res, 'Chat session is already ended', 400);
    }

    console.log('✅ Session ownership verified, ending session...');

    // End the session with optional status
    const endStatus = status || 'ended';
    await session.endSession('user', endStatus);
    
    // Update session with additional end information if provided
    if (endTime) {
      session.endTime = new Date(endTime);
      await session.save();
    }

    // Create session end system message
    const endMessage = new ChatMessage({
      messageId: ChatMessage.generateMessageId(),
      sessionId: sessionId,
      sessionRef: session._id,
      message: 'Chat session has been ended. Thank you for contacting Yoraa Support!',
      sender: 'admin',
      senderInfo: {
        name: 'Yoraa Support',
        email: 'support@yoraa.com',
        avatar: 'YS',
        isGuest: false,
      },
      messageType: 'system',
      isSystemMessage: true,
      systemMessageType: 'session_end',
      timestamp: new Date(),
    });

    await endMessage.save();

    // Submit rating if provided
    if (rating) {
      // Build user info with fallbacks for different auth methods (same as submitRating)
      let userInfo = {
        isGuest: false,
        authMethod: 'guest'
      };

      if (req.user) {
        userInfo = {
          userId: null,
          name: req.user.name || req.user.email || req.user.phoneNumber || 'User',
          email: req.user.email || null,
          phone: req.user.phoneNumber || null,
          authMethod: req.user.authMethod || 'unknown',
          isGuest: false
        };

        // Provide better fallback names based on auth method
        if (!userInfo.name || userInfo.name === userInfo.email || userInfo.name === userInfo.phone) {
          switch (userInfo.authMethod) {
            case 'phone':
              userInfo.name = userInfo.phone ? `Phone User (${userInfo.phone.slice(-4)})` : 'Phone User';
              break;
            case 'google':
              userInfo.name = 'Google User';
              break;
            case 'apple':
              userInfo.name = 'Apple User';
              break;
            case 'email':
              userInfo.name = 'Email User';
              break;
            default:
              userInfo.name = 'User';
          }
        }
      } else if (session.userInfo) {
        userInfo = {
          userId: session.userInfo.userId || null,
          name: session.userInfo.name || 'User',
          email: session.userInfo.email || null,
          phone: session.userInfo.phone || null,
          authMethod: session.userInfo.authMethod || 'guest',
          isGuest: session.userInfo.isGuest || false
        };
      }

      const adminInfo = session.adminInfo ? {
        adminId: session.adminInfo.adminId || null,
        name: session.adminInfo.name || 'Support',
        email: session.adminInfo.email || null
      } : {
        adminId: null,
        name: 'Support',
        email: null
      };

      const chatRating = new ChatRating({
        ratingId: ChatRating.generateRatingId(),
        sessionId: sessionId,
        sessionRef: session._id,
        userInfo: userInfo,
        adminInfo: adminInfo,
        rating: rating,
        feedback: feedback || '',
        sessionDetails: {
          duration: session.duration,
          messageCount: session.messageCount,
          sessionStartTime: session.startTime,
          sessionEndTime: session.endTime,
        },
        timestamp: new Date(),
      });

      await chatRating.save();
      console.log('⭐ Rating saved successfully:', rating, feedback);
    }

    console.log('✅ Session ended successfully:', {
      sessionId: session.sessionId,
      status: session.status,
      endTime: session.endTime,
      duration: session.duration
    });

    return successResponse(res, {
      sessionId: session.sessionId,
      status: session.status,
      endTime: session.endTime,
      duration: session.duration,
      rating: rating || null,
      feedback: feedback || null
    }, 'Chat session ended successfully');

  } catch (error) {
    console.error('❌ Session end error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request details:', {
      sessionId: req.body.sessionId,
      userId: req.user?.uid,
      endpoint: '/api/chat/session/end'
    });
    
    // Provide more specific error messages in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment ? 
      `Failed to end chat session: ${error.message}` : 
      'Failed to end chat session';
    
    return errorResponse(res, errorMessage, 500);
  }
};

/**
 * Get user's chat history
 * GET /api/chat/history
 */
const getChatHistory = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Find sessions using Firebase UID (flexible matching)
    const sessions = await ChatSession.find({
      $or: [
        { 'userInfo.userId': req.user.uid },
        { 'userInfo.firebaseUid': req.user.uid }
      ]
    })
    .populate('assignedAdmin', 'name email')
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    const totalSessions = await ChatSession.countDocuments({
      $or: [
        { 'userInfo.userId': req.user.uid },
        { 'userInfo.firebaseUid': req.user.uid }
      ]
    });

    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      rating: session.rating,
      messageCount: session.messageCount,
      duration: session.duration || 0,
      assignedAdmin: session.assignedAdmin ? {
        name: session.assignedAdmin.name,
        email: session.assignedAdmin.email,
      } : null,
    }));

    return successResponse(res, {
      sessions: formattedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit),
      },
    }, 'Chat history retrieved successfully');

  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return errorResponse(res, 'Failed to retrieve chat history', 500);
  }
};

// ---------- CHAT MESSAGE CONTROLLERS ----------

/**
 * Send a chat message
 * POST /api/chat/message
 */
const sendMessage = async (req, res) => {
  try {
    // Frontend sends: { sessionId, message, sender, timestamp, messageId }
    const { 
      sessionId, 
      message, 
      sender = 'user',
      timestamp,
      messageId,
      messageType = 'text', 
      attachments = [] 
    } = req.body;

    console.log('📧 Message endpoint called with:', {
      sessionId,
      message: message?.substring(0, 50) + '...',
      sender,
      messageId,
      userUid: req.user?.uid
    });

    if (!sessionId || !message) {
      console.log('❌ Missing required fields:', { sessionId: !!sessionId, message: !!message });
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

    // Verify user is authenticated (required for sending messages)
    if (!req.user) {
      return errorResponse(res, 'Authentication required to send messages', 401);
    }

    console.log('📧 Sending message from user:', {
      uid: req.user.uid,
      email: req.user.email,
      sessionId: sessionId
    });

    // Verify user owns this session (Firebase UID security check)
    const sessionUserId = session.userInfo.userId || session.userInfo.firebaseUid;
    if (sessionUserId !== req.user.uid) {
      console.log('❌ Session ownership mismatch:', {
        sessionUserId: sessionUserId,
        requestUserId: req.user.uid
      });
      return errorResponse(res, 'Unauthorized to access this chat session', 403);
    }

    // Set sender info for authenticated Firebase user
    const senderInfo = {
      // Firebase UID as primary identifier
      userId: req.user.uid,
      firebaseUid: req.user.uid,
      
      // Database user reference if available
      dbUserId: req.user._id || null,
      
      // User display information
      name: req.user.name || 'Customer',
      email: req.user.email || null,
      avatar: req.user.name ? req.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C',
      
      // Authentication details
      isGuest: false,
      authSource: req.user.authSource || 'firebase',
      emailVerified: req.user.emailVerified || false
    };

    // Create new message using frontend-provided or generated messageId
    const finalMessageId = messageId || ChatMessage.generateMessageId();
    
    console.log('💾 Creating message:', {
      finalMessageId,
      sessionId,
      sender,
      messageLength: message.length
    });

    const newMessage = new ChatMessage({
      messageId: finalMessageId,
      sessionId: sessionId,
      sessionRef: session._id,
      message: message,
      sender: sender === 'user' ? 'user' : 'admin', // Validate sender
      senderInfo: senderInfo,
      messageType: messageType,
      attachments: attachments.map(att => ({
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        fileType: att.fileType,
        uploadedAt: new Date(),
      })),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        platform: req.body.platform || 'web',
      },
    });

    console.log('💾 Saving message to database...');
    await newMessage.save();
    console.log('✅ Message saved successfully:', finalMessageId);

    // Update session's last message time
    await ChatSession.updateOne(
      { sessionId },
      { 
        lastMessageAt: new Date(),
        $inc: { messageCount: 1 }
      }
    );

    return successResponse(res, {
      messageId: newMessage.messageId,
      sessionId: newMessage.sessionId,
      message: newMessage.message,
      sender: newMessage.sender,
      timestamp: newMessage.timestamp,
      status: 'sent'
    }, 'Message sent successfully');

  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to send message';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = `Message validation failed: ${error.message}`;
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = 'Message ID already exists, please retry';
      statusCode = 409;
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid session reference';
      statusCode = 400;
    }
    
    return errorResponse(res, errorMessage, statusCode);
  }
};

/**
 * Get chat messages for a session
 * GET /api/chat/messages/:sessionId
 */
const getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { after, limit = 50 } = req.query;

    // Find the session
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Get messages
    const messages = await ChatMessage.getSessionMessages(sessionId, {
      after,
      limit: parseInt(limit),
    });

    return successResponse(res, {
      messages: messages,
    }, 'Messages retrieved successfully');

  } catch (error) {
    console.error('Error retrieving messages:', error);
    return errorResponse(res, 'Failed to retrieve messages', 500);
  }
};

/**
 * Poll for new messages (for real-time updates)
 * GET /api/chat/poll/:sessionId
 */
const pollForMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { after } = req.query;

    // Verify user is authenticated
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // Find the session
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Verify user owns this session (Firebase UID security check)
    const sessionUserId = session.userInfo.userId || session.userInfo.firebaseUid;
    if (sessionUserId !== req.user.uid) {
      console.log('❌ Poll access denied - session ownership mismatch:', {
        sessionUserId: sessionUserId,
        requestUserId: req.user.uid
      });
      return errorResponse(res, 'Unauthorized to access this chat session', 403);
    }

    // Get new messages
    const messages = await ChatMessage.getNewMessages(sessionId, after);

    return successResponse(res, {
      messages: messages,
      sessionEnded: session.status !== 'active',
    }, 'Messages retrieved successfully');

  } catch (error) {
    console.error('Error polling messages:', error);
    return errorResponse(res, 'Failed to poll messages', 500);
  }
};

/**
 * Mark messages as read
 * PATCH /api/chat/messages/:sessionId/read
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messageIds } = req.body;

    if (messageIds && Array.isArray(messageIds)) {
      await ChatMessage.updateMany(
        { 
          sessionId,
          messageId: { $in: messageIds },
          sender: 'admin'
        },
        { 
          status: 'read',
          'metadata.readAt': new Date()
        }
      );
    } else {
      // Mark all admin messages as read
      await ChatMessage.updateMany(
        { 
          sessionId,
          sender: 'admin',
          status: { $ne: 'read' }
        },
        { 
          status: 'read',
          'metadata.readAt': new Date()
        }
      );
    }

    return successResponse(res, null, 'Messages marked as read');

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return errorResponse(res, 'Failed to mark messages as read', 500);
  }
};

// ---------- RATING CONTROLLERS ----------

/**
 * Submit chat rating
 * POST /api/chat/rating
 */
const submitRating = async (req, res) => {
  try {
    console.log('🌟 Chat rating submission received:', {
      sessionId: req.body.sessionId,
      rating: req.body.rating,
      user: req.user ? {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        phone: req.user.phoneNumber,
        authMethod: req.user.authMethod
      } : 'No user authenticated'
    });

    const { sessionId, rating, feedback, categories } = req.body;

    if (!sessionId || !rating) {
      return errorResponse(res, 'Session ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse(res, 'Rating must be between 1 and 5', 400);
    }

    // Find the session
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return errorResponse(res, 'Chat session not found', 404);
    }

    // Check if rating already exists
    const existingRating = await ChatRating.findOne({ sessionId });
    if (existingRating) {
      return errorResponse(res, 'Rating already submitted for this session', 400);
    }

    // Build user info with fallbacks for different auth methods
    let userInfo = {
      isGuest: false,
      authMethod: 'guest'
    };

    if (req.user) {
      // Get user info from Firebase token (authenticated user)
      userInfo = {
        userId: null, // We don't have MongoDB User ID here
        name: req.user.name || req.user.email || req.user.phoneNumber || 'User',
        email: req.user.email || null,
        phone: req.user.phoneNumber || null,
        authMethod: req.user.authMethod || 'unknown',
        isGuest: false
      };

      // Provide better fallback names based on auth method
      if (!userInfo.name || userInfo.name === userInfo.email || userInfo.name === userInfo.phone) {
        switch (userInfo.authMethod) {
          case 'phone':
            userInfo.name = userInfo.phone ? `Phone User (${userInfo.phone.slice(-4)})` : 'Phone User';
            break;
          case 'google':
            userInfo.name = userInfo.email ? `Google User` : 'Google User';
            break;
          case 'apple':
            userInfo.name = 'Apple User';
            break;
          case 'email':
            userInfo.name = userInfo.email ? `Email User` : 'Email User';
            break;
          default:
            userInfo.name = 'User';
        }
      }
    } else if (session.userInfo) {
      // Use session user info as fallback
      userInfo = {
        userId: session.userInfo.userId || null,
        name: session.userInfo.name || 'User',
        email: session.userInfo.email || null,
        phone: session.userInfo.phone || null,
        authMethod: session.userInfo.authMethod || 'guest',
        isGuest: session.userInfo.isGuest || false
      };
    }

    console.log('👤 Final user info for rating:', userInfo);

    // Build admin info with fallbacks
    const adminInfo = session.adminInfo ? {
      adminId: session.adminInfo.adminId || null,
      name: session.adminInfo.name || 'Support',
      email: session.adminInfo.email || null
    } : {
      adminId: null,
      name: 'Support',
      email: null
    };

    // Create new rating
    const newRating = new ChatRating({
      ratingId: ChatRating.generateRatingId(),
      sessionId: sessionId,
      sessionRef: session._id,
      userInfo: userInfo,
      adminInfo: adminInfo,
      rating: rating,
      feedback: feedback || '',
      categories: categories || {},
      sessionDetails: {
        duration: session.duration,
        messageCount: session.messageCount,
        sessionStartTime: session.startTime,
        sessionEndTime: session.endTime,
      },
      timestamp: new Date(),
      source: req.body.source || 'web_app',
    });

    console.log('💾 Attempting to save rating:', {
      ratingId: newRating.ratingId,
      sessionId: newRating.sessionId,
      rating: newRating.rating
    });

    await newRating.save();

    console.log('✅ Rating saved successfully');

    return successResponse(res, {
      ratingId: newRating.ratingId,
      sessionId: newRating.sessionId,
      rating: newRating.rating,
      feedback: newRating.feedback,
    }, 'Rating submitted successfully');

  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return errorResponse(res, 'Failed to submit rating', 500);
  }
};

/**
 * Get rating details
 * GET /api/chat/rating/:sessionId
 */
const getRating = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const rating = await ChatRating.findOne({ sessionId })
      .populate('sessionRef')
      .lean();

    if (!rating) {
      return errorResponse(res, 'Rating not found', 404);
    }

    return successResponse(res, rating, 'Rating retrieved successfully');

  } catch (error) {
    console.error('Error retrieving rating:', error);
    return errorResponse(res, 'Failed to retrieve rating', 500);
  }
};

// Import admin controllers
const adminController = require('./chatAdminController');

module.exports = {
  // User chat functions
  createChatSession,
  getChatSession,
  endChatSession,
  getChatHistory,
  sendMessage,
  getChatMessages,
  pollForMessages,
  markMessagesAsRead,
  submitRating,
  getRating,
  
  // Admin chat functions
  getActiveSessions: adminController.getActiveSessions,
  getAllSessions: adminController.getAllSessions,
  getAdminSessionDetails: adminController.getAdminSessionDetails,
  sendAdminMessage: adminController.sendAdminMessage,
  endSessionAsAdmin: adminController.endSessionAsAdmin,
  assignSession: adminController.assignSession,
  addSessionTags: adminController.addSessionTags,
  escalateSession: adminController.escalateSession,
  addAdminNotes: adminController.addAdminNotes,
  getChatAnalytics: adminController.getChatAnalytics,
  getAdminPerformance: adminController.getAdminPerformance,
  getSessionAnalytics: adminController.getSessionAnalytics,
  
  // Utility functions
  healthCheck: adminController.healthCheck,
  getChatConfig: adminController.getChatConfig,
  testEndpoint: adminController.testEndpoint,
};
