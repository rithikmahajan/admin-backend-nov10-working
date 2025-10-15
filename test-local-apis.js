#!/usr/bin/env node

// Test the actual Shiprocket functions from your codebase
const fetch = require('node-fetch');

const API_BASE = "http://localhost:8001/api";

async function testYourShiprocketAPIs() {
  console.log("🚀 Testing Your Shiprocket API Endpoints");
  console.log("=" * 50);
  
  // Test 1: Authentication endpoint
  console.log("\n1️⃣ Testing Authentication Endpoint");
  try {
    const authResponse = await fetch(`${API_BASE}/orders/shiprocket/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const authData = await authResponse.json();
    console.log("📊 Status:", authResponse.status);
    console.log("📦 Response:", JSON.stringify(authData, null, 2));
    
    if (authResponse.ok && authData.success && authData.token) {
      console.log("✅ SUCCESS: Authentication endpoint working!");
      
      // Test 2: Tracking endpoint (with a dummy AWB)
      console.log("\n2️⃣ Testing Tracking Endpoint");
      try {
        const trackingResponse = await fetch(`${API_BASE}/orders/shiprocket/track/dummy-awb-code`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const trackingData = await trackingResponse.json();
        console.log("📊 Tracking Status:", trackingResponse.status);
        console.log("📦 Tracking Response:", JSON.stringify(trackingData, null, 2));
        
        if (trackingResponse.status === 404) {
          console.log("✅ EXPECTED: Tracking endpoint working (404 for dummy AWB is expected)");
        }
        
      } catch (trackError) {
        console.log("❌ Tracking endpoint error:", trackError.message);
      }
      
    } else {
      console.log("❌ FAILED: Authentication endpoint not working");
    }
    
  } catch (authError) {
    console.log("❌ Authentication endpoint error:", authError.message);
    console.log("💡 Tip: Make sure your server is running on port 8001");
  }
  
  // Test 3: Admin Shiprocket endpoints (if available)
  console.log("\n3️⃣ Testing Admin Endpoints (requires auth token)");
  console.log("💡 Note: These require authentication, so testing structure only");
  
  const adminEndpoints = [
    '/api/admin/shiprocket/wallet-balance',
    '/api/admin/orders/shiprocket-stats'
  ];
  
  for (const endpoint of adminEndpoints) {
    try {
      const response = await fetch(`http://localhost:8001${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📊 ${endpoint}: ${response.status} (${response.status === 401 ? 'Auth Required - Expected' : response.statusText})`);
      
    } catch (error) {
      console.log(`❌ ${endpoint}: Connection error`);
    }
  }
  
  console.log("\n🎯 Test completed!");
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log("❌ Server is not running on http://localhost:8001");
    console.log("💡 Please start your server first with: npm start");
    return;
  }
  
  console.log("✅ Server is running!");
  await testYourShiprocketAPIs();
}

main();
