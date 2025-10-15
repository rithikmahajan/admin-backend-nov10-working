import React from 'react';

// Create an index file for easy imports of all dashboard components
export { default as MainDashboard } from '../MainDashboard';
export { default as DashboardView } from '../dashboardview';
export { default as DashboardMarketplaceSync } from '../dashboardmarketplacesync';
export { default as DashboardAnalyticsGoogleReport } from '../dashboardanalyticsgooglereport';
export { default as DashboardUsers } from '../dashboardusers';
export { default as DashboardOrders } from '../dashboardorders';
export { default as DashboardProductData } from '../dashboardproductdata';

// Named export for backward compatibility
export {
  MainDashboard as Dashboard,
  DashboardView as DashboardOverview,
  DashboardMarketplaceSync as MarketplaceSync,
  DashboardAnalyticsGoogleReport as AnalyticsReports,
  DashboardUsers as UserManagement,
  DashboardOrders as OrderManagement,
  DashboardProductData as ProductManagement
};
