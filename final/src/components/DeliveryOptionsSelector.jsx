import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, Info, CheckCircle } from 'lucide-react';
import { 
  getDeliveryOptionsAndCurrency,
  formatPrice,
  calculateShippingDisplay,
  getUserLocation
} from '../utils/currencyUtils';

const DeliveryOptionsSelector = ({ 
  cartTotal = 0, 
  cartWeight = 0, 
  selectedOption, 
  onOptionChange,
  className = ""
}) => {
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [freeDeliveryInfo, setFreeDeliveryInfo] = useState(null);

  useEffect(() => {
    loadDeliveryOptions();
  }, [cartTotal, cartWeight]);

  useEffect(() => {
    const handleLocationChange = () => {
      loadDeliveryOptions();
    };

    window.addEventListener('locationChanged', handleLocationChange);
    return () => window.removeEventListener('locationChanged', handleLocationChange);
  }, []);

  const loadDeliveryOptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getUserLocation();
      setUserLocation(location);

      const response = await getDeliveryOptionsAndCurrency(cartTotal, cartWeight);
      
      if (response.success) {
        setDeliveryOptions(response.data.deliveryOptions || []);
        setFreeDeliveryInfo(response.data.freeDeliveryInfo);
        
        // Auto-select first available option if none selected
        if (!selectedOption && response.data.deliveryOptions.length > 0) {
          onOptionChange(response.data.deliveryOptions[0]);
        }
      } else {
        setError('Failed to load delivery options');
      }
    } catch (err) {
      console.error('Error loading delivery options:', err);
      setError('Unable to load delivery options');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    onOptionChange(option);
  };

  const getDeliveryBadge = (option) => {
    if (option.cost === 0 || option.freeDeliveryApplied) {
      return { text: 'FREE', color: 'bg-green-100 text-green-800' };
    }
    
    if (option.id.includes('express')) {
      return { text: 'FASTEST', color: 'bg-orange-100 text-orange-800' };
    }
    
    if (option.id.includes('international')) {
      return { text: 'WORLDWIDE', color: 'bg-blue-100 text-blue-800' };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-red-600 mb-2">{error}</div>
        <button 
          onClick={loadDeliveryOptions}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Delivery Options
        </h3>
        {userLocation && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            {userLocation.country}
          </div>
        )}
      </div>

      {/* Free Delivery Banner */}
      {freeDeliveryInfo && userLocation?.isIndia && (
        <div className={`mb-4 p-3 rounded-lg border ${
          freeDeliveryInfo.eligible 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            {freeDeliveryInfo.eligible ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <Info className="h-5 w-5 text-yellow-600 mr-2" />
            )}
            <div className="flex-1">
              {freeDeliveryInfo.eligible ? (
                <p className="text-sm text-green-800 font-medium">
                  🎉 Congratulations! You qualify for free delivery
                </p>
              ) : (
                <p className="text-sm text-yellow-800">
                  Add {formatPrice(freeDeliveryInfo.amountNeeded, freeDeliveryInfo.currency)} more for free delivery
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Options */}
      <div className="space-y-3">
        {deliveryOptions.map((option) => {
          const isSelected = selectedOption?.id === option.id;
          const badge = getDeliveryBadge(option);
          const shippingDisplay = calculateShippingDisplay(
            option, 
            cartTotal, 
            userLocation?.currency || 'INR'
          );

          return (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Selection indicator */}
              <div className="absolute top-3 right-3">
                <div className={`w-5 h-5 rounded-full border-2 ${
                  isSelected 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-white" fill="currentColor" />
                  )}
                </div>
              </div>

              {/* Option content */}
              <div className="pr-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <h4 className="font-semibold text-gray-900">
                      {option.name}
                    </h4>
                    {badge && (
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {option.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {option.estimatedDays} business days
                  </div>
                  
                  <div className="text-right">
                    {shippingDisplay?.badge && (
                      <div className="text-xs text-green-600 font-medium">
                        {shippingDisplay.badge}
                      </div>
                    )}
                    <div className="font-semibold text-gray-900">
                      {shippingDisplay?.display || formatPrice(option.cost, userLocation?.currency || 'INR')}
                    </div>
                    {shippingDisplay?.savings > 0 && (
                      <div className="text-xs text-gray-500 line-through">
                        {formatPrice(shippingDisplay.savings, userLocation?.currency || 'INR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Information */}
      {userLocation && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Delivery Information
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            {userLocation.isIndia ? (
              <>
                <div>• All deliveries within India include tracking</div>
                <div>• Free delivery on orders above ₹500</div>
                <div>• Express delivery available in major cities</div>
              </>
            ) : (
              <>
                <div>• International delivery with full tracking</div>
                <div>• Customs duties may apply at destination</div>
                <div>• Delivery times may vary based on location</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* No options available */}
      {deliveryOptions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No delivery options available for your location.</p>
          <p className="text-sm">Please contact support for assistance.</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptionsSelector;
