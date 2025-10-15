import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  Eye,
  MoreHorizontal,
  Calendar,
  Users,
  TrendingUp,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import TwoFactorAuth from "../components/TwoFactorAuth";
import SuccessModal from "../components/SuccessModal";
import { toast } from 'react-hot-toast';

// Import Redux actions
import {
  getAllInviteCodes,
  createInviteCode,
  updateInviteCode,
  deleteInviteCode,
  toggleInviteCodeStatus,
  generateInviteCode,
  getInviteCodeStats,
  getDetailedInviteCodeStats,
  bulkDeleteInviteCodes,
  bulkUpdateStatus,
  clearError,
  updateFilters,
  resetFilters,
  setCurrentInviteCode,
  clearCurrentInviteCode
} from '../store/inviteFriendSlice';

const InviteFriend = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const {
    inviteCodes,
    currentInviteCode,
    stats,
    detailedStats,
    loading,
    error,
    pagination,
    filters
  } = useSelector(state => state.inviteFriend);

  // Local state for modals and forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [currentAction, setCurrentAction] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxRedemptions: 100,
    expiryDate: '',
    terms: '',
    minOrderValue: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Load data on component mount
  useEffect(() => {
    dispatch(getAllInviteCodes({ page: 1, limit: 10 }));
    dispatch(getInviteCodeStats());
    dispatch(getDetailedInviteCodeStats());
  }, [dispatch]);

  // Filter codes based on search and status
  const filteredCodes = useMemo(() => {
    let filtered = inviteCodes;
    
    if (searchTerm) {
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(code => code.status === statusFilter);
    }
    
    return filtered;
  }, [inviteCodes, searchTerm, statusFilter]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle create invite code
  const handleCreateCode = useCallback(async () => {
    if (!formData.code || !formData.description || !formData.discountValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCurrentAction('create');
      setShow2FAModal(true);
    } catch (error) {
      toast.error('Failed to create invite code');
    }
  }, [formData]);

  // Handle generate random code
  const handleGenerateCode = useCallback(async () => {
    try {
      const result = await dispatch(generateInviteCode({ length: 8 })).unwrap();
      handleInputChange('code', result.data.code);
      toast.success('Code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate code');
    }
  }, [dispatch, handleInputChange]);

  // Handle edit invite code
  const handleEditCode = useCallback((code) => {
    dispatch(setCurrentInviteCode(code));
    setFormData({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue,
      maxRedemptions: code.maxRedemptions,
      expiryDate: code.expiryDate ? code.expiryDate.split('T')[0] : '',
      terms: code.terms || '',
      minOrderValue: code.minOrderValue || 0
    });
    setShowEditModal(true);
  }, [dispatch]);

  // Handle update invite code
  const handleUpdateCode = useCallback(async () => {
    if (!currentInviteCode) return;

    try {
      setCurrentAction('update');
      setShow2FAModal(true);
    } catch (error) {
      toast.error('Failed to update invite code');
    }
  }, [currentInviteCode]);

  // Handle delete invite code
  const handleDeleteCode = useCallback((code) => {
    dispatch(setCurrentInviteCode(code));
    setShowDeleteModal(true);
  }, [dispatch]);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!currentInviteCode) return;

    try {
      setCurrentAction('delete');
      setShow2FAModal(true);
    } catch (error) {
      toast.error('Failed to delete invite code');
    }
  }, [currentInviteCode]);

  // Handle toggle status
  const handleToggleStatus = useCallback(async (code) => {
    try {
      await dispatch(toggleInviteCodeStatus(code._id)).unwrap();
      toast.success(`Code ${code.status === 'active' ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  }, [dispatch]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action) => {
    if (selectedCodes.length === 0) {
      toast.error('Please select codes first');
      return;
    }

    try {
      if (action === 'delete') {
        await dispatch(bulkDeleteInviteCodes(selectedCodes)).unwrap();
        toast.success(`${selectedCodes.length} codes deleted successfully!`);
      } else {
        await dispatch(bulkUpdateStatus({ ids: selectedCodes, status: action })).unwrap();
        toast.success(`${selectedCodes.length} codes updated successfully!`);
      }
      setSelectedCodes([]);
      setShowBulkActions(false);
    } catch (error) {
      toast.error(`Failed to ${action} codes`);
    }
  }, [selectedCodes, dispatch]);

  // Handle 2FA completion
  const handle2FASuccess = useCallback(async () => {
    try {
      let result;
      
      switch (currentAction) {
        case 'create':
          result = await dispatch(createInviteCode(formData)).unwrap();
          setSuccessMessage('Invite code created successfully!');
          setFormData({
            code: '',
            description: '',
            discountType: 'percentage',
            discountValue: '',
            maxRedemptions: 100,
            expiryDate: '',
            terms: '',
            minOrderValue: 0
          });
          setShowCreateModal(false);
          break;
          
        case 'update':
          result = await dispatch(updateInviteCode({ 
            id: currentInviteCode._id, 
            updates: formData 
          })).unwrap();
          setSuccessMessage('Invite code updated successfully!');
          setShowEditModal(false);
          dispatch(clearCurrentInviteCode());
          break;
          
        case 'delete':
          result = await dispatch(deleteInviteCode(currentInviteCode._id)).unwrap();
          setSuccessMessage('Invite code deleted successfully!');
          setShowDeleteModal(false);
          dispatch(clearCurrentInviteCode());
          break;
          
        default:
          return;
      }
      
      setShow2FAModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      toast.error(error.message || 'Operation failed');
      setShow2FAModal(false);
    }
  }, [currentAction, formData, currentInviteCode, dispatch]);

  // Handle checkbox selection
  const handleSelectCode = useCallback((codeId, checked) => {
    setSelectedCodes(prev => 
      checked 
        ? [...prev, codeId]
        : prev.filter(id => id !== codeId)
    );
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked) => {
    setSelectedCodes(checked ? filteredCodes.map(code => code._id) : []);
  }, [filteredCodes]);

  // Handle refresh data
  const handleRefresh = useCallback(() => {
    dispatch(getAllInviteCodes({ page: pagination.currentPage, limit: 10 }));
    dispatch(getInviteCodeStats());
    dispatch(getDetailedInviteCodeStats());
  }, [dispatch, pagination.currentPage]);

  // Render stats cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Codes</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalCodes || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Active Codes</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.activeCodes || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Redemptions</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalRedemptions || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Utilization Rate</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.utilizationRate || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render create/edit modal
  const renderFormModal = () => {
    const isEdit = showEditModal;
    const title = isEdit ? 'Edit Invite Code' : 'Create New Invite Code';
    
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${(showCreateModal || showEditModal) ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  dispatch(clearCurrentInviteCode());
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="INVITE2024"
                      maxLength={20}
                    />
                    <button
                      onClick={handleGenerateCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Invite a friend and get 10% off on your first purchase"
                  maxLength={500}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handleInputChange('discountType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value * {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => handleInputChange('discountValue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                    min="0"
                    max={formData.discountType === 'percentage' ? '100' : '10000'}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    value={formData.maxRedemptions}
                    onChange={(e) => handleInputChange('maxRedemptions', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) => handleInputChange('minOrderValue', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Additional terms and conditions..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  dispatch(clearCurrentInviteCode());
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={isEdit ? handleUpdateCode : handleCreateCode}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isEdit ? 'Update Code' : 'Create Code')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite a Friend</h1>
          <p className="text-gray-600">Manage invite codes and track redemptions</p>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedCodes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedCodes.length} selected
                    </span>
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Bulk Actions
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  View Stats
                </button>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Code
                </button>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {showBulkActions && selectedCodes.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Bulk Actions:</span>
                  <button
                    onClick={() => handleBulkAction('active')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('inactive')}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invite Codes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCodes.length === filteredCodes.length && filteredCodes.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redemptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCodes.map((code) => (
                  <tr key={code._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(code._id)}
                        onChange={(e) => handleSelectCode(code._id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-medium text-gray-900">
                        {code.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {code.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {code.discountType === 'percentage' ? `${code.discountValue}%` : `₹${code.discountValue}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {code.redemptionCount}/{code.maxRedemptions}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(code.redemptionCount / code.maxRedemptions) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        code.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : code.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {code.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.expiryDate ? new Date(code.expiryDate).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditCode(code)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(code)}
                          className={`${code.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCodes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {loading ? 'Loading invite codes...' : 'No invite codes found'}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(getAllInviteCodes({ page: pagination.currentPage - 1, limit: 10 }))}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => dispatch(getAllInviteCodes({ page: pagination.currentPage + 1, limit: 10 }))}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {renderFormModal()}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Delete
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the invite code "{currentInviteCode?.code}"? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    dispatch(clearCurrentInviteCode());
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <TwoFactorAuth
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          onSuccess={handle2FASuccess}
          title="Verify Action"
          description="Please verify your identity to complete this action"
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Success!"
          message={successMessage}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => dispatch(clearError())}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteFriend;
