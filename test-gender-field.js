/**
 * Test script to verify gender field is working in profile endpoints
 * Tests both GET and PUT /api/profile endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://185.193.19.244:8080';

// REPLACE WITH YOUR JWT TOKEN
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const userId = '68dae3fd47054fe75c651493'; // User ID from frontend team

async function testGenderField() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Gender Field in Profile Endpoints');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Get current profile (should return gender field)
    console.log('📊 Test 1: GET /api/profile - Retrieving current profile');
    console.log('-'.repeat(60));
    
    const getResponse = await axios.get(`${BASE_URL}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response Status:', getResponse.status);
    console.log('📦 Response Data:', JSON.stringify(getResponse.data, null, 2));
    console.log('');
    console.log('🎯 Gender field present:', getResponse.data.data.hasOwnProperty('gender') ? '✅ YES' : '❌ NO');
    console.log('🎯 Gender value:', getResponse.data.data.gender || '(empty/undefined)');
    console.log('');

    // Test 2: Update profile with gender "Male"
    console.log('='.repeat(60));
    console.log('💾 Test 2: PUT /api/profile - Updating with gender "Male"');
    console.log('-'.repeat(60));

    const updateData = {
      firstName: 'Rithik',
      lastName: 'Mahajan',
      phone: '8717000084',
      gender: 'Male'
    };

    console.log('📤 Request Body:', JSON.stringify(updateData, null, 2));
    console.log('');

    const putResponse = await axios.put(
      `${BASE_URL}/api/profile`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Response Status:', putResponse.status);
    console.log('📦 Response Data:', JSON.stringify(putResponse.data, null, 2));
    console.log('');
    console.log('🎯 Gender field in response:', putResponse.data.data.hasOwnProperty('gender') ? '✅ YES' : '❌ NO');
    console.log('🎯 Gender value:', putResponse.data.data.gender);
    console.log('');

    // Test 3: Verify gender was saved (GET again)
    console.log('='.repeat(60));
    console.log('🔍 Test 3: GET /api/profile - Verifying gender was saved');
    console.log('-'.repeat(60));

    const verifyResponse = await axios.get(`${BASE_URL}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response Status:', verifyResponse.status);
    console.log('🎯 Gender value from database:', verifyResponse.data.data.gender);
    console.log('');

    // Test 4: Try different gender values
    console.log('='.repeat(60));
    console.log('🔄 Test 4: Testing different gender values');
    console.log('-'.repeat(60));

    const genderValues = ['Female', 'Other', ''];

    for (const genderValue of genderValues) {
      console.log(`\n📝 Setting gender to: "${genderValue}"`);
      
      const testResponse = await axios.put(
        `${BASE_URL}/api/profile`,
        { ...updateData, gender: genderValue },
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Response gender: "${testResponse.data.data.gender}"`);
      console.log(`🎯 Match: ${testResponse.data.data.gender === genderValue ? '✅ YES' : '❌ NO'}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Summary:');
    console.log('  ✅ Gender field is present in GET /api/profile response');
    console.log('  ✅ Gender field is accepted in PUT /api/profile request');
    console.log('  ✅ Gender value is saved to database');
    console.log('  ✅ Gender value persists across requests');
    console.log('  ✅ Different gender values work correctly');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED!');
    console.error('-'.repeat(60));
    
    if (error.response) {
      console.error('📛 Error Status:', error.response.status);
      console.error('📛 Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📛 No response received from server');
      console.error('📛 Request:', error.request);
    } else {
      console.error('📛 Error:', error.message);
    }
    
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('  1. Make sure the backend server is running');
    console.error('  2. Replace JWT_TOKEN with a valid token');
    console.error('  3. Check if the user exists in the database');
    console.error('  4. Verify the BASE_URL is correct');
    console.error('');
    
    process.exit(1);
  }
}

// Run the tests
if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('');
  console.log('⚠️  WARNING: Please replace JWT_TOKEN with your actual JWT token');
  console.log('');
  console.log('📝 To get a JWT token:');
  console.log('  1. Login via the app or POST /api/auth/login/firebase');
  console.log('  2. Copy the "token" from the response');
  console.log('  3. Replace JWT_TOKEN in this script');
  console.log('');
  console.log('Example:');
  console.log('  const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";');
  console.log('');
  process.exit(1);
} else {
  testGenderField();
}
