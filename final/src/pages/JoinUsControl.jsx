import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import JoinUsService from '../services/joinUsService';

// Constants - Frozen for better performance
const SECTIONS = Object.freeze({
  HEAD: 'head',
  POSTING: 'posting',
  BOTTOM: 'bottom'
});

const DEFAULT_TEXT_POSITION = Object.freeze({ x: 20, y: 80 }); // Position text towards bottom like in Figma design
const PREVIEW_IMAGE_URL = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";

const DEFAULT_POST_CONTENT = Object.freeze([
  Object.freeze({
    title: 'Welcome reward',
    description: 'Enjoy a welcome reward to spend in your first month.'
  }),
  Object.freeze({
    title: 'Birthday reward',
    description: 'Celebrate your birthday month with a special discount'
  }),
  Object.freeze({
    title: 'Private members\' sale',
    description: 'Unlocked after your first order'
  })
]);

// Utility functions - Pure functions for better performance
const createImageUrl = (file) => {
  return file ? URL.createObjectURL(file) : null;
};

const revokeImageUrl = (url) => {
  if (url) URL.revokeObjectURL(url);
};

const constrainPosition = (position, maxX, maxY) => ({
  x: Math.max(0, Math.min(position.x, maxX)),
  y: Math.max(0, Math.min(position.y, maxY))
});

/**
 * Optimized PostItem Component - Enhanced for different sections with stable references
 */
const PostItem = memo(({ post, index, onEdit, onDelete, onPriorityUpdate, sectionType }) => {
  // Stable references to prevent re-renders
  const handlePriorityChange = useCallback((e) => {
    const newPriority = parseInt(e.target.value) || 1;
    onPriorityUpdate(post._id, newPriority);
  }, [post._id, onPriorityUpdate]);

  const handleEditClick = useCallback(() => {
    onEdit(post);
  }, [post, onEdit]);

  const handleDeleteClick = useCallback(() => {
    onDelete(post._id);
  }, [post._id, onDelete]);

  // Memoize the post content to prevent recalculations
  const postContent = useMemo(() => DEFAULT_POST_CONTENT, []);

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-black mb-4">
            {sectionType} {index + 1}
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Post Content Section - Optimized rendering */}
            <div className="lg:col-span-2 space-y-3">
              {postContent.map((item, idx) => (
                <div key={`${item.title}-${idx}`}>
                  <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                  <p className="text-gray-500 text-xs leading-tight">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Uploaded Image Section */}
            <div className="flex flex-col items-center">
              <h5 className="text-xs font-bold text-black mb-2">uploaded image</h5>
              <div className="w-24 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {post.image?.url ? (
                  <img 
                    src={post.image.url} 
                    alt={post.image.alt || "Uploaded"}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>

            {/* Priority Control Section */}
            <div className="flex flex-col items-center">
              <h5 className="text-xs font-bold text-black mb-2">priority</h5>
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-2">{post.priority}</div>
                <input
                  type="number"
                  value={post.priority}
                  onChange={handlePriorityChange}
                  className="w-12 px-1 py-1 border border-gray-300 rounded text-center focus:outline-none focus:border-blue-500 transition-colors text-xs"
                  min="1"
                  aria-label={`Priority for ${post.title}`}
                />
              </div>
            </div>

            {/* Preview Section - Optimized image loading */}
            <div className="flex flex-col items-center">
              <h5 className="text-xs font-bold text-black mb-2">Preview</h5>
              <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={post.image?.url || PREVIEW_IMAGE_URL}
                  alt={post.image?.url ? "Preview" : "Default preview"}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-2 text-center space-y-1">
                <div>
                  <h6 className="font-semibold text-[10px] text-black">{post.title}</h6>
                  <p className="text-gray-500 text-[9px] leading-tight">{post.detail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 ml-4">
          <button 
            onClick={handleEditClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
            aria-label={`Edit ${post.title}`}
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button 
            onClick={handleDeleteClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
            aria-label={`Delete ${post.title}`}
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
});

// Add display name and custom comparison for better debugging and performance
PostItem.displayName = 'PostItem';

// Custom comparison function for PostItem to prevent unnecessary re-renders  
const arePostItemPropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.priority === nextProps.post.priority &&
    prevProps.post.image === nextProps.post.image &&
    prevProps.index === nextProps.index &&
    prevProps.sectionType === nextProps.sectionType
  );
};

/**
 * Reusable Text Content Component
 */
const TextContent = memo(({ content = DEFAULT_POST_CONTENT, customText }) => {
  if (customText) {
    return (
      <div className="space-y-1">
        {customText.split('\n').map((line, index) => (
          <div 
            key={index} 
            className="font-semibold text-black"
            style={{
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)'
            }}
          >
            {line}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {content.map((item, index) => (
        <div key={index}>
          <h4 className="font-semibold text-black mb-1" style={{
            textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)'
          }}>
            {item.title}
          </h4>
          <p className="text-gray-700 leading-tight" style={{
            textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)'
          }}>
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
});

TextContent.displayName = 'TextContent';

/**
 * Reusable Image Upload Component
 */
const ImageUploadSection = memo(({ 
  title, 
  selectedImage, 
  onImageUpload, 
  onImageRemove, 
  uploadId,
  ariaLabel 
}) => (
  <div className="space-y-3">
    <div className="text-center">
      <h3 className="text-sm font-bold text-black mb-3">{title}</h3>
      
      <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center h-32 lg:h-48 flex flex-col items-center justify-center">
        {selectedImage ? (
          <div className="space-y-2">
            <img 
              src={selectedImage} 
              alt={`${title} preview`}
              className="max-w-full max-h-20 lg:max-h-32 object-contain mx-auto rounded-lg"
              loading="lazy"
            />
            <button
              onClick={onImageRemove}
              className="text-red-500 hover:text-red-700 transition-colors text-xs"
              type="button"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div className="space-y-2 lg:space-y-4">
            <div className="w-10 h-10 lg:w-16 lg:h-16 mx-auto border-2 border-gray-400 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 lg:w-8 lg:h-8 text-gray-400" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id={uploadId}
              aria-label={ariaLabel}
            />
            <label
              htmlFor={uploadId}
              className="bg-black text-white px-4 py-2 lg:px-6 lg:py-2 rounded-full cursor-pointer hover:bg-gray-800 inline-flex items-center gap-2 transition-colors text-xs lg:text-sm font-medium"
            >
              <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
              Upload
            </label>
          </div>
        )}
      </div>
    </div>
  </div>
));

ImageUploadSection.displayName = 'ImageUploadSection';

/**
 * Reusable Preview Section with Drag and Drop
 */
const PreviewSection = memo(({ 
  selectedImage, 
  textPosition, 
  customText,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave 
}) => (
  <div className="space-y-4">
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-black">Preview and arrange</h3>
        <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px]">i</span>
        </div>
      </div>
      
      <div 
        className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center overflow-hidden relative cursor-move"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Background Image */}
        <img 
          src={selectedImage || PREVIEW_IMAGE_URL}
          alt="Preview background" 
          className="w-full h-full object-cover rounded-lg absolute inset-0"
          loading="lazy"
        />

        {/* Draggable Text Overlay */}
        <div
          className="absolute cursor-move select-none max-w-xs z-10"
          style={{
            left: textPosition.x,
            top: textPosition.y,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
          onMouseDown={onMouseDown}
        >
          <div className="text-xs space-y-1">
            <TextContent customText={customText} />
          </div>
        </div>

        {/* Helper text when no content */}
        {!selectedImage && !customText && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            <p>Drag text to arrange position</p>
          </div>
        )}
      </div>
    </div>
  </div>
));

PreviewSection.displayName = 'PreviewSection';

/**
 * Optimized Form Section Component with stable references
 */
const FormSection = memo(({ 
  title,
  formState,
  onDetailChange,
  onImageUpload,
  onImageRemove,
  onCreatePost,
  onScreenViewOpen,
  textPosition,
  isDragging,
  dragHandlers,
  uploadId,
  buttonText,
  isLoading = false
}) => {
  // Memoize the button disabled state to prevent unnecessary re-renders
  const isButtonDisabled = useMemo(() => !formState.detail || isLoading, [formState.detail, isLoading]);
  
  return (
    <div className="mb-16">
      <h2 className="text-lg font-bold text-black mb-8 text-center">{title}</h2>
      
      {/* Mobile-friendly layout with image upload positioned at bottom-right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Detail Section - Full width on mobile */}
        <div className="space-y-4 lg:col-span-2 order-1 lg:order-none">
          <div>
            <h3 className="text-sm font-bold text-black mb-4">Create detail</h3>
            <textarea
              value={formState.detail}
              onChange={onDetailChange}
              rows={8}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none transition-colors text-sm"
              placeholder="Enter your Join Us content details here..."
              aria-label={`${title} post details`}
            />
          </div>
          
          {/* Mobile: Show image upload at bottom-right of detail section */}
          <div className="lg:hidden flex justify-end">
            <div className="w-48">
              <ImageUploadSection
                title="Add image"
                selectedImage={formState.selectedImage}
                onImageUpload={onImageUpload}
                onImageRemove={onImageRemove}
                uploadId={uploadId}
                ariaLabel={`Upload ${title.toLowerCase()} image file`}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Show image upload in separate column */}
        <div className="hidden lg:block order-2 lg:order-none">
          <ImageUploadSection
            title="Add image"
            selectedImage={formState.selectedImage}
            onImageUpload={onImageUpload}
            onImageRemove={onImageRemove}
            uploadId={uploadId}
            ariaLabel={`Upload ${title.toLowerCase()} image file`}
          />
        </div>

        <PreviewSection
          selectedImage={formState.selectedImage}
          textPosition={textPosition}
          customText={formState.detail}
          isDragging={isDragging}
          {...dragHandlers}
        />
      </div>

      {/* Action Buttons - Mobile optimized */}
      <div className="mt-6 lg:mt-8 flex flex-col lg:flex-row justify-center gap-3 lg:gap-4">
        <button
          onClick={onCreatePost}
          className="bg-black text-white px-8 lg:px-12 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm lg:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full lg:w-auto"
          disabled={isButtonDisabled}
          type="button"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {buttonText}
        </button>
        <button 
          onClick={onScreenViewOpen}
          className="bg-gray-600 text-white px-6 lg:px-8 py-3 rounded-full hover:bg-gray-700 transition-colors text-sm lg:text-base font-medium w-full lg:w-auto"
          type="button"
        >
          Screen View
        </button>
      </div>
    </div>
  );
});

FormSection.displayName = 'FormSection';

/**
 * Optimized Posts Section Component with stable handlers
 */
const PostsSection = memo(({ title, posts, onEdit, onDelete, onPriorityUpdate, sectionType }) => {
  // Memoize the empty state check
  const isEmpty = useMemo(() => posts.length === 0, [posts.length]);
  
  // Memoize the empty message based on title
  const emptyMessage = useMemo(() => {
    const isHeaderOrBottom = title === 'Head' || title === 'Bottom';
    return `No ${title.toLowerCase()} posts yet. ${isHeaderOrBottom ? 'Create one using the form above.' : ''}`;
  }, [title]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-black">{title}</h3>
      </div>

      {posts.map((post, index) => (
        <PostItem
          key={`${post._id}-${post.priority}`} // More stable key including priority
          post={post}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onPriorityUpdate={onPriorityUpdate}
          sectionType={sectionType}
        />
      ))}

      {isEmpty && (
        <div className="border-b border-gray-200 pb-6 mb-6">
          <p className="text-gray-500 text-sm text-center py-8">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
});

PostsSection.displayName = 'PostsSection';

/**
 * Custom Hooks for State Management
 */
/**
 * Optimized Custom Hooks for State Management
 */
const useFormState = (initialState = { detail: '', selectedImage: null }) => {
  const [state, setState] = useState(() => ({ ...initialState })); // Lazy initial state
  const currentImageRef = useRef(null); // Track current image for cleanup

  const updateDetail = useCallback((detail) => {
    setState(prev => ({ ...prev, detail }));
  }, []);

  const updateImage = useCallback((file) => {
    // Clean up previous image URL
    if (currentImageRef.current) {
      revokeImageUrl(currentImageRef.current);
    }
    
    const imageUrl = createImageUrl(file);
    currentImageRef.current = imageUrl;
    setState(prev => ({ ...prev, selectedImage: imageUrl }));
  }, []);

  const removeImage = useCallback(() => {
    if (currentImageRef.current) {
      revokeImageUrl(currentImageRef.current);
      currentImageRef.current = null;
    }
    setState(prev => ({ ...prev, selectedImage: null }));
  }, []);

  const resetForm = useCallback(() => {
    if (currentImageRef.current) {
      revokeImageUrl(currentImageRef.current);
      currentImageRef.current = null;
    }
    setState({ ...initialState });
  }, [initialState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentImageRef.current) {
        revokeImageUrl(currentImageRef.current);
      }
    };
  }, []);

  return {
    state,
    updateDetail,
    updateImage,
    removeImage,
    resetForm
  };
};

const useModalState = () => {
  const [modalStates, setModalStates] = useState(() => ({
    isEditModalOpen: false,
    isSuccessModalOpen: false,
    isDeleteSuccessModalOpen: false,
    isScreenViewOpen: false
  }));

  // Memoized modal handlers to prevent recreating functions
  const modalHandlers = useMemo(() => ({
    openModal: (modalName) => {
      setModalStates(prev => ({ ...prev, [modalName]: true }));
    },
    closeModal: (modalName) => {
      setModalStates(prev => ({ ...prev, [modalName]: false }));
    }
  }), []);

  return {
    modalStates,
    ...modalHandlers
  };
};

const useDragAndDrop = (initialPosition = DEFAULT_TEXT_POSITION) => {
  const [position, setPosition] = useState(() => ({ ...initialPosition })); // Lazy initial state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef({ isDragging: false, offset: { x: 0, y: 0 } });

  const handleMouseDown = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left - position.x,
      y: e.clientY - rect.top - position.y
    };
    
    dragStateRef.current = { isDragging: true, offset };
    setIsDragging(true);
    setDragOffset(offset);
  }, [position.x, position.y]);

  const handleMouseMove = useCallback((e) => {
    if (!dragStateRef.current.isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragStateRef.current.offset.x;
    const newY = e.clientY - rect.top - dragStateRef.current.offset.y;
    
    const maxX = rect.width - 200;
    const maxY = rect.height - 100;
    
    const constrainedPosition = constrainPosition({ x: newX, y: newY }, maxX, maxY);
    setPosition(constrainedPosition);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ ...initialPosition });
  }, [initialPosition]);

  // Memoize drag handlers to prevent re-renders
  const dragHandlers = useMemo(() => ({
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp
  }), [handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    position,
    isDragging,
    dragHandlers,
    resetPosition
  };
};
/**
 * JoinUsControl Component - Optimized for Performance
 */
const JoinUsControl = memo(() => {
  // Form states using optimized custom hooks
  const headerForm = useFormState();
  const bottomForm = useFormState();
  
  // Modal state management
  const { modalStates, openModal, closeModal } = useModalState();
  
  // Drag and drop for text positioning
  const headerDrag = useDragAndDrop();
  const bottomDrag = useDragAndDrop();

  // Edit form state with lazy initialization
  const [editState, setEditState] = useState(() => ({
    editingPost: null,
    editTitle: '',
    editDetail: '',
    editPriority: 1,
    editSection: SECTIONS.POSTING
  }));

  // Posts data with API integration
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Set loading state for specific actions
  const setActionLoadingState = useCallback((actionId, isLoading) => {
    setActionLoading(prev => ({ ...prev, [actionId]: isLoading }));
  }, []);

  // Clear error after some time
  const clearError = useCallback(() => {
    setTimeout(() => setError(null), 5000);
  }, []);

  // Show error with auto-clear
  const showError = useCallback((message) => {
    setError(message);
    clearError();
  }, [clearError]);

  // Load all posts from API
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await JoinUsService.getAllPosts({
        sortBy: 'priority',
        sortOrder: 'asc',
        limit: 100
      });

      if (response.success) {
        setPosts(response.data || []);
      } else {
        showError(response.message || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Load posts error:', error);
      showError('Failed to load posts from server');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /**
   * API-integrated Post creation handlers with stable references
   */
  const createPost = useCallback(async (formState, section, textPosition, resetForm, resetPosition) => {
    // Validate required fields before sending
    if (!formState.detail || !formState.detail.trim()) {
      showError('Detail is required');
      return;
    }

    const actionId = `create-${section}`;
    setActionLoadingState(actionId, true);

    try {
      // Ensure title is not empty and meets validation requirements
      const title = `${section.charAt(0).toUpperCase() + section.slice(1)} Post`;
      
      const postData = JoinUsService.formatPostData({
        title: title.trim(),
        detail: formState.detail.trim(),
        section,
        textPosition: { ...textPosition },
        image: formState.selectedImage ? { 
          url: formState.selectedImage,
          alt: `${title.trim()} image` 
        } : undefined,
        isActive: true,
        isPublished: false
      });

      // Log the data being sent for debugging
      console.log('Creating post with data:', postData);
      console.log('FormState detail:', formState.detail);
      console.log('Selected image:', formState.selectedImage);

      const response = await JoinUsService.createPost(postData);

      if (response.success) {
        // Reload posts to get the updated list
        await loadPosts();
        resetForm();
        resetPosition();
        // Post created successfully - could show a success message here
      } else {
        showError(response.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      showError('Failed to create post');
    } finally {
      setActionLoadingState(actionId, false);
    }
  }, [loadPosts, showError, setActionLoadingState]);

  // Memoized creation handlers to prevent unnecessary re-renders
  const postCreationHandlers = useMemo(() => ({
    handleCreateHeaderPost: async () => {
      await createPost(headerForm.state, SECTIONS.HEAD, headerDrag.position, headerForm.resetForm, headerDrag.resetPosition);
    },
    handleCreateBottomPost: async () => {
      await createPost(bottomForm.state, SECTIONS.BOTTOM, bottomDrag.position, bottomForm.resetForm, bottomDrag.resetPosition);
    }
  }), [
    createPost,
    headerForm.state, headerForm.resetForm,
    bottomForm.state, bottomForm.resetForm,
    headerDrag.position, headerDrag.resetPosition,
    bottomDrag.position, bottomDrag.resetPosition
  ]);

  /**
   * API-integrated Post management handlers with stable references
   */
  const postManagementHandlers = useMemo(() => ({
    handleDeletePost: async (id) => {
      const actionId = `delete-${id}`;
      setActionLoadingState(actionId, true);

      try {
        const response = await JoinUsService.deletePost(id);
        
        if (response.success) {
          // Reload posts to get the updated list
          await loadPosts();
          openModal('isDeleteSuccessModalOpen');
        } else {
          showError(response.message || 'Failed to delete post');
        }
      } catch (error) {
        console.error('Delete post error:', error);
        showError('Failed to delete post');
      } finally {
        setActionLoadingState(actionId, false);
      }
    },
    
    handlePriorityUpdate: async (id, newPriority) => {
      const actionId = `priority-${id}`;
      setActionLoadingState(actionId, true);

      try {
        const response = await JoinUsService.updatePost(id, { priority: newPriority });
        
        if (response.success) {
          // Update local state for immediate feedback
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post._id === id ? { ...post, priority: newPriority } : post
            )
          );
        } else {
          showError(response.message || 'Failed to update priority');
        }
      } catch (error) {
        console.error('Update priority error:', error);
        showError('Failed to update priority');
      } finally {
        setActionLoadingState(actionId, false);
      }
    },
    
    handleEditClick: (post) => {
      setEditState({
        editingPost: post,
        editTitle: post.title,
        editDetail: post.detail,
        editPriority: post.priority,
        editSection: post.section
      });
      openModal('isEditModalOpen');
    }
  }), [openModal, loadPosts, showError, setActionLoadingState]);

  /**
   * API-integrated Edit handlers with stable references
   */
  const editHandlers = useMemo(() => ({
    handleSaveEdit: async () => {
      const { editingPost, editTitle, editDetail, editPriority } = editState;
      
      if (!editingPost) return;

      const actionId = `edit-${editingPost._id}`;
      setActionLoadingState(actionId, true);

      try {
        const updateData = {
          title: editTitle,
          detail: editDetail,
          priority: editPriority
        };

        const response = await JoinUsService.updatePost(editingPost._id, updateData);
        
        if (response.success) {
          // Reload posts to get the updated list
          await loadPosts();
          closeModal('isEditModalOpen');
          openModal('isSuccessModalOpen');
          
          setEditState({
            editingPost: null,
            editTitle: '',
            editDetail: '',
            editPriority: 1,
            editSection: SECTIONS.POSTING
          });
        } else {
          showError(response.message || 'Failed to update post');
        }
      } catch (error) {
        console.error('Save edit error:', error);
        showError('Failed to save changes');
      } finally {
        setActionLoadingState(actionId, false);
      }
    },
    
    handleCancelEdit: () => {
      closeModal('isEditModalOpen');
      setEditState({
        editingPost: null,
        editTitle: '',
        editDetail: '',
        editPriority: 1,
        editSection: SECTIONS.POSTING
      });
    }
  }), [editState, closeModal, openModal, loadPosts, showError, setActionLoadingState]);

  /**
   * Optimized Form input handlers with stable references
   */
  const formInputHandlers = useMemo(() => ({
    handleHeaderDetailChange: (e) => headerForm.updateDetail(e.target.value),
    handleBottomDetailChange: (e) => bottomForm.updateDetail(e.target.value),
    handleHeaderImageUpload: (event) => {
      const file = event.target.files[0];
      if (file) headerForm.updateImage(file);
    },
    handleBottomImageUpload: (event) => {
      const file = event.target.files[0];
      if (file) bottomForm.updateImage(file);
    },
    handleEditTitleChange: (e) => {
      setEditState(prev => ({ ...prev, editTitle: e.target.value }));
    },
    handleEditDetailChange: (e) => {
      setEditState(prev => ({ ...prev, editDetail: e.target.value }));
    },
    handleEditPriorityChange: (e) => {
      setEditState(prev => ({ ...prev, editPriority: parseInt(e.target.value) || 1 }));
    }
  }), [headerForm.updateDetail, headerForm.updateImage, bottomForm.updateDetail, bottomForm.updateImage]);

  /**
   * Optimized Modal handlers with stable references
   */
  const modalHandlers = useMemo(() => ({
    handleScreenViewOpen: () => openModal('isScreenViewOpen'),
    handleSuccessModalClose: () => closeModal('isSuccessModalOpen'),
    handleDeleteSuccessModalClose: () => closeModal('isDeleteSuccessModalOpen'),
    handleScreenViewClose: () => closeModal('isScreenViewOpen')
  }), [openModal, closeModal]);

  /**
   * API-integrated Computed values with deep comparison prevention
   */
  const sectionPosts = useMemo(() => {
    if (!Array.isArray(posts)) return { head: [], posting: [], bottom: [] };
    
    const headPosts = posts.filter(post => post.section === SECTIONS.HEAD).sort((a, b) => a.priority - b.priority);
    const postingPosts = posts.filter(post => post.section === SECTIONS.POSTING).sort((a, b) => a.priority - b.priority);
    const bottomPosts = posts.filter(post => post.section === SECTIONS.BOTTOM).sort((a, b) => a.priority - b.priority);
    
    return {
      head: headPosts,
      posting: postingPosts,
      bottom: bottomPosts
    };
  }, [posts]);

  // Cleanup effect - optimized with dependency array
  useEffect(() => {
    return () => {
      // Cleanup handled by useFormState hook now
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="p-6">
        
        {/* Main Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-6">join us control screen</h1>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading posts...</span>
            </div>
          )}
        </div>

        {/* Add Header Details Section */}
        <FormSection
          title="Add header details"
          formState={headerForm.state}
          onDetailChange={formInputHandlers.handleHeaderDetailChange}
          onImageUpload={formInputHandlers.handleHeaderImageUpload}
          onImageRemove={headerForm.removeImage}
          onCreatePost={postCreationHandlers.handleCreateHeaderPost}
          onScreenViewOpen={modalHandlers.handleScreenViewOpen}
          textPosition={headerDrag.position}
          isDragging={headerDrag.isDragging}
          dragHandlers={headerDrag.dragHandlers}
          uploadId="header-image-upload"
          buttonText="Post to head"
          isLoading={actionLoading['create-head']}
        />

        {/* Add Bottom Details Section */}
        <FormSection
          title="Add bottom details"
          formState={bottomForm.state}
          onDetailChange={formInputHandlers.handleBottomDetailChange}
          onImageUpload={formInputHandlers.handleBottomImageUpload}
          onImageRemove={bottomForm.removeImage}
          onCreatePost={postCreationHandlers.handleCreateBottomPost}
          onScreenViewOpen={modalHandlers.handleScreenViewOpen}
          textPosition={bottomDrag.position}
          isDragging={bottomDrag.isDragging}
          dragHandlers={bottomDrag.dragHandlers}
          uploadId="bottom-image-upload"
          buttonText="Post to bottom"
          isLoading={actionLoading['create-bottom']}
        />

        {/* Posts Management Section with CRUD */}
        <div className="mt-12 space-y-12">
          <PostsSection
            title="Head"
            posts={sectionPosts.head}
            onEdit={postManagementHandlers.handleEditClick}
            onDelete={postManagementHandlers.handleDeletePost}
            onPriorityUpdate={postManagementHandlers.handlePriorityUpdate}
            sectionType="head posting"
          />

          <PostsSection
            title="All posting"
            posts={sectionPosts.posting}
            onEdit={postManagementHandlers.handleEditClick}
            onDelete={postManagementHandlers.handleDeletePost}
            onPriorityUpdate={postManagementHandlers.handlePriorityUpdate}
            sectionType="posting"
          />

          <PostsSection
            title="Bottom"
            posts={sectionPosts.bottom}
            onEdit={postManagementHandlers.handleEditClick}
            onDelete={postManagementHandlers.handleDeletePost}
            onPriorityUpdate={postManagementHandlers.handlePriorityUpdate}
            sectionType="bottom posting"
          />
        </div>
      </div>

      {/* Edit Modal */}
      {modalStates.isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                Edit <span className="font-bold">{editState.editSection} post</span>
              </h2>
              <button
                onClick={editHandlers.handleCancelEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                aria-label="Close edit modal"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-black mb-3">Edit Title</h3>
                    <input
                      type="text"
                      value={editState.editTitle}
                      onChange={formInputHandlers.handleEditTitleChange}
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Enter title..."
                      aria-label="Edit post title"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-black mb-3">Edit Detail</h3>
                    <textarea
                      value={editState.editDetail}
                      onChange={formInputHandlers.handleEditDetailChange}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:border-blue-500 resize-none transition-colors"
                      placeholder="Enter details..."
                      aria-label="Edit post details"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-black mb-3">Priority</h3>
                    <input
                      type="number"
                      value={editState.editPriority}
                      onChange={formInputHandlers.handleEditPriorityChange}
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:border-blue-500 text-center text-lg font-bold transition-colors"
                      min="1"
                      aria-label="Edit post priority"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-black mb-3">Preview</h3>
                    <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-left space-y-3">
                      <div>
                        <h4 className="font-medium text-base mb-1">{editState.editTitle || "Title Preview"}</h4>
                        <p className="text-gray-600 text-sm">{editState.editDetail || "Detail preview will appear here..."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={editHandlers.handleSaveEdit}
                  className="bg-black text-white px-16 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  type="button"
                  disabled={actionLoading[`edit-${editState.editingPost?._id}`]}
                >
                  {actionLoading[`edit-${editState.editingPost?._id}`] && <Loader2 className="w-4 h-4 animate-spin" />}
                  save
                </button>
                <button
                  onClick={editHandlers.handleCancelEdit}
                  className="border border-gray-300 text-black px-12 py-3 rounded-full hover:bg-gray-50 transition-colors font-medium"
                  type="button"
                >
                  go back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modalStates.isSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-80 mx-4">
            <div className="flex justify-end p-4">
              <button
                onClick={modalHandlers.handleSuccessModalClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                aria-label="Close success modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-8 pb-8 text-center">
              <h2 className="text-lg font-bold text-black mb-8 leading-tight">
                posting updated successfully!
              </h2>
              <button
                onClick={modalHandlers.handleSuccessModalClose}
                className="bg-black text-white px-16 py-3 rounded-full hover:bg-gray-800 transition-colors font-semibold"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {modalStates.isDeleteSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-80 mx-4">
            <div className="flex justify-end p-4">
              <button
                onClick={modalHandlers.handleDeleteSuccessModalClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                aria-label="Close delete success modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-8 pb-8 text-center">
              <h2 className="text-lg font-bold text-black mb-8 leading-tight">
                posting deleted successfully!
              </h2>
              <button
                onClick={modalHandlers.handleDeleteSuccessModalClose}
                className="bg-black text-white px-16 py-3 rounded-full hover:bg-gray-800 transition-colors font-semibold"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen View Modal - Enhanced to match Figma */}
      {modalStates.isScreenViewOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-hidden">
          {/* Fixed Header - Stagnant upper part */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-10">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-black">YORAA</h1>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={modalHandlers.handleScreenViewClose}
                  className="border border-gray-300 text-black px-8 py-3 rounded-full hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  go back
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Scrollable lower part */}
          <div className="flex pt-20 min-h-screen">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-black mb-6">Dashboard</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">App functional area</h3>
                    <div className="space-y-1 ml-2">
                      <p className="text-sm font-medium text-black">join us control screen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area - Moved to left */}
            <div className="flex-1 overflow-y-auto">
              <div className="pl-4 pr-8 py-8 bg-gray-50 min-h-full">
                <div className="max-w-5xl space-y-6">
                  
                  {/* Header Content - Moved to left alignment */}
                  <div className="bg-black text-white p-8 text-left relative rounded-lg max-w-4xl">
                    <div className="space-y-2">
                      <p className="text-sm tracking-wide">WANT</p>
                      <p className="text-5xl font-bold">10% OFF</p>
                      <p className="text-lg">YOUR NEXT PURCHASE?</p>
                      <p className="text-sm">PLUS REWARD GIVEAWAY AND MORE!</p>
                      <div className="mt-6">
                        <p className="text-sm">What are you waiting for?</p>
                        <p className="text-sm">Become a Rewards member today!</p>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content Cards - Optimized rendering */}
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={`promotional-card-${i + 1}`} className="bg-yellow-300 p-4 relative h-80 w-72 flex-shrink-0 rounded-lg">
                          <p className="text-xs text-center mb-2">Expires in 8 days</p>
                          <p className="text-sm font-bold text-center mb-4">YORAA Concert Giveaways</p>
                          <div className="absolute inset-3 flex items-center justify-center">
                            <img 
                              src={PREVIEW_IMAGE_URL}
                              alt={`Promotional content ${i + 1}`}
                              className="w-full h-full object-cover rounded"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="border border-black text-center py-1 bg-white bg-opacity-90 rounded">
                              <p className="text-xs font-medium">MEMBERS EXCLUSIVE</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Arrows - Left aligned */}
                  <div className="flex gap-4 mt-6">
                    <button className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

JoinUsControl.displayName = 'JoinUsControl';

export default JoinUsControl;
