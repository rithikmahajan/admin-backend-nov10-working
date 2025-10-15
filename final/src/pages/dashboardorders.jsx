import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Filter,
  Download,
  ShoppingCart,
  ChevronDown,
  Eye,
  Edit2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Share,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { DateRangePicker, calculateDateRange, formatDateRange } from "./dashboardview";

// Import Redux actions and selectors
import {
  fetchAllOrders,
  fetchOrderStatistics,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  allotVendor,
  updateCourierStatus,
  clearErrors,
  selectOrders,
  selectOrderStatistics,
  selectOrderLoading,
  selectOrderErrors,
  selectOrderFilters,
  selectOrderSorting,
} from "../store/slices/orderManagementSlice";

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Order Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Something went wrong</h3>
          </div>
          <p className="text-red-700 text-sm mb-4">
            There was an error loading the order dashboard. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock orders data generator
const generateMockOrders = () => [
  {
    id: "ORD-001",
    orderNumber: "#YRA2024001",
    customerName: "John Smith",
    customerEmail: "john.smith@gmail.com",
    customerPhone: "+1234567890",
    orderDate: "2024-11-27",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    totalAmount: 2450.50,
    shippingAddress: "123 Main St, New York, NY 10001",
    items: [
      { name: "Premium T-Shirt", quantity: 2, price: 899.00 },
      { name: "Denim Jeans", quantity: 1, price: 1551.50 },
    ],
    trackingNumber: "TRK123456789",
    estimatedDelivery: "2024-11-30",
    actualDelivery: "2024-11-29",
  },
  {
    id: "ORD-002",
    orderNumber: "#YRA2024002",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@outlook.com",
    customerPhone: "+1234567891",
    orderDate: "2024-11-26",
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "paypal",
    totalAmount: 1875.25,
    shippingAddress: "456 Oak Ave, California, CA 90210",
    items: [
      { name: "Casual Sneakers", quantity: 1, price: 1875.25 },
    ],
    trackingNumber: "TRK123456790",
    estimatedDelivery: "2024-11-30",
    actualDelivery: null,
  },
  {
    id: "ORD-003",
    orderNumber: "#YRA2024003",
    customerName: "Mike Wilson",
    customerEmail: "mike.wilson@yahoo.com",
    customerPhone: "+1234567892",
    orderDate: "2024-11-25",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "upi",
    totalAmount: 3250.75,
    shippingAddress: "789 Pine Rd, Texas, TX 75001",
    items: [
      { name: "Winter Jacket", quantity: 1, price: 2500.00 },
      { name: "Wool Scarf", quantity: 1, price: 750.75 },
    ],
    trackingNumber: null,
    estimatedDelivery: "2024-12-02",
    actualDelivery: null,
  },
  {
    id: "ORD-004",
    orderNumber: "#YRA2024004",
    customerName: "Emily Davis",
    customerEmail: "emily.davis@gmail.com",
    customerPhone: "+1234567893",
    orderDate: "2024-11-24",
    status: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "credit_card",
    totalAmount: 1200.00,
    shippingAddress: "321 Elm St, Florida, FL 33101",
    items: [
      { name: "Summer Dress", quantity: 2, price: 600.00 },
    ],
    trackingNumber: null,
    estimatedDelivery: null,
    actualDelivery: null,
  },
  {
    id: "ORD-005",
    orderNumber: "#YRA2024005",
    customerName: "David Brown",
    customerEmail: "david.brown@hotmail.com",
    customerPhone: "+1234567894",
    orderDate: "2024-11-23",
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "cod",
    totalAmount: 899.99,
    shippingAddress: "654 Maple Dr, Illinois, IL 60601",
    items: [
      { name: "Cotton Shirt", quantity: 1, price: 899.99 },
    ],
    trackingNumber: null,
    estimatedDelivery: "2024-11-30",
    actualDelivery: null,
  },
  {
    id: "ORD-006",
    orderNumber: "#YRA2024006",
    customerName: "Lisa Anderson",
    customerEmail: "lisa.anderson@gmail.com",
    customerPhone: "+1234567895",
    orderDate: "2024-11-22",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "debit_card",
    totalAmount: 4250.80,
    shippingAddress: "987 Cedar Ln, Washington, WA 98101",
    items: [
      { name: "Designer Handbag", quantity: 1, price: 3500.00 },
      { name: "Leather Belt", quantity: 1, price: 750.80 },
    ],
    trackingNumber: "TRK123456791",
    estimatedDelivery: "2024-11-28",
    actualDelivery: "2024-11-27",
  },
  {
    id: "ORD-007",
    orderNumber: "#YRA2024007",
    customerName: "James Miller",
    customerEmail: "james.miller@yahoo.com",
    customerPhone: "+1234567896",
    orderDate: "2024-11-21",
    status: "returned",
    paymentStatus: "refunded",
    paymentMethod: "credit_card",
    totalAmount: 1675.40,
    shippingAddress: "147 Birch St, Oregon, OR 97201",
    items: [
      { name: "Sports Shoes", quantity: 1, price: 1675.40 },
    ],
    trackingNumber: "TRK123456792",
    estimatedDelivery: "2024-11-26",
    actualDelivery: "2024-11-25",
  },
  {
    id: "ORD-008",
    orderNumber: "#YRA2024008",
    customerName: "Jennifer Taylor",
    customerEmail: "jennifer.taylor@outlook.com",
    customerPhone: "+1234567897",
    orderDate: "2024-11-20",
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "net_banking",
    totalAmount: 2100.60,
    shippingAddress: "258 Spruce Ave, Nevada, NV 89101",
    items: [
      { name: "Formal Blazer", quantity: 1, price: 2100.60 },
    ],
    trackingNumber: "TRK123456793",
    estimatedDelivery: "2024-11-29",
    actualDelivery: null,
  },
];

// Enhanced Redux-based Order management hooks
const useOrderData = () => {
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);
  const orderStatistics = useSelector(selectOrderStatistics);
  const loading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderErrors);
  const orderFilter = useSelector(selectOrderFilters);
  const orderSort = useSelector(selectOrderSorting);

  // Fallback mock data in case API fails
  const mockFallbackOrders = useMemo(() => generateMockOrders(), []);

  // Debug logging
  useEffect(() => {
    console.log('Redux Orders State:', orders);
    console.log('Is Array:', Array.isArray(orders));
    console.log('Orders Type:', typeof orders);
  }, [orders]);

  // Fetch orders on mount and set up real-time updates
  useEffect(() => {
    const fetchOrders = () => {
      dispatch(fetchAllOrders({ 
        page: 1, 
        limit: 100,
        ...orderFilter 
      }));
      dispatch(fetchOrderStatistics());
    };

    fetchOrders();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch, orderFilter]);

  const refreshOrders = useCallback(async () => {
    await dispatch(fetchAllOrders({ 
      page: 1, 
      limit: 100,
      ...orderFilter 
    }));
    await dispatch(fetchOrderStatistics());
  }, [dispatch, orderFilter]);

  const handleUpdateOrderStatus = useCallback(async (orderId, newStatus, notes = '') => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus, notes })).unwrap();
      // Refresh orders to get updated data
      dispatch(fetchAllOrders({ page: 1, limit: 100, ...orderFilter }));
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }, [dispatch, orderFilter]);

  const handleAcceptOrder = useCallback(async (orderId, notes = '') => {
    try {
      await dispatch(acceptOrder({ orderId, notes })).unwrap();
      dispatch(fetchAllOrders({ page: 1, limit: 100, ...orderFilter }));
    } catch (error) {
      console.error('Failed to accept order:', error);
      throw error;
    }
  }, [dispatch, orderFilter]);

  const handleRejectOrder = useCallback(async (orderId, reason, notes = '') => {
    try {
      await dispatch(rejectOrder({ orderId, reason, notes })).unwrap();
      dispatch(fetchAllOrders({ page: 1, limit: 100, ...orderFilter }));
    } catch (error) {
      console.error('Failed to reject order:', error);
      throw error;
    }
  }, [dispatch, orderFilter]);

  const handleAllotVendor = useCallback(async (orderId, vendorId, notes = '') => {
    try {
      await dispatch(allotVendor({ orderId, vendorId, notes })).unwrap();
      dispatch(fetchAllOrders({ page: 1, limit: 100, ...orderFilter }));
    } catch (error) {
      console.error('Failed to allot vendor:', error);
      throw error;
    }
  }, [dispatch, orderFilter]);

  const handleUpdateCourierStatus = useCallback(async (orderId, courierStatus, trackingId) => {
    try {
      await dispatch(updateCourierStatus({ orderId, courierStatus, trackingId })).unwrap();
      dispatch(fetchAllOrders({ page: 1, limit: 100, ...orderFilter }));
    } catch (error) {
      console.error('Failed to update courier status:', error);
      throw error;
    }
  }, [dispatch, orderFilter]);

  // Legacy compatibility - keeping original function names
  const updatePaymentStatus = useCallback(async (orderId, newPaymentStatus) => {
    // This would need to be implemented in the backend if payment status updates are needed
    console.warn('Payment status update not implemented in Redux slice');
  }, []);

  // Ensure we always return a valid array
  const safeOrders = useMemo(() => {
    if (Array.isArray(orders)) {
      return orders;
    }
    if (orders && Array.isArray(orders.data)) {
      return orders.data;
    }
    if (error && mockFallbackOrders) {
      return mockFallbackOrders;
    }
    return [];
  }, [orders, error, mockFallbackOrders]);

  return {
    orders: safeOrders,
    orderStatistics,
    loading,
    error,
    refreshOrders,
    updateOrderStatus: handleUpdateOrderStatus,
    updatePaymentStatus,
    acceptOrder: handleAcceptOrder,
    rejectOrder: handleRejectOrder,
    allotVendor: handleAllotVendor,
    updateCourierStatus: handleUpdateCourierStatus,
    orderFilter,
    orderSort,
  };
};

// Order Statistics Component
const OrderStats = memo(({ orders, dateRange, orderStatistics }) => {
  const stats = useMemo(() => {
    // Use Redux statistics if available, otherwise calculate from local orders
    if (orderStatistics) {
      return {
        totalOrders: orderStatistics.totalOrders || 0,
        totalRevenue: orderStatistics.totalRevenue || 0,
        pendingOrders: orderStatistics.pendingCount || 0,
        deliveredOrders: orderStatistics.deliveredCount || 0,
        processingOrders: orderStatistics.processingCount || 0,
        shippedOrders: orderStatistics.shippedCount || 0,
        cancelledOrders: orderStatistics.cancelledCount || 0,
      };
    }
    
    // Fallback to local calculation
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
    const processingOrders = orders.filter((order) => order.status === "processing").length;
    const shippedOrders = orders.filter((order) => order.status === "shipped").length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      processingOrders,
      shippedOrders,
    };
  }, [orders, orderStatistics]);

  // Create display array from stats
  const statsDisplay = useMemo(() => [
    {
      title: "Total Orders",
      value: stats.totalOrders?.toLocaleString() || '0',
      icon: ShoppingCart,
      change: "+15.2%",
      trending: "up",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: "+12.8%",
      trending: "up",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Orders",
      value: (stats.pendingOrders || 0).toLocaleString(),
      icon: Clock,
      change: "-3.1%",
      trending: "down",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      title: "Delivered Orders",
      value: (stats.deliveredOrders || 0).toLocaleString(),
      icon: CheckCircle,
      change: "+8.5%",
      trending: "up",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ], [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statsDisplay.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-1 ${
                stat.trending === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {stat.trending === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{stat.change}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

OrderStats.displayName = "OrderStats";

// Order Table Component
const OrderTable = memo(({ orders, onUpdateStatus, onUpdatePaymentStatus, onViewOrder, onEditOrder }) => {
  const [actionDropdown, setActionDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActionDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-800", label: "Processing", icon: Package },
      shipped: { bg: "bg-purple-100", text: "text-purple-800", label: "Shipped", icon: Truck },
      delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled", icon: XCircle },
      returned: { bg: "bg-gray-100", text: "text-gray-800", label: "Returned", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        <config.icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      paid: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
      failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
      refunded: { bg: "bg-gray-100", text: "text-gray-800", label: "Refunded" },
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      credit_card: "Credit Card",
      debit_card: "Debit Card",
      paypal: "PayPal",
      upi: "UPI",
      cod: "Cash on Delivery",
      net_banking: "Net Banking",
    };
    return methods[method] || method;
  };

  const handleActionClick = (orderId, action) => {
    setActionDropdown(null);
    const order = orders.find((o) => o.id === orderId);
    
    switch (action) {
      case "view":
        onViewOrder(orderId);
        break;
      case "edit":
        onEditOrder(orderId);
        break;
      case "ship":
        onUpdateStatus(orderId, "shipped");
        break;
      case "deliver":
        onUpdateStatus(orderId, "delivered");
        break;
      case "cancel":
        if (window.confirm("Are you sure you want to cancel this order?")) {
          onUpdateStatus(orderId, "cancelled");
          onUpdatePaymentStatus(orderId, "refunded");
        }
        break;
      case "markPaid":
        onUpdatePaymentStatus(orderId, "paid");
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                    {order.trackingNumber && (
                      <div className="text-sm text-gray-500">
                        {order.trackingNumber}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {order.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    {getPaymentStatusBadge(order.paymentStatus)}
                    <div className="text-xs text-gray-500 mt-1">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ₹{order.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setActionDropdown(
                          actionDropdown === order.id ? null : order.id
                        )
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    {actionDropdown === order.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                        <div className="p-1">
                          <button
                            onClick={() => handleActionClick(order.id, "view")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleActionClick(order.id, "edit")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          {(order.status === "pending" || order.status === "processing") && (
                            <button
                              onClick={() => handleActionClick(order.id, "ship")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-blue-700 hover:bg-blue-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Truck className="h-4 w-4" />
                              <span>Mark as Shipped</span>
                            </button>
                          )}
                          {order.status === "shipped" && (
                            <button
                              onClick={() => handleActionClick(order.id, "deliver")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-green-700 hover:bg-green-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Mark as Delivered</span>
                            </button>
                          )}
                          {order.paymentStatus === "pending" && (
                            <button
                              onClick={() => handleActionClick(order.id, "markPaid")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-green-700 hover:bg-green-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <DollarSign className="h-4 w-4" />
                              <span>Mark as Paid</span>
                            </button>
                          )}
                          {(order.status === "pending" || order.status === "processing") && (
                            <button
                              onClick={() => handleActionClick(order.id, "cancel")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-red-700 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Cancel Order</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

OrderTable.displayName = "OrderTable";

// Main Dashboard Orders Component
const DashboardOrders = memo(() => {
  const dispatch = useDispatch();
  const [selectedDateRange, setSelectedDateRange] = useState({
    label: "Last 30 Days",
    value: "30days",
    days: 30,
  });
  const [dateRange, setDateRange] = useState("Nov 11, 2025 – Nov 27, 2025");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const exportDropdownRef = useRef(null);

  const { 
    orders, 
    orderStatistics, 
    loading, 
    error, 
    refreshOrders, 
    updateOrderStatus, 
    updatePaymentStatus,
    acceptOrder,
    rejectOrder,
    allotVendor,
    updateCourierStatus
  } = useOrderData();

  // Handle errors
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    }
  }, [error]);

  // Update last updated timestamp
  useEffect(() => {
    if (orders?.length > 0) {
      setLastUpdated(new Date());
    }
  }, [orders]);

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array:', orders);
      return [];
    }
    
    return orders.filter((order) => {
      if (!order) return false;
      
      const matchesSearch =
        (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPaymentStatus = 
        paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateRangeChange = useCallback((rangeOption) => {
    setSelectedDateRange(rangeOption);
    const { startDate, endDate } = calculateDateRange(rangeOption);
    const formattedRange = formatDateRange(startDate, endDate);
    setDateRange(formattedRange);
  }, []);

  const handleViewOrder = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId);
    console.log("View order:", order);
    // Implement order view modal or navigation
  }, [orders]);

  const handleEditOrder = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId);
    console.log("Edit order:", order);
    // Implement order edit modal or navigation
  }, [orders]);

  // Export functions
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Orders Report", 20, 30);

      doc.setFontSize(12);
      doc.text(`Date Range: ${selectedDateRange.label}`, 20, 45);
      doc.text(`Period: ${dateRange}`, 20, 55);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65);

      const tableData = filteredOrders.map((order) => [
        order.orderNumber,
        order.customerName,
        new Date(order.orderDate).toLocaleDateString(),
        order.status,
        order.paymentStatus,
        `₹${order.totalAmount.toFixed(2)}`,
        order.items.length.toString(),
      ]);

      doc.autoTable({
        startY: 75,
        head: [["Order #", "Customer", "Date", "Status", "Payment", "Amount", "Items"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      });

      doc.save(`orders-report-${selectedDateRange.value}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error generating PDF report. Please try again.");
    }
  }, [filteredOrders, selectedDateRange, dateRange]);

  const handleExportExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();

      const ordersWS = XLSX.utils.json_to_sheet(
        filteredOrders.map((order) => ({
          "Order Number": order.orderNumber,
          "Customer Name": order.customerName,
          "Customer Email": order.customerEmail,
          "Customer Phone": order.customerPhone,
          "Order Date": order.orderDate,
          "Status": order.status,
          "Payment Status": order.paymentStatus,
          "Payment Method": order.paymentMethod,
          "Total Amount": order.totalAmount,
          "Shipping Address": order.shippingAddress,
          "Items Count": order.items.length,
          "Tracking Number": order.trackingNumber || "Not assigned",
          "Estimated Delivery": order.estimatedDelivery || "Not available",
          "Actual Delivery": order.actualDelivery || "Not delivered yet",
        }))
      );

      XLSX.utils.book_append_sheet(wb, ordersWS, "Orders");

      const fileName = `orders-report-${selectedDateRange.value}-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error generating Excel report. Please try again.");
    }
  }, [filteredOrders, selectedDateRange]);

  const handleExport = (type) => {
    setExportDropdownOpen(false);
    switch (type) {
      case "pdf":
        handleExportPDF();
        break;
      case "excel":
        handleExportExcel();
        break;
      case "share":
        if (navigator.share) {
          navigator.share({
            title: "Orders Report",
            text: `Orders Report for ${dateRange}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard!");
        }
        break;
      case "print":
        // Add print-specific classes before printing
        document.body.classList.add('printing');
        setTimeout(() => {
          window.print();
          // Remove print classes after printing
          setTimeout(() => {
            document.body.classList.remove('printing');
          }, 100);
        }, 100);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {showErrorAlert && error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg print-hide">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <p className="text-red-800 font-medium">Error loading orders</p>
              <p className="text-red-700 text-sm">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
            </div>
            <button
              onClick={() => {
                setShowErrorAlert(false);
                dispatch(clearErrors());
              }}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
          <span className="text-sm text-gray-600">
            {loading ? 'Syncing...' : 'Live data'}
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Total Orders: <strong>{Array.isArray(orders) ? orders.length : 0}</strong></span>
          {orderStatistics && (
            <>
              <span>Revenue: <strong>₹{(orderStatistics.totalRevenue || 0).toLocaleString()}</strong></span>
              <span>Pending: <strong>{orderStatistics.pendingCount || 0}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Orders Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600 mt-1">
            Track and manage all customer orders
          </p>
        </div>

        <div className="flex items-center space-x-3 print-hide">
          <DateRangePicker
            selectedRange={selectedDateRange}
            onRangeChange={handleDateRangeChange}
            dateRange={dateRange}
          />

          <button
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <div className="relative print-hide" ref={exportDropdownRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  exportDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                <div className="p-1">
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Export as Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4 text-red-600" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport("share")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Share className="h-4 w-4 text-blue-600" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => handleExport("print")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4 text-gray-600" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Statistics */}
      <OrderStats orders={filteredOrders} dateRange={dateRange} orderStatistics={orderStatistics} />

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 print-hide">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading orders...</p>
          </div>
        </div>
      ) : (
        <div className="print-content print-table print-clean">
          <OrderTable
            orders={filteredOrders}
            onUpdateStatus={updateOrderStatus}
            onUpdatePaymentStatus={updatePaymentStatus}
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        </div>
      )}
    </div>
  );
});

DashboardOrders.displayName = "DashboardOrders";

// Wrapped component with error boundary
const SafeDashboardOrders = () => (
  <ErrorBoundary>
    <DashboardOrders />
  </ErrorBoundary>
);

export default SafeDashboardOrders;
export { useOrderData, OrderStats, OrderTable };
