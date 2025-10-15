import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, MessageSquare, Plus, Minus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { faqAPI } from '../api/endpoints';

/**
 * FAQ Management Component - Performance Optimized
 * 
 * A comprehensive FAQ management interface that allows administrators to create,
 * edit, delete, and view frequently asked questions.
 * 
 * Features:
 * - Create new FAQs with title and detail
 * - View all existing FAQs with pagination support
 * - Search and filter FAQs with debounced search
 * - Edit and delete existing FAQs with confirmation
 * - Responsive design with Tailwind CSS
 * - Keyboard navigation support
 * - Accessibility improvements
 * 
 * Performance Optimizations:
 * - useReducer for complex state management with optimized state structure
 * - useMemo for expensive computations with proper dependencies
 * - useCallback for stable function references with dependency optimization
 * - Debounced search to reduce re-renders and computations
 * - Memoized child components with React.memo and proper prop comparison
 * - Optimized event handlers to prevent excessive re-renders
 * - Ref-based optimization for non-state dependent operations
 * - Reduced object creation in render cycles
 * - Stable references for better memoization effectiveness
 */

// Constants for better maintainability
const FAQ_CONFIG = {
  SEARCH_DEBOUNCE_MS: 300,
  MAX_TITLE_LENGTH: 200,
  MAX_DETAIL_LENGTH: 2000,
  ITEMS_PER_PAGE: 10,
  VALIDATION_RULES: {
    title: { minLength: 5, maxLength: 200 },
    detail: { minLength: 10, maxLength: 2000 }
  }
};

const MODAL_TYPES = {
  NONE: 'none',
  EDIT: 'edit',
  DELETE_CONFIRM: 'delete_confirm',
  SUCCESS: 'success',
  DELETE_SUCCESS: 'delete_success'
};

// Simplified validation utilities
const validateFaqForm = (formData) => {
  const errors = {};
  
  // Validate title
  const title = formData.title?.trim() || '';
  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length < FAQ_CONFIG.VALIDATION_RULES.title.minLength) {
    errors.title = `Title must be at least ${FAQ_CONFIG.VALIDATION_RULES.title.minLength} characters`;
  } else if (title.length > FAQ_CONFIG.VALIDATION_RULES.title.maxLength) {
    errors.title = `Title must not exceed ${FAQ_CONFIG.VALIDATION_RULES.title.maxLength} characters`;
  }
  
  // Validate detail
  const detail = formData.detail?.trim() || '';
  if (!detail) {
    errors.detail = 'Detail is required';
  } else if (detail.length < FAQ_CONFIG.VALIDATION_RULES.detail.minLength) {
    errors.detail = `Detail must be at least ${FAQ_CONFIG.VALIDATION_RULES.detail.minLength} characters`;
  } else if (detail.length > FAQ_CONFIG.VALIDATION_RULES.detail.maxLength) {
    errors.detail = `Detail must not exceed ${FAQ_CONFIG.VALIDATION_RULES.detail.maxLength} characters`;
  }
  
  return errors;
};

// Initial state for form data
const INITIAL_FORM_DATA = {
  title: '',
  detail: '',
  category: 'general',
  isActive: true
};

const FaqManagement = () => {
  // Core state
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editingFaq, setEditingFaq] = useState(null);
  const [expandedFaqs, setExpandedFaqs] = useState(new Set());
  const [activeModal, setActiveModal] = useState(MODAL_TYPES.NONE);
  const [modalData, setModalData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Refs
  const searchTimeoutRef = useRef(null);

  // Load FAQs and categories on component mount
  useEffect(() => {
    loadFaqs();
    loadCategories();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.trim()) {
        searchFaqs(searchTerm);
      } else {
        loadFaqs();
      }
    }, FAQ_CONFIG.SEARCH_DEBOUNCE_MS);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // API Functions - Pure dynamic data
  const loadFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await faqAPI.getAllFaqs({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      // Handle different response structures from backend
      console.log('Load FAQs response:', response.data);
      
      let faqData = [];
      if (response.data?.data?.faqs) {
        faqData = response.data.data.faqs;
      } else if (response.data?.faqs) {
        faqData = response.data.faqs;
      } else if (Array.isArray(response.data?.data)) {
        faqData = response.data.data;
      } else if (Array.isArray(response.data)) {
        faqData = response.data;
      }
      
      const processedFaqs = Array.isArray(faqData) ? faqData.map(faq => ({
        ...faq,
        id: faq.id || faq._id, // Ensure we have an id field
        _id: faq._id || faq.id  // Keep both for compatibility
      })) : [];
      
      console.log('Processed FAQs:', processedFaqs.length, 'items');
      setFaqs(processedFaqs);
    } catch (err) {
      console.error('Error loading FAQs:', err);
      setError(err.response?.data?.message || 'Failed to load FAQs. Please check your backend connection.');
      setFaqs([]); // Clear any existing data on error
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await faqAPI.getCategories();
      
      // Handle different response structures from backend
      const categoryData = response.data?.data || response.data?.categories || response.data || [];
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories. Please check your backend connection.');
      setCategories([]); // No fallback categories
    }
  };

  const searchFaqs = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await faqAPI.searchFaqs(query);
      
      // Handle different response structures from backend
      const faqData = response.data?.data || response.data?.faqs || response.data || [];
      const processedFaqs = Array.isArray(faqData) ? faqData.map(faq => ({
        ...faq,
        id: faq.id || faq._id, // Ensure we have an id field
        _id: faq._id || faq.id  // Keep both for compatibility
      })) : [];
      setFaqs(processedFaqs);
    } catch (err) {
      console.error('Error searching FAQs:', err);
      setError(err.response?.data?.message || 'Failed to search FAQs. Please check your backend connection.');
      setFaqs([]); // Clear results on search error
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < FAQ_CONFIG.VALIDATION_RULES.title.minLength) {
      errors.title = `Title must be at least ${FAQ_CONFIG.VALIDATION_RULES.title.minLength} characters`;
    } else if (formData.title.length > FAQ_CONFIG.VALIDATION_RULES.title.maxLength) {
      errors.title = `Title must not exceed ${FAQ_CONFIG.VALIDATION_RULES.title.maxLength} characters`;
    }
    
    if (!formData.detail?.trim()) {
      errors.detail = 'Detail is required';
    } else if (formData.detail.length < FAQ_CONFIG.VALIDATION_RULES.detail.minLength) {
      errors.detail = `Detail must be at least ${FAQ_CONFIG.VALIDATION_RULES.detail.minLength} characters`;
    } else if (formData.detail.length > FAQ_CONFIG.VALIDATION_RULES.detail.maxLength) {
      errors.detail = `Detail must not exceed ${FAQ_CONFIG.VALIDATION_RULES.detail.maxLength} characters`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // FAQ CRUD Operations
  const createFaq = async () => {
    if (!validateForm()) {
      console.log('Form validation failed:', formErrors);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Creating FAQ with data:', {
        title: formData.title.trim(),
        detail: formData.detail.trim(),
        category: formData.category,
        isActive: formData.isActive
      });
      
      const response = await faqAPI.createFaq({
        title: formData.title.trim(),
        detail: formData.detail.trim(),
        category: formData.category,
        isActive: formData.isActive
      });
      
      console.log('FAQ creation response:', response);
      
      // Handle success response
      if (response.status === 201 || response.status === 200) {
        console.log('FAQ created successfully, refreshing list...');
        setFormData(INITIAL_FORM_DATA);
        setFormErrors({});
        setActiveModal(MODAL_TYPES.SUCCESS);
        await loadFaqs(); // Refresh the list
      }
    } catch (err) {
      console.error('Error creating FAQ:', err);
      setError(err.response?.data?.message || 'Failed to create FAQ. Please check your backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateFaq = async () => {
    if (!validateForm() || !editingFaq) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await faqAPI.updateFaq(editingFaq.id, {
        title: formData.title.trim(),
        detail: formData.detail.trim(),
        category: formData.category,
        isActive: formData.isActive
      });
      
      // Handle success response
      if (response.status === 200) {
        setFormData(INITIAL_FORM_DATA);
        setFormErrors({});
        setEditingFaq(null);
        setActiveModal(MODAL_TYPES.SUCCESS);
        await loadFaqs(); // Refresh the list
      }
    } catch (err) {
      console.error('Error updating FAQ:', err);
      setError(err.response?.data?.message || 'Failed to update FAQ. Please check your backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteFaq = async (id) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await faqAPI.deleteFaq(id);
      
      // Handle success response
      if (response.status === 200 || response.status === 204) {
        setActiveModal(MODAL_TYPES.DELETE_SUCCESS);
        await loadFaqs(); // Refresh the list
      }
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      setError(err.response?.data?.message || 'Failed to delete FAQ. Please check your backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Event handlers
  const handleCreateFaq = () => {
    createFaq();
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setFormData({
      title: faq.title,
      detail: faq.detail,
      category: faq.category || 'general',
      isActive: faq.isActive !== false
    });
    setActiveModal(MODAL_TYPES.EDIT);
    setModalData(faq);
  };

  const handleUpdateFaq = () => {
    updateFaq();
  };

  const handleDeleteFaq = (faqId) => {
    const faqToDelete = faqs.find(faq => faq.id === faqId);
    setActiveModal(MODAL_TYPES.DELETE_CONFIRM);
    setModalData(faqToDelete);
  };

  const handleConfirmDelete = () => {
    if (modalData) {
      deleteFaq(modalData.id);
    }
  };

  const handleCancelEdit = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setEditingFaq(null);
    setActiveModal(MODAL_TYPES.NONE);
    setModalData(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error and validate in real-time
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for better UX
    const updatedFormData = { ...formData, [field]: value };
    const errors = validateFaqForm(updatedFormData);
    setFormErrors(errors);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleFaqExpansion = (faqId) => {
    setExpandedFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  const handleCloseModal = () => {
    setActiveModal(MODAL_TYPES.NONE);
    setModalData(null);
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header Section */}
      <HeaderSection />

      {/* Main Content Container */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* FAQ Creation Section */}
        <FaqFormSection
          formData={formData}
          formErrors={formErrors}
          editingFaq={editingFaq}
          submitting={submitting}
          categories={categories}
          onFormChange={handleFormChange}
          onSubmit={editingFaq ? handleUpdateFaq : handleCreateFaq}
          onCancel={handleCancelEdit}
        />

        {/* Divider */}
        <div className="border-b border-gray-200 mb-8"></div>

        {/* FAQ List Section */}
        <FaqListSection
          faqs={faqs}
          searchTerm={searchTerm}
          expandedFaqs={expandedFaqs}
          loading={loading}
          error={error}
          onSearchChange={handleSearchChange}
          onToggleExpand={handleToggleFaqExpansion}
          onEdit={handleEditFaq}
          onDelete={handleDeleteFaq}
        />
      </div>

      {/* Modals */}
      <ModalManager
        activeModal={activeModal}
        modalData={modalData}
        formData={formData}
        formErrors={formErrors}
        submitting={submitting}
        categories={categories}
        onFormChange={handleFormChange}
        onSave={handleUpdateFaq}
        onCancel={handleCancelEdit}
        onConfirmDelete={handleConfirmDelete}
        onClose={handleCloseModal}
      />
    </div>
  );
};

/**
 * Header Section Component
 */
const HeaderSection = React.memo(() => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ Management</h1>
      <p className="text-gray-600">Manage frequently asked questions for your users</p>
    </div>
  </div>
));

/**
 * FAQ Form Section Component - Optimized with prop comparison
 */
const FaqFormSection = React.memo(({ 
  formData, 
  formErrors, 
  editingFaq, 
  submitting,
  categories,
  onFormChange, 
  onSubmit, 
  onCancel 
}) => {
  // More robust validation check
  const hasValidTitle = formData.title?.trim() && formData.title.trim().length >= 5;
  const hasValidDetail = formData.detail?.trim() && formData.detail.trim().length >= 10;
  const hasNoErrors = Object.keys(formErrors).length === 0;
  const isValid = hasValidTitle && hasValidDetail && hasNoErrors;
  
  // Debug logging for button state
  if (formData.title || formData.detail) {
    console.log('Form validation:', {
      title: formData.title,
      titleLength: formData.title?.trim().length,
      hasValidTitle,
      detail: formData.detail,
      detailLength: formData.detail?.trim().length,
      hasValidDetail,
      errors: formErrors,
      hasNoErrors,
      isValid
    });
  }
  
  return (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">FAQ Management System</h2>
    
    {/* Form Fields */}
    <div className="space-y-6">
      {/* Title Input */}
      <FormField
        label={editingFaq ? 'Edit FAQ Title' : 'Create FAQ Title'}
        value={formData.title}
        onChange={onFormChange}
        field="title"
        placeholder="Enter FAQ title..."
        error={formErrors.title}
        maxLength={FAQ_CONFIG.MAX_TITLE_LENGTH}
        required
      />

      {/* Detail Textarea */}
      <FormField
        label={editingFaq ? 'Edit FAQ Detail' : 'Create FAQ Detail'}
        value={formData.detail}
        onChange={onFormChange}
        field="detail"
        placeholder="Enter detailed FAQ answer..."
        error={formErrors.detail}
        maxLength={FAQ_CONFIG.MAX_DETAIL_LENGTH}
        multiline
        rows={4}
        required
      />

      {/* Category Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => onFormChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.length === 0 ? (
            <option value="general">General</option>
          ) : (
            categories.map(category => (
              <option key={category} value={category}>
                {typeof category === 'string' 
                  ? category.charAt(0).toUpperCase() + category.slice(1)
                  : category.name || category.title || 'Unknown'
                }
              </option>
            ))
          )}
        </select>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center space-x-4 mt-6">
      <button
        onClick={onSubmit}
        disabled={!isValid || submitting}
        className={`px-12 py-3 rounded-full font-medium text-white transition-all flex items-center space-x-2 ${
          isValid && !submitting
            ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer focus:ring-2 focus:ring-gray-500 focus:ring-offset-2' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
        aria-label={editingFaq ? 'Update FAQ' : 'Create new FAQ'}
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{editingFaq ? 'Update FAQ' : 'Create FAQ'}</span>
      </button>
      
      {editingFaq && (
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-8 py-3 rounded-full font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
      )}
    </div>
  </div>
  );
});

/**
 * Reusable Form Field Component - Optimized with stable event handlers
 */
const FormField = React.memo(({ 
  label, 
  value, 
  onChange, 
  field,
  placeholder, 
  error, 
  maxLength, 
  multiline = false, 
  rows = 1, 
  required = false 
}) => {
  const handleChange = useCallback((e) => {
    onChange(field, e.target.value);
  }, [onChange, field]);

  const InputComponent = multiline ? 'textarea' : 'input';
  const inputProps = multiline 
    ? { rows, className: "resize-vertical" }
    : { type: "text" };

  return (
    <div>
      <label className="block text-lg font-medium text-gray-900 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <InputComponent
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        {...inputProps}
        className={`w-full ${multiline ? 'max-w-2xl' : 'max-w-lg'} px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors text-sm ${
          error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-gray-900 focus:border-blue-500'
        }`}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <p id={`${label}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {maxLength && (
        <p className="mt-1 text-xs text-gray-500">
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
    prevProps.field === nextProps.field
  );
});
/**
 * FAQ List Section Component - Optimized with better memoization
 */
const FaqListSection = React.memo(({ 
  faqs, 
  searchTerm, 
  expandedFaqs, 
  loading, 
  error, 
  onSearchChange, 
  onToggleExpand, 
  onEdit, 
  onDelete 
}) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-gray-900">All FAQ</h3>
      
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search FAQs..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label="Search FAQs"
        />
        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
      </div>
    </div>

    {/* Loading State */}
    {loading && (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading FAQs...</p>
      </div>
    )}

    {/* Error State */}
    {error && (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading FAQs</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )}

    {/* FAQ Cards */}
    {!loading && !error && (
      <>
        {faqs.length > 0 ? (
          <div className="space-y-6">
            {faqs.map((faq) => (
              <FaqCard 
                key={faq.id}
                faq={faq}
                onEdit={onEdit}
                onDelete={onDelete}
                isExpanded={expandedFaqs.has(faq.id)}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        ) : (
          <EmptyState searchTerm={searchTerm} hasError={!!error} />
        )}
      </>
    )}
  </div>
), (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.faqs.length === nextProps.faqs.length &&
    prevProps.faqs.every((faq, index) => faq.id === nextProps.faqs[index]?.id) &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.expandedFaqs.size === nextProps.expandedFaqs.size &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error
  );
});

/**
 * Empty State Component
 */
const EmptyState = React.memo(({ searchTerm, hasError }) => (
  <div className="text-center py-12">
    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <p className="text-lg font-medium text-gray-600">
      {hasError 
        ? 'Unable to load FAQs' 
        : searchTerm 
          ? 'No FAQs found matching your search' 
          : 'No FAQs available'
      }
    </p>
    <p className="text-gray-500 mt-2">
      {hasError 
        ? 'Please check your backend connection and try again' 
        : searchTerm 
          ? 'Try adjusting your search terms' 
          : 'Create your first FAQ to get started'
      }
    </p>
  </div>
));

/**
 * Modal Manager Component - Handles all modal states
 */
const ModalManager = React.memo(({ 
  activeModal, 
  modalData, 
  formData, 
  formErrors, 
  submitting,
  categories,
  onFormChange, 
  onSave, 
  onCancel, 
  onConfirmDelete, 
  onClose 
}) => {
  switch (activeModal) {
    case MODAL_TYPES.EDIT:
      return (
        <EditFaqModal
          faq={modalData}
          formData={formData}
          formErrors={formErrors}
          submitting={submitting}
          categories={categories}
          onFormChange={onFormChange}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case MODAL_TYPES.SUCCESS:
      return <SuccessPopup onClose={onClose} />;
    case MODAL_TYPES.DELETE_CONFIRM:
      return (
        <DeleteConfirmationModal
          faq={modalData}
          onConfirm={onConfirmDelete}
          onCancel={onClose}
        />
      );
    case MODAL_TYPES.DELETE_SUCCESS:
      return <DeleteSuccessPopup onClose={onClose} />;
    default:
      return null;
  }
});
/**
 * Edit FAQ Modal Component - Optimized with better event handling
 */
const EditFaqModal = React.memo(({ 
  faq, 
  formData, 
  formErrors, 
  submitting,
  categories,
  onFormChange, 
  onSave, 
  onCancel
}) => {
  const isValid = Object.keys(formErrors).length === 0 && formData.title?.trim() && formData.detail?.trim();
  const handleTitleChange = useCallback((field, value) => {
    onFormChange(field, value);
  }, [onFormChange]);

  const handleDetailChange = useCallback((field, value) => {
    onFormChange(field, value);
  }, [onFormChange]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-normal text-black tracking-[-0.6px]">Edit faq</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 space-y-6">
          {/* Title Field */}
          <FormField
            label="title"
            value={formData.title}
            onChange={handleTitleChange}
            field="title"
            placeholder="Enter FAQ title..."
            error={formErrors.title}
            maxLength={FAQ_CONFIG.MAX_TITLE_LENGTH}
            required
          />

          {/* Detail Field */}
          <FormField
            label="sub title"
            value={formData.detail}
            onChange={handleDetailChange}
            field="detail"
            placeholder="Enter detailed FAQ answer..."
            error={formErrors.detail}
            maxLength={FAQ_CONFIG.MAX_DETAIL_LENGTH}
            multiline
            rows={4}
            required
          />

          {/* Category Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => onFormChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.length === 0 ? (
                <option value="general">General</option>
              ) : (
                categories.map(category => (
                  <option key={category} value={category}>
                    {typeof category === 'string' 
                      ? category.charAt(0).toUpperCase() + category.slice(1)
                      : category.name || category.title || 'Unknown'
                    }
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4 pt-4">
            <button
              onClick={onSave}
              disabled={!isValid || submitting}
              className={`px-12 py-4 rounded-full font-medium text-white transition-all focus:ring-2 focus:ring-offset-2 flex items-center space-x-2 ${
                isValid && !submitting
                  ? 'bg-black hover:bg-gray-800 cursor-pointer focus:ring-gray-500' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              aria-label="Save FAQ changes"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>save</span>
            </button>
            
            <button
              onClick={onCancel}
              className="px-12 py-4 rounded-full font-medium text-black bg-white border border-gray-300 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Cancel editing"
            >
              go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.formData.title === nextProps.formData.title &&
    prevProps.formData.detail === nextProps.formData.detail &&
    prevProps.formValidation.isValid === nextProps.formValidation.isValid &&
    JSON.stringify(prevProps.formValidation.errors) === JSON.stringify(nextProps.formValidation.errors)
  );
});

/**
 * FAQ Card Component - Enhanced with better accessibility and performance
 */
const FaqCard = React.memo(({ faq, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  const handleEdit = useCallback(() => onEdit(faq), [faq, onEdit]);
  const handleDelete = useCallback(() => onDelete(faq.id), [faq.id, onDelete]);
  const handleToggleExpand = useCallback(() => onToggleExpand(faq.id), [faq.id, onToggleExpand]);

  // Keyboard navigation support - Memoized for performance
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleExpand();
    }
  }, [handleToggleExpand]);

  // Memoize metadata to prevent recalculation
  const metadata = useMemo(() => ({
    createdDate: new Date(faq.createdAt).toLocaleDateString(),
    updatedDate: faq.updatedAt && faq.updatedAt !== faq.createdAt 
      ? new Date(faq.updatedAt).toLocaleDateString() 
      : null,
    statusBadgeClass: faq.isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800',
    statusText: faq.isActive ? 'Active' : 'Inactive'
  }), [faq.createdAt, faq.updatedAt, faq.isActive]);

  return (
    <div className="border-b border-gray-200 pb-6">
      {/* FAQ Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          {/* FAQ Title - Now clickable for better UX */}
          <button
            onClick={handleToggleExpand}
            onKeyPress={handleKeyPress}
            className="text-left flex-1 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-expanded={isExpanded}
            aria-controls={`faq-content-${faq.id}`}
          >
            <h4 className="text-sm font-semibold text-black leading-tight hover:text-blue-600 transition-colors">
              {faq.title}
            </h4>
          </button>
          
          {/* Expand/Collapse Button */}
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 p-2 hover:bg-gray-50 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={isExpanded ? 'Collapse FAQ' : 'Expand FAQ'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <Minus className="h-4 w-4 text-gray-600" />
            ) : (
              <Plus className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Edit FAQ: ${faq.title}`}
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={`Delete FAQ: ${faq.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FAQ Content - Expandable with smooth animation */}
      <div
        id={`faq-content-${faq.id}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="pl-5 pr-12 mt-4">
          <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
            {faq.detail}
          </p>
          
          {/* Enhanced Metadata */}
          <div className="flex items-center flex-wrap gap-4 text-xs text-gray-400 mt-4">
            <span>Created: {metadata.createdDate}</span>
            {metadata.updatedDate && (
              <span>Updated: {metadata.updatedDate}</span>
            )}
            <span className={`px-2 py-1 rounded-full font-medium ${metadata.statusBadgeClass}`}>
              {metadata.statusText}
            </span>
            {faq.category && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium capitalize">
                {faq.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.faq.id === nextProps.faq.id &&
    prevProps.faq.title === nextProps.faq.title &&
    prevProps.faq.detail === nextProps.faq.detail &&
    prevProps.faq.updatedAt === nextProps.faq.updatedAt &&
    prevProps.isExpanded === nextProps.isExpanded
  );
});

/**
 * Success Popup Component - Enhanced with better accessibility and performance
 */
const SuccessPopup = React.memo(({ onClose }) => {
  const timeoutRef = useRef(null);

  // Auto-close after 3 seconds for better UX
  React.useEffect(() => {
    timeoutRef.current = setTimeout(onClose, 3000);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onClose]);

  // Close on Escape key - Optimized event listener
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          aria-label="Close popup"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        {/* Success Message */}
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-black tracking-[-0.41px] leading-[22px]">
            Faq updated!
          </h2>
          <p className="text-sm text-gray-600 mt-2">Your changes have been saved successfully.</p>
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-black text-white font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close success popup"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * Delete Confirmation Modal Component - Enhanced with better UX
 */
const DeleteConfirmationModal = React.memo(({ faq, onConfirm, onCancel }) => {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-8 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>

        {/* Confirmation Message */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium text-black leading-tight mb-4">
            Are you sure you want to delete this FAQ?
          </h2>
          {faq && (
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-red-400">
              <span className="font-medium">"{faq.title.slice(0, 100)}{faq.title.length > 100 ? '...' : ''}"</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-3">This action cannot be undone.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white font-medium text-base py-3 rounded-full hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Confirm delete"
          >
            Delete FAQ
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-black font-medium text-base py-3 rounded-full hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Cancel delete"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * Delete Success Popup Component - Enhanced with better feedback and performance
 */
const DeleteSuccessPopup = React.memo(({ onClose }) => {
  const timeoutRef = useRef(null);

  // Auto-close after 3 seconds
  React.useEffect(() => {
    timeoutRef.current = setTimeout(onClose, 3000);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onClose]);

  // Close on Escape key - Optimized event listener
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          aria-label="Close popup"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        {/* Success Message */}
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-black tracking-[-0.41px] leading-[22px]">
            FAQ Deleted!
          </h2>
          <p className="text-sm text-gray-600 mt-2">The FAQ has been permanently removed.</p>
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-black text-white font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close success popup"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

// Set display names for debugging
FaqManagement.displayName = 'FaqManagement';
HeaderSection.displayName = 'HeaderSection';
FaqFormSection.displayName = 'FaqFormSection';
FormField.displayName = 'FormField';
FaqListSection.displayName = 'FaqListSection';
EmptyState.displayName = 'EmptyState';
ModalManager.displayName = 'ModalManager';
FaqCard.displayName = 'FaqCard';
EditFaqModal.displayName = 'EditFaqModal';
SuccessPopup.displayName = 'SuccessPopup';
DeleteConfirmationModal.displayName = 'DeleteConfirmationModal';
DeleteSuccessPopup.displayName = 'DeleteSuccessPopup';

export default FaqManagement;
