import React, { useState, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SuccessModal from "../components/SuccessModal";

/**
 * Settings HSN Code Component
 * Manages HSN (Harmonized System of Nomenclature) codes
 */

const DEFAULT_HSN_CODE_FORM = {
  code: "",
  description: "",
  taxRate: "",
  category: "",
};

const SettingsHsnCode = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [hsnCodes, setHsnCodes] = useState([]);
  const [hsnCodeForm, setHsnCodeForm] = useState(DEFAULT_HSN_CODE_FORM);
  const [editingHsnCodeId, setEditingHsnCodeId] = useState(null);

  // Modal state
  const [modals, setModals] = useState({
    hsnCodeModal: false,
    hsnCodeCreatedModal: false,
    hsnCodeUpdatedModal: false,
    hsnCodeDeletedModal: false,
    deleteHsnCodeModal: false,
  });

  // ==============================
  // HANDLERS
  // ==============================

  const handleOpenHsnCodeModal = useCallback(() => {
    setModals(prev => ({ ...prev, hsnCodeModal: true }));
  }, []);

  const handleCloseHsnCodeModal = useCallback(() => {
    setModals(prev => ({ ...prev, hsnCodeModal: false }));
    setHsnCodeForm(DEFAULT_HSN_CODE_FORM);
    setEditingHsnCodeId(null);
  }, []);

  const handleHsnCodeFormChange = useCallback((key, value) => {
    setHsnCodeForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveHsnCode = useCallback(() => {
    if (editingHsnCodeId) {
      // Update existing HSN code
      setHsnCodes(prev =>
        prev.map(code =>
          code.id === editingHsnCodeId
            ? { ...hsnCodeForm, id: editingHsnCodeId }
            : code
        )
      );
      setModals(prev => ({ 
        ...prev, 
        hsnCodeModal: false,
        hsnCodeUpdatedModal: true 
      }));
    } else {
      // Create new HSN code
      const newCode = {
        ...hsnCodeForm,
        id: Date.now().toString(),
      };
      setHsnCodes(prev => [...prev, newCode]);
      setModals(prev => ({ 
        ...prev, 
        hsnCodeModal: false,
        hsnCodeCreatedModal: true 
      }));
    }
    setHsnCodeForm(DEFAULT_HSN_CODE_FORM);
    setEditingHsnCodeId(null);
  }, [hsnCodeForm, editingHsnCodeId]);

  const handleEditHsnCode = useCallback((code) => {
    setHsnCodeForm(code);
    setEditingHsnCodeId(code.id);
    setModals(prev => ({ ...prev, hsnCodeModal: true }));
  }, []);

  const handleDeleteHsnCode = useCallback((id) => {
    setEditingHsnCodeId(id);
    setModals(prev => ({ ...prev, deleteHsnCodeModal: true }));
  }, []);

  const handleConfirmDeleteHsnCode = useCallback(() => {
    setHsnCodes(prev => prev.filter(code => code.id !== editingHsnCodeId));
    setModals(prev => ({ 
      ...prev, 
      deleteHsnCodeModal: false,
      hsnCodeDeletedModal: true 
    }));
    setEditingHsnCodeId(null);
  }, [editingHsnCodeId]);

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

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-4xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          HSN Code Settings
        </h1>
      </div>

      {/* HSN Code Setting */}
      <div className="py-6 border-b border-gray-200">
        <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-2">
          HSN Code Setting
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Manage Harmonized System of Nomenclature (HSN) codes for product classification and tax purposes.
        </p>
        <ViewSettingsButton onClick={handleOpenHsnCodeModal} />
        
        {/* Existing HSN Codes List */}
        {hsnCodes.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-800 mb-2">Configured HSN Codes:</h4>
            {hsnCodes.map((code) => (
              <div key={code.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium text-lg">{code.code}</span>
                  {code.description && <div className="text-gray-600">{code.description}</div>}
                  <div className="text-sm text-gray-500">
                    {code.category && <span>Category: {code.category} | </span>}
                    {code.taxRate && <span>Tax Rate: {code.taxRate}%</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditHsnCode(code)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHsnCode(code.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HSN Code Modal */}
      {modals.hsnCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingHsnCodeId ? 'Edit' : 'Add'} HSN Code
                </h2>
                <button
                  onClick={handleCloseHsnCodeModal}
                  className="w-6 h-6 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-full h-full" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 6109.10.00"
                    value={hsnCodeForm.code}
                    onChange={(e) => handleHsnCodeFormChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what this HSN code covers"
                    value={hsnCodeForm.description}
                    onChange={(e) => handleHsnCodeFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Textiles, Electronics, etc."
                    value={hsnCodeForm.category}
                    onChange={(e) => handleHsnCodeFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 18"
                    value={hsnCodeForm.taxRate}
                    onChange={(e) => handleHsnCodeFormChange('taxRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleCloseHsnCodeModal}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHsnCode}
                  disabled={!hsnCodeForm.code}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingHsnCodeId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modals */}
      <SuccessModal
        isOpen={modals.hsnCodeCreatedModal}
        onClose={() => setModals(prev => ({ ...prev, hsnCodeCreatedModal: false }))}
        title="HSN Code Created"
        message="The HSN code has been successfully created."
      />

      <SuccessModal
        isOpen={modals.hsnCodeUpdatedModal}
        onClose={() => setModals(prev => ({ ...prev, hsnCodeUpdatedModal: false }))}
        title="HSN Code Updated"
        message="The HSN code has been successfully updated."
      />

      <SuccessModal
        isOpen={modals.hsnCodeDeletedModal}
        onClose={() => setModals(prev => ({ ...prev, hsnCodeDeletedModal: false }))}
        title="HSN Code Deleted"
        message="The HSN code has been successfully deleted."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.deleteHsnCodeModal}
        onClose={() => setModals(prev => ({ ...prev, deleteHsnCodeModal: false }))}
        onConfirm={handleConfirmDeleteHsnCode}
        title="Delete HSN Code"
        message="Are you sure you want to delete this HSN code? This action cannot be undone."
      />
    </div>
  );
};

export default SettingsHsnCode;
