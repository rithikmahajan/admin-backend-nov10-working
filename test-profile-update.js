/**
 * Test script for user profile update endpoint
 * Tests the new PUT /api/profile endpoint for React Native app
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8001';

// Test user credentials (you'll need to replace with actual test credentials)
const TEST_USER = {
    phNo: '1234567890',  // Replace with actual test user phone
    password: 'test123'   // Replace with actual test user password
};

async function testProfileUpdate() {
    console.log('🧪 Testing User Profile Update Endpoint\n');
    
    try {
        // Step 1: Login to get token
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
        
        if (!loginResponse.data.token) {
            console.error('❌ Login failed - no token received');
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received\n');
        
        // Step 2: Get current profile
        console.log('2️⃣ Fetching current profile...');
        const getProfileResponse = await axios.get(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Current profile:', JSON.stringify(getProfileResponse.data, null, 2));
        console.log();
        
        // Step 3: Update profile
        console.log('3️⃣ Updating profile...');
        const updateData = {
            firstName: 'Updated',
            lastName: 'User',
            email: 'updated.user@example.com',
            phone: '9876543210',
            preferences: {
                currency: 'USD',
                language: 'en',
                notifications: true
            }
        };
        
        const updateResponse = await axios.put(
            `${BASE_URL}/api/profile`,
            updateData,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        console.log('✅ Profile updated successfully!');
        console.log('Updated profile:', JSON.stringify(updateResponse.data, null, 2));
        console.log();
        
        // Step 4: Verify update by fetching profile again
        console.log('4️⃣ Verifying update...');
        const verifyResponse = await axios.get(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Verified profile:', JSON.stringify(verifyResponse.data, null, 2));
        
        // Check if update was successful
        const updatedProfile = verifyResponse.data.data;
        if (updatedProfile.firstName === 'Updated' && updatedProfile.lastName === 'User') {
            console.log('\n✅ ✅ ✅ Profile update test PASSED! ✅ ✅ ✅');
        } else {
            console.log('\n❌ Profile update test FAILED - data not updated correctly');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

// Alternative test using PATCH /api/user/:id endpoint
async function testUserUpdateById() {
    console.log('\n\n🧪 Testing User Update By ID Endpoint (PATCH /api/user/:id)\n');
    
    try {
        // Step 1: Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user._id;
        console.log('✅ Login successful, userId:', userId, '\n');
        
        // Step 2: Update user by ID
        console.log('2️⃣ Updating user by ID...');
        const updateData = {
            name: 'Test User Updated',
            email: 'test.updated@example.com'
        };
        
        const updateResponse = await axios.patch(
            `${BASE_URL}/api/user/${userId}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        console.log('✅ User updated successfully!');
        console.log('Updated user:', JSON.stringify(updateResponse.data, null, 2));
        
        console.log('\n✅ ✅ ✅ User update by ID test PASSED! ✅ ✅ ✅');
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

// Run tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  USER PROFILE UPDATE ENDPOINT TESTS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await testProfileUpdate();
    await testUserUpdateById();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════════════\n');
}

runAllTests();
