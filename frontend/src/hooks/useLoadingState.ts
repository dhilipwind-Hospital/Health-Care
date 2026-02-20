/**
 * Loading State Hook
 * Provides standardized loading state management with error handling
 */

import { useState, useCallback } from 'react';
import { message } from 'antd';

interface LoadingState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseLoadingStateReturn extends LoadingState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
  execute: <T>(asyncFn: () => Promise<T>, options?: ExecuteOptions) => Promise<T | null>;
}

interface ExecuteOptions {
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const defaultOptions: ExecuteOptions = {
  showSuccessToast: false,
  showErrorToast: true,
};

/**
 * Hook for managing loading states with async operations
 */
export const useLoadingState = (initialLoading = false): UseLoadingStateReturn => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  const execute = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ExecuteOptions = {}
  ): Promise<T | null> => {
    const opts = { ...defaultOptions, ...options };
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const result = await asyncFn();
      
      setSuccess(true);
      
      if (opts.showSuccessToast && opts.successMessage) {
        message.success(opts.successMessage);
      }
      
      if (opts.onSuccess) {
        opts.onSuccess();
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || opts.errorMessage || 'An error occurred';
      setError(errorMsg);
      
      if (opts.showErrorToast) {
        message.error(errorMsg);
      }
      
      if (opts.onError) {
        opts.onError(err);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    success,
    setLoading,
    setError,
    setSuccess,
    reset,
    execute,
  };
};

/**
 * Hook for managing multiple loading states
 */
export const useMultipleLoadingStates = <T extends string>(keys: T[]) => {
  const [states, setStates] = useState<Record<T, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>)
  );

  const setLoading = useCallback((key: T, loading: boolean) => {
    setStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: T) => states[key], [states]);
  
  const isAnyLoading = useCallback(() => Object.values(states).some(Boolean), [states]);

  const resetAll = useCallback(() => {
    setStates(keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>));
  }, [keys]);

  return {
    states,
    setLoading,
    isLoading,
    isAnyLoading,
    resetAll,
  };
};

/**
 * Hook for page-level loading state
 */
export const usePageLoading = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const initializePage = useCallback(async (initFn: () => Promise<void>) => {
    try {
      setPageLoading(true);
      setPageError(null);
      await initFn();
    } catch (err: any) {
      setPageError(err?.message || 'Failed to load page');
    } finally {
      setPageLoading(false);
    }
  }, []);

  return {
    pageLoading,
    pageError,
    setPageLoading,
    setPageError,
    initializePage,
  };
};

export default useLoadingState;
