import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { itemAPI } from '../api/endpoints';
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Save
} from 'lucide-react';

const ItemManagementBulkUpload = () => {
  const navigate = useNavigate();
  
  // States - NO LOADING DEPENDENCIES IN EFFECTS
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedProducts, setUploadedProducts] = useState([]);

  const expectedColumns = [
    'Product Name', 'Title', 'Description', 'Manufacturing Details', 'Shipping Returns',
    'Size Name', 'Quantity', 'HSN Code', 'SKU', 'Barcode Number', 'Regular Price', 'Sale Price',
    'Waist (CM)', 'Inseam (CM)', 'Chest (CM)', 'Front Length (CM)', 'Across Shoulder (CM)',
    'Waist (IN)', 'Inseam (IN)', 'Chest (IN)', 'Front Length (IN)', 'Across Shoulder (IN)',
    'Meta Title', 'Meta Description', 'Slug URL'
  ];

  // Handle file selection - SIMPLE FUNCTION
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.xls')) {
      setSelectedFile(file);
      setError(null);
      parseExcelFile(file);
    } else {
      setError('Please select a valid Excel file (.xlsx or .xls)');
    }
  }, []);

  // Parse Excel file
  const parseExcelFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('Excel file is empty');
          return;
        }

        const fileColumns = Object.keys(jsonData[0]);
        const missingColumns = expectedColumns.filter(col => !fileColumns.includes(col));
        
        if (missingColumns.length > 0) {
          setError(`Missing columns: ${missingColumns.join(', ')}`);
          return;
        }

        const groupedProducts = groupDataByProduct(jsonData);
        setParsedData(groupedProducts);
        validateData(groupedProducts);
        
      } catch (err) {
        setError('Error parsing Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Group data by product name
  const groupDataByProduct = useCallback((data) => {
    const grouped = {};
    
    data.forEach((row, index) => {
      const productName = row['Product Name'];
      if (!productName) return;
      
      if (!grouped[productName]) {
        grouped[productName] = {
          rowIndex: index,
          productName: row['Product Name'],
          title: row['Title'],
          description: row['Description'],
          manufacturingDetails: row['Manufacturing Details'],
          shippingReturns: row['Shipping Returns'],
          sizes: []
        };
      }
      
      grouped[productName].sizes.push({
        sizeName: row['Size Name'],
        quantity: parseInt(row['Quantity']) || 0,
        hsn: row['HSN Code'],
        sku: row['SKU'],
        barcodeNo: row['Barcode Number'],
        regularPrice: parseFloat(row['Regular Price']) || 0,
        salePrice: parseFloat(row['Sale Price']) || 0,
        waistCm: parseFloat(row['Waist (CM)']) || 0,
        inseamCm: parseFloat(row['Inseam (CM)']) || 0,
        chestCm: parseFloat(row['Chest (CM)']) || 0,
        frontLengthCm: parseFloat(row['Front Length (CM)']) || 0,
        acrossShoulderCm: parseFloat(row['Across Shoulder (CM)']) || 0,
        waistIn: parseFloat(row['Waist (IN)']) || 0,
        inseamIn: parseFloat(row['Inseam (IN)']) || 0,
        chestIn: parseFloat(row['Chest (IN)']) || 0,
        frontLengthIn: parseFloat(row['Front Length (IN)']) || 0,
        acrossShoulderIn: parseFloat(row['Across Shoulder (IN)']) || 0,
        metaTitle: row['Meta Title'],
        metaDescription: row['Meta Description'],
        slugUrl: row['Slug URL']
      });
    });
    
    return Object.values(grouped);
  }, []);

  // Validate data
  const validateData = useCallback((products) => {
    const errors = {};
    
    products.forEach((product, index) => {
      const productErrors = [];
      
      if (!product.productName) productErrors.push('Product name is required');
      if (!product.title) productErrors.push('Title is required');
      if (!product.description) productErrors.push('Description is required');
      if (product.sizes.length === 0) productErrors.push('At least one size is required');
      
      product.sizes.forEach((size, sizeIndex) => {
        if (!size.sizeName) productErrors.push(`Size ${sizeIndex + 1}: Size name is required`);
        if (size.quantity <= 0) productErrors.push(`Size ${sizeIndex + 1}: Quantity must be greater than 0`);
        if (size.regularPrice <= 0) productErrors.push(`Size ${sizeIndex + 1}: Regular price must be greater than 0`);
      });
      
      if (productErrors.length > 0) {
        errors[index] = productErrors;
      }
    });
    
    setValidationErrors(errors);
  }, []);

  // Download template
  const downloadTemplate = useCallback(() => {
    const template = [{
      'Product Name': 'Sample Product',
      'Title': 'Sample Title',
      'Description': 'Sample Description',
      'Manufacturing Details': 'Sample Manufacturing Details',
      'Shipping Returns': 'Sample Shipping & Returns',
      'Size Name': 'M',
      'Quantity': 10,
      'HSN Code': '12345678',
      'SKU': 'SKU001',
      'Barcode Number': '1234567890123',
      'Regular Price': 999,
      'Sale Price': 899,
      'Waist (CM)': 80,
      'Inseam (CM)': 75,
      'Chest (CM)': 100,
      'Front Length (CM)': 70,
      'Across Shoulder (CM)': 45,
      'Waist (IN)': 32,
      'Inseam (IN)': 30,
      'Chest (IN)': 40,
      'Front Length (IN)': 28,
      'Across Shoulder (IN)': 18,
      'Meta Title': 'Sample Meta Title',
      'Meta Description': 'Sample Meta Description',
      'Slug URL': 'sample-product-slug'
    }];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'bulk_upload_template.xlsx');
  }, []);

  // Handle bulk upload - CLEAN FUNCTION
  const handleBulkUpload = useCallback(async () => {
    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix validation errors before uploading');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    
    const results = [];
    const total = parsedData.length;

    try {
      for (let i = 0; i < parsedData.length; i++) {
        const product = parsedData[i];
        
        const productData = {
          productName: product.productName,
          title: product.title,
          description: product.description,
          manufacturingDetails: product.manufacturingDetails,
          shippingAndReturns: product.shippingReturns,
          sizes: product.sizes.map(size => ({
            sizeName: size.sizeName,
            quantity: size.quantity,
            hsn: size.hsn,
            sku: size.sku,
            barcodeNo: size.barcodeNo,
            regularPrice: size.regularPrice,
            salePrice: size.salePrice,
            waistCm: size.waistCm,
            inseamCm: size.inseamCm,
            chestCm: size.chestCm,
            frontLengthCm: size.frontLengthCm,
            acrossShoulderCm: size.acrossShoulderCm,
            waistIn: size.waistIn,
            inseamIn: size.inseamIn,
            chestIn: size.chestIn,
            frontLengthIn: size.frontLengthIn,
            acrossShoulderIn: size.acrossShoulderIn,
            metaTitle: size.metaTitle,
            metaDescription: size.metaDescription,
            slugUrl: size.slugUrl
          })),
          status: 'draft'
        };

        try {
          const response = await itemAPI.createBasicProduct(productData);
          results.push({
            product: product.productName,
            success: true,
            id: response.data.data?.id || response.data.data?._id || response.data.id,
            message: 'Product created successfully as draft'
          });
        } catch (apiError) {
          results.push({
            product: product.productName,
            success: false,
            error: apiError.response?.data?.message || apiError.message
          });
        }

        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }

      setUploadedProducts(results);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      setSuccess(`Upload completed! ${successCount} products created successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`);
      
    } catch (error) {
      setError('Bulk upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [parsedData, validationErrors]);

  // Clear all data
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors({});
    setUploadedProducts([]);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/item-management-new')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
                <p className="text-gray-600 mt-1">Upload multiple products via Excel file</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How to use Bulk Upload</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Download the Excel template using the button below</li>
            <li>Fill in your product data following the template format</li>
            <li>Upload the completed Excel file</li>
            <li>Review the parsed data and fix any validation errors</li>
            <li>Click "Upload Products" to save them as drafts</li>
          </ol>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Template
              </button>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {parsedData.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Clear All
              </button>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Selected file: <span className="font-medium">{selectedFile.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium">Uploading products... {uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Parsed Data Preview */}
        {parsedData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Parsed Products ({parsedData.length})
              </h2>
              
              {Object.keys(validationErrors).length === 0 ? (
                <button
                  onClick={handleBulkUpload}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  Upload Products
                </button>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Fix errors before uploading</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {parsedData.map((product, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${
                    validationErrors[index] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{product.productName}</h3>
                    <p className="text-sm text-gray-600">{product.title}</p>
                  </div>

                  {validationErrors[index] && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {validationErrors[index].map((error, errorIndex) => (
                          <li key={errorIndex}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {product.sizes.map((size, sizeIndex) => (
                      <div key={sizeIndex} className="text-sm bg-gray-100 rounded p-2">
                        <span className="font-medium">{size.sizeName}</span> - 
                        Qty: {size.quantity}, Price: ₹{size.regularPrice}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Results</h2>
            <div className="space-y-3">
              {uploadedProducts.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.product}</span>
                  </div>
                  
                  <div className="text-sm">
                    {result.success ? (
                      <span className="text-green-700">{result.message}</span>
                    ) : (
                      <span className="text-red-700">{result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate('/item-management-new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-5 h-5" />
                View All Products
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upload More Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemManagementBulkUpload;
