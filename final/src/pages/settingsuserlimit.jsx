import React, { useState, useCallback, useMemo } from "react";
import SuccessModal from "../components/SuccessModal";

/**
 * Settings User Limit Component
 * Manages user limit settings for the application
 */

const DEFAULT_SETTINGS = {
  userLimit: 100,
  maxActiveUsers: 1000,
  maxDailyRegistrations: 50,
  maxConcurrentSessions: 5,
};

const SettingsUserLimit = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal state
  const [modals, setModals] = useState({
    settingsSavedSuccess: false,
  });

  // ==============================
  // HANDLERS
  // ==============================

  const handleInputChange = useCallback((key, value) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({ ...prev, [key]: numValue }));
    setHasChanges(true);
  }, []);

  const handleSaveSettings = useCallback(() => {
    // Here you would typically save to backend
    console.log('Saving user limit settings:', settings);
    setHasChanges(false);
    setModals(prev => ({ ...prev, settingsSavedSuccess: true }));
  }, [settings]);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
  }, []);

  // ==============================
  // COMPUTED VALUES
  // ==============================

  const SettingItem = useMemo(() => 
    ({ title, description, inputValue, inputKey, min = 0, max = 10000 }) => (
      <div className="py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-gray-600 text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => handleInputChange(inputKey, e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={min}
              max={max}
            />
            <span className="text-gray-600 text-sm">users</span>
          </div>
        </div>
      </div>
    ), [handleInputChange]
  );

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-4xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          User Limit Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure user limits and capacity settings for your application.
        </p>
      </div>

      {/* User Limit Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          User Capacity Settings
        </h2>
        
        <SettingItem
          title="Set limit per user"
          description="Maximum number of specific actions per user (orders, items, etc.)"
          inputValue={settings.userLimit}
          inputKey="userLimit"
          min={1}
          max={1000}
        />

        <SettingItem
          title="Maximum Active Users"
          description="Total number of active users allowed in the system"
          inputValue={settings.maxActiveUsers}
          inputKey="maxActiveUsers"
          min={1}
          max={50000}
        />

        <SettingItem
          title="Maximum Daily Registrations"
          description="Maximum number of new user registrations allowed per day"
          inputValue={settings.maxDailyRegistrations}
          inputKey="maxDailyRegistrations"
          min={1}
          max={1000}
        />

        <SettingItem
          title="Maximum Concurrent Sessions"
          description="Maximum number of simultaneous sessions per user"
          inputValue={settings.maxConcurrentSessions}
          inputKey="maxConcurrentSessions"
          min={1}
          max={20}
        />
      </div>

      {/* Current Statistics (Mock Data) */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Current Usage Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">847</div>
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-xs text-gray-500">
              {Math.round((847 / settings.maxActiveUsers) * 100)}% of limit
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">23</div>
            <div className="text-sm text-gray-600">Today's Registrations</div>
            <div className="text-xs text-gray-500">
              {Math.round((23 / settings.maxDailyRegistrations) * 100)}% of limit
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">156</div>
            <div className="text-sm text-gray-600">Current Sessions</div>
            <div className="text-xs text-gray-500">Real-time count</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">2.3</div>
            <div className="text-sm text-gray-600">Avg. Sessions/User</div>
            <div className="text-xs text-gray-500">Current average</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleResetSettings}
          disabled={!hasChanges}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to Default
        </button>
        
        <div className="flex gap-3">
          {hasChanges && (
            <div className="text-sm text-orange-600 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Unsaved changes
            </div>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={!hasChanges}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Changes to user limits will take effect immediately</li>
          <li>• Reducing limits below current usage may cause disruptions</li>
          <li>• Monitor usage statistics to optimize these settings</li>
          <li>• Contact support for enterprise-level capacity planning</li>
        </ul>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={modals.settingsSavedSuccess}
        onClose={() => setModals(prev => ({ ...prev, settingsSavedSuccess: false }))}
        title="Settings Saved"
        message="User limit settings have been successfully updated."
      />
    </div>
  );
};

export default SettingsUserLimit;
