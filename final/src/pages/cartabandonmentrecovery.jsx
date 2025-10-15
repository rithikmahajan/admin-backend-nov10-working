import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { 
  Filter, Download, Mail, Eye, Trash2, Plus, RefreshCw, 
  Users, UserCheck, AlertCircle, Clock, Send, FileText 
} from "lucide-react";
import {
  fetchAbandonedCarts,
  fetchStatistics,
  syncFirebaseUsers,
  exportData,
  sendEmailToUser,
  sendBulkEmails,
  fetchUserProfile,
  deleteUser,
  fetchFilterOptions,
  updateFilters,
  resetFilters,
  toggleUserSelection,
  selectAllUsers,
  deselectAllUsers,
  clearError,
  clearSuccessMessage,
  clearUserProfile,
  selectAbandonedCarts,
  selectStatistics,
  selectFilters,
  selectFilterOptions,
  selectPagination,
  selectLoading,
  selectError,
  selectSuccessMessage,
  selectSelectedUsers,
  selectUserProfile
} from '../store/slices/cartAbandonmentSlice';

// Loading Spinner Component
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));

// Error Alert Component
const ErrorAlert = memo(({ message, onClose }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center justify-between">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
      <span className="text-red-800">{message}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="text-red-600 hover:text-red-800">
        ×
      </button>
    )}
  </div>
));

// Success Alert Component
const SuccessAlert = memo(({ message, onClose }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
    <div className="flex items-center">
      <UserCheck className="h-5 w-5 text-green-600 mr-2" />
      <span className="text-green-800">{message}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        ×
      </button>
    )}
  </div>
));

// User Profile Modal Component
const UserProfileModal = memo(({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <p className="text-gray-900">{user.userId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile</label>
            <p className="text-gray-900">{user.mobile || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User Name</label>
            <p className="text-gray-900">{user.userName || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User Type</label>
            <p className="text-gray-900 capitalize">{user.userType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <p className="text-gray-900">{user.gender || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <p className="text-gray-900">{user.country || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cart Value</label>
            <p className="text-gray-900">${user.cartValue || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cart Items</label>
            <p className="text-gray-900">{user.cartItems?.length || 0} items</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recovery Attempts</label>
            <p className="text-gray-900">{user.recoveryAttempts || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Active</label>
            <p className="text-gray-900">{new Date(user.lastActive).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
              user.status === 'abandoned' ? 'bg-red-100 text-red-800' :
              user.status === 'recovered' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user.status}
            </span>
          </div>
        </div>

        {user.cartItems && user.cartItems.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Cart Items</h3>
            <div className="space-y-2">
              {user.cartItems.map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border flex justify-between">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${item.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Email Modal Component
const EmailModal = memo(({ isOpen, onClose, onSend, isBulk = false, selectedCount = 0 }) => {
  const [emailData, setEmailData] = useState({
    subject: 'Complete Your Purchase - Items Still in Cart',
    message: ''
  });

  const handleSend = () => {
    onSend(emailData);
    setEmailData({ subject: 'Complete Your Purchase - Items Still in Cart', message: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isBulk ? `Send Email to ${selectedCount} Users` : 'Send Email'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              rows={6}
              placeholder="Leave empty to use default template"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
});

// Memoized UserRow component for better table performance
const UserRow = memo(({ user, isSelected, onToggleSelect, onViewProfile, onSendEmail, onDeleteUser }) => {
  const handleViewClick = useCallback(
    () => onViewProfile(user._id),
    [user._id, onViewProfile]
  );
  
  const handleEmailClick = useCallback(
    () => onSendEmail(user._id),
    [user._id, onSendEmail]
  );
  
  const handleDeleteClick = useCallback(
    () => onDeleteUser(user._id),
    [user._id, onDeleteUser]
  );

  const handleSelectChange = useCallback(
    () => onToggleSelect(user._id),
    [user._id, onToggleSelect]
  );

  const abandonedCartClass = useMemo(
    () =>
      user.status === "abandoned"
        ? "bg-red-100 text-red-800"
        : user.status === "recovered"
        ? "bg-green-100 text-green-800"
        : "bg-gray-100 text-gray-800",
    [user.status]
  );

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.userId}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.email}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.mobile || 'N/A'}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.userName || 'N/A'}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
        {user.userType}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.gender || 'N/A'}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(user.lastActive).toLocaleDateString()}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.avgVisitTime || 0} min
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className={`w-fit px-2 py-1 text-xs font-semibold rounded-md ${abandonedCartClass}`}>
            {user.status}
          </span>
          <span className="text-xs text-gray-500">
            ${user.cartValue || 0} • {user.cartItems?.length || 0} items
          </span>
          <span className="text-xs text-gray-400">
            {user.recoveryAttempts || 0} attempts
          </span>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex gap-2">
          <button
            onClick={handleViewClick}
            className="bg-green-100 text-green-800 px-3 py-1 text-xs rounded hover:bg-green-200 flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            view profile
          </button>
          <button
            onClick={handleEmailClick}
            className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Mail className="h-3 w-3" />
            send email
          </button>
          <button
            onClick={handleDeleteClick}
            className="bg-red-600 text-white px-3 py-1 text-xs rounded hover:bg-red-700 flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            delete user
          </button>
        </div>
      </td>
    </tr>
  );
});

UserRow.displayName = "UserRow";

/**
 * Cart Abandonment Recovery Component with Redux Integration
 */
const CartAbandonmentRecovery = memo(() => {
  const dispatch = useDispatch();
  
  // Redux state
  const abandonedCarts = useSelector(selectAbandonedCarts);
  const statistics = useSelector(selectStatistics);
  const filters = useSelector(selectFilters);
  const filterOptions = useSelector(selectFilterOptions);
  const pagination = useSelector(selectPagination);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);
  const selectedUsers = useSelector(selectSelectedUsers);
  const userProfile = useSelector(selectUserProfile);

  // Local state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalType, setEmailModalType] = useState('single'); // 'single' or 'bulk'
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    dispatch(fetchFilterOptions());
    dispatch(fetchAbandonedCarts(filters));
    dispatch(fetchStatistics(filters));
  }, [dispatch, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((field, value) => {
    dispatch(updateFilters({ [field]: value }));
  }, [dispatch]);

  // Handle sync Firebase users
  const handleSyncFirebaseUsers = useCallback(() => {
    dispatch(syncFirebaseUsers());
  }, [dispatch]);

  // Handle export
  const handleExport = useCallback((format) => {
    dispatch(exportData({ format, filters }));
  }, [dispatch, filters]);

  // Handle individual user actions
  const handleViewProfile = useCallback((userId) => {
    dispatch(fetchUserProfile(userId));
    setShowUserProfile(true);
  }, [dispatch]);

  const handleSendEmail = useCallback((userId) => {
    setSelectedUserId(userId);
    setEmailModalType('single');
    setShowEmailModal(true);
  }, []);

  const handleDeleteUser = useCallback((userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(userId));
    }
  }, [dispatch]);

  // Handle bulk actions
  const handleBulkEmail = useCallback(() => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }
    setEmailModalType('bulk');
    setShowEmailModal(true);
  }, [selectedUsers]);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === abandonedCarts.length) {
      dispatch(deselectAllUsers());
    } else {
      dispatch(selectAllUsers());
    }
  }, [dispatch, selectedUsers.length, abandonedCarts.length]);

  // Handle email sending
  const handleEmailSend = useCallback((emailData) => {
    if (emailModalType === 'single' && selectedUserId) {
      dispatch(sendEmailToUser({ userId: selectedUserId, emailData }));
    } else if (emailModalType === 'bulk') {
      dispatch(sendBulkEmails({ userIds: selectedUsers, ...emailData }));
    }
  }, [dispatch, emailModalType, selectedUserId, selectedUsers]);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    dispatch(fetchAbandonedCarts({ ...filters, page }));
  }, [dispatch, filters]);

  // Clear alerts
  const handleClearError = useCallback((errorType) => {
    dispatch(clearError(errorType));
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearSuccessMessage());
  }, [dispatch]);

  const StatCard = ({ label, value, icon: Icon }) => (
    <div className="bg-white shadow-sm border rounded-lg p-4 text-center">
      <div className="flex items-center justify-center mb-2">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Alerts */}
      {Object.entries(error).map(([key, message]) => 
        message && (
          <ErrorAlert 
            key={key} 
            message={message} 
            onClose={() => handleClearError(key)} 
          />
        )
      )}
      
      {successMessage && (
        <SuccessAlert 
          message={successMessage} 
          onClose={handleClearSuccess} 
        />
      )}

      {/* Header and Actions */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Cart Abandonment Recovery
        </h1>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSyncFirebaseUsers}
            disabled={loading.sync}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading.sync ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Firebase Users
          </button>
          
          <button
            onClick={handleBulkEmail}
            disabled={selectedUsers.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            Bulk Email ({selectedUsers.length})
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            disabled={loading.export}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          
          <button
            onClick={() => handleExport('xlsx')}
            disabled={loading.export}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Export XLSX
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard 
          label="Abandoned Carts" 
          value={statistics.emptyCartStatus} 
          icon={Users} 
        />
        <StatCard 
          label="Registered Users" 
          value={statistics.registeredUsers} 
          icon={UserCheck} 
        />
        <StatCard 
          label="Guest Users" 
          value={statistics.guests} 
          icon={Users} 
        />
        <StatCard 
          label="Avg Visit Time" 
          value={statistics.avgVisitTime} 
          icon={Clock} 
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(filterOptions).map(([key, options]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
              {key.replace(/([A-Z])/g, " $1")}
            </label>
            <select
              value={filters[key]}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* User Details Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            User Details ({abandonedCarts.length})
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={handleSelectAll}
              className="bg-slate-100 border border-slate-300 text-black px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {selectedUsers.length === abandonedCarts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {loading.abandonedCarts ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === abandonedCarts.length && abandonedCarts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {[
                    "User ID",
                    "Email", 
                    "Mobile",
                    "Username",
                    "User Type",
                    "DOB",
                    "Gender",
                    "Last Active",
                    "Avg Visit Time",
                    "Cart Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {abandonedCarts.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    isSelected={selectedUsers.includes(user._id)}
                    onToggleSelect={(userId) => dispatch(toggleUserSelection(userId))}
                    onViewProfile={handleViewProfile}
                    onSendEmail={handleSendEmail}
                    onDeleteUser={handleDeleteUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.current * pagination.limit, pagination.count)} of{' '}
              {pagination.count} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                {pagination.current}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        isBulk={emailModalType === 'bulk'}
        selectedCount={selectedUsers.length}
      />

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfileModal
          user={userProfile}
          onClose={() => {
            setShowUserProfile(false);
            dispatch(clearUserProfile());
          }}
        />
      )}
    </div>
  );
});

CartAbandonmentRecovery.displayName = "CartAbandonmentRecovery";

export default CartAbandonmentRecovery;
