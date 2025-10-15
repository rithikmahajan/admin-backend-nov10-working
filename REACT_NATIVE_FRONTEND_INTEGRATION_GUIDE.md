# 📱 React Native Frontend - Order Creation Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Order Creation Flow](#order-creation-flow)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [React Native Implementation](#react-native-implementation)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## 🎯 Overview

This guide provides complete implementation details for integrating order creation from your React Native app to the Yoraa backend.

### Backend Base URL
```javascript
const API_BASE_URL = 'http://your-backend-domain.com/api';
// For production: https://your-production-domain.com/api
// For development: http://localhost:8000/api
```

### Shiprocket Integration
- Orders are automatically created in Shiprocket after payment verification
- Credentials: `support@yoraa.in` / `R@0621thik`

---

## 🔐 Authentication Flow

### Step 1: Generate OTP

**Endpoint:** `POST /api/auth/generate-otp`

**Request Body:**
```json
{
  "phoneNumber": "7006114695"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP generated successfully",
  "data": {
    "phoneNumber": "7006114695",
    "otp": "123456",
    "expiresAt": "2025-10-14T09:30:00.000Z",
    "message": "OTP sent to 7006114695"
  },
  "statusCode": 200
}
```

**React Native Code:**
```javascript
const generateOTP = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber, // Must be 10 digits
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('OTP sent successfully:', data.data.otp);
      // In production, OTP won't be in response - sent via SMS
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('OTP Generation Error:', error);
    throw error;
  }
};
```

---

### Step 2: Verify OTP

**Endpoint:** `POST /api/auth/verifyOtp`

**Request Body:**
```json
{
  "phoneNumber": "7006114695",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "68ee12e48abe1469b406b6db",
      "name": "Rithik Mahajan",
      "phNo": "7006114695",
      "email": "rithik@yoraa.in",
      "isVerified": true,
      "isPhoneVerified": true,
      "isAdmin": false
    }
  },
  "statusCode": 200
}
```

**React Native Code:**
```javascript
const verifyOTP = async (phoneNumber, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verifyOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        otp: otp,
      }),
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      // Store token securely (AsyncStorage, SecureStore, etc.)
      await AsyncStorage.setItem('authToken', data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
      return data;
    } else {
      throw new Error(data.message || 'OTP verification failed');
    }
  } catch (error) {
    console.error('OTP Verification Error:', error);
    throw error;
  }
};
```

---

## 🛒 Order Creation Flow

### Step 3: Create Razorpay Order

**Endpoint:** `POST /api/razorpay/create-order`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Request Body:**
```json
{
  "amount": 1142,
  "cart": [
    {
      "itemId": "68da56fc0561b958f6694e39",
      "name": "Product 50",
      "quantity": 1,
      "price": 1142,
      "size": "M"
    }
  ],
  "staticAddress": {
    "firstName": "Rithik",
    "lastName": "Mahajan",
    "email": "rithik@yoraa.in",
    "phoneNumber": "7006114695",
    "address": "123 Test Street",
    "city": "Delhi",
    "state": "Delhi",
    "pinCode": "110001"
  },
  "deliveryOption": "standard"
}
```

**Response (Success):**
```json
{
  "id": "order_RTIgoWnw8VvBlV",
  "amount": 1142,
  "amount_paise": 114200,
  "currency": "INR",
  "status": "created",
  "receipt": "receipt_1760433420555",
  "created_at": 1760433420,
  "customer_details": {
    "email": "rithik@yoraa.in",
    "contact": "7006114695",
    "name": "Rithik Mahajan"
  },
  "order_details": {
    "items_count": 1,
    "calculated_amount": 1142,
    "final_amount": 1142,
    "frontend_amount": 1142
  },
  "database_order_id": "68ee150cc9b73544b20be90f"
}
```

**React Native Code:**
```javascript
const createOrder = async (orderData) => {
  try {
    // Get stored auth token
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('User not authenticated. Please login.');
    }

    const response = await fetch(`${API_BASE_URL}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    
    if (response.ok && data.id) {
      console.log('Order created successfully:', data.id);
      return data;
    } else {
      throw new Error(data.error || data.message || 'Order creation failed');
    }
  } catch (error) {
    console.error('Order Creation Error:', error);
    throw error;
  }
};
```

---

### Step 4: Payment Processing (Razorpay)

After creating the order, use Razorpay SDK to process payment:

**React Native Code:**
```javascript
import RazorpayCheckout from 'react-native-razorpay';

const processPayment = async (orderData) => {
  const options = {
    description: 'Order Payment',
    image: 'https://your-logo-url.com/logo.png',
    currency: orderData.currency,
    key: 'rzp_live_VRU7ggfYLI7DWV', // Your Razorpay Key ID
    amount: orderData.amount_paise,
    name: 'Yoraa',
    order_id: orderData.id, // Razorpay order ID from create-order response
    prefill: {
      email: orderData.customer_details.email,
      contact: orderData.customer_details.contact,
      name: orderData.customer_details.name,
    },
    theme: { color: '#F37254' },
  };

  try {
    const data = await RazorpayCheckout.open(options);
    
    // Payment successful - data contains:
    // razorpay_payment_id, razorpay_order_id, razorpay_signature
    console.log('Payment Success:', data);
    
    // Verify payment on backend
    await verifyPayment(data, orderData);
    
  } catch (error) {
    console.error('Payment Error:', error);
    throw error;
  }
};
```

---

### Step 5: Verify Payment & Create Shiprocket Order

**Endpoint:** `POST /api/razorpay/verify-payment`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_AUTH_TOKEN'
}
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_RTIgoWnw8VvBlV",
  "razorpay_payment_id": "pay_RTIh1234567890",
  "razorpay_signature": "abc123def456...",
  "orderDetails": {
    "items": [
      {
        "productId": "68da56fc0561b958f6694e39",
        "name": "Product 50",
        "quantity": 1,
        "price": 1142,
        "size": "M",
        "color": "Blue"
      }
    ],
    "shippingAddress": {
      "name": "Rithik Mahajan",
      "phone": "7006114695",
      "email": "rithik@yoraa.in",
      "addressLine1": "123 Test Street",
      "addressLine2": "Near Test Market",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001",
      "country": "India"
    },
    "totalAmount": 1142
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified and order created successfully",
  "order": {
    "_id": "68ee150cc9b73544b20be90f",
    "orderId": "ORDER-1760433420555",
    "userId": "68ee12e48abe1469b406b6db",
    "items": [...],
    "shippingAddress": {...},
    "totalAmount": 1142,
    "paymentStatus": "completed",
    "orderStatus": "processing",
    "shippingStatus": "pending"
  },
  "shiprocketOrderId": 12345678,
  "razorpayPaymentId": "pay_RTIh1234567890"
}
```

**React Native Code:**
```javascript
const verifyPayment = async (paymentData, orderData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const requestBody = {
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
      orderDetails: {
        items: orderData.cart,
        shippingAddress: {
          name: `${orderData.staticAddress.firstName} ${orderData.staticAddress.lastName}`,
          phone: orderData.staticAddress.phoneNumber,
          email: orderData.staticAddress.email,
          addressLine1: orderData.staticAddress.address,
          addressLine2: orderData.staticAddress.apartment || '',
          city: orderData.staticAddress.city,
          state: orderData.staticAddress.state,
          pincode: orderData.staticAddress.pinCode,
          country: 'India',
        },
        totalAmount: orderData.amount,
      },
    };

    const response = await fetch(`${API_BASE_URL}/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Order completed successfully!');
      console.log('Order ID:', data.order._id);
      console.log('Shiprocket Order ID:', data.shiprocketOrderId);
      return data;
    } else {
      throw new Error(data.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    throw error;
  }
};
```

---

## 📦 Complete React Native Implementation

### Full Order Flow Component

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';

const API_BASE_URL = 'https://your-backend-domain.com/api';

const OrderScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Generate OTP
  const handleGenerateOTP = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent successfully!');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verifyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();
      
      if (data.success && data.data.token) {
        await AsyncStorage.setItem('authToken', data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        Alert.alert('Success', 'Login successful!');
        
        // Proceed to order creation
        handleCreateOrder();
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'OTP verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Order
  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const orderData = {
        amount: 1142,
        cart: [
          {
            itemId: '68da56fc0561b958f6694e39',
            name: 'Product 50',
            quantity: 1,
            price: 1142,
            size: 'M',
          },
        ],
        staticAddress: {
          firstName: 'Rithik',
          lastName: 'Mahajan',
          email: 'rithik@yoraa.in',
          phoneNumber: phoneNumber,
          address: '123 Test Street',
          city: 'Delhi',
          state: 'Delhi',
          pinCode: '110001',
        },
        deliveryOption: 'standard',
      };

      const response = await fetch(`${API_BASE_URL}/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (data.id) {
        // Proceed to payment
        handlePayment(data, orderData);
      } else {
        Alert.alert('Error', data.error || 'Failed to create order');
      }
    } catch (error) {
      Alert.alert('Error', 'Order creation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Process Payment
  const handlePayment = async (orderData, originalOrderData) => {
    const options = {
      description: 'Yoraa Order Payment',
      currency: orderData.currency,
      key: 'rzp_live_VRU7ggfYLI7DWV',
      amount: orderData.amount_paise,
      name: 'Yoraa',
      order_id: orderData.id,
      prefill: {
        email: orderData.customer_details.email,
        contact: orderData.customer_details.contact,
        name: orderData.customer_details.name,
      },
      theme: { color: '#F37254' },
    };

    try {
      const paymentData = await RazorpayCheckout.open(options);
      
      // Payment successful, verify on backend
      await handleVerifyPayment(paymentData, orderData, originalOrderData);
      
    } catch (error) {
      Alert.alert('Payment Failed', error.description || error.message);
    }
  };

  // Step 5: Verify Payment
  const handleVerifyPayment = async (paymentData, orderData, originalOrderData) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const requestBody = {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        orderDetails: {
          items: originalOrderData.cart,
          shippingAddress: {
            name: `${originalOrderData.staticAddress.firstName} ${originalOrderData.staticAddress.lastName}`,
            phone: originalOrderData.staticAddress.phoneNumber,
            email: originalOrderData.staticAddress.email,
            addressLine1: originalOrderData.staticAddress.address,
            city: originalOrderData.staticAddress.city,
            state: originalOrderData.staticAddress.state,
            pincode: originalOrderData.staticAddress.pinCode,
            country: 'India',
          },
          totalAmount: originalOrderData.amount,
        },
      };

      const response = await fetch(`${API_BASE_URL}/razorpay/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Order Successful!',
          `Order ID: ${data.order._id}\nShiprocket Order: ${data.shiprocketOrderId}`,
          [{ text: 'OK', onPress: () => navigateToOrders() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Payment verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToOrders = () => {
    // Navigate to orders screen
    console.log('Navigate to orders');
  };

  return (
    <View style={{ padding: 20 }}>
      {!otpSent ? (
        <>
          <Text>Enter Phone Number</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="10-digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginVertical: 10,
            }}
          />
          <TouchableOpacity
            onPress={handleGenerateOTP}
            disabled={loading}
            style={{
              backgroundColor: '#F37254',
              padding: 15,
              alignItems: 'center',
              borderRadius: 5,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff' }}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text>Enter OTP</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="6-digit OTP"
            keyboardType="number-pad"
            maxLength={6}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginVertical: 10,
            }}
          />
          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={loading}
            style={{
              backgroundColor: '#F37254',
              padding: 15,
              alignItems: 'center',
              borderRadius: 5,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff' }}>Verify & Create Order</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default OrderScreen;
```

---

## 🎨 Cart Item Structure

When building the cart array, each item must include:

```javascript
{
  "itemId": "68da56fc0561b958f6694e39",  // Product ID from backend
  "name": "Product Name",                  // Product name
  "quantity": 1,                           // Quantity
  "price": 1142,                          // Unit price
  "size": "M",                            // Selected size
  "color": "Blue",                        // Selected color (optional)
  "sku": "SKU050"                         // SKU code (optional)
}
```

---

## 📍 Address Structure

```javascript
{
  "firstName": "Rithik",
  "lastName": "Mahajan",
  "email": "rithik@yoraa.in",
  "phoneNumber": "7006114695",
  "address": "123 Test Street",
  "apartment": "Apt 4B",           // Optional
  "landmark": "Near XYZ",          // Optional
  "city": "Delhi",
  "state": "Delhi",
  "pinCode": "110001"
}
```

---

## ❌ Error Handling

### Common Errors and Solutions

#### 1. **Invalid Phone Number**
```json
{
  "success": false,
  "message": "Valid 10-digit phone number is required",
  "statusCode": 400
}
```
**Solution:** Ensure phone number is exactly 10 digits

#### 2. **Invalid OTP**
```json
{
  "success": false,
  "message": "Invalid OTP",
  "statusCode": 400
}
```
**Solution:** User entered wrong OTP - request resend

#### 3. **OTP Expired**
```json
{
  "success": false,
  "message": "OTP has expired",
  "statusCode": 400
}
```
**Solution:** Generate new OTP

#### 4. **Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required",
  "statusCode": 401
}
```
**Solution:** Token expired or invalid - user needs to login again

#### 5. **Invalid Address**
```json
{
  "error": "Missing required address fields: email, phoneNumber",
  "statusCode": 400
}
```
**Solution:** Ensure all required address fields are provided

#### 6. **Invalid Cart Items**
```json
{
  "error": "Invalid item IDs",
  "invalidItems": [
    {
      "itemId": "invalid_id",
      "name": "Product Name",
      "reason": "Invalid ID format"
    }
  ]
}
```
**Solution:** Ensure itemId is valid MongoDB ObjectId from products API

---

## 🔒 Security Best Practices

### 1. **Token Storage**
```javascript
// Store token securely
import * as SecureStore from 'expo-secure-store';

// Save token
await SecureStore.setItemAsync('authToken', token);

// Retrieve token
const token = await SecureStore.getItemAsync('authToken');
```

### 2. **Token Refresh**
```javascript
// Check token expiry
const isTokenExpired = (token) => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auto-refresh if expired
if (isTokenExpired(token)) {
  // Redirect to login
  navigation.navigate('Login');
}
```

### 3. **Secure API Calls**
```javascript
// Create API service with interceptors
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to all requests
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);
```

---

## 🧪 Testing

### Test Script (for development)

```javascript
// test-order-flow.js
const testOrderFlow = async () => {
  const phoneNumber = '7006114695';
  
  try {
    // 1. Generate OTP
    console.log('Step 1: Generating OTP...');
    const otpResponse = await fetch(`${API_BASE_URL}/auth/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    const otpData = await otpResponse.json();
    console.log('OTP:', otpData.data.otp);

    // 2. Verify OTP
    console.log('Step 2: Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE_URL}/auth/verifyOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp: otpData.data.otp }),
    });
    const verifyData = await verifyResponse.json();
    const token = verifyData.data.token;
    console.log('Token:', token.substring(0, 50) + '...');

    // 3. Create Order
    console.log('Step 3: Creating order...');
    const orderResponse = await fetch(`${API_BASE_URL}/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 1142,
        cart: [{
          itemId: '68da56fc0561b958f6694e39',
          name: 'Test Product',
          quantity: 1,
          price: 1142,
          size: 'M',
        }],
        staticAddress: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phoneNumber: phoneNumber,
          address: '123 Test St',
          city: 'Delhi',
          state: 'Delhi',
          pinCode: '110001',
        },
        deliveryOption: 'standard',
      }),
    });
    const orderData = await orderResponse.json();
    console.log('Order Created:', orderData.id);
    console.log('Success! ✅');
    
  } catch (error) {
    console.error('Test Failed:', error);
  }
};

testOrderFlow();
```

---

## 📊 API Response Status Codes

| Status Code | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Process response data |
| 400 | Bad Request | Show validation error to user |
| 401 | Unauthorized | Redirect to login |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Show generic error message |

---

## 🚀 Quick Start Checklist

- [ ] Install dependencies: `npm install react-native-razorpay @react-native-async-storage/async-storage`
- [ ] Configure Razorpay key: `rzp_live_VRU7ggfYLI7DWV`
- [ ] Set API base URL
- [ ] Implement OTP authentication
- [ ] Implement order creation
- [ ] Implement Razorpay payment
- [ ] Implement payment verification
- [ ] Test complete flow
- [ ] Handle error cases
- [ ] Add loading states
- [ ] Store user session securely

---

## 📞 Support

For backend issues or questions:
- Backend Base URL: `https://your-backend-domain.com/api`
- Shiprocket: Orders are auto-created after payment
- Test Phone: `7006114695` (for development)

---

## 📝 Notes

1. **Phone Number Format:** Must be exactly 10 digits (Indian format)
2. **OTP Expiry:** 5 minutes
3. **Token Expiry:** 30 days (stored in JWT)
4. **Required Address Fields:** firstName, lastName, email, phoneNumber, address, city, state, pinCode
5. **Required Cart Fields:** itemId, name, quantity, price, size
6. **Shiprocket:** Automatically creates order after payment verification using credentials `support@yoraa.in`

---

## ✅ Complete Flow Summary

```
User Journey:
1. Enter Phone Number → Generate OTP
2. Enter OTP → Verify & Get Token
3. Add Items to Cart → Create Order (with Token)
4. Process Payment → Razorpay SDK
5. Payment Success → Verify Payment (with Token)
6. Backend Creates Shiprocket Order → Order Complete ✅
```

---

**Last Updated:** October 14, 2025  
**Backend Version:** Production v1.0  
**Shiprocket Credentials:** support@yoraa.in (Active) ✅
