# Stage 05 - Frontend TDD Plan

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice  
**Framework:** React 18 + Material-UI + Redux Toolkit + RTK Query

## TDD Principles

- **Test-First Development:** Write tests before implementation
- **Coverage Target:** ≥80% code coverage
- **Test Types:** Unit tests, Component tests, Integration tests, E2E tests
- **Framework:** Jest + React Testing Library
- **Mocking:** Mock API calls (RTK Query), Supabase, Redux store

## Test Structure

```
tests/
├── unit/
│   ├── components/
│   │   ├── common/          # Atomic components
│   │   └── chat/            # Chat feature components
│   ├── hooks/
│   ├── utils/
│   └── store/               # Redux slices and API
├── integration/
│   ├── api/                 # RTK Query API tests
│   ├── widgets/             # Widget integration tests
│   └── supabase/            # Supabase realtime tests
└── e2e/
    └── floating-widget.spec.js
```

---

## Component Test Plans

### 1. FloatingChatWidget Component

#### Component Tests
**File:** `tests/unit/components/chat/FloatingChatWidget.test.jsx`

**Test Cases:**
- ✅ Renders minimized button on right side
- ✅ Toggles to expanded state on button click
- ✅ Closes widget on close button click
- ✅ Closes widget on Escape key
- ✅ Handles position prop (right/left)
- ✅ Handles theme prop (light/dark)
- ✅ Manages widget state (minimized/expanded)
- ✅ Smooth animations for open/close
- ✅ Mobile full-screen behavior (< 768px)
- ✅ Desktop side panel behavior (> 1024px)
- ✅ Integrates with Redux ui.slice

**Coverage Target:** 85%

**Mocks:**
- Redux store (useSelector, useDispatch)
- Material-UI components
- Animation library

---

### 2. ChatInterface Component

#### Component Tests
**File:** `tests/unit/components/chat/ChatInterface.test.jsx`

**Test Cases:**
- ✅ Renders with required props
- ✅ Displays ChatHeader with theme toggle
- ✅ Displays MessageList
- ✅ Displays MessageInput
- ✅ Shows TypingIndicator when appropriate
- ✅ Shows LoadingSpinner during answer generation
- ✅ Handles message sending via RTK Query
- ✅ Displays error toast on failure
- ✅ Manages loading states correctly
- ✅ Integrates with Redux chat.slice

**Coverage Target:** 85%

**Mocks:**
- Redux store
- RTK Query hooks
- Material-UI components

---

### 3. MessageList Component

#### Component Tests
**File:** `tests/unit/components/chat/MessageList.test.jsx`

**Test Cases:**
- ✅ Renders empty state when no messages
- ✅ Renders list of messages
- ✅ Auto-scrolls to latest message
- ✅ Handles scrolling edge cases
- ✅ Displays TypingIndicator when typing
- ✅ Displays LoadingSpinner during answer generation
- ✅ Handles message types (user, assistant, system)
- ✅ Renders MessageBubble for each message
- ✅ Virtual scrolling for long lists (if implemented)

**Coverage Target:** 80%

**Mocks:**
- Message data
- Scroll behavior
- Redux messages

---

### 4. MessageBubble Component

#### Component Tests
**File:** `tests/unit/components/chat/MessageBubble.test.jsx`

**Test Cases:**
- ✅ Renders user message correctly (right-aligned)
- ✅ Renders assistant message correctly (left-aligned, formatted)
- ✅ **Answer Formatting:** Reforms answers into paragraphs (NOT monolithic blocks)
- ✅ **Paragraph Detection:** Splits by double line breaks or sentence grouping
- ✅ **Styling:** Applies max-width (65-75ch), line-height (1.6-1.8)
- ✅ **Inline Formatting:** Preserves bold, italic, links
- ✅ **Code Blocks:** Renders code blocks when `isCode: true` or `blocks[]` contains code
- ✅ **Metadata Support:** Uses `blocks[]` or `paragraphs[]` from backend if provided
- ✅ **Client-side Fallback:** Performs paragraphization if metadata not available
- ✅ Displays timestamp
- ✅ Shows source citations (expandable)
- ✅ Shows recommendations
- ✅ Handles click events
- ✅ Displays confidence score (if available)

**Coverage Target:** 90%

**Mocks:**
- Message data with various formats
- AnswerFormatter utility
- Click handlers

---

### 4. MessageInput Component

#### Component Tests
**File:** `tests/unit/components/chat/MessageInput.test.jsx`

**Test Cases:**
- ✅ Renders input field
- ✅ Handles text input
- ✅ Submits on Enter key
- ✅ Creates new line on Shift+Enter
- ✅ Disables input during loading
- ✅ Shows placeholder text
- ✅ Handles character limit (if applicable)
- ✅ Calls onSubmit callback
- ✅ Handles validation errors

**Coverage Target:** 90%

**Mocks:**
- Event handlers
- Validation functions

---

### 5. LoadingSpinner Component (Circular)

#### Component Tests
**File:** `tests/unit/components/common/LoadingSpinner.test.jsx`

**Test Cases:**
- ✅ Renders Material-UI CircularProgress
- ✅ Displays in message bubble area (left-aligned)
- ✅ Shows during answer generation/streaming
- ✅ Replaces TypingIndicator when answer generation starts
- ✅ Handles different sizes (small, medium, large)
- ✅ Displays optional message ("Generating answer...")
- ✅ Handles streaming progress (if supported)
- ✅ Accessibility (ARIA labels, screen reader announcements)
- ✅ Smooth animation

**Coverage Target:** 85%

**Mocks:**
- Material-UI CircularProgress
- Redux loading state

---

### 6. TypingIndicator Component

#### Component Tests
**File:** `tests/unit/components/chat/TypingIndicator.test.jsx`

**Test Cases:**
- ✅ Renders animated dots
- ✅ Shows immediately after query submission
- ✅ Positioned below last message (left-aligned)
- ✅ Hidden when LoadingSpinner appears
- ✅ Accessibility (ARIA labels)

**Coverage Target:** 80%

---

### 7. Toast Component (Error Notifications)

#### Component Tests
**File:** `tests/unit/components/common/Toast.test.jsx`

**Test Cases:**
- ✅ Renders Material-UI Snackbar
- ✅ Displays error message
- ✅ Shows retry button (if applicable)
- ✅ Handles retry action
- ✅ Handles dismiss action
- ✅ Auto-dismisses after 5 seconds (configurable)
- ✅ Stacks multiple toasts
- ✅ Position: Top-right or bottom-right
- ✅ Accessibility (role="alert", ARIA labels)
- ✅ User-friendly error messages

**Coverage Target:** 85%

**Mocks:**
- Material-UI Snackbar
- Error objects
- Retry/dismiss handlers

---

### 8. AnswerFormatter Utility

#### Unit Tests
**File:** `tests/unit/utils/answerFormatter.test.js`

**Test Cases:**
- ✅ Formats answers into paragraphs (NOT monolithic blocks)
- ✅ Uses metadata.blocks[] if provided
- ✅ Uses metadata.paragraphs[] if provided
- ✅ Formats as code block if isCode: true
- ✅ Client-side paragraphization (fallback)
- ✅ Splits by double line breaks (\n\n)
- ✅ Groups sentences into paragraphs (max 3-4 sentences)
- ✅ Preserves inline formatting (bold, italic, links)
- ✅ Detects code blocks by markdown patterns
- ✅ Applies proper styling (max-width, line-height)
- ✅ Handles edge cases (empty content, single paragraph)

**Coverage Target:** 90%

**Test Fixtures:**
- Answers with metadata.blocks[]
- Answers with metadata.paragraphs[]
- Answers with isCode: true
- Plain text answers (fallback)
- Mixed content (text + code)

---

### 9. SourceCitations Component

#### Component Tests
**File:** `tests/unit/components/chat/SourceCitations.test.jsx`

**Test Cases:**
- ✅ Renders source list
- ✅ Displays source titles
- ✅ Shows content snippets
- ✅ Handles expand/collapse (Material-UI Accordion)
- ✅ Links to source URLs
- ✅ Displays relevance scores
- ✅ Handles empty sources
- ✅ Accessibility (expandable sections)

**Coverage Target:** 85%

**Mocks:**
- Source data
- Click handlers
- Material-UI Accordion

---

### 10. RecommendationsList Component

#### Component Tests
**File:** `tests/unit/components/chat/RecommendationsList.test.jsx`

**Test Cases:**
- ✅ Renders recommendations list
- ✅ Displays recommendation titles
- ✅ Shows recommendation descriptions
- ✅ Displays recommendation reasons
- ✅ Handles recommendation clicks
- ✅ Links to recommendation URLs
- ✅ Handles empty recommendations
- ✅ Groups by recommendation type (Material-UI Tabs/List)

**Coverage Target:** 85%

**Mocks:**
- Recommendation data
- Click handlers
- Material-UI components

---

## Custom Hooks Tests

### 1. useChat Hook

#### Hook Tests
**File:** `tests/unit/hooks/useChat.test.js`

**Test Cases:**
- ✅ Integrates with Redux chat.slice
- ✅ Sends message via RTK Query
- ✅ Adds user message to Redux store
- ✅ Adds assistant response to Redux store
- ✅ Handles loading state (isLoading)
- ✅ Handles streaming state (isStreaming)
- ✅ Handles error state
- ✅ Clears messages
- ✅ Retries failed queries
- ✅ Manages message history
- ✅ Syncs with Supabase realtime
- ✅ Handles API errors gracefully

**Coverage Target:** 90%

**Mocks:**
- Redux store
- RTK Query hooks
- Supabase client

---

### 2. useRealtime Hook

#### Hook Tests
**File:** `tests/unit/hooks/useRealtime.test.js`

**Test Cases:**
- ✅ Subscribes to Supabase channel
- ✅ Handles INSERT events
- ✅ Handles UPDATE events
- ✅ Syncs updates with Redux store
- ✅ Handles connection status
- ✅ Handles disconnection
- ✅ Auto-reconnects on disconnect
- ✅ Cleans up subscription on unmount

**Coverage Target:** 85%

**Mocks:**
- Supabase client
- Redux store
- React hooks (useEffect)

---

### 3. useAuth Hook

#### Hook Tests
**File:** `tests/unit/hooks/useAuth.test.js`

**Test Cases:**
- ✅ Integrates with Redux auth.slice
- ✅ Handles Supabase authentication
- ✅ Manages JWT token
- ✅ Secure token storage
- ✅ Handles token refresh
- ✅ Handles login
- ✅ Handles logout
- ✅ Manages user session
- ✅ Handles authentication errors

**Coverage Target:** 90%

**Mocks:**
- Supabase auth
- Redux store
- localStorage

---

## Redux Store Tests

### 1. Redux Slices Tests

#### auth.slice.test.js
**File:** `tests/unit/store/slices/auth.slice.test.js`

**Test Cases:**
- ✅ Login action updates state
- ✅ Logout action clears state
- ✅ Token refresh updates token
- ✅ Error handling

#### chat.slice.test.js
**File:** `tests/unit/store/slices/chat.slice.test.js`

**Test Cases:**
- ✅ Add message action
- ✅ Set loading state
- ✅ Set streaming state
- ✅ Set error state
- ✅ Clear messages action
- ✅ Update sources
- ✅ Update recommendations

#### ui.slice.test.js
**File:** `tests/unit/store/slices/ui.slice.test.js`

**Test Cases:**
- ✅ Toggle widget open/close
- ✅ Set theme (light/dark)
- ✅ Add notification
- ✅ Remove notification

---

## Integration Tests

### 1. RTK Query API Tests

#### API Tests
**File:** `tests/integration/api/ragApi.test.js`

**Test Cases:**
- ✅ Query mutation succeeds
- ✅ Personalized query mutation succeeds
- ✅ Error handling for API failures
- ✅ Timeout handling
- ✅ Retry logic
- ✅ Authentication headers (JWT)
- ✅ Multi-tenant support
- ✅ Caching behavior

**Coverage Target:** 80%

**Test Setup:**
- Mock RTK Query baseQuery
- Test Redux store
- Mock API responses

---

### 2. Widget Integration Tests

#### Widget Tests
**File:** `tests/integration/widgets/floating-widget.test.jsx`

**Test Cases:**
- ✅ Widget renders in embedded context
- ✅ Widget toggles minimized/expanded
- ✅ Widget handles full query flow
- ✅ Widget handles personalized query flow
- ✅ Widget shows LoadingSpinner during answer generation
- ✅ Widget formats answers into paragraphs
- ✅ Widget handles code blocks correctly
- ✅ Widget shows Toast on errors
- ✅ Widget handles retry from Toast
- ✅ Widget respects permissions
- ✅ Widget displays field-masked data
- ✅ Widget theme toggle works (light/dark)
- ✅ Widget responsive behavior (mobile/tablet/desktop)

**Coverage Target:** 75%

**Test Setup:**
- React component rendering with Redux Provider
- Material-UI ThemeProvider
- Mock RTK Query responses
- Test user interactions
- Mock Supabase client

---

### 3. Supabase Realtime Integration Tests

#### Realtime Tests
**File:** `tests/integration/supabase/realtime.test.js`

**Test Cases:**
- ✅ Subscribes to channel successfully
- ✅ Receives INSERT events
- ✅ Receives UPDATE events
- ✅ Updates Redux store on events
- ✅ Handles connection loss
- ✅ Auto-reconnects
- ✅ Cleans up subscriptions

**Coverage Target:** 70%

**Test Setup:**
- Mock Supabase client
- Test Redux store
- Mock WebSocket (if needed)

---

## E2E Tests

### 1. Floating Chat Widget E2E

#### E2E Tests
**File:** `tests/e2e/floating-widget.spec.js`

**Test Cases:**
- ✅ Widget appears as minimized button on page load
- ✅ User can click button to open widget
- ✅ Widget expands with smooth animation
- ✅ User can type and submit query
- ✅ TypingIndicator appears after submission
- ✅ LoadingSpinner appears during answer generation
- ✅ Answer is formatted into paragraphs (not monolithic block)
- ✅ Code blocks render correctly (if marked as code)
- ✅ Sources are displayed and clickable
- ✅ Recommendations are displayed and clickable
- ✅ Error Toast appears on error with retry button
- ✅ User can retry failed query from Toast
- ✅ User can close widget (minimizes to button)
- ✅ Theme toggle works (light/dark)
- ✅ Widget is accessible (keyboard navigation, WCAG 2.1 AA)
- ✅ Widget is responsive (mobile/tablet/desktop)
- ✅ Mobile: Widget expands to full screen
- ✅ Desktop: Widget expands as side panel

**Coverage Target:** 70%

**Tools:**
- Playwright or Cypress
- Test environment setup
- Material-UI component testing

---

## Test Utilities & Helpers

### Mock Data
**File:** `tests/fixtures/mock-data/`

- `messages.json` - Sample messages
- `responses.json` - API responses
- `recommendations.json` - Recommendations
- `sources.json` - Source citations
- `errors.json` - Error responses

### Test Helpers
**File:** `tests/utils/test-helpers.js`

```javascript
// renderWithProviders - Render component with context
// mockApiResponse - Mock API responses
// waitForElement - Wait for element to appear
// simulateUserInteraction - Simulate user actions
```

---

## Coverage Goals

### Overall Coverage
- **Target:** ≥80% code coverage
- **Components:** ≥85% coverage
- **Hooks:** ≥85% coverage
- **Utils:** ≥75% coverage

### Coverage by Component
- FloatingChatWidget: 85%
- ChatInterface: 85%
- MessageList: 80%
- MessageBubble: 90% (answer formatting critical)
- MessageInput: 90%
- LoadingSpinner: 85%
- TypingIndicator: 80%
- Toast: 85%
- AnswerFormatter: 90% (critical utility)
- SourceCitations: 85%
- RecommendationsList: 85%

### Coverage Tools
- **Jest Coverage:** Built-in coverage reporting
- **Coverage Gates:** CI/CD fails if coverage < 80%
- **Coverage Reports:** HTML reports generated

---

## Test Execution Strategy

### Local Development
```bash
# Unit tests
npm run test:unit

# Component tests
npm run test:components

# Integration tests
npm run test:integration

# All tests
npm run test

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
- Run unit tests
- Run component tests
- Run integration tests
- Generate coverage report
- Fail if coverage < 80%
- Run E2E tests (if configured)
```

---

## Mocking Strategy

### API Mocking
- **Unit Tests:** Mock RTK Query hooks with Jest
- **Integration Tests:** Mock RTK Query baseQuery
- **E2E Tests:** Real API (test environment) or MSW

### Redux Mocking
- **Store:** Mock Redux store with `@reduxjs/toolkit` test utilities
- **Slices:** Test slices in isolation
- **RTK Query:** Mock API endpoints

### Supabase Mocking
- **Unit Tests:** Mock Supabase client with Jest
- **Integration Tests:** Mock Supabase realtime subscriptions
- **E2E Tests:** Mock Supabase or use test instance

### Material-UI Mocking
- **Components:** Use Material-UI test utilities
- **Theme:** Mock ThemeProvider with test theme
- **Styled Components:** Mock styled components

### Component Mocking
- **React Components:** Mock with `jest.mock()`
- **Hooks:** Mock with `@testing-library/react-hooks`
- **Redux Hooks:** Mock with test Redux store

### External Dependencies
- **RTK Query:** Mock with `@reduxjs/toolkit/query/react` test utilities
- **Supabase:** Mock with `@supabase/supabase-js` test utilities
- **Material-UI:** Use Material-UI test utilities

---

## Accessibility Testing

### Automated Accessibility Tests
**File:** `tests/accessibility/a11y.test.jsx`

**Test Cases:**
- ✅ All interactive elements are keyboard accessible
- ✅ ARIA labels are present
- ✅ Color contrast meets WCAG AA
- ✅ Focus management works correctly
- ✅ Screen reader announcements work

**Tools:**
- `@testing-library/jest-dom` - Accessibility queries
- `jest-axe` - Accessibility testing
- `@axe-core/react` - Accessibility violations

---

## Performance Testing

### Component Performance
**File:** `tests/performance/component-performance.test.jsx`

**Test Cases:**
- ✅ Component renders within threshold
- ✅ Message list handles 100+ messages
- ✅ No memory leaks
- ✅ Efficient re-renders

**Tools:**
- React Profiler
- Performance monitoring

---

## Test Utilities & Helpers

### Redux Test Utilities
**File:** `tests/utils/redux-test-utils.js`

```javascript
// renderWithRedux - Render component with Redux Provider
// createMockStore - Create test Redux store
// mockRTKQuery - Mock RTK Query responses
```

### Material-UI Test Utilities
**File:** `tests/utils/mui-test-utils.js`

```javascript
// renderWithTheme - Render with Material-UI ThemeProvider
// mockMaterialUI - Mock Material-UI components
```

### Supabase Test Utilities
**File:** `tests/utils/supabase-test-utils.js`

```javascript
// mockSupabaseClient - Mock Supabase client
// mockRealtimeSubscription - Mock realtime subscriptions
```

---

## Coverage Goals

### Overall Coverage
- **Target:** ≥80% code coverage
- **Components:** ≥85% coverage
- **Hooks:** ≥85% coverage
- **Utils:** ≥90% coverage (AnswerFormatter critical)
- **Redux Slices:** ≥85% coverage

### Coverage by Component
- FloatingChatWidget: 85%
- ChatInterface: 85%
- MessageList: 80%
- MessageBubble: 90% (answer formatting critical)
- MessageInput: 90%
- LoadingSpinner: 85%
- TypingIndicator: 80%
- Toast: 85%
- AnswerFormatter: 90% (critical utility)
- SourceCitations: 85%
- RecommendationsList: 85%

### Coverage Tools
- **Jest Coverage:** Built-in coverage reporting
- **Coverage Gates:** CI/CD fails if coverage < 80%
- **Coverage Reports:** HTML reports generated

---

## Summary

- **Total Test Files:** ~20 test files
- **Unit Tests:** ~130 test cases
- **Integration Tests:** ~25 test cases
- **E2E Tests:** ~15 test cases
- **Coverage Target:** ≥80% overall
- **Test Framework:** Jest + React Testing Library
- **Redux Testing:** @reduxjs/toolkit test utilities
- **Material-UI Testing:** Material-UI test utilities
- **E2E Framework:** Playwright or Cypress

### Key Test Areas
- ✅ Floating widget toggle behavior
- ✅ Answer formatting (paragraphs, code blocks)
- ✅ Loading states (TypingIndicator + LoadingSpinner)
- ✅ Toast error notifications with retry
- ✅ Redux store integration
- ✅ RTK Query API calls
- ✅ Supabase realtime subscriptions
- ✅ Material-UI theme (light/dark)
- ✅ Responsive behavior
- ✅ Accessibility (WCAG 2.1 AA)

**Next Steps:**
- Set up test infrastructure (Jest, React Testing Library, Redux test utils)
- Write first test cases (AnswerFormatter utility)
- Implement components with TDD
- Set up CI/CD test pipeline

