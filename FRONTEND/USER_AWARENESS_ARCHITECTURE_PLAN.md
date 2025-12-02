# 🏗️ User Awareness Architecture - Structural Design Plan

**Status:** Design Phase - No Code Implementation Yet  
**Goal:** Add user awareness to Chat Widget for multi-microservice integration  
**Date:** Generated after architecture clarification

---

## 📋 **Executive Summary**

This plan outlines the structural changes required to make the Chat Widget user-aware, enabling it to:
- Receive user identity from host microservices
- Store user context in Redux
- Propagate user identity to all backend requests via headers
- Maintain backward compatibility and anonymous mode

---

## 🎯 **Core Requirements**

1. **User Context Structure:**
   ```typescript
   {
     userId: string,
     token: string,
     tenantId: string,        // MANDATORY - multi-tenant system
     name?: string,           // optional
     email?: string           // optional
   }
   ```

2. **Required Headers on All Backend Calls:**
   - `Authorization: Bearer {token}`
   - `X-User-Id: {userId}`
   - `X-Tenant-Id: {tenantId}`

3. **User Context Loading Priority:**
   1. `window.RAG_USER` (host-injected)
   2. Widget props (`userId`, `token`)
   3. LocalStorage
   4. `/auth/me` endpoint (optional fallback)

4. **Asynchronous Loading:** Widget may render before user context loads

5. **Anonymous Mode:** Must remain functional if no user context found

---

## 🔧 **Structural Changes Required**

### **Phase 1: Redux Auth State Enhancement**

#### **1.1 Update `src/store/slices/auth.slice.js`**

**Current State:**
- Stores: `user`, `token`, `isAuthenticated`, `isLoading`
- Actions: `setUser`, `setToken`, `logout`, `setLoading`
- Never actually used

**Required Changes:**
- Extend state to include:
  - `userId: string | null`
  - `token: string | null`
  - `tenantId: string | null`
  - `profile: { name?: string, email?: string } | null`
  - `isAuthenticated: boolean`
  - `isLoading: boolean`
  - `source: 'window' | 'props' | 'localStorage' | 'endpoint' | null` (track where context came from)

**New Actions Needed:**
- `setUserContext({ userId, token, tenantId, name?, email? })` - Set complete context
- `updateUserProfile({ name?, email? })` - Update optional profile fields
- `clearUserContext()` - Clear all context (replaces logout)
- Keep `setLoading` for async loading states

**Action Impact:**
- `setUserContext` will set `isAuthenticated = true`
- `clearUserContext` will set `isAuthenticated = false`
- All fields should be nullable to support anonymous mode

---

### **Phase 2: User Context Loading System**

#### **2.1 Create `src/utils/userContextLoader.js`**

**Purpose:** Centralized utility to load user context from all sources

**Structure:**
- Function: `loadUserContext(options)`
  - Parameters:
    - `props` - Widget props (userId, token, tenantId)
    - `windowObject` - Window object (for testing, default: window)
    - `localStorage` - Storage object (for testing, default: localStorage)
  
- Function: `normalizeUserContext(rawContext)`
  - Validates and normalizes context from any source
  - Ensures required fields: userId, token, tenantId
  - Returns normalized object or null if invalid

**Loading Logic (Priority Order):**
1. **Check `window.RAG_USER`:**
   - If exists and valid → return normalized context
   - Source: 'window'

2. **Check Props:**
   - If `userId` and `token` provided → construct context
   - If `tenantId` not in props → try to get from props or default to 'default'
   - Source: 'props'

3. **Check LocalStorage:**
   - Check `user_id`, `token`, `tenant_id`
   - If all present → construct context
   - Source: 'localStorage'

4. **Check `/auth/me` Endpoint (Optional):**
   - Only if none of above found
   - Make GET request to `/auth/me`
   - Parse response and normalize
   - Source: 'endpoint'

**Return Value:**
- Success: `{ context: {...}, source: 'window' | 'props' | 'localStorage' | 'endpoint' }`
- No context found: `{ context: null, source: null }`
- Error: Throw or return error state

**Anonymous Mode Handling:**
- If no context found → return `{ context: null, source: null }`
- Widget should continue operating (fallback to anonymous)

---

#### **2.2 Rewrite `src/hooks/useAuth.js`**

**Current State:**
- Has `login()` and `logout()` methods
- Never imported/used
- Implements authentication (should not)

**Required Changes:**
- Remove authentication logic
- Focus on loading and accessing user context

**New Hook API:**
```javascript
const {
  // Context data
  userId,
  token,
  tenantId,
  profile,
  isAuthenticated,
  isLoading,
  source,
  
  // Actions
  loadUserContext,      // Manually trigger context loading
  updateUserProfile,    // Update optional profile fields
  clearUserContext,     // Clear context (logout equivalent)
  refreshUserContext    // Reload context from sources
} = useAuth();
```

**Implementation:**
- Use `useSelector` to read from `auth.slice`
- Use `useDispatch` to dispatch actions
- Call `loadUserContext()` on mount (via useEffect)
- Expose helper methods to update context

**Initialization Logic:**
- On mount, call `userContextLoader.loadUserContext()`
- Dispatch `setUserContext` with loaded context
- Handle loading states

---

### **Phase 3: Widget Initialization Updates**

#### **3.1 Update `src/components/chat/FloatingChatWidget/FloatingChatWidget.jsx`**

**Current State:**
- Accepts `userId`, `token` props
- Reads from localStorage directly
- Doesn't use Redux auth state

**Required Changes:**

**Add useEffect Hook:**
- On mount, call `useAuth().loadUserContext(props)`
- Pass props to context loader
- User context loads asynchronously (non-blocking)

**Remove Direct LocalStorage Access:**
- Replace `localStorage.getItem('user_id')` with Redux selector
- Replace `localStorage.getItem('tenant_id')` with Redux selector

**Update User ID References:**
- Current: `const currentUserId = userId || localStorage.getItem('user_id') || 'anonymous'`
- New: `const currentUserId = useSelector((state) => state.auth.userId) || 'anonymous'`

**Update Tenant ID References:**
- Current: `const currentTenantId = localStorage.getItem('tenant_id') || 'default'`
- New: `const currentTenantId = useSelector((state) => state.auth.tenantId) || 'default'`

**Maintain Backward Compatibility:**
- Keep accepting `userId`, `token`, `tenantId` props
- Pass them to context loader as priority source

**Loading State:**
- Widget renders immediately
- When context loads, Redux updates trigger re-render
- No blocking, no loading spinners (unless desired)

---

### **Phase 4: Request Headers Propagation**

#### **4.1 Update `src/services/api.js`**

**Current State:**
- Axios instance with base configuration
- Request interceptor reads `token` from localStorage (line 18)
- Only adds Authorization header
- No user/tenant headers

**Required Changes:**

**Challenge:** Axios interceptors can't access React hooks/Redux store directly

**Solution:** Import store directly and use `store.getState()` to access Redux state

**Update Request Interceptor:**
- Import store: `import { store } from '../store/store.js'`
- Replace localStorage access with: `store.getState().auth`
- Get: `token`, `userId`, `tenantId` from Redux state
- Add all three headers

**Specific Code Changes:**
```javascript
import { store } from '../store/store.js';

api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const { token, userId, tenantId } = state.auth;
    
    // Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // User identity headers
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

**Remove:**
- Line 18: `localStorage.getItem('token')` - no longer needed

**Backward Compatibility:**
- Same export name (`api`) - no breaking changes
- All existing code continues working
- Headers added automatically to all requests

---

#### **4.2 Update `src/services/microserviceProxy.js`**

**Current State:**
- Uses `api` from `api.js`
- Sends userId/tenantId in request body metadata
- Reads from localStorage

**Required Changes:**

**Switch to Headers:**
- Remove userId/tenantId from request body metadata
- Rely on axios interceptors to add headers automatically
- Keep session_id and timestamp in body (if needed)

**Remove LocalStorage Access:**
- Don't read `user_id` or `tenant_id` from localStorage
- Headers will be added automatically by api.js interceptor

**Update Request Payload:**
- Current: Sends `metadata: { user_id, tenant_id }` in body
- New: Headers only, metadata can be removed or simplified

**Function Signatures:**
- No changes needed (headers added automatically)

---

#### **4.3 Update `src/store/api/ragApi.js`**

**Current State:**
- ✅ Already uses `prepareHeaders` with `getState()` access
- ✅ Already reads `getState().auth.token` (line 14)
- ⚠️ Only adds Authorization header
- ❌ Missing `X-User-Id` and `X-Tenant-Id` headers

**Required Changes:**

**Update existing `prepareHeaders` function:**
- Currently: Only sets Authorization header from token
- Change: Also read `userId` and `tenantId` from `getState().auth`
- Add: `X-User-Id` header
- Add: `X-Tenant-Id` header

**Specific Code Changes:**
```javascript
prepareHeaders: (headers, { getState }) => {
  const state = getState();
  const { token, userId, tenantId } = state.auth;
  
  // Existing: Authorization header
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  
  // New: User identity headers
  if (userId) {
    headers.set('X-User-Id', userId);
  }
  if (tenantId) {
    headers.set('X-Tenant-Id', tenantId);
  }
  
  return headers;
}
```

**All Endpoints Affected:**
- `submitQuery` mutation (automatically gets headers)
- `getRecommendationsQuery` (automatically gets headers)
- Any future queries/mutations (automatically get headers)

**Note:** RTK Query's `prepareHeaders` automatically applies to all endpoints - no per-endpoint changes needed!

---

### **Phase 5: Backward Compatibility & Anonymous Mode**

#### **5.1 Anonymous Mode Preservation**

**Current Behavior:**
- Widget works with `userId = 'anonymous'`
- Uses default tenant `'default'`
- No errors if no user context

**Required Preservation:**
- If no user context loaded → continue as anonymous
- `userId` remains `null` or becomes `'anonymous'` (decision needed)
- `tenantId` defaults to `'default'`
- Widget remains fully functional

**Implementation:**
- Context loader returns `null` if no sources available
- Widget checks: `const userId = auth.userId || 'anonymous'`
- Widget checks: `const tenantId = auth.tenantId || 'default'`
- Headers only added if values exist (or send 'anonymous'/'default')

**Decision Point:**
- Option A: Store `null` in Redux, use fallback in components
- Option B: Store `'anonymous'` and `'default'` directly in Redux
- **Recommended:** Option A (null in Redux, fallback in usage) - cleaner separation

---

#### **5.2 Props Backward Compatibility**

**Current Props:**
- `embedded`, `initialMode`, `userId`, `token`

**Required:**
- Keep all existing props
- Add optional `tenantId` prop
- Props serve as priority #2 source for context

**Migration Path:**
- Phase 1: Props still work (priority #2)
- Phase 2: Documentation recommends context loading
- Phase 3: Props deprecated (future)

**No Breaking Changes:**
- Existing implementations continue working
- New implementations can use context loading

---

## 📊 **File Modification Summary**

### **Files to Modify:**

1. ✅ `src/store/slices/auth.slice.js`
   - Extend state structure
   - Add new actions
   - Keep backward compatible actions

2. ✅ `src/hooks/useAuth.js`
   - Complete rewrite
   - Remove auth logic
   - Add context loading logic

3. ✅ `src/components/chat/FloatingChatWidget/FloatingChatWidget.jsx`
   - Add context loading on mount
   - Replace localStorage access with Redux
   - Maintain props compatibility

4. ✅ `src/services/api.js`
   - Update request interceptor
   - Add user/tenant headers
   - Consider factory pattern

5. ✅ `src/services/microserviceProxy.js`
   - Remove body metadata
   - Rely on headers (added by interceptor)
   - Remove localStorage access

6. ✅ `src/store/api/ragApi.js`
   - Update baseQuery
   - Add identity headers
   - Use prepareHeaders

### **Files to Create:**

7. 🆕 `src/utils/userContextLoader.js`
   - New utility file
   - Context loading logic
   - Priority-based fallback

### **Files to Review (No Changes Expected):**

8. ⚠️ `src/embed.jsx`
   - Already passes userId/token
   - May need to pass tenantId
   - Review for compatibility

9. ⚠️ `src/App.jsx`
   - Review for initialization
   - May need context loading

---

## 🔄 **Implementation Order (Recommended)**

### **Step 1: Foundation (Redux & Utilities)**
1. Create `userContextLoader.js` utility
2. Update `auth.slice.js` state structure
3. Rewrite `useAuth.js` hook

### **Step 2: Context Loading Integration**
4. Update `FloatingChatWidget.jsx` to load context
5. Test context loading from all sources

### **Step 3: Headers Propagation**
6. Update `api.js` request interceptor
7. Update `ragApi.js` baseQuery
8. Update `microserviceProxy.js` to use headers

### **Step 4: Testing & Validation**
9. Test with all context sources
10. Test anonymous mode
11. Test backward compatibility with props
12. Verify headers on all requests

---

## ⚠️ **Important Considerations**

### **1. Store Access in Interceptors**
- Axios interceptors can't use React hooks
- Need to access store directly (via closure or parameter)
- Consider creating api client factory that accepts store

### **2. RTK Query State Access**
- RTK Query `prepareHeaders` can access store via `getState`
- This is the standard pattern for RTK Query

### **3. Async Context Loading**
- Widget renders before context loads
- Redux updates trigger re-renders
- No blocking or delays required

### **4. Error Handling**
- Context loading failures should not break widget
- Fall back to anonymous mode gracefully
- Log errors for debugging

### **5. Testing Strategy**
- Test each context source priority
- Test anonymous mode
- Test header propagation
- Test backward compatibility

---

## ✅ **Success Criteria**

After implementation, the widget will:

1. ✅ Load user context from multiple sources (priority order)
2. ✅ Store context in Redux auth.slice
3. ✅ Send identity headers on ALL backend requests
4. ✅ Work in anonymous mode if no context
5. ✅ Maintain backward compatibility with props
6. ✅ Load context asynchronously (non-blocking)
7. ✅ Support multi-tenant via tenantId

---

## 📝 **Notes**

- **No backend changes required** (headers are standard)
- **No new dependencies required**
- **No breaking changes** (backward compatible)
- **No UI changes required** (internal only)

---

**Status:** ✅ Ready for implementation  
**Next Step:** Await approval to proceed with code implementation

