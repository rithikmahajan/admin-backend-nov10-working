import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Palette,
  Hash,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  RefreshCw,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  fetchFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  selectAvailableFilters,
  selectFilterLoading,
  selectFilterError,
} from "../store/slices/filtersSlice";
import {
  fetchUserSettings,
  selectSettings,
  selectSettingsLoading,
} from "../store/slices/settingsSlice";

// CSS for custom slider styling
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: #2563EB;
    transform: scale(1.1);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider:focus {
    outline: none;
  }
  
  .slider:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const Filters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectAvailableFilters);
  const loading = useSelector(selectFilterLoading);
  const error = useSelector(selectFilterError);
  const settings = useSelector(selectSettings);
  const settingsLoading = useSelector(selectSettingsLoading);

  // State management
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("asc");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [editingValue, setEditingValue] = useState(null); // { filterId, valueIndex }
  const [selectedValues, setSelectedValues] = useState([]); // For bulk actions
  const [bulkActionMode, setBulkActionMode] = useState(false);
  
  // Price filter state
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [maxPriceFromAdmin, setMaxPriceFromAdmin] = useState(10000);
  
  // Enhanced sorting options
  const [sortType, setSortType] = useState("priority"); // priority, name, date, price_asc, price_desc, newest
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Form states
  const [filterForm, setFilterForm] = useState({
    key: "",
    priority: 1,
    values: [],
  });

  const [valueForm, setValueForm] = useState({
    name: "",
    code: "#000000",
    priority: 1,
  });

  // Load filters and settings on mount
  useEffect(() => {
    dispatch(fetchFilters());
    dispatch(fetchUserSettings());
  }, [dispatch]);

  // Update max price when settings change
  useEffect(() => {
    if (settings?.dynamicPricing) {
      // Use admin configured max price if available
      const adminMaxPrice = settings.dynamicPricing.maxPriceIncrease * 100 || 10000;
      setMaxPriceFromAdmin(adminMaxPrice);
      setPriceRange(prev => ({ ...prev, max: Math.min(prev.max, adminMaxPrice) }));
    }
  }, [settings]);

  // Inject custom slider styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = sliderStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Filter types configuration
  const FILTER_TYPES = {
    color: { label: "Color", hasColorCode: true, icon: Palette },
    size: { label: "Size", hasColorCode: false, icon: Hash },
    category: { label: "Category", hasColorCode: false, icon: Hash },
    material: { label: "Material", hasColorCode: false, icon: Hash },
    price: { label: "Price Range", hasColorCode: false, icon: DollarSign, isSpecial: true },
  };

  // Preset values for different filter types
  const PRESET_VALUES = {
    color: [
      { name: "Black", code: "#000000" },
      { name: "White", code: "#FFFFFF" },
      { name: "Red", code: "#FF0000" },
      { name: "Blue", code: "#0066CC" },
      { name: "Grey", code: "#808080" },
      { name: "Navy", code: "#000080" },
      { name: "Pink", code: "#FF69B4" },
      { name: "Green", code: "#008000" },
    ],
    size: [
      { name: "XS" }, { name: "S" }, { name: "M" }, 
      { name: "L" }, { name: "XL" }, { name: "XXL" }
    ],
    price: [
      { name: "Under $50", code: "0-50" },
      { name: "$50-$100", code: "50-100" },
      { name: "$100-$200", code: "100-200" },
      { name: "$200-$500", code: "200-500" },
      { name: "Above $500", code: "500-999999" },
    ],
  };

  // Handle form submissions
  const handleCreateFilter = async (e) => {
    e.preventDefault();
    if (!filterForm.key.trim()) return;

    try {
      // Clean up values by removing tempId before sending to backend
      const cleanValues = filterForm.values.map(value => {
        const { tempId, ...cleanValue } = value;
        return cleanValue;
      });

      await dispatch(createFilter({
        key: filterForm.key.toLowerCase(),
        priority: filterForm.priority,
        values: cleanValues,
      })).unwrap();
      
      resetForm();
      setShowCreateModal(false);
      // Don't manually refetch - let Redux handle state updates
    } catch (err) {
      console.error("Failed to create filter:", err);
      // Show user-friendly error message for priority conflicts
      if (err.message && err.message.includes('Priority')) {
        alert(`❌ ${err.message}`);
      } else if (err.message && err.message.includes('duplicate priorities')) {
        alert('❌ Filter values cannot have duplicate priorities. Please ensure each value has a unique priority.');
      } else {
        alert('❌ Failed to create filter. Please try again.');
      }
    }
  };

  const handleUpdateFilter = async (filterId, updates) => {
    console.log("🔄 Updating filter:", filterId, updates);
    try {
      const result = await dispatch(updateFilter({ filterId: filterId, filterData: updates })).unwrap();
      console.log("✅ Filter updated successfully:", result);
      setEditingFilter(null);
      // Don't manually refetch - let Redux handle state updates
    } catch (err) {
      console.error("❌ Failed to update filter:", err);
      // Show user-friendly error message for priority conflicts
      if (err.message && err.message.includes('Priority')) {
        alert(`❌ ${err.message}`);
      } else if (err.message && err.message.includes('duplicate priorities')) {
        alert('❌ Filter values cannot have duplicate priorities. Please ensure each value has a unique priority.');
      } else {
        alert('❌ Failed to update filter. Please try again.');
      }
    }
  };

  const handleDeleteFilter = async (filterId) => {
    console.log("🗑️ Attempting to delete filter:", filterId);
    if (window.confirm("Are you sure you want to delete this filter?")) {
      try {
        const result = await dispatch(deleteFilter(filterId)).unwrap();
        console.log("✅ Filter deleted successfully:", result);
        // Don't manually refetch - let Redux handle state updates
      } catch (err) {
        console.error("❌ Failed to delete filter:", err);
      }
    } else {
      console.log("❌ Delete cancelled by user");
    }
  };

  const resetForm = () => {
    setFilterForm({ key: "", priority: 1, values: [] });
    setValueForm({ name: "", code: "#000000", priority: 1 });
  };

  const addValueToFilter = () => {
    if (!valueForm.name.trim()) return;

    const newValue = {
      name: valueForm.name,
      priority: valueForm.priority,
      tempId: Date.now().toString(), // Use tempId instead of _id for frontend-only tracking
    };

    // Add color code if it's a color filter
    if (filterForm.key === "color" && valueForm.code) {
      newValue.code = valueForm.code;
    }
    
    // Add price range if it's a price filter
    if (filterForm.key === "price" && valueForm.code) {
      newValue.code = valueForm.code;
    }

    setFilterForm(prev => ({
      ...prev,
      values: [...prev.values, newValue]
    }));

    setValueForm({ name: "", code: "#000000", priority: valueForm.priority + 1 });
  };

  const removeValueFromFilter = (valueId) => {
    setFilterForm(prev => ({
      ...prev,
      values: prev.values.filter(v => (v.tempId || v._id) !== valueId)
    }));
  };

  const editValueInForm = (valueIndex) => {
    const value = filterForm.values[valueIndex];
    setValueForm({
      name: value.name,
      code: value.code || "#000000",
      priority: value.priority
    });
    
    // Remove the value from the list so it can be re-added after editing
    setFilterForm(prev => ({
      ...prev,
      values: prev.values.filter((_, index) => index !== valueIndex)
    }));
  };

  const loadPresetValues = (filterType) => {
    const presets = PRESET_VALUES[filterType] || [];
    const values = presets.map((preset, index) => ({
      ...preset,
      priority: index + 1,
      tempId: Date.now() + index, // Use tempId for preset values too
    }));
    
    setFilterForm(prev => ({ ...prev, values }));
  };

  // Value rearrangement functions
  const moveValueUp = (filterId, valueIndex) => {
    console.log("⬆️ Moving value up:", filterId, valueIndex);
    if (valueIndex === 0) return; // Already at top
    
    // Update in form state for create modal
    if (filterId === 'form') {
      setFilterForm(prev => {
        const newValues = [...prev.values];
        [newValues[valueIndex - 1], newValues[valueIndex]] = [newValues[valueIndex], newValues[valueIndex - 1]];
        return { ...prev, values: newValues };
      });
      return;
    }

    // Update existing filter
    const filter = filters.find(f => f._id === filterId);
    if (filter) {
      const newValues = [...filter.values];
      [newValues[valueIndex - 1], newValues[valueIndex]] = [newValues[valueIndex], newValues[valueIndex - 1]];
      
      // Update priorities by creating new objects
      const updatedValues = newValues.map((value, index) => ({
        ...value,
        priority: index + 1
      }));
      
      handleUpdateFilter(filterId, { values: updatedValues });
    }
  };

  const moveValueDown = (filterId, valueIndex) => {
    console.log("⬇️ Moving value down:", filterId, valueIndex);
    
    // Update in form state for create modal
    if (filterId === 'form') {
      if (valueIndex >= filterForm.values.length - 1) return; // Already at bottom
      
      setFilterForm(prev => {
        const newValues = [...prev.values];
        [newValues[valueIndex], newValues[valueIndex + 1]] = [newValues[valueIndex + 1], newValues[valueIndex]];
        return { ...prev, values: newValues };
      });
      return;
    }

    // Update existing filter
    const filter = filters.find(f => f._id === filterId);
    if (filter && valueIndex < filter.values.length - 1) {
      const newValues = [...filter.values];
      [newValues[valueIndex], newValues[valueIndex + 1]] = [newValues[valueIndex + 1], newValues[valueIndex]];
      
      // Update priorities by creating new objects
      const updatedValues = newValues.map((value, index) => ({
        ...value,
        priority: index + 1
      }));
      
      handleUpdateFilter(filterId, { values: updatedValues });
    }
  };

  // Bulk Actions for filter values
  const handleBulkDeleteValues = (filterId) => {
    const filter = filters.find(f => f._id === filterId);
    if (!filter || selectedValues.length === 0) return;

    if (filter.values.length - selectedValues.length < 1) {
      alert("Cannot delete all values. A filter must have at least one value.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedValues.length} selected values?`)) {
      return;
    }

    const newValues = filter.values.filter((_, index) => !selectedValues.includes(index));
    
    // Recalculate priorities
    const updatedValues = newValues.map((value, index) => ({
      ...value,
      priority: index + 1
    }));

    handleUpdateFilter(filterId, { values: updatedValues });
    setSelectedValues([]);
  };

  const handleBulkReorderValues = (filterId, newOrder) => {
    const filter = filters.find(f => f._id === filterId);
    if (!filter) return;

    const reorderedValues = newOrder.map((index) => filter.values[index]);
    const updatedValues = reorderedValues.map((value, index) => ({
      ...value,
      priority: index + 1
    }));

    handleUpdateFilter(filterId, { values: updatedValues });
  };

  const toggleValueSelection = (index) => {
    setSelectedValues(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllValues = (filterId) => {
    const filter = filters.find(f => f._id === filterId);
    if (!filter) return;
    
    setSelectedValues(filter.values.map((_, index) => index));
  };

  const clearValueSelection = () => {
    setSelectedValues([]);
  };

  // Edit and Delete individual filter values
  const handleEditValue = (filterId, valueIndex, updatedValue) => {
    console.log("✏️ Editing filter value:", filterId, valueIndex, updatedValue);
    
    const filter = filters.find(f => f._id === filterId);
    if (!filter) return;

    const newValues = [...filter.values];
    newValues[valueIndex] = {
      ...newValues[valueIndex],
      ...updatedValue
    };

    handleUpdateFilter(filterId, { values: newValues });
  };

  const handleDeleteValue = (filterId, valueIndex) => {
    console.log("🗑️ Deleting filter value:", filterId, valueIndex);
    
    if (!window.confirm("Are you sure you want to delete this filter value?")) {
      return;
    }

    const filter = filters.find(f => f._id === filterId);
    if (!filter) return;

    // Don't allow deletion if it's the last value
    if (filter.values.length <= 1) {
      alert("Cannot delete the last value. A filter must have at least one value.");
      return;
    }

    const newValues = [...filter.values];
    newValues.splice(valueIndex, 1);

    // Recalculate priorities for remaining values
    const updatedValues = newValues.map((value, index) => ({
      ...value,
      priority: index + 1
    }));

    handleUpdateFilter(filterId, { values: updatedValues });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, filterId, valueIndex) => {
    setDraggedItem({ filterId, valueIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, filterId, valueIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem({ filterId, valueIndex });
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the draggable area completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e, targetFilterId, targetIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.filterId !== targetFilterId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const sourceIndex = draggedItem.valueIndex;
    if (sourceIndex === targetIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Check if we're working with form values or existing filter
    if (!targetFilterId) {
      // Handle form values
      setFilterForm(prev => {
        const newValues = [...prev.values];
        const [movedItem] = newValues.splice(sourceIndex, 1);
        newValues.splice(targetIndex, 0, movedItem);
        
        // Update priorities by creating new objects
        const updatedValues = newValues.map((value, index) => ({
          ...value,
          priority: index + 1
        }));
        
        return { ...prev, values: updatedValues };
      });
    } else {
      // Handle existing filter
      const filter = filters.find(f => f._id === targetFilterId);
      if (filter) {
        const newValues = [...filter.values];
        const [movedItem] = newValues.splice(sourceIndex, 1);
        newValues.splice(targetIndex, 0, movedItem);
        
        // Update priorities by creating new objects
        const updatedValues = newValues.map((value, index) => ({
          ...value,
          priority: index + 1
        }));
        
        handleUpdateFilter(targetFilterId, { values: updatedValues });
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Enhanced filtering and sorting logic
  const filteredFilters = filters
    .filter(filter => 
      filter.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortType) {
        case "priority":
          const aPriority = a.priority || 0;
          const bPriority = b.priority || 0;
          return sortOrder === "asc" ? aPriority - bPriority : bPriority - aPriority;
          
        case "name":
          const aName = a.key.toLowerCase();
          const bName = b.key.toLowerCase();
          return sortOrder === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
          
        case "date":
          const aDate = new Date(a.createdAt || 0);
          const bDate = new Date(b.createdAt || 0);
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
          
        case "newest":
          const aCreated = new Date(a.createdAt || 0);
          const bCreated = new Date(b.createdAt || 0);
          return bCreated - aCreated; // Always newest first
          
        case "price_asc":
          // For filters, we'll sort by the number of values as a proxy for complexity
          const aValueCount = a.values?.length || 0;
          const bValueCount = b.values?.length || 0;
          return aValueCount - bValueCount;
          
        case "price_desc":
          const aValueCountDesc = a.values?.length || 0;
          const bValueCountDesc = b.values?.length || 0;
          return bValueCountDesc - aValueCountDesc;
          
        default:
          return 0;
      }
    });

  // Price filter functions for item browsing integration
  const applyPriceFilter = (items) => {
    return items.filter(item => {
      // Check if item has sizes with pricing
      if (!item.sizes || item.sizes.length === 0) return false;
      
      const hasValidPrice = item.sizes.some(size => {
        const price = size.salePrice || size.regularPrice || 0;
        return price >= priceRange.min && price <= priceRange.max;
      });
      
      return hasValidPrice;
    });
  };

  // Export price filter configuration for use in other components
  const getPriceFilterConfig = () => ({
    enabled: showPriceFilter,
    range: priceRange,
    maxPrice: maxPriceFromAdmin,
    applyFilter: applyPriceFilter,
  });

  // Handle sort type change with custom logic
  const handleSortTypeChange = (newSortType) => {
    setSortType(newSortType);
    
    // Auto-adjust sort order based on sort type
    if (newSortType === 'newest' || newSortType === 'price_desc') {
      setSortOrder('desc');
    } else if (newSortType === 'price_asc') {
      setSortOrder('asc');
    }
  };

  // Export filter configuration for external use
  window.YoraaFiltersAPI = {
    getPriceFilterConfig,
    priceRange,
    maxPriceFromAdmin,
    sortType,
    sortOrder,
    applyPriceFilter,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Filter className="h-6 w-6" />
              Filters Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage filters for product browsing. Price filter uses admin panel settings for maximum price range.
            </p>
            <p className="text-gray-600">Create and manage dynamic filters for products</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Filter
          </button>
        </div>

        {/* Controls */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search filters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={sortType}
            onChange={(e) => handleSortTypeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setShowPriceFilter(!showPriceFilter)}
            className={`p-2 border rounded-lg transition-colors ${
              showPriceFilter 
                ? 'bg-blue-100 border-blue-300 text-blue-600' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            title="Price Filter"
          >
            <DollarSign className="h-4 w-4" />
          </button>

          <button
            onClick={() => dispatch(fetchFilters())}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Price Filter Panel */}
      {showPriceFilter && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Price Range Filter
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price: ${priceRange.min}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxPriceFromAdmin}
                  step="50"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ 
                    ...prev, 
                    min: Math.min(Number(e.target.value), prev.max - 50) 
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price: ${priceRange.max}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxPriceFromAdmin}
                  step="50"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ 
                    ...prev, 
                    max: Math.max(Number(e.target.value), prev.min + 50) 
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Range: ${priceRange.min} - ${priceRange.max}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPriceRange({ min: 0, max: Math.floor(maxPriceFromAdmin / 2) })}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Low Range
                </button>
                <button
                  onClick={() => setPriceRange({ min: Math.floor(maxPriceFromAdmin / 3), max: Math.floor(maxPriceFromAdmin * 2 / 3) })}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Mid Range
                </button>
                <button
                  onClick={() => setPriceRange({ min: Math.floor(maxPriceFromAdmin / 2), max: maxPriceFromAdmin })}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  High Range
                </button>
                <button
                  onClick={() => setPriceRange({ min: 0, max: maxPriceFromAdmin })}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Reset
                </button>
              </div>
            </div>
            
            {settingsLoading && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading price settings from admin panel...
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Max price limit set by admin: ${maxPriceFromAdmin}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Price Filter Integration Info */}
      {showPriceFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Price Filter Integration
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                This price filter will be applied to item browsing, filtering products by their sale price or regular price within the selected range.
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <div>• Current Range: ${priceRange.min} - ${priceRange.max}</div>
                <div>• Admin Max Price: ${maxPriceFromAdmin}</div>
                <div>• Filter Status: {showPriceFilter ? 'Active' : 'Inactive'}</div>
                <div>• Sort Type: {sortType}</div>
              </div>
              
              {/* Usage Example */}
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>Usage Example:</strong><br/>
                <code className="text-blue-900">
                  {`const filteredItems = YoraaFiltersAPI.applyPriceFilter(items);`}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters List */}
      <div className="space-y-4">
        {loading && filteredFilters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Loading filters...</p>
          </div>
        ) : filteredFilters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Filter className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No filters found</p>
          </div>
        ) : (
          filteredFilters.map((filter) => (
            <FilterCard
              key={filter._id}
              filter={filter}
              onEdit={setEditingFilter}
              onDelete={handleDeleteFilter}
              onUpdate={handleUpdateFilter}
              isEditing={editingFilter?._id === filter._id}
              moveValueUp={moveValueUp}
              moveValueDown={moveValueDown}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              draggedItem={draggedItem}
              dragOverItem={dragOverItem}
              handleEditValue={handleEditValue}
              handleDeleteValue={handleDeleteValue}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              selectedValues={selectedValues}
              toggleValueSelection={toggleValueSelection}
              selectAllValues={selectAllValues}
              clearValueSelection={clearValueSelection}
              handleBulkDeleteValues={handleBulkDeleteValues}
            />
          ))
        )}
      </div>

      {/* Create Filter Modal */}
      {showCreateModal && (
        <CreateFilterModal
          filterForm={filterForm}
          setFilterForm={setFilterForm}
          valueForm={valueForm}
          setValueForm={setValueForm}
          onSubmit={handleCreateFilter}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          onAddValue={addValueToFilter}
          onRemoveValue={removeValueFromFilter}
          onEditValue={editValueInForm}
          onLoadPresets={loadPresetValues}
          filterTypes={FILTER_TYPES}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          draggedItem={draggedItem}
          dragOverItem={dragOverItem}
        />
      )}
    </div>
  );
};

// Filter Card Component
const FilterCard = ({ 
  filter, 
  onEdit, 
  onDelete, 
  onUpdate, 
  isEditing, 
  moveValueUp, 
  moveValueDown,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  draggedItem,
  dragOverItem,
  handleEditValue,
  handleDeleteValue,
  editingValue,
  setEditingValue,
  selectedValues,
  toggleValueSelection,
  selectAllValues,
  clearValueSelection,
  handleBulkDeleteValues
}) => {
  const [editForm, setEditForm] = useState({
    key: filter.key,
    priority: filter.priority,
  });

  const handleSaveEdit = () => {
    console.log("💾 Saving edit for filter:", filter._id, editForm);
    onUpdate(filter._id, editForm);
  };

  // Value editing state
  const [editValueForm, setEditValueForm] = useState({
    name: "",
    code: "#000000",
    priority: 1
  });

  const startEditingValue = (valueIndex) => {
    const value = filter.values[valueIndex];
    setEditValueForm({
      name: value.name,
      code: value.code || "#000000",
      priority: value.priority
    });
    setEditingValue({ filterId: filter._id, valueIndex });
  };

  const saveValueEdit = () => {
    if (editingValue) {
      handleEditValue(editingValue.filterId, editingValue.valueIndex, editValueForm);
      setEditingValue(null);
    }
  };

  const cancelValueEdit = () => {
    setEditingValue(null);
    setEditValueForm({ name: "", code: "#000000", priority: 1 });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={editForm.key}
                onChange={(e) => setEditForm(prev => ({ ...prev, key: e.target.value }))}
                className="text-lg font-semibold border border-gray-300 rounded px-2 py-1"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {filter.key}
              </h3>
            )}
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              Priority: {filter.priority}
            </span>
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(null)}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    console.log("✏️ Edit clicked for filter:", filter);
                    onEdit(filter);
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    console.log("🗑️ Delete clicked for filter:", filter._id);
                    onDelete(filter._id);
                  }}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Values */}
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Filter Values {filter.values?.length > 0 && `(${filter.values.length})`}
            </h4>
            {filter.values?.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Hover to edit, delete, or rearrange
              </span>
            )}
          </div>

          {/* Bulk Actions Toolbar */}
          {filter.values?.length > 1 && (
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">
                  {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Bulk actions:'}
                </span>
                <button
                  onClick={() => selectAllValues(filter._id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                {selectedValues.length > 0 && (
                  <button
                    onClick={clearValueSelection}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              
              {selectedValues.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkDeleteValues(filter._id)}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Delete Selected ({selectedValues.length})
                  </button>
                </div>
              )}
            </div>
          )}
          
          {filter.values?.map((value, index) => {
            const isDraggedOver = dragOverItem?.filterId === filter._id && dragOverItem?.valueIndex === index;
            const isDragging = draggedItem?.filterId === filter._id && draggedItem?.valueIndex === index;
            const isEditingThisValue = editingValue?.filterId === filter._id && editingValue?.valueIndex === index;
            
            // Show edit form if this value is being edited
            if (isEditingThisValue) {
              return (
                <div key={value._id || value.tempId || index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Value name"
                      value={editValueForm.name}
                      onChange={(e) => setEditValueForm(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <input
                      type="number"
                      min="1"
                      placeholder="Priority"
                      value={editValueForm.priority}
                      onChange={(e) => setEditValueForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {filter.key === 'color' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editValueForm.code}
                          onChange={(e) => setEditValueForm(prev => ({ ...prev, code: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="#000000"
                          value={editValueForm.code}
                          onChange={(e) => setEditValueForm(prev => ({ ...prev, code: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={saveValueEdit}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelValueEdit}
                        className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Show regular value display
            return (
            <div
              key={value._id || value.tempId || index}
              draggable
              onDragStart={(e) => handleDragStart(e, filter._id, index)}
              onDragOver={(e) => handleDragOver(e, filter._id, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, filter._id, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-white border rounded-lg group transition-all cursor-move ${
                isDragging 
                  ? 'opacity-50 scale-95 border-blue-300' 
                  : isDraggedOver 
                    ? 'border-blue-400 shadow-md bg-blue-50' 
                    : selectedValues.includes(index)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:shadow-sm hover:border-gray-300'
              }`}
            >
              {/* Selection checkbox */}
              {filter.values?.length > 1 && (
                <input
                  type="checkbox"
                  checked={selectedValues.includes(index)}
                  onChange={() => toggleValueSelection(index)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              {/* Drag handle */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              {/* Priority badge */}
              <div className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                {value.priority}
              </div>

              {/* Color preview if available */}
              {value.code && (
                <div
                  className="w-5 h-5 rounded border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: value.code }}
                  title={`Color: ${value.code}`}
                />
              )}

              {/* Value name */}
              <span className="text-sm font-medium flex-grow text-gray-800">{value.name}</span>

              {/* Color code if available */}
              {value.code && (
                <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                  {value.code}
                </span>
              )}

              {/* Action controls */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Rearrangement controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveValueUp(filter._id, index)}
                    disabled={index === 0}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Move up (decrease priority)"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveValueDown(filter._id, index)}
                    disabled={index === (filter.values?.length || 0) - 1}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Move down (increase priority)"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Edit and Delete controls */}
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditingValue(index)}
                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    title="Edit this value"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteValue(filter._id, index)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Delete this value"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
        
        {(!filter.values || filter.values.length === 0) && (
          <p className="text-gray-500 text-sm">No values assigned to this filter</p>
        )}
      </div>
    </div>
  );
};

// Create Filter Modal Component
const CreateFilterModal = ({
  filterForm,
  setFilterForm,
  valueForm,
  setValueForm,
  onSubmit,
  onClose,
  onAddValue,
  onRemoveValue,
  onEditValue,
  onLoadPresets,
  filterTypes,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedItem,
  dragOverItem
}) => {
  const isColorFilter = filterForm.key === "color";
  const isPriceFilter = filterForm.key === "price";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Create New Filter</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {/* Filter Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Type
              </label>
              <select
                value={filterForm.key}
                onChange={(e) => setFilterForm(prev => ({ ...prev, key: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Filter Type</option>
                {Object.entries(filterTypes).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Priority
                <span className="text-xs text-gray-500 ml-1">(must be unique)</span>
              </label>
              <input
                type="number"
                min="1"
                value={filterForm.priority}
                onChange={(e) => setFilterForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                title="Each filter must have a unique priority number. Lower numbers appear first."
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the filter list</p>
            </div>
          </div>

          {/* Load Presets */}
          {filterForm.key && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => onLoadPresets(filterForm.key)}
                className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
              >
                Load Preset Values for {filterTypes[filterForm.key]?.label}
              </button>
              
              {isPriceFilter && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>Price Filter Note:</strong> This filter will work alongside the dynamic price range slider for enhanced item browsing. 
                      Price ranges here are used for predefined categories, while the slider allows custom ranges.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Values Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Add Values</h3>
            {isPriceFilter ? (
              <p className="text-sm text-gray-600 mb-3">
                Create price ranges for filtering items. Use format "min-max" (e.g., "0-50", "100-200"). Lower priority numbers appear first.
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-3">
                Each value needs a unique priority within this filter. For example: Size (S=1, M=2, L=3) or Color (Red=1, Blue=2, Green=3)
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <input
                  type="text"
                  placeholder="Value name"
                  value={valueForm.name}
                  onChange={(e) => setValueForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <input
                  type="number"
                  min="1"
                  placeholder="Priority"
                  value={valueForm.priority}
                  onChange={(e) => setValueForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  title="Lower numbers appear first"
                />
              </div>

              {isColorFilter && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={valueForm.code}
                    onChange={(e) => setValueForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="#000000"
                    value={valueForm.code}
                    onChange={(e) => setValueForm(prev => ({ ...prev, code: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {isPriceFilter && (
                <div>
                  <input
                    type="text"
                    placeholder="Range (e.g., 0-50)"
                    value={valueForm.code}
                    onChange={(e) => setValueForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Enter price range as 'min-max' (e.g., 0-50, 50-100)"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={onAddValue}
                disabled={!valueForm.name.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Value
              </button>
            </div>
          </div>

          {/* Current Values */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-medium text-gray-700">
                Current Values: {filterForm.values.length > 0 && (
                  <span className="text-sm text-gray-500 font-normal">
                    (ordered by priority)
                  </span>
                )}
              </h4>
              {filterForm.values.length > 1 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Drag to reorder
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filterForm.values
                .sort((a, b) => a.priority - b.priority)
                .map((value, index) => {
                  const isDraggedOver = dragOverItem?.filterId === null && dragOverItem?.valueIndex === index;
                  const isDragging = draggedItem?.filterId === null && draggedItem?.valueIndex === index;
                  
                  return (
                <div 
                  key={value.tempId || value._id} 
                  draggable
                  onDragStart={(e) => onDragStart(e, null, index)}
                  onDragOver={(e) => onDragOver(e, null, index)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, null, index)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-3 p-2 rounded cursor-move group transition-all ${
                    isDragging 
                      ? 'opacity-50 scale-95 bg-blue-100' 
                      : isDraggedOver 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                    {value.priority}
                  </div>
                  {value.code && (
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: value.code }}
                    />
                  )}
                  <span className="flex-1 font-medium">{value.name}</span>
                  {value.code && <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">{value.code}</span>}
                  
                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditValue(index)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Edit this value"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveValue(value.tempId || value._id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete this value"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                )})})
            </div>
            
            {filterForm.values.length === 0 && (
              <p className="text-gray-500 text-sm">No values added yet</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!filterForm.key || filterForm.values.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/*
 * Enhanced Filters Component Features:
 * 
 * 1. Price Range Filter:
 *    - Dynamic slider with min/max range selection
 *    - Admin panel integration for max price limit
 *    - Real-time filter application
 * 
 * 2. Enhanced Sorting:
 *    - Priority, Name, Date sorting
 *    - Price ascending/descending
 *    - Newest items first
 *    - Custom sort logic for each type
 * 
 * 3. Admin Panel Integration:
 *    - Fetches admin settings for price limits
 *    - Uses dynamic pricing settings
 *    - Respects admin-configured maximum prices
 * 
 * 4. Item Browsing Integration:
 *    - applyPriceFilter() function for item filtering
 *    - Global YoraaFiltersAPI for external access
 *    - Compatible with item regularPrice and salePrice
 * 
 * 5. Special Filter Types:
 *    - Price filter with range input (e.g., "0-50")
 *    - Color filter with hex code support
 *    - Standard filters (size, category, material)
 * 
 * Usage in other components:
 * const { applyPriceFilter, priceRange } = window.YoraaFiltersAPI;
 * const filteredItems = applyPriceFilter(allItems);
 */

export default Filters;
