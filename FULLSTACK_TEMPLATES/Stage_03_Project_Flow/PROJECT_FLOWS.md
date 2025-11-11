# Stage 03 - Project Flow & Interaction Logic

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice

## System Flow Diagrams

### 1. Core Query Processing Flow

```mermaid
sequenceDiagram
    participant Client as Client/API Consumer
    participant Gateway as gRPC API Gateway
    participant Auth as Auth Service
    participant QueryProc as Query Processing Service
    participant AccessCtrl as Access Control Service
    participant VectorRet as Vector Retrieval Service
    participant GraphMgr as Knowledge Graph Manager
    participant AIService as AI Integration Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL + PGVector

    Client->>Gateway: Query Request (query, tenant_id, user_id)
    Gateway->>Auth: Validate Authentication (mTLS/OAuth2)
    Auth-->>Gateway: Auth Valid / Invalid
    
    alt Auth Invalid
        Gateway-->>Client: UNAUTHENTICATED Error
    else Auth Valid
        Gateway->>AccessCtrl: Check Permissions (RBAC, ABAC)
        AccessCtrl->>DB: Query Permission Policies
        DB-->>AccessCtrl: Permission Policies
        AccessCtrl-->>Gateway: Permission Result
        
        alt Permission Denied
            Gateway-->>Client: PERMISSION_DENIED Error
        else Permission Granted
            Gateway->>QueryProc: Forward Query Request
            QueryProc->>Cache: Check Cache (query + tenant_id + user_id)
            
            alt Cache Hit
                Cache-->>QueryProc: Cached Response
                QueryProc-->>Gateway: Cached Response
            else Cache Miss
                QueryProc->>AIService: Generate Embedding (query)
                AIService->>AIService: Call OpenAI Embeddings API
                AIService-->>QueryProc: Query Embedding Vector
                
                QueryProc->>VectorRet: Vector Similarity Search
                VectorRet->>Cache: Check Vector Cache
                
                alt Vector Cache Hit
                    Cache-->>VectorRet: Cached Vectors
                else Vector Cache Miss
                    VectorRet->>DB: PGVector Similarity Search
                    DB-->>VectorRet: Top-K Similar Vectors
                    VectorRet->>Cache: Cache Results
                end
                
                VectorRet-->>QueryProc: Retrieved Sources
                QueryProc->>AccessCtrl: Filter Sources by Permissions
                AccessCtrl-->>QueryProc: Filtered Sources
                
                QueryProc->>GraphMgr: Enrich with Knowledge Graph
                GraphMgr->>DB: Query Graph Context
                DB-->>GraphMgr: Graph Relationships
                GraphMgr-->>QueryProc: Enriched Context
                
                QueryProc->>AIService: Generate RAG Response
                AIService->>AIService: Call OpenAI API (with context)
                AIService-->>QueryProc: Generated Answer
                
                QueryProc->>AccessCtrl: Apply Field Masking
                AccessCtrl-->>QueryProc: Masked Response
                
                QueryProc->>Cache: Cache Response
                QueryProc-->>Gateway: Final Response
            end
            
            Gateway->>DB: Log Audit Trail
            Gateway-->>Client: Query Response (with citations)
        end
    end
```

### 2. Personalized Query Flow

```mermaid
sequenceDiagram
    participant Learner as Learner
    participant Gateway as gRPC API Gateway
    participant Personalize as Personalized Assistance Service
    participant SkillsEngine as Skills Engine (gRPC)
    participant LearnerAI as Learner AI (gRPC)
    participant Assessment as Assessment Service (gRPC)
    participant DevLab as DevLab Service (gRPC)
    participant QueryProc as Query Processing Service

    Learner->>Gateway: Personalized Query (query, user_id, tenant_id)
    Gateway->>Personalize: Get Personalized Query
    Personalize->>SkillsEngine: Get User Skill Gaps
    SkillsEngine-->>Personalize: Skill Gaps Data
    
    Personalize->>LearnerAI: Get Learning Progress
    LearnerAI-->>Personalize: Progress Data
    
    Personalize->>Assessment: Get Assessment History
    Assessment-->>Personalize: Assessment Results
    
    Personalize->>DevLab: Get DevLab Progress
    DevLab-->>Personalize: Practice Progress
    
    Personalize->>Personalize: Build User Context (role, profile, gaps, progress)
    Personalize->>QueryProc: Query with User Context
    QueryProc-->>Personalize: Contextual Answer
    
    Personalize->>Personalize: Generate Recommendations (courses, exercises, assessments, mentors)
    Personalize->>Personalize: Analyze Skill Gaps
    
    Personalize-->>Gateway: Personalized Response (answer + recommendations + skill gaps)
    Gateway-->>Learner: Personalized Query Response
```

### 3. Access Control Flow (RBAC + ABAC + Fine-grained)

```mermaid
sequenceDiagram
    participant User as User
    participant Gateway as gRPC API Gateway
    participant AccessCtrl as Access Control Service
    participant PolicyDB as Policy Database
    participant ContentDB as Content Database
    participant Audit as Audit Service

    User->>Gateway: Query Request (resource_id, action)
    Gateway->>AccessCtrl: Check Permissions
    
    AccessCtrl->>PolicyDB: Get RBAC Role Permissions
    PolicyDB-->>AccessCtrl: Role Permissions
    
    AccessCtrl->>PolicyDB: Get ABAC Attribute Policies
    PolicyDB-->>AccessCtrl: Attribute Policies (department, region, compliance)
    
    AccessCtrl->>PolicyDB: Get Fine-grained Content Permissions
    PolicyDB-->>AccessCtrl: Content-level Permissions
    
    AccessCtrl->>AccessCtrl: Evaluate All Policies (RBAC ∩ ABAC ∩ Content)
    
    alt Permission Granted
        AccessCtrl->>ContentDB: Retrieve Content
        ContentDB-->>AccessCtrl: Content Data
        AccessCtrl->>AccessCtrl: Apply Field-level Masking
        AccessCtrl-->>Gateway: Allowed + Masked Content
        Gateway->>Audit: Log Access (success)
        Audit->>Audit: Store Audit Log
    else Permission Denied
        AccessCtrl-->>Gateway: Permission Denied
        Gateway->>Audit: Log Access (denied)
        Audit->>Audit: Store Audit Log
        Gateway-->>User: PERMISSION_DENIED Error
    end
```

### 4. Knowledge Graph Sync Flow (Kafka Event-Driven)

```mermaid
sequenceDiagram
    participant Microservice as EDUCORE Microservice
    participant Kafka as Kafka Event Stream
    participant GraphMgr as Knowledge Graph Manager
    participant VectorRet as Vector Retrieval Service
    participant DB as PostgreSQL + PGVector
    participant Cache as Redis Cache

    Microservice->>Kafka: Publish Event (content_update, course_update, etc.)
    Kafka->>GraphMgr: Consume Event
    
    GraphMgr->>GraphMgr: Parse Event (entity_type, entity_id, changes)
    GraphMgr->>DB: Update Knowledge Graph
    DB-->>GraphMgr: Graph Updated
    
    GraphMgr->>VectorRet: Trigger Re-indexing
    VectorRet->>Microservice: Fetch Updated Content (gRPC)
    Microservice-->>VectorRet: Content Data
    
    VectorRet->>AIService: Generate Embeddings (new content)
    AIService-->>VectorRet: Embedding Vectors
    
    VectorRet->>DB: Update Vector Database
    DB-->>VectorRet: Vectors Updated
    
    VectorRet->>Cache: Invalidate Related Cache
    Cache-->>VectorRet: Cache Invalidated
    
    GraphMgr->>DB: Update Graph Version
    GraphMgr->>GraphMgr: Verify Sync (< 5 minutes)
    
    Note over GraphMgr,DB: Sync Complete - Data Freshness Maintained
```

### 5. Assessment Support Flow

```mermaid
sequenceDiagram
    participant Learner as Learner (in Assessment)
    participant Assessment as Assessment Microservice
    participant Gateway as RAG API Gateway
    participant QueryProc as Query Processing Service
    participant AccessCtrl as Access Control Service
    participant Audit as Audit Service

    Learner->>Assessment: Request Hint (question_id)
    Assessment->>Gateway: GetAssessmentHint (assessment_id, question_id, user_id)
    
    Gateway->>AccessCtrl: Check Assessment Access
    AccessCtrl-->>Gateway: Access Granted
    
    Gateway->>QueryProc: Process Hint Request
    QueryProc->>QueryProc: Generate Contextual Hint (no direct answer)
    QueryProc->>QueryProc: Retrieve Related Concepts
    QueryProc->>QueryProc: Get Related Content
    
    QueryProc-->>Gateway: Hint Response (hint, concepts, related_content)
    Gateway->>Audit: Log Hint Request (for integrity tracking)
    Audit->>Audit: Store Audit Log
    
    Gateway-->>Assessment: Hint Response
    Assessment-->>Learner: Display Hint (with integrity safeguards)
```

### 6. DevLab Technical Support Flow

```mermaid
sequenceDiagram
    participant Learner as Learner (in DevLab)
    participant DevLab as DevLab Microservice
    participant Gateway as RAG API Gateway
    participant QueryProc as Query Processing Service
    participant AIService as AI Integration Service

    Learner->>DevLab: Request Help (exercise_id, error_message)
    DevLab->>Gateway: GetTechnicalSupport (exercise_id, code, error, language)
    
    Gateway->>QueryProc: Process Technical Support Request
    QueryProc->>AIService: Analyze Code Error
    AIService->>AIService: Call OpenAI API (code review mode)
    AIService-->>QueryProc: Error Explanation
    
    QueryProc->>QueryProc: Generate Code Examples
    QueryProc->>QueryProc: Retrieve Best Practices
    QueryProc->>QueryProc: Get Related Learning Resources
    
    QueryProc-->>Gateway: Technical Support Response (explanation, examples, best_practices, resources)
    Gateway-->>DevLab: Support Response
    DevLab-->>Learner: Display Help (explanation + examples)
```

## User Journey Flows

### Persona 1: Learner - Personalized Learning Query

**Flow:**
1. Learner opens chatbot in Course Builder
2. Types: "What should I learn next based on my progress?"
3. System identifies user, retrieves:
   - Role: learner
   - Skill gaps from Skills Engine
   - Learning progress from Learner AI
   - Assessment results
   - DevLab progress
4. System generates personalized response with:
   - Answer tailored to their skill gaps
   - Course recommendations
   - Exercise suggestions
   - Skill gap analysis
5. Learner sees personalized recommendations
6. Learner clicks on a recommended course
7. System tracks interaction in audit log

**Error Paths:**
- User not authenticated → Redirect to login
- No skill gap data → Show general recommendations
- API timeout → Show cached recommendations
- Permission denied → Show error message

### Persona 2: Trainer - Content Discovery

**Flow:**
1. Trainer asks: "Find content about Python for beginners"
2. System checks RBAC (trainer role)
3. System checks ABAC (department, region)
4. System retrieves accessible content
5. System filters by fine-grained permissions
6. System applies field masking (trainers see aggregated data)
7. Trainer receives filtered content list
8. Trainer clicks on content
9. System logs access

**Error Paths:**
- Content restricted → Show: "This content is not available"
- No accessible content → Show: "No content found matching your permissions"
- Cache miss + DB timeout → Retry with exponential backoff

### Persona 3: HR Manager - Analytics Explanation

**Flow:**
1. HR Manager views dashboard with learning metrics
2. Clicks "Explain this metric" on a chart
3. System receives: ExplainAnalytics(metric_id, user_id, role=hr)
4. System checks permissions (HR role, aggregated data only)
5. System retrieves metric explanation
6. System applies field masking (no individual scores)
7. System generates explanation with:
   - Metric meaning
   - Organizational insights
   - Links to related reports
   - Recommendations
8. HR Manager sees explanation
9. System logs access for compliance

**Error Paths:**
- Permission denied → Show: "You don't have access to this metric"
- Metric not found → Show: "Metric not available"
- Graph sync delay → Show: "Data may be outdated"

### Persona 4: API Consumer (Assessment Microservice) - Real-time Hint

**Flow:**
1. Assessment microservice calls GetAssessmentHint
2. System validates mTLS certificate
3. System checks permissions (assessment context)
4. System generates hint (no direct answer)
5. System retrieves related concepts
6. System applies assessment-specific filtering
7. System returns hint response
8. System logs for exam integrity tracking

**Error Paths:**
- mTLS validation fails → Return UNAUTHENTICATED
- Hint generation timeout → Return cached hint
- Rate limit exceeded → Return 429 with retry-after

## State Transitions

### Query Processing State Machine

```
[Idle] 
  ↓ (Query Received)
[Authentication] 
  ↓ (Auth Valid) / ↓ (Auth Invalid → Error)
[Permission Check]
  ↓ (Permission Granted) / ↓ (Permission Denied → Error)
[Cache Check]
  ↓ (Cache Hit → Response) / ↓ (Cache Miss)
[Embedding Generation]
  ↓ (Embedding Ready)
[Vector Search]
  ↓ (Vectors Retrieved)
[Permission Filtering]
  ↓ (Sources Filtered)
[Graph Enrichment]
  ↓ (Context Enriched)
[LLM Generation]
  ↓ (Answer Generated)
[Field Masking]
  ↓ (Response Masked)
[Cache Update]
  ↓ (Cached)
[Response Ready]
```

### Access Control State Machine

```
[Request Received]
  ↓
[Extract User Context] (role, attributes, tenant)
  ↓
[Load RBAC Policies]
  ↓
[Load ABAC Policies]
  ↓
[Load Content Permissions]
  ↓
[Evaluate Policies] (RBAC ∩ ABAC ∩ Content)
  ↓
[Decision] → [Granted] / [Denied]
  ↓ (Granted)        ↓ (Denied)
[Apply Field Masking] [Log Denial]
  ↓
[Log Access]
  ↓
[Return Result]
```

## Error Handling & Retry Logic

### Error Categories

1. **Authentication Errors**
   - UNAUTHENTICATED: Invalid token/certificate
   - **Retry:** No (requires re-authentication)
   - **Action:** Log security event

2. **Authorization Errors**
   - PERMISSION_DENIED: Insufficient permissions
   - **Retry:** No
   - **Action:** Log access attempt, return error

3. **Rate Limiting**
   - RESOURCE_EXHAUSTED: Too many requests
   - **Retry:** Yes (exponential backoff: 1s, 2s, 4s, 8s)
   - **Action:** Return 429 with retry-after header

4. **External API Errors**
   - OpenAI API timeout/error
   - **Retry:** Yes (3 attempts with exponential backoff)
   - **Fallback:** Use cached response if available

5. **Database Errors**
   - Connection timeout
   - **Retry:** Yes (3 attempts)
   - **Fallback:** Serve from cache, log for async sync

6. **Cache Errors**
   - Redis unavailable
   - **Retry:** No
   - **Fallback:** Bypass cache, query DB directly

### Retry Strategy

```mermaid
graph TD
    A[Request Received] --> B{Check Cache}
    B -->|Hit| C[Return Cached]
    B -->|Miss| D[Process Request]
    D --> E{Success?}
    E -->|Yes| F[Cache Result]
    E -->|No| G{Retriable Error?}
    G -->|Yes| H{Retry Count < 3?}
    H -->|Yes| I[Wait Exponential Backoff]
    I --> D
    H -->|No| J[Return Error]
    G -->|No| J
    F --> K[Return Response]
```

## Data Flow Diagrams

### Query Request Data Flow

```
Input: QueryRequest
  ├─ query: string
  ├─ tenant_id: string
  ├─ user_id: string
  └─ context: QueryContext

Processing Pipeline:
  1. Authentication → Extract user_id, role, attributes
  2. Permission Evaluation → Filter accessible resources
  3. Query Embedding → Generate vector representation
  4. Vector Search → Retrieve top-K similar content
  5. Permission Filtering → Remove restricted sources
  6. Graph Enrichment → Add knowledge graph context
  7. LLM Generation → Generate answer with context
  8. Field Masking → Apply role-based masking
  9. Response Formatting → Add citations, metadata

Output: QueryResponse
  ├─ answer: string (masked, personalized)
  ├─ confidence: double
  ├─ sources: Source[] (filtered)
  ├─ access_info: AccessControlInfo
  └─ metadata: QueryMetadata
```

### Knowledge Graph Sync Data Flow

```
Input: Kafka Event
  ├─ event_type: "content_update" | "course_update" | "skill_update"
  ├─ entity_id: string
  ├─ changes: ChangeSet
  └─ timestamp: ISO 8601

Processing Pipeline:
  1. Event Consumption → Parse Kafka message
  2. Graph Update → Update knowledge graph in DB
  3. Content Fetch → Fetch updated content from microservice
  4. Embedding Generation → Generate new embeddings
  5. Vector Update → Update vector database
  6. Cache Invalidation → Invalidate related cache entries
  7. Version Update → Update graph version

Output: Sync Complete
  ├─ graph_version: string
  ├─ sync_time: ISO 8601
  └─ data_freshness: < 5 minutes
```

## Summary

- **Total Flows Documented:** 6 system flows, 4 user journeys
- **State Machines:** 2 (Query Processing, Access Control)
- **Error Handling:** 6 error categories with retry strategies
- **Data Flows:** 2 (Query Request, Knowledge Graph Sync)

**Next Steps:**
- Stage 04: Backend (TDD Planning)
- Database schema design
- API implementation planning


