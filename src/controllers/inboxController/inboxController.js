const mongoose = require("mongoose");
const Message = require("../../models/Inbox");
const User = require("../../models/User");

// Get all messages for a specific folder
exports.getMessages = async (req, res) => {
  try {
    const { folder = 'inbox' } = req.params;
    const { page = 1, limit = 50, search = '', priority = '', category = '' } = req.query;
    const userId = req.user._id;

    console.log(`[getMessages] Fetching ${folder} messages for user: ${userId}`);

    // Build query based on folder type
    let query = {};
    
    switch (folder) {
      case 'inbox':
        query = { 
          'recipient.userId': userId,
          folder: 'inbox',
          status: { $ne: 'deleted' }
        };
        break;
      case 'sent':
        query = { 
          'sender.userId': userId,
          folder: 'sent'
        };
        break;
      case 'starred':
        query = {
          $or: [
            { 'recipient.userId': userId },
            { 'sender.userId': userId }
          ],
          isStarred: true,
          status: { $ne: 'deleted' }
        };
        break;
      case 'important':
        query = {
          $or: [
            { 'recipient.userId': userId },
            { 'sender.userId': userId }
          ],
          isImportant: true,
          status: { $ne: 'deleted' }
        };
        break;
      case 'draft':
        query = {
          'sender.userId': userId,
          folder: 'draft'
        };
        break;
      case 'spam':
        query = {
          'recipient.userId': userId,
          folder: 'spam'
        };
        break;
      case 'bin':
        query = {
          $or: [
            { 'recipient.userId': userId },
            { 'sender.userId': userId }
          ],
          folder: 'bin'
        };
        break;
      case 'archived':
        query = {
          $or: [
            { 'recipient.userId': userId },
            { 'sender.userId': userId }
          ],
          folder: 'archived'
        };
        break;
      default:
        query = { 
          'recipient.userId': userId,
          folder: 'inbox',
          status: { $ne: 'deleted' }
        };
    }

    // Add search filter
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { subject: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { 'sender.name': { $regex: search, $options: 'i' } },
          { 'sender.email': { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Add priority filter
    if (priority) {
      query.priority = priority;
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch messages with pagination
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender.userId', 'name email')
      .populate('recipient.userId', 'name email')
      .lean();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments(query);

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      sender: msg.sender.name,
      email: msg.sender.email,
      subject: msg.subject,
      preview: msg.preview,
      content: msg.content,
      tag: msg.category,
      time: msg.formattedTime || new Date(msg.createdAt).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: msg.formattedDate || (
        new Date().toDateString() === new Date(msg.createdAt).toDateString() 
          ? 'Today' 
          : new Date(msg.createdAt).toLocaleDateString()
      ),
      unread: msg.status === 'unread',
      important: msg.isImportant,
      starred: msg.isStarred,
      avatar: msg.sender.avatar,
      priority: msg.priority,
      messageType: msg.messageType,
      source: msg.source,
      attachments: msg.attachments || [],
      threadId: msg.threadId,
      replyCount: msg.replyCount
    }));

    console.log(`[getMessages] Found ${formattedMessages.length} messages for ${folder}`);

    res.status(200).json({
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          hasNext: skip + messages.length < totalMessages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error(`[getMessages] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message
    });
  }
};

// Get folder counts
exports.getFolderCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`[getFolderCounts] Getting counts for user: ${userId}`);

    const counts = await Message.getFolderCounts(userId);

    res.status(200).json({
      success: true,
      data: counts
    });

  } catch (error) {
    console.error(`[getFolderCounts] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to get folder counts",
      error: error.message
    });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      subject, 
      content, 
      category = 'Primary',
      priority = 'normal',
      messageType = 'user_message'
    } = req.body;

    const senderId = req.user._id;
    const sender = await User.findById(senderId);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found"
      });
    }

    console.log(`[sendMessage] Sending message from ${sender.email} to ${recipientEmail}`);

    // Find recipient user if exists
    let recipientUser = null;
    if (recipientEmail) {
      recipientUser = await User.findOne({ email: recipientEmail });
    }

    // Create new message
    const newMessage = new Message({
      sender: {
        name: sender.name || 'User',
        email: sender.email,
        userId: senderId,
        avatar: (sender.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
      },
      recipient: {
        name: recipientName || recipientUser?.name || 'Support',
        email: recipientEmail || 'contact@yoraa.in',
        userId: recipientUser?._id || null
      },
      subject,
      content,
      category,
      priority,
      messageType,
      source: 'web_app',
      folder: 'inbox',
      status: 'unread'
    });

    await newMessage.save();

    // Also create a copy in sender's sent folder
    const sentMessage = new Message({
      sender: {
        name: sender.name || 'User',
        email: sender.email,
        userId: senderId,
        avatar: (sender.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
      },
      recipient: {
        name: recipientName || recipientUser?.name || 'Support',
        email: recipientEmail || 'contact@yoraa.in',
        userId: recipientUser?._id || null
      },
      subject,
      content,
      category,
      priority,
      messageType,
      source: 'web_app',
      folder: 'sent',
      status: 'read',
      threadId: newMessage.threadId
    });

    await sentMessage.save();

    console.log(`[sendMessage] Message sent successfully with ID: ${newMessage._id}`);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        messageId: newMessage._id,
        threadId: newMessage.threadId
      }
    });

  } catch (error) {
    console.error(`[sendMessage] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message
    });
  }
};

// Get a specific message
exports.getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    console.log(`[getMessage] Fetching message ${messageId} for user: ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [
        { 'recipient.userId': userId },
        { 'sender.userId': userId }
      ]
    }).populate('sender.userId', 'name email')
      .populate('recipient.userId', 'name email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Mark as read if user is recipient
    if (message.recipient.userId?.toString() === userId.toString() && message.status === 'unread') {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();
    }

    const formattedMessage = {
      id: message._id,
      sender: message.sender.name,
      email: message.sender.email,
      subject: message.subject,
      content: message.content,
      preview: message.preview,
      tag: message.category,
      time: new Date(message.createdAt).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: new Date().toDateString() === new Date(message.createdAt).toDateString() 
        ? 'Today' 
        : new Date(message.createdAt).toLocaleDateString(),
      unread: message.status === 'unread',
      important: message.isImportant,
      starred: message.isStarred,
      avatar: message.sender.avatar,
      priority: message.priority,
      messageType: message.messageType,
      source: message.source,
      attachments: message.attachments || [],
      threadId: message.threadId,
      replyCount: message.replyCount
    };

    res.status(200).json({
      success: true,
      data: formattedMessage
    });

  } catch (error) {
    console.error(`[getMessage] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message",
      error: error.message
    });
  }
};

// Reply to a message
exports.replyMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, priority = 'normal' } = req.body;
    const userId = req.user._id;

    console.log(`[replyMessage] Replying to message ${messageId} from user: ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Original message not found"
      });
    }

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found"
      });
    }

    // Create reply message
    const replyMessage = new Message({
      sender: {
        name: sender.name || 'User',
        email: sender.email,
        userId: userId,
        avatar: (sender.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
      },
      recipient: originalMessage.sender,
      subject: originalMessage.subject.startsWith('Re: ') 
        ? originalMessage.subject 
        : `Re: ${originalMessage.subject}`,
      content,
      category: originalMessage.category,
      priority,
      messageType: originalMessage.messageType,
      source: 'web_app',
      folder: 'inbox',
      status: 'unread',
      threadId: originalMessage.threadId,
      parentMessageId: originalMessage._id
    });

    await replyMessage.save();

    // Update original message reply count
    await Message.findByIdAndUpdate(originalMessage._id, {
      $inc: { replyCount: 1 }
    });

    // Update all messages in thread
    await Message.updateMany(
      { threadId: originalMessage.threadId },
      { $inc: { replyCount: 1 } }
    );

    // Create sent copy
    const sentReply = new Message({
      sender: {
        name: sender.name || 'User',
        email: sender.email,
        userId: userId,
        avatar: (sender.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
      },
      recipient: originalMessage.sender,
      subject: originalMessage.subject.startsWith('Re: ') 
        ? originalMessage.subject 
        : `Re: ${originalMessage.subject}`,
      content,
      category: originalMessage.category,
      priority,
      messageType: originalMessage.messageType,
      source: 'web_app',
      folder: 'sent',
      status: 'read',
      threadId: originalMessage.threadId,
      parentMessageId: originalMessage._id
    });

    await sentReply.save();

    console.log(`[replyMessage] Reply sent successfully with ID: ${replyMessage._id}`);

    res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: {
        messageId: replyMessage._id,
        threadId: replyMessage.threadId
      }
    });

  } catch (error) {
    console.error(`[replyMessage] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
      error: error.message
    });
  }
};

// Update message status (read, star, important, etc.)
exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, isStarred, isImportant, folder } = req.body;
    const userId = req.user._id;

    console.log(`[updateMessageStatus] Updating message ${messageId} for user: ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const updateFields = {};
    
    if (status !== undefined) updateFields.status = status;
    if (isStarred !== undefined) updateFields.isStarred = isStarred;
    if (isImportant !== undefined) updateFields.isImportant = isImportant;
    if (folder !== undefined) updateFields.folder = folder;

    // Add timestamp for specific actions
    if (status === 'read') updateFields.readAt = new Date();
    if (folder === 'archived') updateFields.archivedAt = new Date();
    if (folder === 'bin') updateFields.deletedAt = new Date();

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        $or: [
          { 'recipient.userId': userId },
          { 'sender.userId': userId }
        ]
      },
      updateFields,
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    console.log(`[updateMessageStatus] Message ${messageId} updated successfully`);

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: {
        messageId: message._id,
        status: message.status,
        isStarred: message.isStarred,
        isImportant: message.isImportant,
        folder: message.folder
      }
    });

  } catch (error) {
    console.error(`[updateMessageStatus] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to update message",
      error: error.message
    });
  }
};

// Bulk update messages
exports.bulkUpdateMessages = async (req, res) => {
  try {
    const { messageIds, action, folder, status } = req.body;
    const userId = req.user._id;

    console.log(`[bulkUpdateMessages] ${action} operation for user: ${userId} on ${messageIds.length} messages`);

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message IDs"
      });
    }

    const updateFields = {};
    
    switch (action) {
      case 'markRead':
        updateFields.status = 'read';
        updateFields.readAt = new Date();
        break;
      case 'markUnread':
        updateFields.status = 'unread';
        break;
      case 'star':
        updateFields.isStarred = true;
        break;
      case 'unstar':
        updateFields.isStarred = false;
        break;
      case 'archive':
        updateFields.folder = 'archived';
        updateFields.archivedAt = new Date();
        break;
      case 'delete':
        updateFields.folder = 'bin';
        updateFields.deletedAt = new Date();
        break;
      case 'spam':
        updateFields.folder = 'spam';
        break;
      case 'moveTo':
        if (folder) updateFields.folder = folder;
        if (status) updateFields.status = status;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action"
        });
    }

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds.map(id => mongoose.Types.ObjectId(id)) },
        $or: [
          { 'recipient.userId': userId },
          { 'sender.userId': userId }
        ]
      },
      updateFields
    );

    console.log(`[bulkUpdateMessages] Updated ${result.modifiedCount} messages`);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} messages`,
      data: {
        modifiedCount: result.modifiedCount,
        action
      }
    });

  } catch (error) {
    console.error(`[bulkUpdateMessages] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to update messages",
      error: error.message
    });
  }
};

// Delete message permanently
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    console.log(`[deleteMessage] Permanently deleting message ${messageId} for user: ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID"
      });
    }

    const result = await Message.deleteOne({
      _id: messageId,
      $or: [
        { 'recipient.userId': userId },
        { 'sender.userId': userId }
      ]
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    console.log(`[deleteMessage] Message ${messageId} deleted successfully`);

    res.status(200).json({
      success: true,
      message: "Message deleted permanently"
    });

  } catch (error) {
    console.error(`[deleteMessage] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message
    });
  }
};

// Create message from external source (e.g., contact form)
exports.createExternalMessage = async (req, res) => {
  try {
    const { 
      senderName, 
      senderEmail, 
      subject, 
      content, 
      messageType = 'contact_form',
      source = 'email',
      priority = 'normal'
    } = req.body;

    console.log(`[createExternalMessage] Creating external message from ${senderEmail}`);

    // Find admin users to send the message to
    const adminUsers = await User.find({ isAdmin: true });
    
    if (adminUsers.length === 0) {
      // If no admin users, create message for contact@yoraa.in
      const newMessage = new Message({
        sender: {
          name: senderName,
          email: senderEmail,
          avatar: senderName.split(' ').map(n => n[0]).join('').toUpperCase(),
          userId: null
        },
        recipient: {
          name: 'Yoraa Support',
          email: 'contact@yoraa.in',
          userId: null
        },
        subject,
        content,
        category: 'Support',
        priority,
        messageType,
        source,
        folder: 'inbox',
        status: 'unread'
      });

      await newMessage.save();
      
      return res.status(201).json({
        success: true,
        message: "Message created successfully",
        data: { messageId: newMessage._id }
      });
    }

    // Create message for each admin user
    const messagePromises = adminUsers.map(admin => {
      const message = new Message({
        sender: {
          name: senderName,
          email: senderEmail,
          avatar: senderName.split(' ').map(n => n[0]).join('').toUpperCase(),
          userId: null
        },
        recipient: {
          name: admin.name || 'Admin',
          email: admin.email,
          userId: admin._id
        },
        subject,
        content,
        category: 'Support',
        priority,
        messageType,
        source,
        folder: 'inbox',
        status: 'unread'
      });

      return message.save();
    });

    await Promise.all(messagePromises);

    console.log(`[createExternalMessage] External message created for ${adminUsers.length} admin users`);

    res.status(201).json({
      success: true,
      message: "Message sent successfully to admin team",
      data: { 
        recipientCount: adminUsers.length 
      }
    });

  } catch (error) {
    console.error(`[createExternalMessage] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to create external message",
      error: error.message
    });
  }
};

// Get thread messages
exports.getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user._id;

    console.log(`[getThreadMessages] Fetching thread ${threadId} for user: ${userId}`);

    const messages = await Message.find({
      threadId,
      $or: [
        { 'recipient.userId': userId },
        { 'sender.userId': userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender.userId', 'name email')
    .populate('recipient.userId', 'name email');

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      sender: msg.sender.name,
      email: msg.sender.email,
      subject: msg.subject,
      content: msg.content,
      time: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: new Date(msg.createdAt).toLocaleDateString(),
      avatar: msg.sender.avatar,
      isCurrentUser: msg.sender.userId?.toString() === userId.toString()
    }));

    res.status(200).json({
      success: true,
      data: {
        threadId,
        messages: formattedMessages
      }
    });

  } catch (error) {
    console.error(`[getThreadMessages] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch thread messages",
      error: error.message
    });
  }
};
