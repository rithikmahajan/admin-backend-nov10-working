# 🛒 Razorpay Testing Solution - Frontend Team Guide

## ⚠️ Problem Summary

**Error**: `"Invalid item IDs"` when creating Razorpay order

**Root Cause**: Frontend is trying to order products with IDs that don't exist in the backend database.

**Example**: Product ID `68da56fc0561b958f6694e35` (Product 48) doesn't exist in backend.

---

## ✅ Solution 1: Get Real Products from Backend (RECOMMENDED)

### Step 1: Fetch All Available Products

```javascript
// Get all products from backend
const fetchProducts = async () => {
  try {
    const response = await fetch('http://185.193.19.244:8000/api/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const products = await response.json();
    console.log('✅ Available products:', products);
    return products;
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
  }
};
```

### Step 2: Get Single Product by ID

```javascript
// Verify a specific product exists
const checkProduct = async (productId) => {
  try {
    const response = await fetch(`http://185.193.19.244:8000/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const product = await response.json();
      console.log('✅ Product exists:', product);
      return product;
    } else {
      console.log('❌ Product not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking product:', error);
    return null;
  }
};

// Usage
const product = await checkProduct('68da56fc0561b958f6694e35');
if (!product) {
  console.log('⚠️ This product does not exist in backend!');
}
```

### Step 3: Use Real Products in Cart

```javascript
// Before adding to cart, validate product exists
const addToCart = async (productData) => {
  // First, verify product exists in backend
  const backendProduct = await checkProduct(productData.id);
  
  if (!backendProduct) {
    alert('This product is no longer available');
    return;
  }
  
  // Verify the size/SKU exists
  const sizeExists = backendProduct.sizes?.some(
    s => s.sku === productData.sku && s.size === productData.size
  );
  
  if (!sizeExists) {
    alert('This size is no longer available');
    return;
  }
  
  // Now safe to add to cart
  // ... your cart logic here
};
```

---

## 🧪 Solution 2: Get Test Products Endpoint

I've created a new API endpoint to fetch valid test products for Razorpay testing.

### Endpoint: Get Test Products

```http
GET http://185.193.19.244:8000/api/razorpay/test-products
```

**Response**:
```json
{
  "success": true,
  "message": "Available test products for Razorpay checkout",
  "count": 5,
  "products": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "Product Name",
      "price": 3878,
      "sizes": [
        {
          "sku": "SKU035",
          "size": "XL",
          "stock": 10,
          "regularPrice": 3878,
          "salePrice": 0
        }
      ],
      "images": ["..."],
      "category": "...",
      "subcategory": "..."
    }
  ]
}
```

### Usage in Frontend

```javascript
// Fetch test products for Razorpay testing
const getTestProducts = async () => {
  try {
    const response = await fetch('http://185.193.19.244:8000/api/razorpay/test-products');
    const data = await response.json();
    
    console.log('✅ Test products available:', data.products);
    
    // Use first product for testing
    const testProduct = data.products[0];
    const testSize = testProduct.sizes[0];
    
    // Create test cart item
    const cartItem = {
      itemId: testProduct._id,
      name: testProduct.name,
      sku: testSize.sku,
      size: testSize.size,
      quantity: 1,
      price: testProduct.price
    };
    
    console.log('✅ Test cart item:', cartItem);
    return cartItem;
    
  } catch (error) {
    console.error('❌ Failed to fetch test products:', error);
  }
};
```

---

## 🔧 Solution 3: Create Test Products in Database

If no products exist, ask your backend team to run this script to create test products:

### Backend Script (for backend team to run)

```javascript
// File: scripts/create-test-products.js
const mongoose = require('mongoose');
const Item = require('../src/models/Item');

const testProducts = [
  {
    name: "Test Product 1",
    description: "Test product for Razorpay checkout",
    price: 999,
    sizes: [
      {
        size: "S",
        sku: "TEST001-S",
        stock: 10,
        quantity: 10,
        regularPrice: 999,
        salePrice: 0
      },
      {
        size: "M",
        sku: "TEST001-M",
        stock: 10,
        quantity: 10,
        regularPrice: 999,
        salePrice: 0
      }
    ],
    category: "Test Category",
    subcategory: "Test Subcategory",
    status: "live"
  },
  {
    name: "Test Product 2",
    description: "Another test product",
    price: 1999,
    sizes: [
      {
        size: "L",
        sku: "TEST002-L",
        stock: 5,
        quantity: 5,
        regularPrice: 1999,
        salePrice: 1499
      }
    ],
    category: "Test Category",
    subcategory: "Test Subcategory",
    status: "live"
  }
];

async function createTestProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    for (const product of testProducts) {
      const newProduct = new Item(product);
      await newProduct.save();
      console.log(`✅ Created test product: ${product.name} (ID: ${newProduct._id})`);
    }
    
    console.log('✅ All test products created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test products:', error);
    process.exit(1);
  }
}

createTestProducts();
```

---

## 🚀 Quick Fix for Frontend Team

### Option A: Modify Your Test Flow

Instead of using hardcoded mock products, fetch real products from backend first:

```javascript
// Updated test flow
const testRazorpayCheckout = async () => {
  console.log('🧪 Starting Razorpay test...');
  
  // 1. Fetch real products from backend
  const products = await fetch('http://185.193.19.244:8000/api/products')
    .then(res => res.json());
  
  if (!products || products.length === 0) {
    console.error('❌ No products available in backend!');
    return;
  }
  
  // 2. Use first available product
  const testProduct = products[0];
  const testSize = testProduct.sizes[0];
  
  if (!testSize) {
    console.error('❌ Product has no sizes!');
    return;
  }
  
  console.log('✅ Using product:', testProduct.name);
  console.log('✅ Product ID:', testProduct._id);
  
  // 3. Create cart with real product
  const cart = [{
    itemId: testProduct._id,
    name: testProduct.name,
    sku: testSize.sku,
    size: testSize.size,
    quantity: 1,
    price: testProduct.price
  }];
  
  // 4. Create Razorpay order
  const orderData = {
    amount: testProduct.price,
    cart: cart,
    staticAddress: {
      firstName: "Test",
      lastName: "User",
      address: "123 Test St",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
      country: "India",
      phone: "9999999999"
    }
  };
  
  console.log('📤 Creating order with data:', orderData);
  
  const response = await fetch('http://185.193.19.244:8000/api/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourAuthToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  
  const result = await response.json();
  console.log('✅ Order created:', result);
  
  // Continue with Razorpay payment...
};
```

### Option B: Add Product Validation to Cart Context

Update your `BagContext.js` to validate products before adding:

```javascript
// BagContext.js
const addToBag = async (product) => {
  // Validate product exists in backend
  try {
    const response = await fetch(`http://185.193.19.244:8000/api/products/${product.id}`);
    
    if (!response.ok) {
      throw new Error('Product not found');
    }
    
    const backendProduct = await response.json();
    
    // Validate SKU exists
    const sizeExists = backendProduct.sizes?.some(
      s => s.sku === product.sku
    );
    
    if (!sizeExists) {
      throw new Error('Size not available');
    }
    
    // Product is valid, add to cart
    setBag(prevBag => [...prevBag, product]);
    
  } catch (error) {
    console.error('❌ Cannot add product:', error);
    alert('This product is no longer available');
  }
};
```

---

## 📋 Complete Test Checklist

- [ ] **Test 1**: Can fetch all products from `/api/products`
- [ ] **Test 2**: Can fetch single product by ID from `/api/products/:id`
- [ ] **Test 3**: Products have valid `_id`, `name`, `price`, `sizes` fields
- [ ] **Test 4**: Each size has valid `sku`, `size`, `stock` fields
- [ ] **Test 5**: Cart items use real product IDs from backend
- [ ] **Test 6**: Razorpay order creation succeeds with real products
- [ ] **Test 7**: Payment verification works correctly

---

## 🐛 Debugging Guide

### Check 1: Product Exists in Backend

```bash
# Test with curl
curl -X GET http://185.193.19.244:8000/api/products/68da56fc0561b958f6694e35

# Expected: Product data OR 404 error
```

### Check 2: Get All Products

```bash
# Get list of all products
curl -X GET http://185.193.19.244:8000/api/products

# Should return array of products
```

### Check 3: Verify Product Structure

```javascript
// Product should have this structure:
{
  "_id": "...",           // MongoDB ObjectId
  "name": "...",          // Product name
  "price": 999,           // Price in INR
  "sizes": [              // Array of sizes
    {
      "size": "M",        // Size name
      "sku": "SKU001",    // SKU code
      "stock": 10,        // Available stock
      "regularPrice": 999,
      "salePrice": 0
    }
  ],
  "category": "...",
  "subcategory": "...",
  "status": "live"        // Must be "live" to be available
}
```

---

## 💡 Best Practices

### ✅ DO:
- Always fetch products from backend API
- Validate product exists before adding to cart
- Verify SKU and size availability
- Use real product IDs in cart items
- Handle "product not found" errors gracefully

### ❌ DON'T:
- Use hardcoded/mock product IDs
- Skip product validation
- Add products with invalid SKUs
- Use products with `status !== "live"`

---

## 🔗 API Endpoints Reference

### Products API

```http
# Get all products
GET http://185.193.19.244:8000/api/products

# Get single product
GET http://185.193.19.244:8000/api/products/:productId

# Get filtered products
GET http://185.193.19.244:8000/api/products/filtered?category=...

# Get test products (for Razorpay testing)
GET http://185.193.19.244:8000/api/razorpay/test-products
```

### Razorpay API

```http
# Create order
POST http://185.193.19.244:8000/api/razorpay/create-order

# Verify payment
POST http://185.193.19.244:8000/api/razorpay/verify-payment

# Get Razorpay key
GET http://185.193.19.244:8000/api/config/razorpay
```

---

## 📞 Quick Support

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid item IDs" | Product doesn't exist | Use real product ID from `/api/products` |
| "Invalid SKU" | Size/SKU not available | Check product's available sizes |
| "Amount mismatch" | Price calculation wrong | Use exact price from backend |
| "Insufficient stock" | Product out of stock | Check `stock` field before ordering |

---

## 🎯 Action Items for Frontend Team

1. **Immediate** (Do Now):
   - [ ] Replace mock product IDs with real ones from backend
   - [ ] Add product validation before adding to cart
   - [ ] Test with real products from `/api/products`

2. **Short-term** (This Week):
   - [ ] Implement error handling for invalid products
   - [ ] Add stock availability checks
   - [ ] Update cart context to validate products

3. **Long-term** (Next Sprint):
   - [ ] Create comprehensive test suite with real products
   - [ ] Add product sync mechanism
   - [ ] Implement cart validation on checkout

---

## ✨ Summary

**The Issue**: Frontend using product IDs that don't exist in backend database.

**The Solution**: 
1. Fetch real products from `/api/products`
2. Use real product IDs in cart
3. Validate products before checkout

**The Result**: Razorpay orders will work perfectly! 🎉

---

**Last Updated**: October 14, 2025  
**Status**: ✅ Solution Ready  
**Tested**: ✅ Yes  
**Priority**: 🔴 High - Blocks Razorpay testing
