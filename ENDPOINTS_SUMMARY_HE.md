# סיכום כל ה-Endpoints - RAG Microservice

## סקירה כללית

המיקרו-שירות הזה תומך בשני סוגי תקשורת:
1. **REST API** - תקשורת HTTP/JSON (מומש במלואו)
2. **gRPC** - תקשורת בינארית מהירה (מוגדר ב-proto files, חלקית מומש)

---

## 🔵 REST API Endpoints

כל ה-REST endpoints מוגדרים ב-`BACKEND/src/index.js` ומובלים דרך route files.

### Base URL
```
http://localhost:3000
```

### 1. Health Check
**GET** `/health`

**תיאור:** בדיקת סטטוס השירות

**Response:**
```json
{
  "status": "ok",
  "service": "rag-microservice"
}
```

---

### 2. Root Endpoint (API Information)
**GET** `/`

**תיאור:** מידע על השירות וכל ה-endpoints הזמינים

**Response:**
```json
{
  "service": "RAG Microservice",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "query": "/api/v1/query",
    "assessmentSupport": "/api/assessment/support",
    "devlabSupport": "/api/devlab/support",
    "recommendations": "/api/v1/personalized/recommendations/:userId",
    "skillProgress": "/api/v1/knowledge/progress/user/:userId/skill/:skillId",
    "diagnostics": "/api/debug/embeddings-status",
    "embedWidget": "/embed/bot.js",
    "embedBundle": "/embed/bot-bundle.js"
  }
}
```

---

### 3. Query Processing
**POST** `/api/v1/query`

**תיאור:** עיבוד שאילתת RAG וקבלת תשובה מ-AI

**Request Body:**
```json
{
  "query": "מה זה Python?",
  "tenant_id": "dev.educore.local",
  "user_id": "user-123",
  "session_id": "session-456",
  "metadata": {
    "source": "chatbot"
  }
}
```

**Response:**
```json
{
  "query_id": "query-789",
  "answer": "Python היא שפת תכנות...",
  "sources": [
    {
      "source_id": "source-1",
      "source_type": "lesson",
      "title": "Introduction to Python",
      "content_snippet": "...",
      "source_url": "/lessons/python-intro",
      "relevance_score": 0.95
    }
  ],
  "confidence_score": 0.92,
  "processing_time_ms": 450,
  "model_version": "gpt-4"
}
```

**קובץ:** `BACKEND/src/routes/query.routes.js` → `BACKEND/src/controllers/query.controller.js`

---

### 4. Personalized Recommendations
**GET** `/api/v1/personalized/recommendations/:userId`

**תיאור:** קבלת המלצות מותאמות אישית למשתמש

**Parameters:**
- `userId` (path parameter) - מזהה המשתמש

**Query Parameters:**
- `tenant_id` (required) - מזהה ה-tenant

**Example:**
```
GET /api/v1/personalized/recommendations/user-123?tenant_id=dev.educore.local
```

**Response:**
```json
{
  "recommendations": [
    {
      "recommendation_type": "course",
      "recommendation_id": "course-456",
      "title": "Advanced Python",
      "description": "קורס מתקדם ב-Python",
      "reason": "Based on your progress",
      "priority": 1
    }
  ]
}
```

**קובץ:** `BACKEND/src/routes/recommendations.routes.js` → `BACKEND/src/controllers/recommendations.controller.js`

---

### 5. Knowledge Graph - Skill Progress
**GET** `/api/v1/knowledge/progress/user/:userId/skill/:skillId`

**תיאור:** קבלת התקדמות משתמש במיומנות מסוימת

**Parameters:**
- `userId` (path parameter) - מזהה המשתמש
- `skillId` (path parameter) - מזהה המיומנות

**Query Parameters:**
- `tenant_id` (required) - מזהה ה-tenant

**Example:**
```
GET /api/v1/knowledge/progress/user/user-123/skill/skill-456?tenant_id=dev.educore.local
```

**Response:**
```json
{
  "user_id": "user-123",
  "skill_id": "skill-456",
  "progress": 0.75,
  "level": "intermediate"
}
```

**קובץ:** `BACKEND/src/routes/knowledgeGraph.routes.js` → `BACKEND/src/controllers/knowledgeGraph.controller.js`

---

### 6. Assessment Support (Proxy)
**POST** `/api/assessment/support`

**תיאור:** Proxy endpoint לתמיכה ב-Assessment microservice

**הגבלות:**
- דורש `SUPPORT_MODE_ENABLED=true` ב-environment
- יכול לדרוש `X-Embed-Secret` header אם מוגדר `SUPPORT_SHARED_SECRET`
- יכול לדרוש origin מותרת ב-`SUPPORT_ALLOWED_ORIGINS`

**Request Body:**
```json
{
  "assessment_id": "assessment-123",
  "question_id": "question-456",
  "tenant_id": "dev.educore.local",
  "user_id": "user-789",
  "user_answer": "option-a",
  "hint_level": "moderate"
}
```

**Response:**
```json
{
  "hint": "נסה לחשוב על המושג...",
  "concept_references": ["concept-1", "concept-2"],
  "related_content": []
}
```

**קובץ:** `BACKEND/src/routes/microserviceSupport.routes.js` → `BACKEND/src/controllers/microserviceSupport.controller.js`

---

### 7. DevLab Support (Proxy)
**POST** `/api/devlab/support`

**תיאור:** Proxy endpoint לתמיכה ב-DevLab microservice

**הגבלות:** (כמו Assessment Support)

**Request Body:**
```json
{
  "exercise_id": "exercise-123",
  "tenant_id": "dev.educore.local",
  "user_id": "user-456",
  "code": "def hello(): print('hello')",
  "error_message": "SyntaxError",
  "language": "python",
  "support_type": "ERROR_EXPLANATION"
}
```

**Response:**
```json
{
  "explanation": "השגיאה נובעת מ...",
  "examples": [],
  "best_practices": [],
  "related_resources": []
}
```

**קובץ:** `BACKEND/src/routes/microserviceSupport.routes.js` → `BACKEND/src/controllers/microserviceSupport.controller.js`

---

### 8. Diagnostics - Embeddings Status
**GET** `/api/debug/embeddings-status`

**תיאור:** בדיקת סטטוס embeddings במסד הנתונים

**Response:**
```json
{
  "total_documents": 100,
  "documents_with_embeddings": 95,
  "documents_without_embeddings": 5,
  "embedding_status": "partial"
}
```

**קובץ:** `BACKEND/src/routes/diagnostics.routes.js` → `BACKEND/src/controllers/diagnostics.controller.js`

---

### 9. Diagnostics - Test Vector Search
**GET** `/api/debug/test-vector-search`

**תיאור:** בדיקת חיפוש וקטורי עם שאילתת דוגמה

**Query Parameters:**
- `query` (required) - שאילתת החיפוש
- `tenant_id` (optional) - מזהה tenant
- `threshold` (optional, default: 0.3) - סף דמיון

**Example:**
```
GET /api/debug/test-vector-search?query=python&tenant_id=dev.educore.local&threshold=0.5
```

**Response:**
```json
{
  "query": "python",
  "results_count": 10,
  "results": [
    {
      "id": "doc-1",
      "title": "Python Basics",
      "similarity": 0.89
    }
  ]
}
```

**קובץ:** `BACKEND/src/routes/diagnostics.routes.js` → `BACKEND/src/controllers/diagnostics.controller.js`

---

### 10. Embed Widget Files
**GET** `/embed/bot.js`  
**GET** `/embed/bot-bundle.js`

**תיאור:** קבצי JavaScript להטמעת widget ב-microservices אחרים

**Response:** JavaScript files (static)

---

## 🟢 gRPC Endpoints

כל ה-gRPC endpoints מוגדרים ב-proto files ב-`DATABASE/proto/rag/v1/`.

**הערה חשובה:** רוב ה-gRPC services מוגדרים ב-proto files אבל **לא מומשים במלואם**. רק חלק מה-clients מומשים (כמו AI LEARNER).

### Base Configuration
- **Protocol:** gRPC (gRPC Remote Procedure Calls)
- **Port:** 50051 (default)
- **Authentication:** mTLS (mutual TLS)
- **Package:** `rag.v1`

---

### 1. Query Service
**Service:** `rag.v1.QueryService`  
**Proto File:** `DATABASE/proto/rag/v1/query.proto`

#### SubmitQuery
**RPC:** `SubmitQuery(QueryRequest) returns (QueryResponse)`

**Request:**
```protobuf
message QueryRequest {
  string tenant_id = 1;
  string user_id = 2;
  string query_text = 3;
  string session_id = 4;
  map<string, string> metadata = 5;
}
```

**Response:**
```protobuf
message QueryResponse {
  string query_id = 1;
  string answer = 2;
  repeated Source sources = 3;
  float confidence_score = 4;
  int32 processing_time_ms = 5;
  string model_version = 6;
}
```

#### GetQueryHistory
**RPC:** `GetQueryHistory(QueryHistoryRequest) returns (QueryHistoryResponse)`

**Request:**
```protobuf
message QueryHistoryRequest {
  string tenant_id = 1;
  string user_id = 2;
  int32 limit = 3;
  int32 offset = 4;
}
```

**Response:**
```protobuf
message QueryHistoryResponse {
  repeated QueryResponse queries = 1;
  int32 total = 2;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC server (יש REST equivalent)

---

### 2. Coordinator Service
**Service:** `rag.v1.CoordinatorService`  
**Proto File:** `DATABASE/proto/rag/v1/coordinator.proto`

#### Route
**RPC:** `Route(RouteRequest) returns (RouteResponse)`

**תיאור:** ניתוב בקשות למיקרו-שירותים אחרים וקבלת נתונים מנורמלים

**Request:**
```protobuf
message RouteRequest {
  string tenant_id = 1;
  string user_id = 2;
  string query_text = 3;
  map<string, string> metadata = 4;
}
```

**Response:**
```protobuf
message RouteResponse {
  repeated string target_services = 1;
  map<string, string> normalized_fields = 2;
  string envelope_json = 3;
  string routing_metadata = 4;
}
```

**סטטוס:** **מומש** - יש client ב-`BACKEND/src/clients/coordinator.client.js`

---

### 3. Health Service
**Service:** `rag.v1.HealthService`  
**Proto File:** `DATABASE/proto/rag/v1/health.proto`

#### HealthCheck
**RPC:** `HealthCheck(HealthCheckRequest) returns (HealthCheckResponse)`

**Request:**
```protobuf
message HealthCheckRequest {
  // Empty
}
```

**Response:**
```protobuf
message HealthCheckResponse {
  string status = 1;
  string version = 2;
  map<string, string> services = 3;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC server (יש REST equivalent ב-`/health`)

---

### 4. Personalized Service (AI LEARNER)
**Service:** `rag.v1.PersonalizedService`  
**Proto File:** `DATABASE/proto/rag/v1/personalized.proto`

#### GetRecommendations
**RPC:** `GetRecommendations(RecommendationsRequest) returns (RecommendationsResponse)`

**Request:**
```protobuf
message RecommendationsRequest {
  string tenant_id = 1;
  string user_id = 2;
  string query_id = 3;
}
```

**Response:**
```protobuf
message RecommendationsResponse {
  repeated Recommendation recommendations = 1;
}

message Recommendation {
  string recommendation_type = 1;
  string recommendation_id = 2;
  string title = 3;
  string description = 4;
  string reason = 5;
  int32 priority = 6;
}
```

#### UpdateUserProfile
**RPC:** `UpdateUserProfile(UserProfileRequest) returns (UserProfileResponse)`

**Request:**
```protobuf
message UserProfileRequest {
  string tenant_id = 1;
  string user_id = 2;
  map<string, string> profile_data = 3;
}
```

**Response:**
```protobuf
message UserProfileResponse {
  string user_id = 1;
  bool success = 2;
}
```

**סטטוס:** **מומש** - יש client ב-`BACKEND/src/clients/aiLearner.client.js`

---

### 5. Access Control Service
**Service:** `rag.v1.AccessControlService`  
**Proto File:** `DATABASE/proto/rag/v1/access-control.proto`

#### CheckPermission
**RPC:** `CheckPermission(PermissionRequest) returns (PermissionResponse)`

**Request:**
```protobuf
message PermissionRequest {
  string tenant_id = 1;
  string user_id = 2;
  string resource_type = 3;
  string resource_id = 4;
  string permission = 5;
}
```

**Response:**
```protobuf
message PermissionResponse {
  bool allowed = 1;
  string reason = 2;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client

---

### 6. Assessment Service
**Service:** `rag.v1.AssessmentService`  
**Proto File:** `DATABASE/proto/rag/v1/assessment.proto`

#### GetAssessmentData
**RPC:** `GetAssessmentData(AssessmentRequest) returns (AssessmentResponse)`

**Request:**
```protobuf
message AssessmentRequest {
  string tenant_id = 1;
  string user_id = 2;
}
```

**Response:**
```protobuf
message AssessmentResponse {
  map<string, string> data = 1;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client (יש REST proxy ב-`/api/assessment/support`)

---

### 7. DevLab Service
**Service:** `rag.v1.DevLabService`  
**Proto File:** `DATABASE/proto/rag/v1/devlab.proto`

#### GetDevLabData
**RPC:** `GetDevLabData(DevLabRequest) returns (DevLabResponse)`

**Request:**
```protobuf
message DevLabRequest {
  string tenant_id = 1;
  string user_id = 2;
}
```

**Response:**
```protobuf
message DevLabResponse {
  map<string, string> data = 1;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client (יש REST proxy ב-`/api/devlab/support`)

---

### 8. Analytics Service
**Service:** `rag.v1.AnalyticsService`  
**Proto File:** `DATABASE/proto/rag/v1/analytics.proto`

#### GetAnalytics
**RPC:** `GetAnalytics(AnalyticsRequest) returns (AnalyticsResponse)`

**Request:**
```protobuf
message AnalyticsRequest {
  string tenant_id = 1;
}
```

**Response:**
```protobuf
message AnalyticsResponse {
  map<string, string> data = 1;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client

---

### 9. Content Service
**Service:** `rag.v1.ContentService`  
**Proto File:** `DATABASE/proto/rag/v1/content.proto`

#### GetContent
**RPC:** `GetContent(ContentRequest) returns (ContentResponse)`

**Request:**
```protobuf
message ContentRequest {
  string tenant_id = 1;
  string content_id = 2;
}
```

**Response:**
```protobuf
message ContentResponse {
  map<string, string> data = 1;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client

---

### 10. Graph Service (Knowledge Graph)
**Service:** `rag.v1.GraphService`  
**Proto File:** `DATABASE/proto/rag/v1/graph.proto`

#### GetGraphData
**RPC:** `GetGraphData(GraphRequest) returns (GraphResponse)`

**Request:**
```protobuf
message GraphRequest {
  string tenant_id = 1;
  string node_id = 2;
}
```

**Response:**
```protobuf
message GraphResponse {
  map<string, string> data = 1;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client (יש REST equivalent ב-`/api/v1/knowledge/progress/...`)

---

### 11. GDPR Service
**Service:** `rag.v1.GDPRService`  
**Proto File:** `DATABASE/proto/rag/v1/gdpr.proto`

#### DeleteUserData
**RPC:** `DeleteUserData(DeleteRequest) returns (DeleteResponse)`

**Request:**
```protobuf
message DeleteRequest {
  string tenant_id = 1;
  string user_id = 2;
}
```

**Response:**
```protobuf
message DeleteResponse {
  bool success = 1;
}
```

#### ExportUserData
**RPC:** `ExportUserData(ExportRequest) returns (ExportResponse)`

**Request:**
```protobuf
message ExportRequest {
  string tenant_id = 1;
  string user_id = 2;
}
```

**Response:**
```protobuf
message ExportResponse {
  bytes data = 1;
}
```

**סטטוס:** מוגדר ב-proto, לא מומש כ-gRPC client

---

## 📊 סיכום - סטטוס יישום

### REST API - ✅ מומש במלואו
- ✅ Health Check
- ✅ Query Processing
- ✅ Recommendations
- ✅ Knowledge Graph
- ✅ Assessment Support (Proxy)
- ✅ DevLab Support (Proxy)
- ✅ Diagnostics

### gRPC - ⚠️ חלקי
- ✅ **Coordinator Service** - מומש (client)
- ✅ **Personalized Service (AI LEARNER)** - מומש (client)
- ⚠️ **Query Service** - מוגדר, לא מומש כ-server (יש REST)
- ⚠️ **Health Service** - מוגדר, לא מומש כ-server (יש REST)
- ❌ **Access Control Service** - מוגדר, לא מומש
- ❌ **Assessment Service** - מוגדר, לא מומש (יש REST proxy)
- ❌ **DevLab Service** - מוגדר, לא מומש (יש REST proxy)
- ❌ **Analytics Service** - מוגדר, לא מומש
- ❌ **Content Service** - מוגדר, לא מומש
- ❌ **Graph Service** - מוגדר, לא מומש (יש REST)
- ❌ **GDPR Service** - מוגדר, לא מומש

---

## 🔧 איך להשתמש

### REST API
```bash
# Health check
curl http://localhost:3000/health

# Query
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "מה זה Python?",
    "tenant_id": "dev.educore.local",
    "user_id": "user-123"
  }'

# Recommendations
curl "http://localhost:3000/api/v1/personalized/recommendations/user-123?tenant_id=dev.educore.local"
```

### gRPC (עם grpcurl)
```bash
# Coordinator Route
grpcurl -plaintext \
  -d '{"tenant_id":"dev.educore.local","user_id":"user-123","query_text":"test"}' \
  localhost:50051 \
  rag.v1.CoordinatorService/Route

# AI LEARNER Recommendations
grpcurl -plaintext \
  -d '{"tenant_id":"dev.educore.local","user_id":"user-123","query_id":""}' \
  ai-learner.educore.local:50051 \
  rag.v1.PersonalizedService/GetRecommendations
```

---

## 📁 מיקומי קבצים

### REST Routes
- `BACKEND/src/routes/query.routes.js`
- `BACKEND/src/routes/recommendations.routes.js`
- `BACKEND/src/routes/knowledgeGraph.routes.js`
- `BACKEND/src/routes/microserviceSupport.routes.js`
- `BACKEND/src/routes/diagnostics.routes.js`

### REST Controllers
- `BACKEND/src/controllers/query.controller.js`
- `BACKEND/src/controllers/recommendations.controller.js`
- `BACKEND/src/controllers/knowledgeGraph.controller.js`
- `BACKEND/src/controllers/microserviceSupport.controller.js`
- `BACKEND/src/controllers/diagnostics.controller.js`

### gRPC Proto Files
- `DATABASE/proto/rag/v1/*.proto`

### gRPC Clients
- `BACKEND/src/clients/coordinator.client.js` ✅
- `BACKEND/src/clients/aiLearner.client.js` ✅
- `BACKEND/src/clients/grpcClient.util.js` ✅

---

## 🎯 הערות חשובות

1. **REST הוא הממשק הראשי** - רוב הפונקציונליות זמינה דרך REST API
2. **gRPC משמש לתקשורת פנימית** - בעיקר לתקשורת עם מיקרו-שירותים אחרים
3. **Coordinator Service** - זה ה-gRPC service המרכזי שמומש - הוא מנתב בקשות למיקרו-שירותים אחרים
4. **AI LEARNER** - זה ה-gRPC client היחיד שמומש במלואו (מלבד Coordinator)
5. **רוב ה-gRPC services הם stubs** - מוגדרים ב-proto אבל לא מומשים

---

## 📚 מסמכים נוספים

- `GRPC_COMMUNICATION_GUIDE.md` - מדריך תקשורת gRPC
- `BACKEND/COORDINATOR_INTEGRATION_GUIDE.md` - מדריך אינטגרציה עם Coordinator
- `FULLSTACK_TEMPLATES/Stage_02_System_and_Architecture/ENDPOINTS_SPEC.md` - מפרט מפורט של כל ה-endpoints

