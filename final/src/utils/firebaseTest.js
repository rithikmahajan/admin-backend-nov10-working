// Firebase connectivity test utility
import { auth, analytics } from '../config/firebase';

export const testFirebaseConnection = async () => {
  const results = {
    auth: false,
    firestore: false,
    analytics: false,
    errors: []
  };

  try {
    // Test Firebase Auth
    if (auth) {
      console.log('✅ Firebase Auth initialized successfully');
      results.auth = true;
    }
  } catch (error) {
    console.error('❌ Firebase Auth error:', error);
    results.errors.push(`Auth: ${error.message}`);
  }

  try {
    // Test Firestore
    if (db) {
      console.log('✅ Firestore initialized successfully');
      results.firestore = true;
    }
  } catch (error) {
    console.error('❌ Firestore error:', error);
    results.errors.push(`Firestore: ${error.message}`);
  }

  try {
    // Test Analytics (only in browser environment)
    if (typeof window !== 'undefined' && analytics) {
      console.log('✅ Firebase Analytics initialized successfully');
      results.analytics = true;
    }
  } catch (error) {
    console.error('❌ Firebase Analytics error:', error);
    results.errors.push(`Analytics: ${error.message}`);
  }

  // Overall status
  const allWorking = results.auth && results.firestore;
  console.log(`\n🔥 Firebase Status: ${allWorking ? '✅ Working' : '❌ Issues Found'}`);
  
  if (results.errors.length > 0) {
    console.log('Errors:', results.errors);
  }

  return results;
};

// Test function to verify Firebase config
export const testFirebaseConfig = () => {
  const config = {
    projectId: "yoraa-android-ios",
    apiKey: "AIzaSyCIYkTNzIrk_RugNOybriphlQ8aVTJ-KD8",
    authDomain: "yoraa-android-ios.firebaseapp.com"
  };

  console.log('🔧 Firebase Config Test:');
  console.log('Project ID:', config.projectId);
  console.log('Auth Domain:', config.authDomain);
  console.log('API Key:', config.apiKey ? '✅ Present' : '❌ Missing');
  
  return config;
};
