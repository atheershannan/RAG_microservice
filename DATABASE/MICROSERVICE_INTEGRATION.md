# אינטגרציה עם 9-10 מיקרוסרוויסים

## סקירה כללית

ה-RAG microservice מקבל מידע מ-**9-10 מיקרוסרוויסים** שונים. המסכימות (migrations) שופרו כדי לתמוך בניהול וזיהוי תוכן מכל מיקרוסרוויס.

---

## שינויים ב-Schema

### 1. טבלת `microservices` (חדש!)

טבלה חדשה לניהול כל המיקרוסרוויסים:

```prisma
model Microservice {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // "assessment", "devlab", "content", etc.
  serviceId   String   @unique // Unique across all tenants
  displayName String
  description String?
  apiEndpoint String?
  version     String?
  isActive    Boolean  @default(true)
  settings    Json?
  metadata    Json?
  ...
}
```

**דוגמאות למיקרוסרוויסים:**
- `assessment` - Assessment Service
- `devlab` - DevLab Service
- `content` - Content Management Service
- `analytics` - Analytics Service
- `user-management` - User Management Service
- וכו'...

### 2. שדה `microservice_id` ב-`vector_embeddings`

כל embedding עכשיו יכול להיות מקושר למיקרוסרוויס:

```prisma
model VectorEmbedding {
  ...
  microserviceId String? // Which microservice this content came from
  ...
}
```

**יתרונות:**
- ✅ יכולים לסנן חיפושים לפי מיקרוסרוויס
- ✅ יכולים לדעת מאיזה מיקרוסרוויס הגיע כל תוכן
- ✅ יכולים לעשות analytics לפי מיקרוסרוויס

### 3. שדה `source_microservice` ב-`query_sources`

כל source עכשיו יכול לזהות מאיזה מיקרוסרוויס הוא הגיע:

```prisma
model QuerySource {
  ...
  sourceMicroservice String? // Which microservice provided this source
  ...
}
```

---

## Indexes חדשים

### `vector_embeddings`:
- `microservice_id` - חיפוש מהיר לפי מיקרוסרוויס
- `content_type` - חיפוש מהיר לפי סוג תוכן
- `tenant_id, microservice_id` - חיפוש משולב
- `tenant_id, content_type, microservice_id` - חיפוש משולב מורכב

### `query_sources`:
- `source_microservice` - חיפוש מהיר לפי מיקרוסרוויס
- `source_type, source_microservice` - חיפוש משולב

---

## שימוש ב-Vector Search Service

### חיפוש בכל המיקרוסרוויסים (ברירת מחדל):
```javascript
const results = await searchSimilarVectors(queryEmbedding, tenantId, {
  limit: 10,
  threshold: 0.7
});
```

### חיפוש במיקרוסרוויס ספציפי:
```javascript
const results = await searchSimilarVectors(queryEmbedding, tenantId, {
  limit: 10,
  threshold: 0.7,
  microserviceId: 'assessment' // רק מ-Assessment Service
});
```

### חיפוש בכמה מיקרוסרוויסים:
```javascript
const results = await searchSimilarVectors(queryEmbedding, tenantId, {
  limit: 10,
  threshold: 0.7,
  microserviceIds: ['assessment', 'devlab', 'content'] // רק מ-3 מיקרוסרוויסים
});
```

### חיפוש משולב:
```javascript
const results = await searchSimilarVectors(queryEmbedding, tenantId, {
  limit: 10,
  threshold: 0.7,
  contentType: 'document',
  microserviceId: 'content' // רק documents מ-Content Service
});
```

---

## Migration חדשה

### `20250101000003_add_microservices`

Migration זו מוסיפה:
1. ✅ טבלת `microservices`
2. ✅ שדה `microservice_id` ב-`vector_embeddings`
3. ✅ שדה `source_microservice` ב-`query_sources`
4. ✅ כל ה-indexes החדשים
5. ✅ Foreign keys

**להרצה:**
```bash
# ב-Supabase SQL Editor או דרך Prisma
npx prisma migrate deploy --schema=./DATABASE/prisma/schema.prisma
```

---

## דוגמאות שימוש

### 1. שמירת Embedding ממיקרוסרוויס:
```javascript
await storeVectorEmbedding({
  tenantId: 'tenant-123',
  microserviceId: 'assessment', // ID של המיקרוסרוויס
  contentId: 'assessment-456',
  contentType: 'assessment',
  embedding: [...],
  contentText: 'Assessment content...',
  metadata: {
    assessmentId: 'assessment-456',
    courseId: 'course-789'
  }
});
```

### 2. חיפוש במיקרוסרוויס ספציפי:
```javascript
// רק מ-Assessment Service
const assessmentResults = await searchSimilarVectors(queryEmbedding, tenantId, {
  microserviceId: 'assessment',
  limit: 5
});

// רק מ-DevLab Service
const devlabResults = await searchSimilarVectors(queryEmbedding, tenantId, {
  microserviceId: 'devlab',
  limit: 5
});
```

### 3. שמירת Query Source עם מיקרוסרוויס:
```javascript
// ב-queryProcessing.service.js
sources = similarVectors.map((vec) => ({
  sourceId: vec.contentId,
  sourceType: vec.contentType,
  sourceMicroservice: vec.microserviceId, // ← חדש!
  title: vec.metadata?.title || `${vec.contentType}:${vec.contentId}`,
  ...
}));
```

---

## רשימת מיקרוסרוויסים מומלצת

לפי EDUCORE ecosystem (10 מיקרוסרוויסים):

1. **assessment** - Assessment Service
2. **devlab** - DevLab Service  
3. **content** - Content Management Service
4. **analytics** - Analytics Service
5. **user-management** - User Management Service
6. **notification** - Notification Service
7. **reporting** - Reporting Service
8. **integration** - Integration Service
9. **ai-assistant** - AI Assistant Service (זה!)
10. **gateway** - API Gateway (אופציונלי)

---

## Analytics אפשריים

עכשיו אפשר לעשות:

1. **חיפוש לפי מיקרוסרוויס:**
   - כמה תוצאות מכל מיקרוסרוויס?
   - איזה מיקרוסרוויס הכי רלוונטי?

2. **Performance לפי מיקרוסרוויס:**
   - איזה מיקרוסרוויס נותן את התוצאות הטובות ביותר?
   - מה ה-confidence score הממוצע לכל מיקרוסרוויס?

3. **Content Distribution:**
   - כמה embeddings יש מכל מיקרוסרוויס?
   - מה ה-distribution של content types?

---

## סיכום

✅ **הוספנו:**
- טבלת `microservices` לניהול כל המיקרוסרוויסים
- שדה `microservice_id` ב-`vector_embeddings`
- שדה `source_microservice` ב-`query_sources`
- Indexes משופרים לחיפוש מהיר
- תמיכה ב-vector search לפי מיקרוסרוויס

✅ **יכולים עכשיו:**
- לזהות מאיזה מיקרוסרוויס הגיע כל תוכן
- לסנן חיפושים לפי מיקרוסרוויס
- לעשות analytics לפי מיקרוסרוויס
- לנהל 9-10 מיקרוסרוויסים בצורה מסודרת

🎯 **מוכן לשימוש!**

