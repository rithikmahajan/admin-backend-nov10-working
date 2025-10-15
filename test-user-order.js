/**
 * Test Script: Place Order as User
 * Tests the complete order flow with updated Shiprocket credentials
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:8000/api';

// Test user credentials (you can replace with actual user credentials)
const TEST_USER = {
  phone: '9999999999', // Replace with actual user phone
  name: 'Test User',
  email: 'testuser@example.com'
};

// Test order data
const TEST_ORDER = {
  items: [
    {
      productId: '67e3b9c8d4e5f6a7b8c9d0e1', // Replace with actual product ID
      name: 'Test Product',
      quantity: 1,
      price: 999,
      size: 'M',
      color: 'Blue'
    }
  ],
  shippingAddress: {
    name: 'Test User',
    phone: '9999999999',
    email: 'testuser@example.com',
    addressLine1: '123 Test Street',
    addressLine2: 'Apartment 4B',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India'
  },
  paymentMethod: 'razorpay',
  totalAmount: 999
};

async function testUserLogin() {
  console.log('\n📱 Step 1: User Login/Registration');
  console.log('=====================================');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: TEST_USER.phone })
    });
    
    const data = await response.json();
    console.log('✅ OTP Send Response:', data);
    
    // Note: In real scenario, you'd verify OTP
    // For testing, we'll use a mock token or existing user
    return data;
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    throw error;
  }
}

async function createRazorpayOrder(authToken) {
  console.log('\n💳 Step 2: Create Razorpay Order');
  console.log('=====================================');
  
  try {
    const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: TEST_ORDER.totalAmount,
        currency: 'INR'
      })
    });
    
    const data = await response.json();
    console.log('✅ Razorpay Order Created:', data);
    return data;
  } catch (error) {
    console.error('❌ Razorpay Order Error:', error.message);
    throw error;
  }
}

async function verifyPaymentAndCreateOrder(authToken, paymentData) {
  console.log('\n📦 Step 3: Verify Payment & Create Order (with Shiprocket)');
  console.log('========================================================');
  
  try {
    const response = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        razorpay_order_id: paymentData.orderId,
        razorpay_payment_id: 'pay_test_' + Date.now(), // Mock payment ID
        razorpay_signature: 'test_signature', // Mock signature
        orderDetails: {
          items: TEST_ORDER.items,
          shippingAddress: TEST_ORDER.shippingAddress,
          totalAmount: TEST_ORDER.totalAmount
        }
      })
    });
    
    const data = await response.json();
    console.log('\n📊 Order Creation Response:');
    console.log('===========================');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ ORDER PLACED SUCCESSFULLY!');
      console.log('📋 Order ID:', data.order?._id);
      console.log('🚛 Shiprocket Order ID:', data.shiprocketOrderId);
      console.log('📦 Shipping Status:', data.order?.shippingStatus);
    } else {
      console.log('\n❌ ORDER FAILED');
      console.log('Error:', data.message);
      if (data.error) {
        console.log('Details:', data.error);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Order Creation Error:', error.message);
    throw error;
  }
}

async function testShiprocketAuth() {
  console.log('\n🔐 Testing Shiprocket Authentication Directly');
  console.log('=============================================');
  
  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'support@yoraa.in',
        password: 'R@0621thik'
      })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.token) {
      console.log('\n✅ Shiprocket Authentication SUCCESSFUL!');
      console.log('🎯 Token received:', data.token.substring(0, 50) + '...');
      return data.token;
    } else {
      console.log('\n❌ Shiprocket Authentication FAILED');
      return null;
    }
  } catch (error) {
    console.error('❌ Shiprocket Auth Error:', error.message);
    throw error;
  }
}

async function getProductsForTesting() {
  console.log('\n🛍️ Fetching Available Products');
  console.log('================================');
  
  try {
    const response = await fetch(`${API_BASE_URL}/products?limit=5`);
    const data = await response.json();
    
    if (data.success && data.products && data.products.length > 0) {
      console.log(`✅ Found ${data.products.length} products`);
      console.log('\nAvailable products for testing:');
      data.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Price: ₹${product.price}`);
        if (product.variants && product.variants.length > 0) {
          console.log(`   Sizes: ${product.variants.map(v => v.size).join(', ')}`);
        }
      });
      return data.products;
    } else {
      console.log('⚠️ No products found');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log('\n🚀 YORAA ORDER PLACEMENT TEST');
  console.log('================================\n');
  console.log('Testing with UPDATED Shiprocket credentials:');
  console.log('Email: support@yoraa.in');
  console.log('Password: R@0621thik');
  console.log('================================\n');
  
  try {
    // First, test Shiprocket authentication directly
    await testShiprocketAuth();
    
    // Get available products
    console.log('\n---');
    const products = await getProductsForTesting();
    
    console.log('\n\n📝 NOTE: To complete the full order test, you need to:');
    console.log('1. Have a valid user token (login with OTP)');
    console.log('2. Use a real product ID from the list above');
    console.log('3. Have Razorpay test mode enabled or use live credentials carefully');
    console.log('\n💡 The Shiprocket authentication test above shows if credentials are working!');
    
    // Uncomment below to run full order flow (requires valid auth token)
    /*
    const authToken = 'YOUR_VALID_AUTH_TOKEN_HERE';
    const razorpayOrder = await createRazorpayOrder(authToken);
    const orderResult = await verifyPaymentAndCreateOrder(authToken, razorpayOrder);
    */
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testShiprocketAuth, getProductsForTesting };
