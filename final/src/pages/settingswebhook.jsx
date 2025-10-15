import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useWebhooks } from "../store/hooks";
import SuccessModal from "../components/SuccessModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

/**
 * Settings Webhook Component
 * Manages webhook configurations and integrations for the application
 */

const DEFAULT_SETTINGS = {
  enableWebhooks: false,
  retryAttempts: 3,
  timeoutSeconds: 30,
  enableSigning: true,
  signingSecret: '',
  logWebhooks: true,
  enableRateLimiting: true,
  rateLimit: 100, // requests per minute
};

const WEBHOOK_ENDPOINTS = [
  {
    id: 1,
    name: 'Order Processing',
    url: 'https://api.example.com/webhooks/orders',
    events: ['order.created', 'order.updated', 'order.cancelled'],
    active: true,
    lastTriggered: '2024-01-15 14:30:00',
    status: 'healthy',
    description: 'Sends order updates to external fulfillment system',
  },
  {
    id: 2,
    name: 'Payment Notifications',
    url: 'https://payments.example.com/notify',
    events: ['payment.success', 'payment.failed', 'payment.refunded'],
    active: true,
    lastTriggered: '2024-01-15 15:45:00',
    status: 'healthy',
    description: 'Notifies payment processor of transaction status',
  },
  {
    id: 3,
    name: 'Inventory Sync',
    url: 'https://inventory.example.com/sync',
    events: ['product.created', 'product.updated', 'inventory.low'],
    active: false,
    lastTriggered: '2024-01-10 09:15:00',
    status: 'error',
    description: 'Synchronizes product data with inventory management system',
  },
];

const AVAILABLE_EVENTS = [
  { category: 'Orders', events: [
    'order.created', 'order.updated', 'order.cancelled', 'order.shipped', 'order.delivered'
  ]},
  { category: 'Products', events: [
    'product.created', 'product.updated', 'product.deleted', 'inventory.low', 'inventory.out_of_stock'
  ]},
  { category: 'Users', events: [
    'user.created', 'user.updated', 'user.deleted', 'user.login', 'user.logout'
  ]},
  { category: 'Payments', events: [
    'payment.success', 'payment.failed', 'payment.pending', 'payment.refunded', 'payment.disputed'
  ]},
  { category: 'Cart', events: [
    'cart.created', 'cart.updated', 'cart.abandoned', 'cart.converted'
  ]},
];

const HTTP_METHODS = ['POST', 'PUT', 'PATCH'];

const SettingsWebhook = () => {
  // ==============================
  // REDUX HOOKS
  // ==============================
  const {
    settings: webhookSettings,
    endpoints: webhooks,
    logs,
    testResults,
    loading,
    errors,
    fetchWebhookSettings,
    updateWebhookSettings,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
    testWebhook,
    fetchWebhookLogs,
    clearError,
    enabled: webhooksEnabled,
    totalEndpoints,
    activeEndpoints
  } = useWebhooks();

  // ==============================
  // LOCAL STATE MANAGEMENT
  // ==============================
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState(webhookSettings || DEFAULT_SETTINGS);
  
  // New webhook form
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    method: 'POST',
    events: [],
    headers: {},
    description: '',
    active: true,
  });
  
  // Modal state
  const [modals, setModals] = useState({
    settingsSavedSuccess: false,
    addWebhook: false,
    editWebhook: false,
    deleteConfirm: false,
    testWebhook: false,
    webhookLogs: false,
  });
  
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [webhookToDelete, setWebhookToDelete] = useState(null);
  const [selectedWebhookLogs, setSelectedWebhookLogs] = useState(null);

  // ==============================
  // EFFECTS
  // ==============================
  useEffect(() => {
    fetchWebhookSettings();
  }, [fetchWebhookSettings]);

  // Update local settings when Redux state changes
  useEffect(() => {
    if (webhookSettings) {
      setLocalSettings(webhookSettings);
      setHasChanges(false);
    }
  }, [webhookSettings]);

  // ==============================
  // HANDLERS
  // ==============================

  const handleSettingChange = useCallback((key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleToggleChange = useCallback((key) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      await updateWebhookSettings(localSettings);
      setHasChanges(false);
      setModals(prev => ({ ...prev, settingsSavedSuccess: true }));
    } catch (error) {
      console.error('Failed to save webhook settings:', error);
    }
  }, [localSettings, updateWebhookSettings]);

  const handleResetSettings = useCallback(() => {
    setLocalSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
  }, []);

  // Webhook Management
  const handleAddWebhook = useCallback(async () => {
    if (newWebhook.name && newWebhook.url && newWebhook.events.length > 0) {
      try {
        await createWebhook({
          name: newWebhook.name,
          url: newWebhook.url,
          method: newWebhook.method,
          events: newWebhook.events,
          description: newWebhook.description,
          active: newWebhook.active,
          headers: newWebhook.headers
        });
        
        setNewWebhook({
          name: '',
          url: '',
          method: 'POST',
          events: [],
          headers: {},
          description: '',
          active: true,
        });
        setModals(prev => ({ ...prev, addWebhook: false }));
      } catch (error) {
        console.error('Failed to create webhook:', error);
      }
    }
  }, [newWebhook, createWebhook]);

  const handleEditWebhook = useCallback((webhook) => {
    setEditingWebhook({ ...webhook });
    setModals(prev => ({ ...prev, editWebhook: true }));
  }, []);

  const handleUpdateWebhook = useCallback(async () => {
    if (editingWebhook) {
      try {
        await updateWebhook(editingWebhook._id, editingWebhook);
        setEditingWebhook(null);
        setModals(prev => ({ ...prev, editWebhook: false }));
      } catch (error) {
        console.error('Failed to update webhook:', error);
      }
    }
  }, [editingWebhook, updateWebhook]);

  const handleToggleWebhook = useCallback(async (webhookId) => {
    try {
      await toggleWebhook(webhookId);
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  }, [toggleWebhook]);

  const handleDeleteWebhook = useCallback((webhook) => {
    setWebhookToDelete(webhook);
    setModals(prev => ({ ...prev, deleteConfirm: true }));
  }, []);

  const confirmDeleteWebhook = useCallback(async () => {
    if (webhookToDelete) {
      try {
        await deleteWebhook(webhookToDelete._id);
        setWebhookToDelete(null);
        setModals(prev => ({ ...prev, deleteConfirm: false }));
      } catch (error) {
        console.error('Failed to delete webhook:', error);
      }
    }
  }, [webhookToDelete, deleteWebhook]);

  const handleTestWebhook = useCallback(async (webhook) => {
    try {
      const result = await testWebhook(webhook._id, {
        test: true,
        timestamp: new Date().toISOString()
      });
      
      if (testResults[webhook._id]?.success) {
        alert(`✅ Test webhook successful!\nStatus: ${testResults[webhook._id].status_code}\nDuration: ${testResults[webhook._id].duration}ms`);
      } else {
        alert(`❌ Test webhook failed!\nError: ${testResults[webhook._id]?.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert(`❌ Failed to test webhook: ${error.message}`);
    }
  }, [testWebhook, testResults]);

  const handleEventToggle = useCallback((event, isEditing = false) => {
    if (isEditing && editingWebhook) {
      const events = editingWebhook.events.includes(event)
        ? editingWebhook.events.filter(e => e !== event)
        : [...editingWebhook.events, event];
      setEditingWebhook(prev => ({ ...prev, events }));
    } else {
      const events = newWebhook.events.includes(event)
        ? newWebhook.events.filter(e => e !== event)
        : [...newWebhook.events, event];
      setNewWebhook(prev => ({ ...prev, events }));
    }
  }, [newWebhook.events, editingWebhook]);

  const generateSigningSecret = useCallback(() => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    handleSettingChange('signingSecret', secret);
  }, [handleSettingChange]);

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

  const getStatusColor = useCallback((status) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      disabled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-5xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          Webhook Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure webhook endpoints and manage integrations with external services.
        </p>
      </div>

      {/* Main Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Webhook Configuration
        </h2>
        
        <ToggleSwitch
          enabled={localSettings.enableWebhooks}
          onChange={() => handleToggleChange('enableWebhooks')}
          label="Enable Webhooks"
          description="Allow sending HTTP requests to external endpoints on events"
        />

        {localSettings.enableWebhooks && (
          <>
            {/* Retry Settings */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                    Retry Attempts
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Number of retry attempts for failed webhooks
                  </p>
                </div>
                <input
                  type="number"
                  value={localSettings.retryAttempts}
                  onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            {/* Timeout Settings */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                    Timeout (seconds)
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Maximum time to wait for webhook response
                  </p>
                </div>
                <input
                  type="number"
                  value={localSettings.timeoutSeconds}
                  onChange={(e) => handleSettingChange('timeoutSeconds', parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="300"
                />
              </div>
            </div>

            {/* Security Settings */}
            <ToggleSwitch
              enabled={localSettings.enableSigning}
              onChange={() => handleToggleChange('enableSigning')}
              label="Enable Webhook Signing"
              description="Sign webhook payloads with a secret for verification"
            />

            {localSettings.enableSigning && (
              <div className="py-4 border-b border-gray-200 ml-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signing Secret
                    </label>
                    <input
                      type="password"
                      value={localSettings.signingSecret}
                      onChange={(e) => handleSettingChange('signingSecret', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter signing secret or generate one"
                    />
                  </div>
                  <button
                    onClick={generateSigningSecret}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm mt-6"
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}

            {/* Additional Settings */}
            <ToggleSwitch
              enabled={localSettings.logWebhooks}
              onChange={() => handleToggleChange('logWebhooks')}
              label="Log Webhook Activity"
              description="Keep logs of webhook requests and responses"
            />

            <ToggleSwitch
              enabled={localSettings.enableRateLimiting}
              onChange={() => handleToggleChange('enableRateLimiting')}
              label="Enable Rate Limiting"
              description="Limit the number of webhooks sent per minute"
            />

            {localSettings.enableRateLimiting && (
              <div className="py-4 border-b border-gray-200 ml-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">
                      Rate Limit (per minute)
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Maximum webhooks to send per minute
                    </p>
                  </div>
                  <input
                    type="number"
                    value={localSettings.rateLimit}
                    onChange={(e) => handleSettingChange('rateLimit', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Webhook Endpoints */}
      {localSettings.enableWebhooks && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Webhook Endpoints
            </h2>
            <button
              onClick={() => setModals(prev => ({ ...prev, addWebhook: true }))}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
            >
              Add Webhook
            </button>
          </div>
          
          {loading?.fetchSettings ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
              <p className="text-gray-500">Loading webhooks...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No webhook endpoints configured yet
            </p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">{webhook.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(webhook.status)}`}>
                          {webhook.status}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">URL:</span> {webhook.url}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Events:</span> {webhook.events.join(', ')}
                        </p>
                        {webhook.lastTriggered && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Last triggered:</span> {webhook.lastTriggered}
                          </p>
                        )}
                        {webhook.description && (
                          <p className="text-sm text-gray-500">
                            {webhook.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleWebhook(webhook._id)}
                        disabled={loading?.toggleWebhook}
                        className={`px-3 py-1 text-xs rounded ${
                          webhook.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        } ${loading?.toggleWebhook ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading?.toggleWebhook ? '...' : (webhook.active ? 'Active' : 'Inactive')}
                      </button>
                      <button
                        onClick={() => handleTestWebhook(webhook)}
                        disabled={loading?.testWebhook}
                        className={`px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 ${
                          loading?.testWebhook ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {loading?.testWebhook ? '...' : 'Test'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWebhookLogs(webhook);
                          setModals(prev => ({ ...prev, webhookLogs: true }));
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Logs
                      </button>
                      <button
                        onClick={() => handleEditWebhook(webhook)}
                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook)}
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

      {/* Webhook Statistics */}
      {localSettings.enableWebhooks && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Webhook Statistics (Last 24 Hours)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">1,247</div>
              <div className="text-sm text-gray-600">Successful Deliveries</div>
              <div className="text-xs text-gray-500">94.2% success rate</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-red-600">76</div>
              <div className="text-sm text-gray-600">Failed Deliveries</div>
              <div className="text-xs text-gray-500">5.8% failure rate</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">245ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
              <div className="text-xs text-gray-500">across all endpoints</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{webhooks.filter(w => w.active).length}</div>
              <div className="text-sm text-gray-600">Active Endpoints</div>
              <div className="text-xs text-gray-500">out of {webhooks.length} total</div>
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
            disabled={!hasChanges || loading?.updateSettings}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading?.updateSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Add/Edit Webhook Modal */}
      {(modals.addWebhook || modals.editWebhook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {modals.addWebhook ? 'Add New Webhook' : 'Edit Webhook'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  value={modals.addWebhook ? newWebhook.name : editingWebhook?.name || ''}
                  onChange={(e) => {
                    if (modals.addWebhook) {
                      setNewWebhook(prev => ({ ...prev, name: e.target.value }));
                    } else {
                      setEditingWebhook(prev => ({ ...prev, name: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Order Processing Webhook"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={modals.addWebhook ? newWebhook.url : editingWebhook?.url || ''}
                    onChange={(e) => {
                      if (modals.addWebhook) {
                        setNewWebhook(prev => ({ ...prev, url: e.target.value }));
                      } else {
                        setEditingWebhook(prev => ({ ...prev, url: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://api.example.com/webhook"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    value={modals.addWebhook ? newWebhook.method : editingWebhook?.method || 'POST'}
                    onChange={(e) => {
                      if (modals.addWebhook) {
                        setNewWebhook(prev => ({ ...prev, method: e.target.value }));
                      } else {
                        setEditingWebhook(prev => ({ ...prev, method: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {HTTP_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events to Subscribe
                </label>
                <div className="border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((category) => (
                    <div key={category.category} className="mb-4">
                      <h5 className="font-medium text-gray-800 mb-2">{category.category}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {category.events.map((event) => {
                          const isSelected = modals.addWebhook 
                            ? newWebhook.events.includes(event)
                            : editingWebhook?.events.includes(event);
                          
                          return (
                            <label key={event} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleEventToggle(event, !modals.addWebhook)}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{event}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={modals.addWebhook ? newWebhook.description : editingWebhook?.description || ''}
                  onChange={(e) => {
                    if (modals.addWebhook) {
                      setNewWebhook(prev => ({ ...prev, description: e.target.value }));
                    } else {
                      setEditingWebhook(prev => ({ ...prev, description: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Brief description of this webhook's purpose"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (modals.addWebhook) {
                    setModals(prev => ({ ...prev, addWebhook: false }));
                    setNewWebhook({
                      name: '',
                      url: '',
                      method: 'POST',
                      events: [],
                      headers: {},
                      description: '',
                      active: true,
                    });
                  } else {
                    setModals(prev => ({ ...prev, editWebhook: false }));
                    setEditingWebhook(null);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={modals.addWebhook ? handleAddWebhook : handleUpdateWebhook}
                disabled={
                  (modals.addWebhook 
                    ? !newWebhook.name || !newWebhook.url || newWebhook.events.length === 0 || loading?.createWebhook
                    : !editingWebhook?.name || !editingWebhook?.url || !editingWebhook?.events?.length || loading?.updateWebhook)
                }
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modals.addWebhook 
                  ? (loading?.createWebhook ? 'Adding...' : 'Add Webhook')
                  : (loading?.updateWebhook ? 'Updating...' : 'Update Webhook')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Logs Modal */}
      {modals.webhookLogs && selectedWebhookLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Webhook Logs: {selectedWebhookLogs.name}
              </h3>
              <button
                onClick={() => setModals(prev => ({ ...prev, webhookLogs: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {webhookLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span className="font-medium">{log.event}</span>
                      <span className="text-sm text-gray-500">{log.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>HTTP {log.responseCode}</span>
                    <span>{log.duration}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={modals.settingsSavedSuccess}
        onClose={() => setModals(prev => ({ ...prev, settingsSavedSuccess: false }))}
        title="Settings Saved"
        message="Webhook settings have been successfully updated."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.deleteConfirm}
        onClose={() => setModals(prev => ({ ...prev, deleteConfirm: false }))}
        onConfirm={confirmDeleteWebhook}
        itemName={webhookToDelete?.name || ''}
        itemType="webhook endpoint"
      />
    </div>
  );
};

export default SettingsWebhook;
