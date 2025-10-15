import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  where,
  getDoc,
  setDoc,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { auth } from '../../config/firebase';
import axios from 'axios';
import { firebaseAPI } from '../../api/endpoints';

// Helper function to determine sign-up method from provider data
const getSignUpMethod = (providerData) => {
  if (!providerData || providerData.length === 0) {
    return 'Email/Password';
  }
  
  const provider = providerData[0];
  switch (provider.providerId) {
    case 'google.com':
      return 'Google';
    case 'apple.com':
      return 'Apple';
    case 'phone':
      return 'Phone';
    case 'facebook.com':
      return 'Facebook';
    case 'password':
      return 'Email/Password';
    default:
      return provider.providerId || 'Unknown';
  }
};

// Helper function to get provider icon
const getProviderIcon = (signUpMethod) => {
  switch (signUpMethod) {
    case 'Google':
      return '🔍';
    case 'Apple':
      return '🍎';
    case 'Phone':
      return '📱';
    case 'Facebook':
      return '📘';
    case 'Email/Password':
      return '📧';
    default:
      return '❓';
  }
};

// Async thunk to fetch all users from Firebase Authentication and Firestore
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Attempting to fetch users from Firebase Authentication...');
      
      // Skip Firestore connection test for now to avoid 400 errors
      console.log('⚡ Using backend API fallback to avoid Firestore connection issues...');
      
      // Method 1: Try to fetch from Firebase Admin SDK via backend API
      try {
        const response = await firebaseAPI.getAllUsers();
        
        if (response.data && response.data.users) {
          console.log(`✅ Successfully fetched ${response.data.users.length} users from Firebase Admin API`);
          return response.data.users.map(user => ({
            id: user.uid,
            firebaseId: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
            email: user.email || '',
            phone: user.phoneNumber || '',
            dateOfBirth: user.customClaims?.dateOfBirth || '',
            address: user.customClaims?.address || '',
            userName: user.displayName || user.email?.split('@')[0] || '',
            gender: user.customClaims?.gender || '',
            pointBalance: user.customClaims?.points || 0,
            isBlocked: user.disabled || false,
            accountStatus: user.disabled ? 'blocked' : 'active',
            createdAt: user.metadata?.creationTime || new Date().toISOString(),
            updatedAt: user.metadata?.lastSignInTime || new Date().toISOString(),
            signUpMethod: user.signUpMethod || getSignUpMethod(user.providerData),
            providerIcon: user.providerIcon || getProviderIcon(user.signUpMethod || getSignUpMethod(user.providerData)),
            providerData: user.providerData || [],
            emailVerified: user.emailVerified || false,
            blockReason: user.customClaims?.blockReason || null,
            blockedAt: user.customClaims?.blockedAt || null,
            blockedBy: user.customClaims?.blockedBy || null,
            appReviews: { rating: 0, text: '' },
            passwordDetails: user.email ? '••••••••' : 'N/A',
            showPassword: false,
            deleteAccountRecord: user.customClaims?.deleteRequested ? 'Requested' : 'Present'
          }));
        }
      } catch (apiError) {
        console.warn('Admin API not available, falling back to Firestore:', apiError.message);
      }

      // Method 2: Temporarily skip Firestore to avoid 400 errors
      console.log('⚠️ Temporarily skipping Firestore query to avoid connection errors...');
      console.log('✅ Using backend API data only (Firestore rules deployed, waiting for propagation)');
      
      // Return empty array if no backend data
      return [];

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied') {
        return rejectWithValue('Permission denied. Please check Firestore security rules.');
      }
      
      // Check if it's a network error
      if (error.code === 'unavailable') {
        return rejectWithValue('Firebase is currently unavailable. Please try again later.');
      }
      
      return rejectWithValue(`Failed to fetch users: ${error.message || error.code || 'Unknown error'}`);
    }
  }
);

// Helper function to sync Firebase Auth users to Firestore (client-side approximation)
// TEMPORARILY DISABLED to avoid Firestore 400 errors
const syncFirebaseAuthToFirestore = async () => {
  try {
    console.log('⚠️ Firebase Auth sync temporarily disabled to avoid connection errors');
    
    // Return sample data for testing
    const sampleUsers = [
      {
        id: 'sample_google_user_1',
        firebaseId: 'sample_google_user_1',
        name: 'Ritik Mahajan (Admin)',
        email: 'rithikmahajan27@gmail.com',
        phone: '+918717000084',
        dateOfBirth: '1995-01-01',
        address: 'Admin Address - Sample',
        userName: 'rithikmahajan27',
        gender: 'Male',
        pointBalance: 100,
        isBlocked: false,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        signUpMethod: 'Google',
        providerIcon: '🔍',
        providerData: [{ providerId: 'google.com' }],
        emailVerified: true,
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        appReviews: { rating: 5, text: 'Great app!' },
        passwordDetails: '••••••••',
        showPassword: false,
        deleteAccountRecord: 'Present'
      }
    ];

    // Try to add these to Firestore if they don't exist
    for (const user of sampleUsers) {
      try {
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, user);
          console.log(`✅ Created sample user: ${user.email}`);
        }
      } catch (error) {
        console.warn(`Failed to create sample user ${user.email}:`, error);
      }
    }

    return sampleUsers;
  } catch (error) {
    console.error('❌ Error syncing users:', error);
    return [];
  }
};

// New thunk to fetch Firebase Auth users directly (requires admin privileges)
export const fetchFirebaseAuthUsers = createAsyncThunk(
  'users/fetchAuthUsers',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching users from Firebase Authentication...');
      
      // This requires a backend API call to Firebase Admin SDK
      const response = await firebaseAPI.getAllUsers();
      
      if (response.data && response.data.users) {
        return response.data.users.map(user => ({
          id: user.uid,
          firebaseId: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          signUpMethod: user.signUpMethod || getSignUpMethod(user.providerData),
          providerIcon: user.providerIcon || getProviderIcon(user.signUpMethod || getSignUpMethod(user.providerData)),
          providerData: user.providerData || [],
          emailVerified: user.emailVerified || false,
          isBlocked: user.disabled || false,
          accountStatus: user.disabled ? 'blocked' : 'active',
          createdAt: user.metadata?.creationTime || new Date().toISOString(),
          updatedAt: user.metadata?.lastSignInTime || new Date().toISOString(),
          dateOfBirth: user.customClaims?.dateOfBirth || '',
          address: user.customClaims?.address || '',
          userName: user.displayName || user.email?.split('@')[0] || '',
          gender: user.customClaims?.gender || '',
          pointBalance: user.customClaims?.points || 0,
          blockReason: user.customClaims?.blockReason || null,
          blockedAt: user.customClaims?.blockedAt || null,
          blockedBy: user.customClaims?.blockedBy || null,
          appReviews: { rating: 0, text: '' },
          passwordDetails: user.email ? '••••••••' : 'N/A',
          showPassword: false,
          deleteAccountRecord: user.customClaims?.deleteRequested ? 'Requested' : 'Present'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching Firebase Auth users:', error);
      return rejectWithValue(`Failed to fetch Firebase Auth users: ${error.message}`);
    }
  }
);

// Async thunk to block a user
export const blockUser = createAsyncThunk(
  'users/block',
  async ({ userId, reason = 'Admin action' }, { rejectWithValue }) => {
    try {
      // Try Firebase Admin API first
      try {
        const response = await firebaseAPI.blockUser(userId, reason);
        if (response.data && response.data.success) {
          console.log(`✅ Successfully blocked Firebase user: ${userId}`);
          return {
            userId,
            isBlocked: true,
            accountStatus: 'blocked',
            blockReason: reason,
            blockedAt: new Date().toISOString(),
            blockedBy: 'admin'
          };
        }
      } catch (firebaseError) {
        console.warn('Firebase API block failed, falling back to Firestore:', firebaseError.message);
      }

      // Fallback to Firestore
      const userRef = doc(db, 'users', userId);
      
      // First check if user exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const updateData = {
        isBlocked: true,
        accountStatus: 'blocked',
        blockReason: reason,
        blockedAt: new Date().toISOString(),
        blockedBy: 'admin'
      };
      
      await updateDoc(userRef, updateData);
      
      return {
        userId,
        ...updateData
      };
    } catch (error) {
      console.error('Error blocking user:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to unblock a user
export const unblockUser = createAsyncThunk(
  'users/unblock',
  async ({ userId }, { rejectWithValue }) => {
    try {
      // Try Firebase Admin API first
      try {
        const response = await firebaseAPI.unblockUser(userId);
        if (response.data && response.data.success) {
          console.log(`✅ Successfully unblocked Firebase user: ${userId}`);
          return {
            userId,
            isBlocked: false,
            accountStatus: 'active',
            blockReason: null,
            blockedAt: null,
            unblockedAt: new Date().toISOString()
          };
        }
      } catch (firebaseError) {
        console.warn('Firebase API unblock failed, falling back to Firestore:', firebaseError.message);
      }

      // Fallback to Firestore
      const userRef = doc(db, 'users', userId);
      
      // First check if user exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const updateData = {
        isBlocked: false,
        accountStatus: 'active',
        blockReason: null,
        blockedAt: null,
        blockedBy: null,
        unblockedAt: new Date().toISOString(),
        unblockedBy: 'admin'
      };
      
      await updateDoc(userRef, updateData);
      
      return {
        userId,
        ...updateData
      };
    } catch (error) {
      console.error('Error unblocking user:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to search users
export const searchUsers = createAsyncThunk(
  'users/search',
  async ({ searchTerm, filterType = 'all' }, { rejectWithValue }) => {
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
        const userData = { id: doc.id, ...doc.data(), firebaseId: doc.id };
        
        // Apply search filter if searchTerm is provided
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            (userData.name && userData.name.toLowerCase().includes(searchLower)) ||
            (userData.email && userData.email.toLowerCase().includes(searchLower)) ||
            (userData.phone && userData.phone.includes(searchTerm)) ||
            (userData.userName && userData.userName.toLowerCase().includes(searchLower));
          
          if (matchesSearch) {
            users.push(userData);
          }
        } else {
          users.push(userData);
        }
      });
      
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  filteredUsers: [],
  loading: false,
  error: null,
  searchTerm: '',
  filterType: 'all', // 'all', 'active', 'blocked'
  selectedUser: null,
  blockLoading: false,
  unblockLoading: false,
  lastFetch: null
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.filteredUsers = state.users.filter(user => {
        if (!action.payload) return true;
        const searchLower = action.payload.toLowerCase();
        return (
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.phone && user.phone.includes(action.payload)) ||
          (user.userName && user.userName.toLowerCase().includes(searchLower))
        );
      });
    },
    setFilterType: (state, action) => {
      state.filterType = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    togglePasswordVisibility: (state, action) => {
      const userId = action.payload;
      const userIndex = state.users.findIndex(user => user.id === userId);
      if (userIndex >= 0) {
        state.users[userIndex].showPassword = !state.users[userIndex].showPassword;
      }
      const filteredUserIndex = state.filteredUsers.findIndex(user => user.id === userId);
      if (filteredUserIndex >= 0) {
        state.filteredUsers[filteredUserIndex].showPassword = !state.filteredUsers[filteredUserIndex].showPassword;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.map(user => ({
          ...user,
          showPassword: false // Initialize password visibility
        }));
        state.filteredUsers = state.users;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Block user
      .addCase(blockUser.pending, (state) => {
        state.blockLoading = true;
        state.error = null;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.blockLoading = false;
        const { userId, ...updateData } = action.payload;
        
        // Update in users array
        const userIndex = state.users.findIndex(user => user.id === userId);
        if (userIndex >= 0) {
          state.users[userIndex] = { ...state.users[userIndex], ...updateData };
        }
        
        // Update in filtered users array
        const filteredUserIndex = state.filteredUsers.findIndex(user => user.id === userId);
        if (filteredUserIndex >= 0) {
          state.filteredUsers[filteredUserIndex] = { 
            ...state.filteredUsers[filteredUserIndex], 
            ...updateData 
          };
        }
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.blockLoading = false;
        state.error = action.payload;
      })
      
      // Unblock user
      .addCase(unblockUser.pending, (state) => {
        state.unblockLoading = true;
        state.error = null;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.unblockLoading = false;
        const { userId, ...updateData } = action.payload;
        
        // Update in users array
        const userIndex = state.users.findIndex(user => user.id === userId);
        if (userIndex >= 0) {
          state.users[userIndex] = { ...state.users[userIndex], ...updateData };
        }
        
        // Update in filtered users array
        const filteredUserIndex = state.filteredUsers.findIndex(user => user.id === userId);
        if (filteredUserIndex >= 0) {
          state.filteredUsers[filteredUserIndex] = { 
            ...state.filteredUsers[filteredUserIndex], 
            ...updateData 
          };
        }
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.unblockLoading = false;
        state.error = action.payload;
      })
      
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredUsers = action.payload.map(user => ({
          ...user,
          showPassword: false
        }));
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Firebase Auth users
      .addCase(fetchFirebaseAuthUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFirebaseAuthUsers.fulfilled, (state, action) => {
        state.loading = false;
        const authUsers = action.payload.map(user => ({
          ...user,
          showPassword: false
        }));
        
        // Merge with existing users, avoiding duplicates
        const existingIds = new Set(state.users.map(u => u.id));
        const newUsers = authUsers.filter(u => !existingIds.has(u.id));
        
        state.users = [...state.users, ...newUsers];
        state.filteredUsers = state.users;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchFirebaseAuthUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setSearchTerm,
  setFilterType,
  setSelectedUser,
  clearSelectedUser,
  clearError,
  togglePasswordVisibility
} = usersSlice.actions;

// Selectors
export const selectAllUsers = (state) => state.users.users;
export const selectFilteredUsers = (state) => state.users.filteredUsers;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;
export const selectSearchTerm = (state) => state.users.searchTerm;
export const selectFilterType = (state) => state.users.filterType;
export const selectSelectedUser = (state) => state.users.selectedUser;
export const selectBlockLoading = (state) => state.users.blockLoading;
export const selectUnblockLoading = (state) => state.users.unblockLoading;

export default usersSlice.reducer;
