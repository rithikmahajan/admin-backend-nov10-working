import notificationAPI from '../api/notificationAPI';

class NotificationService {
  // Upload image and return URL
  async uploadNotificationImage(imageFile) {
    try {
      const response = await notificationAPI.uploadImage(imageFile);
      if (response.success) {
        return {
          success: true,
          imageUrl: response.imageUrl,
        };
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading notification image:', error);
      throw new Error(error.response?.data?.message || error.message || 'Upload failed');
    }
  }

  // Send push notification
  async sendPushNotification(notificationData) {
    try {
      const response = await notificationAPI.sendNotification(notificationData);
      if (response.success) {
        return {
          success: true,
          message: response.message,
          data: response.response,
        };
      } else {
        throw new Error(response.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error(error.response?.data?.message || error.message || 'Send notification failed');
    }
  }

  // Get all notifications
  async getAllNotifications() {
    try {
      const response = await notificationAPI.getNotifications();
      if (response.success) {
        return {
          success: true,
          notifications: response.notifications,
        };
      } else {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || error.message || 'Fetch notifications failed');
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const response = await notificationAPI.getNotificationStats();
      if (response.success) {
        return {
          success: true,
          stats: response.stats,
        };
      } else {
        throw new Error(response.message || 'Failed to fetch notification stats');
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Fetch stats failed');
    }
  }

  // Validate notification data
  validateNotificationData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!data.body || data.body.trim().length === 0) {
      errors.push('Message body is required');
    }

    if (data.title && data.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    if (data.body && data.body.length > 500) {
      errors.push('Message body must be less than 500 characters');
    }

    if (data.deepLink && !this.isValidUrl(data.deepLink)) {
      errors.push('Deep link must be a valid URL or app scheme');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate URL format
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      // Check for app scheme format (e.g., app://product/123)
      return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(string);
    }
  }

  // Format notification data for API
  formatNotificationData(formData) {
    return {
      title: formData.title?.trim() || '',
      body: formData.body?.trim() || '',
      imageUrl: formData.imageUrl || null,
      deepLink: formData.deepLink?.trim() || null,
      targetPlatform: this.formatTargetPlatform(formData.platforms || []),
    };
  }

  // Format platform selection
  formatTargetPlatform(platforms) {
    if (!platforms || platforms.length === 0) {
      return 'both';
    }
    
    if (platforms.includes('android') && platforms.includes('ios')) {
      return 'both';
    }
    
    if (platforms.includes('android')) {
      return 'android';
    }
    
    if (platforms.includes('ios')) {
      return 'ios';
    }
    
    return 'both';
  }

  // Create test users with FCM tokens (development only)
  async createTestUsers() {
    try {
      const response = await notificationAPI.createTestUsers();
      if (response.success) {
        return {
          success: true,
          message: response.message,
          users: response.users,
        };
      } else {
        throw new Error(response.message || 'Failed to create test users');
      }
    } catch (error) {
      console.error('Error creating test users:', error);
      throw new Error(error.response?.data?.message || error.message || 'Create test users failed');
    }
  }
}

export default new NotificationService();
