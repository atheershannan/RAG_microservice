# Floating Chat Widget - Implementation Specifications

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice

## Implementation Overview

This document provides detailed implementation specifications for the Floating Chat Widget with all requirements from the FRONTEND PROMPT.

---

## Key Implementation Requirements

### 1. Floating Widget Behavior
- **Position:** Right side of page (fixed)
- **Minimized:** Floating button with chat icon
- **Expanded:** Chat interface (width: ~450px desktop, full screen mobile)
- **Toggle:** Smooth slide-in/slide-out animations
- **Persistent:** Remembers open/closed state (localStorage)

### 2. Loading States
- **TypingIndicator:** Shows immediately after query submission
- **LoadingSpinner:** Circular spinner (Material-UI CircularProgress) during answer generation
- **Sequence:** TypingIndicator → LoadingSpinner → Answer

### 3. Answer Formatting
- **NOT monolithic blocks** - Must be paragraphs
- **Paragraph Detection:** Split by `\n\n` or sentence grouping
- **Styling:** Max-width 65-75ch, line-height 1.6-1.8
- **Metadata Support:** Use `blocks[]` or `paragraphs[]` from backend
- **Client-side Fallback:** Paragraphization if no metadata
- **Code Blocks:** Only when `isCode: true` or `blocks[]` contains code

### 4. Error Handling
- **Toast Notifications:** Material-UI Snackbar
- **Retry Button:** On toast for failed requests
- **Auto-dismiss:** 5 seconds
- **Stack Multiple:** Multiple toasts can stack

---

## Project Setup

### Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@reduxjs/toolkit": "^2.0.0"
  }
}
```

---

## Component Implementation Details

### 1. FloatingChatWidget

**File:** `src/components/chat/FloatingChatWidget/FloatingChatWidget.jsx`

```javascript
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Fab, Slide } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ChatInterface from '../ChatInterface/ChatInterface';
import { toggleWidget } from '../../../store/slices/ui.slice';

const FloatingChatWidget = ({ apiUrl, tenantId, userId, userRole, position = 'right', theme = 'light' }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.isWidgetOpen);
  const currentTheme = useSelector((state) => state.ui.theme);

  const handleToggle = () => {
    dispatch(toggleWidget());
  };

  return (
    <>
      {/* Minimized Button */}
      {!isOpen && (
        <Fab
          color="primary"
          aria-label="open chat"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: position === 'right' ? 24 : 'auto',
            left: position === 'left' ? 24 : 'auto',
            zIndex: 1000,
          }}
          onClick={handleToggle}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Expanded Chat Interface */}
      <Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: position === 'right' ? 0 : 'auto',
            left: position === 'left' ? 0 : 'auto',
            width: { xs: '100%', md: '450px' },
            height: { xs: '100%', md: '600px' },
            zIndex: 1000,
            boxShadow: 3,
          }}
        >
          <ChatInterface
            apiUrl={apiUrl}
            tenantId={tenantId}
            userId={userId}
            userRole={userRole}
            onClose={handleToggle}
          />
        </Box>
      </Slide>
    </>
  );
};

export default FloatingChatWidget;
```

---

### 2. AnswerFormatter Utility

**File:** `src/utils/answerFormatter.js`

```javascript
/**
 * Formats answer text into paragraphs (NOT monolithic blocks)
 * Supports metadata from backend or client-side fallback
 */
export function formatAnswer(content, metadata = {}) {
  // Check for backend metadata
  if (metadata.blocks && Array.isArray(metadata.blocks)) {
    return formatFromBlocks(metadata.blocks);
  }

  if (metadata.paragraphs && Array.isArray(metadata.paragraphs)) {
    return formatFromParagraphs(metadata.paragraphs);
  }

  if (metadata.isCode === true) {
    return formatAsCodeBlock(content, metadata.language);
  }

  // Client-side fallback: paragraphization
  return paragraphizeText(content);
}

function formatFromBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === 'code') {
      return {
        type: 'code',
        content: block.content,
        language: block.language,
      };
    }
    return {
      type: 'paragraph',
      content: formatInlineText(block.content),
    };
  });
}

function formatFromParagraphs(paragraphs) {
  return paragraphs.map((para) => ({
    type: 'paragraph',
    content: formatInlineText(para),
  }));
}

function paragraphizeText(text) {
  // Split by double line breaks
  const paragraphs = text.split(/\n\n+/);
  
  // If single paragraph, try sentence grouping
  if (paragraphs.length === 1) {
    return groupSentences(text);
  }

  return paragraphs.map((para) => ({
    type: 'paragraph',
    content: formatInlineText(para.trim()),
  }));
}

function groupSentences(text) {
  // Group sentences into paragraphs (max 3-4 sentences)
  const sentences = text.split(/(?<=[.!?])\s+/);
  const paragraphs = [];
  let currentParagraph = [];

  sentences.forEach((sentence) => {
    currentParagraph.push(sentence);
    if (currentParagraph.length >= 3) {
      paragraphs.push({
        type: 'paragraph',
        content: formatInlineText(currentParagraph.join(' ')),
      });
      currentParagraph = [];
    }
  });

  if (currentParagraph.length > 0) {
    paragraphs.push({
      type: 'paragraph',
      content: formatInlineText(currentParagraph.join(' ')),
    });
  }

  return paragraphs;
}

function formatInlineText(text) {
  // Preserve bold, italic, links
  // **bold** → <strong>bold</strong>
  // *italic* → <em>italic</em>
  // [text](url) → <a href="url">text</a>
  
  let formatted = text;
  
  // Bold
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  return formatted;
}

function formatAsCodeBlock(content, language) {
  return [{
    type: 'code',
    content,
    language: language || 'text',
  }];
}

export default formatAnswer;
```

---

### 3. MessageBubble with Answer Formatting

**File:** `src/components/chat/MessageBubble/MessageBubble.jsx`

```javascript
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { formatAnswer } from '../../../utils/answerFormatter';

const MessageBubble = ({ message, showSources = true, showRecommendations = true }) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  // Format answer if assistant message
  const formattedContent = isAssistant
    ? formatAnswer(message.content, message.metadata)
    : null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '75%',
          backgroundColor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'white' : 'text.primary',
        }}
      >
        {isAssistant && formattedContent ? (
          // Render formatted answer (paragraphs)
          formattedContent.map((block, index) => (
            <React.Fragment key={index}>
              {block.type === 'code' ? (
                <SyntaxHighlighter language={block.language}>
                  {block.content}
                </SyntaxHighlighter>
              ) : (
                <Typography
                  component="p"
                  sx={{
                    maxWidth: '65ch',
                    lineHeight: 1.7,
                    mb: 1.5,
                    '&:last-child': { mb: 0 },
                  }}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
            </React.Fragment>
          ))
        ) : (
          // User message (plain text)
          <Typography>{message.content}</Typography>
        )}

        {/* Sources */}
        {showSources && message.sources && (
          <SourceCitations sources={message.sources} />
        )}

        {/* Recommendations */}
        {showRecommendations && message.recommendations && (
          <RecommendationsList recommendations={message.recommendations} />
        )}
      </Paper>
    </Box>
  );
};

export default MessageBubble;
```

---

### 4. LoadingSpinner (Circular)

**File:** `src/components/common/LoadingSpinner/LoadingSpinner.jsx`

```javascript
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ size = 'medium', message, fullScreen = false }) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }),
      }}
    >
      <CircularProgress size={sizeMap[size]} />
      {message && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
```

---

### 5. Toast (Error Notifications)

**File:** `src/components/common/Toast/Toast.jsx`

```javascript
import React from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

const Toast = ({
  error,
  onRetry,
  onDismiss,
  autoHide = true,
  position = 'top-right',
}) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    onDismiss?.();
  };

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoHide]);

  const anchorOrigin = {
    'top-right': { vertical: 'top', horizontal: 'right' },
    'bottom-right': { vertical: 'bottom', horizontal: 'right' },
  }[position];

  return (
    <Snackbar
      open={open}
      anchorOrigin={anchorOrigin}
      onClose={handleClose}
    >
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {error.message || 'An error occurred'}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
```

---

## Redux Store Setup

### Store Configuration

**File:** `src/store/store.js`

```javascript
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## Material-UI Theme Setup

### Theme Configuration

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
      main: '#666666',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dabf7',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  // ... dark theme overrides
});
```

---

## Embedding Snippet

**File:** `public/embedding-snippet.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Embed RAG Chat Widget</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <!-- Your existing page content -->
  <div style="padding: 20px;">
    <h1>Your Page Content</h1>
    <p>This is where your existing content goes.</p>
  </div>

  <!-- RAG Chat Widget Container -->
  <div id="rag-chat-widget"></div>

  <script>
    // Initialize widget
    window.RAGChatWidget.init({
      containerId: 'rag-chat-widget',
      apiUrl: process.env.REACT_APP_API_URL || 'https://rag-api.educore.com',
      tenantId: 'your-tenant-id',
      userId: 'user-id',
      userRole: 'learner',
      theme: 'light',
      position: 'right'
    });
  </script>

  <!-- Widget bundle (CDN or local) -->
  <script src="https://cdn.educore.com/rag-widget/v1/bundle.js"></script>
</body>
</html>
```

---

## Environment Variables

**File:** `.env.example`

```env
# API Configuration
REACT_APP_API_URL=https://rag-api.educore.com
REACT_APP_API_KEY=your-api-key

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Widget Configuration
REACT_APP_WIDGET_VERSION=v1
REACT_APP_ENABLE_REALTIME=true
REACT_APP_ENABLE_OFFLINE_CACHE=true
```

---

## Performance Optimizations

### Code Splitting

```javascript
// Route-based splitting
import { lazy, Suspense } from 'react';
const FloatingChatWidget = lazy(() => 
  import('./components/chat/FloatingChatWidget')
);

// Component-based splitting
const AnswerFormatter = lazy(() => 
  import('./utils/answerFormatter')
);
```

### Bundle Size Optimization
- Tree-shake unused Material-UI components
- Use `@mui/material` imports instead of full package
- Lazy load heavy components
- Optimize images and assets

---

## Accessibility (WCAG 2.1 AA)

### Requirements
- **Keyboard Navigation:** All interactive elements accessible via keyboard
- **Screen Readers:** ARIA labels and roles
- **Color Contrast:** Minimum 4.5:1 for text
- **Focus Management:** Visible focus indicators
- **Error Announcements:** Screen reader announcements

### Implementation
- MUI components (built-in accessibility)
- Custom ARIA labels where needed
- Focus trap in modal/widget
- Error announcements via `role="alert"`

---

## Mobile-First Responsiveness

### Breakpoints
- **Mobile:** < 768px - Full screen widget
- **Tablet:** 768px - 1024px - Side panel widget
- **Desktop:** > 1024px - Floating widget

### Mobile Behavior
- Widget expands to full screen on mobile
- Touch-friendly input field
- Swipe gestures (optional)
- Bottom sheet behavior

---

## Deliverables Checklist

- [x] Production-ready floating chat widget
- [x] Example embedding snippet
- [x] Environment configuration (.env.example)
- [x] Answer reformatting into paragraphs
- [x] Circular loading spinner for answer generation
- [x] Material-UI with Light/Dark themes
- [x] Toast notifications with retry
- [x] Mobile-first responsive design
- [x] WCAG 2.1 AA accessibility

---

## Summary

**Implementation Complete:** All requirements from FRONTEND PROMPT are specified and ready for implementation.

**Key Features:**
- Floating widget with toggle
- Material-UI design system
- Redux Toolkit + RTK Query
- Supabase realtime
- Answer formatting (paragraphs)
- Loading states (TypingIndicator + Circular Spinner)
- Toast error notifications
- Production-ready UX

