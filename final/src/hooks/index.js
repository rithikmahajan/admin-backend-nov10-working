import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Custom Hooks for Performance Optimization
 * 
 * Collection of reusable hooks that improve performance and provide
 * common functionality across components.
 */

// Export responsive hooks
export { default as useResponsive, useResponsiveGrid, useResponsiveSpacing, useResponsiveClasses } from './useResponsive';

/**
 * useDebounce Hook
 * 
 * Debounces a value to prevent excessive API calls or computations.
 * Useful for search inputs and real-time validation.
 * 
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} - Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useLocalStorage Hook
 * 
 * Provides localStorage functionality with automatic JSON serialization
 * and synchronization across tabs.
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[*, Function]} - [value, setValue] tuple
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * usePrevious Hook
 * 
 * Returns the previous value of a variable.
 * Useful for comparing current vs previous states.
 * 
 * @param {*} value - Current value
 * @returns {*} - Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

/**
 * useImagePreloader Hook
 * 
 * Preloads images for better user experience.
 * Returns loading state and preloaded image URLs.
 * 
 * @param {string[]} imageUrls - Array of image URLs to preload
 * @returns {Object} - { loading, loadedImages, error }
 */
export const useImagePreloader = (imageUrls) => {
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrls?.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const promises = imageUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    });

    Promise.allSettled(promises)
      .then((results) => {
        const successful = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);
        
        const failed = results
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason);

        setLoadedImages(successful);
        if (failed.length > 0) {
          setError(failed);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [imageUrls]);

  return { loading, loadedImages, error };
};

/**
 * useIntersectionObserver Hook
 * 
 * Provides intersection observer functionality for lazy loading
 * and infinite scrolling.
 * 
 * @param {Object} options - Intersection observer options
 * @returns {[Function, boolean]} - [setTarget, isIntersecting] tuple
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [target, options]);

  return [setTarget, isIntersecting];
};

/**
 * useOptimisticUpdate Hook
 * 
 * Provides optimistic updates for better perceived performance.
 * Updates UI immediately and handles rollback on failure.
 * 
 * @param {*} initialValue - Initial value
 * @returns {Object} - { value, optimisticUpdate, confirm, rollback }
 */
export const useOptimisticUpdate = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const [optimisticValue, setOptimisticValue] = useState(null);

  const optimisticUpdate = useCallback((newValue) => {
    setOptimisticValue(newValue);
  }, []);

  const confirm = useCallback(() => {
    if (optimisticValue !== null) {
      setValue(optimisticValue);
      setOptimisticValue(null);
    }
  }, [optimisticValue]);

  const rollback = useCallback(() => {
    setOptimisticValue(null);
  }, []);

  const currentValue = optimisticValue !== null ? optimisticValue : value;

  return {
    value: currentValue,
    optimisticUpdate,
    confirm,
    rollback
  };
};

/**
 * useFormValidation Hook
 * 
 * Provides form validation with real-time feedback.
 * Supports multiple validation rules and custom validators.
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules object
 * @returns {Object} - Form validation state and methods
 */
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouchedFields] = useState({});

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (rules.required && (!value || value.toString().trim() === '')) {
      return 'This field is required';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Invalid format';
    }

    if (rules.min && parseFloat(value) < rules.min) {
      return `Minimum value is ${rules.min}`;
    }

    if (rules.custom && typeof rules.custom === 'function') {
      return rules.custom(value, values);
    }

    return null;
  }, [validationRules, values]);

  const validate = useCallback(() => {
    const newErrors = {};
    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField, validationRules]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  const setTouched = useCallback((name) => {
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedFields({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           Object.keys(touched).length > 0;
  }, [errors, touched]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validate,
    reset
  };
};
