import { getMessaging, getToken, onMessage as firebaseOnMessage } from 'firebase/messaging';
import app from '../config/firebaseConfig';

// Initialize Firebase Cloud Messaging
let messaging = null;

// FCM service for handling push notifications
class FCMService {
  constructor() {
    this.messaging = null;
    // Get VAPID key from environment or use placeholder
    this.vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;
    this.isSupported = this.checkSupport();
    
    // Warn if VAPID key is missing
    if (!this.vapidKey) {
      console.warn('⚠️ Firebase VAPID key is missing. Please add VITE_FIREBASE_VAPID_KEY to your .env file');
      console.warn('📝 To get your VAPID key: Go to Firebase Console > Project Settings > Cloud Messaging > Web Push certificates');
    } else {
      console.log('✅ Firebase VAPID key loaded successfully');
      // In development, log first few characters to confirm it's loaded
      if (import.meta.env.DEV) {
        console.log('🔑 VAPID key preview:', this.vapidKey.substring(0, 8) + '...');
      }
    }
  }

  // Check if FCM is supported in current browser
  checkSupport() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize FCM
  async init() {
    if (!this.isSupported) {
      console.warn('FCM is not supported in this browser');
      return false;
    }

    try {
      this.messaging = getMessaging(app);
      return true;
    } catch (error) {
      console.error('FCM initialization failed:', error);
      return false;
    }
  }

  // Request notification permission and get FCM token
  async requestPermission() {
    if (!this.messaging) {
      const initialized = await this.init();
      if (!initialized) return null;
    }

    try {
      // Request permission for notifications
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get registration token
        const currentToken = await getToken(this.messaging, {
          vapidKey: this.vapidKey,
        });

        if (currentToken) {
          console.log('FCM Registration token:', currentToken);
          // Store token in localStorage for easy access
          localStorage.setItem('fcmToken', currentToken);
          return currentToken;
        } else {
          console.log('No registration token available.');
          return null;
        }
      } else {
        console.log('Unable to get permission to notify.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
      return null;
    }
  }

  // Get current FCM token
  async getCurrentToken() {
    const storedToken = localStorage.getItem('fcmToken');
    if (storedToken) {
      return storedToken;
    }
    
    return await this.requestPermission();
  }

  // Listen for foreground messages
  onMessage(callback) {
    if (!this.messaging) {
      console.warn('FCM not initialized');
      return () => {};
    }

    return firebaseOnMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show notification if app is in foreground
      this.showNotification(payload);
      
      // Call custom callback
      if (callback && typeof callback === 'function') {
        callback(payload);
      }
    });
  }

  // Show browser notification
  showNotification(payload) {
    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.image || '/logo192.png',
      image: payload.notification?.image,
      data: {
        click_action: payload.fcm_options?.link || payload.data?.deepLink,
        ...payload.data,
      },
      badge: '/logo192.png',
      tag: 'yoraa-notification',
      renotify: true,
    };

    // Show the notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      new Notification(notificationTitle, notificationOptions);
    }
  }

  // Register service worker for background messages
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered successfully:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  // Update FCM token on the server
  async updateTokenOnServer(token) {
    try {
      // Get platform info
      const platform = this.getPlatform();
      
      // Send token to your backend
      const response = await fetch('/users/update-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          fcmToken: token,
          platform: platform,
        }),
      });

      if (response.ok) {
        console.log('FCM token updated on server successfully');
      } else {
        console.error('Failed to update FCM token on server');
      }
    } catch (error) {
      console.error('Error updating FCM token on server:', error);
    }
  }

  // Get current platform
  getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) {
      return 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else {
      return 'web';
    }
  }

  // Delete FCM token
  async deleteToken() {
    if (!this.messaging) {
      return false;
    }

    try {
      await deleteToken(this.messaging);
      localStorage.removeItem('fcmToken');
      console.log('FCM token deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete FCM token:', error);
      return false;
    }
  }
}

// Create singleton instance
const fcmService = new FCMService();

// Auto-initialize when module is loaded (optional)
fcmService.init();

// Default export of the service instance
export default fcmService;

// Named export for the service instance (for destructuring imports)
export { fcmService };

// Named exports for convenience (individual methods)
export const requestPermission = fcmService.requestPermission.bind(fcmService);
export const getCurrentToken = fcmService.getCurrentToken.bind(fcmService);
export const onMessage = fcmService.onMessage.bind(fcmService);
export const showNotification = fcmService.showNotification.bind(fcmService);
export const updateTokenOnServer = fcmService.updateTokenOnServer.bind(fcmService);
export const getPlatform = fcmService.getPlatform.bind(fcmService);

// Utility function to setup FCM for an app
export const setupFCM = async (onMessageCallback) => {
  // Register service worker
  await fcmService.registerServiceWorker();
  
  // Get FCM token
  const token = await fcmService.requestPermission();
  
  if (token) {
    // Update token on server
    await fcmService.updateTokenOnServer(token);
    
    // Listen for foreground messages
    fcmService.onMessage(onMessageCallback);
    
    return token;
  }
  
  return null;
};
