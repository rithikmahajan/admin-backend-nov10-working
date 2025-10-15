// Firebase Messaging Service Worker
// This file must be in the public folder to be accessible as /firebase-messaging-sw.js

// Import Firebase scripts for the service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration (should match your main app config)
const firebaseConfig = {
  apiKey: "AIzaSyCIYkTNzIrk_RugNOybriphlQ8aVTJ-KD8",
  authDomain: "yoraa-android-ios.firebaseapp.com",
  projectId: "yoraa-android-ios",
  storageBucket: "yoraa-android-ios.firebasestorage.app",
  messagingSenderId: "133733122921",
  appId: "1:133733122921:web:2d177abff9fb94ef35b3f8",
  measurementId: "G-HXS9N6W9D4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification?.title || 'Yoraa Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.image || '/logo192.png',
    image: payload.notification?.image,
    badge: '/logo192.png',
    data: {
      click_action: payload.fcm_options?.link || payload.data?.deepLink || '/',
      ...payload.data,
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ],
    tag: 'yoraa-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  const { action, notification } = event;
  const clickAction = notification.data?.click_action || '/';

  // Close the notification
  notification.close();

  if (action === 'close') {
    // User clicked close, do nothing
    return;
  }

  // Handle the click action (open app, navigate to specific page, etc.)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // App is open, focus it and navigate to the click action URL
            if (clickAction && clickAction !== '/') {
              client.navigate(clickAction);
            }
            return client.focus();
          }
        }

        // App is not open, open it
        if (clients.openWindow) {
          const urlToOpen = clickAction.startsWith('http') 
            ? clickAction 
            : `${self.location.origin}${clickAction}`;
          
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed');
  
  // Track notification close events if needed
  // You can send analytics data here
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});
