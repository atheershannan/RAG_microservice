# Architecture Design Dialogue
**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice  
**Participants:** System Architect, Backend Lead, AI Engineer, Product Owner

## Context Scan

### Requirements Summary
- **Scale:** 100K active users, 200 QPS, 10M+ vectors
- **Performance:** ≤3s response time (90th percentile)
- **Integration:** gRPC with 9 EDUCORE microservices, Kafka events, REST for AI APIs
- **Storage:** PostgreSQL + PGVector, Redis caching
- **Security:** Multi-tenant, OAuth2/JWT, mTLS, GDPR compliance
- **Data Freshness:** ≤5 minutes sync via Kafka

### Constraints
- Node.js + JavaScript stack
- Railway + Vercel infrastructure
- MVP timeline: 8 weeks

## Architecture Proposals

### Proposal 1: Layered Microservice Architecture
**Architect:** "I propose a layered architecture with clear separation of concerns:

1. **API Gateway Layer** - gRPC server, REST endpoints for external AI services
2. **Application Layer** - Query processing, RAG orchestration, knowledge graph management
3. **Data Layer** - Vector database (PGVector), Redis cache, Kafka consumers
4. **Integration Layer** - gRPC clients for EDUCORE services, OpenAI API client

**Pros:**
- Clear separation of concerns
- Easy to test and maintain
- Scales horizontally

**Cons:**
- More moving parts
- Network latency between layers

**Trade-offs:** Acceptable given our performance requirements (3s allows for multi-layer processing)"

### Proposal 2: Event-Driven Architecture
**Backend Lead:** "Consider adding event-driven patterns:

- **Kafka Consumers** - Real-time knowledge graph updates
- **Event Sourcing** - Track all query events for audit trail
- **CQRS** - Separate read (query) and write (graph updates) paths

**Pros:**
- Natural fit for real-time sync requirements
- Better scalability for write-heavy operations
- Audit trail built-in

**Cons:**
- Eventual consistency complexity
- More complex debugging

**Trade-offs:** Worth it for data freshness requirements (≤5 min)"

### Proposal 3: Hybrid Approach
**AI Engineer:** "I recommend a hybrid:

**Core Architecture:**
- **gRPC API Server** - Main entry point for inter-service communication
- **RAG Query Engine** - Async processing with worker pool
- **Vector Retrieval Service** - Optimized PGVector queries with Redis caching
- **Knowledge Graph Manager** - Handles graph updates, versioning, provenance
- **AI Integration Service** - OpenAI API wrapper with rate limiting and retry logic

**Data Flow:**
1. Query arrives via gRPC
2. Auth & tenant validation
3. Query preprocessing (embedding generation)
4. Vector similarity search (cached when possible)
5. Knowledge graph context enrichment
6. LLM generation with retrieved context
7. Response formatting with citations

**Pros:**
- Optimized for RAG workloads
- Caching layer reduces latency
- Clear data flow

**Cons:**
- Requires careful cache invalidation strategy

**Trade-offs:**
- Best balance of performance and complexity
- Aligns with 200 QPS requirement"

## Consensus Decision

**Product Owner:** "The hybrid approach (Proposal 3) best meets our requirements:
- ✅ Performance targets (≤3s, 200 QPS)
- ✅ Data freshness (Kafka integration)
- ✅ Multi-tenant security
- ✅ MVP timeline (8 weeks)

**Architecture Decision:**
- **Pattern:** Hybrid Layered + Event-Driven
- **Components:**
  1. gRPC API Gateway (with mTLS)
  2. Query Processing Service (async workers)
  3. Vector Retrieval Service (PGVector + Redis)
  4. Knowledge Graph Manager (Kafka consumers)
  5. AI Integration Service (OpenAI wrapper)
  6. Audit & Compliance Service (GDPR, logging)

**Deployment:**
- Railway for backend services (auto-scaling)
- Vercel for any frontend components
- Separate services per tenant for isolation (optional, can share DB with proper isolation)

**Rationale:**
- Clear separation enables independent scaling
- Event-driven sync meets freshness requirements
- Caching reduces latency to meet 3s target
- Modular design fits MVP timeline"

## Final Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EDUCORE Microservices                    │
│  (Assessment, DevLab, Analytics, HR, Content Studio...)     │
└──────────────────────┬──────────────────────────────────────┘
                       │ gRPC (mTLS)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              RAG Microservice - API Gateway                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  gRPC Server (OAuth2/JWT validation, tenant routing) │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │       Query Processing Service (Async Workers)         │   │
│  │  - Query preprocessing & embedding                      │   │
│  │  - Tenant context injection                            │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │         Vector Retrieval Service                       │   │
│  │  - PGVector similarity search                          │   │
│  │  - Redis caching layer                                 │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │         Knowledge Graph Manager                        │   │
│  │  - Context enrichment                                  │   │
│  │  - Graph versioning                                    │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │         AI Integration Service                         │   │
│  │  - OpenAI API wrapper                                  │   │
│  │  - Rate limiting & retry logic                        │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │         Audit & Compliance Service                     │   │
│  │  - GDPR compliance (deletion, export)                 │   │
│  │  - Immutable audit trail                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │    Kafka     │     │
│  │ + PGVector   │  │   (Cache)    │  │  (Events)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Async Processing:** Query processing uses worker pool to handle 200 QPS
2. **Multi-Level Caching:** Redis for frequent queries, reduces DB load
3. **Event-Driven Sync:** Kafka ensures ≤5 min data freshness
4. **Tenant Isolation:** Database-level isolation with tenant_id in all queries
5. **Rate Limiting:** OpenAI API wrapper prevents rate limit issues
6. **Audit Trail:** All queries logged with immutable provenance

## Next Steps
- Finalize tech stack selection
- Define API endpoints (Protobuf)
- Design database schema
- Create integration patterns

