import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Filter,
  Calendar,
  ChevronDown,
  RotateCw,
  Eye,
  Edit,
  Download,
  MoreHorizontal,
  X,
  Printer,
  Scan,
  Share2,
  Check,
  AlertCircle,
  Package,
  Truck,
  User,
  FileText,
  ArrowLeft,
  Search,
  CheckSquare,
  Square,
  Users,
  TrendingUp,
  Clock,
  ShoppingBag,
  DollarSign,
  Plus,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Shield,
  Navigation,
  Zap,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Send,
  Target,
  Star,
  Award
} from "lucide-react";
import useOrderManagement from "../hooks/useOrderManagement";
import { fetchOrderDetails } from "../store/slices/orderManagementSlice";
import { adminOrderAPI } from "../api/endpoints";

/**
 * Courier Selection Modal Component
 */
const CourierSelectionModal = React.memo(({ 
  isOpen, 
  onClose, 
  couriers, 
  orderId, 
  onSelectCourier, 
  loading 
}) => {
  const [selectedCourier, setSelectedCourier] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Truck className="h-5 w-5 mr-2 text-blue-600" />
            Select Courier for Order #{orderId.slice(-8)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RotateCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading couriers...</span>
          </div>
        ) : couriers.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600">No couriers available for this delivery location</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {couriers.map((courier, index) => (
                <div
                  key={courier.courier_company_id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCourier?.courier_company_id === courier.courier_company_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCourier(courier)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{courier.courier_name}</h4>
                          <p className="text-sm text-gray-500">
                            {courier.estimated_delivery_days || 'N/A'} days delivery
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₹{courier.freight_charge || courier.rate || 'N/A'}
                      </div>
                      {courier.cod_charges > 0 && (
                        <div className="text-sm text-gray-500">
                          COD: ₹{courier.cod_charges}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {courier.is_surface === 1 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Surface
                        </span>
                      )}
                      {courier.is_hyperlocal === 1 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-1">
                          Hyperlocal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedCourier) {
                    onSelectCourier(selectedCourier);
                  }
                }}
                disabled={!selectedCourier}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  selectedCourier
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Assign Courier
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

/**
 * Shiprocket Order Creation Modal Component
 */
const ShiprocketOrderCreationModal = React.memo(({ 
  isOpen, 
  onClose, 
  orderId, 
  orderData, 
  loading,
  onCreateOrder
}) => {
  const [formData, setFormData] = useState({
    pickup_location: 'Primary'
  });

  const [pickupLocations, setPickupLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load pickup locations on modal open
  useEffect(() => {
    if (isOpen && pickupLocations.length === 0) {
      fetchPickupLocations();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        pickup_location: 'Primary'
      });
    }
  }, [isOpen]);

  const fetchPickupLocations = async () => {
    setLoadingLocations(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/pickup-locations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setPickupLocations(result.pickup_locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch pickup locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation - only pickup location is required
    if (!formData.pickup_location) {
      alert('Please select a pickup location');
      return;
    }

    await onCreateOrder(orderId, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="h-6 w-6 mr-3 text-blue-600" />
              Create Shiprocket Order
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Order Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center mb-2">
              <ShoppingBag className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">Order Details</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Order ID:</span>
                <p className="text-blue-900">#{orderId?.slice(-8)}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Total:</span>
                <p className="text-blue-900">₹{orderData?.total_price}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Items:</span>
                <p className="text-blue-900">{orderData?.items?.length || 0}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Status:</span>
                <p className="text-blue-900 capitalize">{orderData?.order_status}</p>
              </div>
            </div>
          </div>

          {/* Simplified Info Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Order Data Source</h4>
                <p className="text-sm text-yellow-700">
                  Order details (customer info, items, pricing) will be automatically fetched from the database.
                  You only need to select the pickup location for shipping.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Pickup Location Selection */}
              <div>
                <h4 className="font-medium text-gray-900 flex items-center mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Pickup Location Selection
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pickup Location *
                  </label>
                  <select
                    value={formData.pickup_location}
                    onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loadingLocations}
                  >
                    {loadingLocations ? (
                      <option>Loading pickup locations...</option>
                    ) : pickupLocations.length > 0 ? (
                      pickupLocations.map((location) => (
                        <option key={location.pickup_location} value={location.pickup_location}>
                          {location.pickup_location} - {location.city}
                        </option>
                      ))
                    ) : (
                      <option value="Primary">Primary (Default)</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The warehouse location from where the order will be shipped
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading && <RotateCw className="h-4 w-4 animate-spin" />}
                <span>{loading ? 'Creating Order...' : 'Create Shiprocket Order'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

/**
 * Enhanced Statistics Dashboard Component with Shiprocket Integration
 */
const StatisticsDashboard = React.memo(({ statistics, loading, shiprocketStats }) => {
  const statsData = [
    {
      title: "Total Orders",
      value: statistics.totalOrders || 0,
      icon: ShoppingBag,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Pending Orders",
      value: statistics.pendingOrders || 0,
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600"
    },
    {
      title: "Shipped Orders",
      value: shiprocketStats?.shippedOrders || 0,
      icon: Truck,
      color: "bg-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Delivered Orders",
      value: statistics.deliveredOrders || 0,
      icon: Check,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Total Revenue",
      value: `₹${(statistics.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-indigo-500",
      textColor: "text-indigo-600"
    },
    {
      title: "AWB Generated",
      value: shiprocketStats?.awbGenerated || 0,
      icon: Package,
      color: "bg-orange-500",
      textColor: "text-orange-600"
    },
    {
      title: "Auto-Assigned",
      value: shiprocketStats?.autoAssigned || 0,
      icon: Zap,
      color: "bg-emerald-500",
      textColor: "text-emerald-600"
    }
  ];

  if (loading.statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-full`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Enhanced Order Row Component with Shiprocket Integration
 */
const OrderRow = React.memo(({ 
  order, 
  isSelected, 
  onSelect, 
  onViewDetails, 
  onUpdateStatus, 
  onAccept, 
  onReject, 
  onAllotVendor,
  onCreateShiprocketOrder,
  onCreateShipment,
  onTrackShipment,
  onGenerateAWB,
  onPrintLabel,
  onCancelOrder,
  onSelectCourier,
  onSchedulePickup,
  onRefreshTracking,
  vendors,
  statusOptions,
  getStatusColor,
  getCourierStatusColor,
  formatDate
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showVendorMenu, setShowVendorMenu] = useState(false);
  const [showShiprocketMenu, setShowShiprocketMenu] = useState(false);

  const getShiprocketStatus = (order) => {
    // Enhanced status detection with priority order
    const statusConfig = [
      { 
        status: 'Delivered', 
        condition: () => order.order_status === 'delivered' || order.shipping_status === 'Delivered',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: '✅'
      },
      { 
        status: 'In Transit', 
        condition: () => order.shipping_status === 'In Transit' || (order.awb_code && order.order_status === 'shipped'),
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: '🚛'
      },
      { 
        status: 'Ready to Ship', 
        condition: () => order.awb_code && order.courier_name && !order.pickup_scheduled,
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: '📦'
      },
      { 
        status: 'AWB Generated', 
        condition: () => order.awb_code && !order.shipping_status?.includes('Transit'),
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '🏷️'
      },
      { 
        status: 'Shipment Created', 
        condition: () => order.shiprocket_shipment_id && !order.awb_code,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '📋'
      },
      { 
        status: 'In Shiprocket', 
        condition: () => order.shiprocket_orderId && !order.shiprocket_shipment_id,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        icon: '🔄'
      },
      { 
        status: 'Ready for Shiprocket', 
        condition: () => order.order_status === 'accepted' && !order.shiprocket_orderId,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '⚡'
      },
      { 
        status: 'Cancelled', 
        condition: () => order.order_status === 'cancelled' || order.shipping_status === 'Cancelled',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '❌'
      },
      { 
        status: 'Pending', 
        condition: () => order.order_status === 'pending',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: '⏳'
      }
    ];

    // Find the first matching status
    for (const config of statusConfig) {
      if (config.condition()) {
        return config;
      }
    }
    
    // Default fallback
    return { 
      status: 'Unknown', 
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      icon: '❓'
    };
  };

  const shiprocketStatus = getShiprocketStatus(order);

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-6 py-4">
        <button
          onClick={() => onSelect(order._id)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-600" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          #{order.order_number?.slice(-8) || order._id?.slice(-8)}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(order.created_at)}
        </div>
        {order.tracking_number && (
          <div className="text-xs text-blue-600 font-medium">
            AWB: {order.tracking_number}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center">
          {order.items?.[0]?.image_url && (
            <img
              src={order.items[0].image_url}
              alt="Product"
              className="h-10 w-10 rounded-full object-cover mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {order.customer?.name || 'Guest Customer'}
            </div>
            <div className="text-sm text-gray-500">
              {order.customer?.email || 'No Email'}
            </div>
            {order.customer?.phone && (
              <div className="text-xs text-gray-500">
                📞 {order.customer.phone}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
          {order.order_status || 'Pending'}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className={`text-sm font-medium ${getCourierStatusColor(order.shipment_status)}`}>
          {order.shipment_status || 'Pending'}
        </span>
        {order.courier_partner && (
          <div className="text-xs text-gray-500 mt-1">
            via {order.courier_partner}
          </div>
        )}
        {order.estimated_delivery && (
          <div className="text-xs text-green-600 mt-1">
            ETA: {new Date(order.estimated_delivery).toLocaleDateString()}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="space-y-2">
          {/* Enhanced Status with Icon and Background */}
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${shiprocketStatus.bgColor} ${shiprocketStatus.color}`}>
              <span className="mr-1">{shiprocketStatus.icon}</span>
              {shiprocketStatus.status}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-1">
            {/* Step 1: Create Shipment */}
            <div className={`w-6 h-1 rounded-full ${
              order.shiprocket_shipment_id ? 'bg-green-400' : 
              order.order_status === 'accepted' ? 'bg-yellow-400' : 'bg-gray-200'
            }`}></div>
            
            {/* Step 2: Generate AWB */}
            <div className={`w-6 h-1 rounded-full ${
              order.awb_code ? 'bg-green-400' : 
              order.shiprocket_shipment_id ? 'bg-yellow-400' : 'bg-gray-200'
            }`}></div>
            
            {/* Step 3: Ready to Ship */}
            <div className={`w-6 h-1 rounded-full ${
              order.awb_code ? 'bg-green-400' : 'bg-gray-200'
            }`}></div>
          </div>
          
          {/* AWB Code with Copy Button */}
          {order.tracking_number && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-600">AWB:</span>
              <span className="text-xs font-mono text-gray-900">{order.tracking_number}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.tracking_number);
                  // You could add a toast notification here
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Copy AWB"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {/* Courier Partner */}
          {order.courier_partner && (
            <div className="text-xs text-blue-600 font-medium">
              📦 {order.courier_partner}
            </div>
          )}
          
          {/* Shipment ID */}
          {order.shiprocket_shipment_id && (
            <div className="text-xs text-gray-500">
              ID: {order.shiprocket_shipment_id}
            </div>
          )}
          
          {/* Tracking Link */}
          {order.tracking_url && (
            <a 
              href={order.tracking_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Track Package
            </a>
          )}
          
          {/* Auto-assigned indicator */}
          {order.auto_assigned && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <Zap className="h-3 w-3 mr-1" />
              Auto-assigned
            </div>
          )}
          
          {/* Next Action Hint */}
          {!order.shiprocket_shipment_id && order.order_status === 'accepted' && (
            <div className="text-xs text-yellow-600 font-medium">
              ▶️ Ready to create shipment
            </div>
          )}
          {order.shiprocket_shipment_id && !order.awb_code && (
            <div className="text-xs text-blue-600 font-medium">
              ▶️ Ready to generate AWB
            </div>
          )}
          {order.awb_code && order.order_status !== 'shipped' && (
            <div className="text-xs text-green-600 font-medium">
              ▶️ Ready to print & ship
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          order.vendorAllotted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {order.vendorAllotted ? 'Assigned' : 'Not Assigned'}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
        ₹{(order.pricing?.total_amount || order.total_amount || order.totalAmount || 0).toLocaleString()}
        {order.payment?.payment_status && (
          <div className={`text-xs mt-1 ${order.payment.payment_status === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>
            {order.payment.payment_status}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {/* View Details */}
          <button
            onClick={() => onViewDetails(order._id)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Enhanced Shiprocket Actions */}
          <div className="relative">
            <button
              onClick={() => setShowShiprocketMenu(!showShiprocketMenu)}
              className={`p-2 rounded-lg transition-colors ${
                order.awb_code ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                order.shiprocket_shipment_id ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                order.order_status === 'accepted' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title="Shiprocket Actions"
            >
              <Truck className="h-4 w-4" />
            </button>
            
            {showShiprocketMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Shiprocket Actions</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {shiprocketStatus.status}
                  </p>
                </div>
                
                <div className="py-2">
                  {/* Step 0: Create Shiprocket Order */}
                  {!order.shiprocket_orderId && ['accepted', 'processing'].includes(order.order_status) && (
                    <button
                      onClick={() => {
                        handleCreateShiprocketOrder(order._id);
                        setShowShiprocketMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full mr-3 text-xs font-medium">
                        0
                      </div>
                      <Plus className="h-4 w-4 mr-2" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Create Shiprocket Order</div>
                        <div className="text-xs text-gray-500">Register order in Shiprocket</div>
                      </div>
                    </button>
                  )}
                  
                  {/* Step 1: Create Shipment */}
                  {order.shiprocket_orderId && !order.shiprocket_shipment_id && ['accepted', 'processing'].includes(order.order_status) && (
                    <button
                      onClick={() => {
                        onCreateShipment(order._id);
                        setShowShiprocketMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full mr-3 text-xs font-medium">
                        1
                      </div>
                      <Package className="h-4 w-4 mr-2" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Create Shipment</div>
                        <div className="text-xs text-gray-500">Initialize shipping process</div>
                      </div>
                    </button>
                  )}
                  
                  {/* Step 2: Generate AWB */}
                  {order.shiprocket_shipment_id && !order.awb_code && (
                    <button
                      onClick={() => {
                        onGenerateAWB(order._id);
                        setShowShiprocketMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <div className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full mr-3 text-xs font-medium">
                        2
                      </div>
                      <FileText className="h-4 w-4 mr-2" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Generate AWB</div>
                        <div className="text-xs text-gray-500">Get tracking number</div>
                      </div>
                    </button>
                  )}
                  
                  {/* Step 3: Ready to Ship Actions */}
                  {order.awb_code && (
                    <>
                      <button
                        onClick={() => {
                          onPrintLabel(order._id);
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full mr-3 text-xs font-medium">
                          3
                        </div>
                        <Printer className="h-4 w-4 mr-2" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">Print Shipping Label</div>
                          <div className="text-xs text-gray-500">Print and attach to package</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          onTrackShipment(order._id);
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Navigation className="h-4 w-4 mr-3 ml-9" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">Track Shipment</div>
                          <div className="text-xs text-gray-500">View real-time tracking</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onRefreshTracking(order._id);
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4 mr-3 ml-9" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">Refresh Tracking</div>
                          <div className="text-xs text-gray-500">Update latest status</div>
                        </div>
                      </button>
                      
                      {/* Copy AWB Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.tracking_number || order.awb_code);
                          alert('AWB copied to clipboard!');
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="h-4 w-4 mr-3 ml-9" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">Copy AWB Number</div>
                          <div className="text-xs text-gray-500">{order.tracking_number || order.awb_code}</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onSchedulePickup(order._id);
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-3 ml-9" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">Schedule Pickup</div>
                          <div className="text-xs text-gray-500">Book courier pickup</div>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Courier Selection - Available after shipment creation */}
                  {order.shiprocket_shipment_id && !order.courier_partner && (
                    <button
                      onClick={() => {
                        onSelectCourier(order._id);
                        setShowShiprocketMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      <Truck className="h-4 w-4 mr-3 ml-9" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Select Courier</div>
                        <div className="text-xs text-gray-500">Choose shipping partner</div>
                      </div>
                    </button>
                  )}
                  
                  {/* Enhanced Shiprocket Actions */}
                  {order.shiprocket_shipment_id && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="px-4 py-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Advanced Actions</h4>
                      </div>
                      
                      <button
                        onClick={() => {
                          handleViewCouriers(order._id);
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Users className="h-4 w-4 mr-3 ml-9" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">View Available Couriers</div>
                          <div className="text-xs text-gray-500">Check courier options</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleViewRates(order._id);
                          setShowShiprocketMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <DollarSign className="h-4 w-4 mr-3 ml-9" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">View Shipping Rates</div>
                          <div className="text-xs text-gray-500">Compare pricing</div>
                        </div>
                      </button>
                      
                      {order.awb_code && (
                        <button
                          onClick={() => {
                            handleCancelShipment(order._id);
                            setShowShiprocketMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-3 ml-9" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">Cancel Shipment</div>
                            <div className="text-xs text-red-500">Cancel and reset</div>
                          </div>
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* Shipment Info */}
                  {(order.shiprocket_shipment_id || order.awb_code) && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="text-xs text-gray-600 space-y-1">
                        {order.shiprocket_shipment_id && (
                          <div>Shipment ID: {order.shiprocket_shipment_id}</div>
                        )}
                        {order.awb_code && (
                          <div>AWB: {order.awb_code}</div>
                        )}
                        {order.courier_partner && (
                          <div>Courier: {order.courier_partner}</div>
                        )}
                        {order.estimated_delivery && (
                          <div>ETA: {new Date(order.estimated_delivery).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="text-green-600 hover:text-green-800"
              title="Update Status"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        onUpdateStatus(order._id, status);
                        setShowStatusMenu(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left capitalize"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vendor Assignment */}
          {vendors.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVendorMenu(!showVendorMenu)}
                className="text-indigo-600 hover:text-indigo-800"
                title="Assign Vendor"
              >
                <User className="h-4 w-4" />
              </button>
              
              {showVendorMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    {vendors.map(vendor => (
                      <button
                        key={vendor._id}
                        onClick={() => {
                          onAllotVendor(order._id, vendor._id);
                          setShowVendorMenu(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        {vendor.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {order.order_status === 'pending' && (
            <>
              <button
                onClick={() => onAccept(order._id)}
                className="text-green-600 hover:text-green-800"
                title="Accept Order"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => onReject(order._id)}
                className="text-red-600 hover:text-red-800"
                title="Reject Order"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Cancel Order - Available for accepted orders with payments */}
          {(order.order_status === 'accepted' || order.order_status === 'shipped') && order.payment_status === 'completed' && (
            <button
              onClick={() => onCancelOrder(order._id)}
              className="text-orange-600 hover:text-orange-800"
              title="Cancel Order (Refund & Restore Stock)"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

/**
 * Inline Order Details Component
 */
const InlineOrderDetails = React.memo(({ 
  isOpen, 
  onClose, 
  orderId, 
  orderDetails, 
  loading, 
  error 
}) => {
  const dispatch = useDispatch();
  const [shiprocketLoading, setShiprocketLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen) return null;

  // Shiprocket Integration Functions
  const handleCreateShipment = async () => {
    setShiprocketLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/create-shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert("Shipment created successfully!");
        dispatch(fetchOrderDetails(orderId)); // Refresh order data
      } else {
        throw new Error("Failed to create shipment");
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("Failed to create shipment. Please try again.");
    } finally {
      setShiprocketLoading(false);
    }
  };

  const handleGenerateAWB = async () => {
    setShiprocketLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/generate-awb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert("AWB generated successfully!");
        dispatch(fetchOrderDetails(orderId));
      } else {
        throw new Error("Failed to generate AWB");
      }
    } catch (error) {
      console.error("Error generating AWB:", error);
      alert("Failed to generate AWB. Please check Shiprocket balance.");
    } finally {
      setShiprocketLoading(false);
    }
  };

  const handlePrintLabel = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipping-label`);
      if (response.ok) {
        const data = await response.json();
        if (data.label_url) {
          window.open(data.label_url, "_blank");
        } else {
          alert("Shipping label not available");
        }
      }
    } catch (error) {
      console.error("Error getting shipping label:", error);
      alert("Failed to get shipping label");
    }
  };

  const order = orderDetails;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-screen mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Order Details - #{orderId?.slice(-8)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RotateCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading order details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <span className="ml-3 text-red-600">Failed to load order details</span>
            </div>
          ) : order ? (
            <div className="p-6">
              {/* Order Status & Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.order_status}
                      </span>
                      <span className="text-sm text-gray-600">
                        Payment: {order.payment_status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Shiprocket Actions */}
                  <div className="flex items-center space-x-2">
                    {!order.shiprocket_shipment_id && order.order_status === 'accepted' && (
                      <button
                        onClick={handleCreateShipment}
                        disabled={shiprocketLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>{shiprocketLoading ? 'Creating...' : 'Create Shipment'}</span>
                      </button>
                    )}
                    
                    {order.shiprocket_shipment_id && !order.awb_code && (
                      <button
                        onClick={handleGenerateAWB}
                        disabled={shiprocketLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{shiprocketLoading ? 'Generating...' : 'Generate AWB'}</span>
                      </button>
                    )}
                    
                    {order.awb_code && (
                      <button
                        onClick={handlePrintLabel}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Label</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Shiprocket Progress */}
                {order.shiprocket_shipment_id && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Shiprocket Progress</h4>
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${order.shiprocket_shipment_id ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Shipment Created</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${order.awb_code ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">AWB Generated</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${order.shipping_status === 'Delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Delivered</span>
                      </div>
                    </div>
                    
                    {order.awb_code && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">AWB Code:</span>
                          <span className="ml-2 font-mono">{order.awb_code}</span>
                        </div>
                        {order.courier_name && (
                          <div>
                            <span className="font-medium">Courier:</span>
                            <span className="ml-2">{order.courier_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {(order.cart || order.item_quantities || []).map((item, index) => {
                    const itemData = item.item_id || item;
                    return (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <img
                            src={itemData?.image || itemData?.imageUrl || '/api/placeholder/64/64'}
                            alt={itemData?.name || 'Product'}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{itemData?.name || 'Unknown Item'}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                          <p className="text-sm font-medium text-gray-900">₹{item.price || itemData?.price || 0}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Customer Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{order.user?.firstName} {order.user?.lastName}</p>
                    </div>
                    {order.user?.email && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900">{order.user.email}</p>
                      </div>
                    )}
                    {order.user?.phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <p className="text-gray-900">{order.user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Shipping Address
                  </h3>
                  {order.shipping_address ? (
                    <div className="space-y-2">
                      <p className="text-gray-900">{order.shipping_address.name}</p>
                      <p className="text-gray-600">{order.shipping_address.street}</p>
                      <p className="text-gray-600">
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                      </p>
                      <p className="text-gray-600">{order.shipping_address.country}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No shipping address available</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-gray-900">₹{order.total_amount || order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-900">{order.payment_method || 'Online'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="text-gray-900">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-gray-400" />
              <span className="ml-3 text-gray-600">No order details available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Enhanced Orders Component with Full Shiprocket Integration
 */
const Orders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Order details view state
  const [viewingOrderDetails, setViewingOrderDetails] = useState({
    isOpen: false,
    orderId: null,
    orderData: null
  });
  
  // Courier selection modal state
  const [courierModal, setCourierModal] = useState({
    isOpen: false,
    orderId: null,
    couriers: [],
    loading: false
  });

  // Shiprocket order creation modal state
  const [createOrderModal, setCreateOrderModal] = useState({
    isOpen: false,
    orderId: null,
    orderData: null,
    loading: false,
    pickupLocations: []
  });

  // Shiprocket wallet balance state
  const [walletBalance, setWalletBalance] = useState({
    balance: null,
    loading: false,
    error: null,
    lastUpdated: null,
    plan: null,
    mock: false,
    note: null,
    message: null
  });
  
  const {
    // State
    orders,
    orderDetails,
    returnRequests,
    exchangeRequests,
    vendors,
    statistics,
    filters,
    sorting,
    pagination,
    loading,
    errors,
    selectedOrders,
    activeTab,
    realTimeUpdates,
    
    // Actions
    actions,
    
    // API calls
    api,
    
    // Helpers
    helpers
  } = useOrderManagement();

  // Redux state for order details
  const { orderDetails: selectedOrderDetails, loading: orderDetailsLoading, error: orderDetailsError } = useSelector(state => state.orderManagement);

  // Local state for UI management
  const [statusOptions, setStatusOptions] = useState([
    'pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'
  ]);
  const [shippingStatusOptions, setShippingStatusOptions] = useState([
    'PENDING', 'PROCESSING', 'SHIPPED', 'RETRYING', 'FAILED', 'AWB_FAILED', 'In Transit', 'Delivered', 'Cancelled'
  ]);
  const [showReturnWindow, setShowReturnWindow] = useState(false);
  const [showExchangeWindow, setShowExchangeWindow] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch status options
  const fetchStatusOptions = useCallback(async () => {
    try {
      const [statusResponse, shippingStatusResponse] = await Promise.all([
        fetch('/api/admin/orders/status-options', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }),
        fetch('/api/admin/orders/shipping-status-options', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        })
      ]);

      const statusData = await statusResponse.json();
      const shippingStatusData = await shippingStatusResponse.json();

      if (statusData.success) setStatusOptions(statusData.statusOptions);
      if (shippingStatusData.success) setShippingStatusOptions(shippingStatusData.shippingStatusOptions);
    } catch (error) {
      console.error('Error fetching status options:', error);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    api.fetchAllOrders();
    api.fetchOrderStatistics();
    api.fetchAvailableVendors();
    fetchStatusOptions();
  }, []);

  // Real-time order updates polling
  useEffect(() => {
    let intervalId;
    
    // Only poll if there are orders with active shipments
    const hasActiveShipments = orders.some(order => 
      order.shiprocket_shipment_id && 
      !['delivered', 'cancelled', 'returned'].includes(order.order_status?.toLowerCase())
    );
    
    if (hasActiveShipments) {
      intervalId = setInterval(async () => {
        try {
          // Fetch real-time updates for active shipments
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/real-time-updates`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.updates?.length > 0) {
              // Update orders with new tracking information
              api.fetchAllOrders();
              console.log('📦 Real-time updates received:', result.data.updates.length, 'shipments updated');
            }
          }
        } catch (error) {
          console.error('Real-time update error:', error);
        }
      }, 30000); // Poll every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [orders, api]);

  // Function to manually refresh tracking for specific order
  const handleRefreshTracking = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order || !order.awb_code) {
      alert('❌ No tracking available for this order');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/refresh-tracking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`✅ Tracking refreshed!\n` +
              `Status: ${result.data.current_status}\n` +
              `Last Update: ${new Date(result.data.last_update).toLocaleString()}`);
        
        // Refresh orders to show updated tracking
        api.fetchAllOrders();
      } else {
        throw new Error(result.message || 'Failed to refresh tracking');
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
      alert('❌ Failed to refresh tracking:\n' + error.message);
    }
  }, [orders, api]);

  // Calculate Shiprocket statistics from orders
  const shiprocketStats = useMemo(() => {
    const shippedCount = orders.filter(order => order.awb_code).length;
    const awbGenerated = orders.filter(order => order.awb_code).length;
    const pendingShipments = orders.filter(order => 
      order.order_status === 'accepted' && !order.shiprocket_shipment_id
    ).length;
    const autoAssignedCount = orders.filter(order => 
      order.auto_assigned || (order.shiprocket_shipment_id && order.payment_status === 'completed')
    ).length;
    
    return {
      shippedOrders: shippedCount,
      awbGenerated,
      pendingShipments,
      autoAssigned: autoAssignedCount
    };
  }, [orders]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    actions.updateFilters(newFilters);
    api.fetchAllOrders({
      ...filters,
      ...newFilters,
      page: 1,
      limit: pagination.itemsPerPage,
      sortBy: sorting.field,
      sortOrder: sorting.order
    });
  }, [actions, api, filters, pagination.itemsPerPage, sorting]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    actions.resetFilters();
    api.fetchAllOrders({
      page: 1,
      limit: pagination.itemsPerPage,
      sortBy: sorting.field,
      sortOrder: sorting.order
    });
  }, [actions, api, pagination.itemsPerPage, sorting]);

  // Handle order actions
  const handleViewDetails = useCallback(async (orderId) => {
    setViewingOrderDetails({
      isOpen: true,
      orderId: orderId,
      orderData: null
    });
    
    // Fetch order details
    dispatch(fetchOrderDetails(orderId));
  }, [dispatch]);

  const handleAcceptOrder = useCallback(async (orderId) => {
    try {
      await api.acceptOrder(orderId, 'Order accepted by admin');
      api.fetchAllOrders();
      api.fetchOrderStatistics();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  }, [api]);

  const handleRejectOrder = useCallback(async (orderId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await api.rejectOrder(orderId, reason, 'Order rejected by admin');
        api.fetchAllOrders();
        api.fetchOrderStatistics();
      } catch (error) {
        console.error('Error rejecting order:', error);
      }
    }
  }, [api]);

  const handleAllotVendor = useCallback(async (orderId, vendorId) => {
    try {
      await api.allotVendor(orderId, vendorId, 'Vendor assigned by admin');
      api.fetchAllOrders();
    } catch (error) {
      console.error('Error allotting vendor:', error);
    }
  }, [api]);

  const handleUpdateStatus = useCallback(async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status, `Status updated to ${status}`);
      api.fetchAllOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [api]);

  const handleCancelOrder = useCallback(async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order? This will:\n- Cancel the shipment in Shiprocket\n- Process full refund through Razorpay\n- Restore inventory\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel order');
      }

      const result = await response.json();
      
      // Refresh orders list
      api.fetchAllOrders();
      
      // Show success message
      alert(`Order cancelled successfully!\n${result.message}`);
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(`Failed to cancel order: ${error.message}`);
    }
  }, [api]);

  // Enhanced Shiprocket Integration Handlers with Real API Calls
  const handleCreateShiprocketOrder = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      alert('❌ Order not found');
      return;
    }

    // Check order status
    if (!['accepted', 'processing'].includes(order.order_status)) {
      alert('⚠️ Order must be in "accepted" or "processing" status to create Shiprocket order\n' +
            `Current status: ${order.order_status}`);
      return;
    }

    // Check if order is already in Shiprocket
    if (order.shiprocket_orderId) {
      const viewDetails = confirm('⚠️ This order is already registered in Shiprocket\n' +
            `Shiprocket Order ID: ${order.shiprocket_orderId}\n\n` +
            'Would you like to view the Shiprocket details?');
      
      if (viewDetails) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/shiprocket-details`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
            }
          });
          const result = await response.json();
          if (result.success) {
            alert(`📦 Shiprocket Order Details:\n\n` +
                  `Order ID: ${result.data.order_id}\n` +
                  `Status: ${result.data.status}\n` +
                  `Shipment ID: ${result.data.shipment_id || 'Not created'}\n` +
                  `AWB: ${result.data.awb_code || 'Not generated'}\n` +
                  `Courier: ${result.data.courier_name || 'Not assigned'}`);
          }
        } catch (error) {
          console.error('Error fetching Shiprocket details:', error);
        }
      }
      return;
    }

    // Show the Shiprocket order creation modal
    setCreateOrderModal({
      isOpen: true,
      orderId: orderId,
      orderData: order,
      loading: false
    });
  }, [orders]);

  const handleProcessCreateOrder = useCallback(async (orderId, formData) => {
    setCreateOrderModal(prev => ({ ...prev, loading: true }));

    try {
      // Call the API to create Shiprocket order
      // Backend only needs pickupLocationId, it builds order data from database
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/create-shiprocket-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pickupLocationId: formData.pickup_location || "Primary"
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Success notification
        alert('✅ Shiprocket order created successfully!\n' + 
              `Order ID: ${result.data.order_id}\n` +
              `Shipment ID: ${result.data.shipment_id}\n` +
              `Status: NEW`);
        
        // Close modal and refresh orders
        setCreateOrderModal({
          isOpen: false,
          orderId: null,
          orderData: null,
          loading: false
        });
        
        api.fetchAllOrders();
      } else {
        throw new Error(result.message || result.error || 'Failed to create Shiprocket order');
      }
    } catch (error) {
      console.error('Error creating Shiprocket order:', error);
      alert('❌ Failed to create Shiprocket order:\n' + error.message + '\n\nPlease check:\n- Order is in accepted status\n- All required fields are filled\n- Shiprocket account is active');
    } finally {
      setCreateOrderModal(prev => ({ ...prev, loading: false }));
    }
  }, [api, orders]);

  const handleCreateShipment = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      alert('❌ Order not found');
      return;
    }

    // Validate order prerequisites
    if (!order.shiprocket_orderId) {
      alert('⚠️ Please create Shiprocket order first before creating shipment');
      return;
    }

    if (order.shiprocket_shipment_id) {
      alert('⚠️ Shipment already exists for this order\n' +
            `Shipment ID: ${order.shiprocket_shipment_id}`);
      return;
    }

    // Show loading notification
    const confirmed = confirm(`🚢 Create shipment for Order #${orderId.slice(-8)}?\n\n` +
                             `Customer: ${order.customer?.name || order.user?.firstName}\n` +
                             `Amount: ₹${order.total_amount || order.totalAmount}\n` +
                             `Items: ${(order.cart || order.items || []).length}`);
    
    if (!confirmed) return;
    
    try {
      // Real API call to create shipment - Backend handles all data mapping
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          // Backend will fetch order details and map to Shiprocket format
          pickup_location: 'Primary'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('✅ Shipment created successfully!\n' + 
              `Shipment ID: ${result.data.shipment_id}\n` +
              `Status: ${result.data.status}`);
        
        // Refresh orders to show updated shipment info
        api.fetchAllOrders();
      } else {
        throw new Error(result.message || result.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('❌ Failed to create shipment:\n' + error.message + '\n\nPlease check:\n- Order details are complete\n- Shiprocket account has balance\n- Network connection');
    }
  }, [api, orders]);

  const handleTrackShipment = useCallback(async (orderId) => {
    try {
      // Real API call to get tracking information
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/track`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const trackingData = result.data;
        
        // Show detailed tracking information
        const trackingInfo = `
📦 Tracking Information for Order #${orderId.slice(-8)}

AWB: ${trackingData.awb_code}
Status: ${trackingData.current_status}
Courier: ${trackingData.courier_name}

Recent Updates:
${trackingData.tracking_data?.track_detail?.slice(0, 3).map((track, index) => 
  `${index + 1}. ${track.status} - ${new Date(track.date).toLocaleString()}`
).join('\n')}

Expected Delivery: ${trackingData.etd ? new Date(trackingData.etd).toLocaleDateString() : 'Not available'}
        `;
        
        const shouldOpenUrl = confirm(trackingInfo + '\n\nWould you like to open the detailed tracking page?');
        
        if (shouldOpenUrl && trackingData.tracking_url) {
          window.open(trackingData.tracking_url, '_blank');
        }
      } else {
        throw new Error(result.message || 'Failed to get tracking information');
      }
    } catch (error) {
      console.error('Error tracking shipment:', error);
      alert('❌ Failed to get tracking information:\n' + error.message);
    }
  }, []);

  const handleGenerateAWB = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order || !order.shiprocket_shipment_id) {
      alert('❌ Cannot generate AWB: Shipment not created yet');
      return;
    }

    try {
      // Real API call to generate AWB
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shipment_id: order.shiprocket_shipment_id
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('✅ AWB generated successfully!\n' + 
              `AWB Code: ${result.data.awb_code}\n` +
              `Courier: ${result.data.courier_name}\n` +
              `Expected Delivery: ${result.data.expected_delivery || 'TBD'}`);
        
        // Refresh orders to show updated AWB info
        api.fetchAllOrders();
      } else {
        throw new Error(result.message || 'Failed to generate AWB');
      }
    } catch (error) {
      console.error('Error generating AWB:', error);
      alert('❌ Failed to generate AWB:\n' + error.message + '\n\nPossible reasons:\n- Insufficient Shiprocket wallet balance\n- Invalid shipment details\n- Courier service unavailable');
    }
  }, [api, orders]);

  // NEW: Enhanced Shiprocket Features
  const handleViewCouriers = useCallback(async (orderId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/couriers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const courierList = result.couriers.map((courier, index) => 
          `${index + 1}. ${courier.courier_name} - ₹${courier.freight_charge || 'N/A'} (${courier.estimated_delivery_days || 'N/A'} days)`
        ).join('\n');
        
        alert(`📦 Available Couriers for Order #${orderId.slice(-8)}:\n\n${courierList}`);
      } else {
        throw new Error(result.message || 'Failed to get couriers');
      }
    } catch (error) {
      console.error('Error getting couriers:', error);
      alert('❌ Failed to get available couriers:\n' + error.message);
    }
  }, []);

  const handleViewRates = useCallback(async (orderId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/rates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const ratesList = result.rates.map((rate, index) => 
          `${index + 1}. ${rate.courier_name}\n   Rate: ₹${rate.total_charge}\n   COD: ₹${rate.cod_charges || 0}\n   Days: ${rate.estimated_delivery_days || 'N/A'}\n`
        ).join('\n');
        
        alert(`💰 Shipping Rates for Order #${orderId.slice(-8)}:\n\n${ratesList}`);
      } else {
        throw new Error(result.message || 'Failed to get rates');
      }
    } catch (error) {
      console.error('Error getting rates:', error);
      alert('❌ Failed to get shipping rates:\n' + error.message);
    }
  }, []);

  const handleCancelShipment = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order || !order.shiprocket_shipment_id) {
      alert('❌ No shipment found to cancel');
      return;
    }

    const confirmCancel = confirm(`⚠️ Are you sure you want to cancel the shipment for Order #${orderId.slice(-8)}?\n\nThis action cannot be undone.`);
    if (!confirmCancel) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/cancel-shipment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('✅ Shipment cancelled successfully!');
        api.fetchAllOrders();
      } else {
        throw new Error(result.message || 'Failed to cancel shipment');
      }
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      alert('❌ Failed to cancel shipment:\n' + error.message);
    }
  }, [api, orders]);

  const handlePrintLabel = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order || !order.awb_code) {
      alert('❌ Cannot print label: AWB not generated yet');
      return;
    }

    try {
      // Real API call to get shipping label
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/label`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const labelData = result.data;
        
        if (labelData.label_url) {
          // Open label in new window for printing
          const printWindow = window.open(labelData.label_url, '_blank', 'width=800,height=600');
          
          // Show instructions
          alert('🖨️ Shipping label opened in new window!\n\n' +
                'Instructions:\n' +
                '1. Wait for the label to load completely\n' +
                '2. Print the label on A4 paper\n' +
                '3. Cut along the dotted lines if present\n' +
                '4. Attach securely to the package\n\n' +
                `AWB: ${order.awb_code}\n` +
                `Courier: ${order.courier_partner || 'TBD'}`);
        } else {
          throw new Error('Label URL not available');
        }
      } else {
        throw new Error(result.message || 'Failed to get shipping label');
      }
    } catch (error) {
      console.error('Error getting shipping label:', error);
      alert('❌ Failed to get shipping label:\n' + error.message);
    }
  }, [orders]);

  const handleBulkAction = useCallback(async (orderIds, action, data) => {
    try {
      await api.bulkUpdateOrders(orderIds, action, data);
      api.fetchAllOrders();
      actions.deselectAllOrders();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  }, [api, actions]);

  // Enhanced function to handle courier selection with modal
  const handleSelectCourier = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order || !order.shiprocket_shipment_id) {
      alert('❌ Cannot select courier: Create shipment first');
      return;
    }

    // Open modal and start loading couriers
    setCourierModal({
      isOpen: true,
      orderId,
      couriers: [],
      loading: true
    });

    try {
      // Get available couriers
      const couriersResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/couriers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });

      const couriersResult = await couriersResponse.json();
      
      if (!couriersResponse.ok || !couriersResult.success) {
        throw new Error(couriersResult.message || 'Failed to get available couriers');
      }

      const couriers = couriersResult.couriers || [];
      
      // Update modal with couriers
      setCourierModal(prev => ({
        ...prev,
        couriers,
        loading: false
      }));

    } catch (error) {
      console.error('Error loading couriers:', error);
      setCourierModal(prev => ({
        ...prev,
        loading: false
      }));
      alert('❌ Failed to load couriers:\n' + error.message);
    }
  }, [orders]);

  // Handle courier assignment from modal
  const handleAssignCourier = useCallback(async (selectedCourier) => {
    try {
      const assignResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${courierModal.orderId}/assign-courier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          courier_company_id: selectedCourier.courier_company_id,
          courier_name: selectedCourier.courier_name
        })
      });

      const assignResult = await assignResponse.json();
      
      if (assignResponse.ok && assignResult.success) {
        // Close modal
        setCourierModal({
          isOpen: false,
          orderId: null,
          couriers: [],
          loading: false
        });
        
        alert('✅ Courier assigned successfully!\n' + 
              `Courier: ${assignResult.data.courier_name}\n` +
              `AWB Code: ${assignResult.data.awb_code}\n` +
              `Expected Delivery: ${assignResult.data.expected_delivery_date || 'TBD'}`);
        
        // Refresh orders to show updated info
        api.fetchAllOrders();
      } else {
        throw new Error(assignResult.message || 'Failed to assign courier');
      }
    } catch (error) {
      console.error('Error assigning courier:', error);
      alert('❌ Failed to assign courier:\n' + error.message);
    }
  }, [courierModal.orderId, api]);

  // Function to handle pickup scheduling
  const handleSchedulePickup = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order || !order.awb_code) {
      alert('❌ Cannot schedule pickup: Generate AWB first');
      return;
    }

    const pickupDate = prompt(
      `📅 Schedule pickup for Order #${orderId.slice(-8)}\n\n` +
      `AWB: ${order.awb_code}\n` +
      `Courier: ${order.courier_partner || 'TBD'}\n\n` +
      'Enter pickup date (YYYY-MM-DD):'
    );

    if (!pickupDate) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}/schedule-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pickup_date: pickupDate,
          pickup_time: '10:00-18:00'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`✅ Pickup scheduled successfully!\n` +
              `Date: ${pickupDate}\n` +
              `Time: 10:00 AM - 6:00 PM\n` +
              `Pickup Token: ${result.data.pickup_token || 'N/A'}`);
        
        api.fetchAllOrders();
      } else {
        throw new Error(result.message || 'Failed to schedule pickup');
      }
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      alert('❌ Failed to schedule pickup:\n' + error.message);
    }
  }, [orders, api]);

  // Function to fetch Shiprocket wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      setWalletBalance(prev => ({ ...prev, loading: true, error: null }));
      
      // Use the proper API endpoint from endpoints.js
      const response = await adminOrderAPI.getShiprocketWalletBalance();
      
      console.log('🔵 Wallet balance response:', response.data);
      
      // Handle different response structures
      let balance = null;
      let success = false;
      let walletData = {};
      
      if (response.data) {
        if (response.data.success && response.data.data && typeof response.data.data.balance !== 'undefined') {
          // Standard success response structure
          balance = response.data.data.balance;
          walletData = response.data.data;
          success = true;
        } else if (typeof response.data.balance !== 'undefined') {
          // Direct balance in response.data
          balance = response.data.balance;
          walletData = response.data;
          success = true;
        } else if (response.data.success === false) {
          throw new Error(response.data.message || 'API returned success: false');
        }
      }
      
      if (success && balance !== null) {
        setWalletBalance({
          balance: parseFloat(balance) || 0,
          loading: false,
          error: null,
          lastUpdated: walletData.last_updated || new Date().toISOString(),
          plan: walletData.plan || null,
          mock: walletData.mock || false,
          note: walletData.note || null,
          message: walletData.message || response.data?.message || null
        });
      } else {
        throw new Error('Invalid response structure or missing balance data');
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch wallet balance';
      setWalletBalance(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, []);

  // Fetch wallet balance on component mount and set up auto-refresh
  useEffect(() => {
    fetchWalletBalance();
    
    // Auto-refresh wallet balance every 5 minutes
    const walletBalanceInterval = setInterval(fetchWalletBalance, 5 * 60 * 1000);
    
    return () => clearInterval(walletBalanceInterval);
  }, [fetchWalletBalance]);

  // OrderDetails navigation is now handled by router - removed inline rendering

  if (showReturnWindow) {
    return <ReturnOrders onBack={() => setShowReturnWindow(false)} />;
  }

  if (showExchangeWindow) {
    return <ExchangeOrders onBack={() => setShowExchangeWindow(false)} />;
  }

  const filteredOrders = useMemo(() => {
    return helpers.getFilteredOrders();
  }, [helpers]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <div className="flex items-center space-x-4">
              {/* Shiprocket Wallet Balance Widget */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg px-6 py-3 shadow-md min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-800 mb-1">Shiprocket Wallet</div>
                    {walletBalance.loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-base text-green-600 font-medium">Loading...</span>
                      </div>
                    ) : walletBalance.error ? (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-red-600 font-medium">Error loading balance</span>
                        <button
                          onClick={fetchWalletBalance}
                          className="text-xs text-red-500 hover:text-red-700 underline self-start"
                        >
                          Click to retry
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-green-700">
                              ₹{walletBalance.balance !== null && walletBalance.balance !== undefined ? 
                                Number(walletBalance.balance).toLocaleString('en-IN') : '---'}
                            </span>
                            {walletBalance.mock && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                Mock
                              </span>
                            )}
                          </div>
                          
                          {walletBalance.plan && (
                            <div className="text-xs text-blue-600 font-medium">
                              {walletBalance.plan}
                            </div>
                          )}
                          
                          {walletBalance.lastUpdated && (
                            <div className="text-xs text-green-600 mt-1">
                              Last updated: {new Date(walletBalance.lastUpdated).toLocaleTimeString()}
                            </div>
                          )}
                          
                          {walletBalance.mock && walletBalance.note && (
                            <div className="text-xs text-orange-600 mt-1 max-w-[180px]" title={walletBalance.note}>
                              {walletBalance.note.length > 40 ? `${walletBalance.note.substring(0, 40)}...` : walletBalance.note}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={fetchWalletBalance}
                          className="text-sm text-green-600 hover:text-green-800 ml-2 p-1 rounded hover:bg-green-100 transition-colors"
                          title="Refresh wallet balance"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => api.fetchAllOrders()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <StatisticsDashboard 
            statistics={statistics} 
            shiprocketStats={shiprocketStats}
            loading={loading} 
          />

          {/* Enhanced Shiprocket Integration Panel with Real-time Status */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 p-6 rounded-lg mt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg mr-4">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-800 mb-1">
                    🚀 Official Shiprocket Integration
                  </h3>
                  <p className="text-sm text-orange-700">
                    Complete shipping workflow with real-time API integration
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-xs text-orange-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      API Connected
                    </div>
                    <div className="text-xs text-orange-600">
                      Account: YORA APPARELS PVT LTD
                    </div>
                    <div className="text-xs text-orange-600">
                      Email: contact@yoraa.in
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Wallet balance displayed in header
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/pickup-locations`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
                        }
                      });
                      const result = await response.json();
                      if (result.success) {
                        const locations = result.pickup_locations.map((loc, i) => 
                          `${i + 1}. ${loc.pickup_location}\n   📍 ${loc.address}, ${loc.city}, ${loc.pin_code}\n   📞 ${loc.phone}\n`
                        ).join('\n');
                        alert(`📍 Available Pickup Locations:\n\n${locations}`);
                      } else {
                        throw new Error(result.message);
                      }
                    } catch (error) {
                      alert('❌ Failed to fetch pickup locations:\n' + error.message);
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Pickup Locations</span>
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/shiprocket/test-connection`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
                        }
                      });
                      const result = await response.json();
                      if (result.success) {
                        alert(`✅ Shiprocket Connection Test Successful!\n\n` +
                              `Response Time: ${result.data.response_time}ms\n` +
                              `API Status: ${result.data.api_status}\n` +
                              `Authentication: ${result.data.auth_status}\n` +
                              `Account Status: ${result.data.account_status}`);
                      } else {
                        throw new Error(result.message);
                      }
                    } catch (error) {
                      alert('❌ Connection test failed:\n' + error.message);
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Shield className="h-4 w-4" />
                  <span>Test Connection</span>
                </button>
                <button
                  onClick={() => {
                    const shiprocketDocs = 'https://apidocs.shiprocket.in/';
                    window.open(shiprocketDocs, '_blank');
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>API Docs</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-gray-800">Order Acceptance</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Official Shiprocket workflow for accepting and processing orders
                </p>
                <div className="text-xs text-gray-500">
                  • Accept orders with complete validation<br/>
                  • Automatic inventory sync<br/>
                  • Customer notification system
                </div>
              </div>
              
              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Truck className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-gray-800">AWB Assignment</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Automated AWB generation with courier selection
                </p>
                <div className="text-xs text-gray-500">
                  • Smart courier selection<br/>
                  • Real-time rate comparison<br/>
                  • Automatic AWB generation
                </div>
              </div>
              
              <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-medium text-gray-800">Admin Controls</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Complete admin control over shipping process
                </p>
                <div className="text-xs text-gray-500">
                  • Bulk shipping operations<br/>
                  • Real-time tracking updates<br/>
                  • Advanced order management
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Workflow Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg mt-6">
            <div className="flex items-start">
              <Zap className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  🚀 Shipping Workflow Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-blue-700">
                  <div className="bg-white bg-opacity-50 p-2 rounded">
                    <div className="font-medium mb-1">1. Accept Order</div>
                    <div>Review and accept pending orders</div>
                  </div>
                  <div className="bg-white bg-opacity-50 p-2 rounded">
                    <div className="font-medium mb-1">2. Create Shipment</div>
                    <div>Generate shipment in Shiprocket</div>
                  </div>
                  <div className="bg-white bg-opacity-50 p-2 rounded">
                    <div className="font-medium mb-1">3. Generate AWB</div>
                    <div>Get tracking number & courier</div>
                  </div>
                  <div className="bg-white bg-opacity-50 p-2 rounded">
                    <div className="font-medium mb-1">4. Print & Ship</div>
                    <div>Print label & schedule pickup</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Shipping Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    📊 Current Shipping Status
                  </h3>
                  <div className="text-xs text-green-700 mt-1">
                    {orders.filter(o => o.order_status === 'accepted' && !o.shiprocket_shipment_id).length} ready to ship • 
                    {orders.filter(o => o.shiprocket_shipment_id && !o.awb_code).length} need AWB • 
                    {orders.filter(o => o.awb_code).length} ready to print • 
                    {orders.filter(o => o.order_status === 'shipped').length} in transit
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-green-600">
                <div>Last updated: {new Date().toLocaleTimeString()}</div>
                <div>Auto-refresh: 30s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Filters</h2>
            {selectedOrders.length > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Bulk Actions ({selectedOrders.length})</span>
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button
              onClick={() => handleFiltersChange({ 
                status: 'accepted', 
                shippingStatus: '', 
                shiprocketFilter: 'ready-to-ship' 
              })}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
            >
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Ready to Ship</span>
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                {orders.filter(o => o.order_status === 'accepted' && !o.shiprocket_shipment_id).length}
              </span>
            </button>

            <button
              onClick={() => handleFiltersChange({ 
                shiprocketFilter: 'shipment-created' 
              })}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Need AWB</span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                {orders.filter(o => o.shiprocket_shipment_id && !o.awb_code).length}
              </span>
            </button>

            <button
              onClick={() => handleFiltersChange({ 
                shiprocketFilter: 'awb-generated' 
              })}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready to Print</span>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                {orders.filter(o => o.awb_code).length}
              </span>
            </button>

            <button
              onClick={() => handleFiltersChange({ 
                status: 'shipped' 
              })}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <Truck className="h-4 w-4" />
              <span className="text-sm font-medium">In Transit</span>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                {orders.filter(o => o.order_status === 'shipped').length}
              </span>
            </button>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFiltersChange({ status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Status</label>
              <select
                value={filters.shippingStatus}
                onChange={(e) => handleFiltersChange({ shippingStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Shipping Status</option>
                {shippingStatusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shiprocket Status</label>
              <select
                value={filters.shiprocketFilter || ''}
                onChange={(e) => handleFiltersChange({ shiprocketFilter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Shiprocket Status</option>
                <option value="ready-to-ship">Ready to Ship</option>
                <option value="shipment-created">Shipment Created</option>
                <option value="awb-generated">AWB Generated</option>
                <option value="auto-assigned">Auto Assigned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Status</label>
              <select
                value={filters.vendorAssigned}
                onChange={(e) => handleFiltersChange({ vendorAssigned: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Vendors</option>
                <option value="true">Assigned</option>
                <option value="false">Not Assigned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFiltersChange({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedOrders.length} orders selected
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const readyOrders = selectedOrders.filter(id => {
                          const order = orders.find(o => o._id === id);
                          return order && order.order_status === 'accepted' && !order.shiprocket_shipment_id;
                        });
                        if (readyOrders.length > 0) {
                          Promise.all(readyOrders.map(id => handleCreateShipment(id)));
                        } else {
                          alert('No orders ready for shipment creation in selection');
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <Package className="h-3 w-3" />
                      <span>Bulk Create Shipments</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const awbReadyOrders = selectedOrders.filter(id => {
                          const order = orders.find(o => o._id === id);
                          return order && order.shiprocket_shipment_id && !order.awb_code;
                        });
                        if (awbReadyOrders.length > 0) {
                          Promise.all(awbReadyOrders.map(id => handleGenerateAWB(id)));
                        } else {
                          alert('No orders ready for AWB generation in selection');
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Bulk Generate AWB</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const printReadyOrders = selectedOrders.filter(id => {
                          const order = orders.find(o => o._id === id);
                          return order && order.awb_code;
                        });
                        if (printReadyOrders.length > 0) {
                          printReadyOrders.forEach(id => handlePrintLabel(id));
                        } else {
                          alert('No orders ready for label printing in selection');
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Bulk Print Labels</span>
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => actions.deselectAllOrders()}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>

            <div className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Quick Shiprocket Actions
              </h3>
              <div className="text-xs text-gray-500">
                Bulk operations for efficient shipping management
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={async () => {
                  const readyToShip = orders.filter(o => 
                    o.order_status === 'accepted' && !o.shiprocket_shipment_id);
                  if (readyToShip.length === 0) return alert('No orders ready for shipment creation');
                  
                  if (confirm(`Create shipments for ${readyToShip.length} orders?`)) {
                    try {
                      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/admin/orders/bulk-create-shipments`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          orderIds: readyToShip.map(o => o._id).slice(0, 10) // Limit to 10 at a time
                        })
                      });
                      const result = await response.json();
                      if (result.success) {
                        alert(`✅ Bulk shipment creation completed!\nSuccessful: ${result.results.successful.length}\nFailed: ${result.results.failed.length}`);
                        api.fetchAllOrders();
                      }
                    } catch (error) {
                      alert('❌ Bulk operation failed: ' + error.message);
                    }
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Package className="h-4 w-4" />
                <span>Bulk Create Shipments</span>
                <span className="bg-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {orders.filter(o => o.order_status === 'accepted' && !o.shiprocket_shipment_id).length}
                </span>
              </button>
              
              <button
                onClick={async () => {
                  const needAwb = orders.filter(o => o.shiprocket_shipment_id && !o.awb_code);
                  if (needAwb.length === 0) return alert('No orders ready for AWB generation');
                  
                  if (confirm(`Generate AWB for ${needAwb.length} orders?`)) {
                    let successful = 0;
                    for (const order of needAwb.slice(0, 5)) { // Limit to 5 at a time
                      try {
                        await handleGenerateAWB(order._id);
                        successful++;
                      } catch (error) {
                        console.error('Failed to generate AWB for', order._id);
                      }
                    }
                    alert(`✅ Generated AWB for ${successful} orders`);
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Bulk Generate AWB</span>
                <span className="bg-green-800 text-xs px-2 py-0.5 rounded-full">
                  {orders.filter(o => o.shiprocket_shipment_id && !o.awb_code).length}
                </span>
              </button>
              
              <button
                onClick={() => {
                  const shipped = orders.filter(o => o.order_status === 'shipped');
                  shipped.forEach(order => handleTrackShipment(order._id));
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                <Navigation className="h-4 w-4" />
                <span>Bulk Track</span>
                <span className="bg-purple-800 text-xs px-2 py-0.5 rounded-full">
                  {orders.filter(o => o.order_status === 'shipped').length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          actions.selectAllOrders();
                        } else {
                          actions.deselectAllOrders();
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipping
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shiprocket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading.orders ? (
                  // Loading skeleton
                  Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-4"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">No orders found</h3>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <OrderRow
                      key={order._id}
                      order={order}
                      isSelected={helpers.isOrderSelected(order._id)}
                      onSelect={actions.toggleOrderSelection}
                      onViewDetails={handleViewDetails}
                      onUpdateStatus={handleUpdateStatus}
                      onAccept={handleAcceptOrder}
                      onReject={handleRejectOrder}
                      onAllotVendor={handleAllotVendor}
                      onCreateShiprocketOrder={handleCreateShiprocketOrder}
                      onCreateShipment={handleCreateShipment}
                      onTrackShipment={handleTrackShipment}
                      onGenerateAWB={handleGenerateAWB}
                      onPrintLabel={handlePrintLabel}
                      onCancelOrder={handleCancelOrder}
                      onSelectCourier={handleSelectCourier}
                      onSchedulePickup={handleSchedulePickup}
                      onRefreshTracking={handleRefreshTracking}
                      vendors={vendors}
                      statusOptions={statusOptions}
                      getStatusColor={helpers.getStatusColor}
                      getCourierStatusColor={helpers.getCourierStatusColor}
                      formatDate={helpers.formatDate}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => actions.updatePagination({ currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => actions.updatePagination({ currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => actions.updatePagination({ currentPage: page })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Real-time Status Indicator */}
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-white rounded-lg shadow-lg border p-3 min-w-64">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-800">Shiprocket Live</span>
              </div>
              <button
                onClick={() => api.fetchAllOrders()}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Active Shipments:</span>
                <span className="font-medium text-blue-600">
                  {orders.filter(o => o.shiprocket_shipment_id && !['delivered', 'cancelled'].includes(o.order_status?.toLowerCase())).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ready to Ship:</span>
                <span className="font-medium text-yellow-600">
                  {orders.filter(o => o.order_status === 'accepted' && !o.shiprocket_shipment_id).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Need AWB:</span>
                <span className="font-medium text-orange-600">
                  {orders.filter(o => o.shiprocket_shipment_id && !o.awb_code).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>In Transit:</span>
                <span className="font-medium text-green-600">
                  {orders.filter(o => o.shipping_status === 'In Transit' || (o.awb_code && o.order_status === 'shipped')).length}
                </span>
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="text-xs text-gray-500">
                Last update: {new Date().toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500">
                Auto-refresh: 30s
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button for Quick Shipping Actions */}
        <div className="fixed bottom-6 right-6 z-30">
          <div className="relative">
            {/* Main FAB */}
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            >
              <Send className="h-6 w-6" />
            </button>
            
            {/* Quick Actions Menu */}
            {showBulkActions && (
              <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border p-2 w-64">
                <div className="text-xs font-medium text-gray-500 px-2 py-1 border-b mb-2">
                  Quick Shipping Actions
                </div>
                
                <button
                  onClick={() => {
                    const readyToShip = orders.filter(o => o.order_status === 'accepted' && !o.shiprocket_shipment_id);
                    if (readyToShip.length > 0) {
                      if(confirm(`Create shipments for ${readyToShip.length} ready orders?`)) {
                        Promise.all(readyToShip.map(order => handleCreateShipment(order._id)));
                      }
                    } else {
                      alert('No orders ready for shipment creation');
                    }
                    setShowBulkActions(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 rounded-md"
                >
                  <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Create All Shipments</div>
                    <div className="text-xs text-gray-500">
                      {orders.filter(o => o.order_status === 'accepted' && !o.shiprocket_shipment_id).length} ready
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const needAwb = orders.filter(o => o.shiprocket_shipment_id && !o.awb_code);
                    if (needAwb.length > 0) {
                      if(confirm(`Generate AWB for ${needAwb.length} shipments?`)) {
                        Promise.all(needAwb.map(order => handleGenerateAWB(order._id)));
                      }
                    } else {
                      alert('No shipments need AWB generation');
                    }
                    setShowBulkActions(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-md"
                >
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Generate All AWBs</div>
                    <div className="text-xs text-gray-500">
                      {orders.filter(o => o.shiprocket_shipment_id && !o.awb_code).length} pending
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const canPrint = orders.filter(o => o.awb_code);
                    if (canPrint.length > 0) {
                      if(confirm(`Print labels for ${canPrint.length} orders?`)) {
                        canPrint.forEach(order => handlePrintLabel(order._id));
                      }
                    } else {
                      alert('No orders ready for label printing');
                    }
                    setShowBulkActions(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md"
                >
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Print All Labels</div>
                    <div className="text-xs text-gray-500">
                      {orders.filter(o => o.awb_code).length} ready
                    </div>
                  </div>
                </button>
                
                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={() => {
                      api.fetchAllOrders();
                      setShowBulkActions(false);
                    }}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh All Orders</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Courier Selection Modal */}
      <CourierSelectionModal
        isOpen={courierModal.isOpen}
        onClose={() => setCourierModal({
          isOpen: false,
          orderId: null,
          couriers: [],
          loading: false
        })}
        couriers={courierModal.couriers}
        orderId={courierModal.orderId}
        onSelectCourier={handleAssignCourier}
        loading={courierModal.loading}
      />

      {/* Shiprocket Order Creation Modal */}
      <ShiprocketOrderCreationModal
        isOpen={createOrderModal.isOpen}
        onClose={() => setCreateOrderModal({
          isOpen: false,
          orderId: null,
          orderData: null,
          loading: false,
          pickupLocations: []
        })}
        orderId={createOrderModal.orderId}
        orderData={createOrderModal.orderData}
        loading={createOrderModal.loading}
        onCreateOrder={handleProcessCreateOrder}
      />

      {/* Inline Order Details Modal */}
      <InlineOrderDetails
        isOpen={viewingOrderDetails.isOpen}
        onClose={() => setViewingOrderDetails({
          isOpen: false,
          orderId: null,
          orderData: null
        })}
        orderId={viewingOrderDetails.orderId}
        orderDetails={selectedOrderDetails}
        loading={orderDetailsLoading}
        error={orderDetailsError}
      />
    </div>
  );
};

export default Orders;
