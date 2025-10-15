#!/usr/bin/env node

// 🔍 Shiprocket 403 Forbidden Diagnostic Tool
// Tests all 5 problematic endpoints and provides specific fixes

const fetch = require('node-fetch');

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = "contact@yoraa.in";
const SHIPROCKET_PASSWORD = "R@2727thik";

class ShiprocketDiagnostic {
  
  constructor() {
    this.token = null;
    this.pickupLocation = null;
    this.results = [];
  }

  async authenticate() {
    console.log("🔑 Step 1: Generating fresh authentication token...");
    
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
      
      if (!response.ok || !data.token) {
        throw new Error(`Authentication failed: ${data.message || 'No token received'}`);
      }

      this.token = data.token;
      console.log("✅ Fresh token generated successfully");
      console.log(`📊 Company ID: ${data.company_id}`);
      console.log(`👤 User ID: ${data.id}`);
      console.log(`📧 Email: ${data.email}`);
      
      return true;
    } catch (error) {
      console.error("❌ Authentication failed:", error.message);
      return false;
    }
  }

  async getPickupLocation() {
    console.log("\n🏢 Step 2: Retrieving pickup location info...");
    
    try {
      const response = await fetch(`${SHIPROCKET_API_BASE}/settings/company/pickup`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.data && data.data.shipping_address) {
        const pickup = data.data.shipping_address[0];
        this.pickupLocation = pickup.pickup_location;
        
        console.log("✅ Pickup location found:");
        console.log(`   📍 Location Name: "${pickup.pickup_location}"`);
        console.log(`   🏢 Address: ${pickup.address}, ${pickup.city}`);
        console.log(`   📮 PIN: ${pickup.pin_code}`);
        console.log(`   📞 Phone: ${pickup.phone}`);
        console.log(`   ✅ Verified: ${pickup.phone_verified === 1 ? 'Yes' : 'No'}`);
        console.log(`   🟢 Status: ${pickup.status === 2 ? 'Active' : 'Pending'}`);
        
        return true;
      } else {
        console.log("❌ No pickup location found - This explains many 403 errors!");
        console.log("🔧 Fix: Add and verify pickup address in Shiprocket dashboard");
        return false;
      }
    } catch (error) {
      console.error("❌ Error getting pickup location:", error.message);
      return false;
    }
  }

  async testEndpoint(name, method, endpoint, body = null, expectedFix = "") {
    console.log(`\n🔍 Testing: ${name}`);
    
    try {
      const options = {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${SHIPROCKET_API_BASE}${endpoint}`, options);
      const data = await response.json();
      
      const result = {
        name,
        endpoint,
        status: response.status,
        success: response.ok,
        data: data,
        fix: expectedFix
      };
      
      if (response.ok) {
        console.log(`✅ ${name}: WORKING`);
        if (name === "Courier List" && data.courier_companies) {
          console.log(`   📊 Available couriers: ${data.courier_companies.length}`);
        } else if (name === "Serviceability" && data.available_courier_companies) {
          console.log(`   📊 Serviceable couriers: ${data.available_courier_companies.length}`);
        } else if (name === "Wallet Balance" && data.wallet_balance !== undefined) {
          console.log(`   💰 Wallet balance: ₹${data.wallet_balance}`);
        }
      } else {
        console.log(`❌ ${name}: BLOCKED (${response.status})`);
        console.log(`   Error: ${data.message || 'Unknown error'}`);
        if (expectedFix) {
          console.log(`   🔧 Fix: ${expectedFix}`);
        }
      }
      
      this.results.push(result);
      return result;
      
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      const result = {
        name,
        endpoint,
        status: 'ERROR',
        success: false,
        error: error.message,
        fix: expectedFix
      };
      this.results.push(result);
      return result;
    }
  }

  async runDiagnostics() {
    console.log("🚫 SHIPROCKET 403 FORBIDDEN - DIAGNOSTIC TOOL");
    console.log("=" * 55);
    
    // Step 1: Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log("🛑 Cannot proceed without authentication");
      return;
    }

    // Step 2: Get pickup info
    const pickupSuccess = await this.getPickupLocation();

    // Step 3: Test all problematic endpoints
    console.log("\n🧪 Step 3: Testing blocked endpoints...");

    // Test 1: Wallet Balance
    await this.testEndpoint(
      "Wallet Balance",
      "GET",
      "/account/details/wallet-balance",
      null,
      "Verify account KYC, GST documents. Contact support to enable Wallet API access."
    );

    // Test 2: Courier List
    await this.testEndpoint(
      "Courier List",
      "GET",
      "/courier/courierListWithCounts",
      null,
      "Add and verify pickup address in dashboard. Wait 10-15 minutes for sync."
    );

    // Test 3: Serviceability Check
    await this.testEndpoint(
      "Serviceability",
      "GET",
      "/courier/serviceability/?pickup_postcode=180001&delivery_postcode=110001&weight=1&cod=0",
      null,
      "Ensure pickup address verified. Use valid Indian pincodes. Try POST method with body."
    );

    // Test 4: Serviceability (POST method)
    await this.testEndpoint(
      "Serviceability (POST)",
      "POST",
      "/courier/serviceability",
      {
        pickup_postcode: "180001",
        delivery_postcode: "110001",
        weight: 1,
        cod: 0
      },
      "Verify pickup address and use correct pincode format."
    );

    // Test 5: Order Creation
    const orderBody = this.pickupLocation ? {
      order_id: `TEST-${Date.now()}`,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: this.pickupLocation,
      billing_customer_name: "Test Customer",
      billing_last_name: "User",
      billing_address: "Test Address",
      billing_city: "Delhi",
      billing_pincode: "110001",
      billing_state: "Delhi",
      billing_country: "India",
      billing_email: "test@example.com",
      billing_phone: "9999999999",
      shipping_is_billing: true,
      order_items: [{
        name: "Test Product",
        sku: "TEST-001",
        units: 1,
        selling_price: "100"
      }],
      payment_method: "Prepaid",
      sub_total: 100,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    } : null;

    if (orderBody) {
      await this.testEndpoint(
        "Order Creation",
        "POST",
        "/orders/create/adhoc",
        orderBody,
        `Use exact pickup_location: "${this.pickupLocation}". Complete KYC verification.`
      );
    } else {
      console.log("\n❌ Order Creation: SKIPPED (No pickup location available)");
      console.log("   🔧 Fix: Add pickup address first, then retry");
    }

    // Test 6: Order Management
    await this.testEndpoint(
      "Order Management",
      "GET",
      "/orders?page=1&per_page=5",
      null,
      "Complete account verification. Ensure token is from same account as orders."
    );

    // Generate Report
    this.generateReport();
  }

  generateReport() {
    console.log("\n" + "=" * 55);
    console.log("📋 DIAGNOSTIC REPORT");
    console.log("=" * 55);

    const working = this.results.filter(r => r.success);
    const blocked = this.results.filter(r => !r.success && r.status === 403);
    const errors = this.results.filter(r => !r.success && r.status !== 403);

    console.log(`✅ Working endpoints: ${working.length}`);
    working.forEach(r => console.log(`   - ${r.name}`));

    console.log(`❌ Blocked endpoints (403): ${blocked.length}`);
    blocked.forEach(r => console.log(`   - ${r.name}`));

    console.log(`💥 Error endpoints: ${errors.length}`);
    errors.forEach(r => console.log(`   - ${r.name} (${r.status || 'ERROR'})`));

    // Priority Fixes
    console.log("\n🚨 PRIORITY FIXES:");
    
    if (!this.pickupLocation) {
      console.log("1️⃣ ADD PICKUP ADDRESS (Critical)");
      console.log("   🔧 Shiprocket Dashboard → Settings → Pickup Address");
      console.log("   📋 Add warehouse address and wait for verification");
    }

    if (blocked.length > 0) {
      console.log("2️⃣ CONTACT SHIPROCKET SUPPORT");
      console.log("   📧 support@shiprocket.in");
      console.log("   📞 +91-124-6627000");
      console.log("   📋 Request: Enable API access for production use");
    }

    console.log("3️⃣ VERIFY ACCOUNT DOCUMENTS");
    console.log("   📄 Complete KYC verification");
    console.log("   🏢 Submit GST certificate (if applicable)");
    console.log("   🏦 Verify bank account details");

    console.log("\n🎯 NEXT ACTIONS:");
    console.log("1. Fix pickup address issue first");
    console.log("2. Wait 15 minutes, then re-run this diagnostic");
    console.log("3. If still blocked, contact Shiprocket support");
    console.log("4. Your backend code is ready - just waiting for permissions!");
  }
}

// Run diagnostics
const diagnostic = new ShiprocketDiagnostic();
diagnostic.runDiagnostics().catch(console.error);
