# איך להבדיל בין טבלאות רגילות לטבלאות ויקטוריות

## סיכום מהיר

**טבלאות רגילות**: כל הטבלאות חוץ מ-`vector_embeddings`  
**טבלאות ויקטוריות**: רק `vector_embeddings` (משתמשת ב-pgvector)

⚠️ **חשוב**: `vector_embeddings` היא טבלה **גנרית** שמכילה embeddings של כל סוגי התוכן:
- Content chunks/documents (`content_type="document"`)
- Knowledge Graph nodes (אפשרי, `content_type="kg_node"`)
- Queries (אפשרי, `content_type="query"`)

📖 **ראה**: `DATABASE/RAG_VECTOR_ARCHITECTURE.md` להסבר מפורט על הארכיטקטורה

---

## שיטה 1: ב-Supabase Dashboard

### דרך Table Editor:
1. לך ל-Supabase Dashboard → Table Editor
2. לחץ על טבלה
3. בדוק את העמודות:
   - **אם יש עמודה מסוג `vector`** → זו טבלה ויקטורית
   - **אם אין עמודה מסוג `vector`** → זו טבלה רגילה

### דוגמה:
- `vector_embeddings` → יש עמודה `embedding` מסוג `vector(1536)` ✅ **ויקטורית**
- `queries` → אין עמודות `vector` ✅ **רגילה**
- `tenants` → אין עמודות `vector` ✅ **רגילה**

---

## שיטה 2: ב-SQL Query

### בדיקה מהירה:
```sql
-- מצא את כל הטבלאות עם עמודות vector
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE udt_name = 'vector'
ORDER BY table_name;
```

### תוצאה צפויה:
```
table_name         | column_name | data_type | udt_name
-------------------+-------------+-----------+----------
vector_embeddings  | embedding   | USER-DEFINED | vector
```

---

## שיטה 3: לפי Prisma Schema

בקובץ `DATABASE/prisma/schema.prisma`:

### טבלאות ויקטוריות:
חפש `Unsupported("vector")`:
```prisma
model VectorEmbedding {
  embedding   Unsupported("vector(1536)") // ← זה ויקטורי!
  ...
}
```

### טבלאות רגילות:
כל שאר הטבלאות ללא `vector`:
- `Tenant`
- `Query`
- `QuerySource`
- `QueryRecommendation`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `AccessControlRule`
- `UserProfile`
- `AuditLog`
- `CacheEntry`

---

## רשימת כל הטבלאות בפרויקט

### טבלאות רגילות (10):
1. ✅ `tenants` - ניהול tenants
2. ✅ `queries` - שאילתות משתמשים
3. ✅ `query_sources` - מקורות לשאילתות
4. ✅ `query_recommendations` - המלצות מותאמות אישית
5. ✅ `knowledge_graph_nodes` - צמתים בגרף ידע
6. ✅ `knowledge_graph_edges` - קשתות בגרף ידע
7. ✅ `access_control_rules` - כללי הרשאות
8. ✅ `user_profiles` - פרופילי משתמשים
9. ✅ `audit_logs` - לוגי ביקורת
10. ✅ `cache_entries` - ערכי cache

### טבלאות ויקטוריות (1):
1. 🎯 `vector_embeddings` - embeddings ל-vector search

---

## למה זה חשוב?

### טבלאות ויקטוריות:
- משתמשות ב-**pgvector extension**
- דורשות **HNSW index** לביצועים טובים
- משמשות ל-**semantic search** (חיפוש סמנטי)
- עמודת `embedding` מכילה וקטורים (מערכים מספריים)

### טבלאות רגילות:
- משתמשות ב-**PostgreSQL סטנדרטי**
- משתמשות ב-**B-tree indexes** (או GIN ל-JSONB)
- משמשות ל-**relational data** (נתונים יחסיים)
- עמודות רגילות (TEXT, INTEGER, JSON, וכו')

---

## בדיקה מהירה ב-Supabase SQL Editor

```sql
-- בדוק אם יש טבלאות עם vector
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexdef LIKE '%vector%' 
   OR indexdef LIKE '%hnsw%';
```

אם יש תוצאות → יש טבלאות ויקטוריות!

---

## סיכום

| קריטריון | טבלה רגילה | טבלה ויקטורית |
|----------|------------|---------------|
| **סוג עמודות** | TEXT, INTEGER, JSON, וכו' | `vector(1536)` |
| **Extension** | PostgreSQL סטנדרטי | pgvector |
| **Index** | B-tree, GIN | HNSW |
| **שימוש** | Relational data | Semantic search |
| **דוגמה** | `queries`, `tenants` | `vector_embeddings` |

**בפרויקט הזה**: רק `vector_embeddings` היא טבלה ויקטורית! 🎯

