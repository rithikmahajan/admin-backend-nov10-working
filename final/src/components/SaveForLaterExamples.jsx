import React from 'react';
import { useSelector } from 'react-redux';
import SaveForLaterButton from '../components/SaveForLaterButton';
import SaveForLaterWidget, { QuickSaveForLaterButton } from '../components/SaveForLaterWidget';
import { useSaveForLater } from '../store/hooks';
import { selectSaveForLaterCount } from '../store/slices/saveForLaterSlice';

// Example of how to use the Save For Later functionality
const SaveForLaterExamples = () => {
  const saveForLater = useSaveForLater();
  const saveForLaterCount = useSelector(selectSaveForLaterCount);
  
  // Example product data
  const exampleProduct = {
    _id: '1',
    productName: 'Cotton Casual T-Shirt',
    regularPrice: 999,
    salePrice: 799,
    images: ['/api/placeholder/300/300'],
    categoryId: { name: 'T-Shirts' },
    subCategoryId: { name: 'Casual' },
    brand: 'YoraaFashion',
    description: 'Comfortable cotton t-shirt perfect for everyday wear',
    productId: 'YF-TSH-001',
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Save For Later - Usage Examples</h1>
        <p className="text-gray-600">
          Here are different ways to integrate the Save for Later functionality
        </p>
      </div>

      {/* Current Save For Later Status */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Current Status</h2>
        <p className="text-blue-700">
          You have <strong>{saveForLaterCount}</strong> items saved for later
        </p>
      </div>

      {/* Button Variants */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Icon Button */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Icon Button (Small)</h3>
            <SaveForLaterButton 
              item={exampleProduct} 
              size="sm"
              variant="icon"
              showText={false}
            />
          </div>

          {/* Regular Icon Button */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Icon Button (Regular)</h3>
            <SaveForLaterButton 
              item={exampleProduct} 
              size="md"
              variant="icon"
              showText={false}
            />
          </div>

          {/* Large Icon Button */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Icon Button (Large)</h3>
            <SaveForLaterButton 
              item={exampleProduct} 
              size="lg"
              variant="icon"
              showText={false}
            />
          </div>

          {/* Button with Text */}
          <div className="text-center md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Button with Text</h3>
            <SaveForLaterButton 
              item={exampleProduct} 
              variant="button"
              showText={true}
            />
          </div>

          {/* Text Link */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Text Link</h3>
            <SaveForLaterButton 
              item={exampleProduct} 
              variant="text"
            />
          </div>
        </div>
      </div>

      {/* Quick Save Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Save Button</h2>
        <p className="text-gray-600 mb-4">
          A lightweight version for product cards and lists
        </p>
        
        <div className="flex items-center justify-center">
          <QuickSaveForLaterButton item={exampleProduct} />
        </div>
      </div>

      {/* Product Card Example */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Product Card Integration</h2>
        
        <div className="max-w-sm mx-auto bg-white border rounded-lg overflow-hidden">
          <div className="relative">
            <img 
              src={exampleProduct.images[0]} 
              alt={exampleProduct.productName}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <SaveForLaterButton 
                item={exampleProduct} 
                size="sm"
                variant="icon"
                showText={false}
              />
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{exampleProduct.productName}</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  ₹{exampleProduct.salePrice}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ₹{exampleProduct.regularPrice}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Add to Cart
              </button>
              <SaveForLaterButton 
                item={exampleProduct} 
                variant="button"
                showText={false}
                className="px-4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save For Later Widget */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Save For Later Widget</h2>
        <p className="text-gray-600 mb-4">
          Display saved items in a sidebar or dashboard
        </p>
        
        <div className="max-w-sm mx-auto">
          <SaveForLaterWidget maxItems={3} />
        </div>
      </div>

      {/* Hook Usage Example */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Using the useSaveForLater Hook</h2>
        
        <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
          <div className="text-green-600">// Import the hook</div>
          <div className="text-blue-600">import {'{ useSaveForLater }'} from '../store/hooks';</div>
          <br />
          <div className="text-green-600">// Use in your component</div>
          <div className="text-purple-600">const</div> saveForLater = <div className="text-blue-600 inline">useSaveForLater()</div>;
          <br />
          <div className="text-green-600">// Available methods:</div>
          <div>• saveForLater.<div className="text-blue-600 inline">addItem</div>(item)</div>
          <div>• saveForLater.<div className="text-blue-600 inline">removeItem</div>(itemId)</div>
          <div>• saveForLater.<div className="text-blue-600 inline">toggleItem</div>(item)</div>
          <div>• saveForLater.<div className="text-blue-600 inline">isInSaveForLater</div>(itemId)</div>
          <div>• saveForLater.<div className="text-blue-600 inline">clearAll</div>()</div>
          <div>• saveForLater.<div className="text-blue-600 inline">moveToCart</div>(itemId, cartData)</div>
          <div>• saveForLater.<div className="text-blue-600 inline">moveToWishlist</div>(itemId, item)</div>
        </div>
      </div>

      {/* API Integration Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">API Integration</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• <strong>GET</strong> /api/save-for-later - Fetch saved items</p>
          <p>• <strong>POST</strong> /api/save-for-later/add - Add item to save for later</p>
          <p>• <strong>DELETE</strong> /api/save-for-later/remove/:itemId - Remove item</p>
          <p>• <strong>DELETE</strong> /api/save-for-later/clear - Clear all items</p>
          <p>• <strong>POST</strong> /api/save-for-later/move-to-cart - Move item to cart</p>
          <p>• <strong>POST</strong> /api/save-for-later/move-to-wishlist - Move item to wishlist</p>
        </div>
      </div>
    </div>
  );
};

export default SaveForLaterExamples;
