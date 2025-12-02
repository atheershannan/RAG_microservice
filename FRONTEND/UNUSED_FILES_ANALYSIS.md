# Frontend Unused Files Analysis

**Date:** Generated automatically  
**Purpose:** Identify files that are not in use and safe to delete

---

## ✅ **CONFIRMED SAFE TO DELETE** (Not Used Anywhere)

### 1. **Component Files**

#### `src/components/chat/ChatInterface/ChatInterface.jsx`
- **Status:** ❌ **UNUSED - Safe to Delete**
- **Reason:** 
  - Just a stub/placeholder with "Coming Soon" message
  - Never imported anywhere in the codebase
  - Only mentioned in old planning documents
  - `FloatingChatWidget` is used instead
- **File Size:** Small (~24 lines)
- **Risk Level:** ⭐ **ZERO RISK**

---

### 2. **Hook Files**

#### `src/hooks/useAuth.js`
- **Status:** ❌ **UNUSED - Safe to Delete**
- **Reason:**
  - Hook is created but never imported or used anywhere
  - Only referenced in external documentation (RAG_WIDGET_INTEGRATION_GUIDE.md)
  - No components use this hook
- **Dependencies:** Uses `auth.slice.js` actions (but those are also unused)
- **Risk Level:** ⭐ **LOW RISK**

#### `src/hooks/useChat.js`
- **Status:** ❌ **UNUSED - Safe to Delete**
- **Reason:**
  - Hook is created but never imported or used
  - Only referenced in old PROJECT_STRUCTURE.md documentation
  - `FloatingChatWidget` handles chat logic directly
- **Dependencies:** Uses `chat.slice.js` and `ragApi.js` (but those are used elsewhere)
- **Risk Level:** ⭐ **LOW RISK**

#### `src/hooks/useRealtime.js`
- **Status:** ❌ **UNUSED - Safe to Delete**
- **Reason:**
  - Hook is created but never imported or used anywhere
  - No components subscribe to realtime updates
- **Dependencies:** Uses `supabase.js` service (which is also unused)
- **Risk Level:** ⭐ **LOW RISK**

---

### 3. **Utility Files**

#### `src/utils/constants.js`
- **Status:** ❌ **UNUSED - Safe to Delete**
- **Reason:**
  - File exists but never imported anywhere
  - Constants are likely hardcoded in components
  - Contains API_ENDPOINTS, MESSAGE_TYPES, THEME_MODES but none are used
- **Risk Level:** ⭐ **ZERO RISK**

---

### 4. **Theme Files**

#### `src/theme/darkTheme.js`
- **Status:** ⚠️ **UNUSED - Consider Removing**
- **Reason:**
  - Exported in `theme.js` but never actually used
  - Only `lightTheme` is used: `theme.js` has `...lightTheme`
  - Comment says "Can be switched to darkTheme" but no switching logic exists
- **Note:** Keep if you plan to implement dark mode later
- **Risk Level:** ⭐ **VERY LOW RISK** (but useful for future feature)

---

### 5. **Redux Store Files**

#### `src/store/slices/user.slice.js`
- **Status:** ⚠️ **REGISTERED BUT UNUSED - Consider Removing**
- **Reason:**
  - Registered in `store.js` reducer
  - Actions (`setProfile`, `setPreferences`) are never dispatched
  - No components use `useSelector((state) => state.user)`
  - State exists but is never read or written
- **Note:** Keep if you plan to add user profile management
- **Risk Level:** ⭐ **LOW RISK**

#### `src/store/slices/auth.slice.js`
- **Status:** ⚠️ **REGISTERED BUT BARELY USED - Review**
- **Reason:**
  - Registered in `store.js` reducer
  - Actions are only used in `useAuth.js` hook (which is unused)
  - No components directly use this slice
  - However, token is stored in localStorage directly in components
- **Note:** Might be needed for future authentication features
- **Risk Level:** ⭐⭐ **MODERATE RISK** (keep for future auth)

---

### 6. **Service Files**

#### `src/services/supabase.js`
- **Status:** ⚠️ **UNUSED - Consider Removing**
- **Reason:**
  - Only imported by `useRealtime.js` hook (which is unused)
  - No other components use Supabase client
  - Package `@supabase/supabase-js` is in dependencies but service is unused
- **Note:** Keep if you plan to add Supabase realtime features
- **Risk Level:** ⭐ **LOW RISK**

---

### 7. **Documentation Files (Temporary/Outdated)**

#### `FRONTEND/STRUCTURE_CHECK.md`
- **Status:** ❌ **OUTDATED - Safe to Delete**
- **Reason:**
  - Old checklist from when structure was being built
  - All items are now complete
  - No longer relevant

#### `FRONTEND/STRUCTURE_FIXED.md`
- **Status:** ❌ **OUTDATED - Safe to Delete**
- **Reason:**
  - Old documentation about fixing structure
  - All items completed
  - No longer relevant

---

## ⚠️ **REQUIRES VERIFICATION** (Check Before Deleting)

### 1. **Test Files**

#### `tests/unit/`, `tests/integration/`, `tests/e2e/` directories
- **Status:** ⚠️ **EMPTY - Check if needed**
- **Reason:**
  - All three test directories are empty (no test files)
  - `tests/setup.js` exists and is configured in `jest.config.cjs`
  - Test scripts exist in `package.json` but no actual tests
- **Recommendation:** 
  - If not planning to write tests soon, remove empty directories
  - Keep `tests/setup.js` if you plan to add tests later

---

## ✅ **KEEP - These Are Used**

### **Files That ARE Used and Should NOT Be Deleted:**

1. ✅ `src/services/api.js` - Used by `microserviceProxy.js` (which IS used)
2. ✅ `src/services/microserviceProxy.js` - Used by `FloatingChatWidget.jsx`
3. ✅ `src/theme/theme.js` - Used in `App.jsx` and `embed.jsx`
4. ✅ `src/theme/lightTheme.js` - Used in `theme.js`
5. ✅ `src/utils/answerFormatter.js` - Used by `ChatMessage.jsx`
6. ✅ `src/utils/modeDetector.js` - Used by `FloatingChatWidget.jsx`
7. ✅ `src/utils/recommendations.js` - Used by `FloatingChatWidget.jsx`
8. ✅ `src/embed.jsx` - Entry point for embedded widget (configured in vite.config.js)
9. ✅ `src/store/slices/chat.slice.js` - Used by `FloatingChatWidget.jsx`
10. ✅ `src/store/slices/chatMode.slice.js` - Used by `FloatingChatWidget.jsx`
11. ✅ `src/store/slices/ui.slice.js` - Used by `FloatingChatWidget.jsx`
12. ✅ `src/store/api/ragApi.js` - Used by `FloatingChatWidget.jsx`
13. ✅ All chatbot components (ChatPanel, ChatHeader, ChatMessage, etc.) - All used

---

## 📊 **Summary Statistics**

| Category | Count | Status |
|----------|-------|--------|
| **Confirmed Safe to Delete** | 8 files | ❌ Unused |
| **Consider Removing** | 4 files | ⚠️ Review |
| **Requires Verification** | 3 dirs | ⚠️ Check |
| **Keep (In Use)** | All others | ✅ Used |

---

## 🗑️ **Recommended Deletion List**

### **High Confidence (Safe to Delete Now):**

1. `src/components/chat/ChatInterface/ChatInterface.jsx`
2. `src/hooks/useAuth.js`
3. `src/hooks/useChat.js`
4. `src/hooks/useRealtime.js`
5. `src/utils/constants.js`
6. `FRONTEND/STRUCTURE_CHECK.md`
7. `FRONTEND/STRUCTURE_FIXED.md`

### **Medium Confidence (Review Before Deleting):**

8. `src/theme/darkTheme.js` - Keep if planning dark mode
9. `src/services/supabase.js` - Keep if planning Supabase features
10. `src/store/slices/user.slice.js` - Keep if planning user profiles

### **Low Confidence (Keep for Now):**

11. `src/store/slices/auth.slice.js` - Might be needed for future auth
12. Empty test directories - Keep structure for future tests

---

## 🔍 **How This Analysis Was Done**

1. ✅ Traced all imports from entry points (`main.jsx`, `App.jsx`, `embed.jsx`)
2. ✅ Searched for all import/export statements across codebase
3. ✅ Checked Redux store registrations vs actual usage
4. ✅ Verified hook usage in components
5. ✅ Checked service file dependencies
6. ✅ Analyzed theme configuration usage
7. ✅ Reviewed documentation files for relevance

---

## ⚠️ **Important Notes**

1. **Before deleting:** Make sure to search the entire repository (not just FRONTEND) for references
2. **Backup:** Consider creating a branch before bulk deletion
3. **Dependencies:** Some unused files might be referenced in:
   - Documentation files
   - CI/CD scripts
   - Build configurations
   - External integration guides

4. **Future Plans:** Some "unused" files might be planned for future features:
   - `darkTheme.js` - Dark mode toggle
   - `user.slice.js` - User profile management
   - `auth.slice.js` - Authentication system
   - `supabase.js` - Realtime features

---

## 📝 **Action Items**

1. ✅ Review this document
2. ⚠️ Decide on "medium confidence" files (keep or delete)
3. 🔍 Search entire repo for references to files before deleting
4. 🗑️ Delete "high confidence" files first
5. 🧪 Test application after deletions
6. 📚 Update documentation if needed

---

**Generated:** Automated analysis of FRONTEND codebase  
**Verification Level:** High - All imports/exports traced

