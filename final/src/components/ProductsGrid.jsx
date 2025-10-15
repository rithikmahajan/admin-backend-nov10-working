import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star, Globe } from 'lucide-react';
import { 
  getUserLocation,
  convertPricesForDisplay,
  formatPrice,
  setUserLocation
} from '../utils/currencyUtils';
import LocationCurrencySelector from './LocationCurrencySelector';

const ProductCard = ({ product, onAddToCart, onToggleWishlist, userLocation }) => {
  const [convertedProduct, setConvertedProduct] = useState(product);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    convertProductPrice();
  }, [product, userLocation]);

  const convertProductPrice = async () => {
    if (!userLocation || userLocation.currency === 'INR') {
      setConvertedProduct(product);
      return;
    }

    try {
      setLoading(true);
      const response = await convertPricesForDisplay([product], userLocation.country);
      
      if (response.success && response.data.items.length > 0) {
        setConvertedProduct(response.data.items[0]);
      } else {
        setConvertedProduct(product);
      }
    } catch (error) {
      console.error('Error converting product price:', error);
      setConvertedProduct(product);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({
      ...convertedProduct,
      originalPrice: product.price, // Keep original INR price for backend
      displayPrice: convertedProduct.price, // Converted price for display
      currency: userLocation?.currency || 'INR'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={convertedProduct.image || '/api/placeholder/300/300'}
          alt={convertedProduct.name}
          className="w-full h-full object-cover"
        />
        
        {/* Discount Badge */}
        {convertedProduct.salePrice && convertedProduct.regularPrice && convertedProduct.salePrice < convertedProduct.regularPrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
            {Math.round(((convertedProduct.regularPrice - convertedProduct.salePrice) / convertedProduct.regularPrice) * 100)}% OFF
          </div>
        )}
        
        {/* Currency Badge */}
        {userLocation && userLocation.currency !== 'INR' && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            {userLocation.currency}
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={() => onToggleWishlist(convertedProduct)}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <Heart className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {convertedProduct.productName || convertedProduct.title}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600">4.5 (120 reviews)</span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {convertedProduct.description}
        </p>

        {/* Price Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                {convertedProduct.salePrice ? (
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(convertedProduct.salePrice, userLocation?.currency)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(convertedProduct.regularPrice, userLocation?.currency)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(convertedProduct.regularPrice || convertedProduct.price, userLocation?.currency)}
                  </span>
                )}
                
                {/* Original price note for international users */}
                {userLocation && userLocation.currency !== 'INR' && convertedProduct.originalPrice && (
                  <div className="text-xs text-gray-500 ml-2">
                    <div>Originally</div>
                    <div>₹{convertedProduct.originalPrice}</div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Product Tags */}
        <div className="flex gap-2 text-xs text-gray-500">
          {convertedProduct.category && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {convertedProduct.category}
            </span>
          )}
          {convertedProduct.brand && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {convertedProduct.brand}
            </span>
          )}
          {userLocation && userLocation.isIndia && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
              Free Delivery
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductsGrid = ({ 
  products = [], 
  loading = false,
  onAddToCart,
  onToggleWishlist 
}) => {
  const [userLocation, setUserLocationState] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    const handleLocationChange = (event) => {
      setUserLocationState(event.detail);
    };

    window.addEventListener('locationChanged', handleLocationChange);
    return () => window.removeEventListener('locationChanged', handleLocationChange);
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocationState(location);
    } catch (error) {
      console.error('Error getting user location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationChange = (newLocation) => {
    setUserLocationState(newLocation);
    setShowLocationSelector(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Location Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          {!locationLoading && userLocation && (
            <button
              onClick={() => setShowLocationSelector(true)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>{userLocation.flag} {userLocation.country}</span>
              <span className="text-xs bg-white px-2 py-1 rounded">
                {userLocation.currency}
              </span>
            </button>
          )}
        </div>
        
        {userLocation && (
          <div className="text-sm text-gray-600">
            {userLocation.isIndia ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                🚚 Free delivery available
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                🌍 International shipping
              </span>
            )}
          </div>
        )}
      </div>

      {/* Currency Notice */}
      {userLocation && userLocation.currency !== 'INR' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-blue-800 font-medium">
                Prices shown in {userLocation.currency} for your convenience
              </p>
              <p className="text-blue-600 text-sm">
                Approximate conversion from INR. Final checkout will be in INR.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id || product._id}
              product={product}
              userLocation={userLocation}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}

      {/* Location Selector Modal */}
      <LocationCurrencySelector
        showModal={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationChange={handleLocationChange}
        currentLocation={userLocation}
      />
    </div>
  );
};

export default ProductsGrid;
