# Stage 02 - Technology Stack Selection

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice

## Technology Stack Rationale

### Backend Runtime & Framework
**Selected:** Node.js 20 LTS + JavaScript (ES2022+)  
**Framework:** Express.js (for REST) + @grpc/grpc-js (for gRPC)

**Rationale:**
- ✅ Matches constraint: Node.js + JavaScript required
- ✅ Excellent ecosystem for async processing (200 QPS requirement)
- ✅ Native JavaScript support, no compilation step
- ✅ gRPC support via @grpc/grpc-js
- ✅ Worker threads for parallel query processing

**Alternatives Considered:**
- NestJS: More structure, but adds complexity for MVP timeline
- Fastify: Faster than Express, but Express is more mature

**Decision:** Express.js for REST endpoints, @grpc/grpc-js for gRPC services

---

### Database & Vector Storage
**Selected:** PostgreSQL 15+ with pgvector extension

**Rationale:**
- ✅ Supports 10M+ vectors requirement
- ✅ Native vector similarity search (pgvector)
- ✅ ACID compliance for audit trail
- ✅ Multi-tenant isolation via tenant_id
- ✅ JSONB support for flexible knowledge graph storage
- ✅ Railway supports PostgreSQL + pgvector

**Alternatives Considered:**
- Pinecone: Managed vector DB, but adds cost and vendor lock-in
- Weaviate: Good performance, but adds infrastructure complexity
- Qdrant: Self-hosted option, but PostgreSQL + pgvector is simpler

**Decision:** PostgreSQL + pgvector for unified data storage

---

### ORM / Database Client
**Selected:** Prisma ORM

**Rationale:**
- ✅ Excellent JavaScript support
- ✅ Schema-based database queries
- ✅ Migration management
- ✅ Multi-tenant query patterns
- ✅ Good performance with connection pooling

**Alternatives Considered:**
- TypeORM: More features, but heavier and more complex
- Sequelize: Mature, but Prisma is more modern
- Raw SQL with pg: Maximum control, but less maintainable

**Decision:** Prisma for schema management and developer experience

---

### Caching Layer
**Selected:** Redis 7+ (via Railway Redis service)

**Rationale:**
- ✅ Sub-millisecond latency for cache hits
- ✅ Critical for meeting ≤3s response time
- ✅ Supports complex data structures (JSON, sets)
- ✅ TTL support for cache invalidation
- ✅ Railway provides managed Redis

**Alternatives Considered:**
- Memcached: Simpler, but less features
- In-memory cache: Faster, but lost on restart

**Decision:** Redis for production-grade caching

---

### Message Queue / Event Streaming
**Selected:** Apache Kafka (via Railway Kafka or Confluent Cloud)

**Rationale:**
- ✅ Real-time event streaming for ≤5 min data freshness
- ✅ Durable event log for audit trail
- ✅ Supports multiple consumers (knowledge graph sync)
- ✅ High throughput for 200 QPS system

**Alternatives Considered:**
- RabbitMQ: Simpler, but less suited for event streaming
- Redis Pub/Sub: Lightweight, but not durable
- AWS SQS: Managed, but adds AWS dependency

**Decision:** Kafka for event-driven architecture

---

### gRPC Framework
**Selected:** @grpc/grpc-js + @grpc/proto-loader + Protocol Buffers

**Rationale:**
- ✅ Type-safe API contracts (Protobuf)
- ✅ High performance inter-service communication
- ✅ Native mTLS support
- ✅ Streaming support for large responses
- ✅ Code generation from .proto files

**Alternatives Considered:**
- gRPC-Web: For browser clients, but we use gRPC for backend only
- REST: Simpler, but doesn't meet performance requirements

**Decision:** gRPC with Protobuf for all inter-service communication

---

### AI/LLM Integration
**Selected:** OpenAI API (GPT-4/GPT-3.5-turbo) via openai npm package

**Rationale:**
- ✅ Industry-leading LLM quality
- ✅ Good API for RAG use cases
- ✅ Rate limiting and retry logic support
- ✅ Cost-effective for MVP

**Alternatives Considered:**
- Anthropic Claude: Good quality, but less mature API
- Local LLMs (Ollama): No API costs, but lower quality
- Azure OpenAI: Enterprise option, but adds complexity

**Decision:** OpenAI API with wrapper for rate limiting and fallback

---

### Embedding Generation
**Selected:** OpenAI text-embedding-ada-002 (via OpenAI API)

**Rationale:**
- ✅ Same vendor as LLM (simplifies integration)
- ✅ Good quality embeddings
- ✅ 1536 dimensions (good balance)
- ✅ Cost-effective

**Alternatives Considered:**
- sentence-transformers (local): No API costs, but requires GPU
- Cohere embeddings: Good quality, but adds vendor

**Decision:** OpenAI embeddings (can migrate to local later if needed)

---

### Authentication & Authorization
**Selected:** 
- **OAuth2/JWT:** jsonwebtoken + express-jwt for REST endpoints
- **mTLS:** @grpc/grpc-js built-in mTLS for gRPC

**Rationale:**
- ✅ Matches requirements (OAuth2/JWT for UI, mTLS for gRPC)
- ✅ Industry standard
- ✅ Multi-tenant token validation
- ✅ Railway supports mTLS certificates

**Decision:** OAuth2/JWT + mTLS as specified in requirements

---

### Testing Framework
**Selected:** 
- **Unit Tests:** Jest
- **Integration Tests:** Jest + Supertest (for REST) + @grpc/grpc-js (for gRPC)
- **E2E Tests:** Playwright (if frontend needed)

**Rationale:**
- ✅ TDD requirement (≥80% coverage)
- ✅ Jest excellent for Node.js/JavaScript
- ✅ Supertest for API testing
- ✅ Playwright for any UI components

**Decision:** Jest for unit/integration, Playwright for E2E

---

### CI/CD
**Selected:** GitHub Actions

**Rationale:**
- ✅ Matches template requirement
- ✅ Free for public repos
- ✅ Railway integration available
- ✅ Environment secrets management

**Decision:** GitHub Actions for CI/CD pipeline

---

### Monitoring & Logging
**Selected:**
- **Logging:** Winston + structured JSON logging
- **Monitoring:** Railway built-in metrics + custom Prometheus (optional)
- **Error Tracking:** Sentry (optional, for MVP)

**Rationale:**
- ✅ Structured logging for audit trail
- ✅ Railway provides basic monitoring
- ✅ Sentry for production error tracking

**Decision:** Winston for logging, Railway monitoring, Sentry optional

---

### Development Tools
**Selected:**
- **Code Quality:** ESLint + Prettier
- **Linting:** ESLint with JavaScript best practices
- **API Documentation:** Protobuf schemas + gRPC-Web UI (optional)

**Rationale:**
- ✅ Standard Node.js tooling
- ✅ Protobuf provides API documentation
- ✅ ESLint ensures code quality and consistency

**Decision:** Standard tooling for code quality

---

## Complete Tech Stack Summary

### Core Runtime
- **Runtime:** Node.js 20 LTS
- **Language:** JavaScript (ES2022+)
- **Framework:** Express.js (REST) + @grpc/grpc-js (gRPC)

### Data Layer
- **Database:** PostgreSQL 15+ with pgvector extension
- **ORM:** Prisma ORM
- **Cache:** Redis 7+
- **Message Queue:** Apache Kafka

### AI/ML
- **LLM:** OpenAI GPT-4/GPT-3.5-turbo
- **Embeddings:** OpenAI text-embedding-ada-002

### Authentication
- **REST:** OAuth2/JWT (jsonwebtoken, express-jwt)
- **gRPC:** mTLS (built-in)

### Testing
- **Unit/Integration:** Jest
- **E2E:** Playwright (if needed)

### CI/CD
- **Pipeline:** GitHub Actions
- **Deployment:** Railway (backend), Vercel (frontend if needed)

### Monitoring
- **Logging:** Winston
- **Monitoring:** Railway metrics
- **Error Tracking:** Sentry (optional)

### Development
- **Code Quality:** ESLint + Prettier
- **API Contracts:** Protocol Buffers (.proto files)
- **Code Generation:** Protobuf definitions generated into JavaScript using `protoc` and `@grpc/proto-loader`

---

## Constraints Validation

✅ **Budget:** All tools available on Railway + Vercel (free tier or existing budget)  
✅ **Timeline:** Standard stack enables 8-week MVP  
✅ **Tech Stack:** Node.js + JavaScript + PostgreSQL + gRPC as required  
✅ **Infrastructure:** Railway supports all components (PostgreSQL, Redis, Kafka, auto-scaling)

---

## Risk Mitigation

1. **OpenAI Rate Limits:** Wrapper with exponential backoff and queue management
2. **PostgreSQL Performance:** Connection pooling, query optimization, Redis caching
3. **Kafka Complexity:** Use managed service (Railway/Confluent) to reduce ops burden
4. **Multi-Tenant Isolation:** Database-level tenant_id in all queries, row-level security if needed

---

## Next Steps
- Generate API endpoint specifications (Protobuf)
- Design database schema (Prisma schema)
- Create integration patterns documentation

