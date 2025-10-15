import API from './axiosConfig';

// Notification API endpoints
const notificationAPI = {
  // Upload notification image
  uploadImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await API.post('/notifications/upload-notification-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Send push notification
  sendNotification: async (notificationData) => {
    const response = await API.post('/notifications/send-notification', notificationData);
    return response.data;
  },

  // Get all notifications
  getNotifications: async () => {
    const response = await API.get('/notifications/notifications');
    return response.data;
  },

  // Get notification statistics
  getNotificationStats: async () => {
    const response = await API.get('/notifications/stats');
    return response.data;
  },

  // Create test users with FCM tokens (development only)
  createTestUsers: async () => {
    const response = await API.post('/notifications/create-test-users');
    return response.data;
  },
};

export default notificationAPI;
