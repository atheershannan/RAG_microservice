# Stage 05 - Frontend Scope & Planning

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice

## Frontend Scope Analysis

### Primary Access Patterns
Based on requirements, the RAG microservice serves users through:
1. **Embedded Chatbot** - Integrated into other EDUCORE microservice UIs
2. **API Consumers** - Other microservices consume gRPC APIs directly
3. **Admin Dashboard** - Optional admin interface for monitoring and management

### Decision: Minimal Frontend Required

Since the RAG microservice is primarily an **API service** with:
- **Primary access:** Embedded chatbot in other microservices (Assessment, DevLab, Analytics, etc.)
- **API focus:** gRPC services consumed by other EDUCORE microservices
- **Admin needs:** Optional monitoring dashboard

**Recommendation:** Minimal frontend components:
1. **Chatbot Widget Component** - Reusable React/Vue component for embedding
2. **Admin Dashboard** (Optional) - Simple monitoring interface

---

## Option 1: Chatbot Widget Component (Recommended)

### Purpose
Reusable chatbot component that can be embedded in any EDUCORE microservice UI.

**Note:** Component structure documented in `COMPONENT_STRUCTURE.md`. Implementation details in `IMPLEMENTATION_SPEC.md`.

### Features
- Real-time query input
- Message history
- Source citations display
- Personalized recommendations
- Loading states
- Error handling
- Responsive design

### Integration
- Embeddable in any EDUCORE microservice
- gRPC-Web or REST API for communication
- OAuth2/JWT authentication
- Multi-tenant support

---

## Option 2: Admin Dashboard (Optional)

### Purpose
Monitoring and management interface for system administrators.

### Components
```
AdminDashboard/
├── Dashboard.jsx
├── MetricsPanel.jsx
├── QueryLogs.jsx
├── AccessControlPanel.jsx
├── AuditLogViewer.jsx
└── SystemHealth.jsx
```

### Features
- System metrics (QPS, response time, accuracy)
- Query logs and audit trail
- Access control management
- Health monitoring
- Error tracking

---

## Decision: Floating Chat Widget (Production-Ready)

**Primary Frontend Component:** Floating Chat Widget (Embeddable SPA)

**Architecture:**
- **Type:** SPA (Single Page Application), embeddable widget
- **Design System:** Material-UI (MUI) with corporate theme
- **Theme Support:** Light + Dark modes
- **Accessibility:** WCAG 2.1 AA compliance

**UI/UX Features:**
- Floating widget on right side of page
- Minimized button → expanded chat interface
- Circular loading spinner for assistant answers during generation/streaming
- Typing indicators for interim feedback
- Answer reformatting: paragraphs (not monolithic blocks)
- Minimal inline formatting (bold/italic/links)
- Code blocks only when backend marks as code
- Toast notifications for errors with retry
- Mobile-first responsive design

**Rationale:**
- Main user interaction is through chatbot
- Floating widget provides non-intrusive access
- Material-UI ensures consistent, accessible design
- Production-ready UX with proper loading states

---

## Frontend Tech Stack (Finalized)

### Core Stack
- **Framework:** React 18 + React DOM + React Router
- **State Management:** Redux Toolkit + RTK Query (or Axios service)
- **Styling:** Styled-components / MUI styled / CSS-in-JS
- **UI Library:** Material-UI (MUI)
- **Real-time:** Supabase realtime subscriptions
- **Authentication:** JWT from Supabase
- **Storage:** Secure storage/refresh tokens

### Performance Targets
- **Initial Bundle:** < 500KB
- **Code Splitting:** Route-based and component-based
- **Initial Load:** < 2 seconds
- **Response Time:** < 1 second
- **Offline Support:** Basic caching with Redux

### Security
- JWT authentication from Supabase
- Secure token storage and refresh
- CORS configuration
- Environment-based API URLs and keys

### Alternative (If no frontend needed)
- **Pure API Service:** No frontend, only gRPC APIs
- **Widget Library:** NPM package for embedding
- **Documentation:** API documentation only

---

## Next Steps

1. **If Chatbot Widget:** Proceed with component structure and TDD plan
2. **If Admin Dashboard:** Design dashboard components
3. **If No Frontend:** Skip to Stage 06 (Database)

**Recommendation:** Proceed with Chatbot Widget component planning.

