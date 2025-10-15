// Clear all authentication data from localStorage
// This script can be run in browser console

console.log('🧹 Clearing all authentication data...');

// Clear all possible auth keys
const authKeys = [
  'authToken',
  'adminToken', 
  'token',
  'userData',
  'cartData',
  'wishlistData'
];

authKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`🗑️ Removing ${key}:`, localStorage.getItem(key));
    localStorage.removeItem(key);
  }
});

console.log('✅ All authentication data cleared');
console.log('🔄 Please refresh the page and try logging in again');
