// Layout component provides the main dashboard structure with navbar, sidebar, and fixed-width content area
// Usage: Wrap your routes/pages with <Layout> for consistent UI
// - Navbar/Header at the top
// - Sidebar below navbar
// - Main content area uses React Router Outlet for dynamic page rendering
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import sidebarItems from "../data/sidebarItems";
import Header from "./Header";

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Map sidebar items to routes
  const getRouteForItem = (item) => {
    const routeMap = {
      "Dashboard": "/admin-dashboard",
      "Database Dashboard": "/database",
      "Analytics Reports": "/analytics-reports", 
      "Marketplace Sync": "/marketplace-sync",
      "User Management": "/user-management",
      "Order Management": "/order-management", 
      "Product Data": "/product-data",
      "orders": "/orders",
      "Inbox": "/inbox",
      "return orders": "/return-orders",
      "exchange orders": "/exchange-orders",
      "Category": "/upload-category",
      "Subcategory": "/subcategory",
      "Items": "/item-management",
      "Items (NEW - Fixed)": "/item-management-new",
      "Single Upload (NEW)": "/single-product-upload-new",
      "Bulk Upload (NEW)": "/item-management-new/bulk-upload",
      "Filters": "/filters",
      "join us control screen": "/join-control",
      "Manage banners rewards": "/manage-banners-rewards",
      "product bundling": "/bundling",
      "Arrangement control": "/arrangement",
      "new admin partner": "/new-partner",
      "users /block user": "/block-user",
      "send notification in app(inbuilt)": "/in-app-notification",
      "push notification": "/push-notification",
      "manage and post reviews": "/manage-reviews",
      "Promo codes": "/promo-code-management",
      "Points management and issue": "/points",
      "Invite a friend with promo code": "/invite",
      "Cart abandonment recovery": "/cart-recovery",
      "(bulk message and email)": "/bulk-messages",
      "analytics report(google)": "/analytics",
      "support chat log": "/support-logs",
      "Settings": "/settings",
      "FAQ Management": "/faq-management",
      "Collect communication preferences": "/collect-communication-preferences",
      "collect Profile visibility data": "/collect-profile-visibility",
      "collectlocationdata": "/collect-location-data",
      "get auto invoice mailing": "/auto-invoice-mailing",
      "hugging face api open close": "/hugging-face-api"
    };
    return routeMap[item] || "#";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Use our Header component with ProfileIconModal */}
      <Header />
      {/* Sidebar below navbar and main content to the right */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
          </div>
        )}
        
        {/* Sidebar */}
        <aside
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-50
            w-64 bg-white border-r border-gray-200 flex-shrink-0 transition-transform duration-300 ease-in-out
          `}
        >
          <div className="p-4 overflow-y-auto h-full">
            {sidebarItems.map((section, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const route = getRouteForItem(item);
                    const isActive = location.pathname === route;
                    
                    return (
                      <li key={itemIndex}>
                        {route !== "#" ? (
                          <Link
                            to={route}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`text-xs block py-1.5 px-2 w-full text-left transition-colors rounded ${
                              isActive
                                ? "text-blue-600 font-medium bg-blue-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            {item}
                          </Link>
                        ) : (
                          <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 block py-1.5 px-2 w-full text-left rounded transition-colors"
                          >
                            {item}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1 bg-white overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
