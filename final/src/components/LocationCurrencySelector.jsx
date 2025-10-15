import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Check } from 'lucide-react';
import { 
  getUserLocation, 
  setUserLocation, 
  AVAILABLE_COUNTRIES,
  formatPrice 
} from '../utils/currencyUtils';

const LocationCurrencySelector = ({ 
  showModal, 
  onClose, 
  onLocationChange,
  currentLocation = null 
}) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);

  useEffect(() => {
    if (currentLocation) {
      setCurrentUserLocation(currentLocation);
      const country = AVAILABLE_COUNTRIES.find(c => 
        c.name === currentLocation.country || c.code === currentLocation.country
      );
      setSelectedCountry(country);
    } else {
      // Get current location
      getUserLocation().then(location => {
        setCurrentUserLocation(location);
        const country = AVAILABLE_COUNTRIES.find(c => 
          c.name === location.country || c.code === location.country
        );
        setSelectedCountry(country);
      });
    }
  }, [currentLocation, showModal]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const handleSaveLocation = async () => {
    if (!selectedCountry) return;
    
    setLoading(true);
    
    try {
      const locationData = {
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        currency: selectedCountry.currency,
        isIndia: selectedCountry.code === 'IN',
        flag: selectedCountry.flag
      };
      
      setUserLocation(locationData);
      
      if (onLocationChange) {
        onLocationChange(locationData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Choose Your Location
                </h2>
                <p className="text-sm text-gray-600">
                  Select your country to see prices in your currency
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Selection */}
        {currentUserLocation && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Current Location
                </p>
                <p className="text-sm text-gray-600">
                  {currentUserLocation.country} • {currentUserLocation.currency}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Country List */}
        <div className="p-6">
          <div className="space-y-2">
            {AVAILABLE_COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                  selectedCountry?.code === country.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {country.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Prices in {country.currency} {country.currency === 'INR' ? '₹' : '$'}
                    </p>
                    {country.code === 'IN' && (
                      <p className="text-xs text-green-600 font-medium">
                        Free delivery available
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedCountry?.code === country.code && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Delivery Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Delivery Information
            </h3>
            {selectedCountry?.code === 'IN' ? (
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>🚚</span>
                  <span>Free delivery on orders above ₹500</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Express delivery available (1-2 days)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>🌍</span>
                  <span>International delivery (7-14 days)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📦</span>
                  <span>Tracking available for all orders</span>
                </div>
              </div>
            )}
          </div>

          {/* Currency Example */}
          {selectedCountry && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Price Example
              </h3>
              <div className="text-sm text-gray-600">
                <span>A ₹1000 item will be shown as </span>
                <span className="font-semibold text-gray-900">
                  {selectedCountry.currency === 'INR' 
                    ? '₹1,000' 
                    : '$12 (approximately)'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLocation}
              disabled={!selectedCountry || loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Location indicator component for header/navbar
export const LocationIndicator = ({ onLocationClick, currentLocation }) => {
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    if (!currentLocation) {
      getUserLocation().then(setLocation);
    }

    const handleLocationChange = (event) => {
      setLocation(event.detail);
    };

    window.addEventListener('locationChanged', handleLocationChange);
    return () => window.removeEventListener('locationChanged', handleLocationChange);
  }, [currentLocation]);

  if (!location) {
    return (
      <button 
        onClick={onLocationClick}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onLocationClick}
      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
    >
      <span className="text-lg">{location.flag || '🌍'}</span>
      <div className="text-left">
        <p className="text-sm font-medium group-hover:text-blue-600">
          {location.country}
        </p>
        <p className="text-xs text-gray-500">
          {location.currency} {location.currency === 'INR' ? '₹' : '$'}
        </p>
      </div>
    </button>
  );
};

export default LocationCurrencySelector;
