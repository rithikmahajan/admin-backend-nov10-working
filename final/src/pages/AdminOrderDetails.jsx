import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Printer,
  Download,
  ExternalLink,
  Navigation,
  RefreshCw,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Eye,
  Copy,
  Share2,
  Star,
  MessageSquare,
  Shield,
  Zap
} from "lucide-react";
import { fetchOrderDetails } from "../store/slices/orderManagementSlice";

/**
 * Enhanced Admin Order Details Component with Full Shiprocket Integration
 */
const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { orderDetails, loading, error } = useSelector(state => state.orderManagement);
  
  // Local state
  const [activeTab, setActiveTab] = useState("overview");
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loadingShipment, setLoadingShipment] = useState(false);
  const [shiprocketLoading, setShiprocketLoading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Fetch order details on mount
  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetails(orderId));
    }
  }, [orderId, dispatch]);

  // Auto-refresh tracking data
  useEffect(() => {
    if (orderDetails?.awb_code) {
      fetchTrackingData();
    }
  }, [orderDetails?.awb_code]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/tracking`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    }
  };

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

  const handleTrackShipment = () => {
    if (orderDetails?.tracking_url) {
      window.open(orderDetails.tracking_url, "_blank");
    } else {
      alert("Tracking URL not available");
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus, 
          note: `Status updated to ${newStatus} by admin`
        })
      });
      
      if (response.ok) {
        setEditingStatus(false);
        dispatch(fetchOrderDetails(orderId));
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800", 
      processing: "bg-indigo-100 text-indigo-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getShippingStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600",
      awb_generated: "text-blue-600",
      shipped: "text-purple-600", 
      in_transit: "text-indigo-600",
      delivered: "text-green-600",
      cancelled: "text-red-600"
    };
    return colors[status] || "text-gray-600";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const order = orderDetails;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/orders")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order._id?.slice(-8) || order.razorpay_order_id?.slice(-8)}
              </h1>
              <p className="text-gray-600">Created on {formatDate(order.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => dispatch(fetchOrderDetails(orderId))}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            
            {/* Quick Actions */}
            {!order.shiprocket_shipment_id && order.order_status === 'accepted' && (
              <button
                onClick={handleCreateShipment}
                disabled={shiprocketLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Package className="h-4 w-4" />
                <span>{shiprocketLoading ? 'Creating...' : 'Create Shipment'}</span>
              </button>
            )}
            
            {order.shiprocket_shipment_id && !order.awb_code && (
              <button
                onClick={handleGenerateAWB}
                disabled={shiprocketLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                <span>{shiprocketLoading ? 'Generating...' : 'Generate AWB'}</span>
              </button>
            )}
            
            {order.awb_code && (
              <>
                <button
                  onClick={handleTrackShipment}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Track</span>
                </button>
                
                <button
                  onClick={handlePrintLabel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Label</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Order Status</h3>
              <button
                onClick={() => {
                  setEditingStatus(true);
                  setNewStatus(order.order_status);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            {editingStatus ? (
              <div className="flex items-center space-x-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={handleUpdateStatus} className="text-green-600 hover:text-green-800">
                  <Save className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingStatus(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                {order.order_status?.charAt(0).toUpperCase() + order.order_status?.slice(1) || 'Pending'}
              </span>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
            <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
              order.payment_status === 'captured' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {order.payment_status === 'captured' ? 'Paid' : 'Pending'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Status</h3>
            <div className={`font-medium ${getShippingStatusColor(order.shipping_status)}`}>
              {order.shipping_status?.replace('_', ' ').toUpperCase() || 'PENDING'}
            </div>
            {order.courier_name && (
              <p className="text-xs text-gray-500 mt-1">via {order.courier_name}</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
            <p className="text-2xl font-bold text-gray-900">
              ₹{(order.total_amount || order.totalAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: Eye },
                { id: "shipping", label: "Shipping & Tracking", icon: Truck },
                { id: "customer", label: "Customer Details", icon: User },
                { id: "timeline", label: "Order Timeline", icon: Clock },
                { id: "notes", label: "Notes & Comments", icon: MessageSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {order.cart?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        {item.itemId?.image && (
                          <img
                            src={item.itemId.image}
                            alt={item.itemId.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.itemId?.name || 'Product'}</h4>
                          <p className="text-sm text-gray-600">
                            Size: {item.selectedSize} | Color: {item.selectedColor}
                          </p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{item.price?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">₹{item.itemId?.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{(order.subtotal || 0).toLocaleString()}</span>
                      </div>
                      {order.shipping_cost && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">₹{order.shipping_cost.toLocaleString()}</span>
                        </div>
                      )}
                      {order.discount_amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-green-600">-₹{order.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {order.tax_amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">₹{order.tax_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span>₹{(order.total_amount || order.totalAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{order.payment_method || 'Online'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Razorpay Order ID:</span>
                        <span className="font-mono text-sm">{order.razorpay_order_id}</span>
                      </div>
                      {order.razorpay_payment_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment ID:</span>
                          <span className="font-mono text-sm">{order.razorpay_payment_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className={`font-medium ${
                          order.payment_status === 'captured' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {order.payment_status === 'captured' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === "shipping" && (
              <div className="space-y-6">
                {/* Shiprocket Information */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-purple-600" />
                    Shiprocket Integration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Shipment Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipment ID:</span>
                          <span className="font-mono">{order.shiprocket_shipment_id || 'Not Created'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AWB Code:</span>
                          <span className="font-mono">{order.awb_code || 'Not Generated'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Courier:</span>
                          <span>{order.courier_name || 'Not Assigned'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected Delivery:</span>
                          <span>{order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'TBD'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tracking Information</h4>
                      {order.tracking_url ? (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Track Package</span>
                        </a>
                      ) : (
                        <p className="text-gray-500">Tracking not available</p>
                      )}
                      
                      {trackingData && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h5 className="font-medium mb-2">Latest Status</h5>
                          <p className="text-sm text-gray-600">{trackingData.current_status}</p>
                          <p className="text-xs text-gray-500">{formatDate(trackingData.last_updated)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{order.address?.name}</p>
                        <p className="text-gray-600">{order.address?.address}</p>
                        <p className="text-gray-600">{order.address?.city}, {order.address?.state} {order.address?.pincode}</p>
                        <p className="text-gray-600">{order.address?.country}</p>
                        {order.address?.phone && (
                          <p className="text-gray-600 mt-2">📞 {order.address.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Timeline */}
                {order.delivery_timeline && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Timeline</h3>
                    <div className="space-y-4">
                      {order.delivery_timeline.map((event, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-white border-l-4 border-blue-500">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{event.status}</p>
                            <p className="text-sm text-gray-600">{event.location}</p>
                            <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Tab */}
            {activeTab === "customer" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-gray-900">
                          {order.user?.displayName || `${order.user?.firstName} ${order.user?.lastName}` || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {order.user?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {order.user?.phoneNumber || order.address?.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer ID</label>
                        <p className="text-gray-900 font-mono text-sm">{order.user?._id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="font-medium">{order.user?.totalOrders || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="font-medium">₹{(order.user?.totalSpent || order.total_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="font-medium">{order.user?.createdAt ? formatDate(order.user.createdAt) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Timeline</h3>
                <div className="space-y-4">
                  {/* Order Events */}
                  {[
                    { event: 'Order Placed', date: order.created_at, status: 'completed' },
                    { event: 'Payment Confirmed', date: order.payment_date, status: order.payment_status === 'captured' ? 'completed' : 'pending' },
                    { event: 'Order Accepted', date: order.accepted_at, status: order.order_status === 'accepted' ? 'completed' : 'pending' },
                    { event: 'Shipment Created', date: order.shipment_created_at, status: order.shiprocket_shipment_id ? 'completed' : 'pending' },
                    { event: 'AWB Generated', date: order.awb_generated_at, status: order.awb_code ? 'completed' : 'pending' },
                    { event: 'Shipped', date: order.shipped_at, status: order.order_status === 'shipped' ? 'completed' : 'pending' },
                    { event: 'Delivered', date: order.delivered_at, status: order.order_status === 'delivered' ? 'completed' : 'pending' }
                  ].map((item, index) => (
                    <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg ${
                      item.status === 'completed' ? 'bg-green-50 border-l-4 border-green-500' : 
                      item.status === 'pending' && item.date ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                      'bg-gray-50 border-l-4 border-gray-300'
                    }`}>
                      <div className="flex-shrink-0">
                        {item.status === 'completed' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : item.status === 'pending' && item.date ? (
                          <Clock className="h-6 w-6 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.event}</p>
                        {item.date && (
                          <p className="text-sm text-gray-600">{formatDate(item.date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notes & Comments</h3>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Note</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {order.notes?.length > 0 ? (
                    order.notes.map((note, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{note.author || 'Admin'}</span>
                          <span className="text-sm text-gray-500">{formatDate(note.date)}</span>
                        </div>
                        <p className="text-gray-700">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                      <p className="text-gray-600">Add notes to keep track of important information about this order.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows="4"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNewNote("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add note logic here
                  setShowNotesModal(false);
                  setNewNote("");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetails;
