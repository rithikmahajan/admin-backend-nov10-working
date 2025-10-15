#!/usr/bin/env node

/**
 * Comprehensive Shiprocket Order Creation Test
 * Tests the complete flow with updated API user credentials
 */

const fetch = require('node-fetch');

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
// IMPORTANT: Use MAIN ACCOUNT credentials for API integration, not API User
const SHIPROCKET_EMAIL = "contact@yoraa.in";      // Main Shiprocket account
const SHIPROCKET_PASSWORD = "R@2727thik";         // Main account password

// Test data for order creation
const TEST_ORDER_DATA = {
  order_id: `TEST_ORDER_${Date.now()}`,
  order_date: new Date().toISOString().split('T')[0],
  pickup_location: "warehouse",
  billing_customer_name: "Test Customer",
  billing_last_name: "User",
  billing_address: "123 Test Street",
  billing_city: "Delhi",
  billing_pincode: "110001",
  billing_state: "Delhi",
  billing_country: "India",
  billing_email: "testcustomer@example.com",
  billing_phone: "9999999999",
  shipping_is_billing: true,
  payment_method: "Prepaid",
  sub_total: 999,
  length: 10,
  breadth: 10,
  height: 10,
  weight: 0.5,
  order_items: [
    {
      name: "Test Product",
      sku: "TEST_SKU_001",
      units: 1,
      selling_price: 999,
      discount: 0,
      hsn: 1234567890
    }
  ]
};

async function authenticateShiprocket() {
  try {
    console.log('🔐 Step 1: Authenticating with Shiprocket...');
    
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
      console.log('✅ Authentication successful!');
      console.log(`📧 Email: ${data.email}`);
      console.log(`🏢 Company ID: ${data.company_id}`);
      console.log(`👤 User ID: ${data.id}`);
      console.log(`🎫 Token: ${data.token.substring(0, 50)}...`);
      return data.token;
    } else {
      throw new Error(`Authentication failed: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return null;
  }
}

async function testOrderCreation(token) {
  try {
    console.log('\n🚚 Step 2: Testing Order Creation...');
    console.log('📦 Test Order Data:');
    console.log(JSON.stringify(TEST_ORDER_DATA, null, 2));
    
    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(TEST_ORDER_DATA),
    });

    const data = await response.json();
    
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok && data.status_code === 1) {
      console.log('\n✅ ORDER CREATION SUCCESSFUL!');
      console.log(`🆔 Shiprocket Order ID: ${data.order_id}`);
      console.log(`📦 Shipment ID: ${data.shipment_id}`);
      console.log(`💰 Freight Charges: Rs ${data.freight_charges || 'N/A'}`);
      return {
        success: true,
        orderId: data.order_id,
        shipmentId: data.shipment_id
      };
    } else {
      console.log('\n❌ ORDER CREATION FAILED');
      if (response.status === 403) {
        console.log('🔒 Permission Issue: Your API user might not have order creation permissions');
        console.log('💡 Solution: Contact Shiprocket support to enable order management permissions');
      }
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Order creation error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWalletBalance(token) {
  try {
    console.log('\n💰 Step 3: Testing Wallet Balance...');
    
    const endpoints = [
      '/account/details/wallet-balance',
      '/account/wallet-balance',
      '/account/details',
      '/billing/wallet-balance'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SHIPROCKET_API_BASE}${endpoint}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        
        if (response.ok && data.data && data.data.available_balance !== undefined) {
          console.log(`✅ Balance found via ${endpoint}`);
          console.log(`💰 Available Balance: Rs ${data.data.available_balance}`);
          return data.data.available_balance;
        }
      } catch (endpointError) {
        // Continue to next endpoint
      }
    }
    
    console.log('⚠️ Could not retrieve wallet balance from any endpoint');
    return null;
  } catch (error) {
    console.error('❌ Wallet balance check failed:', error.message);
    return null;
  }
}

async function testBackendIntegration() {
  try {
    console.log('\n🖥️  Step 4: Testing Backend Integration...');
    
    // Test your backend's Shiprocket auth endpoint
    const authResponse = await fetch('http://localhost:8001/api/orders/shiprocket/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Backend Shiprocket auth endpoint working');
      console.log(`🎫 Backend returned token: ${authData.token ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ Backend Shiprocket auth endpoint failed');
    }
  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 COMPREHENSIVE SHIPROCKET ORDER CREATION TEST');
  console.log('===============================================');
  console.log(`📧 Testing with API User: ${SHIPROCKET_EMAIL}`);
  console.log(`🔑 Password: ${SHIPROCKET_PASSWORD.substring(0, 3)}****`);
  console.log('===============================================\n');
  
  try {
    // Step 1: Authenticate
    const token = await authenticateShiprocket();
    if (!token) {
      console.log('❌ Test failed at authentication step');
      return;
    }
    
    // Step 2: Test order creation
    const orderResult = await testOrderCreation(token);
    
    // Step 3: Test wallet balance
    await testWalletBalance(token);
    
    // Step 4: Test backend integration
    await testBackendIntegration();
    
    // Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Authentication: SUCCESS`);
    console.log(`${orderResult.success ? '✅' : '❌'} Order Creation: ${orderResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (orderResult.success) {
      console.log('\n🎉 CONGRATULATIONS!');
      console.log('Your Shiprocket integration is working perfectly!');
      console.log('You can now create orders through your backend.');
    } else {
      console.log('\n⚠️  ORDER CREATION ISSUE DETECTED');
      console.log('Authentication works, but order creation failed.');
      console.log('This is likely a permissions issue with your API user.');
      console.log('\n💡 SOLUTION:');
      console.log('1. Contact Shiprocket support at support@shiprocket.in');
      console.log('2. Request order creation permissions for your API user');
      console.log(`3. Mention your Company ID: 5783639`);
      console.log(`4. Mention your API User Email: ${SHIPROCKET_EMAIL}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the test
main().catch(console.error);
