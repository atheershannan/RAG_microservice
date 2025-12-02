/**
 * User Context Loader Utility
 * 
 * Loads user context from multiple sources in priority order:
 * 1. window.RAG_USER (host-injected)
 * 2. Props (userId, token, tenantId)
 * 3. LocalStorage
 * 4. /auth/me endpoint (optional fallback)
 * 
 * Returns normalized user context with source tracking.
 */

/**
 * Normalize user context from any source
 * Ensures required fields: userId, token, tenantId
 * @param {Object} rawContext - Raw context from any source
 * @returns {Object|null} - Normalized context or null if invalid
 */
const normalizeUserContext = (rawContext) => {
  if (!rawContext || typeof rawContext !== 'object') {
    return null;
  }

  // Extract required fields
  const userId = rawContext.userId || rawContext.user_id || rawContext.id;
  const token = rawContext.token || rawContext.access_token || rawContext.authToken;
  const tenantId = rawContext.tenantId || rawContext.tenant_id || rawContext.tenant;

  // Validate required fields
  if (!userId || !token || !tenantId) {
    return null;
  }

  // Return normalized structure
  return {
    userId: String(userId),
    token: String(token),
    tenantId: String(tenantId),
    name: rawContext.name || rawContext.displayName || null,
    email: rawContext.email || rawContext.emailAddress || null,
  };
};

/**
 * Load user context from window.RAG_USER (priority 1)
 * @param {Object} windowObject - Window object (for testing)
 * @returns {Object|null} - Context with source or null
 */
const loadFromWindow = (windowObject = typeof window !== 'undefined' ? window : null) => {
  if (!windowObject || !windowObject.RAG_USER) {
    return null;
  }

  const normalized = normalizeUserContext(windowObject.RAG_USER);
  if (!normalized) {
    return null;
  }

  return {
    context: normalized,
    source: 'window',
  };
};

/**
 * Load user context from props (priority 2)
 * @param {Object} props - Widget props { userId?, token?, tenantId? }
 * @returns {Object|null} - Context with source or null
 */
const loadFromProps = (props = {}) => {
  if (!props.userId || !props.token) {
    return null;
  }

  const normalized = normalizeUserContext({
    userId: props.userId,
    token: props.token,
    tenantId: props.tenantId || props.tenant_id,
    name: props.name,
    email: props.email,
  });

  if (!normalized) {
    return null;
  }

  return {
    context: normalized,
    source: 'props',
  };
};

/**
 * Load user context from LocalStorage (priority 3)
 * @param {Object} storage - Storage object (for testing)
 * @returns {Object|null} - Context with source or null
 */
const loadFromLocalStorage = (storage = typeof localStorage !== 'undefined' ? localStorage : null) => {
  if (!storage) {
    return null;
  }

  const userId = storage.getItem('user_id') || storage.getItem('userId');
  const token = storage.getItem('token') || storage.getItem('authToken');
  const tenantId = storage.getItem('tenant_id') || storage.getItem('tenantId');

  if (!userId || !token) {
    return null;
  }

  const normalized = normalizeUserContext({
    userId,
    token,
    tenantId: tenantId || 'default', // Default tenant if not found
    name: storage.getItem('user_name') || storage.getItem('name'),
    email: storage.getItem('user_email') || storage.getItem('email'),
  });

  if (!normalized) {
    return null;
  }

  return {
    context: normalized,
    source: 'localStorage',
  };
};

/**
 * Load user context from /auth/me endpoint (priority 4)
 * @param {string} baseUrl - API base URL
 * @param {Function} fetchFn - Fetch function (for testing)
 * @returns {Promise<Object|null>} - Context with source or null
 */
const loadFromEndpoint = async (baseUrl = '', fetchFn = typeof fetch !== 'undefined' ? fetch : null) => {
  if (!fetchFn || !baseUrl) {
    return null;
  }

  try {
    const apiUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const response = await fetchFn(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session-based auth
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const normalized = normalizeUserContext(data);

    if (!normalized) {
      return null;
    }

    return {
      context: normalized,
      source: 'endpoint',
    };
  } catch (error) {
    console.warn('Failed to load user context from /auth/me endpoint:', error);
    return null;
  }
};

/**
 * Load user context from all available sources in priority order
 * @param {Object} options - Loading options
 * @param {Object} options.props - Widget props { userId?, token?, tenantId? }
 * @param {Object} options.windowObject - Window object (for testing)
 * @param {Object} options.storage - Storage object (for testing)
 * @param {string} options.apiBaseUrl - API base URL for /auth/me endpoint
 * @param {Function} options.fetchFn - Fetch function (for testing)
 * @returns {Promise<Object>} - { context: Object|null, source: string|null }
 */
export const loadUserContext = async (options = {}) => {
  const {
    props = {},
    windowObject = typeof window !== 'undefined' ? window : null,
    storage = typeof localStorage !== 'undefined' ? localStorage : null,
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '',
    fetchFn = typeof fetch !== 'undefined' ? fetch : null,
  } = options;

  // Priority 1: window.RAG_USER (host-injected)
  const windowResult = loadFromWindow(windowObject);
  if (windowResult) {
    return windowResult;
  }

  // Priority 2: Props
  const propsResult = loadFromProps(props);
  if (propsResult) {
    return propsResult;
  }

  // Priority 3: LocalStorage
  const storageResult = loadFromLocalStorage(storage);
  if (storageResult) {
    return storageResult;
  }

  // Priority 4: /auth/me endpoint (optional fallback)
  if (apiBaseUrl) {
    const endpointResult = await loadFromEndpoint(apiBaseUrl, fetchFn);
    if (endpointResult) {
      return endpointResult;
    }
  }

  // No context found - return null (anonymous mode)
  return {
    context: null,
    source: null,
  };
};

/**
 * Export normalize function for testing/external use
 */
export { normalizeUserContext };

