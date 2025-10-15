#!/usr/bin/env node

// Comprehensive Shiprocket API Test - Resolving 403 Errors
const fetch = require('node-fetch');

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = "contact@yoraa.in";
const SHIPROCKET_PASSWORD = "R@2727thik";

async function authenticateShiprocket() {
  try {
    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: SHIPROCKET_EMAIL, 
        password: SHIPROCKET_PASSWORD 
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      return data.token;
    } else {
      throw new Error(data.message || 'Authentication failed');
    }
  } catch (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
}

async function testAPI(endpoint, method = 'GET', body = null, token) {
  console.log(`\n🔍 Testing: ${method} ${endpoint}`);
  
  try {
    const options = {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${SHIPROCKET_API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log("✅ SUCCESS");
      if (data && Object.keys(data).length > 0) {
        console.log("📦 Sample Response:", JSON.stringify(data, null, 2).substring(0, 500) + "...");
      }
    } else {
      console.log("❌ FAILED");
      console.log("💬 Error:", data.message || data.error || 'Unknown error');
    }
    
    return { success: response.ok, data, status: response.status };
    
  } catch (error) {
    console.log("💥 ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

async function testAllShiprocketEndpoints() {
  console.log("� Comprehensive Shiprocket API Testing - Resolving 403 Errors");
  console.log("Testing all possible endpoint variations and methods");
  console.log("=" * 60);
  
  try {
    // Get fresh token
    console.log("\n1️⃣ Getting fresh authentication token...");
    const token = await authenticateShiprocket();
    console.log("✅ Authentication successful!");
    console.log("🎫 Token:", token.substring(0, 30) + "...");

    // Test different wallet balance endpoints
    console.log("\n2️⃣ Testing Wallet Balance Endpoints...");
    const walletEndpoints = [
      '/account/details/wallet-balance',
      '/account/wallet-balance', 
      '/account/details',
      '/account/balance',
      '/wallet/balance',
      '/billing/wallet-balance',
      '/billing/postpaid/usage'
    ];

    for (const endpoint of walletEndpoints) {
      await testEndpoint(token, endpoint, 'GET', null, 'Wallet Balance');
    }

    // Test courier company endpoints
    console.log("\n3️⃣ Testing Courier Company Endpoints...");
    const courierEndpoints = [
      '/courier/courierListWithCounts',
      '/courier/companies',
      '/courier/partners',
      '/courier/list',
      '/courier/available',
      '/courier/serviceability/partners'
    ];

    for (const endpoint of courierEndpoints) {
      await testEndpoint(token, endpoint, 'GET', null, 'Courier Companies');
    }

    // Test serviceability endpoints with different approaches
    console.log("\n4️⃣ Testing Serviceability Endpoints...");
    
    // Method 1: GET with query params (your pickup location)
    await testEndpoint(
      token, 
      '/courier/serviceability/?pickup_postcode=180001&delivery_postcode=110001&weight=1&cod=0', 
      'GET', 
      null, 
      'Serviceability (GET - Jammu to Delhi)'
    );

    // Method 2: POST with body
    await testEndpoint(
      token, 
      '/courier/serviceability', 
      'POST', 
      {
        pickup_postcode: "180001",
        delivery_postcode: "110001", 
        weight: 1,
        cod: 0
      }, 
      'Serviceability (POST)'
    );

    // Method 3: Different serviceability endpoint
    await testEndpoint(
      token, 
      '/courier/serviceability/find', 
      'POST', 
      {
        pickup_postcode: "180001",
        delivery_postcode: "110001", 
        weight: 1,
        cod: 0
      }, 
      'Serviceability Find'
    );

    // Test rate calculation
    await testEndpoint(
      token, 
      '/courier/serviceability', 
      'GET', 
      null, 
      'Serviceability (No params)'
    );

    // Test other useful endpoints
    console.log("\n5️⃣ Testing Other Important Endpoints...");
    
    const otherEndpoints = [
      { path: '/orders', method: 'GET', name: 'Orders List' },
      { path: '/orders/show/all', method: 'GET', name: 'All Orders' },
      { path: '/orders?page=1&per_page=10', method: 'GET', name: 'Orders Paginated' },
      { path: '/courier/generate/pickup', method: 'GET', name: 'Generate Pickup' },
      { path: '/courier/track', method: 'GET', name: 'Track (no params)' },
      { path: '/account/details/company', method: 'GET', name: 'Company Details' },
      { path: '/settings/company', method: 'GET', name: 'Company Settings' },
      { path: '/returns', method: 'GET', name: 'Returns' },
      { path: '/courier/track/awb/NDR', method: 'GET', name: 'NDR Tracking' }
    ];

    for (const endpoint of otherEndpoints) {
      await testEndpoint(token, endpoint.path, endpoint.method, null, endpoint.name);
    }

    console.log("\n🎯 Testing Complete!");
    console.log("If you still see 403 errors, they might be related to:")
    console.log("  - Specific API plan limitations")
    console.log("  - Account verification status")
    console.log("  - Required business documentation")
    
  } catch (error) {
    console.error("❌ Error during testing:", error.message);
  }
}

async function testEndpoint(token, path, method = 'GET', body = null, description = '') {
  try {
    const options = {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${SHIPROCKET_API_BASE}${path}`, options);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${method} ${path} (${description})`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      // Show relevant data for successful responses
      if (path.includes('wallet') || path.includes('balance')) {
        console.log(`   💰 Wallet Info:`, data.balance || data.wallet_balance || 'Available');
      } else if (path.includes('courier')) {
        console.log(`   🚚 Courier Info:`, data.courier_companies?.length || Object.keys(data).length || 'Available');
      } else if (path.includes('serviceability')) {
        console.log(`   📍 Serviceability:`, data.available_courier_companies?.length || 'Available');
      } else {
        console.log(`   📊 Response Keys:`, Object.keys(data).slice(0, 5).join(', '));
      }
    } else {
      console.log(`   ❌ Error: ${data.message || data.error || 'Unknown error'}`);
      
      // Special handling for common errors
      if (response.status === 403) {
        console.log(`   💡 Suggestion: Check API permissions or endpoint format`);
      } else if (response.status === 400) {
        console.log(`   💡 Suggestion: Check required parameters`);
      } else if (response.status === 404) {
        console.log(`   💡 Suggestion: Endpoint might not exist or be deprecated`);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
    
  } catch (error) {
    console.log(`❌ ${method} ${path} (${description})`);
    console.log(`   ❌ Network Error: ${error.message}`);
    console.log('');
  }
}

// Run the comprehensive test
testAllShiprocketEndpoints();
