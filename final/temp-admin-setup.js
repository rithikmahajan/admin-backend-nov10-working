// Temporary admin authentication setup
// Run this in browser console at http://localhost:3001

console.log('🚀 Setting up temporary admin authentication...');

// Use the actual token from your backend login response
const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoUHJvdmlkZXIiOiJlbWFpbCIsImxhc3RMb2dpbkF0IjpudWxsLCJwcmVmZXJyZWRDb3VudHJ5IjoiSU4iLCJwcmVmZXJyZWRDdXJyZW5jeSI6IklOUiIsImxvY2F0aW9uVXBkYXRlZEF0IjpudWxsLCJfaWQiOiI2OGNkNzFmM2YzMWViNWQ3MmE2YzhlMjUiLCJuYW1lIjoiQWRtaW4gVXNlciIsInBoTm8iOiI3MDA2MTE0Njk1IiwiaXNWZXJpZmllZCI6dHJ1ZSwiaXNQaG9uZVZlcmlmaWVkIjp0cnVlLCJpc0VtYWlsVmVyaWZpZWQiOnRydWUsImlzQWRtaW4iOnRydWUsImlzUHJvZmlsZSI6dHJ1ZSwiZW1haWwiOiJhZG1pbkB5b3JhYS5jb20iLCJwbGF0Zm9ybSI6bnVsbCwiX192IjowLCJ1cGRhdGVkQXQiOiIyMDI1LTEwLTAyVDIxOjA0OjAyLjYyMFoiLCJpYXQiOjE3NTk2NTkxMTMsImV4cCI6MTc2MjI1MTExM30.71l3bhzKcQuLKfgPrUfo3oMEVE9CbTtTtX06xPSqiPY";

const adminUser = {
  _id: "68cd71f3f31eb5d72a6c8e25",
  name: "Admin User",
  phNo: "7006114695", 
  email: "admin@yoraa.com",
  isAdmin: true,
  isVerified: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  isProfile: true,
  authProvider: "email",
  preferredCountry: "IN",
  preferredCurrency: "INR"
};

// Clear existing auth data
console.log('🧹 Clearing existing auth data...');
localStorage.removeItem('authToken');
localStorage.removeItem('adminToken'); 
localStorage.removeItem('token');
localStorage.removeItem('userData');

// Set new auth data
console.log('✅ Setting admin authentication...');
localStorage.setItem('adminToken', adminToken);
localStorage.setItem('authToken', adminToken);
localStorage.setItem('token', adminToken);
localStorage.setItem('userData', JSON.stringify(adminUser));

console.log('🎉 Admin auth setup complete!');
console.log('📋 Set items:', {
  adminToken: localStorage.getItem('adminToken') ? 'SET' : 'NOT SET',
  authToken: localStorage.getItem('authToken') ? 'SET' : 'NOT SET', 
  token: localStorage.getItem('token') ? 'SET' : 'NOT SET',
  userData: localStorage.getItem('userData') ? 'SET' : 'NOT SET'
});

console.log('🔄 Now refresh the page to see authentication take effect');

// Also dispatch the restore action if Redux store is available
if (window.__REDUX_STORE__) {
  console.log('🔄 Dispatching restoreAuthFromStorage...');
  window.__REDUX_STORE__.dispatch({ type: 'auth/restoreAuthFromStorage' });
} else {
  console.log('ℹ️ Redux store not found, refresh page to restore auth');
}
