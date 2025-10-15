import React, { useState, useCallback, useMemo } from "react";
import SuccessModal from "../components/SuccessModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

/**
 * Settings Language Country Region Component
 * Manages language, country, and regional settings for the application
 */

const DEFAULT_SETTINGS = {
  defaultLanguage: 'en',
  defaultCountry: 'US',
  defaultRegion: 'North America',
  enableMultiLanguage: true,
  enableMultiCurrency: true,
  autoDetectLocation: false,
  fallbackLanguage: 'en',
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', currency: 'EUR', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', currency: 'EUR', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
];

const REGIONS = [
  'North America',
  'South America', 
  'Europe',
  'Asia',
  'Africa',
  'Oceania',
  'Middle East',
];

const SettingsLanguageCountryRegion = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Custom language/country management
  const [customLanguages, setCustomLanguages] = useState([]);
  const [customCountries, setCustomCountries] = useState([]);
  const [newLanguage, setNewLanguage] = useState({ code: '', name: '', flag: '' });
  const [newCountry, setNewCountry] = useState({ code: '', name: '', currency: '', flag: '' });
  
  // Modal state
  const [modals, setModals] = useState({
    settingsSavedSuccess: false,
    addLanguage: false,
    addCountry: false,
    deleteConfirm: false,
  });
  const [itemToDelete, setItemToDelete] = useState(null);

  // ==============================
  // HANDLERS
  // ==============================

  const handleSettingChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleToggleChange = useCallback((key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  }, []);

  const handleSaveSettings = useCallback(() => {
    console.log('Saving language/country/region settings:', settings);
    setHasChanges(false);
    setModals(prev => ({ ...prev, settingsSavedSuccess: true }));
  }, [settings]);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
  }, []);

  // Custom Language Management
  const handleAddLanguage = useCallback(() => {
    if (newLanguage.code && newLanguage.name) {
      setCustomLanguages(prev => [...prev, { ...newLanguage, id: Date.now() }]);
      setNewLanguage({ code: '', name: '', flag: '' });
      setModals(prev => ({ ...prev, addLanguage: false }));
      setHasChanges(true);
    }
  }, [newLanguage]);

  const handleDeleteLanguage = useCallback((languageId) => {
    setCustomLanguages(prev => prev.filter(lang => lang.id !== languageId));
    setHasChanges(true);
  }, []);

  // Custom Country Management  
  const handleAddCountry = useCallback(() => {
    if (newCountry.code && newCountry.name) {
      setCustomCountries(prev => [...prev, { ...newCountry, id: Date.now() }]);
      setNewCountry({ code: '', name: '', currency: '', flag: '' });
      setModals(prev => ({ ...prev, addCountry: false }));
      setHasChanges(true);
    }
  }, [newCountry]);

  const handleDeleteCountry = useCallback((countryId) => {
    setCustomCountries(prev => prev.filter(country => country.id !== countryId));
    setHasChanges(true);
  }, []);

  const confirmDelete = useCallback((type, item) => {
    setItemToDelete({ type, item });
    setModals(prev => ({ ...prev, deleteConfirm: true }));
  }, []);

  const executeDelete = useCallback(() => {
    if (itemToDelete) {
      if (itemToDelete.type === 'language') {
        handleDeleteLanguage(itemToDelete.item.id);
      } else if (itemToDelete.type === 'country') {
        handleDeleteCountry(itemToDelete.item.id);
      }
      setItemToDelete(null);
      setModals(prev => ({ ...prev, deleteConfirm: false }));
    }
  }, [itemToDelete, handleDeleteLanguage, handleDeleteCountry]);

  // ==============================
  // COMPUTED VALUES
  // ==============================

  const allLanguages = useMemo(() => [...LANGUAGES, ...customLanguages], [customLanguages]);
  const allCountries = useMemo(() => [...COUNTRIES, ...customCountries], [customCountries]);

  const ToggleSwitch = useMemo(() => 
    ({ enabled, onChange, label, description }) => (
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
            {label}
          </h3>
          {description && (
            <p className="text-gray-600 text-sm">
              {description}
            </p>
          )}
        </div>
        <button
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    ), []
  );

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-4xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          Language, Country & Region Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure language, country, and regional preferences for your application.
        </p>
      </div>

      {/* Default Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Default Settings
        </h2>
        
        {/* Default Language */}
        <div className="py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                Default Language
              </h3>
              <p className="text-gray-600 text-sm">
                Primary language for the application
              </p>
            </div>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {allLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Default Country */}
        <div className="py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                Default Country
              </h3>
              <p className="text-gray-600 text-sm">
                Primary country for the application
              </p>
            </div>
            <select
              value={settings.defaultCountry}
              onChange={(e) => handleSettingChange('defaultCountry', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {allCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Default Region */}
        <div className="py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                Default Region
              </h3>
              <p className="text-gray-600 text-sm">
                Primary geographic region
              </p>
            </div>
            <select
              value={settings.defaultRegion}
              onChange={(e) => handleSettingChange('defaultRegion', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fallback Language */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                Fallback Language
              </h3>
              <p className="text-gray-600 text-sm">
                Language to use when primary language is unavailable
              </p>
            </div>
            <select
              value={settings.fallbackLanguage}
              onChange={(e) => handleSettingChange('fallbackLanguage', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              {allLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Feature Settings
        </h2>
        
        <ToggleSwitch
          enabled={settings.enableMultiLanguage}
          onChange={() => handleToggleChange('enableMultiLanguage')}
          label="Enable Multi-Language Support"
          description="Allow users to switch between different languages"
        />

        <ToggleSwitch
          enabled={settings.enableMultiCurrency}
          onChange={() => handleToggleChange('enableMultiCurrency')}
          label="Enable Multi-Currency Support"
          description="Display prices in different currencies based on country"
        />

        <ToggleSwitch
          enabled={settings.autoDetectLocation}
          onChange={() => handleToggleChange('autoDetectLocation')}
          label="Auto-Detect User Location"
          description="Automatically detect and set user's language and country"
        />
      </div>

      {/* Custom Languages */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Custom Languages
          </h2>
          <button
            onClick={() => setModals(prev => ({ ...prev, addLanguage: true }))}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            Add Language
          </button>
        </div>
        
        {customLanguages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No custom languages added yet
          </p>
        ) : (
          <div className="space-y-2">
            {customLanguages.map((lang) => (
              <div key={lang.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <span className="font-medium">
                  {lang.flag} {lang.name} ({lang.code})
                </span>
                <button
                  onClick={() => confirmDelete('language', lang)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Countries */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Custom Countries
          </h2>
          <button
            onClick={() => setModals(prev => ({ ...prev, addCountry: true }))}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            Add Country
          </button>
        </div>
        
        {customCountries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No custom countries added yet
          </p>
        ) : (
          <div className="space-y-2">
            {customCountries.map((country) => (
              <div key={country.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <span className="font-medium">
                  {country.flag} {country.name} ({country.code}) - {country.currency}
                </span>
                <button
                  onClick={() => confirmDelete('country', country)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
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

      {/* Add Language Modal */}
      {modals.addLanguage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Custom Language</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Code
                </label>
                <input
                  type="text"
                  value={newLanguage.code}
                  onChange={(e) => setNewLanguage(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'ar', 'ru'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Name
                </label>
                <input
                  type="text"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'Arabic', 'Russian'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flag Emoji (optional)
                </label>
                <input
                  type="text"
                  value={newLanguage.flag}
                  onChange={(e) => setNewLanguage(prev => ({ ...prev, flag: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="🏳️"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModals(prev => ({ ...prev, addLanguage: false }))}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLanguage}
                disabled={!newLanguage.code || !newLanguage.name}
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Language
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Country Modal */}
      {modals.addCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Custom Country</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code
                </label>
                <input
                  type="text"
                  value={newCountry.code}
                  onChange={(e) => setNewCountry(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'BR', 'MX'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Name
                </label>
                <input
                  type="text"
                  value={newCountry.name}
                  onChange={(e) => setNewCountry(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'Brazil', 'Mexico'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={newCountry.currency}
                  onChange={(e) => setNewCountry(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 'BRL', 'MXN'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flag Emoji (optional)
                </label>
                <input
                  type="text"
                  value={newCountry.flag}
                  onChange={(e) => setNewCountry(prev => ({ ...prev, flag: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="🏳️"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModals(prev => ({ ...prev, addCountry: false }))}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCountry}
                disabled={!newCountry.code || !newCountry.name}
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Country
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={modals.settingsSavedSuccess}
        onClose={() => setModals(prev => ({ ...prev, settingsSavedSuccess: false }))}
        title="Settings Saved"
        message="Language, country, and region settings have been successfully updated."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.deleteConfirm}
        onClose={() => setModals(prev => ({ ...prev, deleteConfirm: false }))}
        onConfirm={executeDelete}
        itemName={itemToDelete ? `${itemToDelete.item.name} (${itemToDelete.item.code})` : ''}
        itemType={itemToDelete ? itemToDelete.type : ''}
      />
    </div>
  );
};

export default SettingsLanguageCountryRegion;
