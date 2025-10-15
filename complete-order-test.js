/**
 * Complete User Order Flow Test
 * Simulates a real user placing an order
 */

const https = require('https');
const http = require('http');

const API_BASE = 'localhost:8000';

// Step 1: Get products
function getProducts() {
  return new Promise((resolve, reject) => {
    console.log('\n📦 Step 1: Fetching Products');
    console.log('=============================');
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/products?limit=1',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.products && result.products.length > 0) {
            const product = result.products[0];
            console.log('✅ Product found:', product.name);
            console.log('   ID:', product._id);
            console.log('   Price: ₹' + product.price);
            resolve(product);
          } else {
            console.log('❌ No products found');
            reject(new Error('No products available'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Step 2: Send OTP
function sendOTP(phone) {
  return new Promise((resolve, reject) => {
    console.log('\n📱 Step 2: Sending OTP');
    console.log('=======================');
    console.log('Phone:', phone);
    
    const postData = JSON.stringify({ phone });
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/auth/send-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Response:', result);
          if (result.success) {
            console.log('✅ OTP sent successfully');
            resolve(result);
          } else {
            reject(new Error(result.message || 'Failed to send OTP'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 3: Verify OTP (you'll need to enter the OTP received)
function verifyOTP(phone, otp) {
  return new Promise((resolve, reject) => {
    console.log('\n🔐 Step 3: Verifying OTP');
    console.log('=========================');
    
    const postData = JSON.stringify({ phone, otp });
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/auth/verify-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.token) {
            console.log('✅ OTP verified successfully');
            console.log('🎫 Token:', result.token.substring(0, 50) + '...');
            resolve(result.token);
          } else {
            reject(new Error(result.message || 'Failed to verify OTP'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 4: Create Razorpay Order
function createRazorpayOrder(token, amount) {
  return new Promise((resolve, reject) => {
    console.log('\n💳 Step 4: Creating Razorpay Order');
    console.log('===================================');
    console.log('Amount: ₹' + amount);
    
    const postData = JSON.stringify({ amount, currency: 'INR' });
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/payment/create-order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ Razorpay order created');
            console.log('   Order ID:', result.orderId);
            resolve(result);
          } else {
            reject(new Error(result.message || 'Failed to create Razorpay order'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 5: Verify Payment and Create Order (with Shiprocket)
function verifyPaymentAndCreateOrder(token, razorpayOrder, product) {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Step 5: Verify Payment & Create Order');
    console.log('=========================================');
    
    const orderData = {
      razorpay_order_id: razorpayOrder.orderId,
      razorpay_payment_id: 'pay_test_' + Date.now(),
      razorpay_signature: 'test_signature_' + Date.now(),
      orderDetails: {
        items: [{
          productId: product._id,
          name: product.name,
          quantity: 1,
          price: product.price,
          size: product.variants && product.variants[0] ? product.variants[0].size : 'One Size',
          color: product.variants && product.variants[0] && product.variants[0].color ? product.variants[0].color : 'Default'
        }],
        shippingAddress: {
          name: 'Test User',
          phone: '9876543210',
          email: 'testuser@yoraa.in',
          addressLine1: '123 Test Street',
          addressLine2: 'Near Test Market',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        billingAddress: {
          name: 'Test User',
          phone: '9876543210',
          email: 'testuser@yoraa.in',
          addressLine1: '123 Test Street',
          addressLine2: 'Near Test Market',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        totalAmount: product.price
      }
    };
    
    const postData = JSON.stringify(orderData);
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/payment/verify-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\n📊 Order Response:');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.success) {
            console.log('\n✅ ✅ ✅ ORDER PLACED SUCCESSFULLY! ✅ ✅ ✅');
            console.log('\n📋 Order Details:');
            console.log('   Order ID:', result.order?._id);
            console.log('   Status:', result.order?.status);
            console.log('   Payment Status:', result.order?.paymentStatus);
            console.log('   Shipping Status:', result.order?.shippingStatus);
            if (result.shiprocketOrderId) {
              console.log('   🚛 Shiprocket Order ID:', result.shiprocketOrderId);
              console.log('   ✅ Order created in Shiprocket successfully!');
            }
          } else {
            console.log('\n❌ ORDER CREATION FAILED');
            console.log('Error:', result.message);
          }
          
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main test flow
async function runOrderTest() {
  console.log('\n🎯 YORAA - COMPLETE ORDER PLACEMENT TEST');
  console.log('==========================================');
  console.log('Testing with updated Shiprocket credentials:');
  console.log('✅ Email: support@yoraa.in');
  console.log('✅ Password: R@0621thik');
  console.log('==========================================\n');

  try {
    // Get a product
    const product = await getProducts();
    
    // Test phone number
    const testPhone = '9876543210';
    
    // Send OTP
    await sendOTP(testPhone);
    
    console.log('\n⏸️  PAUSED: Please enter the OTP you received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nTo continue the test:');
    console.log('1. Check the OTP sent to phone:', testPhone);
    console.log('2. Run: node complete-order-with-otp.js <OTP>');
    console.log('\nOr for automated testing (skipping real OTP):');
    console.log('Run: node complete-order-mock.js');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // For automated testing, we'll create a mock order directly
    console.log('💡 Creating mock authenticated session...\n');
    
    // Get admin token for testing (in production, use real user token)
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token'; // Replace with real token
    
    console.log('⚠️  Note: To complete order, you need a valid authentication token');
    console.log('   You can get one by verifying OTP or using an existing session\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
runOrderTest();
