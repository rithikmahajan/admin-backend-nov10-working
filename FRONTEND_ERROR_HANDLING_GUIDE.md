# Frontend Integration Guide - Enhanced Order Errors

## 🎯 Quick Start

The backend now returns **detailed error information** when order creation fails due to invalid items.

## New Error Response Format

### Example Response
```json
{
  "error": "Invalid item IDs",
  "message": "Some items in your cart are no longer available",
  "invalidItems": [
    {
      "itemId": "68da56fc0561b958f6694e35",
      "name": "Product 48",
      "sku": "PRODUCT48-SMALL-1759589167579-0",
      "size": "small",
      "reason": "Item no longer available or has been removed",
      "availableSizes": [
        { "sku": "...", "size": "M", "stock": 10 }
      ]
    }
  ],
  "suggestion": "Please remove these items from your cart and try again"
}
```

## Frontend Implementation (Optional)

### 1. Basic Error Handling (Current)
Your current error handling **still works**:
```javascript
if (response.error) {
  Alert.alert('Error', 'Please review your cart and try again');
}
```

### 2. Enhanced Error Handling (Recommended)
```javascript
const handleOrderError = (error) => {
  if (error.invalidItems && error.invalidItems.length > 0) {
    // Show detailed error message
    const itemNames = error.invalidItems.map(item => item.name).join(', ');
    const message = error.message || 'Some items in your cart are unavailable';
    
    Alert.alert(
      'Cart Issue',
      `${message}\n\nAffected items: ${itemNames}`,
      [
        {
          text: 'Remove Items',
          onPress: () => removeInvalidItems(error.invalidItems)
        },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('Cart')
        }
      ]
    );
  } else {
    // Generic error
    Alert.alert('Error', error.error || 'Order creation failed');
  }
};
```

### 3. Auto-Remove Invalid Items
```javascript
const removeInvalidItems = (invalidItems) => {
  invalidItems.forEach(item => {
    // Remove from cart using item ID
    dispatch(removeFromCart(item.itemId));
  });
  
  Alert.alert(
    'Cart Updated',
    'Unavailable items have been removed',
    [{ text: 'OK', onPress: () => navigation.navigate('Cart') }]
  );
};
```

### 4. Show Available Alternatives
```javascript
const showAlternatives = (invalidItem) => {
  if (invalidItem.availableSizes && invalidItem.availableSizes.length > 0) {
    const inStock = invalidItem.availableSizes.filter(s => s.stock > 0);
    
    if (inStock.length > 0) {
      Alert.alert(
        `${invalidItem.name}`,
        `Size "${invalidItem.requestedSize}" is unavailable.\n\nAvailable sizes:\n${inStock.map(s => `• ${s.size} (${s.stock} in stock)`).join('\n')}`,
        [
          { text: 'Choose Size', onPress: () => showSizeSelector(invalidItem) },
          { text: 'Remove Item', onPress: () => removeFromCart(invalidItem.itemId) }
        ]
      );
    }
  }
};
```

## Complete Error Handling Flow

```javascript
// In your order creation function
const createOrder = async () => {
  try {
    const response = await yoraaAPI.makeRequest(
      '/api/razorpay/create-order',
      'POST',
      {
        cart: cartItems,
        amount: totalAmount,
        staticAddress: deliveryAddress
      }
    );
    
    if (response.success) {
      // Order created successfully
      proceedToPayment(response.order);
    } else {
      // Handle error with new format
      handleOrderError(response);
    }
  } catch (error) {
    console.error('Order creation error:', error);
    
    // Check if error has detailed information
    if (error.response?.data) {
      handleOrderError(error.response.data);
    } else {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  }
};

const handleOrderError = (error) => {
  // Check for detailed error information
  if (error.invalidItems && error.invalidItems.length > 0) {
    // Show detailed alert with options
    showInvalidItemsAlert(error);
  } else {
    // Show generic error
    Alert.alert('Error', error.message || error.error || 'Order creation failed');
  }
};

const showInvalidItemsAlert = (error) => {
  const invalidItemNames = error.invalidItems.map(item => 
    `• ${item.name} (${item.reason})`
  ).join('\n');
  
  Alert.alert(
    'Cart Issue',
    `${error.message || 'Some items are unavailable'}\n\n${invalidItemNames}\n\n${error.suggestion || 'Please update your cart'}`,
    [
      {
        text: 'Auto-Fix',
        onPress: () => {
          // Remove all invalid items
          error.invalidItems.forEach(item => {
            removeFromCart(item.itemId);
          });
          Alert.alert('Success', 'Cart has been updated');
        }
      },
      {
        text: 'Review Cart',
        onPress: () => navigation.navigate('Cart')
      }
    ]
  );
};
```

## Error Types You'll Receive

### 1. Item Not Found
```json
{
  "error": "Invalid item IDs",
  "message": "Some items in your cart are no longer available",
  "invalidItems": [...],
  "suggestion": "Please remove these items from your cart and try again"
}
```
**Action**: Remove items from cart

### 2. Invalid Size/SKU
```json
{
  "error": "Invalid item configuration",
  "message": "Size or SKU no longer available",
  "invalidItems": [{
    "availableSizes": [...]  // ← Check for this
  }],
  "suggestion": "Please select a different size or remove this item from your cart"
}
```
**Action**: Show size selector or remove item

### 3. Insufficient Stock
```json
{
  "error": "Insufficient stock for item Product Name (M). Available: 2, Requested: 5"
}
```
**Action**: Reduce quantity or remove item

## Minimum Changes Required

**You don't need to change anything!** Your current error handling will continue to work.

**Optional enhancement** for better UX:
```javascript
// Add this check in your error handler
if (error.invalidItems) {
  // New detailed error format
  handleDetailedError(error);
} else {
  // Old error format (still works)
  Alert.alert('Error', error.error || 'Something went wrong');
}
```

## Testing

### Test Case 1: Order with Non-Existent Item
1. Add any item to cart
2. Manually change item ID in cart state to invalid ID
3. Try checkout
4. Should see detailed error with item name and reason

### Test Case 2: Order with Invalid Size
1. Add item to cart
2. Manually change SKU to invalid value
3. Try checkout
4. Should see available sizes in error

## Benefits

✅ Know exactly which items are problematic  
✅ See specific reasons for failure  
✅ Get actionable suggestions  
✅ Auto-remove invalid items if desired  
✅ Show available alternatives  

## Support

If you see this error response format, it means:
- Backend validation is working correctly
- The error message tells you exactly what's wrong
- You can parse `invalidItems` array for details
- Each item has `reason`, `name`, `sku`, `size` fields
- Some errors include `availableSizes` for alternatives

## Quick Fix for Current Issue

The specific error you reported:
```json
{
  "id": "68da56fc0561b958f6694e35",
  "name": "Product 48",
  "sku": "PRODUCT48-SMALL-1759589167579-0"
}
```

**This item doesn't exist in the database.** 

**Immediate solution:**
1. Clear the cart
2. Add a fresh item from the catalog
3. Try checkout again

**Long-term solution:**
- Implement cart validation before checkout
- Sync cart with backend periodically
- Handle `invalidItems` in error response

---

## Summary

✅ Backend now returns structured error data  
✅ Your current code still works  
✅ Optional: Parse `invalidItems` for better UX  
✅ No breaking changes  

**Your frontend team can implement enhanced error handling at their convenience!**
