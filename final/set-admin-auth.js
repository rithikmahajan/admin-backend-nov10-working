// Manual admin token setter for testing
// This script can be run in browser console to simulate successful admin login

console.log('🔧 Setting up manual admin authentication...');

// Simulate admin user data
const adminUser = {
  _id: "68cd71f3f31eb5d72a6c8e25",
  name: "Admin User", 
  phNo: "7006114695",
  email: "admin@yoraa.com",
  isAdmin: true,
  isVerified: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  isProfile: true
};

// Set a dummy token (you can replace this with a real token from the backend response)
const dummyToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoUHJvdmlkZXIiOiJlbWFpbCIsImxhc3RMb2dpbkF0IjpudWxsLCJwcmVmZXJyZWRDb3VudHJ5IjoiSU4iLCJwcmVmZXJyZWRDdXJyZW5jeSI6IklOUiIsImxvY2F0aW9uVXBkYXRlZEF0IjpudWxsLCJfaWQiOiI2OGNkNzFmM2YzMWViNWQ3MmE2YzhlMjUiLCJuYW1lIjoiQWRtaW4gVXNlciIsInBoTm8iOiI3MDA2MTE0Njk1IiwiaXNWZXJpZmllZCI6dHJ1ZSwiaXNQaG9uZVZlcmlmaWVkIjp0cnVlLCJpc0VtYWlsVmVyaWZpZWQiOnRydWUsImlzQWRtaW4iOnRydWUsImlzUHJvZmlsZSI6dHJ1ZSwiZW1haWwiOiJhZG1pbkB5b3JhYS5jb20iLCJwbGF0Zm9ybSI6bnVsbCwiX192IjowLCJ1cGRhdGVkQXQiOiIyMDI1LTEwLTAyVDIxOjA0OjAyLjYyMFoiLCJpYXQiOjE3NTk2NTkxMTMsImV4cCI6MTc2MjI1MTExM30.71l3bhzKcQuLKfgPrUfo3oMEVE9CbTtTtX06xPSqiPY";

// Set all required tokens
localStorage.setItem('adminToken', dummyToken);
localStorage.setItem('authToken', dummyToken); 
localStorage.setItem('token', dummyToken);
localStorage.setItem('userData', JSON.stringify(adminUser));

console.log('✅ Admin authentication data set:');
console.log('👤 User:', adminUser);
console.log('🔑 Token stored in:', ['adminToken', 'authToken', 'token']);
console.log('🔄 Please refresh the page to see the authentication take effect');
