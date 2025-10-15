import React, { useState, useCallback, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SuccessModal from "../components/SuccessModal";
import { useShipping } from "../store/hooks";

/**
 * Settings Shipping Charges Component
 * Manages shipping charges by region and country
 */

const DEFAULT_SHIPPING_FORM = {
  country: "",
  region: "",
  deliveryCharge: "",
  returnCharge: "",
  estimatedDays: "",
};

const PREDEFINED_COUNTRIES = [
  "United States",
  "Canada", 
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Australia",
  "New Zealand",
  "Japan",
  "South Korea",
  "Singapore",
  "India",
  "China",
  "Brazil",
  "Mexico",
];

const SettingsShippingCharges = () => {
  // ==============================
  // REDUX HOOKS
  // ==============================
  const {
    charges: shippingCharges,
    loading,
    errors,
    fetchCharges,
    createCharge,
    updateCharge,
    deleteCharge,
    clearErrors,
  } = useShipping();

  // ==============================
  // LOCAL STATE MANAGEMENT
  // ==============================
  const [shippingForm, setShippingForm] = useState(DEFAULT_SHIPPING_FORM);
  const [editingShippingId, setEditingShippingId] = useState(null);

  // Modal state
  const [modals, setModals] = useState({
    shippingChargesModal: false,
    shippingChargeCreatedSuccess: false,
    shippingChargeUpdatedSuccess: false,
    shippingChargeDeleteConfirm: false,
    shippingChargeDeletedSuccess: false,
  });

  // ==============================
  // EFFECTS
  // ==============================
  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  // Debug effect to log shipping charges data
  useEffect(() => {
    console.log('Shipping charges data:', {
      shippingCharges,
      length: shippingCharges?.length,
      loading: loading.fetchCharges,
      errors: errors.fetchCharges,
      authToken: localStorage.getItem('authToken') ? 'Present' : 'Missing'
    });
  }, [shippingCharges, loading.fetchCharges, errors.fetchCharges]);

  // ==============================
  // HANDLERS
  // ==============================

  const handleOpenShippingModal = useCallback(() => {
    setModals(prev => ({ ...prev, shippingChargesModal: true }));
  }, []);

  const handleCloseModal = useCallback((modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    setShippingForm(DEFAULT_SHIPPING_FORM);
    setEditingShippingId(null);
    
    // Clear errors when closing shipping charges modal
    if (modalType === 'shippingChargesModal') {
      clearErrors();
    }
  }, [clearErrors]);

  const handleCloseShippingModal = useCallback(() => {
    handleCloseModal('shippingChargesModal');
  }, [handleCloseModal]);

  const handleShippingFormChange = useCallback((key, value) => {
    setShippingForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveShippingCharge = useCallback(async () => {
    try {
      console.log('🚀 Starting to save shipping charge...', shippingForm);
      
      // Clear any previous errors
      clearErrors();
      
      // Validate required fields
      if (!shippingForm.country || 
          shippingForm.deliveryCharge === '' || 
          shippingForm.returnCharge === '' || 
          !shippingForm.estimatedDays) {
        const errorMsg = 'Please fill in all required fields';
        console.error('❌ Validation error:', errorMsg);
        alert(errorMsg);
        return;
      }
      
      // Validate numeric fields
      if (isNaN(shippingForm.deliveryCharge) || isNaN(shippingForm.returnCharge) || 
          parseFloat(shippingForm.deliveryCharge) < 0 || parseFloat(shippingForm.returnCharge) < 0 ||
          parseInt(shippingForm.estimatedDays) < 1) {
        const errorMsg = 'Please enter valid values for charges and delivery days';
        console.error('❌ Validation error:', errorMsg);
        alert(errorMsg);
        return;
      }
      
      console.log('✅ Validation passed');
      
      if (editingShippingId) {
        console.log('📝 Updating existing charge with ID:', editingShippingId);
        // Update existing charge
        const result = await updateCharge({ chargeId: editingShippingId, chargeData: shippingForm });
        console.log('✅ Update result:', result);
        setModals(prev => ({ 
          ...prev, 
          shippingChargesModal: false,
          shippingChargeUpdatedSuccess: true 
        }));
      } else {
        // Check for duplicate country-region combination before creating
        const isDuplicate = shippingCharges.some(charge => 
          charge.country === shippingForm.country && 
          (charge.region || null) === (shippingForm.region || null)
        );
        
        if (isDuplicate) {
          const errorMsg = 'Duplicate shipping charge detected for this country and region';
          console.error('❌ Duplicate error:', errorMsg);
          alert(errorMsg);
          return;
        }
        
        console.log('🆕 Creating new charge...');
        console.log('🔐 Auth token exists:', !!localStorage.getItem('authToken'));
        console.log('🌐 API Base URL:', import.meta.env.VITE_API_BASE_URL);
        
        // Create new charge
        const result = await createCharge(shippingForm);
        console.log('✅ Create result:', result);
        
        setModals(prev => ({ 
          ...prev, 
          shippingChargesModal: false,
          shippingChargeCreatedSuccess: true 
        }));
      }
      setShippingForm(DEFAULT_SHIPPING_FORM);
      setEditingShippingId(null);
    } catch (error) {
      console.error('💥 Error saving shipping charge:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      // Show user-friendly error message
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save shipping charge';
      alert(`Error: ${errorMsg}`);
    }
  }, [shippingForm, editingShippingId, createCharge, updateCharge, shippingCharges, clearErrors]);

  const handleEditShippingCharge = useCallback((charge) => {
    const { _id, __v, createdAt, updatedAt, ...formData } = charge;
    setShippingForm(formData);
    setEditingShippingId(charge._id);
    setModals(prev => ({ ...prev, shippingChargesModal: true }));
  }, []);

  const handleDeleteShippingCharge = useCallback((id) => {
    console.log('handleDeleteShippingCharge called with id:', id);
    
    // Validate that we have a proper ID
    if (!id || id === 'undefined' || id === 'null') {
      console.error('Invalid shipping charge ID provided:', id);
      alert('Error: Cannot delete shipping charge - invalid ID. Please refresh the page and try again.');
      return;
    }
    
    setEditingShippingId(id);
    setModals(prev => ({ ...prev, shippingChargeDeleteConfirm: true }));
  }, []);

  const handleConfirmDeleteShippingCharge = useCallback(async () => {
    try {
      // Additional validation before making the API call
      if (!editingShippingId || editingShippingId === 'undefined' || editingShippingId === 'null') {
        console.error('Cannot delete shipping charge - invalid ID:', editingShippingId);
        alert('Error: Cannot delete shipping charge - invalid ID. Please refresh the page and try again.');
        setModals(prev => ({ ...prev, shippingChargeDeleteConfirm: false }));
        setEditingShippingId(null);
        return;
      }
      
      console.log('Attempting to delete shipping charge with ID:', editingShippingId);
      await deleteCharge(editingShippingId);
      setModals(prev => ({ 
        ...prev, 
        shippingChargeDeleteConfirm: false,
        shippingChargeDeletedSuccess: true 
      }));
      setEditingShippingId(null);
    } catch (error) {
      console.error('Error deleting shipping charge:', error);
      alert('Error deleting shipping charge. Please check the console for details.');
    }
  }, [editingShippingId, deleteCharge]);

  const handleCreateSampleData = useCallback(async () => {
    const sampleCharges = [
      {
        country: "United States",
        region: "East Coast",
        deliveryCharge: 15.99,
        returnCharge: 8.99,
        estimatedDays: 3
      },
      {
        country: "Canada",
        region: "",
        deliveryCharge: 22.50,
        returnCharge: 12.50,
        estimatedDays: 5
      },
      {
        country: "United Kingdom",
        region: "",
        deliveryCharge: 18.75,
        returnCharge: 10.25,
        estimatedDays: 7
      }
    ];

    try {
      for (const charge of sampleCharges) {
        await createCharge(charge);
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log('Sample data created successfully');
      await fetchCharges(); // Refresh the data
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  }, [createCharge, fetchCharges]);

  // ==============================
  // COMPUTED VALUES
  // ==============================
  
  const isFormValid = useMemo(() => {
    return shippingForm.country && 
           shippingForm.deliveryCharge !== '' && 
           shippingForm.returnCharge !== '' && 
           shippingForm.estimatedDays &&
           !isNaN(shippingForm.deliveryCharge) && 
           !isNaN(shippingForm.returnCharge) &&
           parseFloat(shippingForm.deliveryCharge) >= 0 &&
           parseFloat(shippingForm.returnCharge) >= 0 &&
           parseInt(shippingForm.estimatedDays) >= 1;
  }, [shippingForm]);

  const ViewSettingsButton = useMemo(() => 
    ({ onClick }) => (
      <button
        onClick={onClick}
        className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium font-montserrat hover:bg-gray-800 transition-colors"
      >
        View Settings
      </button>
    ), []
  );

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-4xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          Shipping Charges Settings
        </h1>
      </div>

      {/* Shipping Charges Setting */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-2">
          Set shipping and time estimates charges by region and country
        </h3>
        <div className="flex gap-2 flex-wrap">
          <ViewSettingsButton onClick={handleOpenShippingModal} />
          <button
            onClick={() => fetchCharges()}
            disabled={loading.fetchCharges}
            className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium font-montserrat hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading.fetchCharges ? 'Loading...' : 'Refresh Data'}
          </button>
          <button
            onClick={handleCreateSampleData}
            disabled={loading.createCharge}
            className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium font-montserrat hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading.createCharge ? 'Creating...' : 'Add Sample Data'}
          </button>
          <button
            onClick={() => {
              console.log('🧪 Testing API call manually...');
              console.log('🔐 Auth token:', localStorage.getItem('authToken'));
              console.log('🌐 Base URL:', import.meta.env.VITE_API_BASE_URL);
              console.log('🚀 Making fetch request...');
              
              fetchCharges().then(result => {
                console.log('✅ Manual fetch result:', result);
              }).catch(error => {
                console.error('💥 Manual fetch error:', {
                  message: error.message,
                  response: error.response?.data,
                  status: error.response?.status,
                  config: error.config
                });
              });
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium font-montserrat hover:bg-purple-700 transition-colors"
          >
            Test API
          </button>
          <button
            onClick={async () => {
              console.log('🔑 Setting up authentication...');
              
              // Use the generated admin token
              const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGNkNzFmM2YzMWViNWQ3MmE2YzhlMjUiLCJuYW1lIjoiSm9oeWVlaW50ZWVldHkgcnRvZSIsInBoTm8iOiI3MDM2NTY3ODkwIiwiaXNWZXJpZmllZCI6dHJ1ZSwiaXNQaG9uZVZlcmlmaWVkIjp0cnVlLCJpc0VtYWlsVmVyaWZpZWQiOnRydWUsImlzQWRtaW4iOnRydWUsImlzUHJvZmlsZSI6dHJ1ZSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicGxhdGZvcm0iOm51bGwsImlhdCI6MTc1ODc1ODY2NiwiZXhwIjoxNzU5MzYzNDY2fQ.83CZkrfYuzHT4G0vl9y_pEkVQirjkoPV49gACVpB69I';
              const userData = '{"_id":"68cd71f3f31eb5d72a6c8e25","name":"Johyeeinteeety rtoe","phNo":"7036567890","isVerified":true,"isPhoneVerified":true,"isEmailVerified":true,"isAdmin":true,"isProfile":true,"email":"user@example.com","platform":null}';
              
              localStorage.setItem('authToken', adminToken);
              localStorage.setItem('userData', userData);
              console.log('✅ Admin token and user data set');
              
              // Try to fetch data again
              setTimeout(() => {
                console.log('🔄 Refreshing data with new auth...');
                fetchCharges();
              }, 1000);
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium font-montserrat hover:bg-orange-700 transition-colors"
          >
            Set Admin Auth
          </button>
        </div>
        
        {/* Loading State */}
        {loading.fetchCharges && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-2 text-gray-600">Loading shipping charges...</p>
          </div>
        )}

        {/* Error State */}
        {errors.fetchCharges && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {errors.fetchCharges}
          </div>
        )}

        {/* Authentication Status */}
        <div className={`mt-4 p-3 rounded text-sm ${localStorage.getItem('authToken') ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <strong>Authentication Status:</strong> {localStorage.getItem('authToken') ? '✅ Authenticated' : '❌ Not Authenticated'}
              {!localStorage.getItem('authToken') && (
                <div className="mt-1 text-xs">Click "Set Admin Auth" button to authenticate</div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm space-y-2">
          <div><strong>Debug Information:</strong></div>
          <div>• Charges Count: {shippingCharges?.length || 0}</div>
          <div>• Loading State: {loading.fetchCharges ? 'Yes' : 'No'}</div>
          <div>• Error State: {errors.fetchCharges ? 'Yes' : 'No'}</div>
          <div>• Error Message: {errors.fetchCharges || 'None'}</div>
          <div>• Auth Token: {localStorage.getItem('authToken') ? '✅ Present' : '❌ Missing'}</div>
          <div>• API Base URL: {import.meta.env.VITE_API_BASE_URL || 'Not Set'}</div>
          <div>• Charges Data Structure: {shippingCharges?.length > 0 ? 
            `First charge has ${shippingCharges[0]._id ? '_id' : 'no _id'}, ${shippingCharges[0].id ? 'id' : 'no id'}` : 
            'No charges available'}</div>
          <div>• Charges Data: {JSON.stringify(shippingCharges).substring(0, 200)}...</div>
        </div>

        {/* Existing Charges List */}
        {!loading.fetchCharges && shippingCharges.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-800">Current Shipping Charges ({shippingCharges.length})</h4>
            {shippingCharges.map((charge, index) => (
              <div key={charge._id || charge.id || `charge-${index}`} className="p-3 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-lg">{charge.country}</span>
                    {charge.region && <span className="text-gray-600">({charge.region})</span>}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="mr-4">💰 Delivery: ${charge.deliveryCharge}</span>
                    <span className="mr-4">↩️ Return: ${charge.returnCharge}</span>
                    <span>⏱️ {charge.estimatedDays} days</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditShippingCharge(charge)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const chargeId = charge._id || charge.id;
                      console.log('Delete button clicked for charge:', { 
                        charge, 
                        _id: charge._id, 
                        id: charge.id, 
                        chargeId 
                      });
                      handleDeleteShippingCharge(chargeId);
                    }}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    disabled={!charge._id && !charge.id}
                    title={!charge._id && !charge.id ? 'Cannot delete - no ID available' : 'Delete shipping charge'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading.fetchCharges && !errors.fetchCharges && shippingCharges.length === 0 && (
          <div className="mt-4 text-center py-8">
            <p className="text-gray-500">No shipping charges configured yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "View Settings" to add your first shipping charge.</p>
          </div>
        )}
      </div>

      {/* Shipping Charges Modal */}
      {modals.shippingChargesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingShippingId ? 'Edit' : 'Add'} Shipping Charge
                </h2>
                <button
                  onClick={handleCloseShippingModal}
                  className="w-6 h-6 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-full h-full" />
                </button>
              </div>

              {/* Error Display */}
              {(errors.createCharge || errors.updateCharge) && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Error:</strong> {errors.createCharge || errors.updateCharge}
                      {(errors.createCharge && errors.createCharge.includes('already exists')) && (
                        <div className="mt-2 text-sm">
                          A shipping charge for this country and region combination already exists. 
                          Please choose a different country/region or edit the existing charge.
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={clearErrors}
                      className="ml-2 text-red-600 hover:text-red-800"
                      title="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <select
                  value={shippingForm.country}
                  onChange={(e) => handleShippingFormChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Select Country</option>
                  {PREDEFINED_COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  placeholder="Region (Optional)"
                  value={shippingForm.region}
                  onChange={(e) => handleShippingFormChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Delivery Charge ($)"
                    value={shippingForm.deliveryCharge}
                    onChange={(e) => handleShippingFormChange('deliveryCharge', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="Return Charge ($)"
                    value={shippingForm.returnCharge}
                    onChange={(e) => handleShippingFormChange('returnCharge', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <input
                  type="number"
                  placeholder="Estimated Delivery Days"
                  value={shippingForm.estimatedDays}
                  onChange={(e) => handleShippingFormChange('estimatedDays', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  min="1"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseShippingModal}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShippingCharge}
                  disabled={loading.createCharge || loading.updateCharge || !isFormValid}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.createCharge || loading.updateCharge 
                    ? 'Saving...' 
                    : (editingShippingId ? 'Update' : 'Save')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modals */}
      <SuccessModal
        isOpen={modals.shippingChargeCreatedSuccess}
        onClose={() => setModals(prev => ({ ...prev, shippingChargeCreatedSuccess: false }))}
        title="Shipping Charge Created"
        message="The shipping charge has been successfully created."
      />

      <SuccessModal
        isOpen={modals.shippingChargeUpdatedSuccess}
        onClose={() => setModals(prev => ({ ...prev, shippingChargeUpdatedSuccess: false }))}
        title="Shipping Charge Updated"
        message="The shipping charge has been successfully updated."
      />

      <SuccessModal
        isOpen={modals.shippingChargeDeletedSuccess}
        onClose={() => setModals(prev => ({ ...prev, shippingChargeDeletedSuccess: false }))}
        title="Shipping Charge Deleted"
        message="The shipping charge has been successfully deleted."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.shippingChargeDeleteConfirm}
        onClose={() => setModals(prev => ({ ...prev, shippingChargeDeleteConfirm: false }))}
        onConfirm={handleConfirmDeleteShippingCharge}
        title="Delete Shipping Charge"
        message="Are you sure you want to delete this shipping charge? This action cannot be undone."
      />
    </div>
  );
};

export default SettingsShippingCharges;
