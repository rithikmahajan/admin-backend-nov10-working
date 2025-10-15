// NotificationPreview page displays the uploaded notification image in full view
// Uses React Router location state to receive image data
// Usage: Navigate to this page with image in location.state
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMemo, useCallback, memo } from "react";

// Static class strings to prevent object recreation on each render
const CONTAINER_CLASSES = "flex flex-col items-center justify-center min-h-screen relative";
const BACK_BUTTON_CLASSES = "absolute top-6 right-8 bg-black text-white p-2 rounded-full flex items-center justify-center hover:bg-gray-800";
const CONTENT_WRAPPER_CLASSES = "bg-white rounded-lg shadow-lg p-8 flex flex-col items-center";
const TITLE_CLASSES = "text-xl font-bold mb-6 text-gray-900";
const IMAGE_CLASSES = "max-w-2xl rounded-lg border border-gray-300";
const PLACEHOLDER_CLASSES = "w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500";

// NotificationPreview page to show the uploaded image in full view
const NotificationPreview = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Memoize image extraction to avoid re-computation on every render
  const image = useMemo(() => location.state?.image, [location.state?.image]);
  
  // Memoize navigation handler to prevent unnecessary re-renders of child components
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={CONTAINER_CLASSES}>
      {/* Back icon at top right of content area */}
      <button
        className={BACK_BUTTON_CLASSES}
        onClick={handleBack}
        title="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <div className={CONTENT_WRAPPER_CLASSES}>
        <h2 className={TITLE_CLASSES}>
          Notification Image Preview
        </h2>
        {image ? (
          <img
            src={image}
            alt="Notification Full Preview"
            className={IMAGE_CLASSES}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={PLACEHOLDER_CLASSES}>
            No image uploaded
          </div>
        )}
      </div>
    </div>
  );
});

// Set display name for debugging purposes
NotificationPreview.displayName = 'NotificationPreview';

export default NotificationPreview;
