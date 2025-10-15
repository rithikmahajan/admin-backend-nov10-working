/**
 * Points Management System Component - Redux Version
 *
 * A comprehensive points management interface that allows administrators to:
 * - Enable/disable the points system with 2FA verification
 * - Manage user points allocation and redemption
 * - View and edit user accounts and their point balances
 * - Delete user accounts with confirmation
 * - Search and filter user accounts
 *
 * Features:
 * - Redux state management for all data
 * - Two-factor authentication for system changes
 * - Real-time user management with CRUD operations
 * - Modal-based editing and confirmation flows
 * - Responsive design with comprehensive state management
 * - Axios API integration through Redux thunks
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { ChevronDown, Search, Edit2, Trash2, Filter, RefreshCw } from "lucide-react";
import TwoFactorAuth from "../components/TwoFactorAuth";
import SuccessModal from "../components/SuccessModal";
import { usePoints } from "../store/hooks";
import {
  fetchPointsSummary,
  fetchSystemConfig,
  updateSystemConfig,
  fetchUsersWithPoints,
  fetchUserPoints,
  allocatePoints,
  redeemPoints,
  updateUserPoints,
  deleteUserPoints,
  fetchUserPointsHistory,
  clearError,
  clearSuccessMessage,
  setCurrentUser,
  updatePagination
} from "../store/slices/pointsSlice";

// Constants
const INITIAL_OTP_STATE = ["", "", "", ""];

// Memoized Toggle Button component for better performance
const ToggleButton = memo(
  ({ isActive, onClick, children, width = "w-[72px]" }) => (
    <button
      onClick={onClick}
      className={`h-9 ${width} rounded-full border text-sm font-medium transition-colors duration-150 flex items-center justify-center
        ${
          isActive
            ? "bg-blue-600 text-white border-blue-700 shadow-sm"
            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
        }`}
    >
      {children}
    </button>
  )
);

// Memoized UserRow component for better performance
const UserRow = memo(({ user, onAllotNow, onEditUser, onDeleteUser }) => {
  const pointsInfo = user.pointsInfo || {
    totalPointsAlloted: 0,
    totalPointsRedeemed: 0,
    balance: 0
  };

  // Determine the display ID (prefer MongoDB _id, fallback to Firebase UID)
  const displayUserId = user._id || user.firebaseUid || user.userId || 'N/A';
  const truncatedUserId = displayUserId.length > 8 ? `${displayUserId.substring(0, 8)}...` : displayUserId;

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 text-sm text-gray-800">
        <div>
          <div className="font-medium">{user.name || 'N/A'}</div>
          {user.source === 'firebase' && (
            <div className="text-xs text-blue-600 mt-1">
              🔥 Firebase User {!user.hasMongoAccount && '(New)'}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600" title={displayUserId}>
        {truncatedUserId}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{user.phoneNumber || user.phone || 'N/A'}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{user.email || 'N/A'}</td>
      <td className="px-6 py-4 text-sm text-blue-600 font-medium">
        {pointsInfo.totalPointsAlloted?.toLocaleString() || '0'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {pointsInfo.totalPointsRedeemed?.toLocaleString() || '0'}
      </td>
      <td className="px-6 py-4 text-sm text-red-500 font-medium">
        {pointsInfo.balance?.toLocaleString() || '0'}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAllotNow(user)}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md border border-blue-200 hover:bg-blue-200 transition-colors duration-150"
          >
            Allot Now
          </button>
          <button
            onClick={() => onEditUser(user)}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors duration-150"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteUser(user)}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-150"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const Points = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const {
    summary,
    systemConfig,
    users,
    currentUser,
    userPointsHistory,
    pagination,
    isLoading,
    errors,
    successMessages
  } = usePoints();

  // Local UI state
  const [pointsSystemEnabled, setPointsSystemEnabled] = useState(systemConfig?.isEnabled || false);
  const [issuePoints, setIssuePoints] = useState("");
  const [pointGenerationBasis, setPointGenerationBasis] = useState("");
  const [pointsToGive, setPointsToGive] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States - System Toggle
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showOffConfirmationModal, setShowOffConfirmationModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showOff2FAModal, setShowOff2FAModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOffSuccessModal, setShowOffSuccessModal] = useState(false);
  const [showFinalSuccessModal, setShowFinalSuccessModal] = useState(false);
  const [showOffFinalSuccessModal, setShowOffFinalSuccessModal] = useState(false);

  // Modal States - User Management
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEdit2FAModal, setShowEdit2FAModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  
  // Modal States - Points Allocation
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showAllocateSuccessModal, setShowAllocateSuccessModal] = useState(false);
  const [allocateUserData, setAllocateUserData] = useState(null);

  // Form States
  const [otpCode, setOtpCode] = useState(INITIAL_OTP_STATE);

  // User Management States
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editPhoneNo, setEditPhoneNo] = useState("");
  const [editEmailId, setEditEmailId] = useState("");
  const [editTotalPointsAlloted, setEditTotalPointsAlloted] = useState("");
  const [editTotalPointsRedeemed, setEditTotalPointsRedeemed] = useState("");
  const [editBalance, setEditBalance] = useState("");

  // Update local state when Redux state changes
  useEffect(() => {
    if (systemConfig) {
      setPointsSystemEnabled(systemConfig.isEnabled);
    }
  }, [systemConfig]);

  // Load initial data
  useEffect(() => {
    dispatch(fetchUsersWithPoints({ page: 1, limit: 10 }));
    dispatch(fetchSystemConfig());
    dispatch(fetchPointsSummary());
  }, [dispatch]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchUsersWithPoints({ 
        page: 1, 
        limit: 10, 
        search: searchTerm 
      }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dispatch]);

  // Event Handlers
  const handlePageChange = useCallback((newPage) => {
    dispatch(updatePagination({ currentPage: newPage }));
    dispatch(fetchUsersWithPoints({ 
      page: newPage, 
      limit: pagination.limit, 
      search: searchTerm 
    }));
  }, [dispatch, pagination.limit, searchTerm]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(fetchUsersWithPoints({ 
      page: pagination.currentPage, 
      limit: pagination.limit, 
      search: searchTerm 
    }));
    dispatch(fetchPointsSummary());
    dispatch(fetchSystemConfig());
  }, [dispatch, pagination.currentPage, pagination.limit, searchTerm]);

  // Points Operations
  const handleAllocatePoints = useCallback(async (userId, amount, description, generationBasis) => {
    try {
      const result = await dispatch(allocatePoints({ 
        userId, 
        pointsData: { amount, description, generationBasis } 
      })).unwrap();
      
      // Refresh data
      dispatch(fetchUsersWithPoints({ 
        page: pagination.currentPage, 
        limit: pagination.limit, 
        search: searchTerm 
      }));
      dispatch(fetchPointsSummary());
      
      return { success: true, message: 'Points allocated successfully' };
    } catch (error) {
      return { success: false, message: error };
    }
  }, [dispatch, pagination.currentPage, pagination.limit, searchTerm]);

  const handleUpdateUserPoints = useCallback(async (userId, pointsData) => {
    try {
      await dispatch(updateUserPoints({ userId, pointsData })).unwrap();
      
      // Refresh data
      dispatch(fetchUsersWithPoints({ 
        page: pagination.currentPage, 
        limit: pagination.limit, 
        search: searchTerm 
      }));
      dispatch(fetchPointsSummary());
      
      return { success: true, message: 'User points updated successfully' };
    } catch (error) {
      return { success: false, message: error };
    }
  }, [dispatch, pagination.currentPage, pagination.limit, searchTerm]);

  const handleDeleteUserPoints = useCallback(async (userId) => {
    try {
      await dispatch(deleteUserPoints(userId)).unwrap();
      
      // Refresh data
      dispatch(fetchUsersWithPoints({ 
        page: pagination.currentPage, 
        limit: pagination.limit, 
        search: searchTerm 
      }));
      dispatch(fetchPointsSummary());
      
      return { success: true, message: 'User points deleted successfully' };
    } catch (error) {
      return { success: false, message: error };
    }
  }, [dispatch, pagination.currentPage, pagination.limit, searchTerm]);

  const handleUpdateSystemConfig = useCallback(async (configData) => {
    try {
      await dispatch(updateSystemConfig(configData)).unwrap();
      return { success: true, message: 'System configuration updated successfully' };
    } catch (error) {
      return { success: false, message: error };
    }
  }, [dispatch]);

  // Modal Handlers
  const handleAllotNow = useCallback((user) => {
    setAllocateUserData(user);
    setPointsToGive("");
    setPointGenerationBasis("admin_allocation");
    setShowAllocateModal(true);
  }, []);

  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    setEditUserName(user.name || "");
    setEditUserId(user.userId || user._id);
    setEditPhoneNo(user.phoneNumber || user.phone || "");
    setEditEmailId(user.email || "");
    
    const pointsInfo = user.pointsInfo || {};
    setEditTotalPointsAlloted(pointsInfo.totalPointsAlloted?.toString() || "0");
    setEditTotalPointsRedeemed(pointsInfo.totalPointsRedeemed?.toString() || "0");
    setEditBalance(pointsInfo.balance?.toString() || "0");
    
    setShowEditModal(true);
  }, []);

  const handleDeleteUser = useCallback((user) => {
    // Use the appropriate ID for deletion (MongoDB ID if available, otherwise Firebase UID)
    const userIdForDeletion = user._id || user.firebaseUid;
    setDeletingUserId(userIdForDeletion);
    setShowDeleteModal(true);
  }, []);

  const submitPointsAllocation = useCallback(async () => {
    if (!allocateUserData || !pointsToGive || !pointGenerationBasis) {
      return;
    }

    try {
      // Use MongoDB ID if available, otherwise use Firebase UID
      const userIdForAllocation = allocateUserData._id || allocateUserData.firebaseUid;
      
      const result = await handleAllocatePoints(
        userIdForAllocation,
        parseInt(pointsToGive),
        `Points allocated via admin panel - ${pointGenerationBasis}`,
        pointGenerationBasis
      );

      if (result.success) {
        setShowAllocateModal(false);
        setShowAllocateSuccessModal(true);
        setAllocateUserData(null);
        setPointsToGive("");
        setPointGenerationBasis("admin_allocation");
      }
    } catch (error) {
      console.error("Error allocating points:", error);
    }
  }, [allocateUserData, pointsToGive, pointGenerationBasis, handleAllocatePoints]);

  const confirmDeleteUser = useCallback(async () => {
    if (deletingUserId) {
      const result = await handleDeleteUserPoints(deletingUserId);
      if (result.success) {
        setShowDeleteModal(false);
        setShowDeleteSuccessModal(true);
        setDeletingUserId(null);
      }
    }
  }, [deletingUserId, handleDeleteUserPoints]);

  const handleSystemToggle = useCallback(() => {
    if (pointsSystemEnabled) {
      setShowOffConfirmationModal(true);
    } else {
      setShowConfirmationModal(true);
    }
  }, [pointsSystemEnabled]);

  const handleSystemConfigSubmit = useCallback(async () => {
    const result = await handleUpdateSystemConfig({
      isEnabled: !pointsSystemEnabled,
      pointsPerRupee: systemConfig?.pointsPerRupee || 1
    });
    
    if (result.success) {
      if (pointsSystemEnabled) {
        setShowOff2FAModal(false);
        setShowOffFinalSuccessModal(true);
      } else {
        setShow2FAModal(false);
        setShowFinalSuccessModal(true);
      }
    }
  }, [pointsSystemEnabled, systemConfig, handleUpdateSystemConfig]);

  // Form handlers
  const handlePointsToGiveChange = useCallback((e) => {
    const value = e.target.value;
    // Allow empty string or positive numbers only
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setPointsToGive(value);
    }
  }, []);

  const handleIssuePointsChange = useCallback((e) => {
    const value = e.target.value;
    // Allow empty string or positive numbers only
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setIssuePoints(value);
    }
  }, []);

  // Clear errors and success messages when modals close
  const clearMessages = useCallback(() => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
  }, [dispatch]);

  // Memoized computed values
  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    return users;
  }, [users]);

  const hasUsers = useMemo(() => filteredUsers.length > 0, [filteredUsers]);

  // Loading and error states
  const isLoadingAny = useMemo(() => {
    return Object.values(isLoading).some(loading => loading);
  }, [isLoading]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error !== null);
  }, [errors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Points Management System
          </h1>
          <p className="text-gray-600">
            Manage user points, system configuration, and user accounts
          </p>
        </div>

        {/* Error Display */}
        {hasErrors && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">Errors:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.entries(errors).map(([key, error]) => 
                error && (
                  <li key={key}>
                    <strong>{key}:</strong> {error}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {/* Success Messages */}
        {Object.values(successMessages).some(msg => msg) && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-medium mb-2">Success:</h3>
            <ul className="text-green-700 text-sm space-y-1">
              {Object.entries(successMessages).map(([key, message]) => 
                message && (
                  <li key={key}>
                    <strong>{key}:</strong> {message}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {/* Top Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Points System Toggle */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Points System
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">System Status</span>
              <ToggleButton 
                isActive={pointsSystemEnabled} 
                onClick={handleSystemToggle}
                width="w-20"
              >
                {pointsSystemEnabled ? "ON" : "OFF"}
              </ToggleButton>
            </div>
            {systemConfig && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Points per Rupee: {systemConfig.pointsPerRupee}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Issue Points
                </label>
                <input
                  type="text"
                  value={issuePoints}
                  onChange={handleIssuePointsChange}
                  placeholder="Enter points amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Generation Basis
                </label>
                <select
                  value={pointGenerationBasis}
                  onChange={(e) => setPointGenerationBasis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select basis</option>
                  <option value="purchase">Purchase</option>
                  <option value="referral">Referral</option>
                  <option value="signup">Signup</option>
                  <option value="review">Review</option>
                  <option value="admin_allocation">Admin Allocation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Summary</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Total Allocated</span>
                <span className="text-blue-600 font-semibold">
                  {summary.totalPointsAllocated?.toLocaleString() || '0'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Total Redeemed</span>
                <span className="font-semibold">
                  {summary.totalPointsRedeemed?.toLocaleString() || '0'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Balance</span>
                <span className="text-red-500 font-semibold">
                  {summary.totalPointsBalance?.toLocaleString() || '0'}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Total Users</span>
                <span className="text-gray-800 font-semibold">
                  {summary.totalUsersWithPoints || 0}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Users with Points ({pagination.totalUsers})
              </h2>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingAny}
                  className="p-2 text-gray-500 hover:text-blue-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingAny ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {isLoading.users ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : hasUsers ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points Allocated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points Redeemed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <UserRow
                      key={user._id || user.firebaseUid || user.userId || `user-${index}`}
                      user={user}
                      onAllotNow={handleAllotNow}
                      onEditUser={handleEditUser}
                      onDeleteUser={handleDeleteUser}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors duration-150 ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {/* System Toggle Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Enable Points System</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to enable the points system? This will allow users to earn and redeem points.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setShow2FAModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-150"
                >
                  Yes, Enable
                </button>
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Toggle Off Confirmation Modal */}
        {showOffConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Disable Points System</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to disable the points system? This will prevent users from earning and redeeming points.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowOffConfirmationModal(false);
                    setShowOff2FAModal(true);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-150"
                >
                  Yes, Disable
                </button>
                <button
                  onClick={() => setShowOffConfirmationModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Modal for Enable */}
        {show2FAModal && (
          <TwoFactorAuth
            isOpen={show2FAModal}
            onClose={() => setShow2FAModal(false)}
            onSuccess={() => {
              setShow2FAModal(false);
              setShowSuccessModal(true);
            }}
            title="Enable Points System"
            description="Please verify your identity to enable the points system."
          />
        )}

        {/* 2FA Modal for Disable */}
        {showOff2FAModal && (
          <TwoFactorAuth
            isOpen={showOff2FAModal}
            onClose={() => setShowOff2FAModal(false)}
            onSuccess={() => {
              setShowOff2FAModal(false);
              setShowOffSuccessModal(true);
            }}
            title="Disable Points System"
            description="Please verify your identity to disable the points system."
          />
        )}

        {/* Success Modals */}
        {showSuccessModal && (
          <SuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            onContinue={handleSystemConfigSubmit}
            title="Verification Successful"
            message="Your identity has been verified. Click continue to enable the points system."
            continueText="Enable System"
          />
        )}

        {showOffSuccessModal && (
          <SuccessModal
            isOpen={showOffSuccessModal}
            onClose={() => setShowOffSuccessModal(false)}
            onContinue={handleSystemConfigSubmit}
            title="Verification Successful"
            message="Your identity has been verified. Click continue to disable the points system."
            continueText="Disable System"
          />
        )}

        {/* Final Success Modals */}
        {showFinalSuccessModal && (
          <SuccessModal
            isOpen={showFinalSuccessModal}
            onClose={() => {
              setShowFinalSuccessModal(false);
              clearMessages();
            }}
            title="Points System Enabled"
            message="The points system has been successfully enabled."
            showContinueButton={false}
          />
        )}

        {showOffFinalSuccessModal && (
          <SuccessModal
            isOpen={showOffFinalSuccessModal}
            onClose={() => {
              setShowOffFinalSuccessModal(false);
              clearMessages();
            }}
            title="Points System Disabled"
            message="The points system has been successfully disabled."
            showContinueButton={false}
          />
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit User Points</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Points Allocated
                  </label>
                  <input
                    type="number"
                    value={editTotalPointsAlloted}
                    onChange={(e) => setEditTotalPointsAlloted(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Points Redeemed
                  </label>
                  <input
                    type="number"
                    value={editTotalPointsRedeemed}
                    onChange={(e) => setEditTotalPointsRedeemed(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={async () => {
                    const result = await handleUpdateUserPoints(editingUser._id, {
                      totalPointsAlloted: parseInt(editTotalPointsAlloted) || 0,
                      totalPointsRedeemed: parseInt(editTotalPointsRedeemed) || 0,
                    });
                    
                    if (result.success) {
                      setShowEditModal(false);
                      setShowEditSuccessModal(true);
                    }
                  }}
                  disabled={isLoading.updating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
                >
                  {isLoading.updating ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Success Modal */}
        {showEditSuccessModal && (
          <SuccessModal
            isOpen={showEditSuccessModal}
            onClose={() => {
              setShowEditSuccessModal(false);
              clearMessages();
            }}
            title="User Updated"
            message="User points have been successfully updated."
            showContinueButton={false}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Delete User Points</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user's points data? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmDeleteUser}
                  disabled={isLoading.deleting}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-150 disabled:opacity-50"
                >
                  {isLoading.deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Success Modal */}
        {showDeleteSuccessModal && (
          <SuccessModal
            isOpen={showDeleteSuccessModal}
            onClose={() => {
              setShowDeleteSuccessModal(false);
              clearMessages();
            }}
            title="User Deleted"
            message="User points data has been successfully deleted."
            showContinueButton={false}
          />
        )}

        {/* Points Allocation Modal */}
        {showAllocateModal && allocateUserData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Allocate Points</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Allocating points to: <strong>{allocateUserData.name || 'Unknown User'}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  User ID: {allocateUserData._id || allocateUserData.firebaseUid}
                </p>
                {allocateUserData.source === 'firebase' && (
                  <p className="text-xs text-blue-600 mt-1">
                    🔥 Firebase User {!allocateUserData.hasMongoAccount && '(Will create MongoDB record)'}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Amount *
                  </label>
                  <input
                    type="text"
                    value={pointsToGive}
                    onChange={handlePointsToGiveChange}
                    placeholder="Enter points amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Basis *
                  </label>
                  <select
                    value={pointGenerationBasis}
                    onChange={(e) => setPointGenerationBasis(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select basis</option>
                    <option value="purchase">Purchase</option>
                    <option value="referral">Referral</option>
                    <option value="signup">Signup</option>
                    <option value="review">Review</option>
                    <option value="admin_allocation">Admin Allocation</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={submitPointsAllocation}
                  disabled={!pointsToGive || !pointGenerationBasis || isLoading.allocating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
                >
                  {isLoading.allocating ? 'Allocating...' : 'Allocate Points'}
                </button>
                <button
                  onClick={() => {
                    setShowAllocateModal(false);
                    setAllocateUserData(null);
                    setPointsToGive("");
                    setPointGenerationBasis("admin_allocation");
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Points Allocation Success Modal */}
        {showAllocateSuccessModal && (
          <SuccessModal
            isOpen={showAllocateSuccessModal}
            onClose={() => {
              setShowAllocateSuccessModal(false);
              clearMessages();
            }}
            title="Points Allocated"
            message="Points have been successfully allocated to the user."
            showContinueButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default Points;
