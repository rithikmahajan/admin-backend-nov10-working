import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  User,
  Truck,
  DollarSign,
  RotateCcw,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  Check,
  Ban,
  AlertTriangle
} from "lucide-react";

/**
 * Enhanced Return Orders Component with Comprehensive Management
 */
const ReturnOrders = ({ onBack }) => {
  const navigate = useNavigate();
  
  // State management
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
    returnReason: ""
  });
  const [selectedReturns, setSelectedReturns] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statistics, setStatistics] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    rejectedReturns: 0,
    totalRefundAmount: 0
  });

  // Fetch return requests on component mount
  useEffect(() => {
    fetchReturnRequests();
    fetchReturnStatistics();
  }, []);

  const fetchReturnRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/returns", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReturnRequests(data.returns || []);
      } else {
        throw new Error("Failed to fetch return requests");
      }
    } catch (error) {
      console.error("Error fetching return requests:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnStatistics = async () => {
    try {
      const response = await fetch("/api/admin/returns/statistics");
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error("Error fetching return statistics:", error);
    }
  };

  // Handle return status updates
  const handleStatusUpdate = async (returnId, status, notes = "") => {
    try {
      const response = await fetch(`/api/admin/returns/${returnId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      });
      
      if (response.ok) {
        fetchReturnRequests();
        fetchReturnStatistics();
        alert(`Return ${status} successfully!`);
      } else {
        throw new Error(`Failed to ${status} return`);
      }
    } catch (error) {
      console.error(`Error updating return status:`, error);
      alert(`Failed to ${status} return. Please try again.`);
    }
  };

  const handleApprove = (returnId) => {
    const notes = prompt("Add approval notes (optional):");
    handleStatusUpdate(returnId, "approved", notes || "Return approved by admin");
  };

  const handleReject = (returnId) => {
    const notes = prompt("Please provide a reason for rejection:");
    if (notes) {
      handleStatusUpdate(returnId, "rejected", notes);
    }
  };

  const handleRefund = async (returnId, refundAmount) => {
    try {
      const response = await fetch(`/api/admin/returns/${returnId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundAmount })
      });
      
      if (response.ok) {
        fetchReturnRequests();
        alert("Refund processed successfully!");
      } else {
        throw new Error("Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund. Please try again.");
    }
  };

  // Filter and search logic
  const filteredReturns = useMemo(() => {
    return returnRequests.filter(returnReq => {
      const matchesStatus = !filters.status || returnReq.status === filters.status;
      const matchesSearch = !filters.searchTerm || 
        returnReq.order?._id?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        returnReq.user?.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        returnReq.user?.displayName?.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesReason = !filters.returnReason || returnReq.reason === filters.returnReason;
      
      let matchesDate = true;
      if (filters.dateFrom) {
        matchesDate = new Date(returnReq.createdAt) >= new Date(filters.dateFrom);
      }
      if (filters.dateTo && matchesDate) {
        matchesDate = new Date(returnReq.createdAt) <= new Date(filters.dateTo);
      }
      
      return matchesStatus && matchesSearch && matchesReason && matchesDate;
    });
  }, [returnRequests, filters]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      refunded: "bg-blue-100 text-blue-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return Clock;
      case "approved": return CheckCircle;
      case "rejected": return XCircle;
      case "refunded": return DollarSign;
      default: return AlertCircle;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Return Management</h1>
              <p className="text-gray-600">Manage customer return requests and refunds</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchReturnRequests}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[
            {
              title: "Total Returns",
              value: statistics.totalReturns,
              icon: RotateCcw,
              color: "bg-blue-500",
            },
            {
              title: "Pending",
              value: statistics.pendingReturns,
              icon: Clock,
              color: "bg-yellow-500",
            },
            {
              title: "Approved",
              value: statistics.approvedReturns,
              icon: CheckCircle,
              color: "bg-green-500",
            },
            {
              title: "Rejected",
              value: statistics.rejectedReturns,
              icon: XCircle,
              color: "bg-red-500",
            },
            {
              title: "Total Refunds",
              value: `₹${statistics.totalRefundAmount?.toLocaleString() || 0}`,
              icon: DollarSign,
              color: "bg-purple-500",
            }
          ].map((stat, index) => (
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
              <select
                value={filters.returnReason}
                onChange={(e) => setFilters({ ...filters, returnReason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Reasons</option>
                <option value="defective">Defective Product</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="size_issue">Size Issue</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="not_as_described">Not as Described</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Order ID, Customer..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setFilters({ status: "", dateFrom: "", dateTo: "", searchTerm: "", returnReason: "" })}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>

            <div className="text-sm text-gray-600">
              Showing {filteredReturns.length} of {returnRequests.length} returns
            </div>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">No return requests found</h3>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((returnReq) => {
                    const StatusIcon = getStatusIcon(returnReq.status);
                    return (
                      <tr key={returnReq._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            #{returnReq._id?.slice(-8)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {returnReq.items?.[0]?.itemId?.image && (
                              <img
                                src={returnReq.items[0].itemId.image}
                                alt="Product"
                                className="h-10 w-10 rounded object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Order #{returnReq.order?._id?.slice(-8)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {returnReq.items?.length} item(s)
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {returnReq.user?.displayName || returnReq.user?.firstName + ' ' + returnReq.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {returnReq.user?.email}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 capitalize">
                            {returnReq.reason?.replace('_', ' ')}
                          </div>
                          {returnReq.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {returnReq.description}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(returnReq.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {returnReq.status?.charAt(0).toUpperCase() + returnReq.status?.slice(1)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          ₹{(returnReq.refundAmount || returnReq.order?.total_amount || 0).toLocaleString()}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(returnReq.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedReturn(returnReq);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {returnReq.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(returnReq._id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve Return"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleReject(returnReq._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject Return"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {returnReq.status === 'approved' && !returnReq.refundProcessed && (
                              <button
                                onClick={() => handleRefund(returnReq._id, returnReq.refundAmount)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Process Refund"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Details Modal */}
        {showDetailsModal && selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Return Request Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Return Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Return Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return ID:</span>
                        <span className="font-mono">#{selectedReturn._id?.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-mono">#{selectedReturn.order?._id?.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReturn.status)}`}>
                          {selectedReturn.status?.charAt(0).toUpperCase() + selectedReturn.status?.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested:</span>
                        <span>{formatDate(selectedReturn.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Refund Amount:</span>
                        <span className="font-semibold">₹{(selectedReturn.refundAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{selectedReturn.user?.displayName || selectedReturn.user?.firstName + ' ' + selectedReturn.user?.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{selectedReturn.user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span>{selectedReturn.user?.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Reason */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Return Reason</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Reason:</strong> {selectedReturn.reason?.replace('_', ' ')}
                    </p>
                    {selectedReturn.description && (
                      <p className="text-sm text-gray-600">
                        <strong>Description:</strong> {selectedReturn.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Return Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Return Items</h4>
                  <div className="space-y-3">
                    {selectedReturn.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        {item.itemId?.image && (
                          <img
                            src={item.itemId.image}
                            alt={item.itemId.name}
                            className="h-16 w-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.itemId?.name}</h5>
                          <p className="text-sm text-gray-600">
                            Size: {item.selectedSize} | Color: {item.selectedColor}
                          </p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{(item.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedReturn.status === 'pending' && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleReject(selectedReturn._id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject Return
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedReturn._id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve Return
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnOrders;
