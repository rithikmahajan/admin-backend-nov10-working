#!/usr/bin/env node

/**
 * Detailed Shiprocket API Diagnostics
 * Tests various endpoints to identify exact permission issues
 */

const fetch = require('node-fetch');

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = "contact@yoraa.in";
const SHIPROCKET_PASSWORD = "R@2727thik";

async function authenticate() {
  const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: SHIPROCKET_EMAIL, 
      password: SHIPROCKET_PASSWORD 
    }),
  });
  
  const data = await response.json();
  return data.token;
}

async function testEndpoint(token, endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${SHIPROCKET_API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 DETAILED SHIPROCKET API DIAGNOSTICS');
  console.log('=====================================\n');
  
  // Get current IP
  const ipResponse = await fetch('https://api.ipify.org?format=json');
  const ipData = await ipResponse.json();
  console.log(`📍 Your Current IP: ${ipData.ip}\n`);
  
  // Authenticate
  console.log('🔐 Authenticating...');
  const token = await authenticate();
  console.log('✅ Authentication successful\n');
  
  // Test various endpoints
  const tests = [
    { name: 'Company Profile', endpoint: '/settings/company/profile', method: 'GET' },
    { name: 'Pickup Locations', endpoint: '/settings/company/addpickup', method: 'GET' },
    { name: 'Channels', endpoint: '/channels', method: 'GET' },
    { name: 'Orders List', endpoint: '/orders', method: 'GET' },
    { name: 'Courier List', endpoint: '/courier/courierListWithCounts', method: 'GET' },
  ];
  
  console.log('🧪 Testing Endpoints:\n');
  
  for (const test of tests) {
    const result = await testEndpoint(token, test.endpoint, test.method);
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} ${test.name} (${test.endpoint})`);
    console.log(`   Status: ${result.status}`);
    if (!result.ok && result.data) {
      console.log(`   Error: ${result.data.message || JSON.stringify(result.data)}`);
    }
    console.log('');
  }
  
  // Now test order creation with minimal data
  console.log('🚚 Testing Order Creation with Minimal Data:\n');
  
  const minimalOrder = {
    order_id: `MINIMAL_${Date.now()}`,
    order_date: new Date().toISOString().split('T')[0],
    pickup_location: "Primary",
    billing_customer_name: "Test",
    billing_last_name: "User",
    billing_address: "Test Address",
    billing_city: "Delhi",
    billing_pincode: "110001",
    billing_state: "Delhi",
    billing_country: "India",
    billing_email: "test@test.com",
    billing_phone: "9999999999",
    shipping_is_billing: true,
    payment_method: "Prepaid",
    sub_total: 100,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
    order_items: [{
      name: "Test",
      sku: "TEST",
      units: 1,
      selling_price: 100
    }]
  };
  
  const orderResult = await testEndpoint(token, '/orders/create/adhoc', 'POST', minimalOrder);
  
  if (orderResult.ok) {
    console.log('✅ ORDER CREATION SUCCESSFUL!');
    console.log(`   Order ID: ${orderResult.data.order_id}`);
    console.log(`   Shipment ID: ${orderResult.data.shipment_id}`);
  } else {
    console.log('❌ ORDER CREATION FAILED');
    console.log(`   Status: ${orderResult.status}`);
    console.log(`   Error: ${orderResult.data.message || JSON.stringify(orderResult.data)}`);
    
    if (orderResult.data.message && orderResult.data.message.includes('[IP]')) {
      console.log('\n🔍 IP WHITELIST ISSUE DETECTED:');
      console.log(`   Current IP: ${ipData.ip}`);
      console.log('   Action Required:');
      console.log('   1. Login to https://app.shiprocket.in/');
      console.log('   2. Go to Settings → API → Security');
      console.log(`   3. Add IP: ${ipData.ip}`);
      console.log('   4. Save and wait 5-10 minutes');
      console.log('   5. Run this test again');
    }
  }
  
  console.log('\n📋 DIAGNOSTIC COMPLETE');
}

main().catch(console.error);
