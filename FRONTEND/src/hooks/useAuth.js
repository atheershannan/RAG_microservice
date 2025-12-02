/**
 * useAuth hook - User context management
 * 
 * Provides user context loading and management for widget user-awareness.
 * Does NOT implement authentication - only loads and manages context from host.
 */

import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setUserContext,
  updateUserProfile,
  clearUserContext,
  setLoading,
} from '../store/slices/auth.slice.js';
import { loadUserContext } from '../utils/userContextLoader.js';

/**
 * Hook for managing user context
 * @param {Object} options - Options for context loading
 * @param {Object} options.props - Widget props { userId?, token?, tenantId? }
 * @param {boolean} options.autoLoad - Automatically load context on mount (default: true)
 * @returns {Object} - Auth state and actions
 */
export const useAuth = (options = {}) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const {
    props = {},
    autoLoad = true,
  } = options;

  /**
   * Load user context from all available sources
   * @param {Object} overrideProps - Override props for this load
   */
  const loadUserContextAction = useCallback(async (overrideProps = {}) => {
    dispatch(setLoading(true));

    try {
      const loadProps = { ...props, ...overrideProps };
      const result = await loadUserContext({
        props: loadProps,
      });

      if (result.context) {
        // Context found - set in Redux
        dispatch(setUserContext({
          ...result.context,
          source: result.source,
        }));
      } else {
        // No context found - clear any existing context (anonymous mode)
        // Don't clear if we already have context (preserve existing)
        if (!auth.userId) {
          dispatch(clearUserContext());
        }
      }
    } catch (error) {
      console.error('Failed to load user context:', error);
      // On error, preserve existing context or clear if none exists
      if (!auth.userId) {
        dispatch(clearUserContext());
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, props, auth.userId]);

  /**
   * Update optional profile fields
   * @param {Object} profile - { name?, email? }
   */
  const updateUserProfileAction = useCallback((profile) => {
    dispatch(updateUserProfile(profile));
  }, [dispatch]);

  /**
   * Clear user context (anonymous mode)
   */
  const clearUserContextAction = useCallback(() => {
    dispatch(clearUserContext());
  }, [dispatch]);

  /**
   * Refresh user context from sources
   */
  const refreshUserContext = useCallback(() => {
    return loadUserContextAction();
  }, [loadUserContextAction]);

  // Auto-load context on mount if enabled
  useEffect(() => {
    if (autoLoad && !auth.userId && !auth.isLoading) {
      loadUserContextAction();
    }
  }, [autoLoad, auth.userId, auth.isLoading, loadUserContextAction]);

  return {
    // Context data
    userId: auth.userId,
    token: auth.token,
    tenantId: auth.tenantId,
    profile: auth.profile,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    source: auth.source,
    
    // Actions
    loadUserContext: loadUserContextAction,
    updateUserProfile: updateUserProfileAction,
    clearUserContext: clearUserContextAction,
    refreshUserContext,
    
    // Legacy fields (backward compatibility)
    user: auth.user,
  };
};










