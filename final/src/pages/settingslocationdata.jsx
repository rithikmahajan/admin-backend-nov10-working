import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

const LOCATION_ACCURACY_LEVELS = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  DISABLED: "disabled",
});

const LOCATION_DATA_TYPES = Object.freeze({
  GPS_COORDINATES: "gpsCoordinates",
  IP_LOCATION: "ipLocation",
  WIFI_LOCATION: "wifiLocation",
  CELLULAR_LOCATION: "cellularLocation",
  TIMEZONE: "timezone",
  ADDRESS: "address",
  COUNTRY: "country",
  REGION: "region",
  CITY: "city",
});

const COLLECTION_METHODS = Object.freeze({
  AUTOMATIC: "automatic",
  MANUAL: "manual",
  ON_REQUEST: "onRequest",
  PERIODIC: "periodic",
});

const PRIVACY_LEVELS = Object.freeze({
  EXACT: "exact",
  APPROXIMATE: "approximate",
  CITY_LEVEL: "cityLevel",
  COUNTRY_LEVEL: "countryLevel",
  ANONYMOUS: "anonymous",
});

const DEFAULT_LOCATION_SETTINGS = Object.freeze({
  collectionEnabled: false,
  accuracyLevel: LOCATION_ACCURACY_LEVELS.MEDIUM,
  collectionMethod: COLLECTION_METHODS.ON_REQUEST,
  privacyLevel: PRIVACY_LEVELS.CITY_LEVEL,
  retentionPeriod: 30,
  shareWithThirdParties: false,
  anonymizeData: true,
  enableLocationHistory: false,
  enableAnalytics: true,
  backgroundTracking: false,
  frequencyMinutes: 60,
  radiusMeters: 100,
  consentTimestamp: null,
  lastUpdated: null,
});

const GEOLOCATION_OPTIONS_CACHE = new Map();

const getGeolocationOptions = (accuracyLevel) => {
  if (GEOLOCATION_OPTIONS_CACHE.has(accuracyLevel)) {
    return GEOLOCATION_OPTIONS_CACHE.get(accuracyLevel);
  }

  const options = {
    [LOCATION_ACCURACY_LEVELS.HIGH]: {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000,
    },
    [LOCATION_ACCURACY_LEVELS.MEDIUM]: {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000,
    },
    [LOCATION_ACCURACY_LEVELS.LOW]: {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000,
    },
  }[accuracyLevel] || {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 300000,
  };

  GEOLOCATION_OPTIONS_CACHE.set(accuracyLevel, options);
  return options;
};

const RADIAN_CONVERSION = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

class LocationDataCollector {
  constructor() {
    this.settings = { ...DEFAULT_LOCATION_SETTINGS };
    this.locationHistory = [];
    this.currentLocation = null;
    this.watchId = null;
    this.analyticsData = {};
    this.consentRecords = [];
    this.isTracking = false;
    this.saveTimeout = null;
    this.lastSaveTime = 0;
    this.SAVE_DEBOUNCE_MS = 1000;
    this.eventListeners = new Map();
    this.permissionCache = null;
    this.permissionCacheTime = 0;
    this.PERMISSION_CACHE_DURATION = 60000;
  }

  async initialize() {
    try {
      await this.loadSettings();
      await this.loadLocationHistory();
      this.setupEventListeners();

      if (
        this.settings.collectionEnabled &&
        this.settings.collectionMethod === COLLECTION_METHODS.AUTOMATIC
      ) {
        await this.startLocationTracking();
      }

      console.log("Location Data Collector initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Location Data Collector:", error);
    }
  }

  async loadSettings() {
    try {
      this.settings = { ...DEFAULT_LOCATION_SETTINGS };
    } catch (error) {
      console.error("Error loading location settings:", error);
      this.settings = { ...DEFAULT_LOCATION_SETTINGS };
    }
  }

  async saveSettings() {
    const now = Date.now();

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      try {
        this.settings.lastUpdated = new Date().toISOString();
        this.lastSaveTime = now;
      } catch (error) {
        console.error("Error saving location settings:", error);
      }
    }, this.SAVE_DEBOUNCE_MS);
  }

  async loadLocationHistory() {
    try {
      this.locationHistory = [];
      this.cleanupExpiredData();
    } catch (error) {
      console.error("Error loading location history:", error);
    }
  }

  async saveLocationHistory() {
    try {
    } catch (error) {
      console.error("Error saving location history:", error);
    }
  }

  updateSettings(newSettings) {
    const oldSettings = this.settings;
    const hasChanges = Object.keys(newSettings).some(
      (key) => oldSettings[key] !== newSettings[key]
    );

    if (!hasChanges) return;

    this.settings = Object.assign({}, this.settings, newSettings);
    this.saveSettings();
    this.recordConsentChange(newSettings);

    if (oldSettings.collectionEnabled !== this.settings.collectionEnabled) {
      if (this.settings.collectionEnabled) {
        this.startLocationTracking();
      } else {
        this.stopLocationTracking();
      }
    }
  }

  recordConsentChange(settings) {
    const consentRecord = {
      timestamp: new Date().toISOString(),
      settings: { ...settings },
      ipAddress: this.getUserIPAddress(),
      userAgent: navigator.userAgent,
      changeType: settings.collectionEnabled ? "granted" : "revoked",
    };

    this.consentRecords.push(consentRecord);
    this.saveConsentRecords();
  }

  saveConsentRecords() {
    try {
    } catch (error) {
      console.error("Error saving consent records:", error);
    }
  }

  async startLocationTracking() {
    if (!this.settings.collectionEnabled || this.isTracking) return;

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const permission = await this.requestLocationPermission();
      if (permission !== "granted") {
        throw new Error("Location permission denied");
      }

      const options = this.getGeolocationOptions();

      if (
        this.settings.collectionMethod === COLLECTION_METHODS.PERIODIC ||
        this.settings.backgroundTracking
      ) {
        this.watchId = navigator.geolocation.watchPosition(
          (position) => this.handleLocationSuccess(position),
          (error) => this.handleLocationError(error),
          options
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => this.handleLocationSuccess(position),
          (error) => this.handleLocationError(error),
          options
        );
      }

      this.isTracking = true;
      console.log("Location tracking started");
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      this.handleLocationError(error);
    }
  }

  stopLocationTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    console.log("Location tracking stopped");
  }

  async requestLocationPermission() {
    try {
      const now = Date.now();

      if (
        this.permissionCache &&
        now - this.permissionCacheTime < this.PERMISSION_CACHE_DURATION
      ) {
        return this.permissionCache;
      }

      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        this.permissionCache = permission.state;
        this.permissionCacheTime = now;
        return permission.state;
      }

      this.permissionCache = "granted";
      this.permissionCacheTime = now;
      return this.permissionCache;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      this.permissionCache = "denied";
      this.permissionCacheTime = Date.now();
      return "denied";
    }
  }

  getGeolocationOptions() {
    return getGeolocationOptions(this.settings.accuracyLevel);
  }

  async handleLocationSuccess(position) {
    const locationData = await this.processLocationData(position);
    this.currentLocation = locationData;

    if (this.settings.enableLocationHistory) {
      this.addToLocationHistory(locationData);
    }

    if (this.settings.enableAnalytics) {
      this.updateAnalytics(locationData);
    }

    this.dispatchLocationEvent("locationUpdate", locationData);
  }

  handleLocationError(error) {
    const errorMessages = {
      [1]: "Location access denied by user",
      [2]: "Location information unavailable",
      [3]: "Location request timed out",
      "Location permission denied": "Location access denied by user",
    };

    const errorMessage =
      errorMessages[error.code] ||
      errorMessages[error.message] ||
      error.message ||
      "Location error occurred";

    console.error("Location error:", errorMessage);
    this.dispatchLocationEvent("locationError", {
      error: errorMessage,
      code: error.code,
    });

    this.tryFallbackLocation();
  }

  async processLocationData(position) {
    const { latitude, longitude, accuracy, altitude, heading, speed } =
      position.coords;
    const timestamp = new Date(position.timestamp).toISOString();

    let processedData = {
      timestamp,
      accuracy,
      source: "gps",
      collectedAt: new Date().toISOString(),
    };

    switch (this.settings.privacyLevel) {
      case PRIVACY_LEVELS.EXACT:
        processedData = {
          ...processedData,
          latitude,
          longitude,
          altitude,
          heading,
          speed,
        };
        break;

      case PRIVACY_LEVELS.APPROXIMATE:
        processedData = {
          ...processedData,
          latitude: this.roundCoordinate(latitude, 3),
          longitude: this.roundCoordinate(longitude, 3),
          altitude: altitude ? Math.round(altitude / 10) * 10 : null,
        };
        break;

      case PRIVACY_LEVELS.CITY_LEVEL:
        processedData = {
          ...processedData,
          latitude: this.roundCoordinate(latitude, 1),
          longitude: this.roundCoordinate(longitude, 1),
        };
        break;

      case PRIVACY_LEVELS.COUNTRY_LEVEL:
        processedData = {
          ...processedData,
          country: await this.getCountryFromCoordinates(latitude, longitude),
        };
        break;

      case PRIVACY_LEVELS.ANONYMOUS:
        processedData = {
          timestamp,
          source: "gps",
          collectedAt: new Date().toISOString(),
        };
        break;
    }

    return processedData;
  }

  roundCoordinate(coord, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(coord * factor) / factor;
  }

  addToLocationHistory(locationData) {
    this.locationHistory.push(locationData);

    const maxSize = 1000;
    if (this.locationHistory.length > maxSize) {
      const removeCount = Math.min(200, this.locationHistory.length - maxSize);
      this.locationHistory.splice(0, removeCount);
    }

    this.saveLocationHistory();
  }

  async tryFallbackLocation() {
    try {
      const ipLocation = await this.getIPBasedLocation();
      if (ipLocation) {
        this.handleLocationSuccess({
          coords: ipLocation,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Fallback location methods failed:", error);
    }
  }

  async getIPBasedLocation() {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: 10000,
          city: data.city,
          region: data.region,
          country: data.country_name,
          source: "ip",
        };
      }
    } catch (error) {
      console.error("IP-based location failed:", error);
    }
    return null;
  }

  async getCountryFromCoordinates(lat, lng) {
    try {
      return "Unknown Country";
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return "Unknown Country";
    }
  }

  updateAnalytics(locationData) {
    this.analyticsData.totalLocations =
      (this.analyticsData.totalLocations || 0) + 1;
    this.analyticsData.lastLocation = locationData;
    this.analyticsData.lastUpdated = new Date().toISOString();

    const historyLength = this.locationHistory.length;
    if (historyLength > 0) {
      const lastLocation = this.locationHistory[historyLength - 1];
      if (
        lastLocation.latitude &&
        lastLocation.longitude &&
        locationData.latitude &&
        locationData.longitude
      ) {
        const distance = this.calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          locationData.latitude,
          locationData.longitude
        );

        this.analyticsData.totalDistance =
          (this.analyticsData.totalDistance || 0) + distance;
      }
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * RADIAN_CONVERSION;
    const dLon = (lon2 - lon1) * RADIAN_CONVERSION;
    const lat1Rad = lat1 * RADIAN_CONVERSION;
    const lat2Rad = lat2 * RADIAN_CONVERSION;

    const a =
      Math.sin(dLat * 0.5) * Math.sin(dLat * 0.5) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(dLon * 0.5) *
        Math.sin(dLon * 0.5);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  dispatchLocationEvent(eventType, data) {
    const eventName = `locationData${eventType}`;

    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new CustomEvent(eventName));
    }

    const newEvent = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(newEvent);
  }

  setupEventListeners() {
    const visibilityHandler = () => {
      if (document.hidden && this.settings.backgroundTracking === false) {
        this.stopLocationTracking();
      } else if (!document.hidden && this.settings.collectionEnabled) {
        this.startLocationTracking();
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler, {
      passive: true,
    });

    this._visibilityHandler = visibilityHandler;
  }

  cleanup() {
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
      this._visibilityHandler = null;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    this.stopLocationTracking();
    this.eventListeners.clear();
  }

  cleanupExpiredData() {
    if (!this.settings.retentionPeriod) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.settings.retentionPeriod);
    const cutoffTime = cutoffDate.getTime();

    let i = 0;
    const originalLength = this.locationHistory.length;

    while (
      i < originalLength &&
      new Date(this.locationHistory[i].collectedAt).getTime() <= cutoffTime
    ) {
      i++;
    }

    if (i > 0) {
      this.locationHistory.splice(0, i);
      this.saveLocationHistory();
    }
  }

  exportData(format = "json") {
    const exportData = {
      settings: this.settings,
      locationHistory: this.locationHistory,
      currentLocation: this.currentLocation,
      analyticsData: this.analyticsData,
      consentRecords: this.consentRecords,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    switch (format) {
      case "json":
        return JSON.stringify(exportData, null, 2);
      case "csv":
        return this.convertLocationsToCsv(this.locationHistory);
      case "gpx":
        return this.convertToGpx(this.locationHistory);
      default:
        return exportData;
    }
  }

  convertLocationsToCsv(locations) {
    if (locations.length === 0) return "";

    const headers = [
      "timestamp",
      "latitude",
      "longitude",
      "accuracy",
      "source",
    ];
    const csvData = locations.map((location) =>
      headers.map((header) => location[header] || "").join(",")
    );

    return [headers.join(","), ...csvData].join("\n");
  }

  convertToGpx(locations) {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="LocationDataCollector">
  <trk>
    <name>Location History</name>
    <trkseg>`;

    const gpxFooter = `    </trkseg>
  </trk>
</gpx>`;

    const trackPoints = locations
      .filter((location) => location.latitude && location.longitude)
      .map(
        (location) =>
          `      <trkpt lat="${location.latitude}" lon="${location.longitude}">
        <time>${location.timestamp}</time>
      </trkpt>`
      )
      .join("\n");

    return gpxHeader + "\n" + trackPoints + "\n" + gpxFooter;
  }

  importData(data) {
    try {
      const importedData = typeof data === "string" ? JSON.parse(data) : data;

      if (importedData.settings) {
        this.settings = {
          ...DEFAULT_LOCATION_SETTINGS,
          ...importedData.settings,
        };
        this.saveSettings();
      }

      if (importedData.locationHistory) {
        this.locationHistory = importedData.locationHistory;
        this.saveLocationHistory();
      }

      if (importedData.consentRecords) {
        this.consentRecords = importedData.consentRecords;
        this.saveConsentRecords();
      }

      return true;
    } catch (error) {
      console.error("Error importing location data:", error);
      return false;
    }
  }

  clearAllData() {
    this.locationHistory = [];
    this.currentLocation = null;
    this.analyticsData = {};
    this.consentRecords = [];

    this.stopLocationTracking();

    this.saveLocationHistory();
    this.saveConsentRecords();
  }

  getDataSummary() {
    return {
      isTrackingEnabled: this.settings.collectionEnabled,
      isCurrentlyTracking: this.isTracking,
      totalLocations: this.locationHistory.length,
      currentLocation: this.currentLocation,
      lastUpdated: this.settings.lastUpdated,
      privacyLevel: this.settings.privacyLevel,
      retentionPeriod: this.settings.retentionPeriod,
      analyticsEnabled: this.settings.enableAnalytics,
      totalDistance: this.analyticsData.totalDistance || 0,
    };
  }

  getPrivacyCompliance() {
    return {
      hasConsent: this.consentRecords.length > 0,
      consentTimestamp: this.settings.consentTimestamp,
      dataMinimization: this.settings.privacyLevel !== PRIVACY_LEVELS.EXACT,
      dataRetention: this.settings.retentionPeriod <= 365,
      thirdPartySharing: !this.settings.shareWithThirdParties,
      anonymization: this.settings.anonymizeData,
      userControl: true,
    };
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      const options = this.getGeolocationOptions();

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData = await this.processLocationData(position);
            resolve(locationData);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  }

  getUserIPAddress() {
    return "xxx.xxx.xxx.xxx";
  }
}

export const useLocationData = () => {
  const collectorRef = useRef(null);
  const [settings, setSettings] = useState(DEFAULT_LOCATION_SETTINGS);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectorRef.current) {
      collectorRef.current = new LocationDataCollector();
    }

    const initializeCollector = async () => {
      try {
        setIsLoading(true);
        await collectorRef.current.initialize();
        setSettings(collectorRef.current.settings);
        setCurrentLocation(collectorRef.current.currentLocation);
        setIsTracking(collectorRef.current.isTracking);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCollector();

    const handleLocationUpdate = (event) => {
      setCurrentLocation(event.detail);
    };

    const handleLocationError = (event) => {
      setError(event.detail.error);
    };

    window.addEventListener(
      "locationDataLocationUpdate",
      handleLocationUpdate,
      { passive: true }
    );
    window.addEventListener("locationDataLocationError", handleLocationError, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "locationDataLocationUpdate",
        handleLocationUpdate
      );
      window.removeEventListener(
        "locationDataLocationError",
        handleLocationError
      );
      if (collectorRef.current) {
        collectorRef.current.cleanup();
      }
    };
  }, []);

  const updateSettings = useCallback((newSettings) => {
    if (collectorRef.current) {
      collectorRef.current.updateSettings(newSettings);
      setSettings(collectorRef.current.settings);
      setIsTracking(collectorRef.current.isTracking);
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (collectorRef.current) {
      try {
        await collectorRef.current.startLocationTracking();
        setIsTracking(collectorRef.current.isTracking);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (collectorRef.current) {
      collectorRef.current.stopLocationTracking();
      setIsTracking(collectorRef.current.isTracking);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (collectorRef.current) {
      try {
        const location = await collectorRef.current.getCurrentLocation();
        setCurrentLocation(location);
        return location;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    }
  }, []);

  const exportData = useCallback((format = "json") => {
    return collectorRef.current
      ? collectorRef.current.exportData(format)
      : null;
  }, []);

  const importData = useCallback((data) => {
    if (collectorRef.current) {
      const success = collectorRef.current.importData(data);
      if (success) {
        setSettings(collectorRef.current.settings);
        setCurrentLocation(collectorRef.current.currentLocation);
      }
      return success;
    }
    return false;
  }, []);

  const clearAllData = useCallback(() => {
    if (collectorRef.current) {
      collectorRef.current.clearAllData();
      setSettings(collectorRef.current.settings);
      setCurrentLocation(null);
      setIsTracking(false);
    }
  }, []);

  const getDataSummary = useCallback(() => {
    return collectorRef.current ? collectorRef.current.getDataSummary() : null;
  }, []);

  const getPrivacyCompliance = useCallback(() => {
    return collectorRef.current
      ? collectorRef.current.getPrivacyCompliance()
      : null;
  }, []);

  return useMemo(
    () => ({
      settings,
      currentLocation,
      isTracking,
      isLoading,
      error,
      updateSettings,
      startTracking,
      stopTracking,
      getCurrentLocation,
      exportData,
      importData,
      clearAllData,
      getDataSummary,
      getPrivacyCompliance,
      collector: collectorRef.current,
    }),
    [
      settings,
      currentLocation,
      isTracking,
      isLoading,
      error,
      updateSettings,
      startTracking,
      stopTracking,
      getCurrentLocation,
      exportData,
      importData,
      clearAllData,
      getDataSummary,
      getPrivacyCompliance,
    ]
  );
};

export {
  LocationDataCollector,
  LOCATION_ACCURACY_LEVELS,
  LOCATION_DATA_TYPES,
  COLLECTION_METHODS,
  PRIVACY_LEVELS,
  DEFAULT_LOCATION_SETTINGS,
};

export default function LocationDemo() {
  const {
    settings,
    currentLocation,
    isTracking,
    isLoading,
    error,
    updateSettings,
    startTracking,
    stopTracking,
    getCurrentLocation,
    getDataSummary,
  } = useLocationData();

  if (isLoading) {
    return <div className="p-4">Loading location collector...</div>;
  }

  return (
    <div className="p-8 bg-white text-gray-800">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">Location Data Collector</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-6 px-4 py-3 border border-red-300 bg-red-50 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Status Section */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded border text-sm">
            <p>
              <span className="font-semibold">Tracking Enabled:</span>{" "}
              {settings.collectionEnabled ? "Yes" : "No"}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded border text-sm">
            <p>
              <span className="font-semibold">Currently Tracking:</span>{" "}
              {isTracking ? "Yes" : "No"}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded border text-sm">
            <p>
              <span className="font-semibold">Privacy Level:</span>{" "}
              {settings.privacyLevel}
            </p>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              updateSettings({ collectionEnabled: !settings.collectionEnabled })
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {settings.collectionEnabled ? "Disable" : "Enable"} Collection
          </button>

          <button
            onClick={startTracking}
            disabled={!settings.collectionEnabled}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 transition"
          >
            Start Tracking
          </button>

          <button
            onClick={stopTracking}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Stop Tracking
          </button>

          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Get Current Location
          </button>
        </div>
      </section>

      {/* Current Location Section */}
      {currentLocation && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-2">Current Location</h2>
          <div className="bg-gray-100 border p-4 rounded text-sm overflow-auto">
            <pre>{JSON.stringify(currentLocation, null, 2)}</pre>
          </div>
        </section>
      )}

      {/* Data Summary Section */}
      <section>
        <h2 className="text-lg font-medium mb-2">Data Summary</h2>
        <div className="bg-gray-100 border p-4 rounded text-sm overflow-auto">
          <pre>{JSON.stringify(getDataSummary(), null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
