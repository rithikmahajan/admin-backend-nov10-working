/**
 * Test Script for TestFlight Authentication Issue
 * 
 * This script tests the backend authentication flow to verify
 * that user data is returned correctly after login.
 */

const axios = require('axios');

// PRODUCTION API URL (adjust if needed)
const BASE_URL = 'https://api.yoraa.com'; // or your production URL

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailLogin() {
  log('\n🔐 Testing Email/Password Login...', 'cyan');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });

    if (response.data.success && response.data.data) {
      log('✅ Login successful!', 'green');
      log('\n📦 Response Data:', 'blue');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Check if token exists
      if (response.data.data.token) {
        log('\n✅ Token received: ' + response.data.data.token.substring(0, 50) + '...', 'green');
      } else {
        log('\n❌ No token in response!', 'red');
      }
      
      // Check if user data exists
      if (response.data.data.user) {
        log('\n✅ User data received:', 'green');
        log(`   ID: ${response.data.data.user._id}`, 'blue');
        log(`   Name: ${response.data.data.user.name}`, 'blue');
        log(`   Email: ${response.data.data.user.email}`, 'blue');
        log(`   Verified: ${response.data.data.user.isVerified}`, 'blue');
        log(`   Provider: ${response.data.data.user.authProvider}`, 'blue');
      } else {
        log('\n❌ No user data in response!', 'red');
      }
      
      return response.data.data.token;
    } else {
      log('❌ Login failed: ' + response.data.message, 'red');
      return null;
    }
  } catch (error) {
    log('❌ Login error: ' + error.message, 'red');
    if (error.response) {
      log('Response: ' + JSON.stringify(error.response.data, null, 2), 'yellow');
    }
    return null;
  }
}

async function testGetProfile(token) {
  log('\n👤 Testing GET Profile...', 'cyan');
  
  if (!token) {
    log('❌ No token available, skipping profile test', 'red');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success && response.data.data) {
      log('✅ Profile retrieved successfully!', 'green');
      log('\n📦 Profile Data:', 'blue');
      console.log(JSON.stringify(response.data.data, null, 2));
      
      // Check profile completeness
      const profile = response.data.data;
      log('\n🔍 Profile Completeness Check:', 'cyan');
      log(`   First Name: ${profile.firstName || 'MISSING'}`, profile.firstName ? 'green' : 'yellow');
      log(`   Last Name: ${profile.lastName || 'MISSING'}`, profile.lastName ? 'green' : 'yellow');
      log(`   Email: ${profile.email || 'MISSING'}`, profile.email ? 'green' : 'yellow');
      log(`   Phone: ${profile.phone || 'MISSING'}`, profile.phone ? 'green' : 'yellow');
      log(`   Email Verified: ${profile.isEmailVerified}`, profile.isEmailVerified ? 'green' : 'yellow');
      log(`   Phone Verified: ${profile.isPhoneVerified}`, profile.isPhoneVerified ? 'green' : 'yellow');
    } else {
      log('❌ Failed to retrieve profile: ' + response.data.message, 'red');
    }
  } catch (error) {
    log('❌ Profile retrieval error: ' + error.message, 'red');
    if (error.response) {
      log('Response: ' + JSON.stringify(error.response.data, null, 2), 'yellow');
    }
  }
}

async function testUpdateProfile(token) {
  log('\n✏️  Testing UPDATE Profile...', 'cyan');
  
  if (!token) {
    log('❌ No token available, skipping profile update test', 'red');
    return;
  }
  
  try {
    const updateData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      preferences: {
        currency: 'INR',
        language: 'en',
        notifications: true
      }
    };
    
    log('📤 Sending update request...', 'blue');
    
    const response = await axios.put(`${BASE_URL}/api/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('✅ Profile updated successfully!', 'green');
      log('\n📦 Updated Profile:', 'blue');
      console.log(JSON.stringify(response.data.data, null, 2));
    } else {
      log('❌ Failed to update profile: ' + response.data.message, 'red');
    }
  } catch (error) {
    log('❌ Profile update error: ' + error.message, 'red');
    if (error.response) {
      log('Response: ' + JSON.stringify(error.response.data, null, 2), 'yellow');
    }
  }
}

async function runTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  TestFlight Authentication Backend Test', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');
  log(`\n🌐 Testing against: ${BASE_URL}`, 'blue');
  
  // Test 1: Email Login
  const token = await testEmailLogin();
  
  // Test 2: Get Profile
  if (token) {
    await testGetProfile(token);
    
    // Test 3: Update Profile
    await testUpdateProfile(token);
    
    // Test 4: Verify Update
    log('\n🔄 Verifying update...', 'cyan');
    await testGetProfile(token);
  }
  
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  Test Complete', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');
  
  // Summary
  log('📋 SUMMARY:', 'yellow');
  log('If all tests passed ✅, the backend is working correctly.', 'blue');
  log('If TestFlight still shows "Guest User", the issue is in the mobile app.', 'blue');
  log('\n📖 See TESTFLIGHT_PROFILE_FIX.md for mobile app fixes.', 'cyan');
}

// Run tests
runTests().catch(error => {
  log('\n❌ Fatal error: ' + error.message, 'red');
  process.exit(1);
});
