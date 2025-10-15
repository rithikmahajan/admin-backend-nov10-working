import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Plus, Edit3, Trash2, Eye, EyeOff, Shield, ShieldOff, Save, RefreshCw, Search, Filter } from "lucide-react";
import TwoFactorAuth from "../components/TwoFactorAuth";
import SuccessModal from "../components/SuccessModal";
import {
  createPartner,
  fetchPartners,
  updatePartner,
  updatePartnerPassword,
  togglePartnerStatus,
  deletePartner,
  fetchPartnerStatistics,
  clearErrors,
  clearSuccess,
  updateFilters,
  setSelectedPartner,
  selectPartners,
  selectPartnerLoading,
  selectPartnerError,
  selectPartnerSuccess,
  selectPartnerPagination,
  selectPartnerFilters,
  selectPartnerStatistics
} from "../store/slices/partnerSlice";

const NewPartner = () => {
  const dispatch = useDispatch();
  
  // Redux selectors
  const partners = useSelector(selectPartners);
  const loading = useSelector(selectPartnerLoading);
  const error = useSelector(selectPartnerError);
  const success = useSelector(selectPartnerSuccess);
  const pagination = useSelector(selectPartnerPagination);
  const filters = useSelector(selectPartnerFilters);
  const statistics = useSelector(selectPartnerStatistics);

  // Local state for form and UI
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    businessName: "",
  });

  const [modalStates, setModalStates] = useState({
    showCreateModal: false,
    showEditModal: false,
    showPasswordModal: false,
    show2FAModal: false,
    showBlock2FAModal: false,
    showVerificationSuccessModal: false,
    showPartnerCreatedSuccessModal: false,
    showBlockConfirmModal: false,
    showBlockSuccessModal: false,
    showSuccessModal: false,
  });

  const [actionStates, setActionStates] = useState({
    selectedPartnerId: null,
    blockAction: "",
    pendingPartnerData: null,
    editingPartner: null,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [editingPasswords, setEditingPasswords] = useState({});
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");

  // Effects
  useEffect(() => {
    dispatch(fetchPartners({ 
      page: 1, 
      limit: 10,
      search: filters.search,
      status: filters.status 
    }));
    dispatch(fetchPartnerStatistics());
  }, [dispatch, filters.search, filters.status]);

  useEffect(() => {
    if (success.create) {
      setModalStates(prev => ({
        ...prev,
        show2FAModal: false,
        showVerificationSuccessModal: false,
        showPartnerCreatedSuccessModal: true
      }));
      resetForm();
      dispatch(clearSuccess());
    }
  }, [success.create, dispatch]);

  useEffect(() => {
    if (success.update || success.passwordUpdate) {
      setModalStates(prev => ({
        ...prev,
        showEditModal: false,
        showPasswordModal: false,
        showSuccessModal: true
      }));
      resetPasswordForm();
      dispatch(clearSuccess());
    }
  }, [success.update, success.passwordUpdate, dispatch]);

  useEffect(() => {
    if (success.delete) {
      setModalStates(prev => ({
        ...prev,
        showSuccessModal: true
      }));
      dispatch(clearSuccess());
    }
  }, [success.delete, dispatch]);

  useEffect(() => {
    if (error.create || error.update || error.delete) {
      console.error("Partner operation error:", error);
      // You can add toast notifications here
    }
  }, [error.create, error.update, error.delete]);

  // Helper functions
  const updateModalState = useCallback((key, value) => {
    setModalStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateActionState = useCallback((key, value) => {
    setActionStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
      businessName: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      gstNumber: ""
    });
  }, []);

  const resetPasswordForm = useCallback(() => {
    setPasswordData({
      newPassword: "",
      confirmPassword: "",
    });
  }, []);

  // Event handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Partner name is required!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    const partnerData = {
      name: formData.name.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      businessInfo: {
        businessName: formData.businessName.trim() || undefined,
        address: {
          street: formData.street.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          zipCode: formData.zipCode.trim() || undefined,
          country: formData.country || "India"
        },
        gstNumber: formData.gstNumber.trim() || undefined
      }
    };

    updateActionState("pendingPartnerData", partnerData);
    updateModalState("show2FAModal", true);
  }, [formData]);

  const handle2FASuccess = useCallback(() => {
    if (actionStates.pendingPartnerData) {
      dispatch(createPartner(actionStates.pendingPartnerData));
      updateModalState("show2FAModal", false);
      updateModalState("showVerificationSuccessModal", true);
    }
  }, [actionStates.pendingPartnerData, dispatch]);

  const handle2FACancel = useCallback(() => {
    updateModalState("show2FAModal", false);
    updateActionState("pendingPartnerData", null);
  }, []);

  const handlePasswordSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    if (actionStates.selectedPartnerId) {
      dispatch(updatePartnerPassword({
        partnerId: actionStates.selectedPartnerId,
        passwordData: {
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        }
      }));
    }
  }, [passwordData, actionStates.selectedPartnerId, dispatch]);

  const handleToggleStatus = useCallback((partnerId, currentStatus) => {
    const action = currentStatus === 'active' ? 'block' : 'unblock';
    updateActionState("selectedPartnerId", partnerId);
    updateActionState("blockAction", action);
    updateModalState("showBlockConfirmModal", true);
  }, []);

  const confirmToggleStatus = useCallback(() => {
    updateModalState("showBlockConfirmModal", false);
    updateModalState("showBlock2FAModal", true);
  }, []);

  const handleBlock2FASuccess = useCallback(() => {
    if (actionStates.selectedPartnerId && actionStates.blockAction) {
      dispatch(togglePartnerStatus({
        partnerId: actionStates.selectedPartnerId,
        action: actionStates.blockAction,
        reason: "Admin action via 2FA"
      }));
      updateModalState("showBlock2FAModal", false);
      updateModalState("showBlockSuccessModal", true);
    }
  }, [actionStates.selectedPartnerId, actionStates.blockAction, dispatch]);

  const handleBlock2FACancel = useCallback(() => {
    updateModalState("showBlock2FAModal", false);
    updateActionState("selectedPartnerId", null);
    updateActionState("blockAction", "");
  }, []);

  const cancelBlockConfirm = useCallback(() => {
    updateModalState("showBlockConfirmModal", false);
    updateActionState("selectedPartnerId", null);
    updateActionState("blockAction", "");
  }, []);

  const handleDeletePartner = useCallback((partnerId) => {
    if (window.confirm("Are you sure you want to delete this partner? This action cannot be undone.")) {
      dispatch(deletePartner(partnerId));
    }
  }, [dispatch]);

  const handleEditPartner = useCallback((partner) => {
    setFormData({
      name: partner.name || "",
      password: "",
      confirmPassword: "",
      email: partner.email || "",
      phone: partner.phone || "",
      businessName: partner.businessInfo?.businessName || "",
      street: partner.businessInfo?.address?.street || "",
      city: partner.businessInfo?.address?.city || "",
      state: partner.businessInfo?.address?.state || "",
      zipCode: partner.businessInfo?.address?.zipCode || "",
      country: partner.businessInfo?.address?.country || "India",
      gstNumber: partner.businessInfo?.gstNumber || ""
    });
    updateActionState("editingPartner", partner);
    updateActionState("selectedPartnerId", partner._id);
    updateModalState("showEditModal", true);
  }, []);

  const handleUpdatePartner = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Partner name is required!");
      return;
    }

    if (actionStates.selectedPartnerId) {
      const updates = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        businessInfo: {
          businessName: formData.businessName.trim() || undefined,
          address: {
            street: formData.street.trim() || undefined,
            city: formData.city.trim() || undefined,
            state: formData.state.trim() || undefined,
            zipCode: formData.zipCode.trim() || undefined,
            country: formData.country || "India"
          },
          gstNumber: formData.gstNumber.trim() || undefined
        }
      };

      dispatch(updatePartner({
        partnerId: actionStates.selectedPartnerId,
        updates
      }));
    }
  }, [formData, actionStates.selectedPartnerId, dispatch]);

  const openPasswordModal = useCallback((partnerId) => {
    updateActionState("selectedPartnerId", partnerId);
    updateModalState("showPasswordModal", true);
    resetPasswordForm();
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    dispatch(updateFilters({ search: value }));
  }, [dispatch]);

  const handleStatusFilterChange = useCallback((e) => {
    const value = e.target.value;
    setStatusFilter(value);
    dispatch(updateFilters({ status: value }));
  }, [dispatch]);

  const handlePageChange = useCallback((page) => {
    dispatch(fetchPartners({ 
      page, 
      limit: 10,
      search: filters.search,
      status: filters.status 
    }));
  }, [dispatch, filters]);

  const togglePasswordVisibility = useCallback((partnerId) => {
    setEditingPasswords(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalStates({
      showCreateModal: false,
      showEditModal: false,
      showPasswordModal: false,
      show2FAModal: false,
      showBlock2FAModal: false,
      showVerificationSuccessModal: false,
      showPartnerCreatedSuccessModal: false,
      showBlockConfirmModal: false,
      showBlockSuccessModal: false,
      showSuccessModal: false,
    });
    updateActionState("selectedPartnerId", null);
    updateActionState("blockAction", "");
    updateActionState("pendingPartnerData", null);
    updateActionState("editingPartner", null);
    resetForm();
    resetPasswordForm();
  }, []);

  const refreshData = useCallback(() => {
    dispatch(fetchPartners({ 
      page: pagination.currentPage, 
      limit: 10,
      search: filters.search,
      status: filters.status 
    }));
    dispatch(fetchPartnerStatistics());
  }, [dispatch, pagination.currentPage, filters]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
          <div className="flex gap-4">
            <button
              onClick={refreshData}
              disabled={loading.partners}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading.partners ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => updateModalState("showCreateModal", true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add New Partner
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Partners</h3>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalPartners || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Partners</h3>
            <p className="text-2xl font-bold text-green-600">{statistics.activePartners || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Blocked Partners</h3>
            <p className="text-2xl font-bold text-red-600">{statistics.blockedPartners || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Avg Acceptance Rate</h3>
            <p className="text-2xl font-bold text-blue-600">{(statistics.avgAcceptanceRate || 0).toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading.partners ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Loading partners...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No partners found
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                        <div className="text-sm text-gray-500">ID: {partner.partnerId}</div>
                        {partner.businessInfo?.businessName && (
                          <div className="text-xs text-gray-400">{partner.businessInfo.businessName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {partner.email && (
                          <div className="text-sm text-gray-900">{partner.email}</div>
                        )}
                        {partner.phone && (
                          <div className="text-sm text-gray-500">{partner.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        partner.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : partner.status === 'blocked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Orders: {partner.statistics?.totalOrdersAssigned || 0}</div>
                      <div>Acceptance: {(partner.statistics?.acceptanceRate || 0).toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditPartner(partner)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Partner"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(partner._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Change Password"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(partner._id, partner.status)}
                          className={partner.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={partner.status === 'active' ? 'Block Partner' : 'Unblock Partner'}
                        >
                          {partner.status === 'active' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.currentPage - 1) * 10 + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * 10, pagination.totalCount)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.totalCount}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Partner Modal */}
      {modalStates.showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Partner</h2>
              <button
                onClick={() => updateModalState("showCreateModal", false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => updateModalState("showCreateModal", false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.create}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading.create ? 'Creating...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {modalStates.showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Partner</h2>
              <button
                onClick={() => updateModalState("showEditModal", false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => updateModalState("showEditModal", false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.update}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading.update ? 'Updating...' : 'Update Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {modalStates.showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => updateModalState("showPasswordModal", false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => updateModalState("showPasswordModal", false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.update}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading.update ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {modalStates.showBlockConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {actionStates.blockAction === 'block' ? 'Block Partner' : 'Unblock Partner'}
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actionStates.blockAction} this partner? This action will require 2FA verification.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelBlockConfirm}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleStatus}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  actionStates.blockAction === 'block' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {modalStates.show2FAModal && (
        <TwoFactorAuth
          onSubmit={handle2FASuccess}
          onCancel={handle2FACancel}
          title="Create Partner - 2FA Verification"
        />
      )}

      {/* Block 2FA Modal */}
      {modalStates.showBlock2FAModal && (
        <TwoFactorAuth
          onSubmit={handleBlock2FASuccess}
          onCancel={handleBlock2FACancel}
          title={`${actionStates.blockAction === 'block' ? 'Block' : 'Unblock'} Partner - 2FA Verification`}
        />
      )}

      {/* Success Modals */}
      {modalStates.showVerificationSuccessModal && (
        <SuccessModal
          message="2FA verification successful!"
          onClose={() => updateModalState("showVerificationSuccessModal", false)}
        />
      )}

      {modalStates.showPartnerCreatedSuccessModal && (
        <SuccessModal
          message="Partner created successfully!"
          onClose={closeAllModals}
        />
      )}

      {modalStates.showBlockSuccessModal && (
        <SuccessModal
          message={`Partner ${actionStates.blockAction}ed successfully!`}
          onClose={closeAllModals}
        />
      )}

      {modalStates.showSuccessModal && (
        <SuccessModal
          message="Operation completed successfully!"
          onClose={closeAllModals}
        />
      )}

      {/* Error Display */}
      {(error.create || error.update || error.delete || error.partners) && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error.create || error.update || error.delete || error.partners}
        </div>
      )}
    </div>
  );
};

export default NewPartner;
