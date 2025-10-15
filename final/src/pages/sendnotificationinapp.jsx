import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Mail, Edit, Trash2, Info } from "lucide-react";
import ConfirmationDialogue from "../components/confirmationDialogue";
import EditNotificationModal from "../components/EditNotificationModal";

// Constants and Configuration
const PLATFORM_OPTIONS = [
  { label: "Android", value: "android" },
  { label: "ios", value: "ios" },
];

const DIALOG_ACTIONS = {
  SEND: "send",
  EDIT: "edit",
  DELETE: "delete",
};

const INITIAL_FORM_STATE = {
  notificationText: "",
  deeplink: "eg yoraa/product/123",
  selectedPlatforms: ["android"],
};

const SAMPLE_STACKED_NOTIFICATIONS = [
  { id: 1, text: "Manage account and services linked to your Yoraa account" },
  { id: 2, text: "Manage account and services linked to your Yoraa account" },
  { id: 3, text: "Manage account and services linked to your Yoraa account" },
  { id: 4, text: "Manage account and services linked to your Yoraa account" },
];

// Local Storage Utils
const storageUtils = {
  getImage: () => {
    try {
      return localStorage.getItem("notificationImage") || null;
    } catch {
      return null;
    }
  },

  setImage: (image) => {
    try {
      if (image) {
        localStorage.setItem("notificationImage", image);
      } else {
        localStorage.removeItem("notificationImage");
      }
    } catch (error) {
      console.debug("Failed to save image to localStorage:", error);
    }
  },
};

/**
 * Send Notification In App Component
 *
 * REFACTORED ARCHITECTURE:
 * ========================
 *
 * 1. CONSTANTS & CONFIGURATION
 *    - PLATFORM_OPTIONS: Available platform configurations
 *    - DIALOG_ACTIONS: Modal action types
 *    - INITIAL_FORM_STATE: Default form values
 *    - storageUtils: Local storage helper functions
 *
 * 2. STATE MANAGEMENT
 *    - Form state: notification text, deeplink, platform selection
 *    - UI state: dropdown, dialog, edit modes
 *    - Image state: uploaded notification image with persistence
 *    - Notifications: stacked notifications for later sending
 *
 * 3. EVENT HANDLERS (Organized by Category)
 *    - Form Management: text, deeplink, platform selection
 *    - Image Management: upload, preview, persistence
 *    - Notification Management: stack, send, edit, delete
 *    - Dialog Management: open, close, confirm actions
 *    - Navigation: preview and external navigation
 *
 * 4. UI HELPER COMPONENTS
 *    - Platform dropdown with multi-select
 *    - Image upload with preview
 *    - Notification cards with actions
 *    - Confirmation dialogs
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Computed values for platform display
 * - Component wrapped with memo()
 * - Efficient state updates
 * - Optimized localStorage operations
 */
const SendNotificationInApp = memo(() => {
  // State Management - Consolidated form state
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  // State Management - UI State consolidated
  const [uiState, setUiState] = useState({
    dropdownOpen: false,
    editIndex: null,
    editValue: "",
    dialogOpen: false,
    dialogAction: null,
    selectedNotification: null,
  });

  // State Management - Image with localStorage persistence
  const [image, setImage] = useState(() => storageUtils.getImage());

  // State Management - Stacked Notifications
  const [stackedNotifications, setStackedNotifications] = useState(
    SAMPLE_STACKED_NOTIFICATIONS
  );

  // Refs
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Side Effects - Image persistence
  useEffect(() => {
    storageUtils.setImage(image);
  }, [image]);

  // Computed Values - Memoized for performance
  const platformDisplayText = useMemo(() => {
    if (formState.selectedPlatforms.length === 2) return "android/ios";
    if (formState.selectedPlatforms.length === 1) {
      return PLATFORM_OPTIONS.find(
        (opt) => opt.value === formState.selectedPlatforms[0]
      )?.label;
    }
    return "android/ios";
  }, [formState.selectedPlatforms]);

  const isFormValid = useMemo(
    () => formState.notificationText.trim(),
    [formState.notificationText]
  );

  // Event Handlers - Form Management with batched updates
  const updateFormState = useCallback((updates) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateUIState = useCallback((updates) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleEditValueChange = useCallback(
    (e) => {
      updateUIState({ editValue: e.target.value });
    },
    [updateUIState]
  );

  const handleNotificationTextChange = useCallback(
    (e) => {
      updateFormState({ notificationText: e.target.value });
    },
    [updateFormState]
  );

  const handleDeeplinkChange = useCallback(
    (e) => {
      updateFormState({ deeplink: e.target.value });
    },
    [updateFormState]
  );

  const handlePlatformSelection = useCallback(
    (platforms) => {
      updateFormState({ selectedPlatforms: platforms });
      updateUIState({ dropdownOpen: false });
    },
    [updateFormState, updateUIState]
  );

  const toggleDropdown = useCallback(() => {
    updateUIState({ dropdownOpen: !uiState.dropdownOpen });
  }, [uiState.dropdownOpen, updateUIState]);

  // Event Handlers - Image Management
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Event Handlers - Notification Actions - Optimized with early returns
  const handleSaveForLater = useCallback(() => {
    if (!isFormValid) return;

    const newNotification = {
      id: Date.now(),
      text: formState.notificationText.trim(),
    };

    setStackedNotifications((prev) => [...prev, newNotification]);
    updateFormState({ notificationText: "" });
  }, [isFormValid, formState.notificationText, updateFormState]);

  const handleSendNow = useCallback(() => {
    if (!isFormValid) return;

    console.log("Sending notification:", {
      text: formState.notificationText,
      deeplink: formState.deeplink,
      platforms: formState.selectedPlatforms,
      image: !!image,
    });

    // TODO: Implement actual sending logic
    updateFormState({ notificationText: "" });
  }, [isFormValid, formState, image, updateFormState]);

  // Event Handlers - Stacked Notifications Management - Optimized
  const handleStackedNotificationSend = useCallback(
    (notification) => {
      updateUIState({
        dialogAction: DIALOG_ACTIONS.SEND,
        selectedNotification: notification,
        dialogOpen: true,
      });
    },
    [updateUIState]
  );

  const handleStackedNotificationEdit = useCallback(
    (notification, index) => {
      updateUIState({
        editIndex: index,
        editValue: notification.text,
        dialogAction: DIALOG_ACTIONS.EDIT,
        selectedNotification: notification,
        dialogOpen: true,
      });
    },
    [updateUIState]
  );

  const handleStackedNotificationDelete = useCallback(
    (notification) => {
      updateUIState({
        dialogAction: DIALOG_ACTIONS.DELETE,
        selectedNotification: notification,
        dialogOpen: true,
      });
    },
    [updateUIState]
  );

  // Event Handlers - Dialog Management - Optimized
  const closeDialog = useCallback(() => {
    updateUIState({
      dialogOpen: false,
      editIndex: null,
      dialogAction: null,
      selectedNotification: null,
    });
  }, [updateUIState]);

  const handleDialogConfirm = useCallback(() => {
    switch (uiState.dialogAction) {
      case DIALOG_ACTIONS.SEND:
        console.log(
          "Sending stacked notification:",
          uiState.selectedNotification
        );
        setStackedNotifications((prev) =>
          prev.filter((notif) => notif.id !== uiState.selectedNotification.id)
        );
        break;

      case DIALOG_ACTIONS.EDIT:
        setStackedNotifications((prev) =>
          prev.map((notif, index) =>
            index === uiState.editIndex
              ? { ...notif, text: uiState.editValue }
              : notif
          )
        );
        break;

      case DIALOG_ACTIONS.DELETE:
        setStackedNotifications((prev) =>
          prev.filter((notif) => notif.id !== uiState.selectedNotification.id)
        );
        break;

      default:
        break;
    }
    closeDialog();
  }, [
    uiState.dialogAction,
    uiState.selectedNotification,
    uiState.editIndex,
    uiState.editValue,
    closeDialog,
  ]);

  // Event Handlers - Navigation
  const handlePreviewNavigation = useCallback(() => {
    navigate("/notification-preview", { state: { image } });
  }, [navigate, image]);

  // UI Helper Components - Memoized for performance
  const renderPlatformDropdown = useMemo(
    () => (
      <div className="relative max-w-xs">
        <button
          type="button"
          className="w-full border-2 border-black rounded-xl px-5 py-2 text-sm text-left focus:outline-none bg-white text-[#979797] font-medium font-montserrat"
          onClick={toggleDropdown}
        >
          {platformDisplayText}
        </button>
        {uiState.dropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border-2 border-black rounded-xl shadow-lg">
            <div className="py-1">
              <button
                type="button"
                className={`w-full text-left px-4 py-2 text-sm font-montserrat ${
                  formState.selectedPlatforms.length === 2
                    ? "text-blue-600 bg-gray-100"
                    : "text-gray-900"
                }`}
                onClick={() => handlePlatformSelection(["android", "ios"])}
              >
                Both
                {formState.selectedPlatforms.length === 2 && (
                  <span className="ml-2">✓</span>
                )}
              </button>
              {PLATFORM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm font-montserrat ${
                    formState.selectedPlatforms.includes(opt.value) &&
                    formState.selectedPlatforms.length === 1
                      ? "text-blue-600 bg-gray-100"
                      : "text-gray-900"
                  }`}
                  onClick={() => handlePlatformSelection([opt.value])}
                >
                  {opt.label}
                  {formState.selectedPlatforms.includes(opt.value) &&
                    formState.selectedPlatforms.length === 1 && (
                      <span className="ml-2">✓</span>
                    )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    [
      uiState.dropdownOpen,
      platformDisplayText,
      formState.selectedPlatforms,
      toggleDropdown,
      handlePlatformSelection,
    ]
  );

  const renderImageUpload = useMemo(
    () => (
      <div className="mb-8">
        <label className="block text-lg font-semibold text-black mb-4">
          Notification image(optional)
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 bg-[#000AFF] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700 border border-[#7280FF] shadow-sm font-montserrat"
            onClick={triggerImageUpload}
          >
            <Upload size={16} />
            Upload image
          </button>
          <div className="w-16 h-16 border-2 border-dashed border-[#CCD2E3] rounded-[15px] flex items-center justify-center">
            {image ? (
              <img
                src={image}
                alt="Notification"
                className="w-12 h-12 object-cover rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 border-2 border-[#CCD2E3] rounded"></div>
            )}
          </div>
        </div>
      </div>
    ),
    [image, handleImageUpload, triggerImageUpload]
  );

  const renderActionButtons = useMemo(
    () => (
      <div className="flex gap-4 mb-12">
        <button
          className="text-black px-12 py-4 border border-[#E4E4E4] rounded-full text-base font-medium hover:bg-gray-50 font-montserrat"
          onClick={handleSaveForLater}
          disabled={!isFormValid}
        >
          save for later
        </button>
        <button
          className="bg-black text-white px-12 py-4 rounded-full text-base font-medium hover:bg-gray-800 font-montserrat disabled:opacity-50"
          onClick={handleSendNow}
          disabled={!isFormValid}
        >
          send Now
        </button>
      </div>
    ),
    [handleSaveForLater, handleSendNow, isFormValid]
  );

  const renderNotificationCard = useCallback(
    (notification, index) => (
      <div
        key={notification.id}
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <Info size={12} className="text-white" />
          </div>
          <p className="text-black text-sm flex-1 font-montserrat leading-tight max-w-sm">
            {notification.text}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium font-montserrat"
            onClick={() => handleStackedNotificationSend(notification)}
          >
            send Now
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => handleStackedNotificationEdit(notification, index)}
          >
            <Edit size={16} className="text-[#667085]" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => handleStackedNotificationDelete(notification)}
          >
            <Trash2 size={16} className="text-[#667085]" />
          </button>
        </div>
      </div>
    ),
    [
      handleStackedNotificationSend,
      handleStackedNotificationEdit,
      handleStackedNotificationDelete,
    ]
  );

  const renderPreview = useMemo(
    () => (
      <div className="w-80 flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-2xl font-bold text-black">Preview</h3>
          <button
            className="bg-black rounded-full w-6 h-6 flex items-center justify-center"
            onClick={handlePreviewNavigation}
            title="See full preview"
          >
            <Info size={12} className="text-white" />
          </button>
        </div>

        <div className="border-2 border-dashed border-[#CCD2E3] rounded-xl p-8 flex items-center justify-center h-80">
          <div className="text-center">
            {image ? (
              <div className="w-full mx-auto border-2 border-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={image}
                  alt="Notification Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto border-2 border-[#003F62] rounded-lg flex items-center justify-center">
                <Mail size={32} className="text-[#003F62]" />
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    [image, handlePreviewNavigation]
  );

  return (
    <div className="bg-white min-h-screen font-montserrat">
      <div className="w-full py-10 grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column - Form Section (2/3 Width) */}
        <div className="xl:col-span-2 px-6">
          <h2 className="text-3xl font-bold text-black mb-8">Notification</h2>

          {/* Notification Text */}
          <div className="mb-8">
            <textarea
              value={formState.notificationText}
              onChange={handleNotificationTextChange}
              placeholder="Type Here"
              className="w-full h-36 border-2 border-black rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-black text-[#979797]"
            />
          </div>

          {/* Notification Image Upload */}
          <div className="mb-8">{renderImageUpload}</div>

          {/* Deeplink */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-black mb-3">
              Deeplink (optional)
            </label>
            <input
              type="text"
              value={formState.deeplink}
              onChange={handleDeeplinkChange}
              placeholder="eg. yoraa/product/123"
              className="w-full border-2 border-black rounded-xl px-5 py-2 text-sm focus:outline-none focus:border-black text-[#979797] font-medium"
            />
          </div>

          {/* Target Platform Dropdown */}
          <div className="mb-8 relative">
            <label className="block text-lg font-semibold text-black mb-3">
              Target platform
            </label>
            {renderPlatformDropdown}
          </div>

          {/* Action Buttons */}
          <div className="mb-10">{renderActionButtons}</div>

          {/* Stacked Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-6">
              Stack notification for later
            </h3>
            <div className="space-y-4">
              {stackedNotifications.map(renderNotificationCard)}
            </div>
          </div>
        </div>

        {/* Right Column - Preview (1/3 Width) */}
        <div className="w-full xl:sticky top-10 h-fit">{renderPreview}</div>
      </div>

      {/* Dialogs */}
      {uiState.dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          {uiState.dialogAction === DIALOG_ACTIONS.EDIT ? (
            <EditNotificationModal
              value={uiState.editValue}
              onChange={handleEditValueChange}
              onSave={handleDialogConfirm}
              onCancel={closeDialog}
              original={uiState.selectedNotification?.text}
            />
          ) : uiState.dialogAction === DIALOG_ACTIONS.DELETE ? (
            <ConfirmationDialogue
              open={uiState.dialogOpen}
              message="Are you sure you want to delete this notification?"
              confirmText="Delete"
              onConfirm={handleDialogConfirm}
              onCancel={closeDialog}
            />
          ) : (
            <ConfirmationDialogue
              open={uiState.dialogOpen}
              message="Are you sure you want to send the notification?"
              onConfirm={handleDialogConfirm}
              onCancel={closeDialog}
            />
          )}
        </div>
      )}
    </div>
  );
});

SendNotificationInApp.displayName = "SendNotificationInApp";

export default SendNotificationInApp;
