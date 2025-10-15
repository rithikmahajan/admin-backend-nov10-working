// Simple Firebase authentication test
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export const testFirebaseAuth = async () => {
  try {
    console.log('🔐 Testing Firebase Authentication...');
    
    // Test anonymous sign-in (doesn't require credentials)
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    console.log('✅ Anonymous authentication successful!');
    console.log('User ID:', user.uid);
    
    // Sign out immediately after test
    await auth.signOut();
    console.log('✅ Sign out successful!');
    
    return { success: true, userId: user.uid };
  } catch (error) {
    console.error('❌ Firebase Auth test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test auth state listener
export const testAuthStateListener = () => {
  console.log('👂 Testing Auth State Listener...');
  
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ Auth state changed: User signed in', user.uid);
    } else {
      console.log('✅ Auth state changed: User signed out');
    }
  });
  
  // Return unsubscribe function
  return unsubscribe;
};
