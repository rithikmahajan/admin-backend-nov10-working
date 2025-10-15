/**
 * 🔍 RAZORPAY ORDER CREATION DIAGNOSTIC TEST
 * 
 * This script tests order creation on both LOCAL and PRODUCTION backends
 * to identify where the ObjectId fix is missing.
 * 
 * Run: node test-razorpay-order-creation.js
 */

const axios = require('axios');
const chalk = require('chalk');

// Test configuration
const ENVIRONMENTS = {
  LOCAL: {
    name: '🏠 LOCAL',
    url: 'http://localhost:8001',
    color: 'cyan'
  },
  PRODUCTION: {
    name: '🌍 PRODUCTION',
    url: 'http://185.193.19.244:8000',
    color: 'yellow'
  }
};

// Test data (replace with real values from your app)
const TEST_CONFIG = {
  // You need to get a valid auth token first by logging in
  // Instructions: 
  // 1. Login to your app
  // 2. Check browser dev tools > Network > any API call > Request Headers > Authorization
  // 3. Copy the token (without "Bearer " prefix)
  AUTH_TOKEN: process.env.TEST_AUTH_TOKEN || 'PASTE_YOUR_AUTH_TOKEN_HERE',
  
  // Valid product ID from your database (check MongoDB)
  PRODUCT_ID: '68da56fc0561b958f6694e1d',
  
  // Valid user ID
  USER_ID: '68dae3fd47054fe75c651493',
  
  // Test cart item
  CART: [{
    id: '68da56fc0561b958f6694e1d',
    itemId: '68da56fc0561b958f6694e1d', // Some endpoints use itemId
    name: 'Product 36',
    quantity: 1,
    price: 1752,
    size: 'small',
    sku: 'PROD-36-SMALL'
  }],
  
  // Test address
  ADDRESS: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phoneNumber: '9876543210',
    address: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    country: 'India'
  }
};

/**
 * Test order creation endpoint
 */
async function testOrderCreation(env) {
  console.log('\n' + '='.repeat(80));
  console.log(`\n${env.name} BACKEND TEST: ${env.url}\n`);
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Test backend health
    console.log('📡 Step 1: Testing backend connectivity...');
    try {
      const healthResponse = await axios.get(`${env.url}/health`, { timeout: 5000 });
      console.log('✅ Backend is reachable');
      console.log('   Status:', healthResponse.status);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend is NOT running');
        console.log('   Error: Connection refused');
        if (env.name.includes('LOCAL')) {
          console.log('\n💡 FIX: Start your local backend:');
          console.log('   cd /path/to/backend');
          console.log('   PORT=8001 npm start\n');
        }
        return {
          success: false,
          error: 'Backend not running',
          env: env.name
        };
      } else {
        console.log('⚠️  Health check endpoint not found (this is OK if backend is running)');
      }
    }

    // 2. Test order creation
    console.log('\n📝 Step 2: Testing order creation...');
    
    if (TEST_CONFIG.AUTH_TOKEN === 'PASTE_YOUR_AUTH_TOKEN_HERE') {
      console.log('❌ No auth token provided');
      console.log('\n💡 FIX: Get your auth token:');
      console.log('   1. Login to your app');
      console.log('   2. Open browser dev tools > Network');
      console.log('   3. Find any API call > Request Headers > Authorization');
      console.log('   4. Copy the token and set: export TEST_AUTH_TOKEN="your_token_here"');
      console.log('   5. Or edit TEST_CONFIG.AUTH_TOKEN in this script\n');
      return {
        success: false,
        error: 'No auth token',
        env: env.name
      };
    }

    const orderPayload = {
      amount: TEST_CONFIG.CART[0].price,
      cart: TEST_CONFIG.CART,
      staticAddress: TEST_CONFIG.ADDRESS,
      userId: TEST_CONFIG.USER_ID,
      paymentMethod: 'razorpay',
      deliveryOption: 'standard'
    };

    console.log('📤 Sending request to:', `${env.url}/api/razorpay/create-order`);
    console.log('📦 Cart items:', TEST_CONFIG.CART.length);
    console.log('🆔 Product ID:', TEST_CONFIG.CART[0].id);
    console.log('💰 Amount:', orderPayload.amount);

    const response = await axios.post(
      `${env.url}/api/razorpay/create-order`,
      orderPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`
        },
        timeout: 15000,
        validateStatus: () => true // Don't throw on any status code
      }
    );

    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));

    // Analyze response
    if (response.status === 200 && response.data.success !== false) {
      if (response.data.orderId || response.data.data?.orderId) {
        console.log('\n✅ ORDER CREATION SUCCESSFUL!');
        console.log('   Order ID:', response.data.orderId || response.data.data?.orderId);
        console.log('   Amount:', response.data.amount || response.data.data?.amount);
        console.log('   Currency:', response.data.currency || response.data.data?.currency);
        console.log('\n🎉 ObjectId Fix is APPLIED and WORKING on this backend!');
        return {
          success: true,
          orderId: response.data.orderId || response.data.data?.orderId,
          env: env.name,
          hasObjectIdFix: true
        };
      }
    }

    // Check for specific error messages
    if (response.data.error || response.data.message) {
      const errorMessage = response.data.error || response.data.message;
      
      if (errorMessage.toLowerCase().includes('invalid item id') || 
          errorMessage.toLowerCase().includes('items not found') ||
          errorMessage.toLowerCase().includes('not available')) {
        console.log('\n❌ ORDER CREATION FAILED!');
        console.log('   Error:', errorMessage);
        console.log('\n🔥 DIAGNOSIS: ObjectId Fix is NOT APPLIED on this backend!');
        console.log('   Backend cannot find products because it\'s comparing strings with ObjectIds');
        
        if (response.data.invalidItems) {
          console.log('\n   Invalid Items:', JSON.stringify(response.data.invalidItems, null, 2));
        }
        
        return {
          success: false,
          error: errorMessage,
          env: env.name,
          hasObjectIdFix: false,
          diagnosis: 'ObjectId conversion missing'
        };
      } else if (errorMessage.toLowerCase().includes('auth') || 
                 errorMessage.toLowerCase().includes('token') ||
                 errorMessage.toLowerCase().includes('unauthorized')) {
        console.log('\n❌ AUTHENTICATION FAILED!');
        console.log('   Error:', errorMessage);
        console.log('\n💡 FIX: Get a fresh auth token');
        return {
          success: false,
          error: 'Authentication failed',
          env: env.name
        };
      } else {
        console.log('\n❌ ORDER CREATION FAILED!');
        console.log('   Error:', errorMessage);
        return {
          success: false,
          error: errorMessage,
          env: env.name
        };
      }
    }

    // Unknown response format
    console.log('\n⚠️  UNEXPECTED RESPONSE FORMAT');
    return {
      success: false,
      error: 'Unexpected response format',
      env: env.name
    };

  } catch (error) {
    console.log('\n❌ REQUEST FAILED!');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   Error: Backend is not running');
      if (env.name.includes('LOCAL')) {
        console.log('\n💡 FIX: Start your local backend:');
        console.log('   cd /path/to/backend');
        console.log('   PORT=8001 npm start\n');
      } else {
        console.log('\n💡 ISSUE: Production backend may be down or firewall blocking');
      }
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.log('   Error: Connection timeout or DNS issue');
      console.log('   URL:', env.url);
    } else {
      console.log('   Error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    return {
      success: false,
      error: error.message,
      env: env.name
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  🔍 RAZORPAY ORDER CREATION DIAGNOSTIC TEST'.padEnd(78) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));

  console.log('\n📋 Test Configuration:');
  console.log('   Auth Token:', TEST_CONFIG.AUTH_TOKEN.substring(0, 20) + '...');
  console.log('   Product ID:', TEST_CONFIG.PRODUCT_ID);
  console.log('   User ID:', TEST_CONFIG.USER_ID);

  // Test both environments
  const results = {
    local: await testOrderCreation(ENVIRONMENTS.LOCAL),
    production: await testOrderCreation(ENVIRONMENTS.PRODUCTION)
  };

  // Final summary
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  📊 FINAL SUMMARY'.padEnd(78) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80) + '\n');

  // Local backend status
  console.log('🏠 LOCAL BACKEND (http://localhost:8001):');
  if (results.local.success) {
    console.log('   ✅ Status: WORKING');
    console.log('   ✅ ObjectId Fix: APPLIED');
    console.log('   ✅ Order Created:', results.local.orderId);
  } else {
    console.log('   ❌ Status: FAILED');
    console.log('   ❌ Error:', results.local.error);
    if (results.local.hasObjectIdFix === false) {
      console.log('   ❌ ObjectId Fix: NOT APPLIED');
    }
  }

  console.log('\n🌍 PRODUCTION BACKEND (http://185.193.19.244:8000):');
  if (results.production.success) {
    console.log('   ✅ Status: WORKING');
    console.log('   ✅ ObjectId Fix: APPLIED');
    console.log('   ✅ Order Created:', results.production.orderId);
  } else {
    console.log('   ❌ Status: FAILED');
    console.log('   ❌ Error:', results.production.error);
    if (results.production.hasObjectIdFix === false) {
      console.log('   ❌ ObjectId Fix: NOT APPLIED');
    }
  }

  // Recommendations
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  💡 RECOMMENDATIONS'.padEnd(78) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80) + '\n');

  if (!results.local.success) {
    console.log('🏠 LOCAL BACKEND:');
    if (results.local.error === 'Backend not running') {
      console.log('   1. Start your local backend:');
      console.log('      cd /path/to/backend');
      console.log('      PORT=8001 npm start');
    } else if (results.local.hasObjectIdFix === false) {
      console.log('   1. Apply ObjectId fix to local backend');
      console.log('      See: URGENT_BACKEND_FIX_NOT_APPLIED.md');
      console.log('   2. Restart local backend');
      console.log('   3. Run this test again');
    } else if (results.local.error === 'No auth token') {
      console.log('   1. Get a valid auth token from your app');
      console.log('   2. Set: export TEST_AUTH_TOKEN="your_token"');
      console.log('   3. Run this test again');
    }
    console.log('');
  }

  if (!results.production.success) {
    console.log('🌍 PRODUCTION BACKEND:');
    if (results.production.error === 'Backend not running') {
      console.log('   1. SSH into production server');
      console.log('      ssh root@185.193.19.244');
      console.log('   2. Check if backend is running:');
      console.log('      pm2 status');
      console.log('   3. Restart if needed:');
      console.log('      pm2 restart all');
    } else if (results.production.hasObjectIdFix === false) {
      console.log('   🔥 CRITICAL: ObjectId fix is NOT applied to production!');
      console.log('   1. SSH into production server');
      console.log('      ssh root@185.193.19.244');
      console.log('   2. Apply the ObjectId fix to paymentController.js');
      console.log('   3. Restart backend:');
      console.log('      pm2 restart all');
      console.log('   4. Run this test again');
      console.log('\n   📖 See: URGENT_BACKEND_FIX_NOT_APPLIED.md for fix details');
    }
    console.log('');
  }

  if (results.local.success && results.production.success) {
    console.log('🎉 BOTH BACKENDS ARE WORKING!');
    console.log('   ✅ Local backend: ObjectId fix applied');
    console.log('   ✅ Production backend: ObjectId fix applied');
    console.log('   ✅ Razorpay order creation working on both');
    console.log('\n   Next steps:');
    console.log('   1. Test full checkout flow in your app');
    console.log('   2. Verify payment completion');
    console.log('   3. Check order creation in database');
    console.log('');
  } else if (results.local.success && !results.production.success) {
    console.log('⚠️  LOCAL WORKS, PRODUCTION DOESN\'T');
    console.log('   ✅ Local backend has ObjectId fix');
    console.log('   ❌ Production backend needs ObjectId fix');
    console.log('\n   Action required:');
    console.log('   → Deploy ObjectId fix to production server');
    console.log('   → Restart production backend');
    console.log('   → Run this test again to verify');
    console.log('');
  }

  console.log('█'.repeat(80) + '\n');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testOrderCreation };
