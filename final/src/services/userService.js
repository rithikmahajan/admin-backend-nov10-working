import axios from 'axios';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  where,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
// Backend-only approach - no client-side Firestore

// Base API URL - adjust this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class UserService {
  // Fetch all users from Firebase
  async fetchAllUsers() {
    try {
      const usersCollection = collection(db, 'users');
      const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(usersQuery);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          firebaseId: doc.id,
          name: userData.displayName || userData.name || 'Unknown User',
          email: userData.email || '',
          phone: userData.phoneNumber || userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          address: userData.address || '',
          userName: userData.username || userData.displayName || '',
          gender: userData.gender || '',
          pointBalance: userData.points || 0,
          isBlocked: userData.isBlocked || false,
          accountStatus: userData.isBlocked ? 'blocked' : 'active',
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          blockReason: userData.blockReason || null,
          blockedAt: userData.blockedAt || null,
          blockedBy: userData.blockedBy || null,
          // Add app reviews if available
          appReviews: userData.reviews ? {
            rating: userData.reviews.rating || 0,
            text: userData.reviews.text || ''
          } : { rating: 0, text: '' },
          // Add password placeholder (never show real password)
          passwordDetails: '••••••••',
          showPassword: false,
          // Delete account record status
          deleteAccountRecord: userData.deleteRequested ? 'Requested' : 'Present'
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users from Firebase:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  // Block a user
  async blockUser(userId, reason = 'Admin action') {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userRef = doc(db, 'users', userId);
      
      // First check if user exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const updateData = {
        isBlocked: true,
        blockReason: reason,
        blockedAt: serverTimestamp(),
        blockedBy: 'admin',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);

      // Also try to update via backend API if available
      try {
        await apiClient.patch(`/users/${userId}/block`, {
          reason,
          blockedBy: 'admin'
        });
      } catch (apiError) {
        console.warn('Backend API not available, using Firebase only:', apiError.message);
      }
      
      return {
        userId,
        isBlocked: true,
        accountStatus: 'blocked',
        blockReason: reason,
        blockedAt: new Date().toISOString(),
        blockedBy: 'admin'
      };
    } catch (error) {
      console.error('Error blocking user:', error);
      throw new Error(`Failed to block user: ${error.message}`);
    }
  }

  // Unblock a user
  async unblockUser(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userRef = doc(db, 'users', userId);
      
      // First check if user exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const updateData = {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        unblockedAt: serverTimestamp(),
        unblockedBy: 'admin',
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);

      // Also try to update via backend API if available
      try {
        await apiClient.patch(`/users/${userId}/unblock`, {
          unblockedBy: 'admin'
        });
      } catch (apiError) {
        console.warn('Backend API not available, using Firebase only:', apiError.message);
      }
      
      return {
        userId,
        isBlocked: false,
        accountStatus: 'active',
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        unblockedAt: new Date().toISOString(),
        unblockedBy: 'admin'
      };
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw new Error(`Failed to unblock user: ${error.message}`);
    }
  }

  // Get user details
  async getUserDetails(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        firebaseId: userDoc.id,
        ...userData
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw new Error(`Failed to get user details: ${error.message}`);
    }
  }

  // Search users
  async searchUsers(searchTerm, filterType = 'all') {
    try {
      const usersCollection = collection(db, 'users');
      let usersQuery;
      
      if (filterType === 'blocked') {
        usersQuery = query(
          usersCollection, 
          where('isBlocked', '==', true),
          orderBy('blockedAt', 'desc')
        );
      } else if (filterType === 'active') {
        usersQuery = query(
          usersCollection, 
          where('isBlocked', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else {
        usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(usersQuery);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const user = {
          id: doc.id,
          firebaseId: doc.id,
          name: userData.displayName || userData.name || 'Unknown User',
          email: userData.email || '',
          phone: userData.phoneNumber || userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          address: userData.address || '',
          userName: userData.username || userData.displayName || '',
          gender: userData.gender || '',
          pointBalance: userData.points || 0,
          isBlocked: userData.isBlocked || false,
          accountStatus: userData.isBlocked ? 'blocked' : 'active',
          createdAt: userData.createdAt,
          ...userData
        };
        
        // Apply search filter if searchTerm is provided
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.phone && user.phone.includes(searchTerm)) ||
            (user.userName && user.userName.toLowerCase().includes(searchLower));
          
          if (matchesSearch) {
            users.push(user);
          }
        } else {
          users.push(user);
        }
      });
      
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  // Update user details
  async updateUser(userId, updateData) {
    try {
      const userRef = doc(db, 'users', userId);
      
      const dataToUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, dataToUpdate);
      
      return { userId, ...dataToUpdate };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Delete user (mark for deletion)
  async deleteUser(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      
      const updateData = {
        deleteRequested: true,
        deletedAt: serverTimestamp(),
        deletedBy: 'admin',
        isBlocked: true, // Also block the user
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      
      return { userId, deleted: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const usersCollection = collection(db, 'users');
      
      // Get all users
      const allUsersQuery = query(usersCollection);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      // Get blocked users
      const blockedUsersQuery = query(usersCollection, where('isBlocked', '==', true));
      const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
      
      // Get active users
      const activeUsersQuery = query(usersCollection, where('isBlocked', '==', false));
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      
      return {
        total: allUsersSnapshot.size,
        blocked: blockedUsersSnapshot.size,
        active: activeUsersSnapshot.size
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }
}

export default new UserService();
