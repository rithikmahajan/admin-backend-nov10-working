import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
import {
  Package,
  Edit2,
  Trash2,
  Download,
  Check,
  X,
  Search,
  Settings,
  RefreshCw,
} from "lucide-react";
import ScrollToTop from "../components/ScrollToTop";

// Constants for marketplace sync
const PRODUCT_SYNC_HEADERS = [
  "Image",
  "product name",
  "Price",
  "SKU",
  "barcode no.",
  "synced",
  "marketplace",
  "error",
  "action",
];

const SYNC_LOG_HEADERS = [
  "date",
  "operation",
  "market place",
  "status",
  "error message",
];

// Status Colors Configuration
const STATUS_COLORS = {
  success: "bg-[#00B69B] text-white",
  error: "bg-[#EF3826] text-white",
  warning: "bg-yellow-500 text-white",
  info: "bg-[#5088FF] text-white",
  Yes: "bg-[#00B69B] text-white",
  no: "bg-[#5088FF] text-white",
  sync: "bg-[#EF3826] text-white",
  fail: "bg-[#EF3826] text-white",
  connected: "bg-[#00B69B] hover:bg-green-600 text-white",
  "not connected": "bg-[#EF3826] hover:bg-red-600 text-white",
};

// Custom hooks for marketplace data management
const useMarketplaceData = () => {
  const productSyncData = useMemo(
    () => [
      {
        id: 1,
        image: "/api/placeholder/200/200",
        name: "Item Stock",
        price: "2025",
        sku: "2025",
        barcode: "2025",
        synced: "Yes",
        marketplace: "amazon",
        status: "connected",
        error: null,
        action: "sync now",
      },
      {
        id: 2,
        image: "/api/placeholder/200/200",
        name: "Item Stock",
        price: "2025",
        sku: "2025",
        barcode: "2025",
        synced: "no",
        marketplace: "flipkart",
        status: "not connected",
        error: "sync",
        action: "sync now",
      },
      {
        id: 3,
        image: "/api/placeholder/200/200",
        name: "Item Stock",
        price: "2025",
        sku: "2025",
        barcode: "2025",
        synced: "sync",
        marketplace: "ajio",
        status: "not connected",
        error: "sync",
        action: "sync now",
      },
    ],
    []
  );

  const marketplaces = useMemo(
    () => [
      {
        id: 1,
        name: "amazon",
        sellerId: "1234",
        status: "connected",
        lastSync: "02.03pm",
      },
      {
        id: 2,
        name: "flipkart",
        sellerId: "5678",
        status: "not connected",
        lastSync: null,
      },
      {
        id: 3,
        name: "ajio",
        sellerId: "4587",
        status: "connected",
        lastSync: null,
      },
      {
        id: 4,
        name: "myntra",
        sellerId: null,
        status: "not connected",
        lastSync: null,
      },
      {
        id: 5,
        name: "nykaa",
        sellerId: null,
        status: "not connected",
        lastSync: null,
      },
    ],
    []
  );

  const syncLogs = useMemo(
    () => [
      {
        id: 1,
        date: "Nov 11,2025",
        operation: "product sync",
        marketplace: "amazon",
        status: "success",
        error: null,
      },
      {
        id: 2,
        date: "Nov 11,2025",
        operation: "inventory sync",
        marketplace: "flipkart",
        status: "fail",
        error: "connection timeout",
      },
      {
        id: 3,
        date: "Nov 11,2025",
        operation: "product sync",
        marketplace: "ajio",
        status: "fail",
        error: "invalid credentials",
      },
    ],
    []
  );

  return { productSyncData, marketplaces, syncLogs };
};

// Setting Button Component
const SettingButton = memo(({ isOn, onToggle, label }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-700">{label}</span>
    <button
      onClick={onToggle}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        isOn
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {isOn ? "On" : "Off"}
    </button>
  </div>
));

SettingButton.displayName = "SettingButton";

// Hour Dropdown Component
const HourDropdown = memo(({ value, onChange, label }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-700">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
    >
      <option value="1hr">1 hour</option>
      <option value="3hr">3 hours</option>
      <option value="6hr">6 hours</option>
    </select>
  </div>
));

HourDropdown.displayName = "HourDropdown";

// Product Sync Section Component
const ProductSyncSection = memo(
  ({ productSyncData, searchTerm, onSearchChange }) => (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-10">
        Product Sync Manager
      </h2>

      <div className="mb-10">
        <div className="relative max-w-xl">
          <Search className="h-5 w-5 absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, marketplace, or SKU..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-200 text-sm font-medium placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              {PRODUCT_SYNC_HEADERS.map((header) => (
                <th
                  key={header}
                  className="text-left py-4 px-6 font-semibold text-sm text-gray-600 uppercase tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productSyncData.map((product, index) => (
              <tr
                key={`sync-product-${product.id}`}
                className={`border-t-2 border-gray-200 hover:bg-gray-50 transition-colors duration-200 group ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="py-5 px-6">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-500" />
                  </div>
                </td>
                <td className="py-5 px-6 font-semibold text-gray-900 text-base group-hover:text-gray-800 transition-colors duration-200">
                  {product.name}
                </td>
                <td className="py-5 px-6 text-gray-700 text-base font-medium">
                  {product.price}
                </td>
                <td className="py-5 px-6 text-gray-700 text-sm">
                  <span className="font-mono">{product.sku}</span>
                </td>
                <td className="py-5 px-6 text-gray-700 text-sm">
                  <span className="font-mono">{product.barcode}</span>
                </td>
                <td className="py-5 px-6">
                  <span
                    className={`text-sm font-medium ${
                      product.synced === "Yes"
                        ? "text-green-600"
                        : product.synced === "no"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {product.synced === "Yes"
                      ? "Connected"
                      : product.synced === "no"
                      ? "Disconnected"
                      : product.synced}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm font-medium text-gray-800 capitalize">
                    {product.marketplace}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-sm text-red-600 font-medium">
                    {product.error || "No errors"}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Sync Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
);

ProductSyncSection.displayName = "ProductSyncSection";

// Marketplace Settings Section Component
const MarketplaceSettingsSection = memo(() => {
  const [settings, setSettings] = useState({
    globalInventorySync: true,
    syncFrequency: true,
    globalSync: true,
    additionalSync: false,
    perMarketplaceRules: "6hr",
  });

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const updateDropdown = useCallback((value) => {
    setSettings((prev) => ({
      ...prev,
      perMarketplaceRules: value,
    }));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h3 className="text-3xl font-bold text-gray-900 mb-10">
        Marketplace Settings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-6 tracking-tight">
            Orders from marketplace
          </h4>
          <div className="space-y-5">
            <SettingButton
              isOn={settings.globalInventorySync}
              onToggle={() => toggleSetting("globalInventorySync")}
              label="Global inventory sync"
            />
            <SettingButton
              isOn={settings.syncFrequency}
              onToggle={() => toggleSetting("syncFrequency")}
              label="Sync frequency"
            />
            <HourDropdown
              value={settings.perMarketplaceRules}
              onChange={updateDropdown}
              label="Per marketplace rules"
            />
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-6 tracking-tight">
            Out series settings
          </h4>
          <div className="space-y-5">
            <SettingButton
              isOn={settings.globalSync}
              onToggle={() => toggleSetting("globalSync")}
              label="Global sync"
            />
            <SettingButton
              isOn={settings.additionalSync}
              onToggle={() => toggleSetting("additionalSync")}
              label="Additional sync"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

MarketplaceSettingsSection.displayName = "MarketplaceSettingsSection";

// Marketplace Connections Section Component
const MarketplaceConnectionsSection = memo(({ marketplaces }) => (
  <div className="bg-white rounded-2xl shadow-md p-8">
    <h2 className="text-3xl font-bold text-gray-900 mb-8">
      Connect Marketplaces
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-5 tracking-tight">
          Available marketplace
        </h3>
        <div className="space-y-2 border-2 p-4 rounded-xl">
          <div className="flex justify-between items-center font-semibold pb-2 text-gray-600 uppercase text-sm tracking-wide">
            <span>Marketplace</span>
            <span>Status</span>
          </div>
          {marketplaces.map((marketplace) => (
            <div
              key={`available-${marketplace.id}`}
              className="flex justify-between items-center py-2 border-t-2 border-gray-200"
            >
              <span className="text-base text-gray-800 capitalize">
                {marketplace.name}
              </span>
              <span
                className={`text-sm font-medium ${
                  marketplace.status === "connected"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {marketplace.status === "connected"
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-5 tracking-tight">
          Connected accounts
        </h3>
        <div className="space-y-2 border-2 p-4 rounded-xl">
          <div className="grid grid-cols-3 gap-4 font-semibold pb-2 text-gray-600 uppercase text-sm tracking-wide">
            <span>Seller ID</span>
            <span>Last Sync</span>
            <span>Action</span>
          </div>
          {marketplaces.map((marketplace) => (
            <div
              key={`connected-${marketplace.id}`}
              className="grid grid-cols-3 gap-4 items-center py-3 border-t-2 border-gray-200"
            >
              <span className="text-sm text-gray-700 font-mono truncate">
                {marketplace.sellerId || "Not connected"}
              </span>
              <span className="text-sm text-gray-600">
                {marketplace.lastSync || "Never"}
              </span>
              <div className="flex justify-start">
                {marketplace.status === "connected" && (
                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                    Sync Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

MarketplaceConnectionsSection.displayName = "MarketplaceConnectionsSection";

// Sync Logs Section Component
const SyncLogsSection = memo(({ syncLogs }) => (
  <div className="bg-white rounded-2xl shadow-md p-8">
    <h2 className="text-3xl font-bold text-gray-900 mb-8">Sync Logs</h2>

    <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-50">
            {SYNC_LOG_HEADERS.map((header) => (
              <th
                key={header}
                className="text-left py-4 px-5 text-sm font-semibold text-gray-600 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {syncLogs.map((log) => (
            <tr
              key={`sync-log-${log.id}`}
              className="border-t-2 border-gray-200 hover:bg-gray-50 transition-colors duration-150"
            >
              <td className="py-4 px-5 text-sm font-medium text-gray-900 whitespace-nowrap">
                {log.date}
              </td>
              <td className="py-4 px-5 text-sm font-medium text-gray-900 capitalize whitespace-nowrap">
                {log.operation}
              </td>
              <td className="py-4 px-5 text-sm text-gray-700 capitalize whitespace-nowrap">
                {log.marketplace}
              </td>
              <td className="py-4 px-5">
                <span
                  className={`text-sm font-medium ${
                    log.status === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {log.status === "success" ? "Success" : "Failed"}
                </span>
              </td>
              <td className="py-4 px-5">
                <span className="text-sm text-gray-700">
                  {log.error || "No errors"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
));

SyncLogsSection.displayName = "SyncLogsSection";

// Main Marketplace Sync Component
const DashboardMarketplaceSync = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const { productSyncData, marketplaces, syncLogs } = useMarketplaceData();

  // Optimized filtered data
  const searchTermLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);

  const filteredSyncProducts = useMemo(() => {
    if (!searchTermLower) return productSyncData;

    return productSyncData.filter((product) => {
      const { name, marketplace, sku } = product;
      return (
        name.toLowerCase().includes(searchTermLower) ||
        marketplace.toLowerCase().includes(searchTermLower) ||
        sku.toLowerCase().includes(searchTermLower)
      );
    });
  }, [productSyncData, searchTermLower]);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  return (
    <div className="space-y-6">
      <ProductSyncSection
        productSyncData={filteredSyncProducts}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <MarketplaceConnectionsSection marketplaces={marketplaces} />
      <SyncLogsSection syncLogs={syncLogs} />
      <MarketplaceSettingsSection />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
});

DashboardMarketplaceSync.displayName = "DashboardMarketplaceSync";

export default DashboardMarketplaceSync;
export {
  ProductSyncSection,
  MarketplaceConnectionsSection,
  SyncLogsSection,
  MarketplaceSettingsSection,
  useMarketplaceData,
};
