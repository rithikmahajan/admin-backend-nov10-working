// Firestore Connection Manager
// This utility helps manage Firestore connections and handle errors gracefully

import { 
  enableNetwork, 
  disableNetwork, 
  doc, 
  getDoc, 
  onSnapshot,
  enableMultiTabIndexedDbPersistence 
} from 'firebase/firestore';
// Backend-only approach - no client-side Firestore

class FirestoreConnectionManager {
  constructor() {
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
    this.connectionListeners = [];
  }

  // Test Firestore connection
  async testConnection() {
    try {
      console.log('🔍 Testing Firestore connection...');
      
      // Try to read a simple document
      const testDocRef = doc(db, 'test', 'connection');
      await getDoc(testDocRef);
      
      this.isConnected = true;
      this.retryAttempts = 0;
      console.log('✅ Firestore connection successful');
      this.notifyListeners('connected');
      return true;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Firestore connection failed:', error);
      this.handleConnectionError(error);
      return false;
    }
  }

  // Handle different types of connection errors
  handleConnectionError(error) {
    switch (error.code) {
      case 'permission-denied':
        console.error('🔒 Permission denied - check Firestore security rules');
        this.notifyListeners('permission-denied', 'Permission denied. Please check authentication.');
        break;
      
      case 'unavailable':
        console.error('🌐 Firestore service unavailable');
        this.notifyListeners('unavailable', 'Service temporarily unavailable. Retrying...');
        this.retryConnection();
        break;
      
      case 'unauthenticated':
        console.error('🔐 User not authenticated');
        this.notifyListeners('unauthenticated', 'Please sign in to access this feature.');
        break;
      
      case 'failed-precondition':
        console.error('📋 Firestore precondition failed');
        this.notifyListeners('failed-precondition', 'Operation failed due to preconditions.');
        break;
      
      default:
        console.error('❓ Unknown Firestore error:', error.code, error.message);
        this.notifyListeners('unknown', `Connection error: ${error.message}`);
        this.retryConnection();
        break;
    }
  }

  // Retry connection with exponential backoff
  async retryConnection() {
    if (this.retryAttempts >= this.maxRetries) {
      console.error('❌ Max retry attempts reached');
      this.notifyListeners('max-retries', 'Unable to connect after multiple attempts. Please refresh the page.');
      return false;
    }

    this.retryAttempts++;
    const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
    
    console.log(`🔄 Retrying connection (attempt ${this.retryAttempts}/${this.maxRetries}) in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        await this.enableNetwork();
        await this.testConnection();
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }, delay);
  }

  // Enable Firestore network
  async enableNetwork() {
    try {
      await enableNetwork(db);
      console.log('✅ Firestore network enabled');
      return true;
    } catch (error) {
      console.error('❌ Failed to enable Firestore network:', error);
      return false;
    }
  }

  // Disable Firestore network
  async disableNetwork() {
    try {
      await disableNetwork(db);
      console.log('✅ Firestore network disabled');
      return true;
    } catch (error) {
      console.error('❌ Failed to disable Firestore network:', error);
      return false;
    }
  }

  // Add connection status listener
  addConnectionListener(callback) {
    this.connectionListeners.push(callback);
  }

  // Remove connection status listener
  removeConnectionListener(callback) {
    this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of connection status changes
  notifyListeners(status, message) {
    this.connectionListeners.forEach(callback => {
      try {
        callback({ status, message, isConnected: this.isConnected });
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Initialize connection monitoring
  async initialize() {
    console.log('🚀 Initializing Firestore Connection Manager...');
    
    // Test initial connection
    await this.testConnection();
    
    // Set up periodic connection monitoring
    setInterval(async () => {
      if (!this.isConnected) {
        await this.testConnection();
      }
    }, 30000); // Check every 30 seconds if disconnected
    
    console.log('✅ Firestore Connection Manager initialized');
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries
    };
  }
}

// Create singleton instance
const firestoreConnectionManager = new FirestoreConnectionManager();

// Initialize on module load
if (typeof window !== 'undefined') {
  firestoreConnectionManager.initialize();
}

export default firestoreConnectionManager;
