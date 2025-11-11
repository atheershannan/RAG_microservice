# API Endpoints Specification

**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice  
**Protocol:** gRPC (with Protocol Buffers)

## Base Configuration

- **Base URL:** `{{API_URL}}` (gRPC endpoint)
- **Authentication:** 
  - **gRPC:** mTLS (mutual TLS)
  - **REST (if needed):** `Bearer {{ENV_TOKEN}}` (OAuth2/JWT)
- **Version:** `v1`
- **Tenant Isolation:** All requests include `tenant_id` in metadata

## gRPC Services

**Total Services:** 10 (updated from 8)

### 1. RAG Query Service
**Service:** `rag.v1.QueryService`

#### Query (US-001: Contextual Query Processing)
**RPC:** `Query(QueryRequest) returns (QueryResponse)`

**Note:** This endpoint automatically applies access control (RBAC, ABAC, fine-grained permissions) and field-level masking. For personalized responses, use `PersonalizedAssistanceService.GetPersonalizedQuery`.

**Request:**
```protobuf
message QueryRequest {
  string query = 1;                    // Natural language question
  string tenant_id = 2;                // Tenant identifier (from mTLS cert)
  optional QueryContext context = 3;    // Optional context (user_id, session_id)
  optional QueryOptions options = 4;    // Query preferences
}

message QueryContext {
  string user_id = 1;                  // Required for access control and personalization
  string session_id = 2;
  repeated string tags = 3;            // Content tags for filtering
}

message QueryOptions {
  int32 max_results = 1;               // Max number of sources (default: 5)
  double min_confidence = 2;          // Min confidence score (default: 0.7)
  bool include_metadata = 3;           // Include source metadata (default: true)
}
```

**Response:**
```protobuf
message QueryResponse {
  string answer = 1;                   // Generated answer (filtered by permissions)
  double confidence = 2;               // Overall confidence score (0-1)
  repeated Source sources = 3;         // Source citations (filtered by permissions)
  QueryMetadata metadata = 4;          // Query metadata
  optional AccessControlInfo access_info = 5; // Access control information
}

message AccessControlInfo {
  repeated string filtered_sources = 1; // Source IDs filtered due to permissions
  repeated string masked_fields = 2;    // Field names that were masked
  bool personalized = 3;                // Whether personalization was applied
}

message Source {
  string id = 1;                       // Source ID
  string title = 2;                    // Source title
  string content_snippet = 3;          // Relevant snippet
  string source_type = 4;              // "course", "lesson", "assessment", etc.
  string source_url = 5;               // Direct link to source
  double relevance_score = 6;           // Relevance score (0-1)
  map<string, string> metadata = 7;    // Additional metadata
}

message QueryMetadata {
  int64 processing_time_ms = 1;        // Processing time in milliseconds
  int32 sources_retrieved = 2;         // Number of sources retrieved
  bool cached = 3;                     // Whether response was cached
  string model_version = 4;            // LLM model version used
}
```

---

#### BatchQuery (High-Throughput Support - US-010)
**RPC:** `BatchQuery(BatchQueryRequest) returns (BatchQueryResponse)`

**Request:**
```protobuf
message BatchQueryRequest {
  repeated QueryRequest queries = 1;    // Multiple queries
  string tenant_id = 2;
}
```

**Response:**
```protobuf
message BatchQueryResponse {
  repeated QueryResponse responses = 1; // Responses in same order
  BatchMetadata metadata = 2;
}

message BatchMetadata {
  int64 total_processing_time_ms = 1;
  int32 successful_queries = 2;
  int32 failed_queries = 3;
}
```

---

### 2. Assessment Support Service
**Service:** `rag.v1.AssessmentSupportService`

#### GetAssessmentHint (US-003: Real-time Assessment Support)
**RPC:** `GetAssessmentHint(AssessmentHintRequest) returns (AssessmentHintResponse)`

**Request:**
```protobuf
message AssessmentHintRequest {
  string assessment_id = 1;           // Assessment identifier
  string question_id = 2;              // Question identifier
  string tenant_id = 3;
  string user_id = 4;
  optional string user_answer = 5;      // User's current answer (if applicable)
  HintLevel level = 6;                 // Hint level (subtle, moderate, detailed)
}

enum HintLevel {
  SUBTLE = 0;                          // Minimal hint
  MODERATE = 1;                        // Moderate guidance
  DETAILED = 2;                        // Detailed explanation (may not be allowed)
}
```

**Response:**
```protobuf
message AssessmentHintResponse {
  string hint = 1;                     // Contextual hint (no direct answer)
  repeated string concept_references = 2; // Related concepts to review
  repeated Source related_content = 3;  // Related learning content
  bool answer_revealed = 4;           // Whether answer was revealed (should be false)
  AuditInfo audit = 5;                 // Audit trail for compliance
}
```

---

### 3. DevLab Support Service
**Service:** `rag.v1.DevLabSupportService`

#### GetTechnicalSupport (US-004: DevLab Technical Support)
**RPC:** `GetTechnicalSupport(TechnicalSupportRequest) returns (TechnicalSupportResponse)`

**Request:**
```protobuf
message TechnicalSupportRequest {
  string exercise_id = 1;              // DevLab exercise identifier
  string tenant_id = 2;
  string user_id = 3;
  string code = 4;                     // User's code (if applicable)
  string error_message = 5;            // Error message (if applicable)
  string language = 6;                  // Programming language
  SupportType type = 7;                // Type of support needed
}

enum SupportType {
  ERROR_EXPLANATION = 0;                // Explain an error
  CODE_REVIEW = 1;                     // Review code quality
  BEST_PRACTICES = 2;                  // Suggest best practices
  CONCEPT_EXPLANATION = 3;              // Explain a concept
}
```

**Response:**
```protobuf
message TechnicalSupportResponse {
  string explanation = 1;              // Technical explanation
  repeated CodeExample examples = 2;   // Code examples
  repeated string best_practices = 3;   // Best practices
  repeated Source related_resources = 4; // Related learning resources
  AuditInfo audit = 5;                 // Audit trail
}

message CodeExample {
  string code = 1;
  string language = 2;
  string description = 3;
}
```

---

### 4. Analytics Explanation Service
**Service:** `rag.v1.AnalyticsExplanationService`

#### ExplainAnalytics (US-005: Learning Analytics Explanations)
**RPC:** `ExplainAnalytics(AnalyticsExplanationRequest) returns (AnalyticsExplanationResponse)`

**Request:**
```protobuf
message AnalyticsExplanationRequest {
  string metric_id = 1;                // Analytics metric identifier
  string tenant_id = 2;
  string user_id = 3;                  // Optional: for personalized explanations
  AnalyticsContext context = 4;        // Context about what needs explanation
}

message AnalyticsContext {
  string dashboard_id = 1;            // Dashboard identifier
  string visualization_type = 2;       // "chart", "table", "metric", etc.
  map<string, string> data = 3;        // Relevant data points
}
```

**Response:**
```protobuf
message AnalyticsExplanationResponse {
  string explanation = 1;              // Explanation of the metric/visualization
  repeated string recommendations = 2; // Actionable recommendations
  repeated ReportLink report_links = 3; // Links to related reports
  map<string, string> insights = 4;    // Key insights
}

message ReportLink {
  string report_id = 1;
  string title = 2;
  string url = 3;
  string description = 4;
}
```

---

#### ExplainHRReport (US-006: HR Report Explanations & Navigation)
**RPC:** `ExplainHRReport(HRReportExplanationRequest) returns (HRReportExplanationResponse)`

**Request:**
```protobuf
message HRReportExplanationRequest {
  string report_id = 1;                // HR report identifier
  string tenant_id = 2;
  string user_role = 3;                // "hr", "manager", "executive"
  repeated string section_ids = 4;     // Specific sections to explain
  bool generate_summary = 5;           // Whether to generate executive summary
}
```

**Response:**
```protobuf
message HRReportExplanationResponse {
  string explanation = 1;              // Explanation of the report
  optional string executive_summary = 2; // Executive summary (if requested)
  repeated ReportLink related_reports = 3; // Navigation links to related reports
  map<string, string> key_metrics = 4;  // Key metrics explained
  repeated string recommendations = 5;   // Strategic recommendations
}
```

---

### 5. Content Retrieval Service
**Service:** `rag.v1.ContentRetrievalService`

#### RetrieveContent (US-007: Content Retrieval with Media Links)
**RPC:** `RetrieveContent(ContentRetrievalRequest) returns (ContentRetrievalResponse)`

**Request:**
```protobuf
message ContentRetrievalRequest {
  string query = 1;                    // Search query
  string tenant_id = 2;
  repeated ContentType content_types = 3; // Types to retrieve
  int32 max_results = 4;               // Max results (default: 10)
}

enum ContentType {
  TEXT = 0;
  VIDEO = 1;
  IMAGE = 2;
  PRESENTATION = 3;
  CODE = 4;
  MIND_MAP = 5;
  SUMMARY = 6;
}
```

**Response:**
```protobuf
message ContentRetrievalResponse {
  repeated ContentItem items = 1;       // Retrieved content items
  int32 total_results = 2;             // Total available results
}

message ContentItem {
  string id = 1;
  string title = 2;
  string description = 3;
  ContentType type = 4;
  string content_url = 5;              // Direct link to content
  string thumbnail_url = 6;             // Thumbnail URL (if applicable)
  string content_preview = 7;          // Text preview
  map<string, string> metadata = 8;     // Additional metadata
  double relevance_score = 9;           // Relevance score (0-1)
}
```

---

### 6. Knowledge Graph Service
**Service:** `rag.v1.KnowledgeGraphService`

#### GetGraphContext (US-002: Knowledge Graph Integration)
**RPC:** `GetGraphContext(GraphContextRequest) returns (GraphContextResponse)`

**Request:**
```protobuf
message GraphContextRequest {
  string entity_id = 1;                // Entity identifier (skill, course, etc.)
  string entity_type = 2;              // "skill", "course", "user", etc.
  string tenant_id = 3;
  int32 max_depth = 4;                 // Max graph traversal depth (default: 2)
}
```

**Response:**
```protobuf
message GraphContextResponse {
  GraphNode entity = 1;                 // Requested entity
  repeated GraphNode related_entities = 2; // Related entities
  repeated GraphEdge relationships = 3; // Relationships
  string graph_version = 4;             // Graph version identifier
}

message GraphNode {
  string id = 1;
  string type = 2;
  string name = 3;
  map<string, string> properties = 4;
}

message GraphEdge {
  string from_id = 1;
  string to_id = 2;
  string relationship_type = 3;
  double weight = 4;                    // Relationship strength
}
```

---

### 7. GDPR Compliance Service
**Service:** `rag.v1.GDPRService`

#### DeleteUserData (US-009: GDPR Compliance - Right to Deletion)
**RPC:** `DeleteUserData(DeleteUserDataRequest) returns (DeleteUserDataResponse)`

**Request:**
```protobuf
message DeleteUserDataRequest {
  string user_id = 1;
  string tenant_id = 2;
  bool delete_audit_trail = 3;          // Whether to delete audit trail (default: false, keep for compliance)
}
```

**Response:**
```protobuf
message DeleteUserDataResponse {
  bool success = 1;
  int32 records_deleted = 2;           // Number of records deleted
  repeated string deleted_types = 3;    // Types of data deleted
  string deletion_timestamp = 4;        // ISO 8601 timestamp
}
```

---

#### ExportUserData (US-009: GDPR Compliance - Data Portability)
**RPC:** `ExportUserData(ExportUserDataRequest) returns (ExportUserDataResponse)`

**Request:**
```protobuf
message ExportUserDataRequest {
  string user_id = 1;
  string tenant_id = 2;
  repeated string data_types = 3;       // Types to export (empty = all)
}
```

**Response:**
```protobuf
message ExportUserDataResponse {
  string export_url = 1;                // URL to download export (expires in 24h)
  string export_format = 2;             // "json", "csv", etc.
  int64 export_size_bytes = 3;         // Export file size
  string expires_at = 4;                // ISO 8601 expiration timestamp
}
```

---

### 8. Personalized Assistance Service
**Service:** `rag.v1.PersonalizedAssistanceService`

#### GetPersonalizedQuery (US-013: Personalized Query Responses)
**RPC:** `GetPersonalizedQuery(PersonalizedQueryRequest) returns (PersonalizedQueryResponse)`

**Request:**
```protobuf
message PersonalizedQueryRequest {
  string query = 1;                    // Natural language question
  string tenant_id = 2;
  string user_id = 3;                  // Required for personalization
  optional UserContext user_context = 4; // User profile context
  optional PersonalizationOptions options = 5;
}

message UserContext {
  string role = 1;                     // "learner", "trainer", "hr", "admin"
  map<string, string> profile = 2;      // User profile data (skills, experience, preferences)
  repeated string skill_gaps = 3;       // Skill gap IDs from Skills Engine
  LearningProgress progress = 4;       // Learning progress from Learner AI
}

message LearningProgress {
  map<string, double> skill_levels = 1; // Skill ID -> competency level
  repeated string completed_courses = 2; // Completed course IDs
  repeated string in_progress_courses = 3; // In-progress course IDs
  repeated AssessmentResult assessment_history = 4; // Assessment results
  repeated DevLabProgress devlab_progress = 5; // DevLab practice progress
}

message AssessmentResult {
  string assessment_id = 1;
  double score = 2;
  string timestamp = 3;                // ISO 8601
}

message DevLabProgress {
  string exercise_id = 1;
  string status = 2;                   // "completed", "in_progress", "failed"
  int32 attempts = 3;
}

message PersonalizationOptions {
  bool include_recommendations = 1;    // Include personalized recommendations (default: true)
  bool include_skill_gap_analysis = 2; // Include skill gap analysis (default: true)
  int32 max_recommendations = 3;       // Max recommendations (default: 5)
}
```

**Response:**
```protobuf
message PersonalizedQueryResponse {
  string answer = 1;                   // Personalized answer
  double confidence = 2;
  repeated Source sources = 3;        // Filtered sources based on permissions
  repeated PersonalizedRecommendation recommendations = 4; // Personalized recommendations
  optional SkillGapAnalysis skill_gaps = 5; // Skill gap analysis
  PersonalizationMetadata metadata = 6;
}

message PersonalizedRecommendation {
  string type = 1;                     // "course", "exercise", "assessment", "mentor"
  string id = 2;
  string title = 3;
  string description = 4;
  string url = 5;
  double relevance_score = 6;          // Relevance score (0-1)
  string reason = 7;                   // Why this is recommended
}

message SkillGapAnalysis {
  repeated SkillGap gaps = 1;
  repeated string recommended_skills = 2;
}

message SkillGap {
  string skill_id = 1;
  string skill_name = 2;
  double current_level = 3;
  double target_level = 4;
  double gap = 5;
}

message PersonalizationMetadata {
  bool personalized = 1;               // Whether personalization was applied
  repeated string personalization_factors = 2; // "role", "profile", "skill_gaps", "progress"
  int64 processing_time_ms = 3;
}
```

---

#### GetPersonalizedRecommendations (US-014: Personalized Content Recommendations)
**RPC:** `GetPersonalizedRecommendations(RecommendationsRequest) returns (RecommendationsResponse)`

**Request:**
```protobuf
message RecommendationsRequest {
  string tenant_id = 1;
  string user_id = 2;
  repeated RecommendationType types = 3; // Types to recommend (empty = all)
  int32 max_results = 4;               // Max recommendations per type (default: 10)
}

enum RecommendationType {
  COURSES = 0;
  EXERCISES = 1;
  ASSESSMENTS = 2;
  MENTORS = 3;
}
```

**Response:**
```protobuf
message RecommendationsResponse {
  repeated PersonalizedRecommendation courses = 1;
  repeated PersonalizedRecommendation exercises = 2;
  repeated PersonalizedRecommendation assessments = 3;
  repeated PersonalizedRecommendation mentors = 4;
  string generated_at = 5;             // ISO 8601 timestamp
}
```

---

### 9. Access Control Service
**Service:** `rag.v1.AccessControlService`

#### CheckPermissions (US-015, US-016, US-017: RBAC, ABAC, Fine-grained Permissions)
**RPC:** `CheckPermissions(PermissionCheckRequest) returns (PermissionCheckResponse)`

**Request:**
```protobuf
message PermissionCheckRequest {
  string tenant_id = 1;
  string user_id = 2;
  string resource_type = 3;           // "course", "lesson", "assessment", "document", etc.
  string resource_id = 4;              // Resource identifier
  string action = 5;                   // "read", "write", "delete", etc.
  optional UserAttributes user_attributes = 6; // For ABAC
}

message UserAttributes {
  string role = 1;                     // For RBAC
  string department = 2;               // For ABAC
  string region = 3;                   // For ABAC
  repeated string compliance_flags = 4; // "GDPR", "HIPAA", etc.
  map<string, string> custom_attributes = 5; // Additional attributes
}
```

**Response:**
```protobuf
message PermissionCheckResponse {
  bool allowed = 1;
  string reason = 2;                    // Why allowed/denied
  repeated string applied_policies = 3; // RBAC, ABAC, content-level policies applied
  AccessControlMetadata metadata = 4;
}

message AccessControlMetadata {
  string checked_at = 1;                // ISO 8601 timestamp
  string policy_version = 2;           // Policy version used
  repeated string evaluation_steps = 3; // Evaluation steps for debugging
}
```

---

#### GetAccessibleContent (US-017: Fine-grained Content Permissions)
**RPC:** `GetAccessibleContent(AccessibleContentRequest) returns (AccessibleContentResponse)`

**Request:**
```protobuf
message AccessibleContentRequest {
  string tenant_id = 1;
  string user_id = 2;
  string content_type = 3;             // "lesson", "assessment", "document"
  optional string course_id = 4;       // Filter by course (optional)
  optional string search_query = 5;    // Search query (optional)
}
```

**Response:**
```protobuf
message AccessibleContentResponse {
  repeated AccessibleContentItem items = 1;
  int32 total_accessible = 2;
  int32 total_filtered = 3;            // Number of items filtered due to permissions
}

message AccessibleContentItem {
  string id = 1;
  string title = 2;
  string content_type = 3;
  string url = 4;
  map<string, string> permissions = 5; // Available actions (read, write, etc.)
}
```

---

#### ApplyFieldMasking (US-018: Field-Level Masking)
**RPC:** `ApplyFieldMasking(FieldMaskingRequest) returns (FieldMaskingResponse)`

**Request:**
```protobuf
message FieldMaskingRequest {
  string tenant_id = 1;
  string user_id = 2;
  map<string, string> data = 3;       // Data to mask (field_name -> value)
  string resource_type = 4;            // Type of resource
  string resource_id = 5;
}
```

**Response:**
```protobuf
message FieldMaskingResponse {
  map<string, MaskedField> masked_data = 1; // field_name -> masked value
  repeated string masked_fields = 2;    // List of field names that were masked
  MaskingMetadata metadata = 3;
}

message MaskedField {
  string original_value = 1;            // Original value (if user has access)
  string masked_value = 2;              // Masked value (e.g., "aggregated", "N/A")
  bool is_masked = 3;                  // Whether field was masked
  string masking_reason = 4;           // Why masked (role, attribute, etc.)
}

message MaskingMetadata {
  string role = 1;                     // User role
  repeated string applied_rules = 2;     // Masking rules applied
  string masked_at = 3;                // ISO 8601 timestamp
}
```

---

#### GetAccessAuditLog (US-020: Access Control Audit & Compliance)
**RPC:** `GetAccessAuditLog(AuditLogRequest) returns (AuditLogResponse)`

**Request:**
```protobuf
message AuditLogRequest {
  string tenant_id = 1;
  optional string user_id = 2;         // Filter by user (optional)
  optional string resource_type = 3;   // Filter by resource type (optional)
  optional string resource_id = 4;     // Filter by resource (optional)
  string start_time = 5;               // ISO 8601 start timestamp
  string end_time = 6;                  // ISO 8601 end timestamp
  int32 limit = 7;                     // Max results (default: 100)
  int32 offset = 8;                    // Pagination offset (default: 0)
}
```

**Response:**
```protobuf
message AuditLogResponse {
  repeated AuditLogEntry entries = 1;
  int32 total_count = 2;
  bool has_more = 3;                   // Whether more entries exist
}

message AuditLogEntry {
  string id = 1;
  string tenant_id = 2;
  string user_id = 3;
  string resource_type = 4;
  string resource_id = 5;
  string action = 6;                    // "read", "write", "denied", etc.
  bool allowed = 7;                    // Whether access was allowed
  string timestamp = 8;                 // ISO 8601 timestamp
  string ip_address = 9;               // Client IP
  map<string, string> context = 10;    // Additional context (role, attributes, etc.)
  repeated string applied_policies = 11; // Policies that were evaluated
}
```

---

### 10. Health & Monitoring Service
**Service:** `rag.v1.HealthService`

#### HealthCheck (US-012: System Monitoring)
**RPC:** `HealthCheck(HealthCheckRequest) returns (HealthCheckResponse)`

**Request:**
```protobuf
message HealthCheckRequest {
  // Empty - health checks don't require parameters
}
```

**Response:**
```protobuf
message HealthCheckResponse {
  HealthStatus status = 1;
  ServiceHealth database = 2;
  ServiceHealth cache = 3;
  ServiceHealth kafka = 4;
  ServiceHealth ai_service = 5;
  SystemMetrics metrics = 6;
}

enum HealthStatus {
  HEALTHY = 0;
  DEGRADED = 1;
  UNHEALTHY = 2;
}

message ServiceHealth {
  HealthStatus status = 1;
  int64 response_time_ms = 2;
  string error_message = 3;            // Empty if healthy
}

message SystemMetrics {
  int32 current_qps = 1;               // Current queries per second
  double avg_response_time_ms = 2;     // Average response time
  int64 uptime_seconds = 3;            // Service uptime
  double memory_usage_percent = 4;     // Memory usage percentage
  double cpu_usage_percent = 5;        // CPU usage percentage
}
```

---

#### GetMetrics (US-012: System Monitoring)
**RPC:** `GetMetrics(MetricsRequest) returns (MetricsResponse)`

**Request:**
```protobuf
message MetricsRequest {
  string tenant_id = 1;                // Optional: tenant-specific metrics
  repeated string metric_names = 2;     // Specific metrics to retrieve (empty = all)
  string time_range = 3;               // "1h", "24h", "7d", etc.
}
```

**Response:**
```protobuf
message MetricsResponse {
  repeated MetricValue metrics = 1;
  string time_range = 2;
}

message MetricValue {
  string name = 1;
  double value = 2;
  string unit = 3;                     // "ms", "count", "percent", etc.
  string timestamp = 4;                // ISO 8601 timestamp
}
```

---

## Common Types

### AuditInfo
```protobuf
message AuditInfo {
  string query_id = 1;                 // Unique query identifier
  string user_id = 2;
  string tenant_id = 3;
  string timestamp = 4;                // ISO 8601 timestamp
  string ip_address = 5;               // Client IP (if available)
  map<string, string> metadata = 6;    // Additional audit metadata
}
```

---

## Error Handling

All gRPC services use standard gRPC status codes:
- `OK (0)`: Success
- `INVALID_ARGUMENT (3)`: Invalid request parameters
- `UNAUTHENTICATED (16)`: Authentication failed
- `PERMISSION_DENIED (7)`: Authorization failed
- `NOT_FOUND (5)`: Resource not found
- `RESOURCE_EXHAUSTED (8)`: Rate limit exceeded
- `INTERNAL (13)`: Internal server error
- `UNAVAILABLE (14)`: Service temporarily unavailable

Error details include:
```protobuf
message ErrorDetails {
  string error_code = 1;
  string message = 2;
  map<string, string> context = 3;    // Additional error context
}
```

---

## Rate Limiting

- **Default:** 200 QPS per tenant
- **Burst:** Up to 300 QPS for short bursts
- **Rate Limit Headers:** Included in gRPC metadata

---

## Notes

- All endpoints require `tenant_id` in request context (from mTLS certificate or metadata)
- All timestamps are ISO 8601 format
- All IDs are UUIDs (v4)
- Placeholders `{{API_URL}}` and `{{ENV_TOKEN}}` should be replaced with actual values
- Protobuf definitions will be loaded into JavaScript using `protoc` and `@grpc/proto-loader`
- **Access Control:** All query endpoints automatically apply RBAC, ABAC, and fine-grained permissions. Permission checks are performed before content retrieval and response generation.
- **Personalization:** Personalized endpoints require `user_id` and will integrate real-time data from Learner AI, Skills Engine, Assessment, and DevLab services.
- **Field Masking:** All responses automatically apply field-level masking based on user role and attributes. Masked fields are indicated in responses.
