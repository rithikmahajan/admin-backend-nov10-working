import React, { useState, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SuccessModal from "../components/SuccessModal";

/**
 * Settings Online Discount Component
 * Manages online discount percentage settings and discount conditions
 */

const DEFAULT_DISCOUNT_FORM = {
  category: "",
  subCategory: "",
  items: "",
  specified: "",
  discountType: "",
  startDate: "",
  endDate: "",
  minimumOrderValue: "",
  maxUsers: "",
};

const DEFAULT_SETTINGS = {
  onlineDiscount: 5,
};

const SettingsOnlineDiscount = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [discountConditions, setDiscountConditions] = useState([]);
  const [discountForm, setDiscountForm] = useState(DEFAULT_DISCOUNT_FORM);
  const [editingDiscountId, setEditingDiscountId] = useState(null);

  // Modal state
  const [modals, setModals] = useState({
    discountModal: false,
    discountConditionCreatedSuccess: false,
    discountConditionUpdatedSuccess: false,
    discountConditionDeleteConfirm: false,
    discountConditionDeletedSuccess: false,
  });

  // ==============================
  // HANDLERS
  // ==============================

  const handleInputChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  }, []);

  const handleOpenDiscountModal = useCallback(() => {
    setModals(prev => ({ ...prev, discountModal: true }));
  }, []);

  const handleCloseDiscountModal = useCallback(() => {
    setModals(prev => ({ ...prev, discountModal: false }));
    setDiscountForm(DEFAULT_DISCOUNT_FORM);
    setEditingDiscountId(null);
  }, []);

  const handleDiscountFormChange = useCallback((key, value) => {
    setDiscountForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveDiscountCondition = useCallback(() => {
    if (editingDiscountId) {
      // Update existing condition
      setDiscountConditions(prev =>
        prev.map(condition =>
          condition.id === editingDiscountId
            ? { ...discountForm, id: editingDiscountId }
            : condition
        )
      );
      setModals(prev => ({ 
        ...prev, 
        discountModal: false,
        discountConditionUpdatedSuccess: true 
      }));
    } else {
      // Create new condition
      const newCondition = {
        ...discountForm,
        id: Date.now().toString(),
      };
      setDiscountConditions(prev => [...prev, newCondition]);
      setModals(prev => ({ 
        ...prev, 
        discountModal: false,
        discountConditionCreatedSuccess: true 
      }));
    }
    setDiscountForm(DEFAULT_DISCOUNT_FORM);
    setEditingDiscountId(null);
  }, [discountForm, editingDiscountId]);

  const handleEditDiscountCondition = useCallback((condition) => {
    setDiscountForm(condition);
    setEditingDiscountId(condition.id);
    setModals(prev => ({ ...prev, discountModal: true }));
  }, []);

  const handleDeleteDiscountCondition = useCallback((id) => {
    setEditingDiscountId(id);
    setModals(prev => ({ ...prev, discountConditionDeleteConfirm: true }));
  }, []);

  const handleConfirmDeleteDiscountCondition = useCallback(() => {
    setDiscountConditions(prev => prev.filter(condition => condition.id !== editingDiscountId));
    setModals(prev => ({ 
      ...prev, 
      discountConditionDeleteConfirm: false,
      discountConditionDeletedSuccess: true 
    }));
    setEditingDiscountId(null);
  }, [editingDiscountId]);

  // ==============================
  // COMPUTED VALUES
  // ==============================

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

  const SettingItem = useMemo(() => 
    ({ title, hasInput = false, inputValue, onInputChange, inputKey, centered = true }) => (
      <div className={`py-4 ${centered ? 'flex items-center justify-between' : 'space-y-2'}`}>
        <h3 className="font-semibold text-[#000000] text-lg font-montserrat">
          {title}
        </h3>
        {hasInput && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => onInputChange(inputKey, e.target.value)}
              className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
              min="0"
              max="100"
            />
            <span className="text-gray-600">%</span>
          </div>
        )}
      </div>
    ), []
  );

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-4xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          Online Discount Settings
        </h1>
      </div>

      {/* Discount Percentage Setting */}
      <div className="py-6 border-b border-gray-200">
        <SettingItem
          title="Set the percentage of discount to implement if paying online"
          hasInput={true}
          inputValue={settings.onlineDiscount}
          onInputChange={handleInputChange}
          inputKey="onlineDiscount"
          centered={false}
        />
      </div>

      {/* Discount Conditions */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-2">
          Discount Conditions
        </h3>
        <ViewSettingsButton onClick={handleOpenDiscountModal} />
        
        {/* Existing Conditions List */}
        {discountConditions.length > 0 && (
          <div className="mt-4 space-y-2">
            {discountConditions.map((condition) => (
              <div key={condition.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium">{condition.category}</span>
                  {condition.subCategory && <span> - {condition.subCategory}</span>}
                  <span className="text-gray-600 ml-2">({condition.discountType})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditDiscountCondition(condition)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDiscountCondition(condition.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discount Condition Modal */}
      {modals.discountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingDiscountId ? 'Edit' : 'Add'} Discount Condition
                </h2>
                <button
                  onClick={handleCloseDiscountModal}
                  className="w-6 h-6 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-full h-full" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Category"
                  value={discountForm.category}
                  onChange={(e) => handleDiscountFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Sub Category"
                  value={discountForm.subCategory}
                  onChange={(e) => handleDiscountFormChange('subCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Items"
                  value={discountForm.items}
                  onChange={(e) => handleDiscountFormChange('items', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <select
                  value={discountForm.discountType}
                  onChange={(e) => handleDiscountFormChange('discountType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">Select Discount Type</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={discountForm.startDate}
                    onChange={(e) => handleDiscountFormChange('startDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={discountForm.endDate}
                    onChange={(e) => handleDiscountFormChange('endDate', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Minimum Order Value"
                  value={discountForm.minimumOrderValue}
                  onChange={(e) => handleDiscountFormChange('minimumOrderValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Max Users"
                  value={discountForm.maxUsers}
                  onChange={(e) => handleDiscountFormChange('maxUsers', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseDiscountModal}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDiscountCondition}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  {editingDiscountId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modals */}
      <SuccessModal
        isOpen={modals.discountConditionCreatedSuccess}
        onClose={() => setModals(prev => ({ ...prev, discountConditionCreatedSuccess: false }))}
        title="Discount Condition Created"
        message="The discount condition has been successfully created."
      />

      <SuccessModal
        isOpen={modals.discountConditionUpdatedSuccess}
        onClose={() => setModals(prev => ({ ...prev, discountConditionUpdatedSuccess: false }))}
        title="Discount Condition Updated"
        message="The discount condition has been successfully updated."
      />

      <SuccessModal
        isOpen={modals.discountConditionDeletedSuccess}
        onClose={() => setModals(prev => ({ ...prev, discountConditionDeletedSuccess: false }))}
        title="Discount Condition Deleted"
        message="The discount condition has been successfully deleted."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.discountConditionDeleteConfirm}
        onClose={() => setModals(prev => ({ ...prev, discountConditionDeleteConfirm: false }))}
        onConfirm={handleConfirmDeleteDiscountCondition}
        title="Delete Discount Condition"
        message="Are you sure you want to delete this discount condition? This action cannot be undone."
      />
    </div>
  );
};

export default SettingsOnlineDiscount;
