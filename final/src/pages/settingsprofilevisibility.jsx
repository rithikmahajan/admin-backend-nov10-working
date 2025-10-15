import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  User,
  Shield,
  Eye,
  Settings,
  Download,
  Upload,
  Trash2,
  BarChart3,
  Lock,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

// ==============================
// CONSTANTS
// ==============================

const VISIBILITY_LEVELS = Object.freeze({
  PUBLIC: "public",
  FRIENDS: "friends",
  PRIVATE: "private",
  CUSTOM: "custom",
});

const DATA_COLLECTION_TYPES = Object.freeze({
  BASIC_INFO: "basicInfo",
  ACTIVITY_DATA: "activityData",
  INTERACTION_DATA: "interactionData",
  PREFERENCE_DATA: "preferenceData",
  LOCATION_DATA: "locationData",
  DEVICE_DATA: "deviceData",
});

const CONSENT_STATUS = Object.freeze({
  GRANTED: "granted",
  DENIED: "denied",
  PENDING: "pending",
  REVOKED: "revoked",
});

const DEFAULT_SETTINGS = Object.freeze({
  collectBasicInfo: true,
  collectActivityData: false,
  collectInteractionData: true,
  collectPreferenceData: true,
  collectLocationData: false,
  collectDeviceData: false,
  visibilityLevel: VISIBILITY_LEVELS.FRIENDS,
  dataRetentionPeriod: 365,
  anonymizeData: false,
  shareWithThirdParties: false,
  enableAnalytics: true,
  consentTimestamp: null,
  lastUpdated: null,
});

// ==============================
// IN-MEMORY STORAGE SYSTEM
// ==============================

class InMemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  setItem(key, value) {
    this.data.set(key, value);
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

// ==============================
// PROFILE VISIBILITY DATA COLLECTOR
// ==============================

const createProfileVisibilityCollector = () => {
  const storage = new InMemoryStorage();

  return {
    settings: { ...DEFAULT_SETTINGS },
    collectedData: {},
    consentRecords: [],
    analyticsData: {},

    // Cache for performance
    _cachedTotalDataPoints: null,
    _cacheInvalidated: true,
    _lastCacheUpdate: null,
    _deviceDataCache: null,
    _timeouts: new Set(),
    _eventListeners: [],

    async initialize() {
      try {
        await Promise.all([
          this.loadSettings(),
          this.loadCollectedData(),
          this.loadConsentRecords(),
        ]);
        this.setupEventListeners();
        this._invalidateCache();
        console.log(
          "Profile Visibility Data Collector initialized successfully"
        );
      } catch (error) {
        console.error(
          "Failed to initialize Profile Visibility Data Collector:",
          error
        );
      }
    },

    async loadSettings() {
      try {
        const savedSettings = storage.getItem("profileVisibilitySettings");
        if (savedSettings) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
      } catch (error) {
        console.error("Error loading profile visibility settings:", error);
      }
    },

    async saveSettings() {
      this._debounce(
        "saveSettings",
        () => {
          try {
            this.settings.lastUpdated = new Date().toISOString();
            storage.setItem(
              "profileVisibilitySettings",
              JSON.stringify(this.settings)
            );
          } catch (error) {
            console.error("Error saving profile visibility settings:", error);
          }
        },
        100
      );
    },

    async loadCollectedData() {
      try {
        const savedData = storage.getItem("profileVisibilityData");
        if (savedData) {
          this.collectedData = JSON.parse(savedData);
        }
      } catch (error) {
        console.error(
          "Error loading collected profile visibility data:",
          error
        );
      }
    },

    async saveCollectedData() {
      this._debounce(
        "saveData",
        () => {
          try {
            storage.setItem(
              "profileVisibilityData",
              JSON.stringify(this.collectedData)
            );
            this._invalidateCache();
          } catch (error) {
            console.error(
              "Error saving collected profile visibility data:",
              error
            );
          }
        },
        200
      );
    },

    async loadConsentRecords() {
      try {
        const savedConsent = storage.getItem("profileVisibilityConsent");
        if (savedConsent) {
          this.consentRecords = JSON.parse(savedConsent);
        }
      } catch (error) {
        console.error("Error loading consent records:", error);
      }
    },

    saveConsentRecords() {
      this._debounce(
        "saveConsent",
        () => {
          try {
            storage.setItem(
              "profileVisibilityConsent",
              JSON.stringify(this.consentRecords)
            );
          } catch (error) {
            console.error("Error saving consent records:", error);
          }
        },
        100
      );
    },

    _debounce(key, func, delay) {
      const timeoutKey = `${key}Timeout`;
      if (this[timeoutKey]) {
        clearTimeout(this[timeoutKey]);
        this._timeouts.delete(this[timeoutKey]);
      }
      this[timeoutKey] = setTimeout(() => {
        func();
        this._timeouts.delete(this[timeoutKey]);
        delete this[timeoutKey];
      }, delay);
      this._timeouts.add(this[timeoutKey]);
    },

    _invalidateCache() {
      if (!this._cacheInvalidated) {
        this._cachedTotalDataPoints = null;
        this._cacheInvalidated = true;
        this._lastCacheUpdate = Date.now();
      }
    },

    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings();
      this.recordConsentChange(newSettings);
    },

    recordConsentChange(settings) {
      const consentRecord = {
        timestamp: new Date().toISOString(),
        settings: { ...settings },
        ipAddress: "xxx.xxx.xxx.xxx",
        userAgent: navigator.userAgent,
      };

      this.consentRecords.push(consentRecord);
      this.saveConsentRecords();
    },

    collectBasicInfo(userInfo) {
      if (!this.settings.collectBasicInfo || !userInfo) return;

      const now = new Date().toISOString();
      const basicInfo = {
        userId: userInfo.id,
        username: userInfo.username,
        email: this.settings.anonymizeData
          ? this.anonymizeEmail(userInfo.email)
          : userInfo.email,
        profilePicture: userInfo.profilePicture,
        joinDate: userInfo.joinDate,
        lastLogin: now,
        collectedAt: now,
      };

      this.collectedData.basicInfo = basicInfo;
      this.saveCollectedData();
    },

    collectActivityData(activityInfo) {
      if (!this.settings.collectActivityData || !activityInfo) return;

      const now = new Date().toISOString();
      const activityData = {
        pageViews: activityInfo.pageViews || [],
        timeSpent: activityInfo.timeSpent || {},
        featuresUsed: activityInfo.featuresUsed || [],
        searchQueries: this.settings.anonymizeData
          ? this.anonymizeSearchQueries(activityInfo.searchQueries)
          : activityInfo.searchQueries || [],
        clickEvents: activityInfo.clickEvents || [],
        collectedAt: now,
      };

      if (!this.collectedData.activityData) {
        this.collectedData.activityData = [];
      }
      this.collectedData.activityData.push(activityData);
      this.saveCollectedData();
    },

    collectDeviceData() {
      if (!this.settings.collectDeviceData) return;

      if (
        this._deviceDataCache &&
        Date.now() - this._deviceDataCache.timestamp < 300000
      ) {
        return;
      }

      const now = new Date().toISOString();
      const deviceData = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        collectedAt: now,
      };

      this._deviceDataCache = {
        data: deviceData,
        timestamp: Date.now(),
      };

      this.collectedData.deviceData = deviceData;
      this.saveCollectedData();
    },

    getTotalDataPoints() {
      if (!this._cacheInvalidated && this._cachedTotalDataPoints !== null) {
        return this._cachedTotalDataPoints;
      }

      let count = 0;
      for (const data of Object.values(this.collectedData)) {
        if (Array.isArray(data)) {
          count += data.length;
        } else if (data && typeof data === "object") {
          count += 1;
        }
      }

      this._cachedTotalDataPoints = count;
      this._cacheInvalidated = false;

      return count;
    },

    getDataSummary() {
      return {
        totalDataPoints: this.getTotalDataPoints(),
        dataTypes: Object.keys(this.collectedData),
        lastUpdated: this.settings.lastUpdated,
        consentStatus: this.getConsentStatus(),
        retentionPeriod: this.settings.dataRetentionPeriod,
        anonymized: this.settings.anonymizeData,
      };
    },

    getConsentStatus() {
      if (this.consentRecords.length === 0) return CONSENT_STATUS.PENDING;
      const lastRecord = this.consentRecords[this.consentRecords.length - 1];
      return lastRecord.settings.collectBasicInfo
        ? CONSENT_STATUS.GRANTED
        : CONSENT_STATUS.DENIED;
    },

    calculatePrivacyScore() {
      let score = 100;
      const { settings } = this;

      if (settings.collectActivityData) score -= 15;
      if (settings.collectLocationData) score -= 20;
      if (settings.collectDeviceData) score -= 10;
      if (settings.shareWithThirdParties) score -= 25;
      if (!settings.anonymizeData) score -= 15;

      return Math.max(0, score);
    },

    anonymizeEmail(email) {
      if (!email || typeof email !== "string") return "";

      const atIndex = email.indexOf("@");
      if (atIndex === -1) return email;

      const username = email.substring(0, atIndex);
      const domain = email.substring(atIndex);

      if (username.length <= 2) return email;

      const anonymizedUsername =
        username[0] +
        "*".repeat(username.length - 2) +
        username[username.length - 1];
      return anonymizedUsername + domain;
    },

    anonymizeSearchQueries(queries) {
      if (!Array.isArray(queries)) return [];

      return queries.map((query) => {
        if (typeof query === "string") {
          return query.replace(
            /\b\w{3,}\b/g,
            (word) => word[0] + "*".repeat(Math.max(0, word.length - 1))
          );
        }
        return query;
      });
    },

    exportData(format = "json") {
      const exportData = {
        settings: this.settings,
        collectedData: this.collectedData,
        consentRecords: this.consentRecords,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };

      if (format === "json") {
        return JSON.stringify(exportData, null, 2);
      }
      return exportData;
    },

    clearAllData() {
      this.collectedData = {};
      this.consentRecords = [];
      this._invalidateCache();
      this._deviceDataCache = null;

      storage.removeItem("profileVisibilityData");
      storage.removeItem("profileVisibilityConsent");
    },

    setupEventListeners() {
      if (this.settings.collectActivityData) {
        const handleBeforeUnload = () => {
          this.collectActivityData({
            timeSpent: {
              [window.location.pathname]: Date.now() - this.pageLoadTime,
            },
            pageViews: [window.location.pathname],
          });
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        this._eventListeners.push({
          element: window,
          event: "beforeunload",
          handler: handleBeforeUnload,
        });

        this.pageLoadTime = Date.now();
      }
    },

    cleanup() {
      // Clear timeouts
      this._timeouts.forEach((timeout) => clearTimeout(timeout));
      this._timeouts.clear();

      // Remove event listeners
      this._eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this._eventListeners = [];
    },
  };
};

// ==============================
// REACT HOOK
// ==============================

const useProfileVisibilityData = () => {
  const [collector] = useState(() => createProfileVisibilityCollector());
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeCollector = useCallback(async () => {
    try {
      setIsLoading(true);
      await collector.initialize();
      setSettings({ ...collector.settings });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [collector]);

  useEffect(() => {
    initializeCollector();

    return () => {
      collector.cleanup();
    };
  }, [initializeCollector, collector]);

  const updateSettings = useCallback(
    (newSettings) => {
      collector.updateSettings(newSettings);
      setSettings({ ...collector.settings });
    },
    [collector]
  );

  const collectData = useCallback(
    (dataType, data) => {
      const collectionMethods = {
        [DATA_COLLECTION_TYPES.BASIC_INFO]: () =>
          collector.collectBasicInfo(data),
        [DATA_COLLECTION_TYPES.ACTIVITY_DATA]: () =>
          collector.collectActivityData(data),
        [DATA_COLLECTION_TYPES.DEVICE_DATA]: () =>
          collector.collectDeviceData(),
      };

      const method = collectionMethods[dataType];
      if (method) {
        method();
      }
    },
    [collector]
  );

  return {
    settings,
    updateSettings,
    collectData,
    exportData: useCallback(
      (format) => collector.exportData(format),
      [collector]
    ),
    clearAllData: useCallback(() => {
      collector.clearAllData();
      setSettings({ ...collector.settings });
    }, [collector]),
    getDataSummary: useCallback(() => collector.getDataSummary(), [collector]),
    isLoading,
    error,
    collector,
  };
};

// ==============================
// MAIN COMPONENT
// ==============================

const ProfileVisibilityDataCollectionComponent = () => {
  const {
    settings,
    updateSettings,
    collectData,
    exportData,
    clearAllData,
    getDataSummary,
    isLoading,
    error,
  } = useProfileVisibilityData();

  const [activeTab, setActiveTab] = useState("settings");
  const [showExportModal, setShowExportModal] = useState(false);

  const dataSummary = useMemo(() => {
    try {
      return getDataSummary();
    } catch {
      return null;
    }
  }, [getDataSummary, settings]);

  const privacyScore = useMemo(() => {
    let score = 100;
    if (settings.collectActivityData) score -= 15;
    if (settings.collectLocationData) score -= 20;
    if (settings.collectDeviceData) score -= 10;
    if (settings.shareWithThirdParties) score -= 25;
    if (!settings.anonymizeData) score -= 15;
    return Math.max(0, score);
  }, [settings]);

  const handleSettingChange = useCallback(
    (key, value) => {
      updateSettings({ [key]: value });
    },
    [updateSettings]
  );

  const handleCollectSampleData = useCallback(() => {
    collectData(DATA_COLLECTION_TYPES.BASIC_INFO, {
      id: "user123",
      username: "john_doe",
      email: "john@example.com",
      joinDate: "2024-01-15",
      profilePicture: "/api/placeholder/80/80",
    });
  }, [collectData]);

  const handleExport = useCallback(() => {
    const data = exportData("json");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile-visibility-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [exportData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            Loading Profile Visibility Manager...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Error
          </h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Profile Visibility Manager
              </h1>
              <p className="text-sm text-gray-600">
                Data Collection & Privacy Controls
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Privacy Score: {privacyScore}%
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dataSummary?.totalDataPoints || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Types</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dataSummary?.dataTypes?.length || 0}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Privacy Score
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {privacyScore}%
                </p>
              </div>
              <Lock className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Consent Status
                </p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {dataSummary?.consentStatus || "Pending"}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 mb-8">
          <div className="border-b border-slate-200/50">
            <nav className="flex space-x-8 px-6">
              {["settings", "data", "privacy"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Data Collection Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Basic Information
                        </p>
                        <p className="text-sm text-gray-500">
                          Username, email, profile data
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.collectBasicInfo}
                        onChange={(e) =>
                          handleSettingChange(
                            "collectBasicInfo",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Activity Data */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Activity Data
                        </p>
                        <p className="text-sm text-gray-500">
                          Page views, time spent, clicks
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.collectActivityData}
                        onChange={(e) =>
                          handleSettingChange(
                            "collectActivityData",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Device Data */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900">Device Data</p>
                        <p className="text-sm text-gray-500">
                          Browser, OS, screen resolution
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.collectDeviceData}
                        onChange={(e) =>
                          handleSettingChange(
                            "collectDeviceData",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Anonymize Data */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Anonymize Data
                        </p>
                        <p className="text-sm text-gray-500">
                          Mask sensitive information
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.anonymizeData}
                        onChange={(e) =>
                          handleSettingChange("anonymizeData", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200/50">
                  <button
                    onClick={handleCollectSampleData}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Collect Sample Data
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Data</span>
                  </button>
                  <button
                    onClick={clearAllData}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All Data</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Collected Data Overview
                </h3>

                {dataSummary && dataSummary.totalDataPoints > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border border-blue-200/50">
                        <h4 className="font-medium text-blue-900 mb-2">
                          Data Points
                        </h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {dataSummary.totalDataPoints}
                        </p>
                        <p className="text-sm text-blue-700">
                          Total collected entries
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200/50">
                        <h4 className="font-medium text-green-900 mb-2">
                          Data Types
                        </h4>
                        <p className="text-2xl font-bold text-green-600">
                          {dataSummary.dataTypes.length}
                        </p>
                        <p className="text-sm text-green-700">
                          Different data categories
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-4 border border-purple-200/50">
                        <h4 className="font-medium text-purple-900 mb-2">
                          Retention
                        </h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {dataSummary.retentionPeriod}
                        </p>
                        <p className="text-sm text-purple-700">
                          Days retention period
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="font-medium text-gray-900">
                          Data Types Collected
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dataSummary.dataTypes.map((type, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="font-medium text-gray-700 capitalize">
                                {type.replace(/([A-Z])/g, " $1").toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Data Collected Yet
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Start collecting data to see insights here.
                    </p>
                    <button
                      onClick={handleCollectSampleData}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Collect Sample Data
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Privacy & Compliance
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Privacy Score */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-green-900">
                        Privacy Score
                      </h4>
                      <Lock className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex items-end space-x-2 mb-2">
                      <span className="text-3xl font-bold text-green-600">
                        {privacyScore}
                      </span>
                      <span className="text-green-700 font-medium">/ 100</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${privacyScore}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-green-700">
                      {privacyScore >= 80
                        ? "Excellent privacy protection"
                        : privacyScore >= 60
                        ? "Good privacy protection"
                        : privacyScore >= 40
                        ? "Moderate privacy protection"
                        : "Consider improving privacy settings"}
                    </p>
                  </div>

                  {/* Data Protection Status */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900">
                        Data Protection
                      </h4>
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                          Anonymization
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            settings.anonymizeData
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {settings.anonymizeData ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                          Third-party Sharing
                        </span>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            !settings.shareWithThirdParties
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {!settings.shareWithThirdParties
                            ? "Blocked"
                            : "Allowed"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                          Data Retention
                        </span>
                        <span className="text-sm font-medium text-blue-900">
                          {settings.dataRetentionPeriod} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Checklist */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-medium text-gray-900">
                      Privacy Compliance Checklist
                    </h4>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      {
                        label: "User consent obtained",
                        status: dataSummary?.consentStatus === "granted",
                      },
                      {
                        label: "Data anonymization enabled",
                        status: settings.anonymizeData,
                      },
                      {
                        label: "Third-party sharing disabled",
                        status: !settings.shareWithThirdParties,
                      },
                      {
                        label: "Reasonable retention period",
                        status: settings.dataRetentionPeriod <= 365,
                      },
                      {
                        label: "Location data collection disabled",
                        status: !settings.collectLocationData,
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            item.status ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <CheckCircle
                            className={`h-3 w-3 text-white ${
                              item.status ? "" : "hidden"
                            }`}
                          />
                          <X
                            className={`h-3 w-3 text-white ${
                              !item.status ? "" : "hidden"
                            }`}
                          />
                        </div>
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Export Data
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              This will export all your collected data, settings, and consent
              records in JSON format.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileVisibilityDataCollectionComponent;
