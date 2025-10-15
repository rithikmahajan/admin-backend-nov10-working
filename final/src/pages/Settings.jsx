import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Settings Dashboard Component
 * Main hub for all settings categories - provides navigation to individual setting pages
 */

const SETTINGS_CATEGORIES = [
  {
    id: 'communication',
    title: 'Communication Preferences',
    description: 'Manage notification and communication settings',
    path: '/settings/communication-preferences',
    icon: '💬',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    id: 'profile',
    title: 'Profile Visibility',
    description: 'Control profile visibility and privacy settings',
    path: '/settings/profile-visibility',
    icon: '👤',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    id: 'location',
    title: 'Location Data',
    description: 'Manage location tracking and data collection',
    path: '/settings/location-data',
    icon: '📍',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
  {
    id: 'invoice',
    title: 'Auto Invoice Mailing',
    description: 'Configure automatic invoice email settings',
    path: '/settings/auto-invoice',
    icon: '📧',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  {
    id: 'huggingface',
    title: 'Hugging Face API',
    description: 'Manage AI and ML API integrations',
    path: '/settings/hugging-face',
    icon: '🤗',
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  },
  {
    id: 'templates',
    title: 'Email & SMS Templates',
    description: 'Manage notification templates and content',
    path: '/settings/email-sms-templates',
    icon: '📄',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  },
  {
    id: 'discount',
    title: 'Online Discounts',
    description: 'Configure discount percentages and conditions',
    path: '/settings/online-discount',
    icon: '💰',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    id: 'shipping',
    title: 'Shipping Charges',
    description: 'Manage shipping costs by region and country',
    path: '/settings/shipping-charges',
    icon: '🚚',
    color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  },
  {
    id: 'hsn',
    title: 'HSN Codes',
    description: 'Manage HSN codes for tax purposes',
    path: '/settings/hsn-code',
    icon: '🏷️',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
  },
  {
    id: 'users',
    title: 'User Limits',
    description: 'Configure user capacity and limit settings',
    path: '/settings/user-limit',
    icon: '👥',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    id: 'language',
    title: 'Language & Region',
    description: 'Manage language, country, and regional preferences',
    path: '/settings/language-country-region',
    icon: '🌍',
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
  {
    id: 'pricing',
    title: 'Dynamic Pricing',
    description: 'Configure dynamic pricing rules and strategies',
    path: '/settings/dynamic-pricing',
    icon: '📈',
    color: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  },
  {
    id: 'notifications',
    title: 'Auto Notifications',
    description: 'Manage automatic notification settings and templates',
    path: '/settings/auto-notifications',
    icon: '🔔',
    color: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    description: 'Configure webhook endpoints and integrations',
    path: '/settings/webhook',
    icon: '🔗',
    color: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  },
];

const Settings = () => {
  const navigate = useNavigate();

  // Debug: Log the settings to check if all are loaded
  console.log('SETTINGS_CATEGORIES length:', SETTINGS_CATEGORIES.length);
  console.log('All settings:', SETTINGS_CATEGORIES.map(s => s.title));
  
  // Force re-render with React key

  const handleSettingClick = (path) => {
    navigate(path);
  };

  return (
    <div className="bg-white min-h-screen p-6 font-montserrat">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-[32px] font-bold text-[#010101] font-montserrat mb-2">
          Settings
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your application settings and configurations
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {SETTINGS_CATEGORIES.map((setting, index) => (
          <div
            key={setting.id}
            onClick={() => handleSettingClick(setting.path)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${setting.color}`}
            style={{ minHeight: '200px' }}
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{setting.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-montserrat">
                  {setting.title}
                </h3>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {setting.description}
            </p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>Configure</span>
              <span className="ml-2">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Settings Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{SETTINGS_CATEGORIES.length}</div>
            <div className="text-sm text-gray-600">Total Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{SETTINGS_CATEGORIES.length}</div>
            <div className="text-sm text-gray-600">Available Settings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">8</div>
            <div className="text-sm text-gray-600">New Components</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">6</div>
            <div className="text-sm text-gray-600">Legacy Settings</div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">💡 Getting Started</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Click on any setting category above to configure specific options</p>
          <p>• Each setting page has been optimized for better performance and usability</p>
          <p>• Changes are automatically saved when you update settings</p>
          <p>• Use the back button or navigation to return to this dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
