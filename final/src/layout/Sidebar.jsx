import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Sidebar Component
 *
 * Navigation sidebar for the admin dashboard providing:
 * - Hierarchical menu structure
 * - Active state indication
 * - Responsive design with mobile toggle
 * - Organized sections for different admin areas
 *
 * Performance Optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - useMemo for menu configuration
 * - Efficient active state checking
 * - Proper prop types and default values
 */
const Sidebar = React.memo(
  ({
    sidebarOpen,
    setSidebarOpen,
    sidebarHidden,
    onToggleSidebarVisibility,
  }) => {
    const location = useLocation();

    // Memoized menu configuration to prevent recreation on each render
    const menuSections = useMemo(
      () => [
        {
          title: "Dashboard",
          titleSize: "text-2xl",
          items: [{ name: "Dashboard", path: "/" }],
        },
        {
          title: "App inbox area",
          titleSize: "text-xl",
          items: [{ name: "Inbox", path: "/inbox" }],
        },
        {
          title: "App order area",
          titleSize: "text-xl",
          items: [
            { name: "Orders", path: "/orders" },
            { name: "Users", path: "/users" },
            { name: "Block User", path: "/block-user" },
          ],
        },
        {
          title: "App uploading area",
          titleSize: "text-xl",
          items: [
            { name: "Category", path: "/upload-category" },
            { name: "Subcategory", path: "/subcategory" },
            { name: "Upload Product", path: "/upload-product" },
          ],
        },
        {
          title: "Customer Features",
          titleSize: "text-xl",
          items: [
            { name: "Save For Later", path: "/save-for-later" },
            { name: "Save For Later Examples", path: "/save-for-later-examples" },
          ],
        },
        {
          title: "App functional area",
          titleSize: "text-xl",
          items: [
            { name: "Filters", path: "/filters" },
            { name: "Promo Code", path: "/promo-code-management" },
            { name: "Points", path: "/points" },
            { name: "FAQ Management", path: "/faq-management" },
            {
              name: "Manage Banners on Rewards",
              path: "/manage-banners-rewards",
            },
            { name: "Join Us Control Screen", path: "/join-control" },
            { name: "Invite a Friend", path: "/invite" },
            { name: "New Partner", path: "/new-partner" },
            { name: "Arrangement Control", path: "/arrangement" },
            { name: "Product Bundling", path: "/bundling" },
          ],
        },
        {
          title: "App promotional area",
          titleSize: "text-xl",
          items: [
            { name: "Cart Abandonment Recovery", path: "/cart-recovery" },
            {
              name: "Send Notification In App",
              path: "/send-notification-in-app",
            },
            { name: "Push Notification", path: "/pushnotification" },
            { name: "Manage Reviews", path: "/manage-reviews" },
            { name: "Invite a Friend with Promo Code", path: "/invite" },
          ],
        },
        {
          title: "Settings",
          titleSize: "text-xl",
          items: [{ name: "Settings", path: "/settings" }],
        },
      ],
      []
    );

    return (
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-gray-600 opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 lg:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } pt-[60px] relative`}
        >
          {/* Arrow Toggle Button */}
          <button
            onClick={onToggleSidebarVisibility}
            className="absolute top-[80px] -right-3 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 z-50"
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
            title={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
          </button>

          {/* Sidebar Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2 sm:space-y-3">
                {/* Section Title */}
                <h3
                  className={`font-bold text-gray-900 ${
                    section.titleSize === "text-2xl"
                      ? "text-xl sm:text-2xl"
                      : "text-lg sm:text-xl"
                  } ${
                    section.title === "Dashboard"
                      ? "mb-1 sm:mb-2"
                      : "mb-2 sm:mb-4"
                  }`}
                >
                  {section.title}
                </h3>

                {/* Section Items */}
                <div className="space-y-1 sm:space-y-2">
                  {section.items.map((item, itemIndex) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={itemIndex}
                        to={item.path}
                        className={`block text-sm sm:text-[15px] font-normal leading-[15px] transition-colors duration-200 py-1 ${
                          isActive
                            ? "text-blue-600 font-semibold"
                            : "text-gray-700 hover:text-blue-600"
                        } ${
                          section.title === "Dashboard" ? "" : "ml-0.5 sm:ml-1"
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Vertical divider line (visible in design) */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>
        </div>
      </>
    );
  }
);

// Set display name for debugging
Sidebar.displayName = "Sidebar";

export default Sidebar;
