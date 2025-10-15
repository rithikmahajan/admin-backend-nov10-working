import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Globe,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import DeliveryOptionsSelector from './DeliveryOptionsSelector';
import LocationCurrencySelector from './LocationCurrencySelector';
import { 
  getUserLocation,
  convertPricesForDisplay,
  formatPrice,
  calculateShippingDisplay
} from '../utils/currencyUtils';

const EnhancedCart = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { items, subtotal, tax, shipping, total, isLoading } = useSelector(state => state.cart);
  
  const [userLocation, setUserLocation] = useState(null);
  const [convertedItems, setConvertedItems] = useState([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [pricesConverted, setPricesConverted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user location and convert prices on component mount
  useEffect(() => {
    initializeCart();
  }, [items]);

  // Listen for location changes
  useEffect(() => {
    const handleLocationChange = (event) => {
      setUserLocation(event.detail);
      convertCartPrices(items, event.detail);
    };

    window.addEventListener('locationChanged', handleLocationChange);
    return () => window.removeEventListener('locationChanged', handleLocationChange);
  }, [items]);

  const initializeCart = async () => {
    try {
      setLoading(true);
      
      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);
      
      // Convert prices if items exist
      if (items.length > 0) {
        await convertCartPrices(items, location);
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertCartPrices = async (cartItems, location) => {
    if (!cartItems.length || !location) return;

    try {
      const response = await convertPricesForDisplay(cartItems, location.country);
      
      if (response.success) {
        setConvertedItems(response.data.items);
        setPricesConverted(response.data.conversionApplied);
      } else {
        setConvertedItems(cartItems);
        setPricesConverted(false);
      }
    } catch (error) {
      console.error('Error converting prices:', error);
      setConvertedItems(cartItems);
      setPricesConverted(false);
    }
  };

  // Calculate totals in user currency
  const cartTotals = useMemo(() => {
    if (!convertedItems.length || !userLocation) {
      return { subtotal: 0, shipping: 0, total: 0 };
    }

    const itemsSubtotal = convertedItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    const shippingCost = selectedDeliveryOption?.cost || 0;
    const totalAmount = itemsSubtotal + shippingCost;

    return {
      subtotal: itemsSubtotal,
      shipping: shippingCost,
      total: totalAmount,
      currency: userLocation.currency
    };
  }, [convertedItems, selectedDeliveryOption, userLocation]);

  const handleQuantityChange = (itemId, change) => {
    // Dispatch quantity change action
    // This would connect to your existing cart slice actions
  };

  const handleRemoveItem = (itemId) => {
    // Dispatch remove item action
    // This would connect to your existing cart slice actions
  };

  const handleDeliveryOptionChange = (option) => {
    setSelectedDeliveryOption(option);
  };

  const handleLocationChange = (newLocation) => {
    setUserLocation(newLocation);
    setShowLocationSelector(false);
  };

  const handleCheckout = () => {
    if (!selectedDeliveryOption) {
      alert('Please select a delivery option');
      return;
    }

    // Proceed to checkout with selected delivery option and currency info
    const checkoutData = {
      items: convertedItems,
      deliveryOption: selectedDeliveryOption,
      totals: cartTotals,
      userLocation: userLocation
    };

    console.log('Proceeding to checkout:', checkoutData);
    // Implement checkout navigation
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Shopping Cart ({items.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Location selector */}
          {userLocation && (
            <button
              onClick={() => setShowLocationSelector(true)}
              className="mt-3 flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Globe className="h-4 w-4 mr-2" />
              <span>{userLocation.flag} {userLocation.country}</span>
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                Prices in {userLocation.currency}
              </span>
            </button>
          )}
        </div>

        {/* Loading state */}
        {(loading || isLoading) && (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty cart */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
            <p className="text-sm text-center">Add some items to get started!</p>
          </div>
        )}

        {/* Cart items */}
        {!loading && convertedItems.length > 0 && (
          <div className="p-6 space-y-4">
            {/* Currency conversion notice */}
            {pricesConverted && userLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Prices converted to {userLocation.currency} for your convenience
                  </span>
                </div>
              </div>
            )}

            {/* Items list */}
            {convertedItems.map((item) => (
              <div key={item.id || item._id} className="flex space-x-4 bg-gray-50 rounded-lg p-4">
                <img
                  src={item.image || '/api/placeholder/80/80'}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.size && `Size: ${item.size}`}
                    {item.color && ` • Color: ${item.color}`}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity, userLocation?.currency)}
                  </div>
                  {item.originalPrice && item.originalPrice !== item.price && (
                    <div className="text-xs text-gray-500">
                      Originally: ₹{item.originalPrice * item.quantity}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Options */}
        {!loading && convertedItems.length > 0 && (
          <div className="px-6 pb-6">
            <DeliveryOptionsSelector
              cartTotal={cartTotals.subtotal}
              cartWeight={convertedItems.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0)}
              selectedOption={selectedDeliveryOption}
              onOptionChange={handleDeliveryOptionChange}
            />
          </div>
        )}

        {/* Cart Summary & Checkout */}
        {!loading && convertedItems.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatPrice(cartTotals.subtotal, cartTotals.currency)}</span>
              </div>
              
              {selectedDeliveryOption && (
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>
                    {selectedDeliveryOption.cost === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatPrice(cartTotals.shipping, cartTotals.currency)
                    )}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatPrice(cartTotals.total, cartTotals.currency)}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={!selectedDeliveryOption}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
              
              {!selectedDeliveryOption && (
                <p className="text-xs text-gray-500 text-center">
                  Please select a delivery option to continue
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Selector Modal */}
      <LocationCurrencySelector
        showModal={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationChange={handleLocationChange}
        currentLocation={userLocation}
      />
    </>
  );
};

export default EnhancedCart;
