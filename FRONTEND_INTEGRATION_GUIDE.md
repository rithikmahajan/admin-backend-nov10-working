# 🚀 Frontend Integration Guide - Razorpay with Real Products

## 📋 Quick Start for Frontend Team

This guide shows you exactly how to integrate Razorpay checkout with real backend products.

---

## 🎯 The Problem (Fixed!)

**Before** (❌ Broken):
```javascript
// Using hardcoded/mock product IDs
const cart = [{
  id: "68da56fc0561b958f6694e35",  // ❌ Doesn't exist in backend!
  name: "Product 48",
  price: 0,
  sku: "MOCK_SKU"
}];
```

**After** (✅ Working):
```javascript
// Using real products from backend
const products = await fetch('/api/products').then(r => r.json());
const cart = [{
  itemId: products[0]._id,  // ✅ Real product ID
  name: products[0].name,
  price: products[0].price,
  sku: products[0].sizes[0].sku
}];
```

---

## 🆕 New Test Products Endpoint

### Fetch Valid Products for Testing

```http
GET http://185.193.19.244:8000/api/razorpay/test-products
```

**No authentication required!** This is a public endpoint for testing.

### Response Example:

```json
{
  "success": true,
  "message": "Available test products for Razorpay checkout",
  "count": 10,
  "products": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "Insomniac T-Shirt",
      "description": "Comfortable cotton t-shirt",
      "price": 3878,
      "sizes": [
        {
          "size": "XL",
          "sku": "SKU035",
          "stock": 10,
          "quantity": 10,
          "regularPrice": 3878,
          "salePrice": 0
        },
        {
          "size": "L",
          "sku": "SKU036",
          "stock": 5,
          "quantity": 5,
          "regularPrice": 3878,
          "salePrice": 0
        }
      ],
      "images": ["https://..."],
      "category": "Men",
      "subcategory": "T-Shirts",
      "sampleCartItem": {
        "itemId": "60d5ec49f1b2c72b8c8e4f1a",
        "name": "Insomniac T-Shirt",
        "sku": "SKU035",
        "size": "XL",
        "quantity": 1,
        "price": 3878
      }
    }
  ],
  "usage": {
    "description": "Use these products for testing Razorpay checkout",
    "example": {
      "productId": "60d5ec49f1b2c72b8c8e4f1a",
      "cartItem": {
        "itemId": "60d5ec49f1b2c72b8c8e4f1a",
        "name": "Insomniac T-Shirt",
        "sku": "SKU035",
        "size": "XL",
        "quantity": 1,
        "price": 3878
      }
    }
  }
}
```

---

## 💻 Complete React Native Implementation

### Step 1: Create API Service

```javascript
// services/productAPI.js

const API_BASE = 'http://185.193.19.244:8000/api';

export const productAPI = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get single product by ID
  getProductById: async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/products/${productId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error('Failed to fetch product');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Get test products for Razorpay testing
  getTestProducts: async () => {
    try {
      const response = await fetch(`${API_BASE}/razorpay/test-products`);
      if (!response.ok) throw new Error('Failed to fetch test products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching test products:', error);
      throw error;
    }
  },

  // Validate product exists before adding to cart
  validateProduct: async (productId, sku = null) => {
    try {
      const product = await productAPI.getProductById(productId);
      
      // Check if SKU is provided and exists
      if (sku) {
        const sizeExists = product.sizes?.some(s => s.sku === sku);
        if (!sizeExists) {
          return {
            valid: false,
            error: 'Size/SKU not available',
            product
          };
        }
      }
      
      return {
        valid: true,
        product
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
};
```

### Step 2: Update BagContext with Validation

```javascript
// contexts/BagContext.js

import React, { createContext, useState, useContext } from 'react';
import { productAPI } from '../services/productAPI';
import { Alert } from 'react-native';

const BagContext = createContext();

export const BagProvider = ({ children }) => {
  const [bag, setBag] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add item to bag with validation
  const addToBag = async (product) => {
    setLoading(true);
    try {
      console.log('🔍 Validating product before adding to cart:', product.id);
      
      // Validate product exists in backend
      const validation = await productAPI.validateProduct(
        product.id,
        product.sku
      );
      
      if (!validation.valid) {
        Alert.alert(
          'Product Not Available',
          validation.error || 'This product is no longer available',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      console.log('✅ Product validated, adding to cart');
      
      // Check if product already in cart
      const existingIndex = bag.findIndex(
        item => item.id === product.id && item.sku === product.sku
      );
      
      if (existingIndex >= 0) {
        // Update quantity
        const updatedBag = [...bag];
        updatedBag[existingIndex].quantity += product.quantity || 1;
        setBag(updatedBag);
      } else {
        // Add new item
        setBag(prevBag => [...prevBag, {
          ...product,
          addedAt: new Date().toISOString()
        }]);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      Alert.alert(
        'Error',
        'Failed to add product to cart. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Validate entire cart before checkout
  const validateCart = async () => {
    console.log('🔍 Validating cart before checkout...');
    const invalidItems = [];
    
    for (const item of bag) {
      const validation = await productAPI.validateProduct(item.id, item.sku);
      if (!validation.valid) {
        invalidItems.push({
          ...item,
          error: validation.error
        });
      }
    }
    
    if (invalidItems.length > 0) {
      console.log('❌ Found invalid items:', invalidItems);
      // Remove invalid items
      setBag(prevBag => 
        prevBag.filter(item => 
          !invalidItems.some(invalid => 
            invalid.id === item.id && invalid.sku === item.sku
          )
        )
      );
      
      Alert.alert(
        'Cart Updated',
        `${invalidItems.length} item(s) are no longer available and have been removed.`,
        [{ text: 'OK' }]
      );
      
      return false;
    }
    
    console.log('✅ Cart validated successfully');
    return true;
  };

  const removeFromBag = (productId, sku) => {
    setBag(prevBag => 
      prevBag.filter(item => !(item.id === productId && item.sku === sku))
    );
  };

  const updateQuantity = (productId, sku, quantity) => {
    setBag(prevBag => 
      prevBag.map(item => 
        item.id === productId && item.sku === sku
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearBag = () => {
    setBag([]);
  };

  const getTotalPrice = () => {
    return bag.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
  };

  const getTotalItems = () => {
    return bag.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <BagContext.Provider value={{
      bag,
      addToBag,
      removeFromBag,
      updateQuantity,
      clearBag,
      validateCart,
      getTotalPrice,
      getTotalItems,
      loading
    }}>
      {children}
    </BagContext.Provider>
  );
};

export const useBag = () => {
  const context = useContext(BagContext);
  if (!context) {
    throw new Error('useBag must be used within a BagProvider');
  }
  return context;
};
```

### Step 3: Update Checkout Flow

```javascript
// screens/CheckoutScreen.js

import React, { useState, useEffect } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useBag } from '../contexts/BagContext';
import { productAPI } from '../services/productAPI';

const CheckoutScreen = ({ navigation }) => {
  const { bag, validateCart, clearBag, getTotalPrice } = useBag();
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRazorpayKey();
  }, []);

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch('http://185.193.19.244:8000/api/config/razorpay');
      const data = await response.json();
      setRazorpayKey(data.keyId);
      console.log(`🔑 Razorpay Key loaded: ${data.keyId}`);
    } catch (error) {
      console.error('Failed to fetch Razorpay key:', error);
      Alert.alert('Error', 'Failed to initialize payment system');
    }
  };

  const handleCheckout = async () => {
    if (!razorpayKey) {
      Alert.alert('Error', 'Payment system not initialized');
      return;
    }

    if (bag.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Validate cart
      console.log('🔍 Step 1: Validating cart...');
      const isValid = await validateCart();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Step 2: Prepare cart data
      console.log('📦 Step 2: Preparing cart data...');
      const cartData = {
        amount: getTotalPrice(),
        cart: bag.map(item => ({
          itemId: item.id,           // Use 'id' from product
          name: item.name,
          sku: item.sku,
          size: item.selectedSize || item.size,
          quantity: item.quantity,
          price: item.price
          // ❌ NO description field!
        })),
        staticAddress: {
          firstName: "Test",
          lastName: "User",
          address: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400001",
          country: "India",
          phone: "9999999999"
        }
      };

      console.log('📤 Sending cart data:', JSON.stringify(cartData, null, 2));

      // Step 3: Create Razorpay order
      console.log('🔨 Step 3: Creating Razorpay order...');
      const orderResponse = await fetch(
        'http://185.193.19.244:8000/api/razorpay/create-order',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${yourAuthToken}`, // Replace with actual token
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cartData)
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('❌ Order creation failed:', orderData);
        throw new Error(orderData.error || 'Failed to create order');
      }

      console.log('✅ Order created:', orderData);

      // Step 4: Open Razorpay
      console.log('💳 Step 4: Opening Razorpay checkout...');
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: 'Yoraa',
        description: 'Order Payment',
        image: 'https://your-logo.com/logo.png',
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Step 5: Verify payment
          console.log('✅ Payment successful, verifying...');
          await verifyPayment({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: orderData.id,
            razorpay_signature: data.razorpay_signature
          });
        })
        .catch((error) => {
          console.log('❌ Payment cancelled or failed:', error);
          Alert.alert('Payment Cancelled', 'Your payment was not completed');
        });

    } catch (error) {
      console.error('❌ Checkout error:', error);
      Alert.alert(
        'Checkout Failed',
        error.message || 'Failed to process checkout. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch(
        'http://185.193.19.244:8000/api/razorpay/verify-payment',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${yourAuthToken}`, // Replace with actual token
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log('✅ Payment verified successfully');
        clearBag();
        Alert.alert(
          'Payment Successful',
          'Your order has been placed successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OrderSuccess')
            }
          ]
        );
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      Alert.alert(
        'Verification Failed',
        'Payment verification failed. Please contact support.'
      );
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button
          title="Proceed to Payment"
          onPress={handleCheckout}
          disabled={!razorpayKey || bag.length === 0}
        />
      )}
    </View>
  );
};

export default CheckoutScreen;
```

### Step 4: Testing with Test Products

```javascript
// screens/TestCheckoutScreen.js

import React, { useState, useEffect } from 'react';
import { View, Button, Text, ScrollView, Alert } from 'react-native';
import { productAPI } from '../services/productAPI';
import { useBag } from '../contexts/BagContext';

const TestCheckoutScreen = () => {
  const [testProducts, setTestProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToBag, bag } = useBag();

  useEffect(() => {
    fetchTestProducts();
  }, []);

  const fetchTestProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getTestProducts();
      console.log('✅ Fetched test products:', response);
      setTestProducts(response.products || []);
    } catch (error) {
      console.error('❌ Failed to fetch test products:', error);
      Alert.alert('Error', 'Failed to load test products');
    } finally {
      setLoading(false);
    }
  };

  const addTestProductToCart = async (product) => {
    if (!product.sampleCartItem) {
      Alert.alert('Error', 'No available sizes for this product');
      return;
    }

    const success = await addToBag({
      id: product._id,
      name: product.name,
      sku: product.sampleCartItem.sku,
      size: product.sampleCartItem.size,
      quantity: 1,
      price: product.price,
      selectedSize: product.sampleCartItem.size
    });

    if (success) {
      Alert.alert('Success', `${product.name} added to cart!`);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Test Products for Razorpay
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Cart Items: {bag.length}
      </Text>

      {loading ? (
        <Text>Loading test products...</Text>
      ) : (
        testProducts.map((product, index) => (
          <View key={product._id} style={{ 
            padding: 15, 
            marginBottom: 10, 
            backgroundColor: '#f0f0f0',
            borderRadius: 8
          }}>
            <Text style={{ fontWeight: 'bold' }}>{product.name}</Text>
            <Text>Price: ₹{product.price}</Text>
            <Text>Available Sizes: {product.sizes.map(s => s.size).join(', ')}</Text>
            <Button 
              title="Add to Cart" 
              onPress={() => addTestProductToCart(product)}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default TestCheckoutScreen;
```

---

## 🧪 Testing Checklist

### Before Testing:

- [ ] Backend server is running at `http://185.193.19.244:8000`
- [ ] MongoDB is connected
- [ ] Products exist in database (check `/api/products`)
- [ ] Razorpay keys are configured

### Test Steps:

1. **Fetch Test Products**:
   ```bash
   curl http://185.193.19.244:8000/api/razorpay/test-products
   ```

2. **Verify Product Structure**:
   - Check `_id` field exists
   - Check `sizes` array has items
   - Check each size has `sku` and `stock`

3. **Add to Cart**:
   - Use real product ID from step 1
   - Use real SKU from product sizes
   - Verify cart validation passes

4. **Create Order**:
   - Cart data should match backend format
   - No `description` field in cart items
   - Amount matches cart total

5. **Complete Payment**:
   - Use test card: `4111 1111 1111 1111`
   - Verify payment verification succeeds
   - Check order status updates to "Paid"

---

## 🔧 Common Issues & Solutions

### Issue 1: "Invalid item IDs"

**Cause**: Using product IDs that don't exist in backend

**Solution**:
```javascript
// ❌ Wrong - Using hardcoded ID
const product = { id: "68da56fc0561b958f6694e35" };

// ✅ Correct - Fetch from backend
const products = await productAPI.getAllProducts();
const product = products[0];
```

### Issue 2: "Invalid SKU"

**Cause**: Using SKU that doesn't exist for the product

**Solution**:
```javascript
// Validate SKU before adding to cart
const product = await productAPI.getProductById(productId);
const validSku = product.sizes.find(s => s.sku === desiredSku);
if (!validSku) {
  console.error('SKU not available');
}
```

### Issue 3: "Product not found"

**Cause**: Product was deleted or doesn't exist

**Solution**:
```javascript
// Always validate before checkout
const isValid = await validateCart();
if (!isValid) {
  // Cart will be automatically cleaned
  return;
}
```

---

## 📊 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/products` | GET | No | Get all products |
| `/api/products/:id` | GET | No | Get single product |
| `/api/razorpay/test-products` | GET | No | Get test products |
| `/api/razorpay/create-order` | POST | Yes | Create order |
| `/api/razorpay/verify-payment` | POST | Yes | Verify payment |
| `/api/config/razorpay` | GET | No | Get Razorpay key |

---

## ✅ Final Checklist

- [ ] Using `/api/razorpay/test-products` for testing
- [ ] Validating products before adding to cart
- [ ] Cart items have correct format (itemId, sku, size, quantity, price, name)
- [ ] No `description` field in cart items
- [ ] Validating entire cart before checkout
- [ ] Handling errors gracefully
- [ ] Clearing cart after successful payment

---

**Status**: ✅ Ready for Integration  
**Last Updated**: October 14, 2025  
**Backend API**: v1.0  
**Tested**: ✅ Yes
