# Stage 04 - Backend TDD Plan

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice  
**Language:** JavaScript (ES2022+)

## TDD Principles

- **Test-First Development:** Write tests before implementation
- **Coverage Target:** ≥80% code coverage
- **Test Types:** Unit tests, Integration tests, E2E tests
- **Framework:** Jest for unit/integration, Supertest for API testing
- **Mocking:** Jest mocks for external dependencies (OpenAI, gRPC clients, DB)

## Test Structure

```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   ├── middleware/
│   ├── utils/
│   └── models/
├── integration/
│   ├── api/
│   ├── database/
│   └── external/
└── fixtures/
    ├── mock-data/
    └── test-helpers/
```

## Component Test Plans

### 1. gRPC API Gateway Service

#### Unit Tests
**File:** `tests/unit/services/gateway.service.test.js`

**Test Cases:**
- ✅ `handleQuery()` - Validates request, routes to Query Processing Service
- ✅ `handlePersonalizedQuery()` - Routes to Personalized Assistance Service
- ✅ `handleAssessmentHint()` - Routes to Assessment Support Service
- ✅ `handleDevLabSupport()` - Routes to DevLab Support Service
- ✅ `authenticateRequest()` - Validates mTLS/OAuth2 tokens
- ✅ `extractTenantId()` - Extracts tenant from certificate/metadata
- ✅ `logAuditTrail()` - Logs all requests to audit service
- ✅ Error handling: Invalid auth, missing tenant, malformed requests

**Coverage Target:** 85%

**Mocks:**
- Auth Service
- Query Processing Service
- Audit Service
- gRPC clients

---

### 2. Query Processing Service

#### Unit Tests
**File:** `tests/unit/services/query-processing.service.test.js`

**Test Cases:**
- ✅ `processQuery()` - Main query processing flow
- ✅ `generateEmbedding()` - Calls OpenAI embeddings API
- ✅ `preprocessQuery()` - Query normalization and cleaning
- ✅ `injectTenantContext()` - Adds tenant_id to query context
- ✅ `formatResponse()` - Formats response with citations
- ✅ `handleCacheHit()` - Returns cached response
- ✅ `handleCacheMiss()` - Processes query and caches result
- ✅ Error handling: OpenAI API errors, timeout, rate limiting
- ✅ Retry logic: Exponential backoff for failed API calls

**Coverage Target:** 85%

**Mocks:**
- OpenAI API client
- Redis cache
- Vector Retrieval Service
- Knowledge Graph Manager

**Integration Tests:**
- ✅ `tests/integration/services/query-processing.integration.test.js`
- End-to-end query flow with real Redis (test container)
- Mock OpenAI API responses

---

### 3. Access Control Service

#### Unit Tests
**File:** `tests/unit/services/access-control.service.test.js`

**Test Cases:**
- ✅ `checkRBAC()` - Role-based access control evaluation
- ✅ `checkABAC()` - Attribute-based access control evaluation
- ✅ `checkContentPermissions()` - Fine-grained content permissions
- ✅ `evaluatePolicies()` - Combined policy evaluation (RBAC ∩ ABAC ∩ Content)
- ✅ `applyFieldMasking()` - Field-level masking based on role
- ✅ `getAccessibleContent()` - Returns only accessible content
- ✅ `logAccessAttempt()` - Logs access attempts for audit
- ✅ Error handling: Missing policies, invalid roles, permission denied

**Coverage Target:** 90%

**Test Fixtures:**
- `fixtures/mock-data/rbac-policies.json`
- `fixtures/mock-data/abac-policies.json`
- `fixtures/mock-data/content-permissions.json`

**Integration Tests:**
- ✅ `tests/integration/services/access-control.integration.test.js`
- Real database queries with test policies
- Multi-tenant isolation verification

---

### 4. Vector Retrieval Service

#### Unit Tests
**File:** `tests/unit/services/vector-retrieval.service.test.js`

**Test Cases:**
- ✅ `vectorSimilaritySearch()` - PGVector similarity search
- ✅ `getTopK()` - Retrieves top-K similar vectors
- ✅ `checkCache()` - Checks Redis cache for vectors
- ✅ `cacheResults()` - Caches vector search results
- ✅ `filterByPermissions()` - Filters results by access control
- ✅ Error handling: Database errors, cache failures, empty results

**Coverage Target:** 85%

**Mocks:**
- PostgreSQL client (Prisma)
- Redis cache
- Access Control Service

**Integration Tests:**
- ✅ `tests/integration/services/vector-retrieval.integration.test.js`
- Real PostgreSQL + pgvector queries (test database)
- Vector similarity search with actual embeddings

---

### 5. Knowledge Graph Manager

#### Unit Tests
**File:** `tests/unit/services/knowledge-graph-manager.service.test.js`

**Test Cases:**
- ✅ `syncGraph()` - Synchronizes knowledge graph from Kafka events
- ✅ `updateGraph()` - Updates graph nodes and edges
- ✅ `enrichContext()` - Enriches query context with graph data
- ✅ `getGraphVersion()` - Returns current graph version
- ✅ `handleKafkaEvent()` - Processes Kafka events
- ✅ `verifySyncTime()` - Verifies sync time < 5 minutes
- ✅ Error handling: Kafka errors, sync failures, version conflicts

**Coverage Target:** 80%

**Mocks:**
- Kafka consumer
- PostgreSQL client
- EDUCORE microservice clients (gRPC)

**Integration Tests:**
- ✅ `tests/integration/services/knowledge-graph.integration.test.js`
- Real Kafka events (test Kafka instance)
- Graph synchronization verification

---

### 6. AI Integration Service

#### Unit Tests
**File:** `tests/unit/services/ai-integration.service.test.js`

**Test Cases:**
- ✅ `generateEmbedding()` - Calls OpenAI embeddings API
- ✅ `generateRAGResponse()` - Calls OpenAI API with context
- ✅ `handleRateLimit()` - Implements rate limiting and queuing
- ✅ `retryWithBackoff()` - Exponential backoff retry logic
- ✅ `formatPrompt()` - Formats RAG prompt with context
- ✅ `parseResponse()` - Parses OpenAI API response
- ✅ Error handling: API errors, timeouts, rate limits, invalid responses

**Coverage Target:** 85%

**Mocks:**
- OpenAI API client
- Rate limiter

**Integration Tests:**
- ✅ `tests/integration/services/ai-integration.integration.test.js`
- Real OpenAI API calls (with test API key)
- Rate limiting verification

---

### 7. Personalized Assistance Service

#### Unit Tests
**File:** `tests/unit/services/personalized-assistance.service.test.js`

**Test Cases:**
- ✅ `getPersonalizedQuery()` - Generates personalized response
- ✅ `buildUserContext()` - Builds user context from multiple sources
- ✅ `getSkillGaps()` - Fetches skill gaps from Skills Engine
- ✅ `getLearningProgress()` - Fetches progress from Learner AI
- ✅ `getAssessmentHistory()` - Fetches assessment results
- ✅ `getDevLabProgress()` - Fetches DevLab practice progress
- ✅ `generateRecommendations()` - Generates personalized recommendations
- ✅ `analyzeSkillGaps()` - Analyzes skill gaps for recommendations
- ✅ Error handling: Service failures, missing data, timeout

**Coverage Target:** 85%

**Mocks:**
- Skills Engine (gRPC client)
- Learner AI (gRPC client)
- Assessment Service (gRPC client)
- DevLab Service (gRPC client)
- Query Processing Service

**Integration Tests:**
- ✅ `tests/integration/services/personalized-assistance.integration.test.js`
- Real gRPC calls to mock EDUCORE services
- End-to-end personalized query flow

---

### 8. Audit & Compliance Service

#### Unit Tests
**File:** `tests/unit/services/audit.service.test.js`

**Test Cases:**
- ✅ `logQuery()` - Logs query requests
- ✅ `logAccessAttempt()` - Logs access control decisions
- ✅ `logPermissionChange()` - Logs permission modifications
- ✅ `exportAuditLog()` - Exports audit logs for GDPR compliance
- ✅ `deleteUserData()` - Deletes user data (GDPR right to deletion)
- ✅ `retainAuditTrail()` - Retains audit trail for 7 years
- ✅ Error handling: Log failures, export errors, deletion failures

**Coverage Target:** 90%

**Mocks:**
- PostgreSQL client
- File system (for exports)

**Integration Tests:**
- ✅ `tests/integration/services/audit.integration.test.js`
- Real database audit logging
- GDPR export functionality

---

## API Integration Tests

### gRPC API Tests
**File:** `tests/integration/api/grpc-api.test.js`

**Test Cases:**
- ✅ Query Service - Full query flow
- ✅ Personalized Query Service - Personalized responses
- ✅ Assessment Support Service - Hint generation
- ✅ DevLab Support Service - Technical support
- ✅ Analytics Explanation Service - Analytics explanations
- ✅ Content Retrieval Service - Content retrieval
- ✅ Knowledge Graph Service - Graph context
- ✅ Access Control Service - Permission checks
- ✅ GDPR Service - Data deletion/export
- ✅ Health Service - Health checks

**Coverage Target:** 80%

**Test Setup:**
- gRPC server instance
- Test database
- Mock external services

---

## Database Integration Tests

### Prisma & PostgreSQL Tests
**File:** `tests/integration/database/prisma.test.js`

**Test Cases:**
- ✅ Database connection and migrations
- ✅ Multi-tenant data isolation
- ✅ Vector storage and retrieval (pgvector)
- ✅ Knowledge graph queries
- ✅ Audit log storage
- ✅ Transaction handling
- ✅ Connection pooling

**Coverage Target:** 80%

**Test Setup:**
- Test PostgreSQL database (Docker container)
- Prisma migrations
- Test data fixtures

---

## External Service Integration Tests

### EDUCORE Microservices Integration
**File:** `tests/integration/external/educore-services.test.js`

**Test Cases:**
- ✅ Skills Engine gRPC client
- ✅ Learner AI gRPC client
- ✅ Assessment Service gRPC client
- ✅ DevLab Service gRPC client
- ✅ Content Studio gRPC client
- ✅ Error handling and retries
- ✅ mTLS certificate validation

**Coverage Target:** 75%

**Test Setup:**
- Mock gRPC servers (grpc-mock)
- Test certificates for mTLS

---

## Test Fixtures & Helpers

### Mock Data
**File:** `tests/fixtures/mock-data/`

- `users.json` - Test user data
- `queries.json` - Sample queries
- `responses.json` - Expected responses
- `rbac-policies.json` - RBAC test policies
- `abac-policies.json` - ABAC test policies
- `content-permissions.json` - Content permissions
- `knowledge-graph.json` - Graph test data

### Test Helpers
**File:** `tests/fixtures/test-helpers/`

- `auth-helper.js` - Authentication test helpers
- `db-helper.js` - Database test helpers
- `grpc-helper.js` - gRPC test helpers
- `mock-factory.js` - Mock object factories
- `test-data-builder.js` - Test data builders

---

## Coverage Goals

### Overall Coverage
- **Target:** ≥80% code coverage
- **Critical Paths:** ≥90% coverage
- **Utilities:** ≥75% coverage

### Coverage by Component
- gRPC API Gateway: 85%
- Query Processing: 85%
- Access Control: 90%
- Vector Retrieval: 85%
- Knowledge Graph Manager: 80%
- AI Integration: 85%
- Personalized Assistance: 85%
- Audit & Compliance: 90%

### Coverage Tools
- **Jest Coverage:** Built-in coverage reporting
- **Coverage Gates:** CI/CD fails if coverage < 80%
- **Coverage Reports:** HTML reports generated in CI

---

## Test Execution Strategy

### Local Development
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm run test

# Coverage
npm run test:coverage
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
- Run unit tests
- Run integration tests (with test containers)
- Generate coverage report
- Fail if coverage < 80%
- Publish coverage report
```

### Test Environment
- **Unit Tests:** Fast, no external dependencies
- **Integration Tests:** Test containers (PostgreSQL, Redis, Kafka)
- **E2E Tests:** Full stack with mocked external services

---

## Mocking Strategy

### External Services
- **OpenAI API:** Mock with `jest.mock()` and response fixtures
- **EDUCORE Services:** Mock gRPC clients with `grpc-mock`
- **Kafka:** Mock with `kafkajs` test utilities
- **Redis:** Use `ioredis-mock` for unit tests, real Redis for integration

### Database
- **Unit Tests:** Prisma mock with `@mikro-orm/mock`
- **Integration Tests:** Real PostgreSQL test database

### File System
- **Audit Logs:** Mock file system with `mock-fs`

---

## Performance Testing

### Load Tests
**File:** `tests/performance/load.test.js`

**Test Cases:**
- ✅ 200 QPS query processing
- ✅ Response time ≤ 3 seconds (90th percentile)
- ✅ Concurrent requests handling
- ✅ Cache hit rate verification
- ✅ Database connection pooling

**Tools:**
- Artillery.js or k6 for load testing
- Performance monitoring

---

## Summary

- **Total Test Files:** ~30 test files
- **Unit Tests:** ~200 test cases
- **Integration Tests:** ~50 test cases
- **Coverage Target:** ≥80% overall
- **Test Framework:** Jest + Supertest
- **Test Execution:** Local + CI/CD

**Next Steps:**
- Implement test structure
- Write first test cases
- Set up CI/CD test pipeline
- Begin TDD implementation


