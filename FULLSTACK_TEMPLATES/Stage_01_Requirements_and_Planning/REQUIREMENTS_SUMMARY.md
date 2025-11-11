# Stage 01 - Requirements & Planning Summary

## Project Overview
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice  
**Purpose:** Central contextual intelligence layer for EDUCORE learning ecosystem  
**Status:** Stage 01 Complete ✅

## Key Requirements Summary

### Target Users
- **API Consumers:** Other EDUCORE microservices (Assessment, DevLab, Learning Analytics, etc.)
- **End Users:** Learners, Trainers, HR/Managers (via chatbot embedded in microservice UIs)
- **System Administrators:** Monitoring, logging, and permission management

### Core Functionality
1. **Unified Knowledge Graph** - Integration with all 9 EDUCORE microservices
2. **RAG Query Engine** - Contextual Q&A with natural language processing
3. **Assessment Support** - Real-time hints and explanations during exams
4. **DevLab Support** - Technical troubleshooting and code assistance
5. **Analytics Explanations** - Contextual explanations for dashboards and reports
6. **HR Report Navigation** - Dynamic report explanations and cross-navigation
7. **Content Retrieval** - Textual and media-linked content from Content Studio

### Non-Functional Requirements

#### Performance
- **Response Time:** ≤ 3 seconds for 90% of queries
- **Throughput:** ~200 queries per second (QPS)
- **Scale:** 100,000 active users, 10M+ vectors
- **Data Freshness:** 95% of updates within ≤ 5 minutes

#### Security & Compliance
- **GDPR:** Full compliance (consent management, right to deletion)
- **Multi-Tenancy:** Tenant isolation and data privacy
- **Authentication:** OAuth2/JWT for UI, mTLS for gRPC
- **Audit Trail:** Immutable logging with 7-year provenance retention
- **Access Control:**
  - **RBAC:** Role-based (learner, trainer, HR, admin)
  - **ABAC:** Attribute-based (department, region, compliance flags)
  - **Fine-grained:** Content-level permissions (lessons, assessments, documents)
  - **Field-level masking:** Role-based data visibility
  - **Permission-aware responses:** All chatbot responses respect permissions

#### Integration
- **Protocol:** gRPC for inter-service communication
- **External APIs:** REST for AI services (OpenAI, etc.)
- **Real-time:** Kafka for event streaming (≤5 min sync)
- **Storage:** Redis (caching), PostgreSQL + PGVector (persistence)
- **Contracts:** Protobuf-defined API contracts

### Constraints
- **Budget:** Within existing Railway + Vercel resources
- **Timeline:** MVP in 8 weeks
- **Tech Stack:** Node.js + JavaScript + PostgreSQL + gRPC
- **Infrastructure:** Multi-tenant with auto-scaling on Railway

### Risks
1. High complexity in Knowledge Graph management and versioning
2. API rate limits from external AI services (OpenAI)
3. Authentication challenges in multi-tenant environment
4. Dependency on gRPC contract changes in other microservices

### Success Metrics (KPIs/OKRs)
- **Answer Accuracy:** ≥ 85%
- **Response Time:** ≤ 3 seconds (90th percentile)
- **Data Freshness:** ≤ 5 minutes from source update
- **Adoption Rate:** ≥ 70% active chatbot users
- **Integration Reliability:** ≥ 99.5% gRPC call success rate
- **User Satisfaction:** ≥ 4.5 / 5 feedback rating

## Additional Requirements (Added 2025-01-27)

### Personalized Assistance
- **Adapt responses based on:** user role, profile, skill gaps, learning progress
- **Suggest personalized content:** courses, exercises, assessments, mentors
- **Real-time data integration:** Learner AI, Skills Engine, Assessment, DevLab

### Access Control
- **RBAC:** Role-based access control (learner, trainer, HR, admin)
- **ABAC:** Attribute-based access control (department, region, compliance flags)
- **Fine-grained permissions:** Content-level (lessons, assessments, documents)
- **Field-level masking:** Learners see own scores, managers see aggregated data
- **Permission propagation:** All chatbot responses respect permissions
- **Audit & compliance:** All interactions logged for governance

## User Stories Summary

**Total Stories:** 20 (updated from 12)  
**Total Story Points:** 177 (updated from 113)  
**Epics:** 9 (updated from 7)

### Epic Breakdown
1. **Core RAG Query Engine** (2 stories, 34 points)
2. **Assessment & DevLab Support** (2 stories, 16 points)
3. **Analytics & Reporting** (2 stories, 10 points)
4. **Content Studio Integration** (1 story, 8 points)
5. **Authentication & Security** (2 stories, 21 points)
6. **Performance & Scalability** (2 stories, 21 points)
7. **Monitoring & Observability** (1 story, 5 points)
8. **Personalized Assistance** (2 stories, 21 points) - NEW
9. **Access Control & Permissions** (6 stories, 63 points) - NEW

### MVP Scope (8 weeks)
- Core RAG functionality (US-001, US-002)
- Authentication & Security (US-008, US-009)
- High-throughput processing (US-010)
- Assessment & DevLab support (US-003, US-004)
- Basic monitoring (US-012)
- Personalized Query Responses (US-013) - NEW
- Access Control (US-015, US-016, US-017, US-018, US-019) - NEW

## Next Stage
**Stage 02:** System & Architecture
- System architecture design
- Technology stack finalization
- API endpoint specifications
- Database schema design
- Integration patterns

