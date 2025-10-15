import React, { useState, useCallback, memo, useEffect } from "react";
import DashboardView from "./dashboardview";
import DashboardMarketplaceSync from "./dashboardmarketplacesync";
import DashboardAnalyticsGoogleReport from "./dashboardanalyticsgooglereport";
import DashboardUsers from "./dashboardusers";
import DashboardOrders from "./dashboardorders";
import DashboardProductData from "./dashboardproductdata";

// Main Dashboard Component that orchestrates all the modular dashboard components
const Dashboard = memo(({ activeTab: propActiveTab, onTabChange: propOnTabChange }) => {
  const [activeTab, setActiveTab] = useState(propActiveTab || "sync");

  // Handle tab changes
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (propOnTabChange) {
      propOnTabChange(tab);
    }
  }, [propOnTabChange]);

  // Update local state when prop changes
  useEffect(() => {
    if (propActiveTab && propActiveTab !== activeTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab, activeTab]);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "sync":
        return <DashboardMarketplaceSync />;
      case "analytics":
        return <DashboardAnalyticsGoogleReport />;
      case "users":
      case "database":
      case "databaseDashboard":
        return <DashboardUsers />;
      case "orders":
        return <DashboardOrders />;
      case "products":
        return <DashboardProductData />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Dashboard Section
            </h2>
            <p className="text-gray-600">
              Content for {activeTab} will be displayed here.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Use DashboardView for consistent header and navigation */}
      <DashboardView 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      {/* Main Content */}
      <div className="px-6 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;
