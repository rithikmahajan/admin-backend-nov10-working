import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Upload, Mail, Edit, Trash2, Info, Menu, X, Heart, Star, ShoppingCart, Bookmark, Package, Grid, List, Search, CheckCircle, AlertCircle } from "lucide-react";
import {
  uploadNotificationImage,
  sendPushNotification,
  fetchAllNotifications,
  createTestUsers,
  updateCurrentNotification,
  resetCurrentNotification,
  updatePlatforms,
  clearErrors,
  clearSuccessMessages,
  selectCurrentNotification,
  selectNotifications,
  selectLoading,
  selectErrors,
  selectSuccessMessages,
} from "../store/slices/notificationSlice";
import notificationService from "../services/notificationService";

// Dynamic PushNotification component with full API integration
const PushNotification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const currentNotification = useSelector(selectCurrentNotification);
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectLoading);
  const errors = useSelector(selectErrors);
  const successMessages = useSelector(selectSuccessMessages);
  
  // Local state
  const [activeTab, setActiveTab] = useState('notifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState([]);

  // Mock data for save for later (to be implemented)
  const saveForLaterItems = [];
  const saveForLaterCount = 0;
  const saveForLaterLoading = false;

  // Effects
  useEffect(() => {
    // Fetch all notifications on component mount
    dispatch(fetchAllNotifications());
  }, [dispatch]);

  useEffect(() => {
    // Clear success messages after 5 seconds
    if (successMessages.sent || successMessages.uploaded) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessages, dispatch]);

  // Handlers
  const handleNavigateToPreview = () => {
    navigate('/notification-preview');
  };

  const handleInputChange = (field, value) => {
    dispatch(updateCurrentNotification({ [field]: value }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    // Clear API errors
    if (errors.sending) {
      dispatch(clearErrors());
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      try {
        await dispatch(uploadNotificationImage(file)).unwrap();
      } catch (error) {
        // Error is handled by Redux state
        console.error('Upload failed:', error);
      }
    }
  };

  const handleSendNotification = async () => {
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate notification data
    const validation = notificationService.validateNotificationData(currentNotification);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Format data for API
    const notificationData = notificationService.formatNotificationData(currentNotification);

    try {
      await dispatch(sendPushNotification(notificationData)).unwrap();
      // Success is handled by Redux state
    } catch (error) {
      // Error is handled by Redux state
      console.error('Send notification failed:', error);
    }
  };

  const handlePlatformChange = (platform) => {
    dispatch(updatePlatforms(platform));
  };

  const handleResetForm = () => {
    dispatch(resetCurrentNotification());
    setValidationErrors([]);
    dispatch(clearErrors());
    dispatch(clearSuccessMessages());
  };

  const handleCreateTestUsers = async () => {
    try {
      await dispatch(createTestUsers()).unwrap();
      // Success is handled by Redux state
    } catch (error) {
      // Error is handled by Redux state
      console.error('Create test users failed:', error);
    }
  };

  // Render notifications tab
  const renderNotificationsTab = () => (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Column - Form */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Create Notification
          </h2>
          <button
            onClick={handleResetForm}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Success Messages */}
        {successMessages.sent && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessages.sent}</span>
          </div>
        )}

        {successMessages.uploaded && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">{successMessages.uploaded}</span>
          </div>
        )}

        {/* Error Messages */}
        {(errors.sending || errors.uploading || errors.creatingTestUsers || validationErrors.length > 0) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Please fix the following errors:</span>
            </div>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.sending && <li>• {errors.sending}</li>}
              {errors.uploading && <li>• {errors.uploading}</li>}
              {errors.creatingTestUsers && <li>• {errors.creatingTestUsers}</li>}
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Development Helper */}
        {import.meta.env.MODE === 'development' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Development Helper</span>
            </div>
            <p className="text-yellow-700 text-sm mb-3">
              If you get "No FCM tokens found" error, create test users with FCM tokens:
            </p>
            <button
              onClick={handleCreateTestUsers}
              disabled={loading.creatingTestUsers}
              className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
            >
              {loading.creatingTestUsers ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Test Users...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Create Test Users with FCM Tokens
                </>
              )}
            </button>
          </div>
        )}

        {/* Notification Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Title *
          </label>
          <input
            type="text"
            value={currentNotification.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter notification title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <div className="text-xs text-gray-500 mt-1">
            {currentNotification.title.length}/100 characters
          </div>
        </div>

        {/* Notification Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Message *
          </label>
          <textarea
            value={currentNotification.body}
            onChange={(e) => handleInputChange('body', e.target.value)}
            placeholder="Enter your notification message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {currentNotification.body.length}/500 characters
          </div>
        </div>

        {/* Deep Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deep Link (Optional)
          </label>
          <input
            type="text"
            value={currentNotification.deepLink}
            onChange={(e) => handleInputChange('deepLink', e.target.value)}
            placeholder="Enter deep link URL (e.g., app://product/123 or https://...)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-xs text-gray-500 mt-1">
            Use app:// for app deep links or https:// for web URLs
          </div>
        </div>

        {/* Platform Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Platforms
          </label>
          <div className="flex gap-4">
            {['android', 'ios'].map(platform => (
              <label key={platform} className="flex items-center">
                <input
                  type="checkbox"
                  checked={currentNotification.platforms.includes(platform)}
                  onChange={() => handlePlatformChange(platform)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 capitalize">{platform}</span>
              </label>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Leave empty to send to all platforms
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Image (Optional)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={loading.uploading}
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer px-4 py-2 rounded-md border border-gray-300 flex items-center gap-2 transition-colors ${
                loading.uploading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              {loading.uploading ? 'Uploading...' : 'Upload Image'}
            </label>
            {currentNotification.imageUrl && (
              <div className="relative">
                <img
                  src={currentNotification.imageUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-md border"
                />
                <button
                  onClick={() => handleInputChange('imageUrl', '')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Max 5MB. Supported formats: JPG, PNG, GIF, WebP
          </div>
        </div>

        {/* Send Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSendNotification}
            disabled={loading.sending || (!currentNotification.title.trim() || !currentNotification.body.trim())}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading.sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column - Preview */}
      <div className="w-full xl:w-80">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <button
            onClick={handleNavigateToPreview}
            className="p-1 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            title="See full preview"
          >
            <Info size={16} />
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            {currentNotification.imageUrl ? (
              <img
                src={currentNotification.imageUrl}
                alt="Notification Preview"
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                <Mail size={24} className="text-blue-500" />
              </div>
            )}
            
            <div className="text-left space-y-2">
              {currentNotification.title && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Title:</p>
                  <p className="text-sm font-semibold text-gray-800">{currentNotification.title}</p>
                </div>
              )}
              
              {currentNotification.body && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Message:</p>
                  <p className="text-sm text-gray-700">{currentNotification.body}</p>
                </div>
              )}
              
              {currentNotification.deepLink && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Deep Link:</p>
                  <p className="text-xs text-blue-600 break-all">{currentNotification.deepLink}</p>
                </div>
              )}
              
              {currentNotification.platforms.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Target Platforms:</p>
                  <div className="flex gap-1">
                    {currentNotification.platforms.map(platform => (
                      <span key={platform} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded capitalize">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {!currentNotification.title && !currentNotification.body && (
              <p className="text-gray-400 text-sm mt-4">Enter notification details to see preview</p>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading.fetching ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-2">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div key={notification._id} className="p-3 bg-gray-50 rounded border text-left">
                  <p className="text-sm font-medium text-gray-800 truncate">{notification.title}</p>
                  <p className="text-xs text-gray-600 truncate">{notification.body}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 capitalize">{notification.platform}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No notifications sent yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render save for later tab
  const renderSaveForLaterTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Save For Later ({saveForLaterCount} items)
        </h2>
        
        {/* Search and View Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {saveForLaterCount === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items saved for later</h3>
          <p className="text-gray-500">Items you save for later will appear here.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Save for later functionality will be implemented here.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="inline w-4 h-4 mr-2" />
              Push Notifications
            </button>
            <button
              onClick={() => setActiveTab('saveForLater')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saveForLater'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bookmark className="inline w-4 h-4 mr-2" />
              Save For Later ({saveForLaterCount})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'saveForLater' && renderSaveForLaterTab()}
      </div>
    </div>
  );
};

export default PushNotification;
