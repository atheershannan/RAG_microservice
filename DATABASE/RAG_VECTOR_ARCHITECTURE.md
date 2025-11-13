# ארכיטקטורת Vector ב-RAG - הסבר מפורט

## למה רק טבלה אחת ויקטורית?

אתה צודק שזה נראה מוזר! בואו נסביר את הארכיטקטורה:

---

## הארכיטקטורה הנוכחית: **Single Vector Table Pattern**

### הטבלה: `vector_embeddings`

הטבלה הזו **משמשת לכל סוגי ה-embeddings** דרך שדה `content_type`:

```sql
CREATE TABLE vector_embeddings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  content_id TEXT,        -- ID של התוכן המקורי
  content_type TEXT,      -- סוג התוכן: "document", "chunk", "query", "kg_node"
  embedding vector(1536), -- ה-embedding עצמו
  content_text TEXT,      -- הטקסט המקורי
  chunk_index INT,        -- איזה chunk (אם זה chunk)
  metadata JSONB          -- מידע נוסף
);
```

### איך זה עובד:

1. **Content Chunks** (קטעי תוכן):
   ```javascript
   {
     content_type: "document",
     content_id: "doc-123",
     chunk_index: 0,
     embedding: [0.1, 0.2, ...], // 1536 dimensions
     content_text: "הטקסט של הקטע..."
   }
   ```

2. **Knowledge Graph Nodes** (אפשרי):
   ```javascript
   {
     content_type: "kg_node",
     content_id: "node-456",
     embedding: [0.3, 0.4, ...],
     content_text: "התיאור של הצומת..."
   }
   ```

3. **Queries** (שאילתות - אופציונלי):
   ```javascript
   {
     content_type: "query",
     content_id: "query-789",
     embedding: [0.5, 0.6, ...],
     content_text: "השאילתה המקורית..."
   }
   ```

---

## למה זה עובד?

### יתרונות:
✅ **גמישות** - יכולים להוסיף סוגי תוכן חדשים בלי לשנות schema  
✅ **חיפוש אחיד** - אותו query מחפש בכל סוגי התוכן  
✅ **פחות טבלאות** - פשוט יותר לנהל  
✅ **Index אחד** - HNSW index אחד לכל הטבלה (מהיר יותר)

### חסרונות:
⚠️ **פחות נורמליזציה** - כל ה-embeddings בטבלה אחת  
⚠️ **קשה לשאילתות מורכבות** - אם צריך JOIN עם טבלאות אחרות  
⚠️ **לא ברור מה יש** - צריך לבדוק `content_type` כל פעם

---

## הארכיטקטורה החלופית: **Multiple Vector Tables**

אם רוצים, אפשר ליצור טבלאות נפרדות:

### 1. `document_embeddings` - Embeddings של מסמכים
```prisma
model DocumentEmbedding {
  id          String   @id
  documentId  String   // FK ל-tabla של documents
  embedding   vector(1536)
  chunkIndex  Int
  ...
}
```

### 2. `knowledge_graph_node_embeddings` - Embeddings של KG nodes
```prisma
model KnowledgeGraphNodeEmbedding {
  id        String   @id
  nodeId    String   // FK ל-knowledge_graph_nodes
  embedding vector(1536)
  ...
}
```

### 3. `query_embeddings` - Embeddings של שאילתות (לניתוח)
```prisma
model QueryEmbedding {
  id        String   @id
  queryId   String   // FK ל-queries
  embedding vector(1536)
  ...
}
```

---

## מה חסר בפרויקט הנוכחי?

### 1. **Knowledge Graph Node Embeddings** ❌
כרגע אין embeddings ל-KG nodes! זה אומר:
- לא יכולים לחפש בגרף ידע באמצעות semantic search
- רק חיפוש יחסי (edges, properties)

**פתרון אפשרי:**
- להוסיף embeddings ל-KG nodes ב-`vector_embeddings` עם `content_type="kg_node"`
- או ליצור טבלה נפרדת `knowledge_graph_node_embeddings`

### 2. **Query Embeddings** ❓
כרגע שאילתות לא נשמרות כ-embeddings. זה אומר:
- לא יכולים למצוא שאילתות דומות
- לא יכולים לעשות query clustering/analysis

**פתרון אפשרי:**
- להוסיף שדה `query_embedding` ל-`queries` table
- או לשמור ב-`vector_embeddings` עם `content_type="query"`

### 3. **Document Chunks** ✅
זה כבר יש! `vector_embeddings` עם `content_type="document"`

---

## המלצה: מה להוסיף?

### אפשרות 1: להוסיף embeddings ל-KG Nodes (מומלץ!)
```prisma
model KnowledgeGraphNode {
  // ... existing fields
  embedding   Unsupported("vector(1536)")? // הוסף embedding
  // ...
}
```

**יתרונות:**
- יכולים לחפש בגרף ידע סמנטית
- יכולים למצוא nodes דומים
- שילוב של relational + semantic search

### אפשרות 2: לשמור KG embeddings ב-`vector_embeddings`
```javascript
// כשמוסיפים KG node, גם שומרים embedding
await storeVectorEmbedding({
  content_type: "kg_node",
  content_id: nodeId,
  embedding: nodeEmbedding,
  content_text: nodeDescription
});
```

**יתרונות:**
- לא צריך לשנות schema
- כל ה-embeddings במקום אחד
- חיפוש אחיד

---

## סיכום: מה צריך לעשות?

### ✅ מה כבר יש:
- `vector_embeddings` - embeddings של content chunks/documents

### ❌ מה חסר:
1. **Knowledge Graph Node Embeddings** - כדי לחפש בגרף ידע
2. **Query Embeddings** (אופציונלי) - כדי למצוא שאילתות דומות

### 💡 המלצה:
**להוסיף embeddings ל-KG Nodes** - זה הכי חשוב ל-RAG מלא!

---

## שאלות לשאול:

1. **האם צריך לחפש בגרף ידע סמנטית?**
   - אם כן → להוסיף embeddings ל-KG nodes

2. **האם צריך למצוא שאילתות דומות?**
   - אם כן → להוסיף query embeddings

3. **האם מספיק content chunks בלבד?**
   - אם כן → הכל בסדר כמו שזה!

---

**התשובה הקצרה:** 
כן, זה הגיוני! `vector_embeddings` היא טבלה **גנרית** שמכילה embeddings של כל סוגי התוכן. אבל **חסרים embeddings ל-KG nodes** - זה מה שצריך להוסיף! 🎯

