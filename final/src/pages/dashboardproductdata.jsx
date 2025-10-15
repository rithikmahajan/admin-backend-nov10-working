import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Filter,
  Download,
  Package,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Image,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Share,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  Barcode,
  Star,
  Heart,
  ShoppingCart,
  Database,
  Activity,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { DateRangePicker, calculateDateRange, formatDateRange } from "./dashboardview";
import ScrollToTop from "../components/ScrollToTop";

// Removed imports from deleted itemSlice - using mock data for dashboard instead

// Mock product data generator
const generateMockProducts = () => [
  {
    id: "PROD-001",
    name: "Premium Cotton T-Shirt",
    sku: "YRA-TSH-001",
    barcode: "1234567890123",
    category: "Clothing",
    subcategory: "T-Shirts",
    brand: "Yoraa",
    price: 899.00,
    compareAtPrice: 1199.00,
    costPrice: 450.00,
    stock: 156,
    lowStockThreshold: 20,
    status: "active",
    visibility: "visible",
    tags: ["cotton", "casual", "premium"],
    description: "High-quality cotton t-shirt perfect for casual wear",
    weight: 200,
    dimensions: { length: 25, width: 20, height: 1 },
    images: ["tshirt1.jpg", "tshirt2.jpg"],
    variants: [
      { size: "S", color: "Blue", stock: 45 },
      { size: "M", color: "Blue", stock: 56 },
      { size: "L", color: "Blue", stock: 35 },
      { size: "XL", color: "Blue", stock: 20 },
    ],
    seoTitle: "Premium Cotton T-Shirt - Yoraa",
    seoDescription: "Comfortable premium cotton t-shirt",
    createdAt: "2024-01-15",
    updatedAt: "2024-11-20",
    salesCount: 245,
    viewCount: 1250,
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: "PROD-002",
    name: "Slim Fit Denim Jeans",
    sku: "YRA-JNS-002",
    barcode: "1234567890124",
    category: "Clothing",
    subcategory: "Jeans",
    brand: "Yoraa",
    price: 2499.00,
    compareAtPrice: 3299.00,
    costPrice: 1200.00,
    stock: 89,
    lowStockThreshold: 15,
    status: "active",
    visibility: "visible",
    tags: ["denim", "slim-fit", "casual"],
    description: "Modern slim fit denim jeans with premium quality",
    weight: 600,
    dimensions: { length: 100, width: 40, height: 2 },
    images: ["jeans1.jpg", "jeans2.jpg"],
    variants: [
      { size: "28", color: "Dark Blue", stock: 22 },
      { size: "30", color: "Dark Blue", stock: 25 },
      { size: "32", color: "Dark Blue", stock: 28 },
      { size: "34", color: "Dark Blue", stock: 14 },
    ],
    seoTitle: "Slim Fit Denim Jeans - Yoraa",
    seoDescription: "Premium quality slim fit denim jeans",
    createdAt: "2024-02-10",
    updatedAt: "2024-11-18",
    salesCount: 189,
    viewCount: 950,
    rating: 4.3,
    reviewCount: 67,
  },
  {
    id: "PROD-003",
    name: "Casual Sneakers",
    sku: "YRA-SNK-003",
    barcode: "1234567890125",
    category: "Footwear",
    subcategory: "Sneakers",
    brand: "Yoraa",
    price: 3999.00,
    compareAtPrice: 5499.00,
    costPrice: 2000.00,
    stock: 45,
    lowStockThreshold: 10,
    status: "active",
    visibility: "visible",
    tags: ["sneakers", "casual", "comfort"],
    description: "Comfortable casual sneakers for everyday wear",
    weight: 400,
    dimensions: { length: 30, width: 15, height: 10 },
    images: ["sneakers1.jpg", "sneakers2.jpg"],
    variants: [
      { size: "7", color: "White", stock: 12 },
      { size: "8", color: "White", stock: 15 },
      { size: "9", color: "White", stock: 10 },
      { size: "10", color: "White", stock: 8 },
    ],
    seoTitle: "Casual Sneakers - Yoraa",
    seoDescription: "Comfortable casual sneakers for daily wear",
    createdAt: "2024-03-05",
    updatedAt: "2024-11-15",
    salesCount: 156,
    viewCount: 780,
    rating: 4.7,
    reviewCount: 45,
  },
  {
    id: "PROD-004",
    name: "Formal Dress Shirt",
    sku: "YRA-SHT-004",
    barcode: "1234567890126",
    category: "Clothing",
    subcategory: "Shirts",
    brand: "Yoraa",
    price: 1799.00,
    compareAtPrice: 2399.00,
    costPrice: 900.00,
    stock: 0,
    lowStockThreshold: 25,
    status: "active",
    visibility: "hidden",
    tags: ["formal", "office", "cotton"],
    description: "Professional formal dress shirt for office wear",
    weight: 250,
    dimensions: { length: 28, width: 22, height: 1 },
    images: ["shirt1.jpg"],
    variants: [
      { size: "S", color: "White", stock: 0 },
      { size: "M", color: "White", stock: 0 },
      { size: "L", color: "White", stock: 0 },
    ],
    seoTitle: "Formal Dress Shirt - Yoraa",
    seoDescription: "Professional formal dress shirt",
    createdAt: "2024-01-20",
    updatedAt: "2024-11-10",
    salesCount: 78,
    viewCount: 456,
    rating: 4.2,
    reviewCount: 23,
  },
  {
    id: "PROD-005",
    name: "Summer Dress",
    sku: "YRA-DRS-005",
    barcode: "1234567890127",
    category: "Clothing",
    subcategory: "Dresses",
    brand: "Yoraa",
    price: 2299.00,
    compareAtPrice: 2999.00,
    costPrice: 1150.00,
    stock: 234,
    lowStockThreshold: 30,
    status: "draft",
    visibility: "visible",
    tags: ["summer", "casual", "floral"],
    description: "Beautiful summer dress with floral patterns",
    weight: 300,
    dimensions: { length: 35, width: 25, height: 2 },
    images: ["dress1.jpg", "dress2.jpg", "dress3.jpg"],
    variants: [
      { size: "XS", color: "Floral", stock: 45 },
      { size: "S", color: "Floral", stock: 67 },
      { size: "M", color: "Floral", stock: 78 },
      { size: "L", color: "Floral", stock: 44 },
    ],
    seoTitle: "Summer Dress - Yoraa",
    seoDescription: "Beautiful summer dress with floral patterns",
    createdAt: "2024-04-12",
    updatedAt: "2024-11-25",
    salesCount: 123,
    viewCount: 890,
    rating: 4.6,
    reviewCount: 34,
  },
  {
    id: "PROD-006",
    name: "Winter Jacket",
    sku: "YRA-JCT-006",
    barcode: "1234567890128",
    category: "Clothing",
    subcategory: "Jackets",
    brand: "Yoraa",
    price: 4999.00,
    compareAtPrice: 6999.00,
    costPrice: 2500.00,
    stock: 67,
    lowStockThreshold: 20,
    status: "active",
    visibility: "visible",
    tags: ["winter", "warm", "waterproof"],
    description: "Warm and waterproof winter jacket",
    weight: 800,
    dimensions: { length: 40, width: 30, height: 5 },
    images: ["jacket1.jpg", "jacket2.jpg"],
    variants: [
      { size: "M", color: "Black", stock: 23 },
      { size: "L", color: "Black", stock: 25 },
      { size: "XL", color: "Black", stock: 19 },
    ],
    seoTitle: "Winter Jacket - Yoraa",
    seoDescription: "Warm and waterproof winter jacket",
    createdAt: "2024-02-28",
    updatedAt: "2024-11-22",
    salesCount: 98,
    viewCount: 623,
    rating: 4.4,
    reviewCount: 28,
  },
  {
    id: "PROD-007",
    name: "Designer Handbag",
    sku: "YRA-BAG-007",
    barcode: "1234567890129",
    category: "Accessories",
    subcategory: "Bags",
    brand: "Yoraa",
    price: 5999.00,
    compareAtPrice: 7999.00,
    costPrice: 3000.00,
    stock: 23,
    lowStockThreshold: 5,
    status: "active",
    visibility: "visible",
    tags: ["designer", "luxury", "leather"],
    description: "Premium designer handbag made from genuine leather",
    weight: 500,
    dimensions: { length: 35, width: 15, height: 25 },
    images: ["handbag1.jpg", "handbag2.jpg"],
    variants: [
      { size: "One Size", color: "Brown", stock: 12 },
      { size: "One Size", color: "Black", stock: 11 },
    ],
    seoTitle: "Designer Handbag - Yoraa",
    seoDescription: "Premium designer handbag made from genuine leather",
    createdAt: "2024-03-15",
    updatedAt: "2024-11-20",
    salesCount: 67,
    viewCount: 445,
    rating: 4.8,
    reviewCount: 19,
  },
  {
    id: "PROD-008",
    name: "Sports Watch",
    sku: "YRA-WTC-008",
    barcode: "1234567890130",
    category: "Accessories",
    subcategory: "Watches",
    brand: "Yoraa",
    price: 3499.00,
    compareAtPrice: 4999.00,
    costPrice: 1750.00,
    stock: 112,
    lowStockThreshold: 15,
    status: "inactive",
    visibility: "visible",
    tags: ["sports", "waterproof", "digital"],
    description: "Digital sports watch with waterproof features",
    weight: 150,
    dimensions: { length: 5, width: 5, height: 2 },
    images: ["watch1.jpg"],
    variants: [
      { size: "One Size", color: "Black", stock: 56 },
      { size: "One Size", color: "Blue", stock: 56 },
    ],
    seoTitle: "Sports Watch - Yoraa",
    seoDescription: "Digital sports watch with waterproof features",
    createdAt: "2024-01-30",
    updatedAt: "2024-11-05",
    salesCount: 145,
    viewCount: 765,
    rating: 4.1,
    reviewCount: 41,
  },
];



// Product Statistics Component
const ProductStats = memo(({ products, dateRange }) => {
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const publishedProducts = products.filter((product) => product.status === "published").length;
    
    // Calculate stock from sizes array
    const lowStockProducts = products.filter((product) => {
      const totalStock = product.sizes?.reduce((total, size) => total + (size.stock || 0), 0) || 0;
      return totalStock > 0 && totalStock <= 10; // Using 10 as low stock threshold
    }).length;
    
    const outOfStockProducts = products.filter((product) => {
      const totalStock = product.sizes?.reduce((total, size) => total + (size.stock || 0), 0) || 0;
      return totalStock === 0;
    }).length;
    
    // Calculate categories
    const categories = new Set(products.map(p => p.categoryId?.name).filter(Boolean));
    const totalCategories = categories.size;

    return [
      {
        title: "Total Products",
        value: totalProducts.toLocaleString(),
        icon: Package,
        change: "+8.2%",
        trending: "up",
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        title: "Published Products",
        value: publishedProducts.toLocaleString(),
        icon: CheckCircle,
        change: "+5.1%",
        trending: "up",
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
      },
      {
        title: "Low Stock",
        value: lowStockProducts.toLocaleString(),
        icon: AlertCircle,
        change: "+12.3%",
        trending: "up",
        bgColor: "bg-yellow-50",
        iconColor: "text-yellow-600",
      },
      {
        title: "Out of Stock",
        value: outOfStockProducts.toLocaleString(),
        icon: XCircle,
        change: "-2.4%",
        trending: "down",
        bgColor: "bg-red-50",
        iconColor: "text-red-600",
      },
    ];
  }, [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-1 ${
                stat.trending === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {stat.trending === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{stat.change}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

ProductStats.displayName = "ProductStats";

// Product Table Component
const ProductTable = memo(({ products, onUpdateStatus, onDeleteProduct, onViewProduct, onEditProduct, onUpdateStock }) => {
  const [actionDropdown, setActionDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActionDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { bg: "bg-green-100", text: "text-green-800", label: "Published" },
      draft: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Draft" },
      scheduled: { bg: "bg-blue-100", text: "text-blue-800", label: "Scheduled" },
      archived: { bg: "bg-red-100", text: "text-red-800", label: "Archived" },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getStockBadge = (stock, lowStockThreshold) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          <XCircle className="h-3 w-3" />
          <span>Out of Stock</span>
        </span>
      );
    }
    
    if (stock <= lowStockThreshold) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-3 w-3" />
          <span>Low Stock</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        <span>In Stock</span>
      </span>
    );
  };

  const handleActionClick = (productId, action) => {
    setActionDropdown(null);
    switch (action) {
      case "view":
        onViewProduct(productId);
        break;
      case "edit":
        onEditProduct(productId);
        break;
      case "activate":
        onUpdateStatus(productId, "active");
        break;
      case "deactivate":
        onUpdateStatus(productId, "inactive");
        break;
      case "archive":
        onUpdateStatus(productId, "archived");
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this product?")) {
          onDeleteProduct(productId);
        }
        break;
    }
  };

  const calculateProfit = (price, costPrice) => {
    const profit = price - costPrice;
    const profitMargin = ((profit / price) * 100).toFixed(1);
    return { profit, profitMargin };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU / Barcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              // Calculate total stock from sizes array
              const totalStock = product.sizes?.reduce((total, size) => total + (size.stock || 0), 0) || 0;
              const avgPrice = product.sizes?.length > 0 ? 
                product.sizes.reduce((total, size) => total + (size.regularPrice || 0), 0) / product.sizes.length : 0;
              
              // Get first available SKU from sizes
              const firstSku = product.sizes?.[0]?.sku || product.productId || 'N/A';
              const firstBarcode = product.sizes?.[0]?.barcode || 'N/A';
              
              return (
                <tr key={product._id || product.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        {product.images?.length > 0 ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.productName}
                            className="h-12 w-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <Package className="h-6 w-6 text-gray-400" style={{display: product.images?.length > 0 ? 'none' : 'flex'}} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                          {product.productName || product.title || 'Untitled Product'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {product.productId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{firstSku}</div>
                    <div className="text-sm text-gray-500">{firstBarcode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.categoryId?.name || 'Uncategorized'}</div>
                    <div className="text-sm text-gray-500">{product.subCategoryId?.name || 'No Subcategory'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{avgPrice ? avgPrice.toLocaleString() : 'Not Set'}
                    </div>
                    <div className="text-xs text-blue-600">
                      {product.sizes?.length || 0} size{product.sizes?.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {totalStock} units
                    </div>
                    {getStockBadge(totalStock, 10)} {/* Using 10 as default low stock threshold */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{(product.averageRating || 0).toFixed(1)}</span>
                        <span className="text-gray-500">({product.totalReviews || 0})</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Active: {product.isActive ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() =>
                          setActionDropdown(
                            actionDropdown === (product._id || product.productId) ? null : (product._id || product.productId)
                          )
                        }
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>

                      {actionDropdown === (product._id || product.productId) && (
                        <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                          <div className="p-1">
                            <button
                              onClick={() => handleActionClick(product._id || product.productId, "view")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => handleActionClick(product._id || product.productId, "edit")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            {product.status !== "published" && (
                              <button
                                onClick={() => handleActionClick(product._id || product.productId, "publish")}
                                className="w-full text-left px-3 py-2 rounded-md text-sm text-green-700 hover:bg-green-50 transition-colors duration-150 flex items-center space-x-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Publish</span>
                              </button>
                            )}
                            {product.status === "published" && (
                              <button
                                onClick={() => handleActionClick(product._id || product.productId, "draft")}
                                className="w-full text-left px-3 py-2 rounded-md text-sm text-orange-700 hover:bg-orange-50 transition-colors duration-150 flex items-center space-x-2"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Set to Draft</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleActionClick(product._id || product.productId, "archive")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Package className="h-4 w-4" />
                              <span>Archive</span>
                            </button>
                            <button
                              onClick={() => handleActionClick(product._id || product.productId, "delete")}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-red-700 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ProductTable.displayName = "ProductTable";

// Main Dashboard Product Data Component
const DashboardProductData = memo(() => {
  const dispatch = useDispatch();
  
  // Redux state selectors
  const products = useSelector(selectItemsItems);
  const loading = useSelector(selectItemsLoading);
  const error = useSelector(selectItemsError);
  const categories = useSelector(selectCategories);
  const subCategories = useSelector(selectSubCategories);
  const successMessage = useSelector(selectSuccessMessage);
  const updateLoading = useSelector(selectUpdateLoading);
  const createLoading = useSelector(selectCreateLoading);
  const deleteLoading = useSelector(selectDeleteLoading);

  // Local component state
  const [selectedDateRange, setSelectedDateRange] = useState({
    label: "Last 30 Days",
    value: "30days", 
    days: 30,
  });
  const [dateRange, setDateRange] = useState("Sep 24, 2025 – Sep 24, 2025");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Fetch products on component mount and setup auto-refresh
  useEffect(() => {
    dispatch(fetchItems({ page: 1, limit: 50 }));
    
    // Only fetch categories if not already loaded
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
    
    // Only fetch subcategories if not already loaded  
    if (!subCategories || subCategories.length === 0) {
      dispatch(fetchSubCategories());
    }
    
    // Auto-refresh every 60 seconds for real-time data
    const refreshInterval = setInterval(() => {
      dispatch(fetchItems({ page: 1, limit: 50 }));
      setLastRefresh(new Date());
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [dispatch, categories, subCategories]);

  // Manual refresh function
  const refreshProducts = useCallback(() => {
    dispatch(fetchItems({ 
      page: 1, 
      limit: 50,
      search: searchTerm,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }));
    setLastRefresh(new Date());
  }, [dispatch, searchTerm, categoryFilter, statusFilter]);

  // Product actions
  const handleUpdateProduct = useCallback((id, data) => {
    dispatch(updateItem({ id, data }));
  }, [dispatch]);

  const handleDeleteProduct = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteItem(id));
    }
  }, [dispatch]);

  const handleStatusChange = useCallback((id, status) => {
    dispatch(updateItemStatus({ itemId: id, statusData: { status } }));
  }, [dispatch]);

  // Functions expected by ProductTable component
  const updateProductStatus = useCallback((productId, newStatus) => {
    handleStatusChange(productId, newStatus);
  }, [handleStatusChange]);

  const deleteProduct = useCallback((productId) => {
    handleDeleteProduct(productId);
  }, [handleDeleteProduct]);

  const updateProductStock = useCallback((productId, newStock) => {
    // For now, we'll update the first size's stock
    // In a real implementation, you might want to show a modal to select which size
    const product = products.find(p => (p._id || p.productId) === productId);
    if (product && product.sizes && product.sizes.length > 0) {
      const updatedSizes = [...product.sizes];
      updatedSizes[0] = { ...updatedSizes[0], stock: newStock };
      dispatch(updateItem({ 
        id: productId, 
        data: { sizes: updatedSizes }
      }));
    }
  }, [dispatch, products]);

  const handleViewProduct = useCallback((product) => {
    console.log('Viewing product:', product);
    // Implement view product logic
  }, []);

  const handleEditProduct = useCallback((product) => {
    console.log('Editing product:', product);
    // Implement edit product logic
  }, []);

  // Clear errors and success messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);
  
  const [stockFilter, setStockFilter] = useState("all");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // Get unique categories for filter from Redux data
  const availableCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(cat => cat.name || cat.categoryName || cat).filter(Boolean);
    }
    // Fallback to extracting from products if categories not loaded
    const uniqueCategories = [...new Set(products.map((product) => product.categoryId?.name || 'Uncategorized').filter(Boolean))];
    return uniqueCategories.sort();
  }, [products, categories]);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Get first available SKU from sizes
      const firstSku = product.sizes?.[0]?.sku || product.productId || '';
      const firstBarcode = product.sizes?.[0]?.barcode || '';
      
      const matchesSearch =
        (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        firstSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firstBarcode.includes(searchTerm) ||
        product.productId.toLowerCase().includes(searchTerm.toLowerCase());

      const categoryName = product.categoryId?.name || 'Uncategorized';
      const matchesCategory = categoryFilter === "all" || categoryName === categoryFilter;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;

      // Calculate total stock from sizes array
      const totalStock = product.sizes?.reduce((total, size) => total + (size.stock || 0), 0) || 0;
      
      let matchesStock = true;
      if (stockFilter === "in-stock") {
        matchesStock = totalStock > 10; // Using 10 as low stock threshold
      } else if (stockFilter === "low-stock") {
        matchesStock = totalStock <= 10 && totalStock > 0;
      } else if (stockFilter === "out-of-stock") {
        matchesStock = totalStock === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, statusFilter, stockFilter]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateRangeChange = useCallback((rangeOption) => {
    setSelectedDateRange(rangeOption);
    const { startDate, endDate } = calculateDateRange(rangeOption);
    const formattedRange = formatDateRange(startDate, endDate);
    setDateRange(formattedRange);
  }, []);



  // Export functions
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Products Report", 20, 30);

      doc.setFontSize(12);
      doc.text(`Date Range: ${selectedDateRange.label}`, 20, 45);
      doc.text(`Period: ${dateRange}`, 20, 55);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 65);

      const tableData = filteredProducts.map((product) => [
        product.name || "",
        product.sku || "",
        product.category || "",
        `₹${(product.price || 0).toFixed(2)}`,
        (product.stock || 0).toString(),
        product.status || "",
        (product.salesCount || 0).toString(),
      ]);

      doc.autoTable({
        startY: 75,
        head: [["Product", "SKU", "Category", "Price", "Stock", "Status", "Sales"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      });

      doc.save(`products-report-${selectedDateRange.value}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error generating PDF report. Please try again.");
    }
  }, [filteredProducts, selectedDateRange, dateRange]);

  const handleExportExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();

      const productsWS = XLSX.utils.json_to_sheet(
        filteredProducts.map((product) => ({
          "Product Name": product.name || "",
          "SKU": product.sku || "",
          "Barcode": product.barcode || "",
          "Category": product.category || "",
          "Subcategory": product.subcategory || "",
          "Brand": product.brand || "",
          "Price": product.price || 0,
          "Compare At Price": product.compareAtPrice || 0,
          "Cost Price": product.costPrice || 0,
          "Stock": product.stock || 0,
          "Low Stock Threshold": product.lowStockThreshold || 0,
          "Status": product.status || "",
          "Visibility": product.visibility || "",
          "Tags": (Array.isArray(product.tags) ? product.tags : []).join(", "),
          "Description": product.description || "",
          "Weight (g)": product.weight || 0,
          "Length (cm)": product.dimensions?.length || 0,
          "Width (cm)": product.dimensions?.width || 0,
          "Height (cm)": product.dimensions?.height || 0,
          "Images": (Array.isArray(product.images) ? product.images : []).join(", "),
          "SEO Title": product.seoTitle || "",
          "SEO Description": product.seoDescription || "",
          "Created At": product.createdAt || "",
          "Updated At": product.updatedAt || "",
          "Sales Count": product.salesCount || 0,
          "View Count": product.viewCount || 0,
          "Rating": product.rating || 0,
          "Review Count": product.reviewCount || 0,
        }))
      );

      XLSX.utils.book_append_sheet(wb, productsWS, "Products");

      const fileName = `products-report-${selectedDateRange.value}-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error generating Excel report. Please try again.");
    }
  }, [filteredProducts, selectedDateRange]);

  const handleExport = (type) => {
    setExportDropdownOpen(false);
    switch (type) {
      case "pdf":
        handleExportPDF();
        break;
      case "excel":
        handleExportExcel();
        break;
      case "share":
        if (navigator.share) {
          navigator.share({
            title: "Products Report",
            text: `Products Report for ${dateRange}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard!");
        }
        break;
      case "print":
        // Add print-specific classes before printing
        document.body.classList.add('printing');
        setTimeout(() => {
          window.print();
          // Remove print classes after printing
          setTimeout(() => {
            document.body.classList.remove('printing');
          }, 100);
        }, 100);
        break;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Real-time Database Dashboard Status */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm border-2 border-green-200 p-6 print-clean print-header">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Product Database Dashboard - Live Data</h3>
              <p className="text-green-700 text-sm">
                Real-time product catalog via Redux & Axios • Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              loading ? 'bg-yellow-100 text-yellow-800' : error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {loading ? (
                <>
                  <Activity className="w-2 h-2 text-yellow-600 animate-pulse" />
                  <span>Syncing...</span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span>Error</span>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 text-green-600" />
                  <span>Live</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Products</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{products?.length || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {products?.filter(p => p.status === 'active' || p.status === 'published').length || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {products?.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 10) && (p.stock || 0) > 0).length || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Out of Stock</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {products?.filter(p => (p.stock || 0) === 0).length || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Categories</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{availableCategories?.length || 0}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Database Error:</p>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={refreshProducts}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Success Message Display */}
        {successMessage && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Products Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Data Management</h2>
          <p className="text-gray-600 mt-1">
            Manage your product catalog and inventory • {filteredProducts.length} products displayed
          </p>
        </div>

        <div className="flex items-center space-x-3 print-hide">
          <DateRangePicker
            selectedRange={selectedDateRange}
            onRangeChange={handleDateRangeChange}
            dateRange={dateRange}
          />

          <button
            onClick={refreshProducts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>

          <div className="relative print-hide" ref={exportDropdownRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  exportDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                <div className="p-1">
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Export as Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4 text-red-600" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport("share")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Share className="h-4 w-4 text-blue-600" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => handleExport("print")}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4 text-gray-600" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Statistics */}
      <ProductStats products={filteredProducts} dateRange={dateRange} />

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, SKU, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 print-hide">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading products...</p>
          </div>
        </div>
      ) : (
        <div className="print-content print-table print-clean">
          <ProductTable
            products={filteredProducts}
            onUpdateStatus={updateProductStatus}
            onDeleteProduct={deleteProduct}
            onViewProduct={handleViewProduct}
            onEditProduct={handleEditProduct}
            onUpdateStock={updateProductStock}
          />
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
});

DashboardProductData.displayName = "DashboardProductData";

export default DashboardProductData;
export { ProductStats, ProductTable };
