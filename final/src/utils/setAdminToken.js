// Utility function to set admin token for testing
export const setAdminToken = () => {
  // Updated token for the correct admin user in database: 68cd71f3f31eb5d72a6c8e25
  const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGNkNzFmM2YzMWViNWQ3MmE2YzhlMjUiLCJuYW1lIjoiSm9oeWVlaW50ZWVldHkgcnRvZSIsInBoTm8iOiI3MDM2NTY3ODkwIiwiaXNWZXJpZmllZCI6dHJ1ZSwiaXNQaG9uZVZlcmlmaWVkIjp0cnVlLCJpc0VtYWlsVmVyaWZpZWQiOnRydWUsImlzQWRtaW4iOnRydWUsImlzUHJvZmlsZSI6dHJ1ZSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicGxhdGZvcm0iOm51bGwsImlhdCI6MTc1ODU4MzU3MSwiZXhwIjoxNzU5MTg4MzcxfQ.0ElD25i-I3qs09tnKSxq_gGfhhTokKR3GFVmiYbXk6U";
  
  localStorage.setItem('authToken', adminToken);
  console.log('Admin token set successfully!');
  console.log('You can now create products.');
  
  // Also set user data - matching the actual admin user in database
  const userData = {
    _id: "68cd71f3f31eb5d72a6c8e25",
    name: "Johyeeinteeety rtoe",
    phNo: "7036567890",
    isVerified: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    isAdmin: true,
    isProfile: true,
    email: "user@example.com",
    platform: null
  };
  
  localStorage.setItem('userData', JSON.stringify(userData));
  console.log('User data set successfully!');
};

// For browser console usage
if (typeof window !== 'undefined') {
  window.setAdminToken = setAdminToken;
}
