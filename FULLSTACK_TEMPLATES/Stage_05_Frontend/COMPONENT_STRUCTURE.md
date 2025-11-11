# Stage 05 - Frontend Component Structure

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice  
**Framework:** React 18 + Material-UI + Redux Toolkit

## Architecture

### Feature-Based + Atomic Structure
- **Atomic Components:** Reusable UI primitives (Button, Input, Modal, Toast, LoadingSpinner)
- **Feature Components:** Chat-specific components (ChatInterface, MessageList, MessageInput, etc.)
- **Layout Components:** Header, Sidebar, Footer, Layout
- **Pages:** ChatPage, DashboardPage, ProfilePage, LoginPage (if needed)

### State Management
- **Redux Toolkit:** Centralized state management
- **RTK Query:** API calls and caching
- **Slices:** auth, chat, user, ui
- **Supabase Realtime:** Real-time subscriptions with Redux sync

---

## Component Hierarchy

### Floating Chat Widget (Main Component)

```
FloatingChatWidget/
├── FloatingChatWidget.jsx         # Main container (floating + toggle)
│   ├── ChatInterface/             # Expanded chat interface
│   │   ├── ChatHeader.jsx         # Header with close button, theme toggle
│   │   ├── MessageList.jsx        # Scrollable message history
│   │   │   └── MessageBubble.jsx  # Individual message with formatting
│   │   ├── MessageInput.jsx       # Input field with send button
│   │   ├── TypingIndicator.jsx   # Typing animation
│   │   └── LoadingSpinner.jsx     # Circular spinner for answer generation
│   └── MinimizedButton.jsx        # Floating button when minimized
└── AnswerFormatter.jsx            # Answer reformatting utility
```

### Common Components (Atomic)

```
components/common/
├── Button/
│   ├── Button.jsx
│   └── Button.test.jsx
├── Input/
│   ├── Input.jsx
│   └── Input.test.jsx
├── Modal/
│   ├── Modal.jsx
│   └── Modal.test.jsx
├── Toast/
│   ├── Toast.jsx                 # Error notifications with retry
│   └── Toast.test.jsx
└── LoadingSpinner/
    ├── LoadingSpinner.jsx         # Circular spinner component
    └── LoadingSpinner.test.jsx
```

---

## Component Specifications

### 1. FloatingChatWidget (Main Container)
**File:** `src/components/chat/FloatingChatWidget/FloatingChatWidget.jsx`

**Props:**
```javascript
{
  apiUrl: string,              // RAG API base URL (from env)
  tenantId: string,            // Tenant identifier
  userId: string,              // User identifier
  userRole: string,            // 'learner' | 'trainer' | 'hr' | 'admin'
  position?: 'right' | 'left', // Widget position (default: 'right')
  theme?: 'light' | 'dark',    // Theme mode (default: 'light')
  onError?: (error) => void,   // Error callback
}
```

**State (Redux):**
- isOpen: boolean (from ui.slice)
- messages: Array<Message> (from chat.slice)
- isLoading: boolean (from chat.slice)
- isStreaming: boolean (from chat.slice)
- error: Error | null (from chat.slice)

**Responsibilities:**
- Floating widget positioning (right side)
- Toggle open/close behavior
- Minimized button display
- Expanded chat interface
- Theme management (light/dark)
- Redux state integration

---

### 2. MessageList
**File:** `src/components/chat/MessageList/MessageList.jsx`

**Props:**
```javascript
{
  messages: Array<Message>,
  isLoading: boolean,
}
```

**Message Type:**
```javascript
{
  id: string,
  type: 'user' | 'assistant' | 'system',
  content: string,
  timestamp: Date,
  sources?: Array<Source>,
  recommendations?: Array<Recommendation>,
  confidence?: number,
}
```

**Responsibilities:**
- Display message history
- Scroll to latest message
- Handle message rendering

---

### 3. MessageBubble
**File:** `src/components/chat/MessageBubble/MessageBubble.jsx`

**Props:**
```javascript
{
  message: Message,
  showSources?: boolean,
  showRecommendations?: boolean,
}
```

**Responsibilities:**
- Render individual message (user/assistant/system)
- **Answer Formatting:** Reformat answers into paragraphs (NOT monolithic blocks)
- **Paragraph Detection:** Split by double line breaks or sentence grouping
- **Styling:** Max width 65-75ch, line height 1.6-1.8, proper spacing
- **Inline Formatting:** Preserve bold/italic/links
- **Code Blocks:** Only when backend marks `isCode: true` or provides `blocks[]`
- **Metadata Support:** Use `blocks[]` or `paragraphs[]` from backend if provided
- **Client-side Fallback:** Perform paragraphization if metadata not available
- Display source citations (expandable)
- Show recommendations
- Format timestamps
- Handle click events

**Answer Formatting Logic:**
- Use `AnswerFormatter` utility for reformatting
- Check for `metadata.blocks[]` or `metadata.paragraphs[]`
- Fallback to client-side paragraphization
- Render as `<p>` elements with proper styling

---

### 4. MessageInput
**File:** `src/components/chat/MessageInput/MessageInput.jsx`

**Props:**
```javascript
{
  value: string,
  onChange: (value: string) => void,
  onSubmit: () => void,
  disabled: boolean,
  placeholder?: string,
}
```

**Responsibilities:**
- Text input handling
- Submit on Enter key
- Disable during loading
- Character limit (if needed)

---

### 5. LoadingSpinner (Circular)
**File:** `src/components/common/LoadingSpinner/LoadingSpinner.jsx`

**Props:**
```javascript
{
  size?: 'small' | 'medium' | 'large',
  message?: string,            // "Generating answer..."
  fullScreen?: boolean,        // For full-screen loading
}
```

**Responsibilities:**
- **Circular loading indicator** specifically for assistant answers
- Show during answer generation/streaming
- Positioned in message area (where answer will appear)
- Smooth animation
- Optional: Progress indicator if streaming
- Material-UI CircularProgress component

**Usage:**
- Displayed when `isLoading === true` for assistant response
- Replaces TypingIndicator during answer generation
- Shows in message bubble area (left-aligned)

---

### 6. Toast (Error Notifications)
**File:** `src/components/common/Toast/Toast.jsx`

**Props:**
```javascript
{
  error: Error,
  onRetry?: () => void,
  onDismiss?: () => void,
  autoHide?: boolean,          // Auto-dismiss after 5 seconds
  position?: 'top-right' | 'bottom-right',
}
```

**Responsibilities:**
- Display error messages as toast notifications
- **Retry functionality:** Button to retry failed requests
- Auto-dismiss after 5 seconds (configurable)
- Stack multiple toasts
- Material-UI Snackbar component
- Position: Top-right or bottom-right
- User-friendly error messages
- Accessibility: ARIA labels and announcements

**Error Types:**
- Network errors
- API errors
- Permission errors
- Validation errors

---

### 9. SourceCitations
**File:** `src/components/chat/SourceCitations/SourceCitations.jsx`

**Props:**
```javascript
{
  sources: Array<Source>,
  expanded?: boolean,
}
```

**Source Type:**
```javascript
{
  id: string,
  title: string,
  contentSnippet: string,
  sourceType: string,
  sourceUrl: string,
  relevanceScore: number,
}
```

**Responsibilities:**
- Display source citations
- Expandable/collapsible
- Link to source content
- Show relevance scores

---

### 10. RecommendationsList
**File:** `src/components/chat/RecommendationsList/RecommendationsList.jsx`

**Props:**
```javascript
{
  recommendations: Array<Recommendation>,
  onRecommendationClick: (recommendation: Recommendation) => void,
}
```

**Recommendation Type:**
```javascript
{
  type: 'course' | 'exercise' | 'assessment' | 'mentor',
  id: string,
  title: string,
  description: string,
  url: string,
  relevanceScore: number,
  reason: string,
}
```

**Responsibilities:**
- Display personalized recommendations
- Handle recommendation clicks
- Show recommendation reasons

---

## Custom Hooks

### 1. useChat
**File:** `src/hooks/useChat.js`

**Responsibilities:**
- Integrate with Redux chat slice
- Handle message sending via RTK Query
- Manage message history
- Coordinate API calls
- Handle streaming responses

**API:**
```javascript
const {
  messages,
  isLoading,
  isStreaming,
  error,
  sendMessage,
  clearMessages,
  retryLastMessage,
} = useChat();
```

**Redux Integration:**
- Uses `chat.slice` for state
- Uses RTK Query for API calls
- Syncs with Supabase realtime

---

### 2. useRealtime
**File:** `src/hooks/useRealtime.js`

**Responsibilities:**
- Supabase realtime subscriptions
- Sync with Redux store
- Handle connection status
- Update messages in real-time

**API:**
```javascript
useRealtime('chat-messages', 'INSERT', (payload) => {
  // Update Redux store
});
```

---

### 3. useAuth
**File:** `src/hooks/useAuth.js`

**Responsibilities:**
- Supabase authentication
- JWT token management
- Secure token storage and refresh
- User session management
- Redux auth slice integration

**API:**
```javascript
const {
  user,
  isAuthenticated,
  isLoading,
  login,
  logout,
  refreshToken,
} = useAuth();
```

---

## State Management (Redux Toolkit)

### Store Structure
```javascript
// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import chatReducer from './slices/chat.slice';
import userReducer from './slices/user.slice';
import uiReducer from './slices/ui.slice';
import { ragApi } from './api/ragApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    user: userReducer,
    ui: uiReducer,
    [ragApi.reducerPath]: ragApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ragApi.middleware),
});
```

### Slices

#### auth.slice.js
```javascript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
}
```

#### chat.slice.js
```javascript
{
  messages: Array<Message>,
  currentQuery: string,
  isLoading: boolean,
  isStreaming: boolean,
  error: Error | null,
  sources: Array<Source>,
  recommendations: Array<Recommendation>,
}
```

#### ui.slice.js
```javascript
{
  isWidgetOpen: boolean,
  theme: 'light' | 'dark',
  sidebarOpen: boolean,
  notifications: Array<Notification>,
}
```

#### user.slice.js
```javascript
{
  profile: UserProfile | null,
  preferences: UserPreferences,
  role: string,
}
```

---

## API Integration

### RTK Query API
**File:** `src/store/api/ragApi.js`

```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ragApi = createApi({
  reducerPath: 'ragApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    query: builder.mutation({
      query: (body) => ({
        url: '/query',
        method: 'POST',
        body,
      }),
    }),
    personalizedQuery: builder.mutation({
      query: (body) => ({
        url: '/personalized-query',
        method: 'POST',
        body,
      }),
    }),
    // ... other endpoints
  }),
});
```

### Axios Service (Alternative)
**File:** `src/services/api.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Supabase Client
**File:** `src/services/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

---

## Styling Approach (Material-UI)

### Material-UI Theme
**File:** `src/theme/theme.js`

```javascript
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0066cc', // Corporate primary
    },
    secondary: {
      main: '#...',
    },
    // ... corporate theme colors
  },
  typography: {
    // ... corporate typography
  },
  components: {
    // ... component overrides
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    // ... dark theme colors
  },
  // ... dark theme configuration
});
```

### Styling Options
- **MUI styled:** CSS-in-JS with MUI
- **Styled-components:** Alternative CSS-in-JS
- **MUI sx prop:** Inline styles with theme
- **CSS Modules:** Component-scoped CSS (if needed)

### Theme Provider
```javascript
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

<ThemeProvider theme={theme}>
  <CssBaseline />
  <App />
</ThemeProvider>
```

---

## Accessibility Considerations

### WCAG 2.1 Compliance
- **Keyboard Navigation:** All interactive elements keyboard accessible
- **Screen Readers:** ARIA labels and roles
- **Color Contrast:** WCAG AA minimum
- **Focus Management:** Visible focus indicators
- **Error Announcements:** Screen reader announcements for errors

### Implementation
```javascript
// ARIA labels
<button aria-label="Send message">
  Send
</button>

// Error announcements
<div role="alert" aria-live="polite">
  {error?.message}
</div>
```

---

## Responsive Design

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Responsive Features
- Collapsible message list on mobile
- Touch-friendly input field
- Responsive source citations
- Adaptive recommendations display

---

## Component Props Interface

### FloatingChatWidget Public API
```javascript
<FloatingChatWidget
  apiUrl={process.env.REACT_APP_API_URL}
  tenantId="tenant-123"
  userId="user-456"
  userRole="learner"
  position="right"              // 'right' | 'left'
  theme="light"                 // 'light' | 'dark'
  onError={(error) => console.error(error)}
/>
```

### Embedding Snippet
```html
<div id="rag-chat-widget"></div>
<script>
  window.RAGChatWidget.init({
    containerId: 'rag-chat-widget',
    apiUrl: process.env.REACT_APP_API_URL,
    tenantId: 'your-tenant-id',
    userId: 'user-id',
    userRole: 'learner',
    theme: 'light',
    position: 'right'
  });
</script>
<script src="https://cdn.educore.com/rag-widget/v1/bundle.js"></script>
```

---

## Summary

### Components
- **Main Components:** FloatingChatWidget, ChatInterface, ChatHeader, MessageList, MessageBubble, MessageInput, TypingIndicator, LoadingSpinner
- **Common Components:** Button, Input, Modal, Toast, LoadingSpinner
- **Custom Hooks:** useChat, useRealtime, useAuth
- **Services:** RTK Query API, Supabase client

### Features
- **Floating widget** on right side (toggle open/close)
- **Circular loading spinner** for assistant answers
- **Answer reformatting** into paragraphs (not monolithic blocks)
- **Code block support** when backend marks as code
- **Toast notifications** for errors with retry
- **Real-time updates** via Supabase
- **Material-UI** with Light/Dark themes
- **Mobile-first** responsive design
- **Accessibility** (WCAG 2.1 AA)

### Tech Stack
- **Framework:** React 18 + React DOM + React Router
- **State:** Redux Toolkit + RTK Query
- **Styling:** Material-UI + styled-components / MUI styled
- **Real-time:** Supabase realtime subscriptions
- **Authentication:** JWT from Supabase
- **Testing:** Jest + React Testing Library

### Performance Targets
- Initial bundle: < 500KB
- Initial load: < 2 seconds
- Response time: < 1 second
- Code splitting: Route-based and component-based

---

**Next:** UI Flow and TDD Planning

