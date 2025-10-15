import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
import {
  Truck,
  Tags,
  Package,
  BarChart,
  CreditCard,
  Lock,
  Unlock,
  ShoppingCartIcon,
  Box,
  IndianRupee,
  File,
  Trash,
  Pen,
  Factory,
  MapPin,
  Eye,
  EyeOff,
  Star,
  Mars,
  Venus,
  Palette,
  Plus,
  PencilRuler,
  RulerDimensionLine,
  ScrollText,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Check,
  Settings,
  RotateCw,
  CheckCircle,
  Wallet,
  BarChart2,
  X,
  Users,
  ShoppingCart,
  PackageCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
  CalendarRange,
  Share,
  Printer,
  User,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Add custom styles for date picker - moved to a singleton pattern for performance
const createDatePickerStyles = (() => {
  let stylesInjected = false;

  const datePickerStyles = `
    .date-picker-dropdown {
      animation: slideDown 0.2s ease-out;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .date-picker-option:hover {
      background-color: #f8fafc;
    }
    
    .date-picker-option.selected {
      background-color: #dbeafe;
      color: #1d4ed8;
    }
  `;

  return () => {
    if (typeof document !== "undefined" && !stylesInjected) {
      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.innerText = datePickerStyles;
      document.head.appendChild(styleSheet);
      stylesInjected = true;
    }
  };
})();

// Inject styles once
createDatePickerStyles();

// Date Range Options
const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "today", days: 0 },
  { label: "Yesterday", value: "yesterday", days: 1 },
  { label: "Last 7 Days", value: "7days", days: 7 },
  { label: "Last 14 Days", value: "14days", days: 14 },
  { label: "Last 30 Days", value: "30days", days: 30 },
  { label: "Last 90 Days", value: "90days", days: 90 },
  { label: "This Month", value: "thisMonth", days: null },
  { label: "Last Month", value: "lastMonth", days: null },
  { label: "This Year", value: "thisYear", days: null },
  { label: "Custom Range", value: "custom", days: null },
];

// Performance utility functions - extracted for reuse and memoization
const formatDateForDisplay = (date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateRange = (startDate, endDate) => {
  const start = formatDateForDisplay(startDate);
  const end = formatDateForDisplay(endDate);
  return startDate.toDateString() === endDate.toDateString()
    ? start
    : `${start} – ${end}`;
};

// Memoized date calculation utility
const calculateDateRange = (option) => {
  const today = new Date();
  let startDate, endDate;

  if (option.value === "custom" && option.startDate && option.endDate) {
    return {
      startDate: new Date(option.startDate),
      endDate: new Date(option.endDate),
    };
  }

  switch (option.value) {
    case "today":
      startDate = endDate = new Date(today);
      break;
    case "yesterday":
      startDate = endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7days":
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(today);
      break;
    case "14days":
      startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      endDate = new Date(today);
      break;
    case "30days":
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(today);
      break;
    case "90days":
      startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = new Date(today);
      break;
    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today);
      break;
    case "lastMonth":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today);
      break;
    default:
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(today);
  }

  return { startDate, endDate };
};

// Date Range Picker Component - optimized with extracted utilities
const DateRangePicker = memo(({ selectedRange, onRangeChange, dateRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRangeSelect = (option) => {
    if (option.value === "custom") {
      setShowCustomPicker(true);
    } else {
      onRangeChange(option);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      const customOption = {
        label: "Custom Range",
        value: "custom",
        startDate: customStartDate,
        endDate: customEndDate,
      };
      onRangeChange(customOption);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const formatDateRange = () => {
    if (
      selectedRange.value === "custom" &&
      selectedRange.startDate &&
      selectedRange.endDate
    ) {
      const start = new Date(selectedRange.startDate).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );
      const end = new Date(selectedRange.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${start} – ${end}`;
    }
    return dateRange;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-white bg-blue-600 px-4 py-2 rounded-lg shadow-inner border-2 border-slate-200 hover:bg-blue-700 transition-colors duration-200"
      >
        <CalendarRange className="h-4 w-4" />
        <span className="font-medium tracking-wide">{formatDateRange()}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px] date-picker-dropdown">
          {!showCustomPicker ? (
            <div className="p-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRangeSelect(option)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 date-picker-option ${
                    selectedRange.value === option.value
                      ? "selected font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Select Custom Range
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCustomPicker(false)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomRangeApply}
                    disabled={!customStartDate || !customEndDate}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DateRangePicker.displayName = "DateRangePicker";

// Tab Button Component
const TabButton = memo(({ active, onClick, label }) => (
  <button
    className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
    onClick={onClick}
  >
    {label}
  </button>
));

TabButton.displayName = "TabButton";

// Main Dashboard View Component
const DashboardView = memo(({ activeTab: propActiveTab, onTabChange: propOnTabChange }) => {
  // State management for UI interactions
  const [internalActiveTab, setInternalActiveTab] = useState("sync");
  const [selectedDateRange, setSelectedDateRange] = useState({
    label: "Last 7 Days",
    value: "7days",
    days: 7,
  });
  const [dateRange, setDateRange] = useState("Nov 11, 2025 – Nov 27, 2025");

  // Use prop activeTab if provided, otherwise use internal state
  const activeTab = propActiveTab || internalActiveTab;

  // Event handlers
  const handleTabChange = useCallback((tab) => {
    if (propOnTabChange) {
      propOnTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  }, [propOnTabChange]);

  // Optimized date range change handler with extracted utility
  const handleDateRangeChange = useCallback((rangeOption) => {
    setSelectedDateRange(rangeOption);

    const { startDate, endDate } = calculateDateRange(rangeOption);
    const formattedRange = formatDateRange(startDate, endDate);

    setDateRange(formattedRange);

    // Here you would typically trigger data refetch with the new date range
    console.log("Date range changed:", {
      startDate,
      endDate,
      range: formattedRange,
    });
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <DateRangePicker
            selectedRange={selectedDateRange}
            onRangeChange={handleDateRangeChange}
            dateRange={dateRange}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap space-x-4 gap-2">
          <TabButton
            active={activeTab === "sync"}
            onClick={() => handleTabChange("sync")}
            label="Marketplace Sync"
          />
          <TabButton
            active={activeTab === "analytics"}
            onClick={() => handleTabChange("analytics")}
            label="Analytics Reports"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => handleTabChange("users")}
            label="User Management"
          />
          <TabButton
            active={activeTab === "orders"}
            onClick={() => handleTabChange("orders")}
            label="Order Management"
          />
          <TabButton
            active={activeTab === "products"}
            onClick={() => handleTabChange("products")}
            label="Product Data"
          />
          <TabButton
            active={activeTab === "databaseDashboard"}
            onClick={() => handleTabChange("databaseDashboard")}
            label="DataBase Dashboard"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 py-6">
        {/* This will be the container for other components */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Dashboard
            </h2>
            <p className="text-gray-600">
              This is the main dashboard view component. The specific tab content will be rendered here based on the active tab: {activeTab}
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Active Date Range:</strong> {dateRange}
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Selected Range:</strong> {selectedDateRange.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardView.displayName = "DashboardView";

export default DashboardView;
export { DateRangePicker, TabButton, calculateDateRange, formatDateRange };
