import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { restoreAuthFromStorage } from "./store/slices/authSlice";
import Layout from "./layout/Layout";

// Import AuthFlow component and ProtectedRoute
import AuthFlow from "./screens/AuthFlow";
import ProtectedRoute from "./components/ProtectedRoute";

// Import demo components
import ProfileModalDemo from "./components/ProfileModalDemo";
import SimpleModalTest from "./components/SimpleModalTest";

// Import all page components
import MainDashboard from "./pages/MainDashboard";
import DashboardView from "./pages/dashboardview";
import DashboardAnalyticsGoogleReport from "./pages/dashboardanalyticsgooglereport";
import DashboardMarketplaceSync from "./pages/dashboardmarketplacesync";
import DashboardUsers from "./pages/dashboardusers";
import DashboardOrders from "./pages/dashboardorders";
import DashboardProductData from "./pages/dashboardproductdata";
import OrdersEnhanced from "./pages/OrdersEnhanced"; // Enhanced Orders component with Shiprocket integration
import AdminOrderDetails from "./pages/AdminOrderDetails"; // Enhanced OrderDetails component
import OrderReturns from "./pages/OrderReturns"; // Advanced order returns management
import ExchangeOrders from "./pages/ExchangeOrders"; // New Exchange Orders component
import Inbox from "./pages/Inbox";
import BlockUser from "./pages/BlockUser";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import UploadCategory from "./pages/UploadCategory";
import SubCategory from "./pages/SubCategory";
import SingleProductUpload from "./components/SingleProductUpload";
import NetworkDebug from "./pages/NetworkDebug";
import Login from "./pages/Login";

// NEW CLEAN COMPONENTS - Fixed infinite loop issues
import ItemManagementNew from "./pages/ItemManagement_New";
import SingleProductUploadNew from "./pages/SingleProductUpload_New";
import BulkUploadNew from "./pages/BulkUpload_New";
import EditPageNew from "./pages/EditPage_New";
import ManageReviews from "./pages/ManageReviews";
import ReviewDetails from "./pages/ReviewDetails";
import PushNotification from "./pages/pushNotification";
import NotificationPreview from "./pages/notificationPreview";
import SendNotificationInApp from "./pages/sendnotificationinapp";
import BulkSMS from "./pages/BulkSMS";
import InviteAFriend from "./pages/inviteafriend";
import Points from "./pages/points";
import PromoCodeManagement from "./pages/PromoCodeManagement";
import CartAbandonmentRecovery from "./pages/CartAbandonmentRecovery";
import Filters from "./pages/Filters";
import JoinUsControl from "./pages/JoinUsControl";
import ManageBannersOnRewards from "./pages/ManageBannersOnRewards";
import ProductBundling from "./pages/itembundling";
import ArrangementControl from "./pages/itemarrangementcontrol";
import NewPartner from "./pages/NewPartner";

import FaqManagement from "./pages/FaqManagement";
import CollectCommunicationPreferences from "./pages/settingscommunicationpreferences";
import CollectProfileVisibilityData from "./pages/settingsprofilevisibility";
import CollectLocationData from "./pages/settingslocationdata";
import GetAutoInvoiceMailing from "./pages/settingsautoinvoice";
import HuggingFaceApiOpenClose from "./pages/settingshuggingfaceapi";

// New separated setting components
import SettingsOnlineDiscount from "./pages/settingsonlinediscount";
import SettingsShippingCharges from "./pages/settingsshippingcharges";
import SettingsHsnCode from "./pages/settingshsncode";
import SettingsUserLimit from "./pages/settingsuserlimit";
import SettingsLanguageCountryRegion from "./pages/settingslanguagecountryregion";
import SettingsDynamicPricing from "./pages/settingsdynamicpricing";
import SettingsAutoNotifications from "./pages/settingsautonotifications";
import SettingsWebhook from "./pages/settingswebhook";
import Profile from "./pages/Profile";
import EmailAndSmsTemplateManagementScreenPage from "./pages/emailandsmstempalatemanagementscreenpage";
import SaveForLaterPage from "./pages/SaveForLaterPage";
import SaveForLaterExamples from "./components/SaveForLaterExamples";

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Restore authentication from localStorage on app startup
  useEffect(() => {
    dispatch(restoreAuthFromStorage());
    // Add a small delay to ensure auth state is properly restored
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);
  }, [dispatch]);

  // Show loading spinner while app is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Root route - always redirect to auth first */}
        <Route 
          path="/" 
          element={<Navigate to="/auth" replace />}
        />

        {/* ===== AUTHENTICATION ROUTES (without Layout) ===== */}
        <Route path="/auth" element={<AuthFlow />} />



        {/* ===== DEMO ROUTES ===== */}
        <Route path="/profile-modal-demo" element={<ProfileModalDemo />} />
        <Route path="/simple-modal-test" element={<SimpleModalTest />} />

        {/* Dashboard route without layout for now */}
        <Route path="/dashboard" element={
          <div style={{ padding: '20px' }}>
            <h1>Admin Dashboard</h1>
            <p>Welcome to the admin panel!</p>
            <MainDashboard />
          </div>
        } />

        {/* All admin routes wrapped in Layout and protected */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* ===== DASHBOARD & MAIN ===== */}
          <Route path="/admin-dashboard" element={<MainDashboard />} />
          <Route path="/database" element={<MainDashboard activeTab="databaseDashboard" />} />
          
          {/* ===== NEW DASHBOARD COMPONENTS ===== */}
          <Route path="/dashboard-overview" element={<DashboardView />} />
          <Route path="/analytics-reports" element={<DashboardAnalyticsGoogleReport />} />
          <Route path="/marketplace-sync" element={<DashboardMarketplaceSync />} />
          <Route path="/user-management" element={<DashboardUsers />} />
          <Route path="/order-management" element={<DashboardOrders />} />
          <Route path="/product-data" element={<DashboardProductData />} />

          {/* ===== ENHANCED ORDER MANAGEMENT ===== */}
          <Route path="/orders" element={<OrdersEnhanced />} /> {/* Enhanced with Shiprocket integration */}
          <Route path="/order-details/:orderId" element={<AdminOrderDetails />} /> {/* Enhanced admin order details */}
          <Route path="/return-orders" element={<OrderReturns />} /> {/* Advanced order returns management */}
          

          <Route path="/exchange-orders" element={<ExchangeOrders />} /> {/* New Exchange Orders */}

          {/* Chat Messages */}
          <Route path="/inbox" element={<Inbox />} />

          {/* ===== PRODUCT MANAGEMENT ===== */}
          
          {/* NEW CLEAN COMPONENTS - Testing Routes */}
          <Route path="/item-management-new" element={<ItemManagementNew />} />
          <Route path="/item-management-new/edit/:id" element={<EditPageNew />} />
          <Route path="/item-management-new/bulk-upload" element={<BulkUploadNew />} />
          <Route path="/single-product-upload-new" element={<SingleProductUploadNew />} />
          <Route path="/single-product-upload-new/:id" element={<SingleProductUploadNew />} />
          
          <Route path="/products" element={<Products />} />
          
          {/* ===== SAVE FOR LATER ===== */}
          <Route path="/save-for-later" element={<SaveForLaterPage />} />
          <Route path="/save-for-later-examples" element={<SaveForLaterExamples />} />
          <Route path="/upload-category" element={<UploadCategory />} />
          <Route path="/network-debug" element={<NetworkDebug />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subcategory" element={<SubCategory />} />
          <Route
            path="/single-product-upload"
            element={<SingleProductUpload />}
          />
          <Route
            path="/single-product-upload-complex"
            element={<SingleProductUpload />}
          />


          {/* ===== REVIEWS & RATINGS ===== */}
          <Route path="/manage-reviews" element={<ManageReviews />} />
          <Route path="/review-details" element={<ReviewDetails />} />          {/* ===== USER MANAGEMENT ===== */}
          <Route path="/users" element={<DashboardUsers />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/block-user" element={<BlockUser />} />

          {/* ===== COMMUNICATION & NOTIFICATIONS ===== */}
          <Route path="/push-notification" element={<PushNotification />} />
          <Route
            path="/notification-preview"
            element={<NotificationPreview />}
          />
          <Route
            path="/in-app-notification"
            element={<SendNotificationInApp />}
          />
          <Route path="/bulk-messages" element={<BulkSMS />} />

          {/* ===== MARKETING & PROMOTIONS ===== */}
          <Route path="/invite" element={<InviteAFriend />} />
          <Route path="/points" element={<Points />} />
          <Route
            path="/promo-code-management"
            element={<PromoCodeManagement />}
          />
          <Route path="/cart-recovery" element={<CartAbandonmentRecovery />} />

          {/* ===== APP FUNCTIONAL AREA ===== */}
          <Route path="/filters" element={<Filters />} />
          <Route path="/join-control" element={<JoinUsControl />} />
          <Route
            path="/manage-banners-rewards"
            element={<ManageBannersOnRewards />}
          />
          <Route path="/bundling" element={<ProductBundling />} />
          <Route path="/arrangement" element={<ArrangementControl />} />
          <Route path="/new-partner" element={<NewPartner />} />

          {/* ===== DATA MANAGEMENT & COLLECTION ===== */}
          <Route path="/faq-management" element={<FaqManagement />} />
          <Route
            path="/collect-communication-preferences"
            element={<CollectCommunicationPreferences />}
          />
          <Route
            path="/collect-profile-visibility"
            element={<CollectProfileVisibilityData />}
          />
          <Route
            path="/collect-location-data"
            element={<CollectLocationData />}
          />
          <Route
            path="/auto-invoice-mailing"
            element={<GetAutoInvoiceMailing />}
          />
          <Route
            path="/hugging-face-api"
            element={<HuggingFaceApiOpenClose />}
          />

          {/* ===== ANALYTICS & REPORTS ===== */}
          {/* Analytics route removed - use /analytics-reports instead */}

          {/* ===== SETTINGS & CONFIGURATION ===== */}
          {/* Main Settings Dashboard */}
          <Route path="/settings" element={<Settings />} />
          
          {/* Original settings sub-routes */}
          <Route
            path="/settings/communication-preferences"
            element={<CollectCommunicationPreferences />}
          />
          <Route
            path="/settings/profile-visibility"
            element={<CollectProfileVisibilityData />}
          />
          <Route
            path="/settings/location-data"
            element={<CollectLocationData />}
          />
          <Route
            path="/settings/auto-invoice"
            element={<GetAutoInvoiceMailing />}
          />
          <Route
            path="/settings/hugging-face"
            element={<HuggingFaceApiOpenClose />}
          />
          <Route
            path="/settings/email-sms-templates"
            element={<EmailAndSmsTemplateManagementScreenPage />}
          />
          
          {/* New separated settings components */}
          <Route
            path="/settings/online-discount"
            element={<SettingsOnlineDiscount />}
          />
          <Route
            path="/settings/shipping-charges"
            element={<SettingsShippingCharges />}
          />
          <Route
            path="/settings/hsn-code"
            element={<SettingsHsnCode />}
          />
          <Route
            path="/settings/user-limit"
            element={<SettingsUserLimit />}
          />
          <Route
            path="/settings/language-country-region"
            element={<SettingsLanguageCountryRegion />}
          />
          <Route
            path="/settings/dynamic-pricing"
            element={<SettingsDynamicPricing />}
          />
          <Route
            path="/settings/auto-notifications"
            element={<SettingsAutoNotifications />}
          />
          <Route
            path="/settings/webhook"
            element={<SettingsWebhook />}
          />
        </Route>
      </Routes>
    </>
  );
};

export default App;
