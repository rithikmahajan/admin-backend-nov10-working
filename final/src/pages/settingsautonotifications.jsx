import React, { useState, useCallback, useMemo } from "react";
import SuccessModal from "../components/SuccessModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

/**
 * Settings Auto Notifications Component
 * Manages automatic notification settings and templates for the application
 */

const DEFAULT_SETTINGS = {
  enableAutoNotifications: true,
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  notificationFrequency: 'realtime',
  quietHours: { start: '22:00', end: '08:00' },
  enableQuietHours: true,
};

const NOTIFICATION_TEMPLATES = [
  {
    id: 1,
    name: 'Welcome Email',
    type: 'email',
    trigger: 'user_registration',
    subject: 'Welcome to Yoraa!',
    content: 'Thank you for joining Yoraa. Start exploring our amazing collection!',
    active: true,
    category: 'user',
  },
  {
    id: 2,
    name: 'Order Confirmation',
    type: 'email',
    trigger: 'order_placed',
    subject: 'Order Confirmation #{{order_id}}',
    content: 'Your order has been confirmed and will be processed shortly.',
    active: true,
    category: 'order',
  },
  {
    id: 3,
    name: 'Low Stock Alert',
    type: 'push',
    trigger: 'low_stock',
    subject: 'Low Stock Alert',
    content: 'Product {{product_name}} is running low on stock ({{stock_count}} left)',
    active: true,
    category: 'inventory',
  },
  {
    id: 4,
    name: 'Cart Abandonment',
    type: 'email',
    trigger: 'cart_abandoned',
    subject: 'Don\'t forget your items!',
    content: 'You have items waiting in your cart. Complete your purchase now!',
    active: false,
    category: 'marketing',
  },
];

const NOTIFICATION_TYPES = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'push', label: 'Push Notification', icon: '🔔' },
  { value: 'sms', label: 'SMS', icon: '📱' },
];

const TRIGGER_EVENTS = [
  { value: 'user_registration', label: 'User Registration', category: 'user' },
  { value: 'user_login', label: 'User Login', category: 'user' },
  { value: 'password_reset', label: 'Password Reset', category: 'user' },
  { value: 'order_placed', label: 'Order Placed', category: 'order' },
  { value: 'order_shipped', label: 'Order Shipped', category: 'order' },
  { value: 'order_delivered', label: 'Order Delivered', category: 'order' },
  { value: 'payment_success', label: 'Payment Success', category: 'order' },
  { value: 'payment_failed', label: 'Payment Failed', category: 'order' },
  { value: 'low_stock', label: 'Low Stock', category: 'inventory' },
  { value: 'out_of_stock', label: 'Out of Stock', category: 'inventory' },
  { value: 'price_drop', label: 'Price Drop', category: 'marketing' },
  { value: 'cart_abandoned', label: 'Cart Abandoned', category: 'marketing' },
  { value: 'newsletter', label: 'Newsletter', category: 'marketing' },
];

const FREQUENCIES = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly Digest' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
];

const CATEGORIES = [
  { value: 'user', label: 'User Management', color: 'bg-blue-100 text-blue-800' },
  { value: 'order', label: 'Orders', color: 'bg-green-100 text-green-800' },
  { value: 'inventory', label: 'Inventory', color: 'bg-orange-100 text-orange-800' },
  { value: 'marketing', label: 'Marketing', color: 'bg-purple-100 text-purple-800' },
];

const SettingsAutoNotifications = () => {
  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [templates, setTemplates] = useState(NOTIFICATION_TEMPLATES);
  
  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email',
    trigger: '',
    subject: '',
    content: '',
    category: 'user',
  });
  
  // Modal state
  const [modals, setModals] = useState({
    settingsSavedSuccess: false,
    addTemplate: false,
    editTemplate: false,
    deleteConfirm: false,
    testNotification: false,
  });
  
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const handleQuietHoursChange = useCallback((timeType, value) => {
    setSettings(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, [timeType]: value }
    }));
    setHasChanges(true);
  }, []);

  const handleSaveSettings = useCallback(() => {
    console.log('Saving auto notification settings:', settings);
    console.log('Saving notification templates:', templates);
    setHasChanges(false);
    setModals(prev => ({ ...prev, settingsSavedSuccess: true }));
  }, [settings, templates]);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setTemplates(NOTIFICATION_TEMPLATES);
    setHasChanges(false);
  }, []);

  // Template Management
  const handleAddTemplate = useCallback(() => {
    if (newTemplate.name && newTemplate.trigger && newTemplate.subject) {
      const template = {
        ...newTemplate,
        id: Date.now(),
        active: true,
      };
      setTemplates(prev => [...prev, template]);
      setNewTemplate({
        name: '',
        type: 'email',
        trigger: '',
        subject: '',
        content: '',
        category: 'user',
      });
      setModals(prev => ({ ...prev, addTemplate: false }));
      setHasChanges(true);
    }
  }, [newTemplate]);

  const handleEditTemplate = useCallback((template) => {
    setEditingTemplate({ ...template });
    setModals(prev => ({ ...prev, editTemplate: true }));
  }, []);

  const handleUpdateTemplate = useCallback(() => {
    if (editingTemplate) {
      setTemplates(prev => 
        prev.map(template => 
          template.id === editingTemplate.id ? editingTemplate : template
        )
      );
      setEditingTemplate(null);
      setModals(prev => ({ ...prev, editTemplate: false }));
      setHasChanges(true);
    }
  }, [editingTemplate]);

  const handleToggleTemplate = useCallback((templateId) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId ? { ...template, active: !template.active } : template
      )
    );
    setHasChanges(true);
  }, []);

  const handleDeleteTemplate = useCallback((template) => {
    setTemplateToDelete(template);
    setModals(prev => ({ ...prev, deleteConfirm: true }));
  }, []);

  const confirmDeleteTemplate = useCallback(() => {
    if (templateToDelete) {
      setTemplates(prev => prev.filter(template => template.id !== templateToDelete.id));
      setTemplateToDelete(null);
      setModals(prev => ({ ...prev, deleteConfirm: false }));
      setHasChanges(true);
    }
  }, [templateToDelete]);

  const handleTestNotification = useCallback((template) => {
    console.log('Testing notification:', template);
    // Here you would send a test notification
    alert(`Test ${template.type} notification sent for "${template.name}"`);
  }, []);

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

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter(template => template.category === selectedCategory);
  }, [templates, selectedCategory]);

  const getCategoryColor = useCallback((category) => {
    const categoryObj = CATEGORIES.find(cat => cat.value === category);
    return categoryObj ? categoryObj.color : 'bg-gray-100 text-gray-800';
  }, []);

  const getTypeIcon = useCallback((type) => {
    const typeObj = NOTIFICATION_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.icon : '📧';
  }, []);

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat max-w-5xl">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[24px] font-bold text-[#010101] font-montserrat">
          Auto Notification Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure automatic notifications and manage notification templates.
        </p>
      </div>

      {/* Main Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Notification Configuration
        </h2>
        
        <ToggleSwitch
          enabled={settings.enableAutoNotifications}
          onChange={() => handleToggleChange('enableAutoNotifications')}
          label="Enable Auto Notifications"
          description="Automatically send notifications based on configured triggers"
        />

        {settings.enableAutoNotifications && (
          <>
            {/* Notification Channels */}
            <ToggleSwitch
              enabled={settings.emailNotifications}
              onChange={() => handleToggleChange('emailNotifications')}
              label="Email Notifications"
              description="Send notifications via email"
            />

            <ToggleSwitch
              enabled={settings.pushNotifications}
              onChange={() => handleToggleChange('pushNotifications')}
              label="Push Notifications"
              description="Send push notifications to user devices"
            />

            <ToggleSwitch
              enabled={settings.smsNotifications}
              onChange={() => handleToggleChange('smsNotifications')}
              label="SMS Notifications"
              description="Send notifications via SMS (additional charges apply)"
            />

            {/* Notification Frequency */}
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#000000] text-lg font-montserrat mb-1">
                    Notification Frequency
                  </h3>
                  <p className="text-gray-600 text-sm">
                    How often to send non-critical notifications
                  </p>
                </div>
                <select
                  value={settings.notificationFrequency}
                  onChange={(e) => handleSettingChange('notificationFrequency', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quiet Hours */}
            <ToggleSwitch
              enabled={settings.enableQuietHours}
              onChange={() => handleToggleChange('enableQuietHours')}
              label="Enable Quiet Hours"
              description="Don't send non-urgent notifications during specified hours"
            />

            {settings.enableQuietHours && (
              <div className="py-4 border-b border-gray-200 ml-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notification Templates */}
      {settings.enableAutoNotifications && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Notification Templates
            </h2>
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setModals(prev => ({ ...prev, addTemplate: true }))}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
              >
                Add Template
              </button>
            </div>
          </div>
          
          {filteredTemplates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No notification templates found for the selected category
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{getTypeIcon(template.type)}</span>
                        <h4 className="font-medium text-lg">{template.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                          {CATEGORIES.find(cat => cat.value === template.category)?.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Trigger:</span> {
                            TRIGGER_EVENTS.find(event => event.value === template.trigger)?.label || template.trigger
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Subject:</span> {template.subject}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleTemplate(template.id)}
                        className={`px-3 py-1 text-xs rounded ${
                          template.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {template.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleTestNotification(template)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
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

      {/* Notification Statistics (Mock Data) */}
      {settings.enableAutoNotifications && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Notification Statistics (Last 30 Days)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">12,847</div>
              <div className="text-sm text-gray-600">Emails Sent</div>
              <div className="text-xs text-gray-500">94.2% delivered</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">8,234</div>
              <div className="text-sm text-gray-600">Push Notifications</div>
              <div className="text-xs text-gray-500">87.6% opened</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-gray-600">SMS Messages</div>
              <div className="text-xs text-gray-500">98.7% delivered</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">23</div>
              <div className="text-sm text-gray-600">Active Templates</div>
              <div className="text-xs text-gray-500">across all categories</div>
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

      {/* Add/Edit Template Modal */}
      {(modals.addTemplate || modals.editTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {modals.addTemplate ? 'Add New Template' : 'Edit Template'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={modals.addTemplate ? newTemplate.name : editingTemplate?.name || ''}
                  onChange={(e) => {
                    if (modals.addTemplate) {
                      setNewTemplate(prev => ({ ...prev, name: e.target.value }));
                    } else {
                      setEditingTemplate(prev => ({ ...prev, name: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={modals.addTemplate ? newTemplate.type : editingTemplate?.type || 'email'}
                    onChange={(e) => {
                      if (modals.addTemplate) {
                        setNewTemplate(prev => ({ ...prev, type: e.target.value }));
                      } else {
                        setEditingTemplate(prev => ({ ...prev, type: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={modals.addTemplate ? newTemplate.category : editingTemplate?.category || 'user'}
                    onChange={(e) => {
                      if (modals.addTemplate) {
                        setNewTemplate(prev => ({ ...prev, category: e.target.value }));
                      } else {
                        setEditingTemplate(prev => ({ ...prev, category: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Event
                </label>
                <select
                  value={modals.addTemplate ? newTemplate.trigger : editingTemplate?.trigger || ''}
                  onChange={(e) => {
                    if (modals.addTemplate) {
                      setNewTemplate(prev => ({ ...prev, trigger: e.target.value }));
                    } else {
                      setEditingTemplate(prev => ({ ...prev, trigger: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select trigger event</option>
                  {TRIGGER_EVENTS.map((event) => (
                    <option key={event.value} value={event.value}>
                      {event.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject/Title
                </label>
                <input
                  type="text"
                  value={modals.addTemplate ? newTemplate.subject : editingTemplate?.subject || ''}
                  onChange={(e) => {
                    if (modals.addTemplate) {
                      setNewTemplate(prev => ({ ...prev, subject: e.target.value }));
                    } else {
                      setEditingTemplate(prev => ({ ...prev, subject: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notification subject or title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={modals.addTemplate ? newTemplate.content : editingTemplate?.content || ''}
                  onChange={(e) => {
                    if (modals.addTemplate) {
                      setNewTemplate(prev => ({ ...prev, content: e.target.value }));
                    } else {
                      setEditingTemplate(prev => ({ ...prev, content: e.target.value }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Notification content (use {{variable}} for dynamic content)"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                <strong>Available Variables:</strong> {{user_name}}, {{order_id}}, {{product_name}}, {{price}}, {{stock_count}}, {{company_name}}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (modals.addTemplate) {
                    setModals(prev => ({ ...prev, addTemplate: false }));
                    setNewTemplate({
                      name: '',
                      type: 'email',
                      trigger: '',
                      subject: '',
                      content: '',
                      category: 'user',
                    });
                  } else {
                    setModals(prev => ({ ...prev, editTemplate: false }));
                    setEditingTemplate(null);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={modals.addTemplate ? handleAddTemplate : handleUpdateTemplate}
                disabled={
                  modals.addTemplate 
                    ? !newTemplate.name || !newTemplate.trigger || !newTemplate.subject
                    : !editingTemplate?.name || !editingTemplate?.trigger || !editingTemplate?.subject
                }
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modals.addTemplate ? 'Add Template' : 'Update Template'}
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
        message="Auto notification settings have been successfully updated."
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modals.deleteConfirm}
        onClose={() => setModals(prev => ({ ...prev, deleteConfirm: false }))}
        onConfirm={confirmDeleteTemplate}
        itemName={templateToDelete?.name || ''}
        itemType="notification template"
      />
    </div>
  );
};

export default SettingsAutoNotifications;
