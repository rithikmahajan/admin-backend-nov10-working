import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendPushNotification,
  uploadNotificationImage,
  fetchNotificationHistory,
  scheduleNotification,
  updateCurrentNotification,
  resetCurrentNotification,
  addToStack,
  updateStackedNotification,
  removeFromStack,
  clearStack,
  setFilters,
  setPagination,
  clearError,
  clearSuccess,
  setImagePreview,
  removeImagePreview,
  selectPushNotification,
  selectCurrentNotification,
  selectStackedNotifications,
  selectSentNotifications,
  selectNotificationLoading,
  selectNotificationSending,
  selectNotificationUploading,
  selectNotificationError,
  selectUploadError,
  selectSuccessMessage,
} from '../store/slices/pushNotificationSlice';

/**
 * Custom hook for managing push notifications
 * Provides comprehensive push notification functionality with Redux integration
 */
export const usePushNotifications = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const pushNotificationState = useSelector(selectPushNotification);
  const currentNotification = useSelector(selectCurrentNotification);
  const stackedNotifications = useSelector(selectStackedNotifications);
  const sentNotifications = useSelector(selectSentNotifications);
  const isLoading = useSelector(selectNotificationLoading);
  const isSending = useSelector(selectNotificationSending);
  const isUploading = useSelector(selectNotificationUploading);
  const error = useSelector(selectNotificationError);
  const uploadError = useSelector(selectUploadError);
  const successMessage = useSelector(selectSuccessMessage);

  // Actions
  const updateNotification = useCallback((updates) => {
    dispatch(updateCurrentNotification(updates));
  }, [dispatch]);

  const resetNotification = useCallback(() => {
    dispatch(resetCurrentNotification());
  }, [dispatch]);

  const sendNotification = useCallback(async (notificationData) => {
    try {
      const result = await dispatch(sendPushNotification(notificationData)).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  const uploadImage = useCallback(async (imageFile) => {
    try {
      const imageUrl = await dispatch(uploadNotificationImage(imageFile)).unwrap();
      return { success: true, imageUrl };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  const fetchHistory = useCallback(async (params) => {
    try {
      const notifications = await dispatch(fetchNotificationHistory(params)).unwrap();
      return { success: true, data: notifications };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  const saveForLater = useCallback((notificationData) => {
    dispatch(addToStack(notificationData));
  }, [dispatch]);

  const updateStacked = useCallback((id, updates) => {
    dispatch(updateStackedNotification({ id, updates }));
  }, [dispatch]);

  const removeFromScheduled = useCallback((id) => {
    dispatch(removeFromStack(id));
  }, [dispatch]);

  const clearAllStacked = useCallback(() => {
    dispatch(clearStack());
  }, [dispatch]);

  const scheduleForLater = useCallback(async (notificationData, scheduleTime) => {
    try {
      const result = await dispatch(scheduleNotification({
        notificationData,
        scheduleTime,
      })).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  const updateFilters = useCallback((filters) => {
    dispatch(setFilters(filters));
  }, [dispatch]);

  const updatePagination = useCallback((pagination) => {
    dispatch(setPagination(pagination));
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearSuccessMessage = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  const setPreviewImage = useCallback((image) => {
    dispatch(setImagePreview(image));
  }, [dispatch]);

  const removePreviewImage = useCallback(() => {
    dispatch(removeImagePreview());
  }, [dispatch]);

  // Utility functions
  const validateNotification = useCallback((notification) => {
    const errors = {};
    
    if (!notification.title?.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!notification.body?.trim()) {
      errors.body = 'Message body is required';
    }
    
    if (notification.deepLink && !isValidUrl(notification.deepLink)) {
      errors.deepLink = 'Invalid deep link format';
    }
    
    if (!['android', 'ios', 'both'].includes(notification.targetPlatform)) {
      errors.targetPlatform = 'Invalid target platform';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  const isValidUrl = useCallback((string) => {
    try {
      // Allow app-specific deep links and web URLs
      return /^(https?:\/\/|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)/.test(string) ||
             /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(string);
    } catch {
      return false;
    }
  }, []);

  // Send notification with validation
  const sendNotificationWithValidation = useCallback(async (notificationData) => {
    const validation = validateNotification(notificationData);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
      };
    }
    
    return await sendNotification(notificationData);
  }, [sendNotification, validateNotification]);

  // Send stacked notification
  const sendStackedNotification = useCallback(async (stackedNotification) => {
    const result = await sendNotificationWithValidation(stackedNotification);
    
    if (result.success) {
      // Remove from stack after successful send
      removeFromScheduled(stackedNotification.id);
    }
    
    return result;
  }, [sendNotificationWithValidation, removeFromScheduled]);

  // Get notification statistics
  const getStatistics = useCallback(() => {
    const total = sentNotifications.length;
    const drafted = stackedNotifications.length;
    const today = new Date().toDateString();
    const sentToday = sentNotifications.filter(
      (n) => new Date(n.timestamp).toDateString() === today
    ).length;
    
    const platformStats = sentNotifications.reduce((acc, n) => {
      const platform = n.notification?.targetPlatform || 'unknown';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      drafted,
      sentToday,
      platformStats,
    };
  }, [sentNotifications, stackedNotifications]);

  return {
    // State
    pushNotificationState,
    currentNotification,
    stackedNotifications,
    sentNotifications,
    isLoading,
    isSending,
    isUploading,
    error,
    uploadError,
    successMessage,
    
    // Actions
    updateNotification,
    resetNotification,
    sendNotification,
    sendNotificationWithValidation,
    sendStackedNotification,
    uploadImage,
    fetchHistory,
    saveForLater,
    updateStacked,
    removeFromScheduled,
    clearAllStacked,
    scheduleForLater,
    updateFilters,
    updatePagination,
    clearErrors,
    clearSuccessMessage,
    setPreviewImage,
    removePreviewImage,
    
    // Utilities
    validateNotification,
    getStatistics,
    isValidUrl,
  };
};

export default usePushNotifications;
