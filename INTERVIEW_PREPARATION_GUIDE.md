# RAG Microservice - Comprehensive Interview Preparation Guide

**Generated for:** AU10TIX Technical Interview  
**Project:** EDUCORE RAG (Retrieval-Augmented Generation) Microservice  
**Date:** 2025

---

## TABLE OF CONTENTS

1. [PHASE 1 – Project Mapping & Tech Stack](#phase-1--project-mapping--tech-stack)
2. [PHASE 2 – Backend Deep Dive](#phase-2--backend-deep-dive)
3. [PHASE 3 – Frontend Deep Dive](#phase-3--frontend-deep-dive)
4. [PHASE 4 – System Design Perspective](#phase-4--system-design-perspective)
5. [PHASE 5 – Interview Preparation Pack](#phase-5--interview-preparation-pack)
6. [PHASE 6 – Learning Checklist](#phase-6--learning-checklist)

---

# PHASE 1 – Project Mapping & Tech Stack

## 1. Project Overview

### What the Project Does
This is a **RAG (Retrieval-Augmented Generation) microservice** that serves as the central contextual intelligence layer for the EDUCORE learning ecosystem. It provides:

- **Intelligent Q&A System**: Users can ask questions in natural language and receive contextual answers based on the organization's knowledge base
- **Semantic Search**: Uses vector embeddings to find semantically similar content, not just keyword matches
- **Personalized Assistance**: Tailors responses based on user roles, profiles, and learning progress
- **Multi-tenant Support**: Serves multiple organizations (tenants) with complete data isolation
- **Knowledge Graph Integration**: Connects concepts, skills, courses, and users in a unified graph

### Main Domain
**Domain:** Enterprise Learning & Development (L&D) Platform  
**Type:** Microservice Architecture (part of a larger ecosystem of 10+ microservices)  
**Primary Use Case:** Contextual AI assistant for corporate learning platforms

### Services & Communication

**Services:**
1. **Backend API Service** (Node.js/Express)
   - REST API endpoints
   - gRPC client for inter-service communication
   - Query processing pipeline

2. **Frontend Widget** (React)
   - Floating chat widget
   - Embeddable component
   - Real-time UI updates

3. **Database** (PostgreSQL + pgvector)
   - Vector embeddings storage
   - Knowledge graph
   - Query history & audit logs

**Communication Patterns:**
- **REST API**: Primary interface for frontend and external services
- **gRPC**: Inter-service communication with other microservices (Coordinator, AI Learner)
- **Redis**: Caching layer (optional, graceful degradation)
- **Kafka**: Message queue (configured but not actively used in current implementation)

---

## 2. Tech Stack Summary

### Backend

**Language:** Node.js 20 LTS + JavaScript (ES2022+ modules)

**Framework:** Express.js 4.18.2
- RESTful API server
- Middleware-based architecture
- CORS enabled for cross-origin requests

**Key Libraries:**
- **ORM**: Prisma 5.8.0 (type-safe database client)
- **Database**: PostgreSQL 15+ with pgvector extension (vector similarity search)
- **Cache**: Redis 7+ via ioredis 5.3.2 (optional, graceful fallback)
- **AI**: OpenAI API 4.20.0 (GPT-3.5-turbo, text-embedding-ada-002)
- **Auth**: jsonwebtoken 9.0.2 (JWT support, though not actively used in current implementation)
- **Validation**: Joi 17.11.0 (request validation)
- **Logging**: Winston 3.11.0 (structured logging)
- **gRPC**: @grpc/grpc-js 1.10.0 (inter-service communication)
- **Message Queue**: KafkaJS 2.2.4 (configured, not actively used)

### Frontend

**Framework:** React 18.2.0

**State Management:** Redux Toolkit 2.0.1 + RTK Query
- Centralized state management
- API calls via RTK Query
- Slices: auth, chat, chatMode, user, ui

**UI Library:** Material-UI (MUI) 5.15.0
- Pre-built components
- Theming support (light/dark)
- Responsive design

**Build Tool:** Vite 5.0.8
- Fast development server
- Optimized production builds

**Additional Libraries:**
- **Real-time**: Supabase Realtime (via @supabase/supabase-js 2.39.0)
- **Animations**: Framer Motion 10.16.16
- **HTTP Client**: Axios 1.6.2
- **Icons**: React Icons 5.2.1

### Database

**Type:** PostgreSQL 15+ with pgvector extension

**Main Tables/Models:**

1. **Tenant** - Multi-tenant isolation
   - Fields: `id`, `name`, `domain`, `settings`, `createdAt`, `updatedAt`
   - Purpose: Complete data separation between organizations

2. **VectorEmbedding** - Core vector storage
   - Fields: `id`, `tenantId`, `contentId`, `contentType`, `embedding` (1536-dim vector), `contentText`, `metadata`
   - Purpose: Stores all document/user/knowledge graph embeddings for semantic search
   - Index: HNSW index on `embedding` column for fast similarity search

3. **Query** - Query history
   - Fields: `id`, `tenantId`, `userId`, `queryText`, `answer`, `confidenceScore`, `processingTimeMs`, `modelVersion`
   - Purpose: Audit trail and analytics

4. **QuerySource** - Source citations
   - Fields: `id`, `queryId`, `sourceId`, `sourceType`, `title`, `contentSnippet`, `relevanceScore`
   - Purpose: Tracks which documents were used to generate each answer

5. **UserProfile** - User data for personalization
   - Fields: `id`, `tenantId`, `userId`, `role`, `department`, `region`, `skillGaps`, `learningProgress`
   - Purpose: RBAC and personalized recommendations

6. **KnowledgeGraphNode** - Knowledge graph entities
   - Fields: `id`, `tenantId`, `nodeId`, `nodeType`, `properties` (JSONB)
   - Purpose: Represents skills, courses, users as graph nodes

7. **KnowledgeGraphEdge** - Relationships in knowledge graph
   - Fields: `id`, `tenantId`, `sourceNodeId`, `targetNodeId`, `edgeType`, `weight`
   - Purpose: Connects nodes (e.g., "user has_skill python")

8. **Microservice** - Registry of other microservices
   - Fields: `id`, `tenantId`, `name`, `serviceId`, `apiEndpoint`, `isActive`
   - Purpose: Tracks which microservices provide content

9. **AccessControlRule** - RBAC/ABAC rules (schema ready, not actively used)
   - Fields: `id`, `tenantId`, `ruleType`, `subjectType`, `subjectId`, `resourceType`, `permission`
   - Purpose: Fine-grained access control (currently RBAC is hardcoded in service layer)

10. **AuditLog** - Security audit trail
    - Fields: `id`, `tenantId`, `userId`, `action`, `resourceType`, `ipAddress`, `userAgent`, `details`
    - Purpose: Compliance and security monitoring

11. **CacheEntry** - Database cache (not used, Redis preferred)
    - Fields: `id`, `tenantId`, `cacheKey`, `responseData`, `expiresAt`
    - Purpose: Alternative caching mechanism

**Key Relationships:**
- Tenant (1) → (N) VectorEmbedding, Query, UserProfile, etc. (all tables have tenantId)
- Query (1) → (N) QuerySource, QueryRecommendation
- KnowledgeGraphNode (1) → (N) KnowledgeGraphEdge (source and target)

### Infrastructure

**Containerization:** Docker (docker-compose files for dev/test)

**CI/CD:** GitHub Actions
- Workflows: `ci-cd.yml`, `test.yml`, `deploy-docker.yml`, `deploy-railway.yml`, `deploy-vercel.yml`
- Automated testing, linting, security scanning

**Deployment Platforms:**
- **Backend**: Railway (production)
- **Frontend**: Vercel (configured)
- **Database**: Supabase PostgreSQL (cloud)

**Environment Management:**
- `.env` files for configuration
- Environment variables: `DATABASE_URL`, `OPENAI_API_KEY`, `REDIS_URL`, `FRONTEND_URL`, etc.

**Monitoring & Logging:**
- Winston logger (structured logs)
- Audit logs in database
- Error tracking via middleware

---

## 3. Project Structure

### Folder Layout

```
RAG_microservice/
├── BACKEND/                    # Backend service
│   ├── src/
│   │   ├── config/            # Configuration (DB, Redis, OpenAI, Kafka)
│   │   ├── controllers/       # Request handlers (query, recommendations, etc.)
│   │   ├── services/          # Business logic (queryProcessing, vectorSearch, etc.)
│   │   ├── routes/            # Express route definitions
│   │   ├── middleware/        # Express middleware (error handling)
│   │   ├── utils/             # Utilities (logger, validation, tenant validation)
│   │   ├── clients/           # External service clients (gRPC clients)
│   │   ├── communication/     # Inter-service communication logic
│   │   └── index.js          # Application entry point
│   ├── scripts/              # Utility scripts (migrations, embeddings)
│   └── tests/                # Test suites
│
├── FRONTEND/                  # Frontend application
│   ├── src/
│   │   ├── components/       # React components (chat widget, panels)
│   │   ├── store/            # Redux store (slices, API)
│   │   ├── services/         # API services (Supabase, microservice proxy)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utilities (formatters, constants)
│   │   └── main.jsx          # Entry point
│   └── dist/                 # Build output
│
├── DATABASE/                  # Database schema and migrations
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma schema (11 models)
│   │   ├── seed.js           # Seed data script
│   │   └── migrations/       # Database migrations
│   └── proto/                # gRPC Protocol Buffer definitions
│
├── tests/                     # Root-level test utilities
├── .github/workflows/         # CI/CD workflows
└── scripts/                   # Root-level scripts
```

### Key Folder Roles

**BACKEND/src/services/**: Core business logic
- `queryProcessing.service.js` - Main RAG pipeline
- `unifiedVectorSearch.service.js` - Vector search (single source of truth)
- `tenant.service.js` - Tenant management
- `userProfile.service.js` - User profile operations
- `recommendations.service.js` - Personalized recommendations
- `knowledgeGraph.service.js` - Knowledge graph queries
- `grpcFallback.service.js` - Fallback to other microservices

**BACKEND/src/controllers/**: Request/response handling
- Validate requests
- Call services
- Format responses
- Handle errors

**BACKEND/src/routes/**: API route definitions
- Map URLs to controllers
- Define HTTP methods
- Apply middleware

**FRONTEND/src/store/**: State management
- `store.js` - Redux store configuration
- `api/ragApi.js` - RTK Query API definitions
- `slices/` - Redux slices (auth, chat, ui, etc.)

**FRONTEND/src/components/**: UI components
- `chat/` - Chat widget components
- `chatbot/` - Chat interface components (header, input, messages, panel)

**DATABASE/prisma/**: Database schema
- `schema.prisma` - Single source of truth for database structure
- `migrations/` - Version-controlled schema changes

---

# PHASE 2 – Backend Deep Dive

## 1. API Architecture

### Main Endpoints

**Query Processing:**
- `POST /api/v1/query` - Main RAG query endpoint
  - Request: `{ query, tenant_id, user_id, session_id, metadata }`
  - Response: `{ query_id, answer, sources[], confidence_score, processing_time_ms }`
  - Flow: Query → Embedding → Vector Search → RBAC Filter → OpenAI → Response

**Recommendations:**
- `GET /api/v1/personalized/recommendations/:userId` - Get personalized recommendations
  - Query params: `tenant_id` (required)
  - Response: `{ recommendations[] }`

**Knowledge Graph:**
- `GET /api/v1/knowledge/progress/user/:userId/skill/:skillId` - User skill progress
  - Query params: `tenant_id` (required)
  - Response: `{ user_id, skill_id, progress, level }`

**Microservice Support (Proxy):**
- `POST /api/assessment/support` - Proxy to Assessment microservice
  - Requires: `SUPPORT_MODE_ENABLED=true`, optional `X-Embed-Secret` header
  - Request: `{ assessment_id, question_id, user_answer, hint_level }`
  - Response: `{ hint, concept_references[], related_content[] }`

- `POST /api/devlab/support` - Proxy to DevLab microservice
  - Same security requirements as assessment support
  - Request: `{ exercise_id, code, error_message, language, support_type }`
  - Response: `{ explanation, examples[], best_practices[], related_resources[] }`

**Diagnostics:**
- `GET /api/debug/embeddings-status` - Check embedding system status
- `GET /api/debug/test-vector-search` - Test vector search with sample query

**Health:**
- `GET /health` - Service health check
- `GET /` - API information and available endpoints

### Request/Response Flow

**Typical Query Flow:**
```
1. Frontend → POST /api/v1/query
   ↓
2. Routes → query.routes.js → submitQuery controller
   ↓
3. Controller → Validates request, fixes tenant_id
   ↓
4. Service → queryProcessing.service.js → processQuery()
   ├─ Get/Create tenant
   ├─ Get/Create user profile
   ├─ Check Redis cache (if available)
   ├─ Classify query (EDUCORE vs general)
   ├─ Generate embedding (OpenAI)
   ├─ Vector search (unifiedVectorSearch)
   ├─ Apply RBAC filtering
   ├─ Fallback to Coordinator (if no results)
   ├─ Generate answer (OpenAI with context)
   ├─ Generate recommendations
   ├─ Save to database
   └─ Cache in Redis
   ↓
5. Response → JSON with answer, sources, confidence
```

### Architecture Type

**Hybrid Architecture:**
- **Monolithic Backend**: Single Express.js application handling all endpoints
- **Microservice Integration**: Communicates with other microservices via gRPC
- **Service-Oriented**: Clear separation of concerns (services, controllers, routes)
- **Stateless**: No server-side sessions, all state in database/Redis

---

## 2. Data Layer

### Major Models/Tables

**1. Tenant**
- **Purpose**: Multi-tenant data isolation
- **Key Fields**: `id` (UUID), `domain` (unique), `settings` (JSON)
- **Relationships**: Parent of all other tables (1:N)

**2. VectorEmbedding**
- **Purpose**: Stores vector embeddings for semantic search
- **Key Fields**: 
  - `embedding` (vector(1536)) - OpenAI embedding vector
  - `contentText` - Original text content
  - `contentType` - "document", "chunk", "user_profile", "kg_node"
  - `contentId` - Reference to original content
- **Business Meaning**: Every searchable piece of content has an embedding here
- **Index**: HNSW index on `embedding` for fast cosine similarity search

**3. Query**
- **Purpose**: Audit trail of all queries and answers
- **Key Fields**: `queryText`, `answer`, `confidenceScore`, `processingTimeMs`, `isCached`
- **Business Meaning**: Tracks user interactions for analytics and improvement

**4. QuerySource**
- **Purpose**: Citations for answers
- **Key Fields**: `sourceId`, `sourceType`, `title`, `contentSnippet`, `relevanceScore`
- **Business Meaning**: Shows users which documents were used to generate the answer

**5. UserProfile**
- **Purpose**: User data for personalization and RBAC
- **Key Fields**: `userId` (unique), `role`, `department`, `skillGaps` (JSON), `learningProgress` (JSON)
- **Business Meaning**: Determines what content users can access and what recommendations they get

**6. KnowledgeGraphNode**
- **Purpose**: Entities in knowledge graph
- **Key Fields**: `nodeId` (unique), `nodeType`, `properties` (JSONB)
- **Business Meaning**: Represents skills, courses, users, concepts as graph nodes

**7. KnowledgeGraphEdge**
- **Purpose**: Relationships between nodes
- **Key Fields**: `sourceNodeId`, `targetNodeId`, `edgeType`, `weight`
- **Business Meaning**: Connects concepts (e.g., "user has_skill python", "course teaches skill react")

**8. Microservice**
- **Purpose**: Registry of other microservices
- **Key Fields**: `serviceId` (unique), `name`, `apiEndpoint`, `isActive`
- **Business Meaning**: Tracks which microservices provide content for vector embeddings

### Important Relationships

**One-to-Many:**
- Tenant → VectorEmbedding, Query, UserProfile, KnowledgeGraphNode, etc.
- Query → QuerySource, QueryRecommendation
- Microservice → VectorEmbedding

**Many-to-Many (via KnowledgeGraphEdge):**
- KnowledgeGraphNode ↔ KnowledgeGraphNode (via edges)
  - Example: User node → has_skill → Skill node → taught_by → Course node

**Unique Constraints:**
- `UserProfile.userId` - One profile per user
- `Tenant.domain` - One tenant per domain
- `VectorEmbedding` - Composite uniqueness via tenantId + contentId + contentType

---

## 3. Error Handling & Logging

### Global Error Handling

**Middleware:** `BACKEND/src/middleware/error-handler.middleware.js`

**Error Handler:**
```javascript
export function errorHandler(err, req, res, next) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
```

**Not Found Handler:**
- Returns 404 with helpful hints
- Ignores common browser requests (favicon.ico, etc.) to reduce log spam

### Logging Strategy

**Library:** Winston 3.11.0

**Log Levels:**
- `error` - Errors and exceptions
- `warn` - Warnings (e.g., CORS blocked, security issues)
- `info` - General information
- `debug` - Detailed debugging (development only)

**Structured Logging:**
- All logs include context: `tenantId`, `userId`, `query`, `action`
- Security events logged with `🚨 SECURITY:` prefix
- Audit logs stored in `AuditLog` table

**Log Locations:**
- Console output (development)
- Winston logger (structured JSON in production)
- Database (`AuditLog` table for compliance)

---

## 4. Security & Authentication

### Authentication Method

**Current Implementation:**
- **Role-based**: User role passed via request headers (`x-user-role`) or context
- **JWT Support**: jsonwebtoken library included but not actively used
- **User ID**: Passed in request body/context (`user_id` field)

**Authentication Flow:**
1. Frontend sends `user_id` and `role` in request
2. Backend validates tenant_id
3. Backend gets/creates user profile based on `user_id`
4. Role extracted from user profile or request headers

### Authorization (RBAC)

**Implementation:** Hardcoded in `queryProcessing.service.js`

**Roles:**
- `admin` / `administrator` - Full access to all user profiles
- `hr` - Full access to all user profiles (required for employee management)
- `trainer` - Can access specific user profiles when explicitly asked
- `manager` - Can access specific user profiles when explicitly asked
- `employee` / `user` - Can only access own profile
- `anonymous` / `guest` - No access to user profiles

**RBAC Logic:**
```javascript
let allowUserProfiles = false;

if (isAdmin || isHR) {
  allowUserProfiles = true; // Full access
} else if ((isTrainer || isManager) && hasSpecificUserName) {
  allowUserProfiles = true; // Specific users only
} else if (isEmployee && isQueryAboutOwnProfile) {
  allowUserProfiles = true; // Own profile only
} else {
  allowUserProfiles = false; // No access
}
```

**Security Features:**
- Multi-tenant isolation (all queries filtered by `tenantId`)
- RBAC filtering applied after vector search
- Security logging for unauthorized access attempts
- Role-specific error messages

### Protection Layers

**SQL Injection:**
- ✅ **Protected**: Prisma ORM uses parameterized queries
- ✅ **Raw SQL**: Uses `$queryRawUnsafe` with parameterized placeholders (`$1`, `$2`, etc.)
- ✅ **Example**: `WHERE tenant_id = $1 AND content_type = $2` (parameters passed separately)

**XSS (Cross-Site Scripting):**
- ✅ **Protected**: Input sanitization via Joi validation
- ✅ **Output**: JSON responses (no HTML rendering)
- ⚠️ **Frontend**: React automatically escapes content (but user-generated content should be sanitized)

**CSRF (Cross-Site Request Forgery):**
- ⚠️ **Missing Information**: No explicit CSRF protection middleware found
- ✅ **Mitigation**: CORS configured with specific allowed origins
- ⚠️ **Recommendation**: Add CSRF tokens for state-changing operations

**Rate Limiting:**
- ⚠️ **Missing Information**: Rate limiting mentioned in templates but not actively implemented
- ✅ **OpenAI**: Rate limiting handled at OpenAI API level (exponential backoff in code)
- ⚠️ **Recommendation**: Add express-rate-limit middleware for API endpoints

**CORS:**
- ✅ **Configured**: Specific allowed origins in `BACKEND/src/index.js`
- ✅ **Credentials**: Enabled for authenticated requests
- ✅ **Methods**: GET, POST, PUT, DELETE, OPTIONS

**Support Mode Security:**
- ✅ **Gatekeeping**: Requires `SUPPORT_MODE_ENABLED=true` environment variable
- ✅ **Shared Secret**: Optional `X-Embed-Secret` header validation
- ✅ **Origin Validation**: Checks `SUPPORT_ALLOWED_ORIGINS` environment variable

---

## 5. Performance & Scalability

### Caching

**Redis Cache:**
- **Library**: ioredis 5.3.2
- **TTL**: 1 hour (3600 seconds)
- **Cache Key**: `query:{tenantId}:{userId}:{base64(query)}`
- **Graceful Degradation**: System continues to work if Redis is unavailable
- **Location**: `BACKEND/src/config/redis.config.js`

**Cache Strategy:**
- Cache query results after processing
- Check cache before processing query
- Cache hit returns immediately (no OpenAI call, no vector search)

### Queues & Async Workers

**Kafka:**
- **Library**: KafkaJS 2.2.4
- **Status**: Configured but not actively used in current implementation
- **Purpose**: Planned for async processing of embeddings, recommendations, etc.

**Current Implementation:**
- Synchronous processing (query → response)
- No background workers
- All processing happens in request handler

### Database Indexes

**Vector Index:**
```sql
CREATE INDEX ON vector_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```
- **Type**: HNSW (Hierarchical Navigable Small World)
- **Purpose**: Fast approximate nearest neighbor search
- **Performance**: O(log n) instead of O(n) for similarity search

**Regular Indexes:**
- `@@index([tenantId])` - On all tenant-scoped tables
- `@@index([tenantId, contentId])` - Composite index on VectorEmbedding
- `@@index([tenantId, contentType, microserviceId])` - Composite index for filtered searches
- `@@index([userId, createdAt(sort: Desc)])` - On Query table for user history
- `@@index([queryId])` - On QuerySource for fast source lookup

### Optimization Strategies

**Vector Search Optimization:**
- Similarity threshold (default: 0.25) filters low-quality results
- Result limit (default: 20) prevents excessive data transfer
- RBAC filtering applied after vector search (maintains search performance)

**Query Optimization:**
- Tenant filtering at database level (indexed)
- Parameterized queries (prepared statements)
- Connection pooling (via Prisma)

**Response Optimization:**
- Caching frequently asked questions
- Minimal data transfer (only necessary fields)
- JSON compression (handled by Express)

**Bottlenecks & Recommendations:**
1. **OpenAI API Calls**: Rate limits and latency
   - **Solution**: Caching, batch processing, fallback strategies
2. **Vector Search**: Large embedding database
   - **Solution**: HNSW index, result limiting, tenant filtering
3. **Database Connections**: Connection pool limits
   - **Solution**: Prisma connection pooling, read replicas for scaling

---

# PHASE 3 – Frontend Deep Dive

## 1. App Flow

### Main Screens/Components

**1. FloatingChatWidget** (`FRONTEND/src/components/chat/FloatingChatWidget/`)
- **Purpose**: Main entry point, manages widget state
- **Features**: 
  - Toggle open/close
  - Mode detection (General, Assessment Support, DevLab Support)
  - Recommendations display
  - Initial greeting

**2. ChatPanel** (`FRONTEND/src/components/chatbot/ChatPanel/`)
- **Purpose**: Main chat interface container
- **Features**:
  - Message list
  - Input field
  - Recommendations sidebar
  - Loading states

**3. ChatMessage** (`FRONTEND/src/components/chatbot/ChatMessage/`)
- **Purpose**: Individual message display
- **Features**:
  - Bot/user message styling
  - Timestamp
  - Source citations (if available)
  - Markdown rendering

**4. ChatInput** (`FRONTEND/src/components/chatbot/ChatInput/`)
- **Purpose**: User input field
- **Features**:
  - Text input
  - Submit button
  - Disabled state during loading

**5. Recommendations** (`FRONTEND/src/components/chatbot/Recommendations/`)
- **Purpose**: Display personalized recommendations
- **Features**:
  - Mode-specific recommendations
  - Clickable recommendation cards
  - Dynamic updates based on conversation

**6. ChatHeader** (`FRONTEND/src/components/chatbot/ChatHeader/`)
- **Purpose**: Widget header
- **Features**:
  - Title
  - Close button
  - Mode indicator

### Component Hierarchy

```
FloatingChatWidget (Root)
├── ChatWidgetButton (Toggle button when closed)
└── ChatPanel (Main interface when open)
    ├── ChatHeader
    ├── ChatMessage[] (Message list)
    ├── ChatInput
    └── Recommendations (Sidebar)
```

---

## 2. State Management

### State Flow

**User Action → Event Handler → API Call → State Update → UI Render**

**Example Flow:**
```
1. User types query and clicks submit
   ↓
2. ChatInput → handleSubmit() → dispatch action
   ↓
3. FloatingChatWidget → useSubmitQueryMutation() (RTK Query)
   ↓
4. RTK Query → POST /api/v1/query
   ↓
5. Backend processes query → Returns response
   ↓
6. RTK Query → Updates cache → Triggers re-render
   ↓
7. FloatingChatWidget → addMessage() → Updates chat slice
   ↓
8. ChatPanel → useSelector() → Reads messages from Redux
   ↓
9. UI re-renders with new message
```

### Redux Store Structure

**Store Configuration** (`FRONTEND/src/store/store.js`):
```javascript
{
  ragApi: RTK Query API slice,
  auth: authSlice,
  chat: chatSlice,
  chatMode: chatModeSlice,
  user: userSlice,
  ui: uiSlice
}
```

**Key Slices:**

1. **chatSlice**: Message state
   - `messages[]` - Array of chat messages
   - `isLoading` - Loading state
   - Actions: `addMessage`, `setLoading`, `clearMessages`

2. **chatModeSlice**: Mode state
   - `currentMode` - "GENERAL", "ASSESSMENT_SUPPORT", "DEVLAB_SUPPORT"
   - Actions: `setGeneralMode`, `setAssessmentSupportMode`, `setDevLabSupportMode`

3. **uiSlice**: UI state
   - `isWidgetOpen` - Widget visibility
   - Actions: `toggleWidget`, `setWidgetOpen`

4. **ragApi** (RTK Query): API state
   - `submitQuery` mutation - Query submission
   - `getRecommendations` query - Recommendations fetching
   - Automatic caching and refetching

---

## 3. Component Architecture

### Smart vs Dumb Components

**Smart Components (Logic-Heavy):**
- **FloatingChatWidget**: 
  - Manages widget state
  - Handles API calls
  - Coordinates mode changes
  - Manages recommendations

- **ChatPanel**:
  - Manages message list
  - Handles input submission
  - Coordinates child components

**Dumb Components (Presentation):**
- **ChatMessage**: 
  - Receives message prop
  - Renders message UI
  - No business logic

- **ChatInput**:
  - Receives onSubmit callback
  - Manages input state (local)
  - No API calls

- **ChatHeader**:
  - Receives title prop
  - Renders header UI
  - Calls onClose callback

### Separation of Concerns

**Services Layer** (`FRONTEND/src/services/`):
- `api.js` - API client configuration
- `supabase.js` - Supabase client
- `microserviceProxy.js` - Proxy to microservices

**Hooks** (`FRONTEND/src/hooks/`):
- `useAuth.js` - Authentication logic
- `useChat.js` - Chat-related logic
- `useRealtime.js` - Real-time updates

**Utils** (`FRONTEND/src/utils/`):
- `answerFormatter.js` - Format bot responses
- `modeDetector.js` - Detect mode changes
- `recommendations.js` - Generate recommendations

---

## 4. Error/Loading Handling

### Loading States

**Implementation:**
- `isLoading` in chat slice (Redux)
- `isQueryLoading` from RTK Query mutation
- Loading spinner in ChatInput (disabled state)

**User Experience:**
- Input disabled during query processing
- Loading indicator shown
- Previous messages remain visible

### Error Handling

**API Errors:**
- RTK Query handles errors automatically
- Error messages displayed in chat
- Fallback messages for network failures

**Error States:**
- Network errors → "Unable to connect. Please try again."
- API errors → Error message from backend
- Timeout → "Request timed out. Please try again."

### Empty States

**No Messages:**
- Initial greeting shown
- Recommendations displayed
- Input field ready

**No Results:**
- Backend returns appropriate error message
- Frontend displays error in chat
- User can try different query

---

# PHASE 4 – System Design Perspective

## 1. High-Level Architecture Summary

### Architecture Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile App  │  │  Other MS     │     │
│  │  (React)     │  │  (Future)    │  │  (gRPC)       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          │  REST API       │  REST API       │  gRPC
          │  (HTTPS)        │  (HTTPS)        │  (mTLS)
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js Server (Node.js 20)               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │  │
│  │  │  Routes    │→ │ Controllers │→ │  Services  │   │  │
│  │  └────────────┘  └────────────┘  └────────────┘   │  │
│  │         │                │                │          │  │
│  │         └────────────────┴────────────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬─────────────────┬─────────────────┬──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA & EXTERNAL LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │   OpenAI API  │    │
│  │  + pgvector  │  │   (Cache)    │  │   (AI/Embed)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Coordinator │  │  AI Learner  │  │  Assessment   │    │
│  │   (gRPC)     │  │    (gRPC)    │  │     (gRPC)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Main Flows

**Flow 1: RAG Query Processing**
1. Client sends query via REST API
2. Backend validates request and extracts tenant/user context
3. Backend checks Redis cache (if available)
4. Backend generates embedding via OpenAI API
5. Backend performs vector search in PostgreSQL (pgvector)
6. Backend applies RBAC filtering
7. Backend generates answer via OpenAI API (with context)
8. Backend saves query/answer to database
9. Backend caches result in Redis
10. Backend returns response to client

**Flow 2: Inter-Service Communication (gRPC)**
1. Backend determines need for external microservice data
2. Backend calls Coordinator service via gRPC
3. Coordinator routes request to appropriate microservice
4. Microservice returns normalized data
5. Backend merges results with vector search results
6. Backend generates final answer

**Flow 3: Multi-Tenant Data Isolation**
1. Every request includes `tenant_id`
2. All database queries filtered by `tenant_id`
3. Vector search scoped to tenant's embeddings
4. User profiles scoped to tenant
5. Complete data isolation between tenants

---

## 2. Design Decisions & Tradeoffs

### Database Choice: PostgreSQL + pgvector

**Decision**: PostgreSQL with pgvector extension for vector storage

**Reasoning:**
- **Relational + Vector**: Combines relational data (users, queries) with vector data (embeddings)
- **ACID Compliance**: Ensures data consistency for multi-tenant system
- **Mature Extension**: pgvector is well-maintained and performant
- **Single Database**: Simpler infrastructure than separate vector DB

**Tradeoffs:**
- ✅ Simpler architecture (one database)
- ✅ Strong consistency
- ⚠️ Vector search performance (good but not as fast as specialized vector DBs)
- ⚠️ Scaling challenges (vector indexes can be large)

### Framework Choice: Express.js

**Decision**: Express.js for REST API

**Reasoning:**
- **Mature & Stable**: Widely used, extensive ecosystem
- **Flexibility**: Middleware-based architecture allows custom logic
- **Performance**: Fast enough for current scale
- **Developer Experience**: Easy to learn and maintain

**Tradeoffs:**
- ✅ Large ecosystem
- ✅ Flexible middleware
- ⚠️ Less opinionated (more code to write)
- ⚠️ Performance (good but not as fast as Fastify/NestJS)

### Microservices vs Monolith

**Decision**: Monolithic backend with microservice integration

**Reasoning:**
- **Simplicity**: Single codebase easier to develop and deploy
- **Performance**: No network overhead for internal calls
- **Integration**: Communicates with other microservices via gRPC when needed
- **Scale**: Can split later if needed

**Tradeoffs:**
- ✅ Easier development and deployment
- ✅ Better performance for internal operations
- ⚠️ Harder to scale individual components
- ⚠️ Tight coupling within backend

### Caching: Redis

**Decision**: Redis for query result caching

**Reasoning:**
- **Performance**: In-memory cache provides sub-millisecond access
- **TTL Support**: Automatic expiration of cached data
- **Optional**: System works without Redis (graceful degradation)

**Tradeoffs:**
- ✅ Fast cache hits
- ✅ Reduces OpenAI API calls
- ⚠️ Additional infrastructure to manage
- ⚠️ Cache invalidation complexity

### RBAC: Hardcoded vs Database-Driven

**Decision**: Hardcoded RBAC logic in service layer

**Reasoning:**
- **Simplicity**: Rules are straightforward and don't change often
- **Performance**: No database lookup for permission checks
- **Security**: Less risk of misconfiguration

**Tradeoffs:**
- ✅ Fast permission checks
- ✅ Less configuration errors
- ⚠️ Requires code deployment to change rules
- ⚠️ Less flexible than database-driven approach

### Vector Search: Single Table vs Multiple Tables

**Decision**: Single `vector_embeddings` table for all content types

**Reasoning:**
- **Flexibility**: Can add new content types without schema changes
- **Unified Search**: One query searches all content types
- **Simplicity**: Single index, single query pattern

**Tradeoffs:**
- ✅ Flexible schema
- ✅ Unified search interface
- ⚠️ Larger table (all content types together)
- ⚠️ Filtering by contentType required for some queries

---

## 3. Scaling Strategy

### Current Scalability

**Horizontal Scaling:**
- ✅ **Stateless Backend**: Can run multiple instances behind load balancer
- ✅ **Database**: PostgreSQL supports read replicas
- ⚠️ **Vector Search**: HNSW index is per-database (can't easily shard)

**Vertical Scaling:**
- ✅ **Database**: Can increase PostgreSQL resources
- ✅ **Backend**: Can increase Node.js instance resources
- ⚠️ **OpenAI API**: Rate limits apply per API key

### Potential Bottlenecks

**1. OpenAI API Rate Limits**
- **Issue**: Rate limits on embedding and completion API calls
- **Impact**: High
- **Solutions**:
  - Implement request queuing
  - Use multiple API keys (round-robin)
  - Increase caching (reduce API calls)
  - Batch embedding generation

**2. Vector Search Performance**
- **Issue**: Large embedding database slows down similarity search
- **Impact**: Medium
- **Solutions**:
  - Optimize HNSW index parameters
  - Increase `ef_search` parameter for better accuracy
  - Partition embeddings by tenant (if multi-tenant scaling)
  - Consider specialized vector database (Pinecone, Weaviate) for very large scale

**3. Database Connection Pool**
- **Issue**: Prisma connection pool limits
- **Impact**: Medium
- **Solutions**:
  - Increase connection pool size
  - Use read replicas for query operations
  - Implement connection pooling at infrastructure level

**4. Redis Cache Memory**
- **Issue**: Redis memory limits for cached queries
- **Impact**: Low (system works without Redis)
- **Solutions**:
  - Increase Redis memory
  - Implement cache eviction policies (LRU)
  - Use Redis Cluster for distributed caching

### Recommended Improvements

**Short-term (1-3 months):**
1. **Add Rate Limiting**: Implement express-rate-limit for API endpoints
2. **Optimize Vector Index**: Tune HNSW parameters for better performance
3. **Increase Caching**: Cache more query patterns, increase TTL for stable content
4. **Add Monitoring**: Implement APM (Application Performance Monitoring)

**Medium-term (3-6 months):**
1. **Read Replicas**: Add PostgreSQL read replicas for query operations
2. **Background Workers**: Move embedding generation to background jobs (Kafka)
3. **CDN**: Add CDN for static frontend assets
4. **Load Balancing**: Implement load balancer for multiple backend instances

**Long-term (6-12 months):**
1. **Microservice Split**: Split backend into query service, embedding service, recommendation service
2. **Vector DB Migration**: Consider specialized vector database for very large scale
3. **Graph Database**: Consider Neo4j for knowledge graph operations
4. **Event-Driven Architecture**: Full Kafka integration for async processing

---

# PHASE 5 – Interview Preparation Pack

## 1. "Tell me about this project"

### 2-3 Minute Explanation

**Opening:**
"I built a RAG (Retrieval-Augmented Generation) microservice for an enterprise learning platform called EDUCORE. It's a contextual AI assistant that helps employees find answers to questions about company training materials, skills, and learning resources."

**Technologies:**
"The backend is built with Node.js and Express.js, using PostgreSQL with pgvector for vector similarity search. I integrated OpenAI's API for generating embeddings and AI responses. The frontend is a React widget using Redux Toolkit for state management and Material-UI for the interface. The system uses Redis for caching and communicates with other microservices via gRPC."

**Key Features:**
"The system supports multi-tenant architecture with complete data isolation. I implemented role-based access control to ensure employees can only access appropriate information. The vector search uses semantic similarity, so users can ask questions in natural language and get relevant answers even if they don't use exact keywords. I also built a knowledge graph to connect skills, courses, and users."

**Challenges:**
"One major challenge was implementing secure RBAC while maintaining performance. I had to filter search results after vector search to apply permissions, which required careful optimization. Another challenge was handling the multi-tenant architecture - every query needs to be scoped to the correct tenant to prevent data leakage. I also had to implement graceful degradation when Redis is unavailable, ensuring the system continues to work."

**What I Learned:**
"I learned a lot about vector databases and semantic search. Working with pgvector taught me how to optimize similarity search queries and use HNSW indexes effectively. I also gained experience with microservice architecture and gRPC communication. The project gave me hands-on experience with security best practices, especially around multi-tenant data isolation and RBAC implementation."

---

## 2. Technical Q&A (Specific to This Project)

### Q1: How does the RAG pipeline work in your system?

**Answer:**
"The RAG pipeline starts when a user submits a query. First, I check Redis cache for a previous identical query. If not cached, I classify the query to determine if it's related to EDUCORE content or a general question. For EDUCORE queries, I generate an embedding using OpenAI's text-embedding-ada-002 model, which produces a 1536-dimensional vector. Then I perform a cosine similarity search in PostgreSQL using pgvector, finding the top 20 most similar content pieces above a 0.25 similarity threshold. After that, I apply RBAC filtering to remove content the user shouldn't access. If no results are found, I fallback to calling the Coordinator microservice via gRPC to fetch data from other microservices. Finally, I send the retrieved context along with the original query to OpenAI's GPT-3.5-turbo model to generate a contextual answer. The answer includes source citations, and I save everything to the database for analytics."

### Q2: How do you ensure multi-tenant data isolation?

**Answer:**
"Every database table has a `tenantId` column, and all queries are filtered by `tenantId` at the database level. I use Prisma's parameterized queries to ensure the tenant filter is always applied. For vector search, I include `WHERE tenant_id = $1` in the SQL query, so even if someone tries to access another tenant's data, the database query will only return results for their tenant. I also validate and normalize tenant IDs in the controller layer before processing. The tenant ID comes from the request, and I have validation logic to ensure it's properly formatted. This ensures complete data isolation between different organizations using the platform."

### Q3: Explain your RBAC implementation.

**Answer:**
"I implemented role-based access control with six roles: admin, HR, trainer, manager, employee, and anonymous. The RBAC logic is hardcoded in the query processing service for performance and security. Admins and HR have full access to all user profiles. Trainers and managers can access specific user profiles when explicitly asked about them. Employees can only access their own profile. Anonymous users have no access to user profiles at all. The filtering happens after vector search - I perform the search first to get all relevant results, then filter out user_profile content types if the user doesn't have permission. I also log security events when unauthorized access is attempted, which helps with compliance and monitoring."

### Q4: How do you handle performance optimization?

**Answer:**
"I use several optimization strategies. First, Redis caching stores query results for 1 hour, which dramatically reduces OpenAI API calls and database queries for repeated questions. Second, I use HNSW indexes on the vector embeddings column, which provides O(log n) search performance instead of O(n). Third, I apply similarity thresholds and result limits to prevent excessive data processing. Fourth, I use database indexes on tenantId and other frequently queried columns. Fifth, I use Prisma's connection pooling to manage database connections efficiently. Finally, the system gracefully degrades if Redis is unavailable, so performance doesn't break entirely if the cache is down."

### Q5: How does vector search work in your system?

**Answer:**
"Vector search uses pgvector extension in PostgreSQL. When content is added to the system, I generate embeddings using OpenAI's text-embedding-ada-002 model, which produces 1536-dimensional vectors. These vectors are stored in the `vector_embeddings` table. When a user queries, I generate an embedding for their query and use PostgreSQL's cosine distance operator (`<=>`) to find the most similar vectors. I convert the distance to a similarity score using `1 - (embedding <=> query_vector)`, which gives a score between 0 and 1. I filter results above a 0.25 threshold and limit to the top 20 results. The HNSW index makes this search very fast even with millions of embeddings. The search is scoped to the user's tenant for data isolation."

### Q6: What happens when a query returns no results?

**Answer:**
"When no results are found from vector search, I have a fallback mechanism. First, I check if the similarity threshold was too high and try a lower threshold search. If that still returns nothing, I call the Coordinator microservice via gRPC, which can route the request to other microservices that might have relevant data. The Coordinator normalizes the data and returns it in a consistent format. I merge these results with any vector search results. If still no results, I generate an appropriate error message based on the user's role and the query context. For example, if an employee asks about another employee's profile and gets blocked by RBAC, I return a permission-denied message. If there's truly no data, I return a helpful message suggesting the user try a different query."

### Q7: How do you handle errors and edge cases?

**Answer:**
"I have a centralized error handler middleware that catches all errors and returns consistent error responses. I use Winston for structured logging, which logs errors with context like tenantId, userId, and query. For API errors, I return appropriate HTTP status codes (400 for validation errors, 401 for auth errors, 403 for permission errors, 500 for server errors). I also handle specific edge cases: if Redis is unavailable, the system continues without caching. If OpenAI API fails, I return an error message but don't crash. If the database connection fails, I return a 503 service unavailable error. I also validate all inputs using Joi schemas before processing, which prevents many errors early in the pipeline."

### Q8: How would you scale this system to handle 10x more traffic?

**Answer:**
"To scale 10x, I'd implement several strategies. First, I'd add horizontal scaling for the backend - run multiple Node.js instances behind a load balancer. Since the backend is stateless, this is straightforward. Second, I'd add PostgreSQL read replicas for query operations, keeping the primary database for writes. Third, I'd optimize the caching strategy - increase Redis memory, implement more aggressive caching, and potentially use Redis Cluster for distributed caching. Fourth, I'd implement request queuing for OpenAI API calls to handle rate limits better. Fifth, I'd consider moving to a specialized vector database like Pinecone or Weaviate if the embedding database grows very large. Sixth, I'd add monitoring and APM to identify bottlenecks. Finally, I'd implement background workers using Kafka to offload embedding generation and other heavy operations from the request path."

---

## 3. General Fullstack Questions (Using This Project)

### Q: How do you handle state management in a complex React application?

**Answer (from this project):**
"I used Redux Toolkit with RTK Query for this project. RTK Query handles all API calls and caching automatically, which reduces boilerplate code significantly. I organized state into slices: chat slice for messages, auth slice for user authentication, ui slice for widget visibility, and chatMode slice for the current mode. RTK Query's mutations handle the query submission, and I use the cache to avoid unnecessary API calls. For local component state, I used React's useState for things like input field values that don't need to be shared across components. This separation keeps the code maintainable and performant."

### Q: How do you ensure security in a multi-tenant application?

**Answer (from this project):**
"Security starts with data isolation. Every database query is filtered by tenantId using parameterized queries to prevent SQL injection. I implemented RBAC to control what content users can access based on their role. I also validate all inputs using Joi schemas before processing. For inter-service communication, I use gRPC with mTLS for secure connections. I log all security events, especially unauthorized access attempts, for compliance. CORS is configured to only allow specific origins. The system also validates tenant IDs and normalizes them to prevent tenant ID manipulation attacks."

### Q: How do you optimize database queries?

**Answer (from this project):**
"I use several optimization techniques. First, I create indexes on frequently queried columns - tenantId, userId, contentType, and composite indexes for common query patterns. Second, I use Prisma's connection pooling to manage database connections efficiently. Third, for vector search, I use HNSW indexes which provide O(log n) performance. Fourth, I limit query results and use similarity thresholds to prevent processing unnecessary data. Fifth, I use parameterized queries (via Prisma) which allows PostgreSQL to cache query plans. Sixth, I scope all queries to tenants, which allows the database to use tenantId indexes effectively. Finally, I cache frequently accessed data in Redis to reduce database load."

### Q: How do you handle API rate limiting and external service failures?

**Answer (from this project):**
"For OpenAI API rate limiting, I implement caching to reduce the number of API calls. I cache query results in Redis for 1 hour, which means repeated queries don't hit the API at all. For handling failures, I have graceful degradation - if Redis is unavailable, the system continues without caching. If OpenAI API fails, I return an error message but don't crash the system. I also use retry logic with exponential backoff for transient failures. For the future, I'd implement a request queue system using Kafka to handle rate limits more gracefully, allowing requests to wait in a queue rather than failing immediately."

### Q: How do you structure a microservice architecture?

**Answer (from this project):**
"This project is part of a microservice ecosystem. I designed it as a monolithic backend that communicates with other microservices via gRPC. The backend has clear separation of concerns - routes handle HTTP, controllers handle request/response, and services contain business logic. For inter-service communication, I use Protocol Buffers to define contracts, ensuring type safety and versioning. The Coordinator microservice acts as a router, normalizing data from different microservices. Each microservice is responsible for its own domain - this RAG service handles semantic search and AI, while other services handle assessments, content management, etc. This allows each service to scale independently while maintaining loose coupling."

---

## 4. Security / Identity / Fraud-related Relevance

### How This Project Relates to AU10TIX's Domain

**Identity Verification & Access Control:**
"This RAG microservice implements comprehensive role-based access control (RBAC) that ensures users can only access information appropriate for their role. The system validates user identities and enforces strict permission checks before returning sensitive data like employee profiles. This is directly relevant to AU10TIX's identity verification domain - the same principles of verifying user identity and controlling access apply."

**Multi-Tenant Data Isolation:**
"The system ensures complete data isolation between different organizations (tenants), preventing data leakage and unauthorized access. This is critical for enterprise identity solutions where different clients' data must be completely separated. The implementation uses database-level filtering and validation to ensure tenant boundaries are never crossed."

**Audit Logging & Compliance:**
"I implemented comprehensive audit logging that tracks all user actions, including query history, access attempts, and security events. This is essential for compliance and fraud detection - similar to how AU10TIX needs to track identity verification events for regulatory compliance and fraud analysis."

**Security Best Practices:**
"The project demonstrates security best practices including parameterized queries to prevent SQL injection, input validation, CORS configuration, and secure inter-service communication via gRPC with mTLS. These practices are directly applicable to building secure identity verification systems."

**Data Quality & Integrity:**
"The system ensures data quality through validation schemas, error handling, and consistent data formats. For identity verification, maintaining data integrity is crucial - the same validation and error handling patterns apply when processing identity documents and user data."

**Scalability & Performance:**
"The system is designed to handle high volumes of queries while maintaining security and data isolation. For identity verification at scale, similar architectural patterns are needed to process millions of identity checks while ensuring each check is secure and isolated."

---

# PHASE 6 – Learning Checklist

Use this checklist to systematically learn the codebase:

## Architecture & Design
- [ ] Understand overall microservice architecture
- [ ] Understand multi-tenant data isolation pattern
- [ ] Understand REST API vs gRPC communication patterns
- [ ] Understand the RAG pipeline flow (query → embedding → search → answer)
- [ ] Understand how the system integrates with other microservices

## Backend Knowledge
- [ ] **Main Services:**
  - [ ] `queryProcessing.service.js` - RAG pipeline logic
  - [ ] `unifiedVectorSearch.service.js` - Vector search implementation
  - [ ] `tenant.service.js` - Tenant management
  - [ ] `userProfile.service.js` - User profile operations
  - [ ] `recommendations.service.js` - Recommendation generation
- [ ] **API Endpoints:**
  - [ ] `POST /api/v1/query` - Main query endpoint
  - [ ] `GET /api/v1/personalized/recommendations/:userId` - Recommendations
  - [ ] `POST /api/assessment/support` - Assessment proxy
  - [ ] `POST /api/devlab/support` - DevLab proxy
- [ ] **Key Flows:**
  - [ ] Query processing flow (start to finish)
  - [ ] RBAC filtering logic
  - [ ] Caching strategy
  - [ ] Error handling flow

## Database & Data Models
- [ ] **Core Tables:**
  - [ ] `Tenant` - Multi-tenant isolation
  - [ ] `VectorEmbedding` - Embedding storage
  - [ ] `Query` - Query history
  - [ ] `UserProfile` - User data
  - [ ] `KnowledgeGraphNode` & `KnowledgeGraphEdge` - Knowledge graph
- [ ] **Relationships:**
  - [ ] Tenant → All other tables (1:N)
  - [ ] Query → QuerySource (1:N)
  - [ ] KnowledgeGraphNode ↔ KnowledgeGraphNode (via edges)
- [ ] **Indexes:**
  - [ ] HNSW index on vector embeddings
  - [ ] Regular indexes on tenantId, userId, etc.

## Frontend Knowledge
- [ ] **Main Components:**
  - [ ] `FloatingChatWidget` - Root component
  - [ ] `ChatPanel` - Main interface
  - [ ] `ChatMessage` - Message display
  - [ ] `ChatInput` - Input handling
- [ ] **State Management:**
  - [ ] Redux store structure
  - [ ] RTK Query API calls
  - [ ] Redux slices (chat, auth, ui, chatMode)
- [ ] **Key Flows:**
  - [ ] User submits query → API call → State update → UI render
  - [ ] Mode switching (General, Assessment, DevLab)
  - [ ] Recommendations display

## Security & Performance
- [ ] **Security:**
  - [ ] Multi-tenant data isolation
  - [ ] RBAC implementation
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] CORS configuration
  - [ ] Input validation (Joi schemas)
- [ ] **Performance:**
  - [ ] Redis caching strategy
  - [ ] Vector search optimization (HNSW index)
  - [ ] Database query optimization (indexes)
  - [ ] Connection pooling

## System Design & Scalability
- [ ] **Architecture Decisions:**
  - [ ] Why PostgreSQL + pgvector?
  - [ ] Why Express.js?
  - [ ] Why monolithic backend with microservice integration?
  - [ ] Why Redis for caching?
  - [ ] Why hardcoded RBAC?
- [ ] **Scaling:**
  - [ ] Horizontal scaling strategy
  - [ ] Database scaling (read replicas)
  - [ ] Caching scaling (Redis Cluster)
  - [ ] Potential bottlenecks and solutions

## Interview Preparation
- [ ] **"Tell me about this project"** - 2-3 minute explanation ready
- [ ] **Technical Q&A** - Can answer questions about:
  - [ ] RAG pipeline
  - [ ] Multi-tenant isolation
  - [ ] RBAC implementation
  - [ ] Performance optimization
  - [ ] Vector search
  - [ ] Error handling
  - [ ] Scaling strategies
- [ ] **General Questions** - Can relate project to:
  - [ ] State management
  - [ ] Security best practices
  - [ ] Database optimization
  - [ ] API design
  - [ ] Microservice architecture
- [ ] **AU10TIX Relevance** - Can explain:
  - [ ] Identity verification & access control
  - [ ] Data isolation & security
  - [ ] Audit logging & compliance
  - [ ] Security best practices
  - [ ] Scalability patterns

## Code Locations (Quick Reference)
- [ ] Know where to find:
  - [ ] Main query processing logic (`BACKEND/src/services/queryProcessing.service.js`)
  - [ ] Vector search implementation (`BACKEND/src/services/unifiedVectorSearch.service.js`)
  - [ ] RBAC logic (`BACKEND/src/services/queryProcessing.service.js` ~line 528)
  - [ ] Database schema (`DATABASE/prisma/schema.prisma`)
  - [ ] API routes (`BACKEND/src/routes/`)
  - [ ] Frontend components (`FRONTEND/src/components/`)
  - [ ] Redux store (`FRONTEND/src/store/`)

---

## Final Notes

**Missing Information (Marked in Document):**
- Rate limiting: Mentioned in templates but not actively implemented
- CSRF protection: No explicit CSRF middleware found
- JWT authentication: Library included but not actively used (role-based auth via headers/context instead)

**Key Strengths to Highlight:**
- Multi-tenant architecture with complete data isolation
- Comprehensive RBAC implementation
- Vector search optimization with HNSW indexes
- Graceful degradation (works without Redis)
- Security logging and audit trails
- Clean separation of concerns (services, controllers, routes)

**Areas for Improvement (If Asked):**
- Add rate limiting middleware
- Implement CSRF protection
- Add more comprehensive error handling
- Implement background workers for heavy operations
- Add monitoring and APM

---

**Good luck with your interview! 🚀**

