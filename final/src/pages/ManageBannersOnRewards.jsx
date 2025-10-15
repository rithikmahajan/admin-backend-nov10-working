import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
  useRef,
} from "react";
import { bannerService } from "../services/bannerService";

// Constants - Frozen for better performance
const INITIAL_TEXT_POSITION = Object.freeze({ x: 20, y: 20 });
const DRAG_CONSTRAINTS = Object.freeze({
  maxTextWidth: 200,
  maxTextHeight: 100,
});

const DEFAULT_BANNER_CONTENT = `Welcome reward
Enjoy a welcome reward to spend in your first month.
Birthday reward
Celebrate your birthday month with a special discount
Private members' sale
Unlocked after your first order`;

// Utility functions - Pure functions for better performance
const createImageUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

const constrainPosition = (position, maxX, maxY) => ({
  x: Math.max(0, Math.min(position.x, maxX)),
  y: Math.max(0, Math.min(position.y, maxY)),
});

/**
 * ManageBannersOnRewards Component
 *
 * Features:
 * - Image upload functionality for banner creation
 * - Title and detail input fields
 * - Priority management for banners
 * - Preview section showing existing banners
 * - Post to rewards functionality
 *
 * Performance Optimizations:
 * - Custom hooks for state management
 * - Memoized components to prevent unnecessary re-renders
 * - Optimized drag and drop functionality
 * - Responsive design with Tailwind CSS
 * - Form validation and error handling
 */
/**
 * Optimized Custom Hooks for State Management
 */
const useImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const currentImageRef = useRef(null);

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setImageLoading(true);
        
        // Check file size
        const fileSizeInMB = file.size / (1024 * 1024);
        const maxSizeInMB = 10; // 10MB limit
        
        if (fileSizeInMB > maxSizeInMB) {
          throw new Error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds the ${maxSizeInMB}MB limit. Please choose a smaller image.`);
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select a valid image file.');
        }
        
        const imageUrl = await bannerService.uploadBannerImage(file);
        currentImageRef.current = imageUrl;
        setSelectedImage(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        
        // Show error to user instead of falling back
        alert(error.message || 'Failed to upload image. Please try again with a smaller image.');
        
        // Reset the file input
        event.target.value = '';
      } finally {
        setImageLoading(false);
      }
    }
  }, []);

  const resetImage = useCallback(() => {
    currentImageRef.current = null;
    setSelectedImage(null);
    setImageLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentImageRef.current) {
        // Cleanup handled automatically for data URLs
      }
    };
  }, []);

  return { selectedImage, handleImageUpload, resetImage, imageLoading };
};

const useDragAndDrop = (initialPosition = INITIAL_TEXT_POSITION) => {
  const [textPosition, setTextPosition] = useState(() => ({
    ...initialPosition,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef({ isDragging: false, offset: { x: 0, y: 0 } });

  const handleMouseDown = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const offset = {
        x: e.clientX - rect.left - textPosition.x,
        y: e.clientY - rect.top - textPosition.y,
      };

      dragStateRef.current = { isDragging: true, offset };
      setIsDragging(true);
      setDragOffset(offset);
    },
    [textPosition.x, textPosition.y]
  );

  const handleMouseMove = useCallback((e) => {
    if (!dragStateRef.current.isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragStateRef.current.offset.x;
    const newY = e.clientY - rect.top - dragStateRef.current.offset.y;

    const maxX = rect.width - DRAG_CONSTRAINTS.maxTextWidth;
    const maxY = rect.height - DRAG_CONSTRAINTS.maxTextHeight;

    const constrainedPosition = constrainPosition(
      { x: newX, y: newY },
      maxX,
      maxY
    );
    setTextPosition(constrainedPosition);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  const resetPosition = useCallback(() => {
    setTextPosition({ ...initialPosition });
  }, [initialPosition]);

  // Memoize drag handlers to prevent re-renders
  const dragHandlers = useMemo(
    () => ({
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    }),
    [handleMouseDown, handleMouseMove, handleMouseUp]
  );

  return {
    textPosition,
    isDragging,
    dragHandlers,
    resetPosition,
  };
};

const useModalState = () => {
  const [modals, setModals] = useState(() => ({
    showScreenView: false,
    showEditModal: false,
    showSaveSuccessModal: false,
    showConfirmationModal: false,
    showPostSuccessModal: false,
    showDeleteConfirmationModal: false,
    showDeleteSuccessModal: false,
  }));

  // Memoized modal handlers to prevent recreating functions
  const modalHandlers = useMemo(
    () => ({
      openModal: (modalName) => {
        setModals((prev) => ({ ...prev, [modalName]: true }));
      },
      closeModal: (modalName) => {
        setModals((prev) => ({ ...prev, [modalName]: false }));
      },
    }),
    []
  );

  return {
    modals,
    ...modalHandlers,
  };
};

/**
 * Optimized Reusable Components with performance improvements
 */
const ImageUploadSection = memo(
  ({ selectedImage, onImageUpload, title = "upload image" }) => {
    // Memoize the upload label to prevent re-renders
    const uploadLabel = useMemo(
      () => (
        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <span className="text-xl">+</span>
          <span>{title}</span>
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
      ),
      [title, onImageUpload]
    );

    return (
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 h-64">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt="Uploaded preview"
              className="max-w-full max-h-full mx-auto rounded object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center justify-center h-full">
              <div className="text-4xl mb-2">📧</div>
            </div>
          )}
        </div>
        {uploadLabel}
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPG, PNG, GIF. Max size: 10MB. Images will be automatically compressed if needed.
        </p>
      </div>
    );
  }
);

ImageUploadSection.displayName = "ImageUploadSection";

const TextContentDisplay = memo(({ content }) => {
  // Memoize the processed lines to prevent recalculations
  const processedLines = useMemo(() => {
    return content.split("\n").map((line, index) => ({
      line,
      isTitle: index % 2 === 0,
      key: `${index}-${line.slice(0, 10)}`, // More stable key
    }));
  }, [content]);

  return (
    <div className="text-sm leading-relaxed space-y-1">
      {processedLines.map(({ line, isTitle, key }) => (
        <div
          key={key}
          className={isTitle ? "font-bold text-black" : "text-gray-600 text-xs"}
        >
          {line}
        </div>
      ))}
    </div>
  );
});

TextContentDisplay.displayName = "TextContentDisplay";

const PreviewSection = memo(
  ({ selectedImage, createDetail, textPosition, isDragging, dragHandlers }) => {
    // Memoize the text content processing
    const processedTextContent = useMemo(() => {
      if (!createDetail) return null;

      return createDetail.split("\n").map((line, index) => ({
        line,
        isTitle: index % 2 === 0,
        key: `preview-${index}-${line.slice(0, 10)}`,
      }));
    }, [createDetail]);

    // Memoize the text styles for performance
    const textShadowStyle = useMemo(
      () => ({
        textShadow:
          "1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)",
      }),
      []
    );

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-black">
            Preview and arrange here
          </h2>
          <div className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            i
          </div>
        </div>
        <div
          className="bg-white border-2 border-gray-200 rounded-lg p-4 w-full h-64 relative overflow-hidden cursor-move"
          style={{ aspectRatio: "16/9", maxWidth: "400px" }}
          {...dragHandlers}
        >
          {/* Background Image */}
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Banner preview"
              className="w-full h-full object-cover rounded absolute inset-0"
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Text Overlay */}
          {(selectedImage || createDetail) && (
            <div
              className="absolute cursor-move select-none max-w-xs"
              style={{
                left: textPosition.x,
                top: textPosition.y,
                transform: isDragging ? "scale(1.02)" : "scale(1)",
                transition: isDragging ? "none" : "transform 0.2s ease",
              }}
              onMouseDown={dragHandlers.onMouseDown}
            >
              {processedTextContent ? (
                <div className="text-sm leading-tight">
                  {processedTextContent.map(({ line, isTitle, key }) => (
                    <div
                      key={key}
                      className={`${
                        isTitle
                          ? "font-bold text-black text-shadow-sm"
                          : "text-gray-700 mb-2 text-shadow-sm"
                      }`}
                      style={textShadowStyle}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600" style={textShadowStyle}>
                  Add text content to preview
                </div>
              )}
            </div>
          )}

          {/* Centered message when no content */}
          {!selectedImage && !createDetail && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <p>Upload image and add text to preview</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PreviewSection.displayName = "PreviewSection";

const BannerItem = memo(({ banner, onEdit, onDelete, loading = false }) => {
  // Memoize the edit handler to prevent recreations
  const handleEdit = useCallback(() => {
    onEdit(banner);
  }, [banner, onEdit]);

  // Memoize the delete handler to prevent recreations
  const handleDelete = useCallback(() => {
    onDelete(banner.id);
  }, [banner.id, onDelete]);

  // Memoize the content to prevent recalculations
  const defaultContent = useMemo(() => DEFAULT_BANNER_CONTENT, []);

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="grid grid-cols-5 gap-6 items-start">
        {/* Column 1 - Details */}
        <div className="col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Posting #{banner.id}
          </h3>
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
            Detail
          </h4>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <TextContentDisplay content={defaultContent} />
          </div>
        </div>

        {/* Column 2 - Uploaded Image */}
        <div className="col-span-1 text-center">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
            Image
          </h4>
          <div className="w-32 h-24 bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mx-auto overflow-hidden hover:border-blue-400 transition-all duration-200 shadow-sm">
            {banner.image && banner.image !== "/api/placeholder/400/300" ? (
              <img
                src={banner.image}
                alt={`Banner ${banner.id}`}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="text-blue-400">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="drop-shadow-sm"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Column 3 - Priority */}
        <div className="col-span-1 text-center">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
            Priority
          </h4>
          <div className="w-16 h-10 border-2 border-gray-300 rounded-xl flex items-center justify-center text-sm font-bold bg-white shadow-sm hover:border-purple-400 transition-all duration-200">
            {banner.priority}
          </div>
        </div>

        {/* Column 4 - Preview */}
        <div className="col-span-1 text-center">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
            Preview
          </h4>
          <div className="w-32 h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mx-auto border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="h-full p-3 flex flex-col justify-center bg-gradient-to-t from-black/10 to-transparent">
              <div className="text-xs font-bold text-black mb-1 leading-tight">
                Welcome reward
              </div>
              <div className="text-xs text-gray-700 mb-2 leading-tight">
                Enjoy a welcome reward to spend in your first month.
              </div>
              <div className="text-xs font-bold text-black mb-1 leading-tight">
                Birthday reward
              </div>
              <div className="text-xs text-gray-700 mb-2 leading-tight">
                Celebrate your birthday with a special discount
              </div>
              <div className="text-xs font-bold text-black mb-1 leading-tight">
                Private members' sale
              </div>
              <div className="text-xs text-gray-700 leading-tight">
                Unlocked after your first order
              </div>
            </div>
          </div>
        </div>

        {/* Column 5 - Actions */}
        <div className="col-span-1 text-center flex flex-col items-center justify-center">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">
            Actions
          </h4>
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              disabled={loading}
              className={`p-2 rounded-xl transition transform shadow-sm ${
                loading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110'
              }`}
              title="Edit banner"
              type="button"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`p-2 rounded-xl transition transform shadow-sm ${
                loading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50 hover:scale-110'
              }`}
              title="Delete banner"
              type="button"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                >
                  <polyline points="3,6 5,6 21,6" />
                  <path d="m19,6v14a2,2 0 0 1-2,2H7a2,2 0 0 1-2-2V6m3,0V4a2,2 0 0 1 2-2h4a2,2 0 0 1 2,2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BannerItem.displayName = "BannerItem";
BannerItem.displayName = "BannerItem";

const ManageBannersOnRewards = () => {
  // Form state
  const [createDetail, setCreateDetail] = useState("");

  // Custom hooks
  const { selectedImage, handleImageUpload, resetImage, imageLoading } = useImageUpload();
  const { textPosition, isDragging, dragHandlers, resetPosition } =
    useDragAndDrop();
  const { modals, openModal, closeModal } = useModalState();

  // Edit state with lazy initialization
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editDetail, setEditDetail] = useState("");
  const [editImage, setEditImage] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Banners state - loaded from API
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  // Helper functions for API operations
  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  // Load banners from API
  const loadBanners = useCallback(async () => {
    try {
      setBannersLoading(true);
      setError(null);
      
      const response = await bannerService.getAllBanners({
        sortBy: 'priority',
        sortOrder: 'asc',
        isActive: true
      });
      
      if (response.success && response.data) {
        // Transform API data to match component structure
        const transformedBanners = response.data.map(banner => ({
          id: banner._id,
          bannerId: banner.bannerId,
          title: banner.title || '',
          detail: banner.detail || DEFAULT_BANNER_CONTENT,
          priority: banner.priority || 1,
          image: typeof banner.image === 'object' ? banner.image.url : banner.image,
          textPosition: banner.textPosition || { ...INITIAL_TEXT_POSITION },
          isActive: banner.isActive,
          isPublished: banner.isPublished,
          createdAt: banner.createdAt,
          updatedAt: banner.updatedAt
        }));
        
        setBanners(transformedBanners);
      } else {
        // If no banners exist, start with empty array
        setBanners([]);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      showError(error.message || 'Failed to load banners');
      // Set default banners as fallback
      setBanners([]);
    } finally {
      setBannersLoading(false);
    }
  }, [showError]);

  // Load banners on component mount
  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  /**
   * Optimized Banner management handlers with stable references
   */
  const bannerManagementHandlers = useMemo(
    () => ({
      handlePostToRewards: () => {
        if (!createDetail.trim()) {
          showError("Please fill in the detail field");
          return;
        }
        if (!selectedImage) {
          showError("Please select an image");
          return;
        }
        openModal("showConfirmationModal");
      },
      
      handleConfirmPost: async () => {
        try {
          setLoading(true);
          setError(null);
          closeModal("showConfirmationModal");

          // Validate banner data
          const bannerData = {
            title: createDetail.split('\n')[0] || 'New Banner',
            detail: createDetail,
            image: selectedImage,
            priority: banners.length + 1,
            textPosition: { ...textPosition },
            bannerType: 'reward',
            isActive: true,
            isPublished: false
          };

          const validation = bannerService.validateBannerData(bannerData);
          if (!validation.isValid) {
            showError(validation.errors.join(', '));
            return;
          }

          const response = await bannerService.createBanner(bannerData);
          
          if (response.success) {
            showSuccess("Banner created successfully!");
            setCreateDetail("");
            resetImage();
            resetPosition();
            
            // Reload banners to get the latest data
            await loadBanners();
            
            openModal("showPostSuccessModal");
          } else {
            showError(response.message || "Failed to create banner");
          }
        } catch (error) {
          console.error('Error creating banner:', error);
          showError(error.message || "Failed to create banner");
        } finally {
          setLoading(false);
        }
      },
      
      handleDeleteBanner: (bannerId) => {
        setBannerToDelete(bannerId);
        openModal("showDeleteConfirmationModal");
      },
      
      handleConfirmDelete: async () => {
        if (!bannerToDelete) return;
        
        try {
          setLoading(true);
          setError(null);
          
          const response = await bannerService.deleteBanner(bannerToDelete);
          
          if (response.success) {
            showSuccess("Banner deleted successfully!");
            
            // Remove banner from local state
            setBanners((prev) =>
              prev.filter((banner) => banner.id !== bannerToDelete)
            );
            
            closeModal("showDeleteConfirmationModal");
            setBannerToDelete(null);
            openModal("showDeleteSuccessModal");
          } else {
            showError(response.message || "Failed to delete banner");
          }
        } catch (error) {
          console.error('Error deleting banner:', error);
          showError(error.message || "Failed to delete banner");
        } finally {
          setLoading(false);
        }
      },
      
      handleEditBanner: (banner) => {
        setEditingBanner(banner);
        setEditDetail(banner.detail);
        setEditImage(banner.image);
        openModal("showEditModal");
      },
    }),
    [
      createDetail,
      banners.length,
      selectedImage,
      textPosition,
      bannerToDelete,
      resetImage,
      resetPosition,
      openModal,
      closeModal,
      showError,
      showSuccess,
      loadBanners,
    ]
  );

  const editHandlers = useMemo(
    () => ({
      handleSaveEdit: async (updatedBannerData) => {
        if (!editingBanner) return;
        
        try {
          setLoading(true);
          setError(null);
          
          const updateData = {
            title: editDetail.split('\n')[0] || editingBanner.title,
            detail: editDetail,
            image: editImage,
            textPosition: updatedBannerData?.textPosition || editingBanner.textPosition,
            priority: updatedBannerData?.priority || editingBanner.priority,
          };

          const validation = bannerService.validateBannerData(updateData);
          if (!validation.isValid) {
            showError(validation.errors.join(', '));
            return;
          }

          const response = await bannerService.updateBanner(editingBanner.id, updateData);
          
          if (response.success) {
            showSuccess("Banner updated successfully!");
            
            // Update banner in local state
            setBanners((prev) =>
              prev.map((banner) =>
                banner.id === editingBanner.id
                  ? {
                      ...banner,
                      title: updateData.title,
                      detail: editDetail,
                      image: editImage,
                      textPosition: updatedBannerData?.textPosition || banner.textPosition,
                      priority: updatedBannerData?.priority || banner.priority,
                      updatedAt: new Date().toISOString()
                    }
                  : banner
              )
            );
            
            editHandlers.handleCloseEdit();
            openModal("showSaveSuccessModal");
          } else {
            showError(response.message || "Failed to update banner");
          }
        } catch (error) {
          console.error('Error updating banner:', error);
          showError(error.message || "Failed to update banner");
        } finally {
          setLoading(false);
        }
      },
      
      handleCloseEdit: () => {
        closeModal("showEditModal");
        setEditingBanner(null);
        setEditDetail("");
        setEditImage(null);
      },
      
      handleEditImageUpload: async (event) => {
        try {
          const file = event.target.files[0];
          if (file) {
            setLoading(true);
            const imageUrl = await bannerService.uploadBannerImage(file);
            setEditImage(imageUrl);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          showError('Failed to upload image');
        } finally {
          setLoading(false);
        }
      },
    }),
    [editingBanner, editDetail, editImage, openModal, closeModal, showError, showSuccess]
  );

  /**
   * Optimized Modal handlers with stable references
   */
  const modalHandlers = useMemo(
    () => ({
      handleCancelPost: () => closeModal("showConfirmationModal"),
      handleCancelDelete: () => {
        closeModal("showDeleteConfirmationModal");
        setBannerToDelete(null);
      },
      handleCloseDeleteSuccessModal: () => closeModal("showDeleteSuccessModal"),
      handleViewScreenView: () => openModal("showScreenView"),
      handleCloseScreenView: () => closeModal("showScreenView"),
      handleCloseSaveSuccessModal: () => closeModal("showSaveSuccessModal"),
      handleClosePostSuccessModal: () => closeModal("showPostSuccessModal"),
    }),
    [closeModal, openModal]
  );

  // Memoize the detail change handler
  const handleDetailChange = useCallback((e) => {
    setCreateDetail(e.target.value);
  }, []);

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Loading Indicator */}
      {(loading || bannersLoading || imageLoading) && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Loading...</span>
        </div>
      )}
      
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Success Alert */}
      {success && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
          <button 
            onClick={() => setSuccess(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Title */}
      <div className="mb-16">
        <h1 className="text-5xl font-bold mb-2">manage banner on rewards</h1>
      </div>

      <div className="flex flex-col">
        <div className="flex gap-12">
          {/* Left Section - Create Banner */}
          <div className="flex-1 max-w-md">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
              <ImageUploadSection
                selectedImage={selectedImage}
                onImageUpload={handleImageUpload}
              />

              {/* Create Detail */}
              <div className="mb-8">
                <label className="block text-lg font-bold text-slate-800 mb-4">
                  Create detail
                </label>
                <textarea
                  value={createDetail}
                  onChange={handleDetailChange}
                  rows={8}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder={DEFAULT_BANNER_CONTENT}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={bannerManagementHandlers.handlePostToRewards}
                  disabled={loading || !createDetail.trim() || !selectedImage}
                  className={`px-8 py-4 rounded-2xl font-semibold shadow-md transition-all duration-200 ${
                    loading || !createDetail.trim() || !selectedImage
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  type="button"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    'Post to rewards'
                  )}
                </button>
                <button
                  onClick={modalHandlers.handleViewScreenView}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-md hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  View screen view
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Preview and Manage */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
              <PreviewSection
                selectedImage={selectedImage}
                createDetail={createDetail}
                textPosition={textPosition}
                isDragging={isDragging}
                dragHandlers={dragHandlers}
              />
            </div>
          </div>
        </div>
        {/* All Posting Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            All posting
          </h2>

          <div className="space-y-4">
            {bannersLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-lg">Loading banners...</span>
                </div>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8v6a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No banners found</h3>
                <p className="text-sm">Create your first banner using the form above.</p>
              </div>
            ) : (
              banners.map((banner) => (
                <div
                  key={`banner-${banner.id}-${banner.priority}`}
                  className="transform transition-all duration-200 hover:scale-[1.02]"
                >
                  <BannerItem
                    banner={banner}
                    onEdit={bannerManagementHandlers.handleEditBanner}
                    onDelete={bannerManagementHandlers.handleDeleteBanner}
                    loading={loading}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modals.showScreenView && (
        <ScreenViewModal
          banners={banners}
          onClose={modalHandlers.handleCloseScreenView}
        />
      )}

      {modals.showEditModal && (
        <EditBannerModal
          banner={editingBanner}
          detail={editDetail}
          image={editImage}
          onDetailChange={setEditDetail}
          onImageChange={editHandlers.handleEditImageUpload}
          onSave={editHandlers.handleSaveEdit}
          onClose={editHandlers.handleCloseEdit}
        />
      )}

      {modals.showSaveSuccessModal && (
        <SaveSuccessModal onClose={modalHandlers.handleCloseSaveSuccessModal} />
      )}

      {modals.showConfirmationModal && (
        <ConfirmationModal
          onConfirm={bannerManagementHandlers.handleConfirmPost}
          onCancel={modalHandlers.handleCancelPost}
        />
      )}

      {modals.showPostSuccessModal && (
        <PostSuccessModal onClose={modalHandlers.handleClosePostSuccessModal} />
      )}

      {modals.showDeleteConfirmationModal && (
        <DeleteConfirmationModal
          onConfirm={bannerManagementHandlers.handleConfirmDelete}
          onCancel={modalHandlers.handleCancelDelete}
        />
      )}

      {modals.showDeleteSuccessModal && (
        <DeleteSuccessModal
          onClose={modalHandlers.handleCloseDeleteSuccessModal}
        />
      )}
    </div>
  );
};

/**
 * Optimized Screen View Modal Component - Shows mobile app preview with banners
 * Matches the Figma design exactly with performance improvements
 */
const ScreenViewModal = memo(({ banners, onClose }) => {
  // Memoize sorted banners to prevent recalculations
  const sortedBanners = useMemo(() => {
    return banners.sort((a, b) => a.priority - b.priority);
  }, [banners]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-7xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Screen View Button */}
            <div className="bg-red-500 text-white px-12 py-3 rounded-full font-medium">
              screen view
            </div>

            {/* Go Back Button */}
            <button
              onClick={onClose}
              className="border border-gray-300 text-black px-12 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              type="button"
            >
              go back
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[800px]">
          {/* Mobile Preview - Centered */}
          <div className="flex-1 flex items-center justify-center bg-white p-8">
            <div className="w-96 h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
              {/* Phone Screen Content */}
              <div className="h-full flex flex-col">
                {/* Status Bar */}
                <div className="bg-black h-8 flex items-center justify-center">
                  <div className="w-16 h-1 bg-white rounded-full"></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                  {sortedBanners.map((banner, index) => (
                    <div
                      key={`screen-banner-${banner.id}`}
                      className="relative"
                    >
                      {/* First Banner - Black with 10% OFF */}
                      {index === 0 && (
                        <div className="bg-black text-white p-8 text-center min-h-[250px] flex flex-col justify-center">
                          <div className="text-xs mb-2">WANT</div>
                          <div className="text-5xl font-bold mb-2">10% OFF</div>
                          <div className="text-lg mb-4">
                            YOUR NEXT PURCHASE?
                          </div>
                          <div className="text-xs mb-1">
                            PLUS REWARD GIVEAWAY AND MORE!
                          </div>
                          <div className="text-xs mt-4">
                            What are you waiting for?
                          </div>
                          <div className="text-xs">
                            Become aRewards member today!
                          </div>
                        </div>
                      )}

                      {/* Second Banner - Yellow Concert Giveaway */}
                      {index === 1 && (
                        <div className="bg-yellow-300 text-black p-6 min-h-[200px] relative">
                          <div className="text-xs text-center mb-4">
                            Expires in 8 days
                          </div>
                          <div className="text-sm font-bold text-center mb-6">
                            YORAA Concert Giveaways
                          </div>

                          {/* Banner content area with text overlay */}
                          <div className="flex-1 flex items-center justify-center mb-4">
                            <div className="text-center">
                              {banner.detail
                                .split("\n")
                                .slice(0, 2)
                                .map((line, idx) => (
                                  <div
                                    key={`banner-line-${idx}`}
                                    className={
                                      idx === 0
                                        ? "text-lg font-bold mb-1"
                                        : "text-sm"
                                    }
                                  >
                                    {line}
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Members Exclusive Label */}
                          <div className="absolute bottom-4 left-4">
                            <div className="border border-black px-4 py-1 text-xs">
                              MEMBERS EXCLUSIVE
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional banners */}
                      {index > 1 && (
                        <div className="p-4 border-b border-gray-200">
                          {banner.image && (
                            <img
                              src={banner.image}
                              alt="Banner"
                              className="w-full h-32 object-cover rounded mb-2"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          <div className="text-sm">
                            {banner.detail.split("\n").map((line, idx) => (
                              <div
                                key={`additional-line-${idx}`}
                                className={
                                  idx % 2 === 0
                                    ? "font-medium text-black mb-1"
                                    : "text-xs text-gray-600 mb-2"
                                }
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ScreenViewModal.displayName = "ScreenViewModal";

/**
 * Edit Banner Modal Component - Modal for editing existing banners
 * Matches the Figma design exactly with drag and drop functionality
 */
const EditBannerModal = memo(
  ({
    banner,
    detail,
    image,
    onDetailChange,
    onImageChange,
    onSave,
    onClose,
  }) => {
    const detailText = detail || DEFAULT_BANNER_CONTENT;

    // Local state for drag and drop functionality with lazy initialization
    const [editTextPosition, setEditTextPosition] = useState(
      () => banner?.textPosition || INITIAL_TEXT_POSITION
    );
    const [isEditDragging, setIsEditDragging] = useState(false);
    const [editDragOffset, setEditDragOffset] = useState({ x: 0, y: 0 });
    const [editPriority, setEditPriority] = useState(
      () => banner?.priority || 1
    );
    const dragStateRef = useRef({ isDragging: false, offset: { x: 0, y: 0 } });

    // Memoized drag and drop handlers for edit modal
    const editDragHandlers = useMemo(() => {
      const handleEditMouseDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offset = {
          x: e.clientX - rect.left - editTextPosition.x,
          y: e.clientY - rect.top - editTextPosition.y,
        };

        dragStateRef.current = { isDragging: true, offset };
        setIsEditDragging(true);
        setEditDragOffset(offset);
      };

      const handleEditMouseMove = (e) => {
        if (!dragStateRef.current.isDragging) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragStateRef.current.offset.x;
        const newY = e.clientY - rect.top - dragStateRef.current.offset.y;

        const maxX = rect.width - DRAG_CONSTRAINTS.maxTextWidth;
        const maxY = rect.height - DRAG_CONSTRAINTS.maxTextHeight;

        setEditTextPosition(
          constrainPosition({ x: newX, y: newY }, maxX, maxY)
        );
      };

      const handleEditMouseUp = () => {
        dragStateRef.current.isDragging = false;
        setIsEditDragging(false);
      };

      return {
        onMouseDown: handleEditMouseDown,
        onMouseMove: handleEditMouseMove,
        onMouseUp: handleEditMouseUp,
        onMouseLeave: handleEditMouseUp,
      };
    }, [editTextPosition]);

    // Memoized save handler
    const handleSaveWithPosition = useCallback(() => {
      if (banner && onSave) {
        onSave({
          ...banner,
          textPosition: editTextPosition,
          priority: editPriority,
        });
      }
    }, [banner, editTextPosition, editPriority, onSave]);

    // Memoized priority change handler
    const handlePriorityChange = useCallback((e) => {
      setEditPriority(parseInt(e.target.value) || 1);
    }, []);

    // Memoized text content processing
    const processedTextContent = useMemo(() => {
      return detailText.split("\n").map((line, index) => ({
        line,
        isTitle: index % 2 === 0,
        key: `edit-${index}-${line.slice(0, 10)}`,
      }));
    }, [detailText]);

    // Memoized text shadow style
    const textShadowStyle = useMemo(
      () => ({
        textShadow:
          "1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)",
      }),
      []
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-7xl max-h-[90vh] overflow-y-auto relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-black text-center">
              Edit banner on rewards
            </h2>
          </div>

          {/* Main Content */}
          <div className="flex h-[600px]">
            {/* Left Side - Form */}
            <div className="w-1/3 p-6 space-y-6">
              {/* Posting Header */}
              <div>
                <h3 className="text-lg font-bold text-black mb-1">
                  posting {banner?.id || 1}
                </h3>
              </div>

              {/* Type Here Section */}
              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  Type here
                </label>
                <textarea
                  value={detailText}
                  onChange={(e) => onDetailChange(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
                  placeholder="Enter banner details..."
                />
              </div>

              {/* Priority Section */}
              <div>
                <label className="block text-lg font-bold text-black mb-3">
                  priority {editPriority}
                </label>
                <input
                  type="number"
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(parseInt(e.target.value) || 1)
                  }
                  className="w-20 h-10 px-3 border-2 border-black rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={handleSaveWithPosition}
                  className="bg-black text-white font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors"
                  aria-label="Save banner changes"
                >
                  save
                </button>

                <button
                  onClick={onClose}
                  className="bg-white text-black font-semibold text-base px-12 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Cancel editing"
                >
                  go back
                </button>
              </div>
            </div>

            {/* Middle Section - Image Upload */}
            <div className="w-1/3 p-6 flex flex-col justify-center">
              <div className="w-64 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center mx-auto mb-4">
                {image && image !== "/api/placeholder/400/300" ? (
                  <img
                    src={image}
                    alt="Banner preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-blue-500 text-center">
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mx-auto mb-2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </div>

              <label className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer inline-flex items-center justify-center font-medium hover:bg-blue-700 transition-colors mx-auto">
                <span>change image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Right Side - Preview and Arrange */}
            <div className="w-1/3 p-6">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-lg font-bold text-black">
                  Preview and arrange here
                </h3>
                <div className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  i
                </div>
              </div>

              {/* Phone Preview with Drag and Drop */}
              <div className="w-64 h-80 bg-gray-100 rounded-lg overflow-hidden relative mx-auto shadow-sm border">
                <div
                  className="w-full h-full relative cursor-move"
                  {...editDragHandlers}
                >
                  {/* Background image */}
                  <div className="absolute inset-0">
                    {image &&
                    image !== "/api/placeholder/400/300" &&
                    !image.includes("placeholder") ? (
                      <img
                        src={image}
                        alt="Banner background"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url('https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&h=2000&q=80')`,
                          backgroundPosition: "center center",
                        }}
                      />
                    )}
                  </div>

                  {/* Draggable Text Overlay */}
                  <div
                    className="absolute cursor-move select-none max-w-xs z-10"
                    style={{
                      left: editTextPosition.x,
                      top: editTextPosition.y,
                      transform: isEditDragging ? "scale(1.02)" : "scale(1)",
                      transition: isEditDragging
                        ? "none"
                        : "transform 0.2s ease",
                    }}
                    onMouseDown={editDragHandlers.onMouseDown}
                  >
                    <div className="text-sm leading-tight">
                      {processedTextContent.map(({ line, isTitle, key }) => (
                        <div
                          key={key}
                          className={`${
                            isTitle
                              ? "font-bold text-black mb-1"
                              : "text-gray-700 mb-2"
                          }`}
                          style={textShadowStyle}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EditBannerModal.displayName = "EditBannerModal";

/**
 * Confirmation Modal Component - Shows confirmation dialog for posting to rewards
 * Matches the Figma design exactly
 */
const ConfirmationModal = memo(({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8">
        {/* Confirmation Message */}
        <div className="text-center mb-8">
          <h2 className="font-['Montserrat'] text-xl font-bold text-black leading-tight">
            Are you sure you
            <br />
            want to post to
            <br />
            rewards
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onConfirm}
            className="bg-black text-white font-['Montserrat'] font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors"
            style={{ width: "120px", height: "48px" }}
          >
            yes
          </button>

          <button
            onClick={onCancel}
            className="bg-white text-black font-['Montserrat'] font-semibold text-base px-12 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
            style={{ width: "120px", height: "48px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmationModal.displayName = "ConfirmationModal";

/**
 * Post Success Modal Component - Shows "posting updated successfully!" with checkmark
 * Matches the Figma design exactly
 */
const PostSuccessModal = memo(({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="font-['Montserrat'] text-lg font-bold text-black leading-tight">
            posting updated
            <br />
            successfully!
          </h2>
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-black text-white font-['Montserrat'] font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors"
            style={{ width: "270px", height: "48px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

PostSuccessModal.displayName = "PostSuccessModal";

/**
 * Save Success Modal Component - Shows "posting updated successfully!" notification
 * Matches the Figma design exactly
 */
const SaveSuccessModal = memo(({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close popup"
        >
          <svg
            className="h-6 w-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Success Message */}
        <div className="text-center mb-8 mt-4">
          <h2 className="font-['Montserrat'] text-lg font-bold text-black tracking-[-0.41px] leading-[22px]">
            posting updated successfully!
          </h2>
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-black text-white font-['Montserrat'] font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close success popup"
            style={{ width: "270px", height: "48px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

SaveSuccessModal.displayName = "SaveSuccessModal";

/**
 * Delete Confirmation Modal Component - Shows confirmation dialog for deleting banners
 * Matches the Figma design exactly
 */
const DeleteConfirmationModal = memo(({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8">
        {/* Confirmation Message */}
        <div className="text-center mb-8">
          <h2 className="font-['Montserrat'] text-[18px] font-bold text-black leading-[22px] tracking-[-0.41px]">
            Are you sure you
            <br />
            want to delete this
            <br />
            post
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onConfirm}
            className="bg-black text-white font-['Montserrat'] font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors"
            style={{ width: "149px", height: "48px" }}
          >
            yes
          </button>

          <button
            onClick={onCancel}
            className="bg-white text-black font-['Montserrat'] font-medium text-base px-12 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
            style={{ width: "209px", height: "48px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmationModal.displayName = "DeleteConfirmationModal";

/**
 * Delete Success Modal Component - Shows "posting deleted successfully!" with checkmark
 * Matches the Figma design exactly
 */
const DeleteSuccessModal = memo(({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-[0px_4px_120px_2px_rgba(0,0,0,0.25)] w-full max-w-md relative p-8">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="font-['Montserrat'] text-[18px] font-bold text-black leading-[22px] tracking-[-0.41px]">
            posting deleted
            <br />
            successfully!
          </h2>
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-black text-white font-['Montserrat'] font-semibold text-base px-12 py-3 rounded-full hover:bg-gray-800 transition-colors"
            style={{ width: "270px", height: "48px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteSuccessModal.displayName = "DeleteSuccessModal";

export default ManageBannersOnRewards;
