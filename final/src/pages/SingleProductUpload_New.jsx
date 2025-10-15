import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { itemAPI, filterAPI } from '../api/endpoints';

const ItemManagementSingleProductUpload = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // State for form data with ALL FIELDS
  const [formData, setFormData] = useState({
    productName: '',
    title: '',
    description: '',
    manufacturingDetails: '',
    shippingReturns: '',
    sizes: [
      {
        id: 1,
        sizeName: '',
        quantity: '',
        hsn: '',
        regularPrice: '',
        salePrice: '',
        sku: '',
        barcodeNo: '',
        // Measurements in cm
        waistCm: '',
        inseamCm: '',
        chestCm: '',
        frontLengthCm: '',
        acrossShoulderCm: '',
        frontLengthCm2: '', // second front length field
        // Measurements in inches
        waistIn: '',
        inseamIn: '',
        chestIn: '',
        frontLengthIn: '',
        acrossShoulderIn: '',
        // Meta fields for this variant
        metaTitle: '',
        metaDescription: '',
        slugUrl: '',
        // Filters for this size variant
        filters: [], // Array of { key, value, code } objects
      },
      {
        id: 2,
        sizeName: '',
        quantity: '',
        hsn: '',
        regularPrice: '',
        salePrice: '',
        sku: '',
        barcodeNo: '',
        // Measurements in cm
        waistCm: '',
        inseamCm: '',
        chestCm: '',
        frontLengthCm: '',
        acrossShoulderCm: '',
        frontLengthCm2: '',
        // Measurements in inches
        waistIn: '',
        inseamIn: '',
        chestIn: '',
        frontLengthIn: '',
        acrossShoulderIn: '',
        // Meta fields for this variant
        metaTitle: '',
        metaDescription: '',
        slugUrl: '',
        // Filters for this size variant
        filters: [], // Array of { key, value, code } objects
      }
    ]
  });

  // SKU generation helper function
  const generateSKU = useCallback((productName, sizeName, index) => {
    const timestamp = Date.now();
    const productSlug = productName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
    const sizeSlug = sizeName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
    return `${productSlug}-${sizeSlug}-${timestamp}-${index}`.toUpperCase();
  }, []);

  // Auto-generate SKU when product name or size name changes
  const updateSKUForSize = useCallback((sizeIndex, newSizeName = null, newProductName = null) => {
    const currentProductName = newProductName || formData.productName;
    const currentSizeName = newSizeName || formData.sizes[sizeIndex]?.sizeName;
    
    if (currentProductName && currentSizeName) {
      const newSKU = generateSKU(currentProductName, currentSizeName, sizeIndex);
      setFormData(prev => ({
        ...prev,
        sizes: prev.sizes.map((size, index) => 
          index === sizeIndex ? { ...size, sku: newSKU } : size
        )
      }));
    }
  }, [formData.productName, formData.sizes, generateSKU]);

  const [stockSizeOption, setStockSizeOption] = useState('noSize');
  
  // State for available filters
  const [availableFilters, setAvailableFilters] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [sizeFilterSelections, setSizeFilterSelections] = useState({}); // Track filter key selections per size

  // Load product data if in edit mode - STABLE useEffect
  useEffect(() => {
    if (isEditMode && id) {
      loadProductData();
    }
  }, []); // Empty dependency array - only run once

  // Load available filters on component mount
  useEffect(() => {
    loadAvailableFilters();
  }, []);

  // API Functions - STABLE callbacks
  const loadAvailableFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      const response = await filterAPI.getAllFilters();
      const filters = response.data?.success ? response.data.data : response.data;
      setAvailableFilters(filters || []);
    } catch (err) {
      console.error('Failed to load filters:', err);
      setError('Failed to load available filters');
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  const loadProductData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await itemAPI.getItemById(id);
      const productData = response.data?.success ? response.data.data : response.data;
      
      // Populate form with existing data including ALL FIELDS
      setFormData({
        productName: productData.productName || '',
        title: productData.title || '',
        description: productData.description || '',
        manufacturingDetails: productData.manufacturingDetails || '',
        shippingReturns: productData.shippingReturns || '',
        sizes: productData.sizes && productData.sizes.length > 0 ? productData.sizes : [
          {
            id: 1,
            sizeName: '',
            quantity: '',
            hsn: '',
            regularPrice: '',
            salePrice: '',
            sku: '',
            barcodeNo: '',
            waistCm: '',
            inseamCm: '',
            chestCm: '',
            frontLengthCm: '',
            acrossShoulderCm: '',
            frontLengthCm2: '',
            waistIn: '',
            inseamIn: '',
            chestIn: '',
            frontLengthIn: '',
            acrossShoulderIn: '',
            metaTitle: '',
            metaDescription: '',
            slugUrl: '',
          },
          {
            id: 2,
            sizeName: '',
            quantity: '',
            hsn: '',
            regularPrice: '',
            salePrice: '',
            sku: '',
            barcodeNo: '',
            waistCm: '',
            inseamCm: '',
            chestCm: '',
            frontLengthCm: '',
            acrossShoulderCm: '',
            frontLengthCm2: '',
            waistIn: '',
            inseamIn: '',
            chestIn: '',
            frontLengthIn: '',
            acrossShoulderIn: '',
            metaTitle: '',
            metaDescription: '',
            slugUrl: '',
          }
        ]
      });
      
      // Set size option based on whether sizes exist
      setStockSizeOption(productData.sizes && productData.sizes.length > 0 ? 'addSize' : 'noSize');
      
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]); // Stable dependency

  const saveProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Basic validation
      if (!formData.productName.trim()) {
        setError('Product name is required');
        return;
      }
      
      if (!formData.description.trim()) {
        setError('Product description is required');
        return;
      }

      // SKU validation for sizes
      if (stockSizeOption === 'addSize') {
        const sizesWithContent = formData.sizes.filter(size => 
          size.sizeName?.trim() || size.quantity || size.regularPrice || size.salePrice
        );
        
        for (let i = 0; i < sizesWithContent.length; i++) {
          const size = sizesWithContent[i];
          if (!size.sku || !size.sku.trim()) {
            // Auto-generate SKU if missing
            const generatedSKU = generateSKU(formData.productName, size.sizeName || `Size-${i+1}`, i);
            size.sku = generatedSKU;
            console.log(`Auto-generated SKU for size ${size.sizeName || i+1}:`, generatedSKU);
          }
          
          if (!size.sizeName?.trim()) {
            setError(`Size name is required for size ${i + 1}. Please fill in all size details or remove empty sizes.`);
            return;
          }
        }
      }

      // Add timestamp to product name to avoid duplicates during testing
      const uniqueProductName = isEditMode ? formData.productName : `${formData.productName} ${Date.now()}`;

      // Check authentication
      const token = localStorage.getItem('authToken');
      if (!token || token === 'null' || token === 'undefined') {
        setError('Please log in to continue');
        return;
      }

      // Prepare data for API - fix field name mismatch
      const productData = {
        productName: uniqueProductName,
        title: formData.title,
        description: formData.description,
        manufacturingDetails: formData.manufacturingDetails,
        shippingAndReturns: formData.shippingReturns, // Backend expects 'shippingAndReturns'
        returnable: true,
        sizes: stockSizeOption === 'addSize' ? formData.sizes.map(size => ({
          size: size.sizeName, // Map sizeName to size
          quantity: parseInt(size.quantity) || 0,
          stock: parseInt(size.quantity) || 0, // Backend expects stock field
          hsnCode: size.hsn, // Map hsn to hsnCode
          sku: size.sku,
          barcode: size.barcodeNo, // Map barcodeNo to barcode
          regularPrice: parseFloat(size.regularPrice) || 0,
          salePrice: parseFloat(size.salePrice) || 0,
          // Measurements in cm - map to correct backend fields
          fitWaistCm: parseFloat(size.waistCm) || 0, // Map waistCm to fitWaistCm
          inseamLengthCm: parseFloat(size.inseamCm) || 0, // Map inseamCm to inseamLengthCm
          chestCm: parseFloat(size.chestCm) || 0,
          frontLengthCm: parseFloat(size.frontLengthCm) || 0,
          acrossShoulderCm: parseFloat(size.acrossShoulderCm) || 0,
          // Measurements in inches - map to correct backend fields
          toFitWaistIn: parseFloat(size.waistIn) || 0, // Map waistIn to toFitWaistIn
          inseamLengthIn: parseFloat(size.inseamIn) || 0, // Map inseamIn to inseamLengthIn
          chestIn: parseFloat(size.chestIn) || 0,
          frontLengthIn: parseFloat(size.frontLengthIn) || 0,
          acrossShoulderIn: parseFloat(size.acrossShoulderIn) || 0,
          // Meta fields
          metaTitle: size.metaTitle || '',
          metaDescription: size.metaDescription || '',
          slugUrl: size.slugUrl || '',
        })) : []
      };

      let response;
      if (isEditMode) {
        // Update existing product
        response = await itemAPI.updateItem(id, productData);
        setSuccess('Product updated successfully!');
      } else {
        // Create new product using the createBasicProduct endpoint for Phase 1
        response = await itemAPI.createBasicProduct(productData);
        setSuccess('Product created successfully!');
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        navigate('/item-management-new');
      }, 3000);

    } catch (error) {
      console.error('Error saving product:', error);
      
      // Enhanced error message handling
      let errorMessage = 'Failed to save product. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid product data. Please check all fields.';
        if (errorMessage.includes('already exists')) {
          errorMessage = 'A product with this name already exists. Please use a different name.';
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again or contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, stockSizeOption, isEditMode, id, navigate]);

  const deleteProduct = useCallback(async () => {
    if (!isEditMode || !id) return;
    
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await itemAPI.deleteItem(id);
      setSuccess('Product deleted successfully!');
      
      setTimeout(() => {
        navigate('/item-management-new');
      }, 2000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, navigate]);

  // Handle form changes - STABLE handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate SKUs when product name changes
    if (field === 'productName' && value.trim()) {
      formData.sizes.forEach((size, index) => {
        if (size.sizeName) {
          updateSKUForSize(index, size.sizeName, value);
        }
      });
    }
  }, [formData.sizes, updateSKUForSize]);

  const handleSizeChange = useCallback((sizeIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, index) => 
        index === sizeIndex ? { ...size, [field]: value } : size
      )
    }));
    
    // Auto-generate SKU when size name changes
    if (field === 'sizeName' && value.trim() && formData.productName.trim()) {
      updateSKUForSize(sizeIndex, value, formData.productName);
    }
  }, [formData.productName, updateSKUForSize]);

  const addNewSize = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, {
        id: prev.sizes.length + 1,
        sizeName: '',
        quantity: '',
        hsn: '',
        regularPrice: '',
        salePrice: '',
        sku: '',
        barcodeNo: '',
        waistCm: '',
        inseamCm: '',
        chestCm: '',
        frontLengthCm: '',
        acrossShoulderCm: '',
        frontLengthCm2: '',
        waistIn: '',
        inseamIn: '',
        chestIn: '',
        frontLengthIn: '',
        acrossShoulderIn: '',
        metaTitle: '',
        metaDescription: '',
        slugUrl: '',
        filters: [], // Empty filters array for new size
      }]
    }));
  }, []);

  // Filter handling functions for sizes
  const addFilterToSize = useCallback((sizeIndex, filterKey, filterValue, filterCode = '') => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, index) => 
        index === sizeIndex 
          ? { 
              ...size, 
              filters: [...(size.filters || []), { key: filterKey, value: filterValue, code: filterCode }] 
            }
          : size
      )
    }));
  }, []);

  const removeFilterFromSize = useCallback((sizeIndex, filterIndex) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, index) => 
        index === sizeIndex 
          ? { 
              ...size, 
              filters: (size.filters || []).filter((_, idx) => idx !== filterIndex) 
            }
          : size
      )
    }));
  }, []);

  // Get filter values for a specific filter key
  const getFilterValuesByKey = useCallback((filterKey) => {
    const filter = availableFilters.find(f => f.key === filterKey);
    return filter?.values || [];
  }, [availableFilters]);

  // Handle filter key selection change
  const handleFilterKeyChange = useCallback((sizeIndex, selectedKey) => {
    setSizeFilterSelections(prev => ({
      ...prev,
      [sizeIndex]: {
        ...prev[sizeIndex],
        selectedKey: selectedKey,
        selectedValue: '' // Reset selected value when key changes
      }
    }));
  }, []);

  // Handle filter value selection change
  const handleFilterValueChange = useCallback((sizeIndex, selectedValue) => {
    setSizeFilterSelections(prev => ({
      ...prev,
      [sizeIndex]: {
        ...prev[sizeIndex],
        selectedValue: selectedValue
      }
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    saveProduct();
  }, [saveProduct]);

  return (
    <div className="relative w-full bg-white overflow-auto" style={{ height: `${2600 + (Math.max(0, formData.sizes.length - 2) * 700)}px` }}>
      {/* Header */}
      <div className="absolute left-[65px] top-[65px]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/item-management-new')}
            className="flex items-center justify-center w-[44px] h-[44px] bg-white border border-[#d0d5dd] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
          >
            <ArrowLeft className="w-5 h-5 text-[#667085]" />
          </button>
          
          <h1 className="font-['Montserrat'] font-semibold text-[30px] text-[#101828] leading-[38px]">
            {isEditMode ? 'Edit Product' : 'Add Product'}
          </h1>

          {isEditMode && (
            <button
              type="button"
              onClick={deleteProduct}
              disabled={loading}
              className="flex items-center justify-center w-[44px] h-[44px] bg-red-500 border border-red-600 rounded-[8px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute left-[65px] top-[120px] right-[65px] bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="absolute left-[65px] top-[120px] right-[65px] bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Main Form */}
      <div className="absolute left-[5px] top-[160px]">
        <form onSubmit={handleSubmit}>
          {/* Left Column - Basic Info */}
          <div className="relative">
            {/* Product Name */}
            <div className="absolute left-[64px] top-[54px]">
              <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
                Product Name
              </label>
            </div>
            <div className="absolute left-[64px] top-[74px]">
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="w-[500px] h-[48px] border-2 border-black rounded-[12px] px-4 font-['Montserrat']"
                placeholder="Enter product name"
              />
            </div>

            {/* Title */}
            <div className="absolute left-[5px] top-[153px]">
              <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
                Title
              </label>
            </div>
            <div className="absolute left-[5px] top-[173px]">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-[500px] h-[48px] border-2 border-black rounded-[12px] px-4 font-['Montserrat']"
                placeholder="Enter product title"
              />
            </div>

            {/* Description */}
            <div className="absolute left-[5px] top-[252px]">
              <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
                Description
              </label>
            </div>
            <div className="absolute left-[5px] top-[272px]">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-[500px] h-[154px] border-2 border-black rounded-[12px] p-4 font-['Montserrat'] resize-none"
                placeholder="Enter product description"
              />
            </div>

            {/* Manufacturing Details */}
            <div className="absolute left-[5px] top-[453px]">
              <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
                Manufacturing Details
              </label>
            </div>
            <div className="absolute left-[5px] top-[473px]">
              <textarea
                value={formData.manufacturingDetails}
                onChange={(e) => handleInputChange('manufacturingDetails', e.target.value)}
                className="w-[500px] h-[154px] border-2 border-black rounded-[12px] p-4 font-['Montserrat'] resize-none"
                placeholder="Enter manufacturing details"
              />
            </div>

            {/* Shipping Returns and Exchange */}
            <div className="absolute left-[5px] top-[653px]">
              <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
                Shipping returns and exchange
              </label>
            </div>
            <div className="absolute left-[5px] top-[673px]">
              <textarea
                value={formData.shippingReturns}
                onChange={(e) => handleInputChange('shippingReturns', e.target.value)}
                className="w-[500px] h-[154px] border-2 border-black rounded-[12px] p-4 font-['Montserrat'] resize-none"
                placeholder="Enter shipping and return policy"
              />
            </div>
          </div>

          {/* Stock Size Section */}
          <div className="absolute left-[65px] top-[876px]">
            <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
              Stock size
            </label>
          </div>

          {/* No Size Button */}
          <div className="absolute left-[66px] top-[903px]">
            <button
              type="button"
              onClick={() => setStockSizeOption('noSize')}
              className={`px-4 py-2 rounded-[8px] font-['Montserrat'] text-[14px] font-normal leading-[20px] ${
                stockSizeOption === 'noSize'
                  ? 'bg-[#000aff] text-white border border-[#7280ff]'
                  : 'bg-white text-black border border-[#d0d5dd]'
              } shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]`}
            >
              No size
            </button>
          </div>

          {/* Add Size Button */}
          <div className="absolute left-[172px] top-[903px]">
            <button
              type="button"
              onClick={() => setStockSizeOption('addSize')}
              className={`w-[81px] px-4 py-2 rounded-[8px] font-['Montserrat'] text-[14px] font-normal leading-[20px] ${
                stockSizeOption === 'addSize'
                  ? 'bg-[#000aff] text-white border border-[#7280ff]'
                  : 'bg-white text-black border border-[#d0d5dd]'
              } shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]`}
            >
              Add size
            </button>
          </div>

          {/* Size Input Fields */}
          {stockSizeOption === 'addSize' && (
            <>
              {formData.sizes.map((size, sizeIndex) => {
                const baseTop = 967 + (sizeIndex * 700);
                
                return (
                  <div key={size.id || sizeIndex}>
                    {/* Size Header */}
                    <div className="absolute left-[50px]" style={{ top: `${baseTop}px` }}>
                      <label className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px]">
                        size {sizeIndex + 1}
                      </label>
                    </div>

                    {/* Size Top Row Fields */}
                    <div className="absolute left-[53px]" style={{ top: `${baseTop + 41}px` }}>
                      <div className="flex space-x-4">
                        {/* Size */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">Size</p>
                          <input
                            type="text"
                            value={size.sizeName || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'sizeName', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>
                        
                        {/* Quantity */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">Quantity</p>
                          <input
                            type="number"
                            value={size.quantity || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'quantity', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* Hsn */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">Hsn</p>
                          <input
                            type="text"
                            value={size.hsn || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'hsn', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* Regular price */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">Regular price</p>
                          <input
                            type="number"
                            value={size.regularPrice || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'regularPrice', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* Sale price */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">Sale price</p>
                          <input
                            type="number"
                            value={size.salePrice || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'salePrice', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* SKU */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">
                            SKU <span className="text-red-500">*</span>
                            {!size.sku && size.sizeName && formData.productName && (
                              <button
                                type="button"
                                onClick={() => updateSKUForSize(sizeIndex, size.sizeName, formData.productName)}
                                className="ml-1 text-xs text-blue-500 hover:text-blue-700"
                                title="Generate SKU"
                              >
                                [Auto]
                              </button>
                            )}
                          </p>
                          <input
                            type="text"
                            value={size.sku || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'sku', e.target.value)}
                            className={`w-[118px] h-[47px] border-2 rounded-[12px] px-2 ${
                              !size.sku && (size.sizeName || size.quantity || size.regularPrice) 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-black'
                            }`}
                            placeholder="Auto-gen"
                            required={stockSizeOption === 'addSize'}
                          />
                          {!size.sku && (size.sizeName || size.quantity || size.regularPrice) && (
                            <p className="text-xs text-red-500 mt-1">Required for live products</p>
                          )}
                        </div>

                        {/* Barcode no */}
                        <div>
                          <p className="font-['Montserrat'] text-[14px] text-black mb-1">barcode no.</p>
                          <input
                            type="text"
                            value={size.barcodeNo || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'barcodeNo', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Size Measurements Row */}
                    <div className="absolute left-[53px]" style={{ top: `${baseTop + 120}px` }}>
                      <div className="flex space-x-4">
                        {/* to fit waist (cm) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">to fit waist (cm)</p>
                          <input
                            type="number"
                            value={size.waistCm || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'waistCm', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* inseam length (cm) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">inseam length (cm)</p>
                          <input
                            type="number"
                            value={size.inseamCm || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'inseamCm', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* chest (cm) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">chest (cm)</p>
                          <input
                            type="number"
                            value={size.chestCm || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'chestCm', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* front length (cm) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">front length (cm)</p>
                          <input
                            type="number"
                            value={size.frontLengthCm || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'frontLengthCm', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* across shoulder (cm) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">across shoulder (cm)</p>
                          <input
                            type="number"
                            value={size.acrossShoulderCm || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'acrossShoulderCm', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* front length (cm) - second one */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">front length (cm)</p>
                          <input
                            type="number"
                            value={size.frontLengthCm2 || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'frontLengthCm2', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* to fit waist (in) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">to fit waist (in)</p>
                          <input
                            type="number"
                            value={size.waistIn || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'waistIn', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* inseam length (in) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">inseam length (in)</p>
                          <input
                            type="number"
                            value={size.inseamIn || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'inseamIn', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* chest (in) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">chest (in)</p>
                          <input
                            type="number"
                            value={size.chestIn || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'chestIn', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* front length (in) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">front length (in)</p>
                          <input
                            type="number"
                            value={size.frontLengthIn || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'frontLengthIn', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>

                        {/* across shoulder (in) */}
                        <div>
                          <p className="font-['Montserrat'] text-[15px] text-black mb-1 leading-[16.9px]">across shoulder (in)</p>
                          <input
                            type="number"
                            value={size.acrossShoulderIn || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'acrossShoulderIn', e.target.value)}
                            className="w-[118px] h-[47px] border-2 border-black rounded-[12px] px-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Size Meta Fields */}
                    <div className="absolute left-[58px]" style={{ top: `${baseTop + 243}px` }}>
                      <div className="flex space-x-4">
                        {/* Meta Title */}
                        <div>
                          <p className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px] mb-2">meta title</p>
                          <input
                            type="text"
                            value={size.metaTitle || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'metaTitle', e.target.value)}
                            className="w-[300px] h-[47px] border-2 border-black rounded-[12px] px-4 font-['Montserrat']"
                          />
                        </div>

                        {/* Meta Description */}
                        <div>
                          <p className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px] mb-2">meta description</p>
                          <input
                            type="text"
                            value={size.metaDescription || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'metaDescription', e.target.value)}
                            className="w-[300px] h-[47px] border-2 border-black rounded-[12px] px-4 font-['Montserrat']"
                          />
                        </div>

                        {/* Slug URL */}
                        <div>
                          <p className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px] mb-2">slug URL</p>
                          <input
                            type="text"
                            value={size.slugUrl || ''}
                            onChange={(e) => handleSizeChange(sizeIndex, 'slugUrl', e.target.value)}
                            className="w-[300px] h-[47px] border-2 border-black rounded-[12px] px-4 font-['Montserrat']"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filters Section */}
                    <div className="absolute left-[53px]" style={{ top: `${baseTop + 450}px` }}>
                      <div>
                        <p className="font-['Montserrat'] font-medium text-[21px] text-[#111111] leading-[24px] mb-2">
                          Filters for this size
                        </p>
                        
                        {/* Display existing filters */}
                        {size.filters && size.filters.length > 0 && (
                          <div className="mb-4">
                            {size.filters.map((filter, filterIndex) => (
                              <div key={filterIndex} className="flex items-center space-x-2 mb-2 p-2 bg-gray-100 rounded">
                                <span className="font-['Montserrat'] text-sm text-gray-700">
                                  {filter.key}: {filter.value}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFilterFromSize(sizeIndex, filterIndex)}
                                  className="text-red-500 hover:text-red-700 font-bold text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add new filter */}
                        <div className="flex space-x-2 items-end">
                          {/* Filter Key Dropdown */}
                          <div>
                            <p className="font-['Montserrat'] text-[14px] text-black mb-1">Filter Type</p>
                            <select
                              value={sizeFilterSelections[sizeIndex]?.selectedKey || ''}
                              onChange={(e) => handleFilterKeyChange(sizeIndex, e.target.value)}
                              className="w-[150px] h-[47px] border-2 border-black rounded-[12px] px-2"
                            >
                              <option value="">Select filter</option>
                              {availableFilters.map((filter) => (
                                <option key={filter._id} value={filter.key}>
                                  {filter.key}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Filter Value Dropdown */}
                          <div>
                            <p className="font-['Montserrat'] text-[14px] text-black mb-1">Filter Value</p>
                            <select
                              value={sizeFilterSelections[sizeIndex]?.selectedValue || ''}
                              onChange={(e) => handleFilterValueChange(sizeIndex, e.target.value)}
                              className="w-[150px] h-[47px] border-2 border-black rounded-[12px] px-2"
                              disabled={!sizeFilterSelections[sizeIndex]?.selectedKey}
                            >
                              <option value="">Select value</option>
                              {sizeFilterSelections[sizeIndex]?.selectedKey && 
                                getFilterValuesByKey(sizeFilterSelections[sizeIndex].selectedKey).map((value) => (
                                  <option key={value.name} value={value.name}>
                                    {value.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>

                          {/* Add Filter Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const selectedKey = sizeFilterSelections[sizeIndex]?.selectedKey;
                              const selectedValue = sizeFilterSelections[sizeIndex]?.selectedValue;
                              
                              if (selectedKey && selectedValue) {
                                // Find the filter to get the code if it exists
                                const selectedFilter = availableFilters.find(f => f.key === selectedKey);
                                const selectedValueObj = selectedFilter?.values?.find(v => v.name === selectedValue);
                                const filterCode = selectedValueObj?.code || '';
                                
                                // Check if filter already exists for this size
                                const existingFilter = size.filters?.find(f => f.key === selectedKey && f.value === selectedValue);
                                if (!existingFilter) {
                                  addFilterToSize(sizeIndex, selectedKey, selectedValue, filterCode);
                                }
                                
                                // Reset selections
                                setSizeFilterSelections(prev => ({
                                  ...prev,
                                  [sizeIndex]: { selectedKey: '', selectedValue: '' }
                                }));
                              }
                            }}
                            disabled={!sizeFilterSelections[sizeIndex]?.selectedKey || !sizeFilterSelections[sizeIndex]?.selectedValue}
                            className="h-[47px] px-4 bg-[#007bff] text-white rounded-[8px] font-['Montserrat'] text-[14px] hover:bg-[#0056b3] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Add Filter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Utility Buttons Row */}
              <div className="flex space-x-4 absolute left-[69px]" style={{ top: `${2070 + (Math.max(0, formData.sizes.length - 2) * 700)}px` }}>
                <button
                  type="button"
                  onClick={addNewSize}
                  className="px-6 py-3 bg-[#28a745] text-white rounded-[8px] font-['Montserrat'] font-medium text-[16px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#218838] transition-colors"
                >
                  + Add New Size
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.productName.trim()) {
                      alert('Please enter a product name first');
                      return;
                    }
                    // Auto-generate SKUs for all sizes that need them
                    formData.sizes.forEach((size, index) => {
                      if (size.sizeName && (!size.sku || size.sku.trim() === '')) {
                        updateSKUForSize(index, size.sizeName, formData.productName);
                      }
                    });
                  }}
                  className="px-6 py-3 bg-[#ffc107] text-black rounded-[8px] font-['Montserrat'] font-medium text-[16px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#e0a800] transition-colors"
                  title="Generate SKUs for all sizes that are missing them"
                >
                  🔧 Auto-Generate SKUs
                </button>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="absolute left-[144px]" style={{ top: `${2150 + (Math.max(0, formData.sizes.length - 2) * 700)}px` }}>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#000aff] text-white rounded-[8px] font-['Montserrat'] font-medium text-[16px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#0008e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Product' : 'Create Product')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemManagementSingleProductUpload;
