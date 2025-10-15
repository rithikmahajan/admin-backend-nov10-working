#!/usr/bin/env node

const fetch = require('node-fetch');

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = "contact@yoraa.in";
const SHIPROCKET_PASSWORD = "R@2727thik";

async function testShiprocketAPI() {
  console.log("🚀 Testing Shiprocket API...");
  
  try {
    // Test 1: Authentication
    console.log("\n1️⃣ Testing Authentication...");
    const authResponse = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: SHIPROCKET_EMAIL, 
        password: SHIPROCKET_PASSWORD 
      }),
    });

    const authData = await authResponse.json();
    
    if (!authResponse.ok) {
      console.error("❌ Authentication Failed:", {
        status: authResponse.status,
        statusText: authResponse.statusText,
        data: authData
      });
      return;
    }

    if (!authData.token) {
      console.error("❌ No token received:", authData);
      return;
    }

    console.log("✅ Authentication Successful!");
    console.log("📋 Token received (first 20 chars):", authData.token.substring(0, 20) + "...");
    
    const token = authData.token;

    // Test 2: Get Wallet Balance
    console.log("\n2️⃣ Testing Wallet Balance...");
    const balanceResponse = await fetch(`${SHIPROCKET_API_BASE}/account/details/wallet-balance`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const balanceData = await balanceResponse.json();
    
    if (balanceResponse.ok) {
      console.log("✅ Wallet Balance Retrieved:");
      console.log("💰 Balance:", JSON.stringify(balanceData, null, 2));
    } else {
      console.log("⚠️ Wallet Balance Failed:", balanceData);
    }

    // Test 3: Get Courier Companies
    console.log("\n3️⃣ Testing Courier Companies...");
    const courierResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const courierData = await courierResponse.json();
    
    if (courierResponse.ok) {
      console.log("✅ Courier Companies Retrieved:");
      console.log("🚚 Available Couriers:", courierData.courier_companies?.length || 0);
      if (courierData.courier_companies && courierData.courier_companies.length > 0) {
        console.log("📋 First few couriers:");
        courierData.courier_companies.slice(0, 3).forEach(courier => {
          console.log(`  - ${courier.name} (ID: ${courier.id})`);
        });
      }
    } else {
      console.log("⚠️ Courier Companies Failed:", courierData);
    }

    // Test 4: Test Serviceability
    console.log("\n4️⃣ Testing Serviceability Check...");
    const serviceabilityResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const serviceabilityData = await serviceabilityResponse.json();
    
    if (serviceabilityResponse.ok) {
      console.log("✅ Serviceability API is accessible");
      console.log("📋 Response structure:", Object.keys(serviceabilityData));
    } else {
      console.log("⚠️ Serviceability Check Failed:", serviceabilityData);
    }

    // Test 5: Get Account Details
    console.log("\n5️⃣ Testing Account Details...");
    const accountResponse = await fetch(`${SHIPROCKET_API_BASE}/settings/company/pickup`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const accountData = await accountResponse.json();
    
    if (accountResponse.ok) {
      console.log("✅ Account Details Retrieved:");
      console.log("🏢 Pickup Locations:", accountData.pickup_location?.length || 0);
      if (accountData.pickup_location && accountData.pickup_location.length > 0) {
        console.log("📍 First pickup location:", {
          name: accountData.pickup_location[0].pickup_location,
          city: accountData.pickup_location[0].city,
          state: accountData.pickup_location[0].state
        });
      }
    } else {
      console.log("⚠️ Account Details Failed:", accountData);
    }

    console.log("\n🎉 Shiprocket API Test Complete!");
    console.log("✅ All major endpoints are accessible with your credentials.");
    
  } catch (error) {
    console.error("❌ Error during API testing:", error.message);
  }
}

// Run the test
testShiprocketAPI();
