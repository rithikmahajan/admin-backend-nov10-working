import React, { useState, useCallback, useMemo } from "react";
import SuccessModal from "../components/SuccessModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

/**
 * Settings Dynamic Pricing Component
 * Manages dynamic pricing rules and strategies for the application
 */

const DEFAULT_SETTINGS = {
  enableDynamicPricing: false,
  priceUpdateFrequency: 'hourly',
  maxPriceIncrease: 50,
  maxPriceDecrease: 30,
  considerDemand: true,
  considerInventory: true,
  considerCompetitor: false,
  considerSeasonality: true,
  notifyPriceChanges: true,
};

const PRICING_RULES = [
  {
    id: 1,
    name: 'High Demand Surge',
    type: 'demand',
    condition: 'demand > 80%',
    action: 'increase',
    percentage: 15,
    active: true,
    description: 'Increase price when demand is high'
  },
  {
    id: 2,
    name: 'Low Stock Premium',
    type: 'inventory',
    condition: 'stock < 10 units',
    action: 'increase',
    percentage: 25,
    active: true,
    description: 'Increase price when stock is low'
  },
  {
    id: 3,
    name: 'Excess Inventory Discount',
    type: 'inventory',
    condition: 'stock > 100 units',
    action: 'decrease',
    percentage: 20,
    active: false,
    description: 'Decrease price to clear excess inventory'
  },
];

const UPDATE_FREQUENCIES = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const RULE_TYPES = [
  { value: 'demand', label: 'Demand-based' },
  { value: 'inventory', label: 'Inventory-based' },
  { value: 'competitor', label: 'Competitor-based' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'time', label: 'Time-based' },
];

const RULE_CONDITIONS = {
  demand: [
    'demand > 90%',
    'demand > 80%', 
    'demand > 70%',
    'demand < 30%',
    'demand < 20%',
  ],
  inventory: [
    'stock < 5 units',
    'stock < 10 units',
    'stock < 20 units',
    'stock > 50 units',
    'stock > 100 units',
  ],
  competitor: [
    'competitor_price > our_price + 10%',
    'competitor_price < our_price - 10%',
  ],
  seasonal: [
    'peak_season',
    'off_season',
    'holiday_season',
  ],
  time: [
    'weekday_hours',
    'weekend_hours',
    'business_hours',
    'after_hours',
  ],
};

const SettingsDynamicPricing = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [pricingRules, setPricingRules] = useState(PRICING_RULES);
  
  // New rule form
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'demand',
    condition: '',
    action: 'increase',
    percentage: 10,
    description: '',
  });
  
  // Modal state
  const [modals, setModals] = useState({
    settingsSavedSuccess: false,
    addRule: false,
    editRule: false,
    deleteConfirm: false,
  });
  
  const [editingRule, setEditingRule] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);

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
    console.log('Saving dynamic pricing settings:', settings);
    console.log('Saving pricing rules:', pricingRules);
    setHasChanges(false);
    setModals(prev => ({ ...prev, settingsSavedSuccess: true }));
  }, [settings, pricingRules]);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setPricingRules(PRICING_RULES);
    setHasChanges(false);
  }, []);

  // Rule Management
  const handleAddRule = useCallback(() => {
    if (newRule.name && newRule.condition) {
      const rule = {
        ...newRule,
        id: Date.now(),
        active: true,
      };
      setPricingRules(prev => [...prev, rule]);
      setNewRule({
        name: '',
        type: 'demand',
        condition: '',
        action: 'increase',
        percentage: 10,
        description: '',
      });
      setModals(prev => ({ ...prev, addRule: false }));
      setHasChanges(true);
    }
  }, [newRule]);

  const handleEditRule = useCallback((rule) => {
    setEditingRule({ ...rule });
    setModals(prev => ({ ...prev, editRule: true }));
  }, []);

  const handleUpdateRule = useCallback(() => {
    if (editingRule) {
      setPricingRules(prev => 
        prev.map(rule => 
          rule.id === editingRule.id ? editingRule : rule
        )
      );
      setEditingRule(null);
      setModals(prev => ({ ...prev, editRule: false }));
      setHasChanges(true);
    }
  }, [editingRule]);

  const handleToggleRule = useCallback((ruleId) => {
    setPricingRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      )
    );
    setHasChanges(true);
  }, []);

  const handleDeleteRule = useCallback((rule) => {
    setRuleToDelete(rule);
    setModals(prev => ({ ...prev, deleteConfirm: true }));
  }, []);

  const confirmDeleteRule = useCallback(() => {
    if (ruleToDelete) {
      setPricingRules(prev => prev.filter(rule => rule.id !== ruleToDelete.id));
      setRuleToDelete(null);
      setModals(prev => ({ ...prev, deleteConfirm: false }));
      setHasChanges(true);
    }
  }, [ruleToDelete]);

  // ==============================
  // COMPUTED VALUES
  // ==============================

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

  const getRuleTypeColor = useCallback((type) => {
    const colors = {
      demand: 'bg-blue-100 text-blue-800',
      inventory: 'bg-green-100 text-green-800',
      competitor: 'bg-purple-100 text-purple-800',
      seasonal: 'bg-orange-100 text-orange-800',
      time: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-5xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          Dynamic Pricing Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure dynamic pricing strategies and rules for your products.
        </p>
      </div>

      {/* Main Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Dynamic Pricing Configuration
        </h2>
        
        <ToggleSwitch
          enabled={settings.enableDynamicPricing}
          onChange={() => handleToggleChange('enableDynamicPricing')}
          label="Enable Dynamic Pricing"
          description="Automatically adjust prices based on configured rules"
        />

        {settings.enableDynamicPricing && (
          <>
            {/* Update Frequency */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                    Price Update Frequency
                  </h3>
                  <p className="text-gray-600 text-sm">
                    How often should prices be recalculated
                  </p>
                </div>
                <select
                  value={settings.priceUpdateFrequency}
                  onChange={(e) => handleSettingChange('priceUpdateFrequency', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                >
                  {UPDATE_FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Change Limits */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                    Maximum Price Increase
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Maximum percentage price can be increased
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.maxPriceIncrease}
                    onChange={(e) => handleSettingChange('maxPriceIncrease', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="200"
                  />
                  <span className="text-gray-600">%</span>
                </div>
              </div>
            </div>

            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                    Maximum Price Decrease
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Maximum percentage price can be decreased
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.maxPriceDecrease}
                    onChange={(e) => handleSettingChange('maxPriceDecrease', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                  <span className="text-gray-600">%</span>
                </div>
              </div>
            </div>

            {/* Pricing Factors */}
            <div className="py-4">
              <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-3">
                Consider These Factors
              </h3>
              <div className="space-y-3">
                <ToggleSwitch
                  enabled={settings.considerDemand}
                  onChange={() => handleToggleChange('considerDemand')}
                  label="Product Demand"
                  description="Adjust prices based on product demand levels"
                />
                <ToggleSwitch
                  enabled={settings.considerInventory}
                  onChange={() => handleToggleChange('considerInventory')}
                  label="Inventory Levels"
                  description="Adjust prices based on current stock levels"
                />
                <ToggleSwitch
                  enabled={settings.considerCompetitor}
                  onChange={() => handleToggleChange('considerCompetitor')}
                  label="Competitor Prices"
                  description="Adjust prices based on competitor pricing"
                />
                <ToggleSwitch
                  enabled={settings.considerSeasonality}
                  onChange={() => handleToggleChange('considerSeasonality')}
                  label="Seasonality"
                  description="Adjust prices for seasonal trends"
                />
                <ToggleSwitch
                  enabled={settings.notifyPriceChanges}
                  onChange={() => handleToggleChange('notifyPriceChanges')}
                  label="Notify Price Changes"
                  description="Send notifications when prices are automatically changed"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pricing Rules */}
      {settings.enableDynamicPricing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Pricing Rules
            </h2>
            <button
              onClick={() => setModals(prev => ({ ...prev, addRule: true }))}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
            >
              Add Rule
            </button>
          </div>
          
          {pricingRules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pricing rules configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">{rule.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRuleTypeColor(rule.type)}`}>
                          {RULE_TYPES.find(t => t.value === rule.type)?.label}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rule.action === 'increase' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {rule.action === 'increase' ? '↗' : '↘'} {rule.percentage}%
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        When: {rule.condition}
                      </p>
                      {rule.description && (
                        <p className="text-gray-500 text-sm">
                          {rule.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-3 py-1 text-xs rounded ${
                          rule.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing Analytics (Mock Data) */}
      {settings.enableDynamicPricing && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Pricing Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">+12.4%</div>
              <div className="text-sm text-gray-600">Revenue Increase</div>
              <div className="text-xs text-gray-500">vs static pricing</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">847</div>
              <div className="text-sm text-gray-600">Price Adjustments</div>
              <div className="text-xs text-gray-500">last 30 days</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-gray-600">Active Rules</div>
              <div className="text-xs text-gray-500">currently running</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">4.2s</div>
              <div className="text-sm text-gray-600">Avg. Response Time</div>
              <div className="text-xs text-gray-500">price calculations</div>
            </div>
          </div>
        </div>
      )}

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

      {/* Add/Edit Rule Modal */}
      {(modals.addRule || modals.editRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {modals.addRule ? 'Add New Rule' : 'Edit Rule'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={modals.addRule ? newRule.name : editingRule?.name || ''}
                  onChange={(e) => {
                    if (modals.addRule) {
                      setNewRule(prev => ({ ...prev, name: e.target.value }));
                    } else {
                      setEditingRule(prev => ({ ...prev, name: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., High Demand Surge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Type
                </label>
                <select
                  value={modals.addRule ? newRule.type : editingRule?.type || 'demand'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (modals.addRule) {
                      setNewRule(prev => ({ ...prev, type: value, condition: '' }));
                    } else {
                      setEditingRule(prev => ({ ...prev, type: value, condition: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RULE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={modals.addRule ? newRule.condition : editingRule?.condition || ''}
                  onChange={(e) => {
                    if (modals.addRule) {
                      setNewRule(prev => ({ ...prev, condition: e.target.value }));
                    } else {
                      setEditingRule(prev => ({ ...prev, condition: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select condition</option>
                  {RULE_CONDITIONS[modals.addRule ? newRule.type : editingRule?.type]?.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={modals.addRule ? newRule.action : editingRule?.action || 'increase'}
                    onChange={(e) => {
                      if (modals.addRule) {
                        setNewRule(prev => ({ ...prev, action: e.target.value }));
                      } else {
                        setEditingRule(prev => ({ ...prev, action: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Percentage
                  </label>
                  <input
                    type="number"
                    value={modals.addRule ? newRule.percentage : editingRule?.percentage || 10}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (modals.addRule) {
                        setNewRule(prev => ({ ...prev, percentage: value }));
                      } else {
                        setEditingRule(prev => ({ ...prev, percentage: value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={modals.addRule ? newRule.description : editingRule?.description || ''}
                  onChange={(e) => {
                    if (modals.addRule) {
                      setNewRule(prev => ({ ...prev, description: e.target.value }));
                    } else {
                      setEditingRule(prev => ({ ...prev, description: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Brief description of this rule..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (modals.addRule) {
                    setModals(prev => ({ ...prev, addRule: false }));
                    setNewRule({
                      name: '',
                      type: 'demand',
                      condition: '',
                      action: 'increase',
                      percentage: 10,
                      description: '',
                    });
                  } else {
                    setModals(prev => ({ ...prev, editRule: false }));
                    setEditingRule(null);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={modals.addRule ? handleAddRule : handleUpdateRule}
                disabled={
                  modals.addRule 
                    ? !newRule.name || !newRule.condition
                    : !editingRule?.name || !editingRule?.condition
                }
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modals.addRule ? 'Add Rule' : 'Update Rule'}
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
        message="Dynamic pricing settings have been successfully updated."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.deleteConfirm}
        onClose={() => setModals(prev => ({ ...prev, deleteConfirm: false }))}
        onConfirm={confirmDeleteRule}
        itemName={ruleToDelete?.name || ''}
        itemType="pricing rule"
      />
    </div>
  );
};

export default SettingsDynamicPricing;
